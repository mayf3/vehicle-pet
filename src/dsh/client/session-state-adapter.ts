/**
 * Structured Harness session → visual-only pet session view (CTR-OVERLAY-007,
 * CTR-OVERLAY-013). Consumes only typed/structured DSH session snapshots —
 * never DOM text, classes, or observers. Live states (running, needs-input)
 * persist while true; terminal turns (completed, failed, cancelled) produce
 * one short, edge-deduplicated reaction. Nothing here can touch progression.
 *
 * Terminal identity is deterministic (`sessionId#turn#turnEndSeq`), so reload,
 * resubscribe, list refresh, HMR, reconnect, and current-session switches
 * cannot replay an already-seen terminal as a new reaction: the first
 * snapshot observed for a binding seeds the seen-set silently, and only
 * identities appearing later emit.
 */

import type { VehiclePetSessionView, VehiclePetTerminalReaction } from './types'

/** Minimal structural mirror of the pinned DSH `HostObservable`. */
export interface OverlayObservable<T> {
  getSnapshot(): T
  subscribe(fn: () => void): () => void
}

/** The `turn/end` payload fields this adapter reads. */
interface TurnEndDataLike {
  readonly turn: number
  readonly reason: { readonly kind: string }
}

/** The `TurnLocation` fields this adapter reads. */
interface TurnLocationLike {
  readonly status: string
  readonly end?: { readonly seq: number; readonly data: TurnEndDataLike } | null
}

/** The `ConversationSnapshot` fields this adapter reads. */
export interface ConversationLike {
  readonly running: boolean
  readonly pending: readonly { readonly kind?: string }[]
  /** 'cold' | 'loading' while the durable log has not been replayed yet. */
  readonly openState?: string
  readonly lastAgentError?: string | null
  readonly chat?: { readonly timeline?: { readonly turns?: ReadonlyMap<number, TurnLocationLike> } }
}

/** The `SessionSummary` fields this adapter reads. */
export interface SessionSummaryLike {
  readonly pendingInteraction?: string
  /**
   * Host-computed projection values (counts-only numeric fields; the
   * DSH_USAGE_PROGRESS_SOURCE_V1 seam). This adapter never reads them —
   * they are carried structurally for the usage progress source's list feed.
   */
  readonly projectionValues?: Readonly<Record<string, unknown>>
}

/** The `SessionListState` fields this adapter reads. */
export interface SessionListLike {
  readonly phase: string
  readonly current: string | undefined
  readonly byId: Record<string, SessionSummaryLike | undefined>
}

/** One selected-session binding (`sessions.binding(id)`). */
export interface SessionBindingLike {
  readonly session: OverlayObservable<ConversationLike>
}

/** The pinned `ctx.sessions` surface this adapter consumes. */
export interface VehiclePetSessionsSource {
  readonly list: OverlayObservable<SessionListLike>
  binding(id: string): SessionBindingLike | undefined
}

export interface VehiclePetBindingInfo {
  readonly currentId: string | undefined
  readonly generation: number
  readonly ready: boolean
}

export interface VehiclePetSessionAdapterOptions {
  /** How long a terminal reaction stays presented. */
  readonly terminalDurationMs?: number
  readonly setTimer?: (callback: () => void, delay: number) => unknown
  readonly clearTimer?: (handle: unknown) => void
  /** E2E-only lifecycle ledger; absent in production. */
  readonly trackResource?: (category: string) => () => void
}

type TimerHandle = unknown

const IDLE_VIEW: VehiclePetSessionView = Object.freeze({ live: 'idle', terminal: null })

function viewsEqual(a: VehiclePetSessionView, b: VehiclePetSessionView): boolean {
  return a.live === b.live
    && a.terminal?.identity === b.terminal?.identity
    && a.terminal?.status === b.terminal?.status
}

/** Map a structured `turn/end` reason kind to the pet terminal reaction status. */
export function terminalStatusOf(reasonKind: string): VehiclePetTerminalReaction['status'] | null {
  if (reasonKind === 'completed') return 'completed'
  if (reasonKind === 'error') return 'failed'
  if (reasonKind === 'aborted') return 'cancelled'
  return null
}

export class VehiclePetSessionAdapter implements OverlayObservable<VehiclePetSessionView> {
  readonly #sessions: VehiclePetSessionsSource
  readonly #terminalDurationMs: number
  readonly #setTimer: (callback: () => void, delay: number) => TimerHandle
  readonly #clearTimer: (handle: TimerHandle) => void
  readonly #trackResource: ((category: string) => () => void) | undefined
  readonly #listeners = new Set<() => void>()
  readonly #listenerResourceDisposers = new Map<() => void, () => void>()

  #view: VehiclePetSessionView = IDLE_VIEW
  #listUnsubscribe: (() => void) | undefined
  #sessionUnsubscribe: (() => void) | undefined
  #sessionSource: OverlayObservable<ConversationLike> | undefined
  #currentId: string | undefined
  #bindingGeneration = 0
  /** True until the first recompute for the current binding has seeded its terminals. */
  #seeded = false
  /** Highest reacted/seeded turn per session; monotonic and bounded by session count. */
  #terminalTurnBySession = new Map<string, number>()
  #terminalTimer: TimerHandle | undefined
  #disposed = false

  constructor(sessions: VehiclePetSessionsSource, options: VehiclePetSessionAdapterOptions = {}) {
    this.#sessions = sessions
    this.#terminalDurationMs = options.terminalDurationMs ?? 2400
    this.#setTimer = options.setTimer ?? ((callback, delay) => setTimeout(callback, delay))
    this.#clearTimer = options.clearTimer
      ?? (handle => { clearTimeout(handle as Parameters<typeof clearTimeout>[0]) })
    this.#trackResource = options.trackResource
    const unsubscribeList = sessions.list.subscribe(() => {
      this.#handleListChange()
    })
    const untrackList = this.#trackResource?.('session-list-subscription')
    this.#listUnsubscribe = () => {
      unsubscribeList()
      untrackList?.()
    }
    this.#handleListChange()
  }

  getSnapshot = (): VehiclePetSessionView => this.#view

  /** Testable structured handshake used by the runtime E2E; no DOM inference. */
  getBindingInfo = (): VehiclePetBindingInfo => ({
    currentId: this.#currentId,
    generation: this.#bindingGeneration,
    ready: this.#sessionSource !== undefined,
  })

  subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener)
    const untrack = this.#trackResource?.('terminal-event-subscription')
    if (untrack !== undefined) this.#listenerResourceDisposers.set(listener, untrack)
    return () => {
      this.#listeners.delete(listener)
      this.#listenerResourceDisposers.get(listener)?.()
      this.#listenerResourceDisposers.delete(listener)
    }
  }

  dispose(): void {
    if (this.#disposed) return
    this.#disposed = true
    this.#listUnsubscribe?.()
    this.#listUnsubscribe = undefined
    this.#unbindSession()
    for (const dispose of this.#listenerResourceDisposers.values()) dispose()
    this.#listenerResourceDisposers.clear()
    this.#listeners.clear()
  }

  #handleListChange(): void {
    if (this.#disposed) return
    const current = this.#sessions.list.getSnapshot().current
    if (current !== this.#currentId || this.#sessionSource === undefined) {
      this.#bindCurrent(current)
      return
    }
    this.#recompute()
  }

  #bindCurrent(current: string | undefined): void {
    this.#unbindSession()
    this.#currentId = current
    this.#bindingGeneration += 1
    this.#seeded = false
    if (current !== undefined) {
      this.#sessionSource = this.#sessions.binding(current)?.session
      const unsubscribeSession = this.#sessionSource?.subscribe(() => {
        this.#recompute()
      })
      if (unsubscribeSession !== undefined) {
        const untrackSession = this.#trackResource?.('current-session-subscription')
        this.#sessionUnsubscribe = () => {
          unsubscribeSession()
          untrackSession?.()
        }
      }
    }
    this.#recompute()
  }

  #unbindSession(): void {
    this.#sessionUnsubscribe?.()
    this.#sessionUnsubscribe = undefined
    this.#sessionSource = undefined
    this.#clearTerminalTimer()
  }

  #recompute(): void {
    if (this.#disposed) return
    const conversation = this.#sessionSource?.getSnapshot()

    // While the durable log replays (cold/loading), the timeline is not yet
    // populated. Terminal seeding must not complete on an empty timeline or
    // historical turn ends would replay as fresh reactions once it loads.
    if (conversation !== undefined && (conversation.openState === 'cold' || conversation.openState === 'loading')) {
      this.#publish(IDLE_VIEW)
      return
    }

    const summary = this.#currentId === undefined
      ? undefined
      : this.#sessions.list.getSnapshot().byId[this.#currentId]
    const pendingKind = conversation === undefined
      ? summary?.pendingInteraction
      : conversation.pending[0]?.kind
    const running = conversation?.running === true

    if (conversation === undefined && pendingKind !== undefined) {
      this.#clearTerminalTimer()
      this.#publish({ live: 'needs-input', terminal: null })
      return
    }

    // Seed closed history once while a live/pending turn is active, but never
    // consume later terminal edges until the live precedence has cleared.
    if (conversation !== undefined && this.#currentId !== undefined
      && (pendingKind !== undefined || running)) {
      if (!this.#seeded) {
        this.#scanNewAgentError(this.#currentId, conversation, false)
        this.#scanNewTerminals(this.#currentId, conversation, false)
        this.#seeded = true
      }
      this.#clearTerminalTimer()
      this.#publish({ live: pendingKind !== undefined ? 'needs-input' : 'running', terminal: null })
      return
    }

    let nextTerminal: VehiclePetTerminalReaction | null = null

    if (conversation !== undefined && this.#currentId !== undefined) {
      // Provider failure facts win when DSH also closes that turn with a
      // generic completed end; consume the error edge before terminal seeding.
      const freshError = this.#scanNewAgentError(this.#currentId, conversation, this.#seeded)
      const freshTerminals = this.#scanNewTerminals(this.#currentId, conversation, this.#seeded)
      this.#seeded = true
      if (freshTerminals.length > 0 || freshError !== null) {
        this.#restartTerminalTimer()
        nextTerminal = freshTerminals.at(-1) ?? freshError
      } else if (this.#terminalTimer !== undefined) {
        // Keep presenting the active reaction until its timer expires.
        nextTerminal = this.#view.terminal
      }
    } else {
      this.#clearTerminalTimer()
    }

    let next: VehiclePetSessionView = IDLE_VIEW
    if (nextTerminal !== null) next = { live: 'idle', terminal: nextTerminal }
    this.#publish(next)
  }

  /**
   * Collect terminal reactions not yet seen for this session. The first pass
   * for a binding (`seed === false`) only records identities without emitting.
   */
  #scanNewTerminals(
    sessionId: string,
    conversation: ConversationLike,
    seed: boolean,
  ): VehiclePetTerminalReaction[] {
    const turns = conversation.chat?.timeline?.turns
    if (turns === undefined) return []
    const previousTurn = this.#terminalTurnBySession.get(sessionId) ?? -1
    let highestTurn = previousTurn
    const fresh: Array<VehiclePetTerminalReaction & { turn: number }> = []
    for (const turn of turns.values()) {
      const end = turn.end
      if (turn.status !== 'closed' || end === undefined || end === null) continue
      const status = terminalStatusOf(end.data.reason.kind)
      if (status === null) continue
      highestTurn = Math.max(highestTurn, end.data.turn)
      if (!seed || end.data.turn <= previousTurn) continue
      fresh.push({
        identity: `${sessionId}#${end.data.turn}#${end.seq}`,
        status,
        turn: end.data.turn,
      })
    }
    this.#terminalTurnBySession.set(sessionId, highestTurn)
    fresh.sort((a, b) => a.turn - b.turn)
    return fresh.map(({ identity, status }) => ({ identity, status }))
  }

  /** Pinned DSH exposes provider failures as a structured `lastAgentError`. */
  #scanNewAgentError(
    sessionId: string,
    conversation: ConversationLike,
    seed: boolean,
  ): VehiclePetTerminalReaction | null {
    const message = conversation.lastAgentError
    if (conversation.running || conversation.pending.length > 0) return null
    if (message === undefined || message === null || message === '') return null
    const turns = conversation.chat?.timeline?.turns
    if (turns === undefined || turns.size === 0) return null
    const turn = Math.max(...turns.keys())
    const previousTurn = this.#terminalTurnBySession.get(sessionId) ?? -1
    this.#terminalTurnBySession.set(sessionId, Math.max(previousTurn, turn))
    if (!seed || turn <= previousTurn) return null
    let digest = 0x811c9dc5
    for (let index = 0; index < message.length; index += 1) {
      digest = Math.imul(digest ^ message.charCodeAt(index), 0x01000193) >>> 0
    }
    return { identity: `${sessionId}#${turn}#error-${digest.toString(36)}`, status: 'failed' }
  }

  #restartTerminalTimer(): void {
    this.#clearTerminalTimer()
    this.#terminalTimer = this.#setTimer(() => {
      this.#terminalTimer = undefined
      this.#recompute()
    }, this.#terminalDurationMs)
  }

  #clearTerminalTimer(): void {
    if (this.#terminalTimer === undefined) return
    this.#clearTimer(this.#terminalTimer)
    this.#terminalTimer = undefined
  }

  #publish(next: VehiclePetSessionView): void {
    if (viewsEqual(this.#view, next)) return
    this.#view = next
    for (const listener of this.#listeners) listener()
  }
}
