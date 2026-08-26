import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildSceneRenderPlan, type PetPackManifestV1 } from '../../src/engine'
import fleetCandidate from '../../src/packs/autonomous-fleet/manifest.json'
import seedlingCandidate from '../../src/packs/seedling-fixture/manifest.json'
import { rendererContext } from './renderer-test-context'

const mocked = vi.hoisted(() => ({ context: null as unknown }))
vi.mock('../../src/react/PetEngineProvider', () => ({ usePetEngine: () => mocked.context }))
import { PetSceneRenderer } from '../../src/react/PetSceneRenderer'
import { EngineStyles } from '../../src/react/styles'

afterEach(cleanup)

const CASES = [
  { manifest: fleetCandidate as PetPackManifestV1, levels: ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8', 'l9', 'l10', 'l11', 'l12'] },
  { manifest: seedlingCandidate as PetPackManifestV1, levels: ['seed', 'sprout', 'tree', 'forest'] },
] as const

function renderLevel(manifest: PetPackManifestV1, levelId: string, reducedMotion: boolean, presentationMode: 'full-journey' | 'compact-overlay') {
  const level = manifest.levels.find(candidate => candidate.levelId === levelId)
  if (level === undefined) throw new Error(`missing geometry fixture ${manifest.packId}/${levelId}`)
  const plan = buildSceneRenderPlan({ manifest, level, locale: 'en' })
  mocked.context = rendererContext(manifest, plan, reducedMotion)
  return render(<><EngineStyles /><PetSceneRenderer presentationMode={presentationMode} /></>)
}

function intersectionRatio(element: HTMLElement, sceneWidth: number, sceneHeight: number): number {
  const width = Number.parseFloat(element.style.width) / 100 * sceneWidth
  const height = element.style.height === '100%'
    ? sceneHeight
    : width
  const centreX = Number.parseFloat(element.style.left) / 100 * sceneWidth
  const centreY = Number.parseFloat(element.style.top) / 100 * sceneHeight
  const left = centreX - width / 2
  const top = centreY - height / 2
  const intersectionWidth = Math.max(0, Math.min(sceneWidth, left + width) - Math.max(0, left))
  const intersectionHeight = Math.max(0, Math.min(sceneHeight, top + height) - Math.max(0, top))
  return width * height === 0 ? 0 : (intersectionWidth * intersectionHeight) / (width * height)
}

describe('R3 compact/full-journey scene geometry', () => {
  it('COMPACT_ALL_LEVEL_PIXEL_MATRIX_TEST keeps all 16 subjects centred and at least 90% visible in 112px', () => {
    for (const { manifest, levels } of CASES) {
      for (const levelId of levels) {
        const view = renderLevel(manifest, levelId, false, 'compact-overlay')
        const subject = view.container.querySelector<HTMLElement>('[data-pet-subject="true"]')!
        expect(subject.style.transform).toBe('translate(-50%, -50%)')
        expect(Number.parseFloat(subject.style.left)).toBeGreaterThanOrEqual(0)
        expect(Number.parseFloat(subject.style.left)).toBeLessThanOrEqual(100)
        expect(Number.parseFloat(subject.style.top)).toBeGreaterThanOrEqual(0)
        expect(Number.parseFloat(subject.style.top)).toBeLessThanOrEqual(100)
        expect(Number.parseFloat(subject.style.width)).toBeGreaterThanOrEqual(42)
        expect(intersectionRatio(subject, 112, 112)).toBeGreaterThanOrEqual(0.9)
        expect(view.container.querySelectorAll('.vp-kind-milestone, .vp-kind-aggregate-label')).toHaveLength(0)
        expect(view.container.querySelectorAll('.vp-node')).toHaveLength(1)
        view.unmount()
      }
    }
  })

  it('COMPACT_MILESTONE_SUBJECT_OVERLAP_TEST renders no compact milestone or aggregate geometry', () => {
    for (const { manifest, levels } of CASES) {
      for (const levelId of levels) {
        const view = renderLevel(manifest, levelId, false, 'compact-overlay')
        const subject = view.container.querySelector<HTMLElement>('[data-pet-subject="true"]')!
        expect(subject).not.toBeNull()
        expect(view.container.querySelector('.vp-kind-milestone, .vp-kind-aggregate-label')).toBeNull()
        view.unmount()
      }
    }
  })

  it('COMPACT_BLACK_VOID_TEST removes Pack world layers from the compact avatar', () => {
    for (const { manifest, levels } of CASES) {
      for (const levelId of levels) {
        const view = renderLevel(manifest, levelId, false, 'compact-overlay')
        expect(view.container.querySelector('[data-node-kind="background"], [data-node-kind="overlay"], [data-node-kind="terminal-overlay"]')).toBeNull()
        view.unmount()
      }
    }
  })

  it('SCENE_FULL_JOURNEY_GEOMETRY_TEST keeps plan layers inside the dialog scene and backgrounds filled', () => {
    for (const { manifest, levels } of CASES) {
      for (const levelId of levels) {
        const view = renderLevel(manifest, levelId, false, 'full-journey')
        const scene = view.container.querySelector<HTMLElement>('.vp-scene')!
        const subject = scene.querySelector<HTMLElement>('[data-pet-subject="true"]')!
        expect(intersectionRatio(subject, 800, 450)).toBeGreaterThanOrEqual(0.85)
        const frames = scene.querySelectorAll<HTMLElement>('[data-node-kind="background"], [data-node-kind="overlay"], [data-node-kind="terminal-overlay"]')
        expect(frames.length).toBeGreaterThan(0)
        for (const frame of frames) {
          expect(frame.style.width).toBe('100%')
          expect(frame.style.height).toBe('100%')
          expect(frame.style.transform).toBe('translate(-50%, -50%)')
          expect(intersectionRatio(frame, 800, 450)).toBe(1)
        }
        view.unmount()
      }
    }
  })

  it('REDUCED_MOTION_COMPACT_GEOMETRY_TEST preserves the normal-motion static bounding geometry', () => {
    for (const { manifest, levels } of CASES) {
      for (const levelId of levels) {
        const normal = renderLevel(manifest, levelId, false, 'compact-overlay')
        const normalSubject = normal.container.querySelector<HTMLElement>('[data-pet-subject="true"]')!
        const normalGeometry = {
          left: normalSubject.style.left,
          top: normalSubject.style.top,
          width: normalSubject.style.width,
          height: normalSubject.style.height,
          transform: normalSubject.style.transform,
        }
        normal.unmount()

        const reduced = renderLevel(manifest, levelId, true, 'compact-overlay')
        const reducedSubject = reduced.container.querySelector<HTMLElement>('[data-pet-subject="true"]')!
        expect({
          left: reducedSubject.style.left,
          top: reducedSubject.style.top,
          width: reducedSubject.style.width,
          height: reducedSubject.style.height,
          transform: reducedSubject.style.transform,
        }).toEqual(normalGeometry)
        expect(getComputedStyle(reducedSubject).animationName).toMatch(/^(|none)$/)
        reduced.unmount()
      }
    }
  })
})
