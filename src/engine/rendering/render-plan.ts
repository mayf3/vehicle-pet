/**
 * Deterministic SceneRenderPlan builder (CTR-PET-007, CTR-PET-008, §9.17, §10).
 *
 * Allocation algorithm (frozen):
 *   1. non-population nodes enter the plan in scene declaration order
 *      (background, layer nodes, milestone node, then one aggregate-label per
 *      population in declaration order — aggregate semantics are always kept);
 *   2. the remaining budget of MAX_NODES_PER_PET_SCENE goes to populations;
 *   3. each population, in declaration order, receives
 *      min(logicalCount, renderLimit, 32, remainingBudget) representatives;
 *   4. once the budget is exhausted, later populations get 0 representatives
 *      while their logical count and aggregate-label remain in the plan.
 *
 * The plan is a pure function of its inputs; repeated builds are byte-identical.
 */

import type { Locale } from '../types/core'
import type {
  DensityPreset,
  LevelDefinition,
  PetPackManifestV1,
  SceneDefinition,
} from '../types/manifest'
import type { RenderNode, SceneRenderPlan, SceneStructureFingerprint } from '../types/derived'
import { resolveLocalizedText } from '../localization'
import {
  CAMERA_ZOOM_PERMILLE,
  MILESTONE_PLACEMENT,
  MAX_NODES_PER_POPULATION,
  MAX_NODES_PER_PET_SCENE,
  SCALE_SUBJECT_PERMILLE,
  placementPoint,
  populationRenderLimit,
} from './presets'
import { overlayVisualClass } from '../validation/validate-pack'

export interface BuildRenderPlanInput {
  manifest: PetPackManifestV1
  level: LevelDefinition
  locale: Locale
}

export function buildSceneRenderPlan({ manifest, level, locale }: BuildRenderPlanInput): SceneRenderPlan {
  const scene = sceneById(manifest, level.sceneId)
  const nodes: RenderNode[] = []
  const assetsById = new Map(manifest.assets.map((asset) => [asset.assetId, asset]))

  // 1. background node
  nodes.push({
    nodeId: `${scene.sceneId}:background`,
    kind: 'background',
    assetId: scene.backgroundAssetId,
    altText: null,
    ariaHidden: false,
    text: null,
    logicalCount: null,
    zOrder: 0,
    placement: { ...placementPoint('center', 0, 1), scalePermille: 1000 },
  })

  // 2. non-population layer nodes in declaration order; collect populations.
  const populations: { layerId: string; population: NonNullable<import('../types/manifest').LayerDefinition['population']> }[] = []
  for (const layer of scene.layers) {
    if (layer.population !== undefined) {
      populations.push({ layerId: layer.layerId, population: layer.population })
      continue
    }
    nodes.push({
      nodeId: `${scene.sceneId}:${layer.layerId}`,
      kind: layer.kind,
      assetId: layer.assetId ?? null,
      altText:
        layer.kind === 'subject' && layer.assetId !== undefined
          ? resolveLocalizedText(assetsById.get(layer.assetId)!.altText, locale)
          : null,
      ariaHidden: layer.kind === 'decoration',
      text: null,
      logicalCount: null,
      zOrder: layer.zOrder,
      placement: { ...placementPoint(layer.placement, 0, 1), scalePermille: 1000 },
    })
  }

  // 3. milestone node (§10 milestone placement semantics).
  const milestonePoint = MILESTONE_PLACEMENT[level.presentation.milestone]
  const milestoneText = resolveLocalizedText(level.milestone, locale)
  nodes.push({
    nodeId: `${scene.sceneId}:milestone`,
    kind: 'milestone',
    assetId: null,
    altText: milestoneText,
    ariaHidden: false,
    text: milestoneText,
    logicalCount: null,
    zOrder: 62,
    placement: { x: milestonePoint.x, y: milestonePoint.y, scalePermille: 1000 },
  })

  // 4. one aggregate-label per population, always retained (§10.2).
  for (const { population } of populations) {
    const label = resolveLocalizedText(population.aggregateLabel, locale)
    const text = `${population.logicalCount} ${label}`
    nodes.push({
      nodeId: `${scene.sceneId}:${population.populationId}:aggregate`,
      kind: 'aggregate-label',
      assetId: null,
      altText: text,
      ariaHidden: false,
      text,
      logicalCount: population.logicalCount,
      zOrder: 63,
      placement: { x: 5000, y: 500, scalePermille: 1000 },
    })
  }

  // 5. representative allocation with the frozen budget rule.
  let remaining = MAX_NODES_PER_PET_SCENE - nodes.length
  for (const { layerId, population } of populations) {
    const renderLimit = populationRenderLimit(population.density)
    const count = Math.min(
      population.logicalCount,
      renderLimit,
      MAX_NODES_PER_POPULATION,
      Math.max(remaining, 0),
    )
    // The placement group is the set of rendered representatives of this population.
    for (let i = 0; i < count; i++) {
      const point = placementPoint(population.placement, i, count)
      nodes.push({
        nodeId: `${scene.sceneId}:${population.populationId}:${i}`,
        kind: 'population-representative',
        assetId: population.assetId,
        altText: null,
        ariaHidden: true,
        text: null,
        logicalCount: null,
        zOrder: populationZOrder(scene, layerId),
        placement: { ...point, scalePermille: 1000 },
      })
    }
    remaining -= count
  }

  return {
    schemaVersion: 1,
    packId: manifest.packId,
    packVersion: manifest.packVersion,
    sceneId: scene.sceneId,
    levelId: level.levelId,
    cameraZoomPermille: CAMERA_ZOOM_PERMILLE[level.presentation.camera],
    subjectScalePermille: SCALE_SUBJECT_PERMILLE[level.presentation.scale],
    nodes,
  }
}

function populationZOrder(scene: SceneDefinition, layerId: string): number {
  const layer = scene.layers.find((l) => l.layerId === layerId)
  return layer?.zOrder ?? 30
}

export function sceneById(manifest: PetPackManifestV1, sceneId: string): SceneDefinition {
  const scene = manifest.scenes.find((s) => s.sceneId === sceneId)
  if (scene === undefined) {
    throw new Error(`scene ${sceneId} not found in pack ${manifest.packId}`)
  }
  return scene
}

/**
 * Mechanical structural fingerprint for the §10.1 adjacent-level diff.
 * Text, numbers, and titles never enter this structure.
 */
export function buildStructureFingerprint(
  manifest: PetPackManifestV1,
  level: LevelDefinition,
): SceneStructureFingerprint {
  const scene = sceneById(manifest, level.sceneId)
  const assetsById = new Map(manifest.assets.map((a) => [a.assetId, a]))
  const densities: DensityPreset[] = []
  let groupCount = 0
  const overlayClasses = new Set<string>()
  let hasTerminalOverlay = false
  const layerKinds: string[] = ['background']

  for (const layer of scene.layers) {
    layerKinds.push(layer.kind)
    if (layer.kind === 'terminal-overlay') hasTerminalOverlay = true
    if ((layer.kind === 'overlay' || layer.kind === 'terminal-overlay') && layer.assetId !== undefined) {
      const asset = assetsById.get(layer.assetId)
      if (asset !== undefined) {
        const visualClass = overlayVisualClass(asset.path)
        if (visualClass !== null) overlayClasses.add(visualClass)
      }
    }
    if (layer.population !== undefined) {
      densities.push(layer.population.density)
      if (layer.population.logicalCount >= 1) groupCount++
    }
  }
  layerKinds.push('milestone')

  return {
    sceneId: scene.sceneId,
    backgroundAssetId: scene.backgroundAssetId,
    cameraPreset: level.presentation.camera,
    scalePreset: level.presentation.scale,
    populationDensities: densities,
    populationGroupCount: groupCount,
    overlayClassSet: [...overlayClasses].sort(),
    hasTerminalOverlay,
    layerKindMultiset: [...layerKinds].sort(),
  }
}

/** Counts the differing non-text dimensions between two fingerprints (§10.1). */
export function structuralDifferenceCount(a: SceneStructureFingerprint, b: SceneStructureFingerprint): string[] {
  const diffs: string[] = []
  if (a.sceneId !== b.sceneId || a.backgroundAssetId !== b.backgroundAssetId) diffs.push('scene-background')
  if (a.cameraPreset !== b.cameraPreset) diffs.push('cameraPreset')
  if (a.scalePreset !== b.scalePreset) diffs.push('scalePreset')
  const densityDiffers =
    a.populationDensities.length !== b.populationDensities.length ||
    a.populationDensities.some((d, i) => d !== b.populationDensities[i])
  if (densityDiffers) diffs.push('densityPreset')
  if (a.populationGroupCount !== b.populationGroupCount) diffs.push('populationGroupCount')
  const overlayDiffers =
    a.overlayClassSet.length !== b.overlayClassSet.length ||
    a.overlayClassSet.some((c, i) => c !== b.overlayClassSet[i])
  if (overlayDiffers) diffs.push('overlayClassSet')
  if (a.hasTerminalOverlay !== b.hasTerminalOverlay) diffs.push('terminalOverlay')
  const layerDiffers =
    a.layerKindMultiset.length !== b.layerKindMultiset.length ||
    a.layerKindMultiset.some((k, i) => k !== b.layerKindMultiset[i])
  if (layerDiffers) diffs.push('layerKindMultiset')
  return diffs
}
