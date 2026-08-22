import { describe, expect, it } from 'vitest'
import { PackRegistry, type PetPackManifestV1 } from '../../src/engine'
import { fixturePackBundle } from '../helpers/fixtures'

describe('immutable Pack manifest registry (E05)', () => {
  it('owns a deep immutable copy instead of retaining the input manifest', () => {
    const bundle = fixturePackBundle()
    const input = bundle.manifestCandidate as PetPackManifestV1
    const { registry, diagnostics } = PackRegistry.create([bundle], () => new Date('2026-08-22T00:00:00Z'))
    const registered = registry.get('fixture-garden')!

    input.name.en = 'mutated input name'
    input.levels[0]!.stageName.en = 'mutated input level'
    input.levels.push({ ...input.levels[0]!, levelId: 'injected', threshold: 999 })

    expect(diagnostics).toEqual([])
    expect(registered.manifest.name.en).toBe('Fixture Garden')
    expect(registered.manifest.levels[0]!.stageName.en).toBe('Bud')
    expect(registered.manifest.levels).toHaveLength(2)
  })

  it('deep-freezes manifests and registered wrappers exposed by get and list', () => {
    const { registry } = PackRegistry.create(
      [fixturePackBundle()],
      () => new Date('2026-08-22T00:00:00Z'),
    )
    const fromGet = registry.get('fixture-garden')!
    const fromList = registry.list()[0]!

    expect(Object.isFrozen(fromGet)).toBe(true)
    expect(Object.isFrozen(fromGet.manifest)).toBe(true)
    expect(Object.isFrozen(fromGet.manifest.levels)).toBe(true)
    expect(Object.isFrozen(fromGet.manifest.levels[0]!.stageName)).toBe(true)
    expect(() => {
      ;(fromGet.manifest.name as { en: string }).en = 'mutated registry name'
    }).toThrow(TypeError)
    expect(() => {
      ;(fromList.manifest.levels as PetPackManifestV1['levels']).push(fromList.manifest.levels[0]!)
    }).toThrow(TypeError)
    expect(registry.get('fixture-garden')!.manifest.name.en).toBe('Fixture Garden')
    expect(registry.get('fixture-garden')!.manifest.levels).toHaveLength(2)
  })
})
