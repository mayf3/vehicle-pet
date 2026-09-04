/**
 * DshUsageProgressSource behavior tests (ACC-USG-002/005/006/007):
 * snapshot-seam validity, no-backfill attribution, monotone emission,
 * local-day ledgering, persistence merge-guard, and silent degradation.
 */

import { describe, expect, it } from 'vitest'
import { validateProgressSnapshot } from '../../../src/engine/validation/validate-snapshot'
import { DshUsageProgressSource, LocalStorageUsageLedgerStore, type UsageLedgerStore } from '../../../src/dsh/client/UsageProgressSource'
import { USAGE_SOURCE_ID, USAGE_SUBJECT_ID, emptyLedger, type UsageLedger } from '../../../src/dsh/client/usage-economy'


class MemoryLedgerStore implements UsageLedgerStore {
  stored: UsageLedger = emptyLedger()
  fail = false
  load(): UsageLedger {
    if (this.fail) return emptyLedger()
    return structuredClone(this.stored)
  }
  save(ledger: UsageLedger): UsageLedger {
    if (this.fail) return ledger
    this.stored = structuredClone(ledger)
    return structuredClone(ledger)
  }
}

function makeSource(options: {
  store?: UsageLedgerStore
  now?: () => Date
} = {}) {
  const store = options.store ?? new MemoryLedgerStore()
  const emitted: unknown[] = []
  const source = new DshUsageProgressSource({ store, now: options.now })
  const unsubscribe = source.subscribe((snapshot: unknown) => {
    emitted.push(snapshot)
  })
  return { source, store, emitted, unsubscribe }
}

function session(tokens: number | undefined) {
  return tokens === undefined
    ? {}
    : { projectionValues: { tokenUsage: { uncachedInputTokens: Math.floor(tokens / 2), outputTokens: tokens - Math.floor(tokens / 2), cacheReadTokens: 999_999 } } }
}

function listById(rows: Record<string, number | undefined>) {
  return {
    byId: Object.fromEntries(Object.entries(rows).map(([id, tokens]) => [id, session(tokens)])),
  }
}

/** Day 1 is 2026-09-04 local; day 2 is 2026-09-05 local. */
const DAY_1 = () => new Date(2026, 8, 4, 10, 0, 0)
const DAY_2 = () => new Date(2026, 8, 5, 9, 0, 0)

describe('snapshot seam (CTR-USG-002, ACC-USG-002)', () => {
  it('emits a valid ProgressSnapshotV1 immediately on subscribe', () => {
    const store = new MemoryLedgerStore()
    store.stored = { ...emptyLedger(), cumulativePoints: 12_345, revision: 4 }
    const { emitted, unsubscribe } = makeSource({ store })
    expect(emitted).toHaveLength(1)
    const validation = validateProgressSnapshot(emitted[0])
    expect(validation.ok).toBe(true)
    if (validation.ok) {
      expect(validation.snapshot.sourceId).toBe(USAGE_SOURCE_ID)
      expect(validation.snapshot.subjectId).toBe(USAGE_SUBJECT_ID)
      expect(validation.snapshot.progressPoints).toBe(12_345)
      expect(validation.snapshot.revision).toBe(4)
    }
    unsubscribe()
  })

  it('keeps every emission engine-valid, monotone in points and revision', () => {
    const clock = { value: DAY_1() }
    const { emitted, source, unsubscribe } = makeSource({ now: () => clock.value })
    source.observe(listById({ 's1': 0 }))
    source.observe(listById({ 's1': 2_000_000 }))
    source.observe(listById({ 's1': 3_000_000 }))
    expect(emitted.length).toBeGreaterThanOrEqual(2)
    let lastPoints = -1
    let lastRevision = -1
    for (const candidate of emitted) {
      const validation = validateProgressSnapshot(candidate)
      expect(validation.ok).toBe(true)
      if (validation.ok) {
        expect(validation.snapshot.progressPoints).toBeGreaterThanOrEqual(lastPoints)
        expect(validation.snapshot.revision).toBeGreaterThan(lastRevision)
        lastPoints = validation.snapshot.progressPoints
        lastRevision = validation.snapshot.revision
      }
    }
    unsubscribe()
  })
})

describe('attribution semantics (CTR-USG-006, ACC-USG-005)', () => {
  it('seeds the first observation without attributing history (no backfill)', () => {
    const { emitted, source, unsubscribe } = makeSource({ now: () => DAY_1() })
    source.observe(listById({ 's1': 13_000_000 }))
    expect(emitted).toHaveLength(1) // subscribe emission only; 0 points
    expect(validateProgressSnapshot(emitted[0]!).ok && (emitted[0] as { progressPoints: number }).progressPoints === 0).toBe(true)
    unsubscribe()
  })

  it('converts observed growth into exactly the frozen daily target', () => {
    const { emitted, source, unsubscribe } = makeSource({ now: () => DAY_1() })
    source.observe(listById({ 's1': 0 }))
    source.observe(listById({ 's1': 13_028_844 }))
    const applied = emitted.at(-1) as { progressPoints: number }
    expect(applied.progressPoints).toBe(5_143)
    unsubscribe()
  })

  it('aggregates growth across sessions on the same day', () => {
    const { emitted, source, unsubscribe } = makeSource({ now: () => DAY_1() })
    source.observe(listById({ 'a': 0, 'b': 0 }))
    source.observe(listById({ 'a': 500_000, 'b': 500_000 }))
    const applied = emitted.at(-1) as { progressPoints: number }
    // tokens(day) = 1,000,000 → floor(1350 * 1) = 1350
    expect(applied.progressPoints).toBe(1_350)
    unsubscribe()
  })

  it('applies incremental growth within a day against the pure target', () => {
    const { emitted, source, unsubscribe } = makeSource({ now: () => DAY_1() })
    source.observe(listById({ 's1': 0 }))
    source.observe(listById({ 's1': 250_000 }))
    source.observe(listById({ 's1': 750_000 }))
    const applied = emitted.at(-1) as { progressPoints: number }
    // cumulative tokens 750,000 → floor(target) = floor(1350*log2(1.75)) = 1139
    expect(applied.progressPoints).toBe(Math.floor(1_350 * Math.log2(1.75)))
    unsubscribe()
  })

  it('never attributes a projection regression (truncation/re-seed guard)', () => {
    const clock = { value: DAY_1() }
    const { emitted, source, unsubscribe } = makeSource({ now: () => clock.value })
    source.observe(listById({ 's1': 0 }))
    source.observe(listById({ 's1': 2_000_000 }))
    const before = (emitted.at(-1) as { progressPoints: number }).progressPoints
    source.observe(listById({ 's1': 500 }))
    source.observe(listById({ 's1': undefined }))
    const after = (emitted.at(-1) as { progressPoints: number }).progressPoints
    expect(after).toBe(before)
    unsubscribe()
  })

  it('emits nothing when usage is absent (NO_USAGE_NO_PROGRESS)', () => {
    const { emitted, source, unsubscribe } = makeSource({ now: () => DAY_1() })
    source.observe(listById({ 's1': 0 }))
    const count = emitted.length
    source.observe(listById({ 's1': 0 }))
    source.observe({ byId: {} })
    expect(emitted).toHaveLength(count)
    unsubscribe()
  })

  it('is silent when the tokenUsage capability is absent', () => {
    const { emitted, source, unsubscribe } = makeSource({ now: () => DAY_1() })
    source.observe({ byId: { 's1': {}, 's2': { projectionValues: {} } } })
    expect(emitted).toHaveLength(1)
    unsubscribe()
  })
})

describe('local-day ledger (CTR-USG-007, ACC-USG-005)', () => {
  it('starts a fresh daily target after the local day rolls over', () => {
    const clock = { value: DAY_1() }
    const { emitted, source, unsubscribe } = makeSource({ now: () => clock.value })
    source.observe(listById({ 's1': 0 }))
    source.observe(listById({ 's1': 13_028_844 }))
    clock.value = DAY_2()
    source.observe(listById({ 's1': 26_057_688 }))
    const applied = emitted.at(-1) as { progressPoints: number }
    // day2 target alone is 5,143 more (13,028,844 tokens again) — cumulative 10,286
    expect(applied.progressPoints).toBe(10_286)
    unsubscribe()
  })

  it('prunes absent sessions at a day boundary without double counting their return', () => {
    const clock = { value: DAY_1() }
    const { emitted, source, unsubscribe } = makeSource({ now: () => clock.value })
    source.observe(listById({ 's1': 0 }))
    source.observe(listById({ 's1': 1_000_000 }))
    const day1 = (emitted.at(-1) as { progressPoints: number }).progressPoints
    expect(day1).toBe(Math.floor(1_350 * Math.log2(2)))
    clock.value = DAY_2()
    source.observe({ byId: {} })
    const afterPrune = emitted.length
    source.observe(listById({ 's1': 1_500_000 }))
    // Re-seeded at 1.5M after pruning: no attribution, no new emission, and
    // the day-1 points stand.
    expect(emitted).toHaveLength(afterPrune)
    expect((emitted.at(-1) as { progressPoints: number }).progressPoints).toBe(day1)
    unsubscribe()
  })
})

describe('persistence and merge-guard (CTR-USG-009, ACC-USG-006)', () => {
  it('re-emits the persisted cumulative total after reload', () => {
    const store = new MemoryLedgerStore()
    const clock = { value: DAY_1() }
    const first = makeSource({ store, now: () => clock.value })
    first.source.observe(listById({ 's1': 0 }))
    first.source.observe(listById({ 's1': 13_028_844 }))
    first.unsubscribe()
    const second = makeSource({ store, now: () => clock.value })
    expect((second.emitted[0] as { progressPoints: number }).progressPoints).toBe(5_143)
    second.unsubscribe()
  })

  it('adopts the stored record after a concurrent newer write (merge-guard)', () => {
    const backing = new Map<string, string>()
    const store = new LocalStorageUsageLedgerStore({
      getItem: (key) => backing.get(key) ?? null,
      setItem: (key, value) => { backing.set(key, value) },
    })
    const source = new DshUsageProgressSource({ store, now: () => DAY_1() })
    source.subscribe(() => {})
    source.observe(listById({ 's1': 0 }))
    // Another tab (newer) wrote a higher record behind our back.
    backing.set('vehicle-pet/usage-ledger/v1', JSON.stringify({
      schemaVersion: 1,
      cumulativePoints: 50_000,
      revision: 40,
      byDay: { '2026-09-04': { tokens: 900_000, appliedPoints: 1_181 } },
      lastSeen: { 's1': 900_000 },
    }))
    source.observe(listById({ 's1': 100_000 }))
    // Our own gain computation ran on our stale ledger, but the merge-guard
    // keeps the field-wise maxima: nothing regresses.
    const persisted = store.load()
    expect(persisted.cumulativePoints).toBeGreaterThanOrEqual(50_000)
    expect(persisted.revision).toBeGreaterThanOrEqual(40)
    expect(persisted.lastSeen['s1']).toBe(900_000)
    source.dispose()
  })

  it('degrades to memory when storage fails, silently', () => {
    const store = new MemoryLedgerStore()
    store.fail = true
    const clock = { value: DAY_1() }
    const { emitted, source, unsubscribe } = makeSource({ store, now: () => clock.value })
    source.observe(listById({ 's1': 0 }))
    source.observe(listById({ 's1': 13_028_844 }))
    expect((emitted.at(-1) as { progressPoints: number }).progressPoints).toBe(5_143)
    unsubscribe()
  })

  it('LocalStorageUsageLedgerStore normalizes malformed records to empty', () => {
    const backing = new Map<string, string>()
    const store = new LocalStorageUsageLedgerStore({
      getItem: (key) => backing.get(key) ?? null,
      setItem: (key, value) => { backing.set(key, value) },
    })
    backing.set('vehicle-pet/usage-ledger/v1', '{not json')
    expect(store.load()).toEqual(emptyLedger())
  })
})

describe('lifecycle (CTR-USG-013)', () => {
  it('stops observing and emitting after dispose', () => {
    const { emitted, source, unsubscribe } = makeSource({ now: () => DAY_1() })
    source.observe(listById({ 's1': 0 }))
    source.dispose()
    source.observe(listById({ 's1': 13_028_844 }))
    const count = emitted.length
    source.observe(listById({ 's1': 26_057_688 }))
    expect(emitted).toHaveLength(count)
    unsubscribe()
  })
})
