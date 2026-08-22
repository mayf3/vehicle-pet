import { describe, expect, it } from 'vitest'
import { buildSceneRenderPlan, type PetPackManifestV1 } from '../../src/engine'
import { fixturePackBundle } from '../helpers/fixtures'

function manifestWithSwapAsset(): PetPackManifestV1 {
  const manifest = structuredClone(fixturePackBundle().manifestCandidate) as PetPackManifestV1
  manifest.assets.push({
    assetId: 'sprite-bloom-reveal',
    path: 'assets/fixture-garden/sprite-bloom-reveal.webp',
    format: 'webp',
    role: 'sprite',
    width: 320,
    height: 320,
    byteSizeCompressed: 500,
    altText: { 'zh-CN': '绽放后的花', en: 'the flower after blooming' },
  })
  manifest.keepsakes!.find((keepsake) => keepsake.keepsakeId === 'ks-bloom')!.assetId = 'sprite-bloom-reveal'
  return manifest
}

function subjectAsset(manifest: PetPackManifestV1): { assetId: string | null; altText: string | null } {
  const level = manifest.levels.find((candidate) => candidate.levelId === 'bloom')!
  const plan = buildSceneRenderPlan({ manifest, level, locale: 'en' })
  const subject = plan.nodes.find((node) => node.kind === 'subject')!
  return { assetId: subject.assetId, altText: subject.altText }
}

describe('E06 generic subject-swap reveal consumption', () => {
  it('replaces only the subject with the current level keepsake asset and its localized alt text', () => {
    const manifest = manifestWithSwapAsset()
    expect(subjectAsset(manifest)).toEqual({
      assetId: 'sprite-bloom-reveal',
      altText: 'the flower after blooming',
    })
  })

  it('keeps the frozen scene subject asset for every non-subject-swap reveal', () => {
    const manifest = manifestWithSwapAsset()
    const level = manifest.levels.find((candidate) => candidate.levelId === 'bloom')!
    level.upgrade!.reveal = 'scene-expand'
    expect(subjectAsset(manifest)).toEqual({ assetId: 'sprite-flower', altText: 'a flower' })
  })

  it('falls back to the scene subject when the level keepsake has no usable asset', () => {
    const withoutReference = manifestWithSwapAsset()
    delete withoutReference.keepsakes!.find((keepsake) => keepsake.keepsakeId === 'ks-bloom')!.assetId
    expect(subjectAsset(withoutReference).assetId).toBe('sprite-flower')

    const missingAsset = manifestWithSwapAsset()
    missingAsset.keepsakes!.find((keepsake) => keepsake.keepsakeId === 'ks-bloom')!.assetId = 'not-declared'
    expect(subjectAsset(missingAsset).assetId).toBe('sprite-flower')
  })
})
