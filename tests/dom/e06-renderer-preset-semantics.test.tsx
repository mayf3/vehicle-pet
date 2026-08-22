import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildSceneRenderPlan, placementPoint, type PetPackManifestV1 } from '../../src/engine'
import fleetCandidate from '../../src/packs/autonomous-fleet/manifest.json'
import { rendererContext } from './renderer-test-context'

const mocked = vi.hoisted(() => ({ context: null as unknown }))
vi.mock('../../src/react/PetEngineProvider', () => ({ usePetEngine: () => mocked.context }))
import { PetSceneRenderer } from '../../src/react/PetSceneRenderer'
import { EngineStyles } from '../../src/react/styles'

afterEach(cleanup)

const sceneTransitions = ['instant', 'crossfade', 'zoom-out', 'layer-build'] as const
const upgradeTransitions = ['instant', 'crossfade', 'layer-build', 'camera-step-out'] as const
const reveals = ['subject-swap', 'scene-expand', 'milestone-card', 'collection-add'] as const
const celebrations = ['glow-pulse', 'spark-burst', 'confetti-lite', 'ambient-highlight'] as const
const placements = ['center', 'edge-left', 'edge-right', 'top-strip', 'bottom-strip', 'grid-even', 'ring', 'horizon-band'] as const

describe('E06 renderer preset semantics', () => {
  it('maps every whitelisted transition, reveal, and celebration value to a live renderer class', () => {
    const base = fleetCandidate as PetPackManifestV1
    const styleMarkup = render(<EngineStyles />).container.textContent ?? ''

    for (let index = 0; index < 4; index++) {
      const manifest = structuredClone(base) as PetPackManifestV1
      const level = manifest.levels[7]!
      const scene = manifest.scenes.find((candidate) => candidate.sceneId === level.sceneId)!
      scene.transition = sceneTransitions[index]!
      level.upgrade = {
        transition: upgradeTransitions[index]!,
        reveal: reveals[index]!,
        celebration: celebrations[index]!,
      }
      const plan = buildSceneRenderPlan({ manifest, level, locale: 'en' })
      mocked.context = rendererContext(manifest, plan)
      const { container, unmount } = render(<PetSceneRenderer />)
      const root = container.querySelector('.vp-scene')!
      expect(root).toHaveClass(`vp-scene-transition-${sceneTransitions[index]}`)
      expect(root).toHaveClass(`vp-upgrade-transition-${upgradeTransitions[index]}`)
      expect(root).toHaveClass(`vp-upgrade-reveal-${reveals[index]}`)
      expect(root).toHaveClass(`vp-celebration-${celebrations[index]}`)
      expect(styleMarkup).toContain(`vp-scene-transition-${sceneTransitions[index]}`)
      expect(styleMarkup).toContain(`vp-upgrade-transition-${upgradeTransitions[index]}`)
      expect(styleMarkup).toContain(`vp-upgrade-reveal-${reveals[index]}`)
      expect(styleMarkup).toContain(`vp-celebration-${celebrations[index]}`)
      unmount()
    }
  })

  it('applies subjectScalePermille, camera zoom, reduced flag, and every placement coordinate to mounted styles', () => {
    const manifest = fleetCandidate as PetPackManifestV1
    const level = manifest.levels[11]!
    const plan = buildSceneRenderPlan({ manifest, level, locale: 'en' })
    plan.nodes = placements.map((preset, index) => ({
      nodeId: `placement:${preset}:${index}`,
      kind: index === 0 ? 'subject' : 'decoration',
      assetId: manifest.assets[0]!.assetId,
      altText: index === 0 ? 'subject' : null,
      ariaHidden: index !== 0,
      text: null,
      logicalCount: null,
      zOrder: index,
      placement: { ...placementPoint(preset, index, placements.length), scalePermille: 1000 },
    }))
    mocked.context = rendererContext(manifest, plan, true)
    const { container } = render(<PetSceneRenderer />)
    const root = container.querySelector('.vp-scene')!
    expect(root).toHaveAttribute('data-camera-zoom-permille', String(plan.cameraZoomPermille))
    expect(root).toHaveAttribute('data-subject-scale-permille', String(plan.subjectScalePermille))
    expect(root).toHaveAttribute('data-reduced-motion', 'true')

    const nodes = root.querySelectorAll<HTMLElement>('.vp-node')
    placements.forEach((preset, index) => {
      const point = placementPoint(preset, index, placements.length)
      const expectedLeft = 50 + (point.x / 100 - 50) * (plan.cameraZoomPermille / 1000)
      const expectedTop = 50 + (point.y / 100 - 50) * (plan.cameraZoomPermille / 1000)
      expect(nodes[index]!.style.left).toBe(`${expectedLeft}%`)
      expect(nodes[index]!.style.top).toBe(`${expectedTop}%`)
    })
    const subjectWidth = 60 * (plan.cameraZoomPermille / 1000) * (plan.subjectScalePermille / 1000)
    expect(Number.parseFloat((nodes[0] as HTMLElement).style.width)).toBeCloseTo(subjectWidth, 6)
  })
})
