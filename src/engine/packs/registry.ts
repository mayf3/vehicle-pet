/**
 * Build-time static bundled Pack registry (CTR-PET-025).
 * The Engine never imports concrete Packs; the assembly layer passes validated
 * bundles in. All bundles are fully validated before use; invalid bundles are
 * dropped with diagnostics and can never become active.
 */

import type { EngineDiagnostic } from '../types/core'
import type { PetPackManifestV1 } from '../types/manifest'
import { validatePack } from '../validation/validate-pack'

export interface PackBundleInput {
  /** Raw manifest candidate; validated here, never trusted as-is. */
  manifestCandidate: unknown
  /** Resolves a manifest asset path to a bundled file URL; undefined = missing file. */
  resolveAssetUrl: (path: string) => string | undefined
}

export interface RegisteredPack {
  manifest: PetPackManifestV1
  resolveAssetUrl: (path: string) => string | undefined
}

export interface CreateRegistryResult {
  registry: PackRegistry
  diagnostics: EngineDiagnostic[]
}

function immutableManifest(manifest: PetPackManifestV1): PetPackManifestV1 {
  const clone = JSON.parse(JSON.stringify(manifest)) as PetPackManifestV1
  const freeze = (value: unknown): void => {
    if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return
    for (const child of Object.values(value)) freeze(child)
    Object.freeze(value)
  }
  freeze(clone)
  return clone
}

export class PackRegistry {
  private readonly packs = new Map<string, RegisteredPack>()

  private constructor() {}

  static create(bundles: PackBundleInput[], now: () => Date, requireBundledKeepsakes = true): CreateRegistryResult {
    const diagnostics: EngineDiagnostic[] = []
    const registry = new PackRegistry()
    for (const bundle of bundles) {
      const result = validatePack(bundle.manifestCandidate, {
        resolveAssetUrl: bundle.resolveAssetUrl,
        requireBundledKeepsakes,
      })
      if (!result.ok) {
        diagnostics.push({
          code: 'pack-invalid',
          message: `pack rejected: ${result.errors.slice(0, 5).join('; ')}`,
          at: now().toISOString(),
        })
        continue
      }
      const manifest = immutableManifest(result.manifest)
      if (registry.packs.has(manifest.packId)) {
        diagnostics.push({
          code: 'pack-invalid',
          message: `duplicate packId ${manifest.packId} in registry`,
          at: now().toISOString(),
        })
        continue
      }
      registry.packs.set(manifest.packId, Object.freeze({
        manifest,
        resolveAssetUrl: bundle.resolveAssetUrl,
      }))
    }
    return { registry, diagnostics }
  }

  get(packId: string): RegisteredPack | undefined {
    return this.packs.get(packId)
  }

  list(): RegisteredPack[] {
    return [...this.packs.values()]
  }

  has(packId: string): boolean {
    return this.packs.has(packId)
  }
}
