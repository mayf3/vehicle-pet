/**
 * Ambient behavior, daypart weighting, and personality profiles
 * (DSH_PET_OVERLAY_ADAPTER_V7 CTR-OVERLAY-033/034/037; ACC-130/131/133).
 * Goal §24 cases: AMBIENT_CADENCE, AMBIENT_NO_REPEAT, TYPING_SUPPRESSION,
 * DAYPART_WEIGHTING, CHARACTER_BEHAVIOR_PROFILE.
 */

import { describe, expect, it } from 'vitest'
import {
  AMBIENT_GAP_MAX_MS, AMBIENT_GAP_MIN_MS, AMBIENT_INTERACTION_COOLDOWN_MS,
  AMBIENT_LOAD_QUIET_MS, AMBIENT_TYPING_SUPPRESSION_MS, evaluateAmbient,
  nextAmbientDelayMs, selectAmbientAction,
} from '../../../src/dsh/client/ambient-rules'
import { BEHAVIOR_PROFILES } from '../../../src/dsh/client/characters'
import { bucketEnergyBias, daypartFromHour } from '../../../src/dsh/client/daypart'
import { nextDaypartRecurringDelayMs } from '../../../src/dsh/client/speech-rules'

const T0 = 1000000

function cadence(overrides: Partial<Parameters<typeof evaluateAmbient>[0]>) {
  return {
    mountedAt: T0,
    lastInputAt: null,
    lastInteractionAt: null,
    lastActionAt: null,
    sessionState: 'idle' as const,
    documentHidden: false,
    now: T0 + AMBIENT_LOAD_QUIET_MS + AMBIENT_GAP_MAX_MS,
    ...overrides,
  }
}

describe('AMBIENT_CADENCE (V7 CTR-033)', () => {
  it('keeps the load-quiet period before any ambient action', () => {
    expect(evaluateAmbient(cadence({ now: T0 + AMBIENT_LOAD_QUIET_MS - 1 })))
      .toEqual({ allowed: false, reason: 'load-quiet' })
    expect(evaluateAmbient(cadence({})).allowed).toBe(true)
  })

  it('suppresses while typing (payload-ignored recency) and during the interaction cooldown', () => {
    const now = T0 + AMBIENT_LOAD_QUIET_MS + AMBIENT_GAP_MAX_MS
    expect(evaluateAmbient(cadence({ now, lastInputAt: now - AMBIENT_TYPING_SUPPRESSION_MS + 1 })))
      .toEqual({ allowed: false, reason: 'typing' })
    expect(evaluateAmbient(cadence({ now, lastInputAt: now - AMBIENT_TYPING_SUPPRESSION_MS })).allowed).toBe(true)
    expect(evaluateAmbient(cadence({ now, lastInteractionAt: now - AMBIENT_INTERACTION_COOLDOWN_MS + 1 })))
      .toEqual({ allowed: false, reason: 'interaction-cooldown' })
    expect(evaluateAmbient(cadence({ now, lastInteractionAt: now - AMBIENT_INTERACTION_COOLDOWN_MS })).allowed).toBe(true)
  })

  it('enforces the minutes-level gap floor and stays silent in non-idle or hidden states', () => {
    const now = T0 + AMBIENT_LOAD_QUIET_MS + AMBIENT_GAP_MAX_MS
    expect(evaluateAmbient(cadence({ now, lastActionAt: now - AMBIENT_GAP_MIN_MS + 1 })))
      .toEqual({ allowed: false, reason: 'gap' })
    expect(evaluateAmbient(cadence({ now, lastActionAt: now - AMBIENT_GAP_MIN_MS })).allowed).toBe(true)
    for (const sessionState of ['working', 'needs-input', 'terminal'] as const) {
      expect(evaluateAmbient(cadence({ sessionState })).allowed).toBe(false)
    }
    expect(evaluateAmbient(cadence({ documentHidden: true })).allowed).toBe(false)
  })

  it('samples the randomized gap inside the recorded 90–240 s band and clamps bad input', () => {
    for (const sample of [0, 0.25, 0.5, 0.75, 0.999999]) {
      const delay = nextAmbientDelayMs(sample)
      expect(delay).toBeGreaterThanOrEqual(AMBIENT_GAP_MIN_MS)
      expect(delay).toBeLessThanOrEqual(AMBIENT_GAP_MAX_MS)
    }
    expect(nextAmbientDelayMs(Number.NaN)).toBe(AMBIENT_GAP_MIN_MS)
    expect(nextAmbientDelayMs(Number.POSITIVE_INFINITY)).toBe(AMBIENT_GAP_MAX_MS)
    expect(nextAmbientDelayMs(-3)).toBe(AMBIENT_GAP_MIN_MS)
  })
})

describe('AMBIENT_NO_REPEAT + CHARACTER_BEHAVIOR_PROFILE (V7 CTR-033/037)', () => {
  it('excludes the immediately previous action from selection', () => {
    for (const characterId of ['vehicle', 'companion'] as const) {
      const seen = new Set<string>()
      let previous: string | null = null
      for (let sample = 0; sample < 20; sample += 1) {
        const action = selectAmbientAction(characterId, 'daytime', previous, sample / 20)
        expect(action.id).not.toBe(previous)
        seen.add(action.id)
        previous = action.id
      }
      expect(seen.size).toBeGreaterThan(1)
    }
  })

  it('the two characters carry disjoint, declarative repertoires (observable personality difference)', () => {
    const vehicle = new Set(BEHAVIOR_PROFILES.vehicle.ambientPool)
    const companion = new Set(BEHAVIOR_PROFILES.companion.ambientPool)
    expect(vehicle.size).toBeGreaterThanOrEqual(3)
    expect(companion.size).toBeGreaterThanOrEqual(3)
    for (const id of vehicle) expect(companion.has(id)).toBe(false)
    // Same underlying success edge, different presentation tendency.
    expect(BEHAVIOR_PROFILES.vehicle.stateReactions.completed).not.toBe(BEHAVIOR_PROFILES.companion.stateReactions.completed)
    expect(BEHAVIOR_PROFILES.vehicle.petting).not.toEqual(BEHAVIOR_PROFILES.companion.petting)
  })

  it('daypart re-weights the same pool without changing its membership', () => {
    const collectShare = (bucket: Parameters<typeof bucketEnergyBias>[0]): number => {
      let sleepy = 0
      let total = 0
      for (let index = 0; index < 200; index += 1) {
        const action = selectAmbientAction('companion', bucket, null, index / 200)
        total += 1
        if (action.energy < 0) sleepy += 1
      }
      return sleepy / total
    }
    expect(collectShare('late-night')).toBeGreaterThan(collectShare('morning'))
  })
})

describe('DAYPART_WEIGHTING (V7 CTR-034)', () => {
  it('buckets the device-local hour exactly at the recorded boundaries', () => {
    expect(daypartFromHour(5)).toBe('morning')
    expect(daypartFromHour(10)).toBe('morning')
    expect(daypartFromHour(11)).toBe('daytime')
    expect(daypartFromHour(16)).toBe('daytime')
    expect(daypartFromHour(17)).toBe('evening')
    expect(daypartFromHour(22)).toBe('evening')
    expect(daypartFromHour(23)).toBe('late-night')
    expect(daypartFromHour(2)).toBe('late-night')
    expect(daypartFromHour(4)).toBe('late-night')
    expect(daypartFromHour(-1)).toBe('late-night')
    expect(daypartFromHour(29)).toBe('morning')
  })

  it('energy bias decreases monotonically into the night', () => {
    expect(bucketEnergyBias('morning')).toBeGreaterThan(bucketEnergyBias('daytime'))
    expect(bucketEnergyBias('daytime')).toBeGreaterThan(bucketEnergyBias('evening'))
    expect(bucketEnergyBias('evening')).toBeGreaterThan(bucketEnergyBias('late-night'))
  })

  it('slides the recurring speech deadline inside the contracted 20–40 s band only', () => {
    for (const bucket of ['morning', 'daytime', 'evening', 'late-night'] as const) {
      for (const sample of [0, 0.5, 0.999999]) {
        const delay = nextDaypartRecurringDelayMs(bucket, sample)
        expect(delay).toBeGreaterThanOrEqual(20000)
        expect(delay).toBeLessThanOrEqual(40000)
      }
    }
    expect(nextDaypartRecurringDelayMs('late-night', 0)).toBe(30000)
    expect(nextDaypartRecurringDelayMs('morning', 0)).toBe(20000)
  })
})
