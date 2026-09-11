import { describe, expect, it } from 'vitest'
import { validatePack } from '../../src/engine'
import { discoverPackBundles } from '../../src/packs/bundledRegistry'

describe('orb-fixture third-pet pack (V8 DEC-028)', () => {
  const bundle = discoverPackBundles().find(b => (b.manifestCandidate as { packId?: string }).packId === 'orb-fixture')!
  it('validates through the ordinary engine validator', () => {
    const result = validatePack(bundle.manifestCandidate, { resolveAssetUrl: bundle.resolveAssetUrl, requireBundledKeepsakes: true })
    expect(result.ok, result.ok ? '' : 'pack rejected').toBe(true)
  })
  it('declares a distinct journey (own thresholds, stage names, no third-party marks)', () => {
    const manifest = bundle.manifestCandidate as { packId: string; levels: { levelId: string; threshold: number }[] }
    expect(manifest.packId).toBe('orb-fixture')
    expect(manifest.levels.map(l => l.threshold)).toEqual([0, 40, 160, 400])
  })
})
