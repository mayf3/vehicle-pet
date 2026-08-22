/** seedling-fixture declarative Pack assembly; imported only by the app registry. */
import manifest from './manifest.json'

const assetUrlMap = import.meta.glob('./assets/**/*', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>

export function resolveSeedlingAssetUrl(path: string): string | undefined {
  return assetUrlMap[`./${path}`]
}

export const seedlingFixtureBundle = {
  manifestCandidate: manifest,
  resolveAssetUrl: resolveSeedlingAssetUrl,
}
