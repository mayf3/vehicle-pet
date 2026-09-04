/**
 * ACC-USG-004 exact calibration vectors and counted-class normalization
 * (DSH_USAGE_PROGRESS_SOURCE_V1, CTR-USG-004/005). Every expected value is
 * the exact floored function value ratified in DEC-USG-005.
 */

import { describe, expect, it } from 'vitest'
import {
  countedFromTokenUsage,
  dailyTargetPoints,
  DAILY_CAP,
  DAILY_COEFFICIENT,
  TOKEN_SCALE,
  localDayOf,
  mergeLedger,
  normalizeCount,
  normalizeLedger,
  pruneLedger,
  emptyLedger,
  type UsageLedger,
} from '../../../src/dsh/client/usage-economy'

describe('ACC-USG-004 frozen progress function vectors', () => {
  const VECTORS: ReadonlyArray<readonly [number, number]> = [
    [0, 0],
    [250_000, 434],
    [13_028_844, 5_143],
    [30_000_000, 6_688],
    [47_479_532, 7_559],
    [1_000_000_000, DAILY_CAP],
  ]

  for (const [tokens, expected] of VECTORS) {
    it(`floor(target(${tokens.toLocaleString('en-US')})) = ${expected}`, () => {
      expect(Math.floor(dailyTargetPoints(tokens))).toBe(expected)
    })
  }

  it('caps pathological days below the L3 threshold (install-day invariant)', () => {
    expect(DAILY_CAP).toBe(12_000)
    expect(DAILY_CAP).toBeLessThan(30_000)
    expect(Math.floor(dailyTargetPoints(Number.MAX_SAFE_INTEGER))).toBe(DAILY_CAP)
  })

  it('exposes exactly the frozen constants', () => {
    expect(TOKEN_SCALE).toBe(1_000_000)
    expect(DAILY_COEFFICIENT).toBe(1_350)
  })

  it('never emits fractional growth for the light persona', () => {
    const light = dailyTargetPoints(250_000)
    expect(light).toBeGreaterThan(400)
    expect(light).toBeLessThan(450)
  })
})

describe('CTR-USG-004 counted classes', () => {
  it('counts only uncachedInputTokens + outputTokens', () => {
    expect(countedFromTokenUsage({
      uncachedInputTokens: 100,
      outputTokens: 41,
      cacheReadTokens: 9_999,
      cacheWriteTokens: 9_999,
      reasoningTokens: 9_999,
    })).toBe(141)
  })

  it('treats absent, malformed, negative, fractional, and unsafe fields as 0', () => {
    expect(countedFromTokenUsage(undefined)).toBe(0)
    expect(countedFromTokenUsage(null)).toBe(0)
    expect(countedFromTokenUsage('13000000')).toBe(0)
    expect(countedFromTokenUsage([1, 2])).toBe(0)
    expect(countedFromTokenUsage({})).toBe(0)
    expect(countedFromTokenUsage({ uncachedInputTokens: -5, outputTokens: 3 })).toBe(3)
    expect(countedFromTokenUsage({ uncachedInputTokens: 1.5, outputTokens: 3 })).toBe(3)
    expect(countedFromTokenUsage({ uncachedInputTokens: Number.MAX_SAFE_INTEGER + 1, outputTokens: 0 })).toBe(0)
    expect(countedFromTokenUsage({ uncachedInputTokens: Number.POSITIVE_INFINITY, outputTokens: 2 })).toBe(2)
  })

  it('normalizes single counts with the same n(v) rule', () => {
    expect(normalizeCount(7)).toBe(7)
    expect(normalizeCount(-1)).toBe(0)
    expect(normalizeCount(2.5)).toBe(0)
    expect(normalizeCount('9')).toBe(0)
  })
})

describe('CTR-USG-007 local day boundary', () => {
  it('formats the device-local day, not UTC', () => {
    // 2026-09-04T23:30Z is 2026-09-05 07:30 in UTC+8.
    expect(localDayOf(new Date(2026, 8, 5, 7, 30))).toBe('2026-09-05')
    expect(localDayOf(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01')
  })
})

describe('CTR-USG-009 ledger normalization and merge-guard', () => {
  it('degrades malformed or wrong-version records to an empty ledger', () => {
    expect(normalizeLedger(undefined)).toEqual(emptyLedger())
    expect(normalizeLedger('junk')).toEqual(emptyLedger())
    expect(normalizeLedger({ schemaVersion: 2 })).toEqual(emptyLedger())
    expect(normalizeLedger({ schemaVersion: 1, cumulativePoints: -5 })).toEqual(emptyLedger())
  })

  it('round-trips a valid ledger', () => {
    const ledger: UsageLedger = {
      schemaVersion: 1,
      cumulativePoints: 5_143,
      revision: 3,
      byDay: { '2026-09-04': { tokens: 13_028_844, appliedPoints: 5_143 } },
      lastSeen: { 'session-a': 980_899 },
    }
    expect(normalizeLedger(JSON.parse(JSON.stringify(ledger)))).toEqual(ledger)
  })

  it('merges field-wise maxima so a stale writer cannot regress a newer record', () => {
    const newer: UsageLedger = {
      schemaVersion: 1,
      cumulativePoints: 500,
      revision: 9,
      byDay: { '2026-09-04': { tokens: 300, appliedPoints: 500 } },
      lastSeen: { 's1': 300 },
    }
    const stale: UsageLedger = {
      schemaVersion: 1,
      cumulativePoints: 480,
      revision: 4,
      byDay: { '2026-09-04': { tokens: 280, appliedPoints: 480 }, '2026-09-03': { tokens: 10, appliedPoints: 10 } },
      lastSeen: { 's1': 280, 's2': 12 },
    }
    const merged = mergeLedger(stale, newer)
    expect(merged.cumulativePoints).toBe(500)
    expect(merged.revision).toBe(9)
    expect(merged.byDay['2026-09-04']).toEqual({ tokens: 300, appliedPoints: 500 })
    expect(merged.byDay['2026-09-03']).toEqual({ tokens: 10, appliedPoints: 10 })
    expect(merged.lastSeen).toEqual({ 's1': 300, 's2': 12 })
  })
})

describe('CTR-USG-011 bounded ledger', () => {
  it('drops byDay entries older than 90 local days and absent-session lastSeen entries', () => {
    const ledger: UsageLedger = {
      schemaVersion: 1,
      cumulativePoints: 2_000,
      revision: 5,
      byDay: {
        '2026-09-04': { tokens: 100, appliedPoints: 100 },
        '2026-05-01': { tokens: 900, appliedPoints: 900 },
        '2026-06-10': { tokens: 1_000, appliedPoints: 1_000 },
      },
      lastSeen: { 'present': 50, 'gone': 60 },
    }
    const pruned = pruneLedger(ledger, '2026-09-04', new Set(['present']))
    expect(Object.keys(pruned.byDay).sort()).toEqual(['2026-06-10', '2026-09-04'])
    expect(pruned.cumulativePoints).toBe(2_000)
    expect(pruned.lastSeen).toEqual({ 'present': 50 })
  })
})
