/**
 * Declarative Pet Pack manifest types, frozen by CONFIGURABLE_PET_ENGINE_V1 §9.5–§9.13.
 * Every structure is `additionalProperties: false`; the JSON Schema in
 * src/engine/schema/pet-pack-manifest-v1.schema.json is the mechanical authority.
 */

import type { LocalizedTextV1 } from './core'

export type ScalePreset = 'individual' | 'group' | 'cluster' | 'field' | 'region' | 'horizon'

export type CameraPreset = 'close' | 'district' | 'city' | 'metro' | 'regional' | 'continental' | 'terminal'

export type DensityPreset = 'sparse' | 'moderate' | 'dense' | 'network' | 'luminous'

export type MilestonePresentationPreset = 'inline' | 'banner' | 'centered-card' | 'terminal'

export type SceneTransitionPreset = 'instant' | 'crossfade' | 'zoom-out' | 'layer-build'

export type UpgradeTransitionPreset = 'instant' | 'crossfade' | 'layer-build' | 'camera-step-out'

export type UpgradeRevealPreset = 'subject-swap' | 'scene-expand' | 'milestone-card' | 'collection-add'

export type CelebrationPreset = 'glow-pulse' | 'spark-burst' | 'confetti-lite' | 'ambient-highlight'

export type PlacementPreset =
  | 'center'
  | 'edge-left'
  | 'edge-right'
  | 'top-strip'
  | 'bottom-strip'
  | 'grid-even'
  | 'ring'
  | 'horizon-band'

export type AssetRole = 'background' | 'overlay' | 'sprite'
export type AssetFormat = 'webp' | 'png'

export interface StagePresentation {
  scale: ScalePreset
  camera: CameraPreset
  milestone: MilestonePresentationPreset
}

export interface UpgradePresentation {
  transition: UpgradeTransitionPreset
  reveal: UpgradeRevealPreset
  celebration: CelebrationPreset
}

export interface AssetDescriptor {
  assetId: string
  path: string
  format: AssetFormat
  role: AssetRole
  width: number
  height: number
  byteSizeCompressed: number
  altText: LocalizedTextV1
}

export interface PopulationDefinition {
  populationId: string
  logicalCount: number
  assetId: string
  density: DensityPreset
  placement: PlacementPreset
  aggregateLabel: LocalizedTextV1
}

export type LayerKind = 'subject' | 'decoration' | 'overlay' | 'terminal-overlay'

export interface LayerDefinition {
  layerId: string
  kind: LayerKind
  assetId?: string
  population?: PopulationDefinition
  placement: PlacementPreset
  zOrder: number
}

export interface SceneDefinition {
  sceneId: string
  backgroundAssetId: string
  layers: LayerDefinition[]
  transition: SceneTransitionPreset
  sceneLabel: LocalizedTextV1
}

export interface KeepsakeDefinition {
  keepsakeId: string
  levelId: string
  title: LocalizedTextV1
  accessDescription: LocalizedTextV1
  assetId?: string
}

export interface LevelDefinition {
  levelId: string
  threshold: number
  stageName: LocalizedTextV1
  summary: LocalizedTextV1
  milestone: LocalizedTextV1
  sceneId: string
  presentation: StagePresentation
  upgrade?: UpgradePresentation
  keepsakeId?: string
}

export interface DisplayConversion {
  unitLabel: LocalizedTextV1
  pointsPerUnit: number
}

export interface PetPackManifestV1 {
  schemaVersion: 1
  packId: string
  packVersion: string
  name: LocalizedTextV1
  levels: LevelDefinition[]
  scenes: SceneDefinition[]
  assets: AssetDescriptor[]
  keepsakes?: KeepsakeDefinition[]
  displayConversion?: DisplayConversion
}
