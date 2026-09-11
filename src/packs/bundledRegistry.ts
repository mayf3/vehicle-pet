/**
 * Bundled Pack discovery for the standalone application (CTR-PET-025 as
 * generalized by V8 CTR-OVERLAY-038): every `src/packs/<packId>/manifest.json`
 * directory is a bundled Pack. This is generic wiring — adding a Pack means
 * adding a data directory, never editing a registry file; there is no runtime
 * Pack installer and no remote Pack support. The engine never imports this;
 * the registry layer passes bundles in. (The DSH build uses the generated
 * manifest map instead, because its esbuild bundle forbids `import.meta`.)
 */

import type { PackBundleInput } from '../engine'

const manifestModules = import.meta.glob('./*/manifest.json', { eager: true, import: 'default' }) as Record<string, unknown>
const assetModules = import.meta.glob('./*/assets/**/*', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>

function packIdFromManifestPath(path: string): string {
  return path.slice(2, -'/manifest.json'.length)
}

export function discoverPackBundles(): PackBundleInput[] {
  return Object.entries(manifestModules)
    .map(([manifestPath, manifestCandidate]) => {
      const packId = packIdFromManifestPath(manifestPath)
      const prefix = `./${packId}/`
      const resolveAssetUrl = (assetPath: string): string | undefined => {
        const resolved = assetModules[`${prefix}${assetPath}`]
        if (resolved !== undefined) return resolved
        // Seedling-era layouts nest assets under a second packId directory.
        const nested = Object.entries(assetModules).find(([key]) => key.startsWith(prefix) && key.endsWith(`/${assetPath}`))
        return nested?.[1]
      }
      return { manifestCandidate, resolveAssetUrl }
    })
    .sort((a, b) => {
      const idOf = (bundle: PackBundleInput) => (bundle.manifestCandidate as { packId?: string }).packId ?? ''
      return idOf(a).localeCompare(idOf(b))
    })
}

export const bundledPackBundles: PackBundleInput[] = discoverPackBundles()

export const defaultPackId = 'autonomous-fleet'
