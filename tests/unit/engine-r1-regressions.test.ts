import { describe, expect, it } from 'vitest'
import {
  MemoryPetStorageAdapter,
  PetEngine,
  createMemoryBackingStore,
  type ClaimResult,
  type PackBundleInput,
  type PetPackManifestV1,
} from '../../src/engine'
import { fixturePackBundle, snapshot } from '../helpers/fixtures'

class DeferredBatchStorage extends MemoryPetStorageAdapter {
  private releaseBatch!: () => void
  private markBatchStarted!: () => void
  readonly batchStarted = new Promise<void>((resolve) => {
    this.markBatchStarted = resolve
  })
  private readonly batchRelease = new Promise<void>((resolve) => {
    this.releaseBatch = resolve
  })

  release(): void {
    this.releaseBatch()
  }

  override async claimReceiptBatch(
    sourceId: string,
    subjectId: string,
    receiptIds: string[],
  ): Promise<ClaimResult> {
    this.markBatchStarted()
    await this.batchRelease
    return super.claimReceiptBatch(sourceId, subjectId, receiptIds)
  }
}

function invalidDefaultBundle() {
  return {
    manifestCandidate: { schemaVersion: 1, packId: 'autonomous-fleet' },
    resolveAssetUrl: () => undefined,
  }
}

function eightLevelBundle(): PackBundleInput {
  const baseBundle = fixturePackBundle()
  const base = JSON.parse(JSON.stringify(baseBundle.manifestCandidate)) as PetPackManifestV1
  base.packId = 'batch-fixture'
  base.levels = Array.from({ length: 8 }, (_, index) => {
    const number = index + 1
    return {
      levelId: `l${number}`,
      threshold: index * 100,
      stageName: { 'zh-CN': `阶段 ${number}`, en: `Level ${number}` },
      summary: { 'zh-CN': `阶段 ${number}`, en: `Level ${number}` },
      milestone: { 'zh-CN': `里程碑 ${number}`, en: `Milestone ${number}` },
      sceneId: 's-garden',
      presentation: { scale: 'individual', camera: 'close', milestone: 'inline' },
      ...(index === 0
        ? {}
        : {
            upgrade: { transition: 'crossfade', reveal: 'subject-swap', celebration: 'glow-pulse' },
            keepsakeId: `ks-l${number}`,
          }),
    }
  }) as PetPackManifestV1['levels']
  base.keepsakes = base.levels.slice(1).map((level) => ({
    keepsakeId: level.keepsakeId!,
    levelId: level.levelId,
    title: { 'zh-CN': level.levelId, en: level.levelId },
    accessDescription: { 'zh-CN': level.levelId, en: level.levelId },
    assetId: 'sprite-flower',
  }))
  return { manifestCandidate: base, resolveAssetUrl: baseBundle.resolveAssetUrl }
}

async function engineWithPendingBatch(storage: MemoryPetStorageAdapter): Promise<PetEngine> {
  const engine = new PetEngine({
    bundles: [eightLevelBundle(), fixturePackBundle()],
    defaultPackId: 'batch-fixture',
    storage,
  })
  await engine.initialize()
  engine.ingestSnapshot(snapshot(0, 0))
  engine.ingestSnapshot(snapshot(700, 1))
  return engine
}

async function engineAtL3(storage: MemoryPetStorageAdapter): Promise<PetEngine> {
  const engine = new PetEngine({
    bundles: [eightLevelBundle()],
    defaultPackId: 'batch-fixture',
    storage,
  })
  await engine.initialize()
  engine.ingestSnapshot(snapshot(200, 0))
  await engine.settled()
  engine.ingestSnapshot(snapshot(700, 1))
  return engine
}

describe('PR #3 R1 engine blocker regressions', () => {
  it('atomically chooses one exact L3-to-L8 batch winner across simulated tabs', async () => {
    const backing = createMemoryBackingStore()
    const tabA = await engineAtL3(new MemoryPetStorageAdapter(backing))
    const tabB = await engineAtL3(new MemoryPetStorageAdapter(backing))

    const [claimA, claimB] = await Promise.all([
      tabA.claimPendingCeremony(),
      tabB.claimPendingCeremony(),
    ])
    const winners = [claimA, claimB].filter((claim) => claim !== null)

    expect(winners).toHaveLength(1)
    expect(winners[0]!.receipts.map((receipt) => receipt.toLevelId)).toEqual(['l4', 'l5', 'l6', 'l7', 'l8'])
    expect(
      await new MemoryPetStorageAdapter(backing).listConsumedReceipts('mock-progress', 'subject-1'),
    ).toEqual([
      'mock-progress|subject-1|batch-fixture|1.0.0|l2',
      'mock-progress|subject-1|batch-fixture|1.0.0|l3',
      'mock-progress|subject-1|batch-fixture|1.0.0|l4',
      'mock-progress|subject-1|batch-fixture|1.0.0|l5',
      'mock-progress|subject-1|batch-fixture|1.0.0|l6',
      'mock-progress|subject-1|batch-fixture|1.0.0|l7',
      'mock-progress|subject-1|batch-fixture|1.0.0|l8',
    ])
  })

  it('forces pack-unavailable when the default is invalid despite a persisted valid alternate', async () => {
    const storage = new MemoryPetStorageAdapter()
    await storage.setActivePackId('fixture-garden')
    const engine = new PetEngine({
      bundles: [invalidDefaultBundle(), fixturePackBundle()],
      defaultPackId: 'autonomous-fleet',
      storage,
    })

    await engine.initialize()
    engine.ingestSnapshot(snapshot(100, 0))

    expect(engine.getSnapshot().state).toBe('pack-unavailable')
    expect(engine.getSnapshot().activePack).toBeNull()
    expect(engine.getSnapshot().lastValidSnapshot?.progressPoints).toBe(100)
    expect(engine.getSnapshot().pendingReceipts).toEqual([])
  })

  it('binds sourceId session-wide and rejects simultaneous source and subject change without progress or receipts', async () => {
    const engine = new PetEngine({
      bundles: [fixturePackBundle()],
      defaultPackId: 'fixture-garden',
      storage: new MemoryPetStorageAdapter(),
    })
    await engine.initialize()
    engine.ingestSnapshot(snapshot(100, 0, 'subject-1', 'source-a'))
    const pendingBefore = engine.getSnapshot().pendingReceipts

    engine.ingestSnapshot(snapshot(200, 0, 'subject-2', 'source-b'))

    const current = engine.getSnapshot()
    expect(current.lastValidSnapshot?.sourceId).toBe('source-a')
    expect(current.lastValidSnapshot?.subjectId).toBe('subject-1')
    expect(current.viewModel?.progressPoints).toBe(100)
    expect(current.pendingReceipts).toEqual(pendingBefore)
    expect(current.diagnostics.at(-1)?.code).toBe('source-mismatch')
  })

  it('invalidates an old in-flight ceremony when the subject resets', async () => {
    const storage = new DeferredBatchStorage()
    const engine = await engineWithPendingBatch(storage)
    const oldClaim = engine.claimPendingCeremony()
    await storage.batchStarted

    engine.ingestSnapshot(snapshot(0, 0, 'subject-2'))
    storage.release()

    expect(await oldClaim).toBeNull()
    expect(engine.getSnapshot().pendingReceipts).toEqual([])
    expect(engine.getSnapshot().lastValidSnapshot?.subjectId).toBe('subject-2')
  })

  it('invalidates an old in-flight ceremony when switching pack identity', async () => {
    const storage = new DeferredBatchStorage()
    const engine = await engineWithPendingBatch(storage)
    const oldClaim = engine.claimPendingCeremony()
    await storage.batchStarted

    expect(await engine.setActivePack('fixture-garden')).toBe(true)
    storage.release()

    expect(await oldClaim).toBeNull()
    expect(engine.getSnapshot().pendingReceipts).toEqual([])
    expect(engine.getSnapshot().activePack?.manifest.packId).toBe('fixture-garden')
  })

  it('starts a changed pack version in an isolated presentation domain', async () => {
    const backing = createMemoryBackingStore()
    const v1 = fixturePackBundle()
    const v2 = fixturePackBundle()
    ;(v2.manifestCandidate as PetPackManifestV1).packVersion = '2.0.0'
    const oldEngine = new PetEngine({
      bundles: [v1],
      defaultPackId: 'fixture-garden',
      storage: new MemoryPetStorageAdapter(backing),
    })
    await oldEngine.initialize()
    oldEngine.ingestSnapshot(snapshot(0, 0))
    oldEngine.ingestSnapshot(snapshot(100, 1))
    expect(oldEngine.getSnapshot().pendingReceipts).toHaveLength(1)

    const upgradedEngine = new PetEngine({
      bundles: [v2],
      defaultPackId: 'fixture-garden',
      storage: new MemoryPetStorageAdapter(backing),
    })
    await upgradedEngine.initialize()
    upgradedEngine.ingestSnapshot(snapshot(100, 1))
    await upgradedEngine.settled()

    expect(upgradedEngine.getSnapshot().viewModel?.packVersion).toBe('2.0.0')
    expect(upgradedEngine.getSnapshot().pendingReceipts).toEqual([])
    expect(await upgradedEngine.claimPendingCeremony()).toBeNull()
  })
})
