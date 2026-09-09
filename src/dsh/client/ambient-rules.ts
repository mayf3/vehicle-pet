/**
 * Quiet ambient behavior layer (DSH_PET_OVERLAY_ADAPTER_V7
 * DEC-OVERLAY-023 / CTR-OVERLAY-033). Pure cadence and selection rules; the
 * React hook only applies verdicts and owns the one ambient timer. The
 * repertoire is declarative per character (BEHAVIOR_PROFILES in
 * characters.ts); every action renders from approved masters plus bounded
 * code-native motion. Daypart weighting (CTR-034) enters only as selection
 * weights. No speech scheduling happens here — any line still flows through
 * the single CTR-019 scheduler.
 */

import { BEHAVIOR_PROFILES } from './characters'
import type { CharacterId } from './types'
import { bucketEnergyBias, type DaypartBucket } from './daypart'

/** Minutes-level randomized gap; V7 band floor 90 s, frozen 90–240 s. */
export const AMBIENT_GAP_MIN_MS = 90000
export const AMBIENT_GAP_MAX_MS = 240000
/** No ambient action within the first 120 s of mount. */
export const AMBIENT_LOAD_QUIET_MS = 120000
/** Payload-ignored input recency window suppressing ambient actions. */
export const AMBIENT_TYPING_SUPPRESSION_MS = 10000
/** No ambient action within 120 s of the last direct interaction. */
export const AMBIENT_INTERACTION_COOLDOWN_MS = 120000

/** Declarative ambient repertoire (approved masters + bounded motion only). */
export interface AmbientActionDefinition {
  readonly id: string
  readonly variant: 'idle' | 'idle-happy' | 'idle-curious' | 'idle-sleepy'
  readonly gesture: 'look-left' | 'look-right' | 'peek' | 'blink' | 'shuffle' | 'stretch' | 'nod' | 'melt'
  readonly decoration: 'none' | 'question' | 'sparkles' | 'sleep' | 'flower'
  /** -1 sleepy … +1 energetic; daypart energy bias multiplies selection. */
  readonly energy: number
}

export const AMBIENT_ACTIONS: Readonly<Record<string, AmbientActionDefinition>> = {
  'look-left': { id: 'look-left', variant: 'idle-curious', gesture: 'look-left', decoration: 'none', energy: 0.1 },
  'look-right': { id: 'look-right', variant: 'idle-curious', gesture: 'look-right', decoration: 'none', energy: 0.1 },
  'sensor-check': { id: 'sensor-check', variant: 'idle-curious', gesture: 'peek', decoration: 'question', energy: 0.2 },
  'wheel-blink': { id: 'wheel-blink', variant: 'idle-happy', gesture: 'blink', decoration: 'sparkles', energy: 0.4 },
  'small-shuffle': { id: 'small-shuffle', variant: 'idle-happy', gesture: 'shuffle', decoration: 'none', energy: 0.6 },
  'stretch': { id: 'stretch', variant: 'idle', gesture: 'stretch', decoration: 'none', energy: -0.1 },
  'yawn': { id: 'yawn', variant: 'idle-sleepy', gesture: 'nod', decoration: 'sleep', energy: -0.7 },
  'glance-terminal': { id: 'glance-terminal', variant: 'idle-curious', gesture: 'peek', decoration: 'none', energy: 0.1 },
  'rest': { id: 'rest', variant: 'idle-sleepy', gesture: 'melt', decoration: 'none', energy: -0.9 },
  'tidy-cuff': { id: 'tidy-cuff', variant: 'idle-happy', gesture: 'blink', decoration: 'flower', energy: 0.2 },
  'look-around': { id: 'look-around', variant: 'idle-curious', gesture: 'look-left', decoration: 'none', energy: 0 },
}

export interface AmbientCadenceState {
  /** Epoch ms of surface mount. */
  readonly mountedAt: number
  /** Payload-ignored input recency, or null. */
  readonly lastInputAt: number | null
  /** Epoch ms of the last direct interaction (click/petting/drag/menu), or null. */
  readonly lastInteractionAt: number | null
  /** Epoch ms of the last emitted ambient action, or null. */
  readonly lastActionAt: number | null
  /** Mapped session state ('terminal' covers an active terminal reaction). */
  readonly sessionState: 'idle' | 'working' | 'needs-input' | 'terminal'
  readonly documentHidden: boolean
  readonly now: number
}

export type AmbientVerdict =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason:
      | 'load-quiet'
      | 'typing'
      | 'interaction-cooldown'
      | 'gap'
      | 'not-idle'
      | 'hidden' }

export function evaluateAmbient(cadence: AmbientCadenceState): AmbientVerdict {
  if (cadence.documentHidden) return { allowed: false, reason: 'hidden' }
  if (cadence.now - cadence.mountedAt < AMBIENT_LOAD_QUIET_MS) return { allowed: false, reason: 'load-quiet' }
  if (cadence.sessionState !== 'idle') return { allowed: false, reason: 'not-idle' }
  if (cadence.lastInputAt !== null
    && cadence.now - cadence.lastInputAt < AMBIENT_TYPING_SUPPRESSION_MS) {
    return { allowed: false, reason: 'typing' }
  }
  if (cadence.lastInteractionAt !== null
    && cadence.now - cadence.lastInteractionAt < AMBIENT_INTERACTION_COOLDOWN_MS) {
    return { allowed: false, reason: 'interaction-cooldown' }
  }
  if (cadence.lastActionAt !== null
    && cadence.now - cadence.lastActionAt < AMBIENT_GAP_MIN_MS) {
    return { allowed: false, reason: 'gap' }
  }
  return { allowed: true }
}

/** Injected random sample keeps the minutes-level deadline pure. */
export function nextAmbientDelayMs(sample: number): number {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(sample) ? sample : 0))
  return AMBIENT_GAP_MIN_MS + Math.floor(clamped * (AMBIENT_GAP_MAX_MS - AMBIENT_GAP_MIN_MS))
}

/**
 * CTR-033/034 selection: pure over (profile pool, daypart, recent history,
 * injected random sample). Weight = base energy affinity × daypart energy
 * bias; the immediately previous action is excluded (no back-to-back).
 */
export function selectAmbientAction(
  characterId: CharacterId,
  bucket: DaypartBucket,
  lastActionId: string | null,
  randomSample: number,
): AmbientActionDefinition {
  const pool = BEHAVIOR_PROFILES[characterId].ambientPool
  const bias = bucketEnergyBias(bucket)
  const candidates = pool.filter(id => id !== lastActionId)
  const eligible = candidates.length > 0 ? candidates : [...pool]
  const weights = eligible.map(id => {
    const action = AMBIENT_ACTIONS[id]
    return Math.max(0.05, 1 + (action !== undefined ? action.energy * bias : 0))
  })
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  const clamped = Math.max(0, Math.min(0.999999, Number.isFinite(randomSample) ? randomSample : 0))
  let threshold = clamped * total
  for (let index = 0; index < eligible.length; index += 1) {
    threshold -= weights[index] ?? 0
    if (threshold < 0) {
      const chosen = AMBIENT_ACTIONS[eligible[index] ?? '']
      if (chosen !== undefined) return chosen
    }
  }
  const fallback = AMBIENT_ACTIONS[eligible[0] ?? '']
  if (fallback !== undefined) return fallback
  return AMBIENT_ACTIONS['look-around']!
}
