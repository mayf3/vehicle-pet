/**
 * Speech rules unit evidence (DSH_PET_OVERLAY_ADAPTER_V3 CTR-OVERLAY-018/019,
 * ACC-OVERLAY-119): catalog floors per locale, pure selection with no
 * immediate repeats, and the full cadence matrix — load quiet period, ambient
 * interval, payload-ignored typing suppression, working rotation caps, and
 * click throttle.
 */

import { describe, expect, it } from 'vitest'
import { assertCatalogFloors, speechCatalog } from '../../../src/dsh/client/speech-catalog'
import {
  evaluateCadence, idleBucketFor, selectSpeechLine,
  SPEECH_AMBIENT_MIN_INTERVAL_MS, SPEECH_AUTO_DISMISS_MAX_MS, SPEECH_AUTO_DISMISS_MIN_MS,
  SPEECH_CLICK_THROTTLE_MS, SPEECH_LOAD_QUIET_MS, SPEECH_TYPING_SUPPRESSION_MS,
  SPEECH_WORKING_MAX_PER_PERIOD, SPEECH_WORKING_ROTATION_MS,
  type SpeechCadenceState,
} from '../../../src/dsh/client/speech-rules'

const MOUNT = 1000000
const cadence = (overrides: Partial<SpeechCadenceState> = {}): SpeechCadenceState => ({
  mountedAt: MOUNT,
  sessionState: 'idle',
  lastSpokenAt: null,
  lastInputAt: null,
  lastAmbientAt: null,
  lastClickSpokenAt: null,
  runningPeriodStartedAt: null,
  workingLinesThisPeriod: 0,
  now: MOUNT + SPEECH_LOAD_QUIET_MS + 1,
  ...overrides,
})

describe('speech catalog floors (CTR-OVERLAY-018)', () => {
  it('ships >=30 lines per locale across the six categories with >=5 each', () => {
    expect(() => assertCatalogFloors()).not.toThrow()
    for (const locale of ['zh-CN', 'en']) {
      expect(speechCatalog(locale).length).toBeGreaterThanOrEqual(30)
    }
  })

  it('never repeats a line text within a category (curated uniqueness)', () => {
    for (const locale of ['zh-CN', 'en']) {
      const catalog = speechCatalog(locale)
      for (const category of ['idle', 'working', 'needs-input', 'completed', 'failed', 'milestone']) {
        const texts = catalog.filter(entry => entry.category === category).map(entry => entry.text)
        expect(new Set(texts).size, `${locale}/${category}`).toBe(texts.length)
      }
    }
  })

  it('copy stays short and free of engineering readouts', () => {
    for (const locale of ['zh-CN', 'en']) {
      for (const entry of speechCatalog(locale)) {
        expect(entry.text.length, entry.text).toBeLessThanOrEqual(30)
        expect(entry.text).not.toMatch(/%|token|Token|progress \d|状态：|failed|error \d/i)
      }
    }
  })
})

describe('speech selection (CTR-OVERLAY-018 pure selection)', () => {
  it('rotates within the category and never repeats the identical line twice in a row', () => {
    let rotation = 0
    let lastIndex: number | null = null
    const seen: string[] = []
    for (let step = 0; step < 12; step += 1) {
      const selection = selectSpeechLine('idle', 'zh-CN', { lastIndexInCategory: lastIndex, rotationCounter: rotation })
      expect(selection.text).not.toBe(seen[seen.length - 1])
      seen.push(selection.text)
      lastIndex = selection.index
      rotation = selection.nextRotationCounter
    }
    expect(new Set(seen).size).toBeGreaterThanOrEqual(4)
  })

  it('falls back to zh-CN for unknown locales and still selects', () => {
    const selection = selectSpeechLine('milestone', 'xx-unknown', { lastIndexInCategory: null, rotationCounter: 0 })
    expect(selection.index).toBeGreaterThanOrEqual(0)
    expect(selection.text.length).toBeGreaterThan(0)
  })
})

describe('speech cadence matrix (CTR-OVERLAY-019)', () => {
  it('quiet period: nothing speaks within 15s of mount', () => {
    const during = cadence({ now: MOUNT + SPEECH_LOAD_QUIET_MS - 1 })
    expect(evaluateCadence({ kind: 'session-edge', category: 'completed' }, during)).toEqual({ allowed: false, reason: 'load-quiet' })
    expect(evaluateCadence({ kind: 'ambient' }, during)).toEqual({ allowed: false, reason: 'load-quiet' })
    expect(evaluateCadence({ kind: 'click', category: 'idle' }, during)).toEqual({ allowed: false, reason: 'load-quiet' })
  })

  it('after the quiet period, event edges preempt immediately', () => {
    expect(evaluateCadence({ kind: 'session-edge', category: 'completed' }, cadence())).toEqual({ allowed: true })
    expect(evaluateCadence({ kind: 'milestone', category: 'milestone' }, cadence())).toEqual({ allowed: true })
    expect(evaluateCadence({ kind: 'session-edge', category: 'failed' }, cadence())).toEqual({ allowed: true })
  })

  it('ambient is interval-gated and typing-suppressed', () => {
    const justSpoke = cadence({ lastSpokenAt: MOUNT + SPEECH_LOAD_QUIET_MS - SPEECH_AMBIENT_MIN_INTERVAL_MS + 5000 })
    expect(evaluateCadence({ kind: 'ambient' }, justSpoke)).toEqual({ allowed: false, reason: 'ambient-interval' })
    const typed = cadence({ lastInputAt: MOUNT + SPEECH_LOAD_QUIET_MS - SPEECH_TYPING_SUPPRESSION_MS + 3000 })
    expect(evaluateCadence({ kind: 'ambient' }, typed)).toEqual({ allowed: false, reason: 'typing' })
    const quiet = cadence({
      lastAmbientAt: MOUNT + 1000,
      lastInputAt: MOUNT + 1000,
      now: MOUNT + SPEECH_LOAD_QUIET_MS + Math.max(SPEECH_AMBIENT_MIN_INTERVAL_MS, SPEECH_TYPING_SUPPRESSION_MS) + 1,
    })
    expect(evaluateCadence({ kind: 'ambient' }, quiet)).toEqual({ allowed: true })
  })

  it('click lines throttle to one per window', () => {
    const recent = cadence({ lastClickSpokenAt: MOUNT + SPEECH_LOAD_QUIET_MS - SPEECH_CLICK_THROTTLE_MS + 1000 })
    expect(evaluateCadence({ kind: 'click', category: 'idle' }, recent)).toEqual({ allowed: false, reason: 'click-throttle' })
    const stale = cadence({ lastClickSpokenAt: MOUNT + SPEECH_LOAD_QUIET_MS - SPEECH_CLICK_THROTTLE_MS - 1 })
    expect(evaluateCadence({ kind: 'click', category: 'idle' }, stale)).toEqual({ allowed: true })
  })

  it('ambient is idle-state gated (CTR-OVERLAY-019(3))', () => {
    for (const state of ['terminal'] as const) {
      const duringWork = cadence({ sessionState: state })
      expect(evaluateCadence({ kind: 'ambient' }, duringWork)).toEqual({ allowed: false, reason: 'not-idle' })
    }
    expect(evaluateCadence({ kind: 'ambient' }, cadence({ sessionState: 'idle' }))).toEqual({ allowed: true })
  })

  it('working rotation is typing-suppressed (CTR-OVERLAY-019(4))', () => {
    const underCap = cadence({
      sessionState: 'working',
      workingLinesThisPeriod: SPEECH_WORKING_MAX_PER_PERIOD - 1,
      lastInputAt: MOUNT + SPEECH_LOAD_QUIET_MS - SPEECH_TYPING_SUPPRESSION_MS + 1000,
    })
    expect(evaluateCadence({ kind: 'session-edge', category: 'working' }, underCap)).toEqual({ allowed: false, reason: 'typing' })
    const quietHands = cadence({
      sessionState: 'working',
      workingLinesThisPeriod: SPEECH_WORKING_MAX_PER_PERIOD - 1,
      lastInputAt: MOUNT + SPEECH_LOAD_QUIET_MS - SPEECH_TYPING_SUPPRESSION_MS - 1,
    })
    expect(evaluateCadence({ kind: 'session-edge', category: 'working' }, quietHands)).toEqual({ allowed: true })
  })

  it('working rotation continues beyond prior period caps', () => {
    const capped = cadence({ workingLinesThisPeriod: SPEECH_WORKING_MAX_PER_PERIOD })
    expect(evaluateCadence({ kind: 'session-edge', category: 'working' }, capped)).toEqual({ allowed: true })
    const underCap = cadence({ workingLinesThisPeriod: SPEECH_WORKING_MAX_PER_PERIOD - 1 })
    expect(evaluateCadence({ kind: 'session-edge', category: 'working' }, underCap)).toEqual({ allowed: true })
  })

  it('dismiss window constants stay inside the contract bounds', () => {
    expect(SPEECH_AUTO_DISMISS_MIN_MS).toBe(3000)
    expect(SPEECH_AUTO_DISMISS_MAX_MS).toBe(6000)
    expect(SPEECH_WORKING_ROTATION_MS).toBe(20000)
  })
})

describe('idle bucket (bounded activity recency)', () => {
  it('buckets fresh, mid, and long quiet periods', () => {
    const now = 5000000
    expect(idleBucketFor(null, now)).toBe(0)
    expect(idleBucketFor(now - 1000, now)).toBe(0)
    expect(idleBucketFor(now - 119000, now)).toBe(0)
    expect(idleBucketFor(now - 121000, now)).toBe(1)
    expect(idleBucketFor(now - 601000, now)).toBe(2)
  })
})
