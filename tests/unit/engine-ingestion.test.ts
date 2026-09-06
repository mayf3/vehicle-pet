import { beforeEach, describe, expect, it } from 'vitest'
import { PetEngine, MemoryPetStorageAdapter } from '../../src/engine'
import { fleetBundle, snapshot } from '../helpers/fixtures'

let engine: PetEngine
let storage: MemoryPetStorageAdapter

beforeEach(async () => {
  storage = new MemoryPetStorageAdapter()
  engine = new PetEngine({ bundles: [fleetBundle()], defaultPackId: 'autonomous-fleet', storage })
  await engine.initialize()
})

describe('snapshot ingestion and ordering (CTR-PET-002, CTR-PET-026, ACC-PET-002/026)', () => {
  it('starts in waiting-for-valid-progress and becomes ready on the first valid snapshot', () => {
    expect(engine.getSnapshot().state).toBe('waiting-for-valid-progress')
    engine.ingestSnapshot(snapshot(0, 0))
    expect(engine.getSnapshot().state).toBe('ready')
    expect(engine.getSnapshot().viewModel?.derivedLevelId).toBe('l1')
  })

  it('rejects illegal snapshots entire: no clamping, rounding, or partial application', () => {
    engine.ingestSnapshot(snapshot(30_000, 3))
    const before = engine.getSnapshot()
    for (const bad of [
      { ...snapshot(99_999, 4), schemaVersion: 2 },
      { ...snapshot(-5, 4) },
      { ...snapshot(1.5, 4) },
      { ...snapshot(Number.NaN, 4) },
      { ...snapshot(2 ** 53, 4) },
      { ...snapshot(1, 4), progressPoints: undefined },
      { ...snapshot(1, 4), observedAt: 'nope' },
      { ...snapshot(1, 4), extra: true },
    ]) {
      engine.ingestSnapshot(bad)
    }
    const after = engine.getSnapshot()
    expect(after.viewModel).toEqual(before.viewModel)
    expect(after.plan).toEqual(before.plan)
    expect(after.pendingReceipts).toEqual([])
    expect(after.diagnostics.some((d) => d.code === 'invalid-snapshot')).toBe(true)
  })

  it('stays in waiting-for-valid-progress when every snapshot so far was illegal', () => {
    engine.ingestSnapshot({ ...snapshot(5, 0), schemaVersion: 9 })
    expect(engine.getSnapshot().state).toBe('waiting-for-valid-progress')
  })

  it('ignores stale, duplicate, and regressing snapshots with diagnostics', () => {
    engine.ingestSnapshot(snapshot(100_000, 5))
    engine.ingestSnapshot(snapshot(50_000, 4)) // stale revision
    engine.ingestSnapshot(snapshot(50_000, 5)) // duplicate/conflict revision
    engine.ingestSnapshot(snapshot(50_000, 6)) // regressing points
    const snap = engine.getSnapshot()
    expect(snap.viewModel?.progressPoints).toBe(100_000)
    expect(snap.viewModel?.revision).toBe(5)
    expect(snap.diagnostics.filter((d) => d.code === 'stale-snapshot').length).toBeGreaterThanOrEqual(1)
    expect(snap.diagnostics.filter((d) => d.code === 'regressing-points').length).toBe(1)
  })

  it('rejects a mid-session sourceId change as a configuration error', () => {
    engine.ingestSnapshot(snapshot(0, 0))
    engine.ingestSnapshot({ ...snapshot(100, 1), sourceId: 'other-source' })
    const snap = engine.getSnapshot()
    expect(snap.diagnostics.some((d) => d.code === 'source-mismatch')).toBe(true)
    expect(snap.viewModel?.sourceId).toBe('mock-progress')
  })

  it('keeps the last valid output on source error or temporary absence (no UI clearing)', () => {
    engine.ingestSnapshot(snapshot(60_000, 2))
    const before = engine.getSnapshot()
    // Simulate source error: garbage payloads instead of snapshots.
    engine.ingestSnapshot(null)
    engine.ingestSnapshot('error')
    const after = engine.getSnapshot()
    expect(after.viewModel).toEqual(before.viewModel)
    expect(after.plan).toEqual(before.plan)
  })

  it('never persists an authoritative snapshot or derived level: storage surface has no such record', async () => {
    engine.ingestSnapshot(snapshot(10_000, 1))
    await engine.settled()
    const store = (storage as unknown as { store: { journals: Map<string, unknown>; keepsakes: Set<string>; preferences: Map<string, string> } }).store
    for (const [key, record] of store.journals) {
      const text = JSON.stringify(record)
      expect(text.includes('progressPoints')).toBe(false)
      expect(text.includes('derivedLevel')).toBe(false)
      void key
    }
  })

  it('issues receipts only on forward threshold crossings', async () => {
    engine.ingestSnapshot(snapshot(0, 0))
    expect(engine.getSnapshot().pendingReceipts).toEqual([])
    engine.ingestSnapshot(snapshot(10_000, 1))
    let receipts = engine.getSnapshot().pendingReceipts
    expect(receipts).toHaveLength(1)
    expect(receipts[0]!.receiptId).toBe('mock-progress|subject-1|autonomous-fleet|2.0.0|l2')

    expect(await engine.claimPendingCeremony()).not.toBeNull()
    engine.completeCeremony()
    engine.ingestSnapshot(snapshot(10_500, 2)) // growth inside the level: no new receipt
    expect(engine.getSnapshot().pendingReceipts).toHaveLength(0)

    engine.ingestSnapshot(snapshot(65_000, 3)) // crosses l3 and l4
    receipts = engine.getSnapshot().pendingReceipts
    expect(receipts.map((r) => r.toLevelId)).toEqual(['l3', 'l4'])
  })

  it('a multi-level jump produces one receipt per crossed level with deterministic identity', () => {
    engine.ingestSnapshot(snapshot(0, 0))
    engine.ingestSnapshot(snapshot(2_500_000, 1))
    const receipts = engine.getSnapshot().pendingReceipts
    expect(receipts.map((r) => r.toLevelId)).toEqual(['l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9', 'l10', 'l11', 'l12'])
    for (const receipt of receipts) {
      expect(receipt.receiptId).toBe(`${receipt.sourceId}|${receipt.subjectId}|${receipt.packId}|${receipt.packVersion}|${receipt.toLevelId}`)
      expect(receipt.schemaVersion).toBe(1)
      expect(receipt.fromLevelId).toMatch(/^l\d+$/)
      expect(receipt.issuedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(receipt.revision).toBe(1)
    }
  })

  it('cold start at high progress establishes an already-presented baseline with no replay', async () => {
    engine.ingestSnapshot(snapshot(2_500_000, 0))
    await engine.settled()
    expect(engine.getSnapshot().pendingReceipts).toEqual([])
    const consumed = await storage.listConsumedReceipts('mock-progress', 'subject-1')
    expect(consumed).toHaveLength(11)
    const claimed = await engine.claimPendingCeremony()
    expect(claimed).toBeNull()
  })

  it('subject reset starts a new namespace with a fresh baseline', async () => {
    engine.ingestSnapshot(snapshot(10_000, 0))
    await engine.settled()
    engine.completeCeremony()
    engine.ingestSnapshot(snapshot(10_000, 0, 'subject-2'))
    await engine.settled()
    const s1 = await storage.listConsumedReceipts('mock-progress', 'subject-1')
    const s2 = await storage.listConsumedReceipts('mock-progress', 'subject-2')
    expect(s1.length).toBeGreaterThan(0)
    expect(s2.length).toBeGreaterThan(0)
    expect(engine.getSnapshot().viewModel?.subjectId).toBe('subject-2')
    // Old-subject data is unreachable for the new subject but not deleted.
    expect(s1.length).toBe(1)
    expect(s2.length).toBe(1)
  })
})
