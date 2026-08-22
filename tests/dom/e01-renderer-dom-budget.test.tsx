import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildSceneRenderPlan, type PetPackManifestV1 } from '../../src/engine'
import fleetCandidate from '../../src/packs/autonomous-fleet/manifest.json'
import seedlingCandidate from '../../src/packs/seedling-fixture/manifest.json'
import { rendererContext } from './renderer-test-context'

const mocked = vi.hoisted(() => ({ context: null as unknown }))
vi.mock('../../src/react/PetEngineProvider', () => ({ usePetEngine: () => mocked.context }))
import { PetSceneRenderer } from '../../src/react/PetSceneRenderer'

afterEach(cleanup)

function manifest(candidate: unknown): PetPackManifestV1 {
  return candidate as PetPackManifestV1
}

describe('E01 actual mounted renderer budget', () => {
  it('keeps Fleet L8-L12 and seedling forest at <=64 DOM elements and <=32 representatives per population', () => {
    const fleet = manifest(fleetCandidate)
    const seedling = manifest(seedlingCandidate)
    const levels = [
      ...fleet.levels.filter((level) => /^l(?:8|9|10|11|12)$/.test(level.levelId)).map((level) => [fleet, level] as const),
      [seedling, seedling.levels.find((level) => level.levelId === 'forest')!] as const,
    ]

    for (const [pack, level] of levels) {
      const plan = buildSceneRenderPlan({ manifest: pack, level, locale: 'en' })
      mocked.context = rendererContext(pack, plan)
      const { container, unmount } = render(<PetSceneRenderer />)
      const scene = container.querySelector('.vp-scene')!
      expect(scene.querySelectorAll('*').length + 1, `${pack.packId}/${level.levelId}`).toBeLessThanOrEqual(64)
      const byPopulation = new Map<string, number>()
      const representatives = scene.querySelectorAll<HTMLElement>('[data-node-kind="population-representative"]')
      expect(representatives.length, `${pack.packId}/${level.levelId} representatives`).toBeGreaterThan(0)
      for (const element of representatives) {
        const populationKey = element.dataset.populationKey
        expect(populationKey, `${pack.packId}/${level.levelId} population key`).toBeTruthy()
        byPopulation.set(populationKey!, (byPopulation.get(populationKey!) ?? 0) + 1)
      }
      expect(byPopulation.size, `${pack.packId}/${level.levelId} populations`).toBeGreaterThan(0)
      for (const [populationKey, count] of byPopulation) {
        expect(count, `${pack.packId}/${level.levelId}/${populationKey}`).toBeLessThanOrEqual(32)
      }
      unmount()
    }
  })
})
