import { describe, expect, it } from 'vitest'
import { buildSceneRenderPlan, derivePetViewModel, validatePack } from '../../src/engine'
import { discoverPackBundles } from '../../src/packs/bundledRegistry'

const bundlesById = new Map(discoverPackBundles().map(bundle => [(bundle.manifestCandidate as { packId: string }).packId, bundle]))
const autonomousFleetBundle = bundlesById.get('autonomous-fleet')!
const seedlingFixtureBundle = bundlesById.get('seedling-fixture')!

describe('seedling-fixture same-engine conformance (CTR-PET-011)', () => {
  const validatedFleet = validatePack(autonomousFleetBundle.manifestCandidate, {
    resolveAssetUrl: autonomousFleetBundle.resolveAssetUrl,
    requireBundledKeepsakes: true,
  })
  const validatedSeedling = validatePack(seedlingFixtureBundle.manifestCandidate, {
    resolveAssetUrl: seedlingFixtureBundle.resolveAssetUrl,
    requireBundledKeepsakes: true,
  })

  it('passes the exact same strict validator as autonomous-fleet', () => {
    expect(validatedFleet.ok).toBe(true)
    expect(validatedSeedling.ok).toBe(true)
  })

  it('freezes seed, sprout, tree, forest thresholds and three keepsakes', () => {
    if (!validatedSeedling.ok) throw new Error(validatedSeedling.errors.join('\n'))
    expect(validatedSeedling.manifest.levels.map((level) => [level.levelId, level.threshold])).toEqual([
      ['seed', 0],
      ['sprout', 10_000],
      ['tree', 60_000],
      ['forest', 300_000],
    ])
    expect(validatedSeedling.manifest.keepsakes).toHaveLength(3)
  })

  it.each([
    [0, 'seed'],
    [9_999, 'seed'],
    [10_000, 'sprout'],
    [59_999, 'sprout'],
    [60_000, 'tree'],
    [299_999, 'tree'],
    [300_000, 'forest'],
    [Number.MAX_SAFE_INTEGER, 'forest'],
  ])('derives %i through the shared derive function as %s', (points, expectedLevel) => {
    if (!validatedSeedling.ok) throw new Error(validatedSeedling.errors.join('\n'))
    const viewModel = derivePetViewModel({
      sourceId: 'mock-progress',
      subjectId: 'seed-subject',
      progressPoints: points,
      revision: 1,
      pack: validatedSeedling.manifest,
      locale: 'zh-CN',
      reducedMotion: false,
    })
    expect(viewModel.derivedLevelId).toBe(expectedLevel)
  })

  it('renders every seedling scene through the shared deterministic RenderPlan', () => {
    if (!validatedSeedling.ok) throw new Error(validatedSeedling.errors.join('\n'))
    for (const level of validatedSeedling.manifest.levels) {
      const first = buildSceneRenderPlan({ manifest: validatedSeedling.manifest, level, locale: 'en' })
      const second = buildSceneRenderPlan({ manifest: validatedSeedling.manifest, level, locale: 'en' })
      expect(JSON.stringify(first)).toBe(JSON.stringify(second))
      expect(first.nodes.some((node) => node.kind === 'subject' && node.altText !== null)).toBe(true)
      expect(first.nodes.length).toBeLessThanOrEqual(64)
    }
  })

  it('preserves one aggregate label with logical count 1000 in forest', () => {
    if (!validatedSeedling.ok) throw new Error(validatedSeedling.errors.join('\n'))
    const forest = validatedSeedling.manifest.levels.find((level) => level.levelId === 'forest')!
    const plan = buildSceneRenderPlan({ manifest: validatedSeedling.manifest, level: forest, locale: 'en' })
    const aggregate = plan.nodes.filter((node) => node.kind === 'aggregate-label')
    expect(aggregate).toHaveLength(1)
    expect(aggregate[0]?.logicalCount).toBe(1000)
    expect(aggregate[0]?.text).toBe('1000 trees')
    expect(plan.nodes.filter((node) => node.kind === 'population-representative').every((node) => node.ariaHidden && node.altText === null)).toBe(true)
  })

  it('uses deterministic zh-CN fallback when an English key is absent', () => {
    if (!validatedSeedling.ok) throw new Error(validatedSeedling.errors.join('\n'))
    const copy = structuredClone(validatedSeedling.manifest)
    delete copy.levels[0]!.summary.en
    const revalidated = validatePack(copy, { requireBundledKeepsakes: true })
    expect(revalidated.ok).toBe(true)
    if (!revalidated.ok) return
    const viewModel = derivePetViewModel({ sourceId: 'mock-progress', subjectId: 'seed-subject', progressPoints: 0, revision: 0, pack: revalidated.manifest, locale: 'en', reducedMotion: false })
    expect(viewModel.derivedLevelId).toBe('seed')
    expect(revalidated.manifest.levels[0]!.summary['zh-CN']).toBe('一颗安静积蓄力量的种子。')
  })
})
