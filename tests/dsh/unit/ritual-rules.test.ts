/**
 * Welcome-back and daily ritual rules (DSH_PET_OVERLAY_ADAPTER_V7
 * CTR-OVERLAY-035/036; ACC-132). Goal §24 cases: WELCOME_BACK_NO_GUILT,
 * RITUAL_ONCE_SEMANTICS. Includes the catalog copy guard: welcome/ritual/
 * petting lines never contain guilt, absence duration, streak, or obligation
 * phrasing.
 */

import { describe, expect, it } from 'vitest'
import {
  EMPTY_RITUAL_MARKERS, WELCOME_BACK_THRESHOLD_MS, isFirstCompletionToday,
  isLateNightRitualDue, lateNightRitualDayKey, localDayKey, recordRitual,
  shouldWelcomeBack,
} from '../../../src/dsh/client/ritual-rules'
import { characterSpeechCatalog } from '../../../src/dsh/client/speech-catalog'

const T0 = 1757464800000 // 2026-09-10T02:00:00Z-ish epoch ms; exact value irrelevant

describe('WELCOME_BACK (V7 CTR-035)', () => {
  it('fires only after the recorded ≥8 h band and never twice per local day', () => {
    const todayKey = localDayKey(new Date(T0))
    expect(shouldWelcomeBack(undefined, T0, todayKey, EMPTY_RITUAL_MARKERS)).toBe(false)
    expect(shouldWelcomeBack(0, T0, todayKey, EMPTY_RITUAL_MARKERS)).toBe(false)
    expect(shouldWelcomeBack(Number.NaN, T0, todayKey, EMPTY_RITUAL_MARKERS)).toBe(false)
    expect(shouldWelcomeBack(T0 - WELCOME_BACK_THRESHOLD_MS + 1, T0, todayKey, EMPTY_RITUAL_MARKERS)).toBe(false)
    expect(shouldWelcomeBack(T0 - WELCOME_BACK_THRESHOLD_MS, T0, todayKey, EMPTY_RITUAL_MARKERS)).toBe(true)
    const marked = recordRitual(EMPTY_RITUAL_MARKERS, 'welcome', todayKey)
    expect(shouldWelcomeBack(T0 - 10 * WELCOME_BACK_THRESHOLD_MS, T0, todayKey, marked)).toBe(false)
  })

  it('welcome markers persist per local day and clear on a new day', () => {
    const todayKey = localDayKey(new Date(T0))
    const marked = recordRitual(EMPTY_RITUAL_MARKERS, 'welcome', todayKey)
    expect(marked.welcomeDayKey).toBe(todayKey)
    const tomorrowKey = localDayKey(new Date(T0 + 24 * 60 * 60 * 1000))
    expect(shouldWelcomeBack(T0 - 2 * WELCOME_BACK_THRESHOLD_MS, T0 + 24 * 60 * 60 * 1000, tomorrowKey, marked)).toBe(true)
  })
})

describe('RITUAL_ONCE_SEMANTICS (V7 CTR-036)', () => {
  it('first-completion fires once per local day and resets on rollover', () => {
    const todayKey = localDayKey(new Date(T0))
    expect(isFirstCompletionToday(EMPTY_RITUAL_MARKERS, todayKey)).toBe(true)
    const marked = recordRitual(EMPTY_RITUAL_MARKERS, 'first-completion', todayKey)
    expect(isFirstCompletionToday(marked, todayKey)).toBe(false)
    const tomorrowKey = localDayKey(new Date(T0 + 24 * 60 * 60 * 1000))
    expect(isFirstCompletionToday(marked, tomorrowKey)).toBe(true)
  })

  it('late-night fires once per ritual day; the hours before 05:00 belong to the previous evening', () => {
    const evening = new Date(T0)
    evening.setHours(23, 30, 0, 0)
    const afterMidnight = new Date(evening)
    afterMidnight.setDate(afterMidnight.getDate() + 1)
    afterMidnight.setHours(2, 0, 0, 0)
    const ritualKey = lateNightRitualDayKey(evening)
    expect(ritualKey).toBe(localDayKey(evening))
    // 02:00 the next morning belongs to the same ritual day.
    expect(lateNightRitualDayKey(afterMidnight)).toBe(ritualKey)
    expect(isLateNightRitualDue(EMPTY_RITUAL_MARKERS, ritualKey)).toBe(true)
    const marked = recordRitual(EMPTY_RITUAL_MARKERS, 'late-night', ritualKey)
    expect(isLateNightRitualDue(marked, ritualKey)).toBe(false)
    // The next evening is due again.
    const nextEveningKey = localDayKey(new Date(evening.getTime() + 24 * 60 * 60 * 1000))
    expect(isLateNightRitualDue(marked, nextEveningKey)).toBe(true)
  })

  it('localDayKey is a bounded device-local YYYY-MM-DD key', () => {
    const probe = new Date(2026, 8, 10, 13, 30)
    expect(localDayKey(probe)).toBe('2026-09-10')
    expect(localDayKey(new Date(2026, 11, 31)).length).toBe(10)
  })
})

describe('WELCOME_BACK_NO_GUILT copy guard (V7 CTR-035/036)', () => {
  const GUILT = /天没|天不见|孤独|想你|好久没|冷落|连续|签到|streak|lonely|missed you|abandon|neglect|days? without|guilt/i
  const OBLIGATION = /应该|必须|早该|快去|别忘了|should (go|sleep|come)|must (go|sleep|come)/i

  it('welcome, ritual, and petting lines stay warm without guilt, streaks, or obligations', () => {
    for (const characterId of ['vehicle', 'companion'] as const) {
      for (const locale of ['zh-CN', 'en']) {
        const entries = characterSpeechCatalog(characterId, locale)
          .filter(entry => entry.category === 'welcome' || entry.category === 'ritual' || entry.category === 'petting')
        expect(entries.length).toBeGreaterThanOrEqual(9)
        for (const entry of entries) {
          expect(entry.text, `${characterId}/${locale}/${entry.category}: ${entry.text}`).not.toMatch(GUILT)
          expect(entry.text, `${characterId}/${locale}/${entry.category}: ${entry.text}`).not.toMatch(OBLIGATION)
          // No absence duration, counters, or status readouts in the copy.
          expect(entry.text).not.toMatch(/\d+\s*(天|day|hour|小时|分钟)/i)
        }
      }
    }
  })
})
