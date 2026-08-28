/**
 * Session-state-adapter unit fixtures (CTR-OVERLAY-007, ACC-OVERLAY-007):
 * the complete live/terminal matrix, edge deduplication across reload-like
 * reseeding, session switching without leakage, precedence, and disposal —
 * all driven through typed structural fixtures, never DOM scraping.
 */

import { describe, expect, it, vi } from 'vitest'
import {
  VehiclePetSessionAdapter,
  type ConversationLike,
  type SessionListLike,
  type VehiclePetSessionsSource,
} from '../../../src/dsh/client/session-state-adapter'
import type { VehiclePetSessionView } from '../../../src/dsh/client/types'

interface TurnFixture {
  status: string
  endSeq?: number
  reasonKind?: string
}

function conversation(options: {
  running?: boolean
  pending?: { kind: string }[]
  turns?: TurnFixture[]
  openState?: string
  lastAgentError?: string | null
}): ConversationLike {
  const turns = new Map<number, { status: string; end?: { seq: number; data: { turn: number; reason: { kind: string } } } }>()
  ;(options.turns ?? []).forEach((fixture, index) => {
    const turn = index + 1
    turns.set(turn, {
      status: fixture.status,
      end: fixture.endSeq === undefined
        ? undefined
        : { seq: fixture.endSeq, data: { turn, reason: { kind: fixture.reasonKind ?? 'completed' } } },
    })
  })
  return {
    running: options.running ?? false,
    pending: options.pending ?? [],
    openState: options.openState,
    lastAgentError: options.lastAgentError,
    chat: { timeline: { turns } },
  }
}

function listState(options: { current?: string; pendingInteraction?: string }): SessionListLike {
  return {
    phase: 'ready',
    current: options.current,
    byId: options.current === undefined
      ? {}
      : { [options.current]: { pendingInteraction: options.pendingInteraction } },
  }
}

interface Harness {
  source: VehiclePetSessionsSource
  setList(state: SessionListLike): void
  setConversation(id: string, snapshot: ConversationLike): void
  views: VehiclePetSessionView[]
}

function createHarness(initialList: SessionListLike, initialConversation?: ConversationLike): Harness {
  let list = initialList
  const conversations = new Map<string, ConversationLike>()
  if (initialList.current !== undefined && initialConversation !== undefined) {
    conversations.set(initialList.current, initialConversation)
  }
  const listListeners = new Set<() => void>()
  const conversationListeners = new Map<string, Set<() => void>>()
  const views: VehiclePetSessionView[] = []
  const source: VehiclePetSessionsSource = {
    list: {
      getSnapshot: () => list,
      subscribe: listener => {
        listListeners.add(listener)
        return () => {
          listListeners.delete(listener)
        }
      },
    },
    binding: (id: string) => ({
      session: {
        getSnapshot: () => conversations.get(id) ?? conversation({}),
        subscribe: listener => {
          let listeners = conversationListeners.get(id)
          if (listeners === undefined) {
            listeners = new Set()
            conversationListeners.set(id, listeners)
          }
          listeners.add(listener)
          return () => {
            listeners.delete(listener)
          }
        },
      },
    }),
  }
  return {
    source,
    views,
    setList(next) {
      list = next
      for (const listener of listListeners) listener()
    },
    setConversation(id, snapshot) {
      conversations.set(id, snapshot)
      for (const listener of conversationListeners.get(id) ?? []) listener()
    },
  }
}

interface TimerWorld {
  now: number
  callbacks: Map<number, () => void>
  setTimer: (callback: () => void, delay: number) => { kind: 'timer'; id: number }
  clearTimer: (handle: unknown) => void
  advance(ms: number): void
}

function timerWorld(): TimerWorld {
  let sequence = 0
  const world: TimerWorld = {
    now: 1_000_000,
    callbacks: new Map(),
    setTimer(callback, delay) {
      sequence += 1
      const id = sequence
      world.callbacks.set(id + 0, callback)
      // Store expiry so advance() can fire in order; simplify with a heap-free list.
      expiries.push({ at: world.now + delay, id, callback })
      return { kind: 'timer', id }
    },
    clearTimer(handle: unknown) {
      const id = (handle as { id: number }).id
      const entry = expiries.find(candidate => candidate.id === id)
      if (entry !== undefined) expiries.splice(expiries.indexOf(entry), 1)
    },
    advance(ms) {
      const target = world.now + ms
      for (;;) {
        const next = expiries.filter(candidate => candidate.at <= target).sort((a, b) => a.at - b.at)[0]
        if (next === undefined) break
        expiries.splice(expiries.indexOf(next), 1)
        world.now = next.at
        next.callback()
      }
      world.now = target
    },
  }
  const expiries: { at: number; id: number; callback: () => void }[] = []
  return world
}

function track(adapter: VehiclePetSessionAdapter, harness: Harness): () => void {
  return adapter.subscribe(() => {
    harness.views.push(adapter.getSnapshot())
  })
}

describe('VehiclePetSessionAdapter', () => {
  it('is idle with no current session', () => {
    const harness = createHarness(listState({}))
    const adapter = new VehiclePetSessionAdapter(harness.source)
    expect(adapter.getSnapshot()).toEqual({ live: 'idle', terminal: null })
    adapter.dispose()
  })

  it('maps running to the working live state', () => {
    const harness = createHarness(listState({ current: 's1' }), conversation({ running: true }))
    const adapter = new VehiclePetSessionAdapter(harness.source)
    expect(adapter.getSnapshot().live).toBe('running')
    adapter.dispose()
  })

  it('maps structured pending interactions to needs-input, ahead of running', () => {
    const harness = createHarness(listState({ current: 's1' }), conversation({ running: true, pending: [{ kind: 'approval' }] }))
    const adapter = new VehiclePetSessionAdapter(harness.source)
    expect(adapter.getSnapshot().live).toBe('needs-input')
    adapter.dispose()

    // A bound conversation owns the pending state: a stale list summary must
    // not stick the pet in needs-input after the answer was accepted.
    const staleSummary = createHarness(listState({ current: 's1', pendingInteraction: 'question' }), conversation({ running: true }))
    const adapterStale = new VehiclePetSessionAdapter(staleSummary.source)
    expect(adapterStale.getSnapshot().live).toBe('running')
    adapterStale.dispose()

    // Without a bound conversation, the structured list summary still drives it.
    const unbound = {
      source: {
        list: {
          getSnapshot: () => listState({ current: 's2', pendingInteraction: 'question' }),
          subscribe: () => () => {},
        },
        binding: () => undefined,
      },
    }
    const adapter2 = new VehiclePetSessionAdapter(unbound.source as never)
    expect(adapter2.getSnapshot().live).toBe('needs-input')
    adapter2.dispose()
  })

  it('emits one terminal reaction per fresh completed turn with a deterministic identity', () => {
    const harness = createHarness(listState({ current: 's1' }), conversation({ running: true }))
    const world = timerWorld()
    const adapter = new VehiclePetSessionAdapter(harness.source, {
      setTimer: world.setTimer,
      clearTimer: world.clearTimer,
    })
    track(adapter, harness)
    harness.setConversation('s1', conversation({ running: false, turns: [{ status: 'closed', endSeq: 7, reasonKind: 'completed' }] }))
    expect(adapter.getSnapshot().terminal).toEqual({ identity: 's1#1#7', status: 'completed' })
    expect(adapter.getSnapshot().live).toBe('idle')
    adapter.dispose()
  })

  it('maps failed and aborted turn ends to failed and cancelled reactions', () => {
    const harness = createHarness(listState({ current: 's1' }), conversation({}))
    const world = timerWorld()
    const adapter = new VehiclePetSessionAdapter(harness.source, {
      setTimer: world.setTimer,
      clearTimer: world.clearTimer,
    })
    harness.setConversation('s1', conversation({ turns: [{ status: 'closed', endSeq: 3, reasonKind: 'error' }] }))
    expect(adapter.getSnapshot().terminal?.status).toBe('failed')
    world.advance(3000)
    harness.setConversation('s1', conversation({ turns: [
      { status: 'closed', endSeq: 3, reasonKind: 'error' },
      { status: 'closed', endSeq: 9, reasonKind: 'aborted' },
    ] }))
    expect(adapter.getSnapshot().terminal).toEqual({ identity: 's1#2#9', status: 'cancelled' })
    adapter.dispose()
  })

  it('ignores blocked turn ends as terminal reactions', () => {
    const harness = createHarness(listState({ current: 's1' }), conversation({}))
    const adapter = new VehiclePetSessionAdapter(harness.source)
    harness.setConversation('s1', conversation({ turns: [{ status: 'closed', endSeq: 4, reasonKind: 'blocked' }] }))
    expect(adapter.getSnapshot()).toEqual({ live: 'idle', terminal: null })
    adapter.dispose()
  })

  it('does not replay a terminal on duplicate delivery, resubscribe, or list refresh', () => {
    const closed = conversation({ turns: [{ status: 'closed', endSeq: 5, reasonKind: 'completed' }] })
    const harness = createHarness(listState({ current: 's1' }), conversation({ running: true }))
    const world = timerWorld()
    const adapter = new VehiclePetSessionAdapter(harness.source, {
      setTimer: world.setTimer,
      clearTimer: world.clearTimer,
    })
    track(adapter, harness)
    harness.setConversation('s1', closed)
    const emissions = [...harness.views]
    expect(emissions.filter(view => view.terminal !== null)).toHaveLength(1)

    // Duplicate structured delivery of the same turn/end.
    harness.setConversation('s1', closed)
    expect(harness.views.filter(view => view.terminal !== null)).toHaveLength(1)

    // List refresh (same session re-published).
    harness.setList(listState({ current: 's1' }))
    expect(harness.views.filter(view => view.terminal !== null)).toHaveLength(1)
    adapter.dispose()

    // A fresh adapter (reload/HMR/reconnect) seeds silently and never replays.
    const harness2 = { ...harness, views: [] as VehiclePetSessionView[] }
    const adapter2 = new VehiclePetSessionAdapter(harness2.source)
    track(adapter2, harness2)
    expect(adapter2.getSnapshot()).toEqual({ live: 'idle', terminal: null })
    adapter2.dispose()
  })

  it('expires the terminal reaction after its short duration', () => {
    const harness = createHarness(listState({ current: 's1' }), conversation({}))
    const world = timerWorld()
    const adapter = new VehiclePetSessionAdapter(harness.source, {
      terminalDurationMs: 2400,
      setTimer: world.setTimer,
      clearTimer: world.clearTimer,
    })
    harness.setConversation('s1', conversation({ turns: [{ status: 'closed', endSeq: 2, reasonKind: 'completed' }] }))
    expect(adapter.getSnapshot().terminal).not.toBeNull()
    world.advance(2401)
    expect(adapter.getSnapshot()).toEqual({ live: 'idle', terminal: null })
    adapter.dispose()
  })

  it('clears the old session reaction on a session switch and does not leak it back', () => {
    const harness = createHarness(listState({ current: 's1' }), conversation({}))
    const world = timerWorld()
    const adapter = new VehiclePetSessionAdapter(harness.source, {
      setTimer: world.setTimer,
      clearTimer: world.clearTimer,
    })
    harness.setConversation('s1', conversation({ turns: [{ status: 'closed', endSeq: 11, reasonKind: 'completed' }] }))
    expect(adapter.getSnapshot().terminal?.identity).toBe('s1#1#11')

    harness.setConversation('s2', conversation({}))
    harness.setList(listState({ current: 's2' }))
    expect(adapter.getSnapshot()).toEqual({ live: 'idle', terminal: null })

    // Switching back must not replay s1's terminal.
    harness.setList(listState({ current: 's1' }))
    expect(adapter.getSnapshot()).toEqual({ live: 'idle', terminal: null })
    adapter.dispose()
  })

  it.each(['cold', 'loading'])('does not replay historical terminals when the timeline loads after %s', openState => {
    const harness = createHarness(listState({ current: 's1' }), conversation({ openState }))
    const adapter = new VehiclePetSessionAdapter(harness.source)
    track(adapter, harness)
    harness.setConversation('s1', conversation({ turns: [{ status: 'closed', endSeq: 8, reasonKind: 'completed' }] }))
    expect(adapter.getSnapshot()).toEqual({ live: 'idle', terminal: null })
    expect(harness.views.length).toBe(0)
    adapter.dispose()
  })

  it('defers a terminal edge until a lagging pending interaction clears', () => {
    const harness = createHarness(listState({ current: 's1' }), conversation({
      turns: [{ status: 'closed', endSeq: 3, reasonKind: 'completed' }],
    }))
    const adapter = new VehiclePetSessionAdapter(harness.source)
    harness.setConversation('s1', conversation({
      pending: [{ kind: 'question' }],
      turns: [
        { status: 'closed', endSeq: 3, reasonKind: 'completed' },
        { status: 'open' },
      ],
    }))
    harness.setConversation('s1', conversation({
      pending: [{ kind: 'question' }],
      turns: [
        { status: 'closed', endSeq: 3, reasonKind: 'completed' },
        { status: 'closed', endSeq: 8, reasonKind: 'error' },
      ],
    }))
    expect(adapter.getSnapshot().live).toBe('needs-input')
    harness.setConversation('s1', conversation({
      turns: [
        { status: 'closed', endSeq: 3, reasonKind: 'completed' },
        { status: 'closed', endSeq: 8, reasonKind: 'error' },
      ],
    }))
    expect(adapter.getSnapshot().terminal?.status).toBe('failed')
    adapter.dispose()
  })

  it('maps a fresh structured lastAgentError edge once and seeds it silently on reload', () => {
    const harness = createHarness(listState({ current: 's1' }), conversation({ turns: [{ status: 'open' }] }))
    const adapter = new VehiclePetSessionAdapter(harness.source)
    harness.setConversation('s1', conversation({
      running: true,
      turns: [{ status: 'open' }],
      lastAgentError: 'mock authentication failed',
    }))
    expect(adapter.getSnapshot().live).toBe('running')
    harness.setConversation('s1', conversation({
      turns: [{ status: 'closed', endSeq: 9, reasonKind: 'completed' }],
      lastAgentError: 'mock authentication failed',
    }))
    expect(adapter.getSnapshot().terminal?.status).toBe('failed')
    adapter.dispose()

    const adapterAfterReload = new VehiclePetSessionAdapter(harness.source)
    expect(adapterAfterReload.getSnapshot()).toEqual({ live: 'idle', terminal: null })
    adapterAfterReload.dispose()
  })

  it('does not replay old terminals after more than 256 historical turns', () => {
    const history = Array.from({ length: 300 }, (_, index) => ({
      status: 'closed', endSeq: index + 1, reasonKind: 'completed',
    }))
    const harness = createHarness(listState({ current: 's1' }), conversation({ turns: history }))
    const adapter = new VehiclePetSessionAdapter(harness.source)
    track(adapter, harness)
    harness.setList(listState({ current: 's1' }))
    expect(adapter.getSnapshot()).toEqual({ live: 'idle', terminal: null })
    expect(harness.views).toEqual([])
    adapter.dispose()
  })

  it('dispatches nothing after dispose and unsubscribes from the session list', () => {
    const harness = createHarness(listState({ current: 's1' }), conversation({ running: true }))
    const listUnsubscribe = vi.fn()
    const originalSource = harness.source
    const wrapped: VehiclePetSessionsSource = {
      list: {
        getSnapshot: originalSource.list.getSnapshot,
        subscribe: listener => {
          const dispose = originalSource.list.subscribe(listener)
          return () => {
            listUnsubscribe()
            dispose()
          }
        },
      },
      binding: originalSource.binding,
    }
    const adapter = new VehiclePetSessionAdapter(wrapped)
    const frozen = adapter.getSnapshot()
    adapter.dispose()
    harness.setConversation('s1', conversation({ turns: [{ status: 'closed', endSeq: 1, reasonKind: 'completed' }] }))
    harness.setList(listState({ current: 's2' }))
    // Frozen: no further publication happens after disposal.
    expect(adapter.getSnapshot()).toBe(frozen)
    expect(listUnsubscribe).toHaveBeenCalled()
  })
})
