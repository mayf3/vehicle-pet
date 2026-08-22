import { describe, expect, it } from 'vitest'
import { placementPoint, populationRenderLimit, SCALE_SUBJECT_PERMILLE, CAMERA_ZOOM_PERMILLE, MILESTONE_PLACEMENT, MAX_NODES_PER_POPULATION, MAX_NODES_PER_PET_SCENE } from '../../src/engine/rendering/presets'

describe('placement formulas (§10, CTR-PET-030)', () => {
  it('center is the scene midpoint', () => {
    expect(placementPoint('center', 0, 1)).toEqual({ x: 5000, y: 5000 })
  })

  it('edge-left/right distribute vertically over the 1000..9000 band', () => {
    expect(placementPoint('edge-left', 0, 3)).toEqual({ x: 1000, y: Math.floor(1000 + 8000 / 4) })
    expect(placementPoint('edge-right', 2, 3)).toEqual({ x: 9000, y: Math.floor(1000 + (8000 * 3) / 4) })
  })

  it('top-strip and bottom-strip sit on y=1200 / y=8800', () => {
    expect(placementPoint('top-strip', 0, 1)).toEqual({ x: 5000, y: 1200 })
    expect(placementPoint('bottom-strip', 0, 1)).toEqual({ x: 5000, y: 8800 })
    expect(placementPoint('top-strip', 0, 2)).toEqual({ x: Math.floor(1000 + 8000 / 3), y: 1200 })
  })

  it('grid-even lays out ceil(sqrt(n)) columns', () => {
    const n = 10
    const c = Math.ceil(Math.sqrt(n))
    const r = Math.ceil(n / c)
    const p = placementPoint('grid-even', 4, n)
    expect(p.x).toBe(Math.floor(1000 + (8000 * ((4 % c) + 0.5)) / c))
    expect(p.y).toBe(Math.floor(1000 + (8000 * ((Math.floor(4 / c) % r) + 0.5)) / r))
  })

  it('ring places points on a radius-3000 circle around the center', () => {
    const p = placementPoint('ring', 0, 4)
    expect(p.x).toBe(Math.floor(5000 + 3000 * Math.cos(0)))
    expect(p.y).toBe(5000)
    const q = placementPoint('ring', 1, 4)
    expect(q.x).toBe(Math.floor(5000 + 3000 * Math.cos(Math.PI / 2)))
    expect(q.y).toBe(Math.floor(5000 + 3000 * Math.sin(Math.PI / 2)))
  })

  it('horizon-band runs between y=4400 and y=7200', () => {
    expect(placementPoint('horizon-band', 0, 1)).toEqual({ x: 5000, y: Math.floor(4400 + 2800 / 2) })
    const last = placementPoint('horizon-band', 2, 3)
    expect(last.y).toBe(Math.floor(4400 + (2800 * 3) / 4))
  })
})

describe('preset observables (§10)', () => {
  it('maps every scale preset to its frozen subject permille', () => {
    expect(SCALE_SUBJECT_PERMILLE).toEqual({
      individual: 600,
      group: 380,
      cluster: 240,
      field: 150,
      region: 95,
      horizon: 60,
    })
  })

  it('maps every camera preset to its frozen zoom permille', () => {
    expect(CAMERA_ZOOM_PERMILLE).toEqual({
      close: 1000,
      district: 820,
      city: 660,
      metro: 520,
      regional: 400,
      continental: 300,
      terminal: 220,
    })
  })

  it('applies density multipliers with floor(32 × multiplier)', () => {
    expect(populationRenderLimit('sparse')).toBe(16)
    expect(populationRenderLimit('moderate')).toBe(24)
    expect(populationRenderLimit('dense')).toBe(32)
    expect(populationRenderLimit('network')).toBe(32)
    expect(populationRenderLimit('luminous')).toBe(32)
    expect(MAX_NODES_PER_POPULATION).toBe(32)
    expect(MAX_NODES_PER_PET_SCENE).toBe(64)
  })

  it('maps milestone presentations to their frozen placements', () => {
    expect(MILESTONE_PLACEMENT.inline).toEqual({ x: 5000, y: 6800 })
    expect(MILESTONE_PLACEMENT.banner).toEqual({ x: 5000, y: 1200 })
    expect(MILESTONE_PLACEMENT['centered-card']).toEqual({ x: 5000, y: 5000 })
    expect(MILESTONE_PLACEMENT.terminal).toEqual({ x: 5000, y: 8800 })
  })
})
