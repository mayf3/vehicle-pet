/**
 * Pure speech cadence and selection rules (DSH_PET_OVERLAY_ADAPTER_V3
 * CTR-OVERLAY-018/019). Every function here is deterministic over structured
 * inputs and unit-testable; the React scheduler only applies their verdicts
 * and owns the timers. No model call, no content reading — line selection
 * never sees anything but a category, a rotation counter, and recent-history
 * indices.
 */

import { speechCatalog, type SpeechCategory } from './speech-catalog'

/** Bubble auto-dismiss: target 4 s, hard bounds 3–6 s (CTR-OVERLAY-017). */
export const SPEECH_AUTO_DISMISS_MS = 4000
export const SPEECH_AUTO_DISMISS_MIN_MS = 3000
export const SPEECH_AUTO_DISMISS_MAX_MS = 6000

/** Load quiet period: no speech within 30 s of surface mount (CTR-019(1)). */
export const SPEECH_LOAD_QUIET_MS = 30000
/** Ambient idle lines: at most one per 600 s (CTR-019(3)). */
export const SPEECH_AMBIENT_MIN_INTERVAL_MS = 600000
/** Payload-ignored input recency window suppressing ambient lines (CTR-019(3)). */
export const SPEECH_TYPING_SUPPRESSION_MS = 15000
/** Working rotation: min gap and per-running-period cap (CTR-019(4)). */
export const SPEECH_WORKING_ROTATION_MS = 120000
export const SPEECH_WORKING_MAX_PER_PERIOD = 3
/** Click lines: at most one per 30 s (CTR-019(7)). */
export const SPEECH_CLICK_THROTTLE_MS = 30000
/** Activity recency buckets for the idle expression (bounded, payload-ignored). */
export const IDLE_BUCKET_MID_MS = 120000
export const IDLE_BUCKET_LONG_MS = 600000

/** Why the scheduler wants to speak; one verdict per source. */
export type SpeechTriggerSource =
  | { readonly kind: 'session-edge'; readonly category: SpeechCategory }
  | { readonly kind: 'milestone'; readonly category: 'milestone' }
  | { readonly kind: 'ambient' }
  | { readonly kind: 'click'; readonly category: SpeechCategory }

export interface SpeechCadenceState {
  /** Epoch ms of surface mount. */
  readonly mountedAt: number
  /**
   * Current mapped session state, driving the ambient idle-state gate of
   * CTR-OVERLAY-019(3) ('terminal' covers an active terminal reaction).
   */
  readonly sessionState: 'idle' | 'working' | 'needs-input' | 'terminal'
  /** Epoch ms of the last shown line (any category), or null. */
  readonly lastSpokenAt: number | null
  /** Epoch ms of the last payload-ignored user input signal, or null. */
  readonly lastInputAt: number | null
  /** Epoch ms of the last ambient line, or null. */
  readonly lastAmbientAt: number | null
  /** Epoch ms of the last click line, or null. */
  readonly lastClickSpokenAt: number | null
  /** Epoch ms when the current running period started, or null. */
  readonly runningPeriodStartedAt: number | null
  /** Lines already shown in the current running period. */
  readonly workingLinesThisPeriod: number
  /** "now", injected for determinism. */
  readonly now: number
}

export type SpeechVerdict =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason:
      | 'load-quiet'
      | 'typing'
      | 'not-idle'
      | 'ambient-interval'
      | 'click-throttle'
      | 'working-cap' }

/** CTR-OVERLAY-019 cadence matrix. Ambient uses only the `ambient` source. */
export function evaluateCadence(
  source: SpeechTriggerSource,
  cadence: SpeechCadenceState,
): SpeechVerdict {
  if (cadence.now - cadence.mountedAt < SPEECH_LOAD_QUIET_MS) {
    // The once-per-local-day greeting is the single exempt line; it is
    // dispatched by the scheduler with the 'milestone'-style explicit path
    // only after the quiet period elapses, so ambient rules never apply.
    return { allowed: false, reason: 'load-quiet' }
  }
  if (source.kind === 'ambient') {
    if (cadence.sessionState !== 'idle') {
      return { allowed: false, reason: 'not-idle' }
    }
    if (cadence.lastInputAt !== null
      && cadence.now - cadence.lastInputAt < SPEECH_TYPING_SUPPRESSION_MS) {
      return { allowed: false, reason: 'typing' }
    }
    if (cadence.lastAmbientAt !== null
      && cadence.now - cadence.lastAmbientAt < SPEECH_AMBIENT_MIN_INTERVAL_MS) {
      return { allowed: false, reason: 'ambient-interval' }
    }
    return { allowed: true }
  }
  if (source.kind === 'click') {
    if (cadence.lastClickSpokenAt !== null
      && cadence.now - cadence.lastClickSpokenAt < SPEECH_CLICK_THROTTLE_MS) {
      return { allowed: false, reason: 'click-throttle' }
    }
    return { allowed: true }
  }
  if (source.kind === 'session-edge' && source.category === 'working') {
    if (cadence.workingLinesThisPeriod >= SPEECH_WORKING_MAX_PER_PERIOD) {
      return { allowed: false, reason: 'working-cap' }
    }
    // CTR-OVERLAY-019(4): rotation never interrupts recent user input.
    if (cadence.lastInputAt !== null
      && cadence.now - cadence.lastInputAt < SPEECH_TYPING_SUPPRESSION_MS) {
      return { allowed: false, reason: 'typing' }
    }
    return { allowed: true }
  }
  // Session edges (needs-input / completed / failed) and milestone events are
  // event-driven and edge-deduplicated upstream; they preempt ambient lines.
  return { allowed: true }
}

export interface SpeechSelectionState {
  /** The index of the most recently spoken line within the same category, or null. */
  readonly lastIndexInCategory: number | null
  /** Stable per-session rotation counter (incremented on every selection). */
  readonly rotationCounter: number
}

export interface SpeechSelection {
  /** Index into the locale catalog for the chosen line. */
  readonly index: number
  readonly text: string
  readonly nextRotationCounter: number
}

/**
 * CTR-OVERLAY-018 selection: pure, rotation-driven, and never repeats the
 * identical line twice in a row within the same category.
 */
export function selectSpeechLine(
  category: SpeechCategory,
  locale: string | undefined,
  selection: SpeechSelectionState,
): SpeechSelection {
  const catalog = speechCatalog(locale)
  const indices: number[] = []
  for (let index = 0; index < catalog.length; index += 1) {
    const entry = catalog[index]
    if (entry !== undefined && entry.category === category) indices.push(index)
  }
  if (indices.length === 0) return { index: -1, text: '', nextRotationCounter: selection.rotationCounter }
  const offset = selection.rotationCounter % indices.length
  const chosen = indices[offset]
  if (chosen === undefined) return { index: -1, text: '', nextRotationCounter: selection.rotationCounter }
  const alternative = indices[(offset + 1) % indices.length] ?? chosen
  const finalIndex = chosen === selection.lastIndexInCategory && indices.length > 1 ? alternative : chosen
  return {
    index: finalIndex,
    text: catalog[finalIndex]?.text ?? '',
    nextRotationCounter: selection.rotationCounter + 1,
  }
}

/** Bounded idle bucket from payload-ignored activity recency (expressions). */
export function idleBucketFor(lastActivityAt: number | null, now: number): 0 | 1 | 2 {
  if (lastActivityAt === null) return 0
  const elapsed = now - lastActivityAt
  if (elapsed >= IDLE_BUCKET_LONG_MS) return 2
  if (elapsed >= IDLE_BUCKET_MID_MS) return 1
  return 0
}
