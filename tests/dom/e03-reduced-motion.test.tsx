import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildSceneRenderPlan, type PetPackManifestV1 } from '../../src/engine'
import fleetCandidate from '../../src/packs/autonomous-fleet/manifest.json'
import { rendererContext } from './renderer-test-context'

const mocked = vi.hoisted(() => ({ context: null as unknown }))
vi.mock('../../src/react/PetEngineProvider', () => ({ usePetEngine: () => mocked.context }))
import { PetSceneRenderer } from '../../src/react/PetSceneRenderer'
import { UpgradeCeremony } from '../../src/react/UpgradeCeremony'
import { EngineStyles } from '../../src/react/styles'

afterEach(cleanup)

describe('E03 reduced motion mechanics', () => {
  it('removes motion while preserving the static centring transform', () => {
    const manifest = fleetCandidate as PetPackManifestV1
    const level = manifest.levels.find((candidate) => candidate.levelId === 'l12')!
    const plan = buildSceneRenderPlan({ manifest, level, locale: 'en' })
    mocked.context = rendererContext(manifest, plan, true)
    const { container } = render(<><EngineStyles /><PetSceneRenderer /></>)
    const scene = container.querySelector<HTMLElement>('.vp-scene')!
    fireEvent.click(container.querySelector('[data-pet-subject="true"]')!)

    for (const element of [scene, ...scene.querySelectorAll<HTMLElement>('*')]) {
      const computed = getComputedStyle(element)
      expect(computed.animationName).toMatch(/^(|none)$/)
      expect(computed.translate).toMatch(/^(|none)$/)
    }
    const positioned = scene.querySelectorAll<HTMLElement>('.vp-node')
    expect(positioned.length).toBeGreaterThan(0)
    for (const element of positioned) {
      expect(element.style.transform).toBe('translate(-50%, -50%)')
    }
    expect(scene.getAttribute('data-camera-zoom-permille')).toBe('220')
    expect(scene.querySelectorAll('svg')).toHaveLength(0)
    expect(scene.querySelectorAll('[class*="particle"], [class*="bounce"]')).toHaveLength(0)
  })

  it('removes the inherited greeting translate animation from the reduced ceremony itself', () => {
    mocked.context = {
      snapshot: { reducedMotion: true },
      ceremony: {
        plan: {
          beats: [{ levelId: 'l8', stageName: 'City', milestone: 'Reached city scale' }],
          totalMs: 3000,
        },
        receipts: [],
      },
      skipCeremony: vi.fn(),
      copy: { upgradeTo: 'Upgraded', skip: 'Skip' },
    }
    const { container } = render(<><EngineStyles /><UpgradeCeremony /></>)
    const ceremony = container.querySelector<HTMLElement>('.vp-ceremony')!
    const inner = container.querySelector<HTMLElement>('.vp-ceremony-inner')!

    expect(inner).toHaveClass('vp-ceremony-inner-reduced')
    for (const element of [ceremony, ...ceremony.querySelectorAll<HTMLElement>('*')]) {
      const computed = getComputedStyle(element)
      expect(computed.animationName).toMatch(/^(|none)$/)
      expect(computed.transform).toMatch(/^(|none)$/)
      expect(computed.translate).toMatch(/^(|none)$/)
      expect(computed.scale).toMatch(/^(|none)$/)
    }
    expect(ceremony.querySelectorAll('[class*="particle"], [class*="bounce"], [class*="spark"], [class*="confetti"]')).toHaveLength(0)
  })
})
