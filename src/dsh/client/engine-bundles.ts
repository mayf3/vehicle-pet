/**
 * Engine/Pack assembly for the DSH overlay (CTR-OVERLAY-006 as superseded by
 * V8 DEC-OVERLAY-028): the SAME bundled Pack manifests and the SAME asset
 * files as the standalone prototype — discovered at build time, never
 * hard-coded — with `resolveAssetUrl` backed by the generated DSH build-time
 * asset map instead of the Vite dev-server `import.meta.glob`. One engine
 * instance, one storage adapter, one active Pack authority per presenting
 * pet, one progress source.
 */

import type { PackBundleInput } from '../../engine'
import { dshAssetUrls } from './asset-bundles.generated'
import { dshPackManifests } from './pack-manifests.generated'
import { petPresentationById } from './pets/bundled'

export const dshPackBundles: PackBundleInput[] = Object.entries(dshPackManifests)
  .map(([packId, manifestCandidate]) => ({
    manifestCandidate,
    resolveAssetUrl: (assetPath: string) => dshAssetUrls[`${packId}/${assetPath}`],
  }))

/** Fallback journey for pets without a binding; also the default product pet's pack. */
export const dshDefaultPackId = 'autonomous-fleet'

/**
 * V8 DEC-OVERLAY-028 / CTR-OVERLAY-041: a pet's journey is its declared pack.
 * The presenting pet resolves its own pack; seedling-fixture stays bundled and
 * internal (no pet presentation declares it, so it is never user-selectable).
 * Pure so the resolution stays unit-testable.
 */
export function resolvePetPackId(petId: string | undefined): string {
  return petPresentationById(petId)?.packId ?? dshDefaultPackId
}
