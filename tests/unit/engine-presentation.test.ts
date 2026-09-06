import { beforeEach, describe, expect, it } from 'vitest'
import { PetEngine, MemoryPetStorageAdapter, createMemoryBackingStore } from '../../src/engine'
import { fleetBundle, fixturePackBundle, snapshot, FailingClaimsStorage } from '../helpers/fixtures'

describe('ceremony once-semantics via atomic claim (CTR-PET-013, CTR-PET-014, ACC-PET-013/014)', () => {
  let storage: MemoryPetStorageAdapter
  let engine: PetEngine

  beforeEach(async () => {
    storage = new MemoryPetStorageAdapter()
    engine = new PetEngine({ bundles: [fleetBundle()], defaultPackId: 'autonomous-fleet', storage })
    await engine.initialize()
  })

  it('claims before presenting: won claims yield a merged ceremony', async () => {
    engine.ingestSnapshot(snapshot(0, 0))
    engine.ingestSnapshot(snapshot(60_000, 1)) // crosses l2, l3, l4
    const claimed = await engine.claimPendingCeremony()
    expect(claimed).not.toBeNull()
    expect(claimed!.receipts.map((r) => r.toLevelId)).toEqual(['l2', 'l3', 'l4'])
    expect(claimed!.plan.beats.length).toBeLessThanOrEqual(3)
    expect(claimed!.plan.totalMs).toBeLessThanOrEqual(3000)
    expect(claimed!.plan.skippable).toBe(true)
    engine.completeCeremony()
    expect(engine.getSnapshot().pendingReceipts).toEqual([])
  })

  it('a huge multi-level jump still merges into at most 3 beats within 3 seconds', async () => {
    engine.ingestSnapshot(snapshot(0, 0))
    engine.ingestSnapshot(snapshot(2_500_000, 1)) // 11 crossings
    const claimed = await engine.claimPendingCeremony()
    expect(claimed).not.toBeNull()
    expect(claimed!.receipts).toHaveLength(11)
    expect(claimed!.plan.beats.length).toBe(3)
    expect(claimed!.plan.totalMs).toBeLessThanOrEqual(3000)
  })

  it('page refresh / remount never replays a celebration', async () => {
    engine.ingestSnapshot(snapshot(0, 0))
    engine.ingestSnapshot(snapshot(10_000, 1))
    expect(await engine.claimPendingCeremony()).not.toBeNull()
    engine.completeCeremony()

    const remounted = new PetEngine({ bundles: [fleetBundle()], defaultPackId: 'autonomous-fleet', storage })
    await remounted.initialize()
    remounted.ingestSnapshot(snapshot(10_000, 1)) // same points after refresh: baseline
    await remounted.settled()
    expect(remounted.getSnapshot().pendingReceipts).toEqual([])
    expect(await remounted.claimPendingCeremony()).toBeNull()
  })

  it('duplicate snapshots never replay a ceremony', async () => {
    engine.ingestSnapshot(snapshot(0, 0))
    engine.ingestSnapshot(snapshot(10_000, 1))
    await engine.claimPendingCeremony()
    engine.completeCeremony()
    engine.ingestSnapshot(snapshot(10_000, 1)) // same revision duplicate → ignored
    expect(engine.getSnapshot().pendingReceipts).toEqual([])
  })

  it('storage failure during claim skips the celebration and never duplicates it', async () => {
    const failing = new FailingClaimsStorage()
    const engine2 = new PetEngine({ bundles: [fleetBundle()], defaultPackId: 'autonomous-fleet', storage: failing })
    await engine2.initialize()
    engine2.ingestSnapshot(snapshot(0, 0))
    engine2.ingestSnapshot(snapshot(10_000, 1))
    failing.failClaims = true
    const claimed = await engine2.claimPendingCeremony()
    expect(claimed).toBeNull() // skipped
    engine2.completeCeremony()
    // Recovery: even after the failure clears, that celebration is never replayed.
    failing.failClaims = false
    const remounted = new PetEngine({ bundles: [fleetBundle()], defaultPackId: 'autonomous-fleet', storage: failing })
    await remounted.initialize()
    remounted.ingestSnapshot(snapshot(10_000, 1))
    await remounted.settled()
    expect(remounted.getSnapshot().pendingReceipts).toEqual([])
    expect(await remounted.claimPendingCeremony()).toBeNull()
  })

  it('crash after claim but before presenting skips exactly that celebration', async () => {
    engine.ingestSnapshot(snapshot(0, 0))
    engine.ingestSnapshot(snapshot(30_000, 1))
    const claimed = await engine.claimPendingCeremony()
    expect(claimed).not.toBeNull()
    // Simulate a crash: a new engine over the same storage; the ceremony never replays.
    const afterCrash = new PetEngine({ bundles: [fleetBundle()], defaultPackId: 'autonomous-fleet', storage })
    await afterCrash.initialize()
    afterCrash.ingestSnapshot(snapshot(30_000, 1))
    await afterCrash.settled()
    expect(afterCrash.getSnapshot().viewModel?.derivedLevelId).toBe('l3') // final level renders regardless
    expect(await afterCrash.claimPendingCeremony()).toBeNull()
  })

  it('subject reset uses a new journal namespace', async () => {
    engine.ingestSnapshot(snapshot(0, 0))
    engine.ingestSnapshot(snapshot(10_000, 1))
    await engine.claimPendingCeremony()
    engine.completeCeremony()
    engine.ingestSnapshot(snapshot(10_000, 0, 'subject-2'))
    await engine.settled()
    const s2 = await storage.listConsumedReceipts('mock-progress', 'subject-2')
    expect(s2).toHaveLength(1) // baseline only
    // New subject can cross the same thresholds and celebrate again in its own namespace.
    engine.ingestSnapshot(snapshot(30_000, 1, 'subject-2'))
    const claimed = await engine.claimPendingCeremony()
    expect(claimed).not.toBeNull()
    expect(claimed!.receipts[0]!.receiptId.startsWith('mock-progress|subject-2|')).toBe(true)
  })
})

describe('daily greeting once-per-key (CTR-PET-028, ACC-PET-028)', () => {
  it('greets at most once per local day across mounts and tabs', async () => {
    const backing = createMemoryBackingStore()
    const now = () => new Date('2026-08-22T10:00:00')
    const tabA = new PetEngine({ bundles: [fleetBundle()], defaultPackId: 'autonomous-fleet', storage: new MemoryPetStorageAdapter(backing), now })
    await tabA.initialize()
    tabA.ingestSnapshot(snapshot(0, 0))
    expect(await tabA.claimDailyGreeting()).toEqual({ localDay: '2026-08-22' })
    expect(await tabA.claimDailyGreeting()).toBeNull()

    const tabB = new PetEngine({ bundles: [fleetBundle()], defaultPackId: 'autonomous-fleet', storage: new MemoryPetStorageAdapter(backing), now })
    await tabB.initialize()
    tabB.ingestSnapshot(snapshot(0, 0))
    expect(await tabB.claimDailyGreeting()).toBeNull()
  })

  it('greets again on the next local day and uses the device-local timezone', async () => {
    let clock = new Date('2026-08-22T23:59:00')
    const engine = new PetEngine({ bundles: [fleetBundle()], defaultPackId: 'autonomous-fleet', storage: new MemoryPetStorageAdapter(), now: () => clock })
    await engine.initialize()
    engine.ingestSnapshot(snapshot(0, 0))
    expect(await engine.claimDailyGreeting()).toEqual({ localDay: '2026-08-22' })
    clock = new Date('2026-08-23T00:01:00')
    expect(await engine.claimDailyGreeting()).toEqual({ localDay: '2026-08-23' })
  })
})

describe('keepsake lifecycle (CTR-PET-023, ACC-PET-023)', () => {
  it('unlocks keepsakes only on forward crossings within the same subject', async () => {
    const engine = new PetEngine({ bundles: [fleetBundle()], defaultPackId: 'autonomous-fleet', storage: new MemoryPetStorageAdapter() })
    await engine.initialize()
    engine.ingestSnapshot(snapshot(0, 0))
    await engine.settled()
    expect(engine.getSnapshot().unlockedKeepsakes).toEqual([]) // baseline unlocks nothing
    engine.ingestSnapshot(snapshot(60_000, 1)) // l2, l3, l4
    await engine.settled()
    const unlocked = engine.getSnapshot().unlockedKeepsakes.map((k) => k.keepsakeId)
    expect(unlocked).toEqual(['ks-l2', 'ks-l3', 'ks-l4'])
  })

  it('fleet unlocks all 11 keepsakes across the full journey', async () => {
    const engine = new PetEngine({ bundles: [fleetBundle()], defaultPackId: 'autonomous-fleet', storage: new MemoryPetStorageAdapter() })
    await engine.initialize()
    engine.ingestSnapshot(snapshot(0, 0))
    engine.ingestSnapshot(snapshot(2_500_000, 1))
    await engine.settled()
    expect(engine.getSnapshot().unlockedKeepsakes).toHaveLength(11)
  })

  it('pack switching never deletes existing keepsakes', async () => {
    const storage = new MemoryPetStorageAdapter()
    const engine = new PetEngine({ bundles: [fleetBundle(), fixturePackBundle()], defaultPackId: 'autonomous-fleet', storage })
    await engine.initialize()
    engine.ingestSnapshot(snapshot(0, 0))
    engine.ingestSnapshot(snapshot(30_000, 1))
    await engine.settled()
    await engine.setActivePack('fixture-garden')
    const unlocked = engine.getSnapshot().unlockedKeepsakes
    expect(unlocked.filter((k) => k.packId === 'autonomous-fleet')).toHaveLength(2)
  })

  it('new subjectId starts an empty keepsake namespace; old data is unreachable', async () => {
    const storage = new MemoryPetStorageAdapter()
    const engine = new PetEngine({ bundles: [fleetBundle()], defaultPackId: 'autonomous-fleet', storage })
    await engine.initialize()
    engine.ingestSnapshot(snapshot(0, 0))
    engine.ingestSnapshot(snapshot(10_000, 1))
    await engine.settled()
    engine.ingestSnapshot(snapshot(0, 0, 'subject-2'))
    await engine.settled()
    expect(engine.getSnapshot().unlockedKeepsakes).toEqual([])
    const old = await storage.listUnlockedKeepsakes('mock-progress', 'subject-1')
    expect(old).toHaveLength(1)
  })

  it('pack version change keys keepsakes under the new version domain', async () => {
    const backing = createMemoryBackingStore()
    const storage = new MemoryPetStorageAdapter(backing)
    const v1 = fleetBundle().manifestCandidate
    const v1Downgraded = JSON.parse(JSON.stringify(v1))
    v1Downgraded.packVersion = '1.0.0'
    const v2 = JSON.parse(JSON.stringify(v1))
    v2.packVersion = '2.0.0'

    const first = new PetEngine({ bundles: [{ manifestCandidate: v1Downgraded, resolveAssetUrl: fleetBundle().resolveAssetUrl }], defaultPackId: 'autonomous-fleet', storage })
    await first.initialize()
    first.ingestSnapshot(snapshot(0, 0))
    first.ingestSnapshot(snapshot(10_000, 1))
    await first.settled()

    const upgraded = new PetEngine({ bundles: [{ manifestCandidate: v2, resolveAssetUrl: fleetBundle().resolveAssetUrl }], defaultPackId: 'autonomous-fleet', storage })
    await upgraded.initialize()
    upgraded.ingestSnapshot(snapshot(10_000, 1))
    await upgraded.settled()
    expect(upgraded.getSnapshot().unlockedKeepsakes).toEqual([]) // no replay into the new version domain
    upgraded.ingestSnapshot(snapshot(30_000, 2))
    await upgraded.settled()
    const unlocked = upgraded.getSnapshot().unlockedKeepsakes
    // The old-version keepsake is retained; the new crossing keys under 2.0.0 only.
    const v2Unlocked = unlocked.filter((k) => k.packVersion === '2.0.0')
    expect(v2Unlocked).toHaveLength(1)
    expect(v2Unlocked[0]!.keepsakeId).toBe('ks-l3')
  })
})

describe('host activity events (CTR-PET-024, ACC-PET-024)', () => {
  it('shows distinguishable per-status feedback exactly once per eventId', () => {
    const engine = new PetEngine({ bundles: [fleetBundle()], defaultPackId: 'autonomous-fleet', storage: new MemoryPetStorageAdapter() })
    void engine.initialize()

    const completed = engine.dispatchHostActivity({ schemaVersion: 1, eventId: 'e1', activityId: 'task-a', status: 'completed', occurredAt: '2026-08-22T00:00:00Z' })
    expect(completed?.status).toBe('completed')
    expect(engine.getSnapshot().hostFeedback?.status).toBe('completed')

    const failed = engine.dispatchHostActivity({ schemaVersion: 1, eventId: 'e2', activityId: 'task-a', status: 'failed', occurredAt: '2026-08-22T00:00:01Z' })
    expect(failed?.status).toBe('failed')
    const cancelled = engine.dispatchHostActivity({ schemaVersion: 1, eventId: 'e3', activityId: 'task-a', status: 'cancelled', occurredAt: '2026-08-22T00:00:02Z' })
    expect(cancelled?.status).toBe('cancelled')

    expect(engine.dispatchHostActivity({ schemaVersion: 1, eventId: 'e1', activityId: 'task-a', status: 'completed', occurredAt: '2026-08-22T00:00:03Z' })).toBeNull()
    expect(engine.getSnapshot().hostFeedback?.status).toBe('cancelled')
    expect(engine.getSnapshot().diagnostics.some((d) => d.code === 'host-event-duplicate')).toBe(true)
  })

  it('rejects malformed events and never changes progress or issues receipts', async () => {
    const engine = new PetEngine({ bundles: [fleetBundle()], defaultPackId: 'autonomous-fleet', storage: new MemoryPetStorageAdapter() })
    await engine.initialize()
    engine.ingestSnapshot(snapshot(10_000, 1))
    const before = engine.getSnapshot()
    expect(engine.dispatchHostActivity({ schemaVersion: 1, eventId: 'EVIL', activityId: 'a', status: 'completed', occurredAt: 'x' })).toBeNull()
    expect(engine.dispatchHostActivity({ schemaVersion: 2, eventId: 'ok-id', activityId: 'a', status: 'completed', occurredAt: '2026-08-22T00:00:00Z' })).toBeNull()
    engine.dispatchHostActivity({ schemaVersion: 1, eventId: 'ok-id', activityId: 'a', status: 'completed', occurredAt: '2026-08-22T00:00:00Z' })
    const after = engine.getSnapshot()
    expect(after.viewModel?.progressPoints).toBe(before.viewModel?.progressPoints)
    expect(after.pendingReceipts).toEqual([])
  })

  it('clearHostFeedback resets the feedback region', () => {
    const engine = new PetEngine({ bundles: [fleetBundle()], defaultPackId: 'autonomous-fleet', storage: new MemoryPetStorageAdapter() })
    void engine.initialize()
    engine.dispatchHostActivity({ schemaVersion: 1, eventId: 'e9', activityId: 'a', status: 'completed', occurredAt: '2026-08-22T00:00:00Z' })
    expect(engine.getSnapshot().hostFeedback).not.toBeNull()
    engine.clearHostFeedback()
    expect(engine.getSnapshot().hostFeedback).toBeNull()
  })
})
