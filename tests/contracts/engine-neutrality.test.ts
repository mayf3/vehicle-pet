import { describe, expect, it } from 'vitest'
import {
  PetEngine,
  MemoryPetStorageAdapter,
  buildSceneRenderPlan,
  buildStructureFingerprint,
  structuralDifferenceCount,
  validatePack,
  deriveProgress,
} from '../../src/engine'
import { fleetBundle, fixturePackBundle } from '../helpers/fixtures'

/**
 * Engine neutrality conformance (CTR-PET-011, ACC-PET-011):
 * a second domain validates, derives, and renders through the exact same
 * validator, derivation, and renderer with no engine branch. The bundled
 * seedling-fixture pack (when present) is covered by the same loop below.
 */

describe('one engine for every bundled pack (CTR-PET-001/007/011)', () => {
  const bundles = [fleetBundle(), fixturePackBundle()]

  it('all bundled packs pass the same validator', () => {
    for (const bundle of bundles) {
      const result = validatePack(bundle.manifestCandidate, {
        resolveAssetUrl: bundle.resolveAssetUrl,
        requireBundledKeepsakes: true,
      })
      expect(result.ok, result.ok ? '' : result.errors.join('; ')).toBe(true)
    }
  })

  it('all bundled packs derive through the same pure functions', () => {
    for (const bundle of bundles) {
      const result = validatePack(bundle.manifestCandidate, { requireBundledKeepsakes: true })!
      if (!result.ok) throw new Error(result.errors.join('; '))
      const derived = deriveProgress(Number.MAX_SAFE_INTEGER, result.manifest)
      expect(derived.capped).toBe(true)
      expect(derived.nextLevelId).toBeNull()
    }
  })

  it('all bundled packs render through the same generic plan builder', () => {
    for (const bundle of bundles) {
      const result = validatePack(bundle.manifestCandidate, { requireBundledKeepsakes: true })!
      if (!result.ok) throw new Error(result.errors.join('; '))
      for (const level of result.manifest.levels) {
        const plan = buildSceneRenderPlan({ manifest: result.manifest, level, locale: 'zh-CN' })
        expect(plan.packId).toBe(result.manifest.packId)
        expect(plan.nodes.length).toBeLessThanOrEqual(64)
      }
    }
  })

  it('the second domain runs the full engine lifecycle without engine edits', async () => {
    const storage = new MemoryPetStorageAdapter()
    const engine = new PetEngine({ bundles, defaultPackId: 'autonomous-fleet', storage })
    await engine.initialize()
    engine.ingestSnapshot({ schemaVersion: 1, sourceId: 'mock-progress', subjectId: 'subject-1', progressPoints: 0, revision: 0, observedAt: '2026-08-22T00:00:00Z' })
    expect(await engine.setActivePack('fixture-garden')).toBe(true)
    engine.ingestSnapshot({ schemaVersion: 1, sourceId: 'mock-progress', subjectId: 'subject-1', progressPoints: 120, revision: 1, observedAt: '2026-08-22T00:00:01Z' })
    await engine.settled()
    const snap = engine.getSnapshot()
    expect(snap.activePack?.manifest.packId).toBe('fixture-garden')
    expect(snap.viewModel?.derivedLevelId).toBe('bloom')
    const claimed = await engine.claimPendingCeremony()
    expect(claimed).not.toBeNull()
    expect(claimed!.receipts[0]!.toLevelId).toBe('bloom')
    const unlocked = snap.unlockedKeepsakes.map((k) => k.keepsakeId)
    expect(unlocked).toContain('ks-bloom')
  })

  it('structural fingerprints come from one implementation for every pack', () => {
    for (const bundle of bundles) {
      const result = validatePack(bundle.manifestCandidate, { requireBundledKeepsakes: true })!
      if (!result.ok) throw new Error(result.errors.join('; '))
      const levels = result.manifest.levels
      for (let i = 0; i < levels.length - 1; i++) {
        const a = buildStructureFingerprint(result.manifest, levels[i]!)
        const b = buildStructureFingerprint(result.manifest, levels[i + 1]!)
        void structuralDifferenceCount(a, b)
      }
    }
  })
})
