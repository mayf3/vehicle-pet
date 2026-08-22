/**
 * autonomous-fleet Pack assembly: raw manifest + bundled asset URL map.
 * The engine never imports this; the registry layer passes it in.
 */

import manifest from './manifest.json'

const assetUrlMap = import.meta.glob('./assets/**/*', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function resolveAssetUrl(path: string): string | undefined {
  return assetUrlMap[`./${path}`]
}

export const autonomousFleetBundle = {
  manifestCandidate: manifest,
  resolveAssetUrl,
}
