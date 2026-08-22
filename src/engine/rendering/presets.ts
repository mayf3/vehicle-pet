/**
 * Deterministic preset semantics frozen by CONFIGURABLE_PET_ENGINE_V1 §10.
 */

import type {
  CameraPreset,
  DensityPreset,
  MilestonePresentationPreset,
  PlacementPreset,
  ScalePreset,
} from '../types/manifest'

export const MAX_NODES_PER_POPULATION = 32
export const MAX_NODES_PER_PET_SCENE = 64

export const SCALE_SUBJECT_PERMILLE: Record<ScalePreset, number> = {
  individual: 600,
  group: 380,
  cluster: 240,
  field: 150,
  region: 95,
  horizon: 60,
}

export const CAMERA_ZOOM_PERMILLE: Record<CameraPreset, number> = {
  close: 1000,
  district: 820,
  city: 660,
  metro: 520,
  regional: 400,
  continental: 300,
  terminal: 220,
}

export const DENSITY_LIMIT_MULTIPLIER: Record<DensityPreset, number> = {
  sparse: 0.5,
  moderate: 0.75,
  dense: 1,
  network: 1,
  luminous: 1,
}

export function populationRenderLimit(density: DensityPreset): number {
  return Math.floor(MAX_NODES_PER_POPULATION * DENSITY_LIMIT_MULTIPLIER[density])
}

/** Milestone node placement semantics (§10). */
export const MILESTONE_PLACEMENT: Record<MilestonePresentationPreset, { x: number; y: number }> = {
  inline: { x: 5000, y: 6800 },
  banner: { x: 5000, y: 1200 },
  'centered-card': { x: 5000, y: 5000 },
  terminal: { x: 5000, y: 8800 },
}

/**
 * Deterministic placement formulas on the 10000×10000 scene box (§10).
 * `n` = nodes in the placement group, `i` = 0-based index; float64 math, floored.
 */
export function placementPoint(
  preset: PlacementPreset,
  i: number,
  n: number,
): { x: number; y: number } {
  switch (preset) {
    case 'center':
      return { x: 5000, y: 5000 }
    case 'edge-left':
      return { x: 1000, y: Math.floor(1000 + (8000 * (i + 1)) / (n + 1)) }
    case 'edge-right':
      return { x: 9000, y: Math.floor(1000 + (8000 * (i + 1)) / (n + 1)) }
    case 'top-strip':
      return { x: Math.floor(1000 + (8000 * (i + 1)) / (n + 1)), y: 1200 }
    case 'bottom-strip':
      return { x: Math.floor(1000 + (8000 * (i + 1)) / (n + 1)), y: 8800 }
    case 'grid-even': {
      const c = Math.ceil(Math.sqrt(n))
      const r = Math.ceil(n / c)
      const x = Math.floor(1000 + (8000 * ((i % c) + 0.5)) / c)
      const y = Math.floor(1000 + (8000 * ((Math.floor(i / c) % r) + 0.5)) / r)
      return { x, y }
    }
    case 'ring': {
      const x = Math.floor(5000 + 3000 * Math.cos((2 * Math.PI * i) / n))
      const y = Math.floor(5000 + 3000 * Math.sin((2 * Math.PI * i) / n))
      return { x, y }
    }
    case 'horizon-band':
      return {
        x: Math.floor(1000 + (8000 * (i + 1)) / (n + 1)),
        y: Math.floor(4400 + (2800 * (i + 1)) / (n + 1)),
      }
  }
}
