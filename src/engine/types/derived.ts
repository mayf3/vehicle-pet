/**
 * Engine-emitted and engine-derived structures frozen by CONFIGURABLE_PET_ENGINE_V1 §9.14–§9.17.
 */

import type { CameraPreset, DensityPreset } from './manifest'

export interface UpgradeReceipt {
  schemaVersion: 1
  receiptId: string
  sourceId: string
  subjectId: string
  packId: string
  packVersion: string
  fromLevelId: string
  toLevelId: string
  issuedAt: string
  revision: number
}

export interface PresentationJournal {
  schemaVersion: 1
  sourceId: string
  subjectId: string
  consumedReceiptIds: string[]
  greetedLocalDays: string[]
}

export type UnlockedKeepsakeKey = {
  sourceId: string
  subjectId: string
  packId: string
  packVersion: string
  keepsakeId: string
}

export interface PetViewModel {
  schemaVersion: 1
  sourceId: string
  subjectId: string
  activePackId: string
  packVersion: string
  revision: number
  progressPoints: number
  derivedLevelId: string
  derivedLevelIndex: number
  withinLevelEarned: number
  withinLevelSpan: number
  nextLevelId: string | null
  remainingPoints: number
  capped: boolean
  locale: 'zh-CN' | 'en'
  reducedMotion: boolean
  state: 'ready' | 'waiting-for-valid-progress' | 'pack-unavailable'
}

export interface RenderNodePlacement {
  x: number
  y: number
  scalePermille: number
}

export type RenderNodeKind =
  | 'background'
  | 'subject'
  | 'decoration'
  | 'overlay'
  | 'terminal-overlay'
  | 'population-representative'
  | 'aggregate-label'
  | 'milestone'
  | 'fallback'

export interface RenderNode {
  nodeId: string
  kind: RenderNodeKind
  assetId: string | null
  altText: string | null
  ariaHidden: boolean
  text: string | null
  logicalCount: number | null
  zOrder: number
  placement: RenderNodePlacement
}

export interface SceneRenderPlan {
  schemaVersion: 1
  packId: string
  packVersion: string
  sceneId: string
  levelId: string
  cameraZoomPermille: number
  subjectScalePermille: number
  nodes: RenderNode[]
}

/** Presentation-time metadata carried alongside the static plan (never persisted). */
export interface SceneMotionSemantics {
  sceneTransition: 'instant' | 'crossfade' | 'zoom-out' | 'layer-build'
  upgradeTransition: 'instant' | 'crossfade' | 'layer-build' | 'camera-step-out'
  upgradeReveal: 'subject-swap' | 'scene-expand' | 'milestone-card' | 'collection-add'
  celebration: 'glow-pulse' | 'spark-burst' | 'confetti-lite' | 'ambient-highlight'
  reducedMotion: boolean
}

/** Structural fingerprint fields used by the mechanical §10.1 diff. */
export interface SceneStructureFingerprint {
  sceneId: string
  backgroundAssetId: string
  cameraPreset: CameraPreset
  scalePreset: string
  populationDensities: DensityPreset[]
  populationGroupCount: number
  overlayClassSet: string[]
  hasTerminalOverlay: boolean
  layerKindMultiset: string[]
}
