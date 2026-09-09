/**
 * VehiclePetSpeech: the single non-modal speech bubble and its scheduler
 * (DSH_PET_OVERLAY_ADAPTER_V3 CTR-OVERLAY-017/018/019). Lines come only from
 * the bundled catalog through the pure rules in speech-rules.ts; triggers are
 * structured session edges, engine milestone events, direct interaction, and
 * a bounded idle timer. The input-recency listener records timestamps only —
 * never key values, targets, or any host content. Every timer and listener is
 * returned as a disposer (CTR-OVERLAY-012). The bubble is aria-live=polite,
 * never focusable, replaces (never stacks), and auto-dismisses within the
 * bounded window.
 */

import {
  useCallback, useEffect, useRef, useState,
  type ReactElement,
} from 'react'
import type { VehiclePetSessionView } from './types'
import {
  evaluateCadence, idleBucketFor, selectSpeechLine, SPEECH_AUTO_DISMISS_MS,
  SPEECH_TYPING_SUPPRESSION_MS, SPEECH_WORKING_ROTATION_MS,
  type SpeechCadenceState, type SpeechTriggerSource,
} from './speech-rules'
import { characterSpeechCatalog, type SpeechCategory } from './speech-catalog'
import type { CharacterId } from './types'

export interface VehiclePetSpeechController {
  /** Current visible line, or null. Replacements reuse the same bubble. */
  readonly bubble: { readonly text: string; readonly key: number } | null
  /** Attempt a click line (throttled by CTR-OVERLAY-019(7)). */
  readonly speakForClick: (category: SpeechCategory) => void
  /** Announce a level-up / keepsake moment (proud presentation + line). */
  readonly speakMilestone: () => void
  /** Effective idle bucket for the expression layer. */
  readonly idleBucket: 0 | 1 | 2
  /** True while a level-up / keepsake moment should present proudly. */
  readonly milestoneActive: boolean
}

interface SchedulerOptions {
  readonly characterId?: CharacterId
  readonly sessionView: VehiclePetSessionView
  readonly locale: string | undefined
  readonly enabled: boolean
}

interface SchedulerRefs {
  mountedAt: number
  lastSpokenAt: number | null
  lastAmbientAt: number | null
  lastClickSpokenAt: number | null
  lastInputAt: number | null
  runningPeriodStartedAt: number | null
  workingLinesThisPeriod: number
  lastIndexInCategory: Map<SpeechCategory, number>
  rotationCounter: number
  lastTerminalIdentity: string | null
  lastNeedsInputLive: boolean
  lastLevelId: string | null
}

export function useVehiclePetSpeech(options: SchedulerOptions): VehiclePetSpeechController {
  const { sessionView, locale, enabled } = options
  const presentationRef = useRef({ characterId: options.characterId ?? 'vehicle', locale })
  presentationRef.current = { characterId: options.characterId ?? 'vehicle', locale }
  const startRef = useRef<SchedulerRefs | null>(null)
  if (startRef.current === null) {
    startRef.current = {
      mountedAt: Date.now(),
      lastSpokenAt: null,
      lastAmbientAt: null,
      lastClickSpokenAt: null,
      lastInputAt: null,
      runningPeriodStartedAt: null,
      workingLinesThisPeriod: 0,
      lastIndexInCategory: new Map(),
      rotationCounter: 0,
      lastTerminalIdentity: null,
      lastNeedsInputLive: false,
      lastLevelId: null,
    }
  }
  const refs = startRef.current
  const sessionViewRef = useRef(sessionView)
  sessionViewRef.current = sessionView
  const [bubble, setBubble] = useState<{ text: string; key: number } | null>(null)
  const [idleBucket, setIdleBucket] = useState<0 | 1 | 2>(0)
  const [milestoneActive, setMilestoneActive] = useState(false)
  const dismissTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | undefined>(undefined)
  const milestoneTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | undefined>(undefined)
  const bubbleKeyRef = useRef(0)

  const cadenceState = useCallback((): SpeechCadenceState => {
    const view = sessionViewRef.current
    return {
      mountedAt: refs.mountedAt,
      lastSpokenAt: refs.lastSpokenAt,
      lastInputAt: refs.lastInputAt,
      lastAmbientAt: refs.lastAmbientAt,
      lastClickSpokenAt: refs.lastClickSpokenAt,
      runningPeriodStartedAt: refs.runningPeriodStartedAt,
      workingLinesThisPeriod: refs.workingLinesThisPeriod,
      sessionState: view.terminal !== null
        ? 'terminal'
        : view.live === 'running' ? 'working' : view.live === 'needs-input' ? 'needs-input' : 'idle',
      now: Date.now(),
    }
  }, [refs])

  const showLine = useCallback((category: SpeechCategory): void => {
    const selection = selectSpeechLine(category, presentationRef.current.locale, {
      lastIndexInCategory: refs.lastIndexInCategory.get(category) ?? null,
      rotationCounter: refs.rotationCounter,
    }, characterSpeechCatalog(presentationRef.current.characterId, presentationRef.current.locale))
    if (selection.index < 0) return
    refs.lastIndexInCategory.set(category, selection.index)
    refs.rotationCounter = selection.nextRotationCounter
    refs.lastSpokenAt = Date.now()
    if (category === 'idle') refs.lastAmbientAt = Date.now()
    bubbleKeyRef.current += 1
    setBubble({ text: selection.text, key: bubbleKeyRef.current })
    globalThis.clearTimeout(dismissTimerRef.current)
    dismissTimerRef.current = globalThis.setTimeout(() => {
      setBubble(null)
      dismissTimerRef.current = undefined
    }, SPEECH_AUTO_DISMISS_MS)
  }, [refs])

  const trySpeak = useCallback((source: SpeechTriggerSource): boolean => {
    if (!enabled) return false
    const verdict = evaluateCadence(source, cadenceState())
    if (!verdict.allowed) return false
    const category: SpeechCategory = source.kind === 'ambient'
      ? 'idle'
      : source.category
    showLine(category)
    if (source.kind === 'click') refs.lastClickSpokenAt = Date.now()
    if (source.kind === 'ambient') refs.lastAmbientAt = Date.now()
    if (source.kind === 'session-edge' && source.category === 'working') {
      refs.workingLinesThisPeriod += 1
    }
    return true
  }, [cadenceState, enabled, refs, showLine])

  const speakForClick = useCallback((category: SpeechCategory): void => {
    trySpeak({ kind: 'click', category })
  }, [trySpeak])

  // Payload-ignored input recency: only the timestamp is recorded. Never the
  // key value, target, or any host content (CTR-OVERLAY-008/019(3)).
  useEffect(() => {
    if (!enabled) return
    const record = (): void => {
      refs.lastInputAt = Date.now()
    }
    document.addEventListener('keydown', record, { capture: true })
    document.addEventListener('pointerdown', record, { capture: true })
    return () => {
      document.removeEventListener('keydown', record, { capture: true })
      document.removeEventListener('pointerdown', record, { capture: true })
    }
  }, [enabled, refs])

  // Session edges: needs-input and terminal lines. Terminal identities are
  // edge-deduplicated by the adapter; the identity check here keeps the line
  // side equally idempotent across reload/resubscribe.
  useEffect(() => {
    if (!enabled) return
    const terminal = sessionView.terminal
    if (terminal !== null && terminal.identity !== refs.lastTerminalIdentity) {
      refs.lastTerminalIdentity = terminal.identity
      const category: SpeechCategory = terminal.status === 'completed' ? 'completed' : 'failed'
      trySpeak({ kind: 'session-edge', category })
      return
    }
    if (terminal === null && refs.lastTerminalIdentity !== null) {
      refs.lastTerminalIdentity = null
    }
    const needsInput = sessionView.live === 'needs-input'
    if (needsInput && !refs.lastNeedsInputLive) {
      trySpeak({ kind: 'session-edge', category: 'needs-input' })
    }
    refs.lastNeedsInputLive = needsInput
    if (sessionView.live === 'running') {
      if (refs.runningPeriodStartedAt === null) {
        refs.runningPeriodStartedAt = Date.now()
        refs.workingLinesThisPeriod = 0
        trySpeak({ kind: 'session-edge', category: 'working' })
      }
    } else {
      refs.runningPeriodStartedAt = null
      refs.workingLinesThisPeriod = 0
    }
  }, [enabled, refs, sessionView, trySpeak])

  // Working rotation + ambient tick + idle bucket, on one bounded interval.
  // CTR-OVERLAY-019(3): ambient lines are attempted only in the idle state.
  // CTR-OVERLAY-019(4): working rotation additionally respects the typing
  // suppression window (enforced inside evaluateCadence; the rotation attempt
  // is skipped entirely when typing to keep the interval side-effect free).
  useEffect(() => {
    if (!enabled) return
    const handle = globalThis.setInterval(() => {
      const now = Date.now()
      setIdleBucket(idleBucketFor(refs.lastInputAt, now))
      const rotationDue = refs.runningPeriodStartedAt !== null
        && refs.lastSpokenAt !== null
        && now - refs.lastSpokenAt >= SPEECH_WORKING_ROTATION_MS
      if (rotationDue) {
        const typing = refs.lastInputAt !== null
          && now - refs.lastInputAt < SPEECH_TYPING_SUPPRESSION_MS
        if (!typing) trySpeak({ kind: 'session-edge', category: 'working' })
        return
      }
      const view = sessionViewRef.current
      if (view.terminal === null && view.live === 'idle') {
        trySpeak({ kind: 'ambient' })
      }
    }, 30000)
    return () => {
      globalThis.clearInterval(handle)
    }
  }, [enabled, refs, trySpeak])

  // Milestone presentation window is owned by the overlay (engine snapshot);
  // the scheduler only receives the resulting flag through speakMilestone.
  useEffect(() => () => {
    globalThis.clearTimeout(dismissTimerRef.current)
    globalThis.clearTimeout(milestoneTimerRef.current)
  }, [])

  const speakMilestone = useCallback((): void => {
    setMilestoneActive(true)
    trySpeak({ kind: 'milestone', category: 'milestone' })
    globalThis.clearTimeout(milestoneTimerRef.current)
    milestoneTimerRef.current = globalThis.setTimeout(() => setMilestoneActive(false), 6000)
  }, [trySpeak])

  return { bubble, speakForClick, speakMilestone, idleBucket, milestoneActive }
}

export interface VehiclePetBubbleProps {
  readonly bubble: { readonly text: string; readonly key: number } | null
  readonly placement: 'above' | 'below'
}

/** The polite, non-modal, non-focusable bubble surface (CTR-OVERLAY-017). */
export function VehiclePetBubble(props: VehiclePetBubbleProps): ReactElement | null {
  if (props.bubble === null) return null
  return (
    <div
      key={props.bubble.key}
      className="vpo-bubble"
      role="status"
      aria-live="polite"
      data-vehicle-pet-bubble="true"
      data-placement={props.placement}
    >
      {props.bubble.text}
    </div>
  )
}
