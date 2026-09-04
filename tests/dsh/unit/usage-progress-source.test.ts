/**
 * DshUsageProgressSource unit coverage for DSH_USAGE_PROGRESS_SOURCE_V1:
 * calibration vectors and counted classes (ACC-USG-004), snapshot-seam
 * emission and monotonicity (ACC-USG-002), attribution semantics
 * (ACC-USG-005), persistence and pruning (ACC-USG-006), and silent
 * degradation (ACC-USG-007). Counts and stable session ids only — no
 * message content anywhere in these fixtures.
 */

import { describe, expect, it } from 'vitest'
import { validateProgressSnapshot } from '../../../src/engine'
import {
  DAILY_CAP,
  DshUsageProgressSource,
  dailyTargetPoints,
  USAGE_LEDGER_STORAGE_KEY,
  USAGE_SOURCE_ID,
  USAGE_SUBJECT_ID,
  type UsageClock,
  type UsageLedgerStorage,
  type UsageSessionListLike,
} from '../../../src/dsh/client/usage-progress-source'

function fakeStorage(initial?: Record<string, string>): UsageLedgerStorage & { dump(): Record<string, string> } {
  const map = new Map<string, string>(Object.entries(initial ?? {}))
  return {
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value)
    },
    dump: () => Object.fromEntries(map.entries()),
  }
}

function clock(day: string): UsageClock {
  return {
    localDay: () => day,
    now: () => new Date(`${day}T12:00:00`),
  }
}

function list(entries: Record<string, { uncached?: number; output?: number; cacheRead?: number; reasoning?: number } | undefined>): UsageSessionListLike {
  const byId: Record<string, UsageSessionListLike['byId'][string]> = {}
  for (const [id, usage] of Object.entries(entries)) {
    byId[id] = usage === undefined
      ? undefined
      : {
          projectionValues: {
            tokenUsage: {
              uncachedInputTokens: usage.uncached,
              outputTokens: usage.output,
              cacheReadTokens: usage.cacheRead,
              reasoningTokens: usage.reasoning,
            },
          },
        }
  }
  return { byId }
}

function collector() {
  const seen: unknown[] = []
  return {
    seen,
    count: () => seen.length,
    last: () => seen[seen.length - 1] as
      | { progressPoints: number; revision: number; sourceId: string; subjectId: string; schemaVersion: 1; observedAt: string }
      | undefined,
  }
}

describe('calibration vectors and counted classes (CTR-USG-004, CTR-USG-005; ACC-USG-004)', () => {
  it('reproduces the exact frozen function vectors', () => {
    expect(Math.floor(dailyTargetPoints(0))).toBe(0)
    expect(Math.floor(dailyTargetPoints(250_000))).toBe(434)
    expect(Math.floor(dailyTargetPoints(13_028_844))).toBe(5_143)
    expect(Math.floor(dailyTargetPoints(30_000_000))).toBe(6_688)
    expect(Math.floor(dailyTargetPoints(47_479_532))).toBe(7_559)
    expect(Math.floor(dailyTargetPoints(1_000_000_000))).toBe(12_000)
  })

  it('keeps the cap invariant below the L3 threshold', () => {
    expect(DAILY_CAP).toBe(12_000)
    expect(DAILY_CAP).toBeLessThan(30_000)
  })

  it('counts only uncached input + output; excludes cache and reasoning classes', () => {
    const source = new DshUsageProgressSource({ storage: fakeStorage(), clock: clock('2026-09-05') })
    source.observe(list({ s1: { uncached: 100, output: 200, cacheRead: 999_999, reasoning: 999_999 } }))
    expect(source.ledger.lastSeen.s1).toBe(300)
    expect(source.ledger.cumulativePoints).toBe(0) // first observation seeds only
  })

  it('normalizes malformed counts to zero without erroring', () => {
    const source = new DshUsageProgressSource({ storage: fakeStorage(), clock: clock('2026-09-05') })
    source.observe(list({ s1: { uncached: -5, output: 1.5 } }))
    expect(source.ledger.lastSeen.s1).toBe(0)
  })
})

describe('snapshot-seam emission and monotonicity (CTR-USG-002, CTR-USG-008; ACC-USG-002)', () => {
  it('emits only valid ProgressSnapshotV1 objects, only on positive gain, monotonically', () => {
    const source = new DshUsageProgressSource({ storage: fakeStorage(), clock: clock('2026-09-05') })
    const seen = collector()
    source.subscribe(snapshot => seen.seen.push(snapshot))
    source.observe(list({ s1: { uncached: 1_000, output: 0 } })) // seed
    expect(seen.count()).toBe(1) // subscribe re-broadcast only
    source.observe(list({ s1: { uncached: 6_000_000, output: 0 } })) // big growth
    expect(seen.count()).toBe(2)
    const first = seen.seen[0] as { progressPoints: number; revision: number }
    const second = seen.last()!
    expect(validateProgressSnapshot(second).ok).toBe(true)
    expect(second.sourceId).toBe(USAGE_SOURCE_ID)
    expect(second.subjectId).toBe(USAGE_SUBJECT_ID)
    expect(second.schemaVersion).toBe(1)
    expect(second.progressPoints).toBe(first.progressPoints + 3789)
    expect(second.revision).toBe(first.revision + 1)
    // no further usage -> no further emission
    source.observe(list({ s1: { uncached: 6_000_000, output: 0 } }))
    expect(seen.count()).toBe(2)
  })

  it('keeps points and revisions monotone across a day rollover', () => {
    const storage = fakeStorage()
    const source = new DshUsageProgressSource({ storage, clock: clock('2026-09-05') })
    const seen = collector()
    source.subscribe(s => seen.seen.push(s))
    source.observe(list({ s1: { uncached: 6_000_000, output: 0 } }))
    source.observe(list({ s1: { uncached: 1_000, output: 0 } })) // regression: no emission
    const rollover = new DshUsageProgressSource({ storage, clock: clock('2026-09-06') })
    const seen2 = collector()
    rollover.subscribe(s => seen2.seen.push(s))
    rollover.observe(list({ s1: { uncached: 6_100_000, output: 0 } }))
    const before = seen.last()!
    const after = seen2.last()!
    expect(after.progressPoints).toBeGreaterThanOrEqual(before.progressPoints)
    expect(after.revision).toBeGreaterThanOrEqual(before.revision)
  })
})

describe('attribution semantics (CTR-USG-006, CTR-USG-007; ACC-USG-005)', () => {
  it('seeds first observations silently and attributes only later growth', () => {
    const source = new DshUsageProgressSource({ storage: fakeStorage(), clock: clock('2026-09-05') })
    const seen = collector()
    source.subscribe(s => seen.seen.push(s))
    source.observe(list({ s1: { uncached: 500_000, output: 100_000 } }))
    expect(source.ledger.cumulativePoints).toBe(0)
    source.observe(list({ s1: { uncached: 1_100_000, output: 150_000 } })) // delta 650_000
    // floor(1350 * log2(1.65)) = floor(975.3) = 975 applied on the day
    expect(source.ledger.byDay['2026-09-05']).toEqual({ dailyTokens: 650_000, appliedPoints: 975 })
    expect(source.ledger.cumulativePoints).toBe(975)
  })

  it('aggregates multiple sessions into one day and one emission', () => {
    const source = new DshUsageProgressSource({ storage: fakeStorage(), clock: clock('2026-09-05') })
    const seen = collector()
    source.subscribe(s => seen.seen.push(s))
    source.observe(list({ a: { uncached: 100, output: 0 }, b: { uncached: 100, output: 0 } })) // seed both
    source.observe(list({ a: { uncached: 400_000, output: 0 }, b: { uncached: 400_000, output: 0 } }))
    expect(seen.count()).toBe(2)
    expect(source.ledger.byDay['2026-09-05']?.dailyTokens).toBe(799_800)
  })

  it('attributes usage after a gap to the observation day, never a past day', () => {
    const storage = fakeStorage()
    const day1 = new DshUsageProgressSource({ storage, clock: clock('2026-09-05') })
    day1.observe(list({ s1: { uncached: 100, output: 0 } }))
    const day9 = new DshUsageProgressSource({ storage, clock: clock('2026-09-09') })
    day9.observe(list({ s1: { uncached: 1_000, output: 0 } }))
    expect(day9.ledger.byDay['2026-09-09']?.dailyTokens).toBe(900)
    expect(day9.ledger.byDay['2026-09-09']?.appliedPoints).toBeGreaterThanOrEqual(1)
    expect(day9.ledger.byDay['2026-09-05']).toBeDefined() // first-day marker retained
  })
})

describe('persistence, merge-guard, and pruning (CTR-USG-009, CTR-USG-011; ACC-USG-006)', () => {
  it('re-emits the persisted total on reload', () => {
    const storage = fakeStorage()
    const first = new DshUsageProgressSource({ storage, clock: clock('2026-09-05') })
    first.observe(list({ s1: { uncached: 1_000, output: 0 } })) // seed
    first.observe(list({ s1: { uncached: 6_000_000, output: 0 } })) // growth
    const total = first.ledger.cumulativePoints
    expect(total).toBeGreaterThan(0)
    const reloaded = new DshUsageProgressSource({ storage, clock: clock('2026-09-05') })
    const seen = collector()
    reloaded.subscribe(s => seen.seen.push(s))
    expect(seen.last()!.progressPoints).toBe(total)
  })

  it('never lets a stale writer regress a strictly greater stored record', () => {
    const storage = fakeStorage()
    const source = new DshUsageProgressSource({ storage, clock: clock('2026-09-05') })
    source.observe(list({ s1: { uncached: 6_000_000, output: 0 } }))
    // A newer tab stored a higher cumulative total.
    const stored = JSON.parse(storage.dump()[USAGE_LEDGER_STORAGE_KEY]!)
    stored.cumulativePoints += 5_000
    stored.revision += 7
    storage.setItem(USAGE_LEDGER_STORAGE_KEY, JSON.stringify(stored))
    source.observe(list({ s1: { uncached: 6_100_000, output: 0 } }))
    const afterWrite = JSON.parse(storage.dump()[USAGE_LEDGER_STORAGE_KEY]!)
    expect(afterWrite.cumulativePoints).toBeGreaterThanOrEqual(stored.cumulativePoints)
    expect(afterWrite.revision).toBeGreaterThanOrEqual(stored.revision)
  })

  it('prunes byDay beyond 90 local days and lastSeen of absent sessions', () => {
    const storage = fakeStorage()
    const seed: Record<string, string> = {}
    for (let index = 1; index <= 95; index += 1) {
      const day = new Date(Date.UTC(2026, 4, index)).toISOString().slice(0, 10)
      seed[USAGE_LEDGER_STORAGE_KEY] = JSON.stringify({
        schemaVersion: 1,
        cumulativePoints: index * 10,
        revision: index,
        byDay: { [day]: { dailyTokens: 1000, appliedPoints: 10 } },
        lastSeen: { gone: 5 },
      })
    }
    // Keep only the last written record (each write above replaced it); add 90
    // distinct days through the source's own normalization instead.
    const merged = { schemaVersion: 1, cumulativePoints: 950, revision: 95, byDay: {} as Record<string, { dailyTokens: number; appliedPoints: number }>, lastSeen: { gone: 5 } }
    for (let index = 1; index <= 95; index += 1) {
      const day = new Date(Date.UTC(2026, 0, 1 + index)).toISOString().slice(0, 10)
      merged.byDay[day] = { dailyTokens: 1000, appliedPoints: 10 }
    }
    seed[USAGE_LEDGER_STORAGE_KEY] = JSON.stringify(merged)
    const source = new DshUsageProgressSource({ storage, clock: clock('2026-12-30') })
    source.observe(list({ kept: { uncached: 10, output: 0 } }))
    expect(Object.keys(source.ledger.byDay).length).toBeLessThanOrEqual(90)
    expect(source.ledger.lastSeen.gone).toBeUndefined()
    expect(source.ledger.lastSeen.kept).toBe(10)
  })
})

describe('silent degradation (CTR-USG-010; ACC-USG-007)', () => {
  it('treats a missing tokenUsage key as no new counts and never seeds', () => {
    const source = new DshUsageProgressSource({ storage: fakeStorage(), clock: clock('2026-09-05') })
    source.observe(list({ s1: undefined, s2: { uncached: 5, output: 5 } }))
    expect(source.ledger.lastSeen.s1).toBeUndefined()
    expect(source.ledger.cumulativePoints).toBe(0)
  })

  it('degrades to memory when storage throws and keeps emitting', () => {
    const throwing: UsageLedgerStorage = {
      getItem: () => {
        throw new Error('unavailable')
      },
      setItem: () => {
        throw new Error('unavailable')
      },
    }
    const source = new DshUsageProgressSource({ storage: throwing, clock: clock('2026-09-05') })
    const seen = collector()
    source.subscribe(s => seen.seen.push(s))
    source.observe(list({ s1: { uncached: 1_000, output: 0 } })) // seed
    source.observe(list({ s1: { uncached: 6_000_000, output: 0 } })) // growth
    expect(seen.count()).toBe(2)
    expect(seen.last()!.progressPoints).toBe(3789)
  })

  it('re-baselines at current totals when the stored ledger is malformed', () => {
    const storage = fakeStorage({ [USAGE_LEDGER_STORAGE_KEY]: '{not json' })
    const source = new DshUsageProgressSource({ storage, clock: clock('2026-09-05') })
    source.observe(list({ s1: { uncached: 6_000_000, output: 0 } }))
    expect(source.ledger.cumulativePoints).toBe(0) // seeded silently, no attribution
    expect(source.ledger.lastSeen.s1).toBe(6_000_000)
  })
})

describe('host fold-state shape ({ totals: buckets })', () => {
  it('counts the live TokenUsageState wrapper shape (ACC-USG-004)', () => {
    const clock: UsageClock = { localDay: () => '2026-09-04', now: () => new Date('2026-09-04T10:00:00Z') }
    const source = new DshUsageProgressSource({ clock })
    const seen: Array<{ progressPoints: number; revision: number }> = []
    source.subscribe(snapshot => {
      const value = snapshot as { progressPoints: number; revision: number }
      seen.push({ progressPoints: value.progressPoints, revision: value.revision })
    })
    const state = {
      totals: { uncachedInputTokens: 100, outputTokens: 41, cacheReadTokens: 9_999 },
      last: null,
    }
    const list: UsageSessionListLike = {
      byId: { s1: { projectionValues: { tokenUsage: state as never } } },
    }
    source.observe(list)
    // First observation seeds silently (no backfill).
    expect(seen.every(s => s.progressPoints === 0)).toBe(true)
    const grown = {
      totals: { uncachedInputTokens: 5_000_000, outputTokens: 5_000_000, cacheReadTokens: 1 },
      last: null,
    }
    source.observe({ byId: { s1: { projectionValues: { tokenUsage: grown as never } } } })
    const applied = seen.at(-1)!
    // 10,000,000 counted tokens → floor(1350 × log2(11)) = 4668
    expect(applied.progressPoints).toBe(Math.floor(1_350 * Math.log2(11)))
    expect(applied.revision).toBe(1)
    source.dispose()
  })
})
