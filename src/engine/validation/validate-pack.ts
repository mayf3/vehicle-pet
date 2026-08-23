/**
 * Strict, atomic PetPackManifestV1 validation (CTR-PET-003, CTR-PET-004).
 * JSON Schema first, then total semantic checks; any violation rejects the Pack
 * entirely with no partial activation.
 */

import Ajv from 'ajv'
import type { PetPackManifestV1, SceneDefinition } from '../types/manifest'
import manifestSchema from '../schema/pet-pack-manifest-v1.schema.json'

export const PACK_TOTAL_ASSET_BUDGET_BYTES = 16_777_216
export const SINGLE_ASSET_MAX_BYTES = 2_097_152

export type PackValidationResult =
  | { ok: true; manifest: PetPackManifestV1 }
  | { ok: false; errors: string[] }

/** Overlay visual classes required by density presets (§10). */
export type OverlayVisualClass = 'route-network' | 'glow'

export function overlayVisualClass(path: string): OverlayVisualClass | null {
  if (/route|network/.test(path)) return 'route-network'
  if (/glow/.test(path)) return 'glow'
  return null
}

const ajv = new Ajv({ allErrors: true })
const compiled = ajv.compile(manifestSchema as unknown as object)

const EXECUTABLE_STRING_PATTERN = /<script|javascript:|<\/?style|text\/css|\.css($|\?|#)/i

function containsExecutableContent(value: unknown): string[] {
  if (typeof value === 'function' || typeof value === 'symbol') {
    return ['manifest contains a function or symbol value']
  }
  if (typeof value === 'string' && EXECUTABLE_STRING_PATTERN.test(value)) {
    return [`manifest string resembles script or CSS content: ${value.slice(0, 60)}`]
  }
  if (typeof value === 'object' && value !== null) {
    if ('$$typeof' in value) return ['manifest contains a non-JSON structure (possible component)']
    const errors: string[] = []
    for (const entry of Object.values(value)) {
      errors.push(...containsExecutableContent(entry))
    }
    return errors
  }
  return []
}

export interface ValidatePackOptions {
  /** When provided, every declared asset path must resolve to a real bundled file. */
  resolveAssetUrl?: (path: string) => string | undefined
  /** Bundled packs must declare exactly levels.length - 1 keepsakes (§9.5). */
  requireBundledKeepsakes?: boolean
}

export function validatePack(candidate: unknown, options: ValidatePackOptions = {}): PackValidationResult {
  const errors: string[] = []

  errors.push(...containsExecutableContent(candidate))
  if (errors.length > 0) {
    return { ok: false, errors }
  }

  if (!compiled(candidate)) {
    const schemaErrors = (compiled.errors ?? []).map(
      (e) => `${String(e.instancePath || '/')} ${e.message ?? 'failed schema validation'}`,
    )
    return { ok: false, errors: schemaErrors.length > 0 ? schemaErrors : ['manifest failed schema validation'] }
  }

  const manifest = candidate as PetPackManifestV1

  // --- thresholds -----------------------------------------------------------
  const thresholds = manifest.levels.map((l) => l.threshold)
  if (thresholds[0] !== 0) {
    errors.push('first level threshold must be 0')
  }
  for (let i = 1; i < thresholds.length; i++) {
    if (thresholds[i]! <= thresholds[i - 1]!) {
      errors.push(`thresholds must be strictly increasing: level ${manifest.levels[i]!.levelId}`)
      break
    }
  }

  // --- unique ids -----------------------------------------------------------
  const levelIds = new Set<string>()
  for (const level of manifest.levels) {
    if (levelIds.has(level.levelId)) errors.push(`duplicate levelId ${level.levelId}`)
    levelIds.add(level.levelId)
  }
  const sceneIds = new Set<string>()
  for (const scene of manifest.scenes) {
    if (sceneIds.has(scene.sceneId)) errors.push(`duplicate sceneId ${scene.sceneId}`)
    sceneIds.add(scene.sceneId)
  }
  const assetIds = new Set<string>()
  for (const asset of manifest.assets) {
    if (assetIds.has(asset.assetId)) errors.push(`duplicate assetId ${asset.assetId}`)
    assetIds.add(asset.assetId)
    if (asset.format !== asset.path.split('.').pop()) {
      errors.push(`asset ${asset.assetId} format does not match path extension`)
    }
  }
  const keepsakes = manifest.keepsakes ?? []
  const keepsakeIds = new Set<string>()
  for (const keepsake of keepsakes) {
    if (keepsakeIds.has(keepsake.keepsakeId)) errors.push(`duplicate keepsakeId ${keepsake.keepsakeId}`)
    keepsakeIds.add(keepsake.keepsakeId)
  }

  // --- references -----------------------------------------------------------
  const assetsById = new Map(manifest.assets.map((a) => [a.assetId, a]))
  for (const level of manifest.levels) {
    if (!sceneIds.has(level.sceneId)) {
      errors.push(`level ${level.levelId} references unknown sceneId ${level.sceneId}`)
    }
    if (level.keepsakeId !== undefined && !keepsakeIds.has(level.keepsakeId)) {
      errors.push(`level ${level.levelId} references unknown keepsakeId ${level.keepsakeId}`)
    }
  }
  for (const scene of manifest.scenes) {
    const background = assetsById.get(scene.backgroundAssetId)
    if (background === undefined) {
      errors.push(`scene ${scene.sceneId} backgroundAssetId ${scene.backgroundAssetId} not found`)
    } else if (background.role !== 'background') {
      errors.push(`scene ${scene.sceneId} background asset must have role=background`)
    }
  }
  for (const keepsake of keepsakes) {
    if (!levelIds.has(keepsake.levelId)) {
      errors.push(`keepsake ${keepsake.keepsakeId} references unknown levelId ${keepsake.levelId}`)
    } else if (keepsake.levelId === manifest.levels[0]!.levelId) {
      errors.push(`keepsake ${keepsake.keepsakeId} must reference a non-initial level`)
    }
    if (keepsake.assetId !== undefined && !assetIds.has(keepsake.assetId)) {
      errors.push(`keepsake ${keepsake.keepsakeId} references unknown assetId ${keepsake.assetId}`)
    }
  }

  // --- keepsake binding -----------------------------------------------------
  const levelsBykeepsakeRef = new Map<string, number>()
  for (const level of manifest.levels) {
    if (level.keepsakeId !== undefined) {
      const count = levelsBykeepsakeRef.get(level.keepsakeId) ?? 0
      levelsBykeepsakeRef.set(level.keepsakeId, count + 1)
    }
  }
  for (const [keepsakeId, count] of levelsBykeepsakeRef) {
    if (count > 1) errors.push(`keepsake ${keepsakeId} is referenced by ${count} levels`)
  }
  const nonInitialLevels = manifest.levels.slice(1)
  if (options.requireBundledKeepsakes) {
    if (keepsakes.length !== nonInitialLevels.length) {
      errors.push(
        `bundled pack must declare exactly ${nonInitialLevels.length} keepsakes, found ${keepsakes.length}`,
      )
    }
    for (const level of nonInitialLevels) {
      if (level.keepsakeId === undefined) {
        errors.push(`non-initial level ${level.levelId} must carry a keepsakeId`)
      }
    }
  }
  const keepsakesByLevel = new Map<string, number>()
  for (const keepsake of keepsakes) {
    const count = keepsakesByLevel.get(keepsake.levelId) ?? 0
    keepsakesByLevel.set(keepsake.levelId, count + 1)
  }
  for (const [levelId, count] of keepsakesByLevel) {
    if (count > 1) errors.push(`level ${levelId} is referenced by ${count} keepsakes`)
  }

  // --- scenes: layers and populations ---------------------------------------
  for (const scene of manifest.scenes) {
    validateScene(scene, assetsById, errors)
  }

  // --- camera=terminal requires terminal overlay -----------------------------
  for (const level of manifest.levels) {
    if (level.presentation.camera === 'terminal') {
      const scene = manifest.scenes.find((s) => s.sceneId === level.sceneId)
      if (scene !== undefined && !scene.layers.some((l) => l.kind === 'terminal-overlay')) {
        errors.push(`level ${level.levelId} uses camera=terminal but scene ${scene.sceneId} has no terminal-overlay layer`)
      }
    }
  }

  // --- density visual class requirements (§10) -------------------------------
  for (const scene of manifest.scenes) {
    const overlayClasses = new Set<OverlayVisualClass>()
    for (const layer of scene.layers) {
      if ((layer.kind === 'overlay' || layer.kind === 'terminal-overlay') && layer.assetId !== undefined) {
        const asset = assetsById.get(layer.assetId)
        if (asset !== undefined) {
          const visualClass = overlayVisualClass(asset.path)
          if (visualClass !== null) overlayClasses.add(visualClass)
        }
      }
    }
    for (const layer of scene.layers) {
      const population = layer.population
      if (population === undefined) continue
      if (population.density === 'network' && !overlayClasses.has('route-network')) {
        errors.push(
          `population ${population.populationId} uses density=network but scene ${scene.sceneId} lacks a route/network class overlay`,
        )
      }
      if (population.density === 'luminous' && !overlayClasses.has('glow')) {
        errors.push(
          `population ${population.populationId} uses density=luminous but scene ${scene.sceneId} lacks a glow/highlight class overlay`,
        )
      }
    }
  }

  // --- asset budgets ----------------------------------------------------------
  let totalBytes = 0
  for (const asset of manifest.assets) {
    if (asset.byteSizeCompressed > SINGLE_ASSET_MAX_BYTES) {
      errors.push(`asset ${asset.assetId} exceeds the 2,097,152-byte single-asset budget`)
    }
    totalBytes += asset.byteSizeCompressed
  }
  if (totalBytes > PACK_TOTAL_ASSET_BUDGET_BYTES) {
    errors.push(`pack total asset size ${totalBytes} exceeds the 16,777,216-byte budget`)
  }

  // --- bundled file existence -------------------------------------------------
  if (options.resolveAssetUrl !== undefined) {
    for (const asset of manifest.assets) {
      if (options.resolveAssetUrl(asset.path) === undefined) {
        errors.push(`asset ${asset.assetId} path ${asset.path} does not resolve to a bundled file`)
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }
  return { ok: true, manifest }
}

function validateScene(
  scene: SceneDefinition,
  assetsById: Map<string, import('../types/manifest').AssetDescriptor>,
  errors: string[],
): void {
  const layerIds = new Set<string>()
  const zOrders = new Set<number>()
  const populationIds = new Set<string>()
  let subjectCount = 0
  let terminalOverlayCount = 0

  for (const layer of scene.layers) {
    if (layerIds.has(layer.layerId)) errors.push(`duplicate layerId ${layer.layerId} in scene ${scene.sceneId}`)
    layerIds.add(layer.layerId)
    if (zOrders.has(layer.zOrder)) {
      errors.push(`duplicate zOrder ${layer.zOrder} in scene ${scene.sceneId}`)
    }
    zOrders.add(layer.zOrder)
    if (layer.kind === 'subject') subjectCount++
    if (layer.kind === 'terminal-overlay') terminalOverlayCount++
    if (layer.assetId !== undefined && layer.population !== undefined) {
      errors.push(`layer ${layer.layerId} carries both assetId and population`)
    }
    if (layer.assetId !== undefined) {
      const asset = assetsById.get(layer.assetId)
      if (asset === undefined) {
        errors.push(`layer ${layer.layerId} references unknown assetId ${layer.assetId}`)
      } else if (asset.role === 'background') {
        errors.push(`layer ${layer.layerId} must reference an overlay or sprite asset, got background`)
      }
    }
    if (layer.population !== undefined) {
      const population = layer.population
      if (populationIds.has(population.populationId)) {
        errors.push(`duplicate populationId ${population.populationId} in scene ${scene.sceneId}`)
      }
      populationIds.add(population.populationId)
      const asset = assetsById.get(population.assetId)
      if (asset === undefined) {
        errors.push(`population ${population.populationId} references unknown assetId ${population.assetId}`)
      }
    }
  }

  if (subjectCount !== 1) {
    errors.push(`scene ${scene.sceneId} must have exactly one subject layer, found ${subjectCount}`)
  }
  if (terminalOverlayCount > 1) {
    errors.push(`scene ${scene.sceneId} has more than one terminal-overlay layer`)
  }
}
