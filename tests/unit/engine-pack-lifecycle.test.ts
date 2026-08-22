import { describe, expect, it } from 'vitest'
import { PetEngine, MemoryPetStorageAdapter, createMemoryBackingStore } from '../../src/engine'
import { fleetBundle, fixturePackBundle, snapshot } from '../helpers/fixtures'

describe('pack lifecycle (CTR-PET-005, CTR-PET-006, CTR-PET-025, CTR-PET-029)', () => {
  it('keeps exactly one active pack and defaults to autonomous-fleet', async () => {
    const storage = new MemoryPetStorageAdapter()
    const engine = new PetEngine({ bundles: [fleetBundle(), fixturePackBundle()], defaultPackId: 'autonomous-fleet', storage })
    await engine.initialize()
    expect(engine.getSnapshot().activePack?.manifest.packId).toBe('autonomous-fleet')
    expect(engine.getSnapshot().availablePacks.map((p) => p.manifest.packId).sort()).toEqual(['autonomous-fleet', 'fixture-garden'])
  })

  it('persists activePackId across engine restarts and survives subject reset', async () => {
    const backing = createMemoryBackingStore()
    const first = new PetEngine({ bundles: [fleetBundle(), fixturePackBundle()], defaultPackId: 'autonomous-fleet', storage: new MemoryPetStorageAdapter(backing) })
    await first.initialize()
    first.ingestSnapshot(snapshot(10_000, 0))
    expect(await first.setActivePack('fixture-garden')).toBe(true)

    const second = new PetEngine({ bundles: [fleetBundle(), fixturePackBundle()], defaultPackId: 'autonomous-fleet', storage: new MemoryPetStorageAdapter(backing) })
    await second.initialize()
    expect(second.getSnapshot().activePack?.manifest.packId).toBe('fixture-garden')
    second.ingestSnapshot(snapshot(10_000, 0, 'subject-9'))
    expect(second.getSnapshot().activePack?.manifest.packId).toBe('fixture-garden')
  })

  it('a failed switch keeps the last valid pack and progress unchanged', async () => {
    const storage = new MemoryPetStorageAdapter()
    const engine = new PetEngine({ bundles: [fleetBundle()], defaultPackId: 'autonomous-fleet', storage })
    await engine.initialize()
    engine.ingestSnapshot(snapshot(100_000, 3))
    expect(await engine.setActivePack('not-a-registered-pack')).toBe(false)
    const snap = engine.getSnapshot()
    expect(snap.activePack?.manifest.packId).toBe('autonomous-fleet')
    expect(snap.viewModel?.progressPoints).toBe(100_000)
    expect(snap.diagnostics.some((d) => d.code === 'pack-switch-rejected')).toBe(true)
  })

  it('invalid bundled packs never register; invalid startup pack falls back to the default', async () => {
    const invalidBundle = { manifestCandidate: { schemaVersion: 1, packId: 'broken-pack' }, resolveAssetUrl: () => undefined }
    const storage = new MemoryPetStorageAdapter()
    await storage.setActivePackId('broken-pack')
    const engine = new PetEngine({ bundles: [invalidBundle, fleetBundle()], defaultPackId: 'autonomous-fleet', storage })
    await engine.initialize()
    const snap = engine.getSnapshot()
    expect(snap.activePack?.manifest.packId).toBe('autonomous-fleet')
    expect(snap.availablePacks.map((p) => p.manifest.packId)).toEqual(['autonomous-fleet'])
    expect(snap.diagnostics.some((d) => d.code === 'pack-invalid')).toBe(true)
    expect(snap.diagnostics.some((d) => d.code === 'pack-startup-invalid')).toBe(true)
  })

  it('pack-unavailable terminal state when the default itself is invalid: no crash, no loop, no receipts', async () => {
    const invalidBundle = { manifestCandidate: { schemaVersion: 1, packId: 'broken-pack' }, resolveAssetUrl: () => undefined }
    const engine = new PetEngine({ bundles: [invalidBundle], defaultPackId: 'autonomous-fleet', storage: new MemoryPetStorageAdapter() })
    await engine.initialize()
    expect(engine.getSnapshot().state).toBe('pack-unavailable')
    engine.ingestSnapshot(snapshot(500_000, 1))
    const snap = engine.getSnapshot()
    expect(snap.state).toBe('pack-unavailable')
    expect(snap.viewModel).toBeNull()
    expect(snap.lastValidSnapshot?.progressPoints).toBe(500_000)
    expect(snap.pendingReceipts).toEqual([])
  })

  it('switching shares progressPoints and never resets, copies, or forks', async () => {
    const engine = new PetEngine({ bundles: [fleetBundle(), fixturePackBundle()], defaultPackId: 'autonomous-fleet', storage: new MemoryPetStorageAdapter() })
    await engine.initialize()
    engine.ingestSnapshot(snapshot(120_000, 4))
    await engine.setActivePack('fixture-garden')
    let snap = engine.getSnapshot()
    expect(snap.activePack?.manifest.packId).toBe('fixture-garden')
    expect(snap.viewModel?.progressPoints).toBe(120_000)
    await engine.setActivePack('autonomous-fleet')
    snap = engine.getSnapshot()
    expect(snap.activePack?.manifest.packId).toBe('autonomous-fleet')
    expect(snap.viewModel?.progressPoints).toBe(120_000)
    expect(snap.viewModel?.derivedLevelId).toBe('l5')
  })

  it('silent round-trip switching at fixed progress issues zero receipts and zero ceremonies', async () => {
    const engine = new PetEngine({ bundles: [fleetBundle(), fixturePackBundle()], defaultPackId: 'autonomous-fleet', storage: new MemoryPetStorageAdapter() })
    await engine.initialize()
    engine.ingestSnapshot(snapshot(120_000, 4))
    await engine.settled()
    engine.completeCeremony()
    await engine.setActivePack('fixture-garden')
    await engine.settled()
    await engine.setActivePack('autonomous-fleet')
    await engine.settled()
    expect(engine.getSnapshot().pendingReceipts).toEqual([])
    expect(await engine.claimPendingCeremony()).toBeNull()
    // The current derived level in each visited pack domain is marked presented.
    const consumed = await (engine as unknown as { storage: MemoryPetStorageAdapter }).storage.listConsumedReceipts('mock-progress', 'subject-1')
    expect(consumed.some((r) => r.includes('fixture-garden'))).toBe(true)
    expect(consumed.some((r) => r.endsWith('|l5') && r.includes('autonomous-fleet'))).toBe(true)
  })

  it('pack version change initializes the current level as already presented without replay', async () => {
    const backing = createMemoryBackingStore()
    const storage = new MemoryPetStorageAdapter(backing)
    const v1 = JSON.parse(JSON.stringify(fleetBundle().manifestCandidate))
    const v2 = JSON.parse(JSON.stringify(fleetBundle().manifestCandidate))
    v2.packVersion = '2.0.0'

    const first = new PetEngine({ bundles: [{ manifestCandidate: v1, resolveAssetUrl: fleetBundle().resolveAssetUrl }], defaultPackId: 'autonomous-fleet', storage })
    await first.initialize()
    first.ingestSnapshot(snapshot(60_000, 1))
    await first.settled()
    first.completeCeremony()
    expect(first.getSnapshot().viewModel?.packVersion).toBe('1.0.0')

    const upgraded = new PetEngine({ bundles: [{ manifestCandidate: v2, resolveAssetUrl: fleetBundle().resolveAssetUrl }], defaultPackId: 'autonomous-fleet', storage })
    await upgraded.initialize()
    upgraded.ingestSnapshot(snapshot(60_000, 1))
    await upgraded.settled()
    const snap = upgraded.getSnapshot()
    expect(snap.viewModel?.packVersion).toBe('2.0.0')
    expect(snap.viewModel?.derivedLevelId).toBe('l4')
    expect(snap.pendingReceipts).toEqual([])
    expect(await upgraded.claimPendingCeremony()).toBeNull()
  })
})
