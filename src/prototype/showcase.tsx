/**
 * Showcase view (?showcase=1): a generic static grid over bundled Packs.
 * Level selection is structural (first, and the high levels for long packs) —
 * there are no Pack-specific branches.
 */

import { buildSceneRenderPlan, validatePack, type Locale, type PetPackManifestV1 } from '../engine'
import type { PackBundleInput } from '../engine'

function showcaseLevelIndices(manifest: PetPackManifestV1): number[] {
  if (manifest.levels.length >= 12) return [0, 1, 2, 3, 6, 9, 10, 11]
  return manifest.levels.map((_, i) => i)
}

function ShowcaseCell(props: { bundle: PackBundleInput; manifest: PetPackManifestV1; levelIndex: number; locale: Locale; failAssets: boolean }) {
  const { manifest, levelIndex, locale, bundle, failAssets } = props
  const level = manifest.levels[levelIndex]
  if (level === undefined) return null
  const plan = buildSceneRenderPlan({ manifest, level, locale })
  const zoom = plan.cameraZoomPermille / 1000
  return (
    <figure style={{ margin: 0 }} data-showcase-pack={manifest.packId} data-showcase-level={level.levelId} data-showcase-scene={plan.sceneId}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', overflow: 'hidden', borderRadius: 10, background: '#0d1220' }}>
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${zoom.toFixed(3)})`, transformOrigin: 'center' }}>
          {plan.nodes.map((node) => {
            const asset = node.assetId !== null ? manifest.assets.find((a) => a.assetId === node.assetId) : undefined
            const url = asset !== undefined ? bundle.resolveAssetUrl(asset.path) : undefined
            const size = node.kind === 'background' || node.kind === 'overlay' || node.kind === 'terminal-overlay'
              ? '100%'
              : node.kind === 'subject'
                ? `${(60 * node.placement.scalePermille) / 1000}%`
                : node.kind === 'population-representative'
                  ? '14%'
                  : '46%'
            return (
              <div
                key={node.nodeId}
                style={{
                  position: 'absolute',
                  left: `${node.placement.x / 100}%`,
                  top: `${node.placement.y / 100}%`,
                  width: size,
                  aspectRatio: '1 / 1',
                  transform: 'translate(-50%, -50%)',
                  zIndex: node.zOrder,
                }}
              >
                {node.kind === 'aggregate-label' || node.kind === 'milestone' ? (
                  <span
                    style={{
                      fontSize: 12,
                      color: '#e6edf7',
                      background: 'rgba(13,18,32,0.7)',
                      padding: '2px 8px',
                      borderRadius: 999,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {node.text}
                  </span>
                ) : url !== undefined && !failAssets ? (
                  <img
                    src={url}
                    alt=""
                    aria-hidden={node.ariaHidden || undefined}
                    draggable={false}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: node.kind === 'background' || node.kind === 'overlay' || node.kind === 'terminal-overlay' ? 'cover' : 'contain',
                    }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', border: '2px dashed rgba(148,163,184,.8)', borderRadius: 8, color: '#dbe4f3', fontSize: 11, display: 'grid', placeItems: 'center', padding: 4, textAlign: 'center' }}>
                    {node.altText ?? ''}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <figcaption style={{ fontSize: 12, color: '#9fb4d8', marginTop: 6 }}>
        {manifest.packId} · {levelIndex + 1}/{manifest.levels.length} · {locale === 'en' && level.stageName.en !== undefined ? level.stageName.en : level.stageName['zh-CN']}
      </figcaption>
    </figure>
  )
}

export function ShowcaseView(props: { bundles: PackBundleInput[]; locale: Locale; failAssets?: boolean }) {
  const packs = props.bundles
    .map((bundle) => {
      const result = validatePack(bundle.manifestCandidate, { resolveAssetUrl: bundle.resolveAssetUrl, requireBundledKeepsakes: true })
      return result.ok ? { bundle, manifest: result.manifest } : null
    })
    .filter((x): x is { bundle: PackBundleInput; manifest: PetPackManifestV1 } => x !== null)

  return (
    <div data-pet-showcase="true" style={{ display: 'grid', gap: 20 }}>
      {packs.map(({ bundle, manifest }) => (
        <section key={manifest.packId}>
          <h2 style={{ fontSize: 16, color: '#cfe0ff' }}>
            {props.locale === 'en' && manifest.name.en !== undefined ? manifest.name.en : manifest.name['zh-CN']}
          </h2>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {showcaseLevelIndices(manifest).map((levelIndex) => (
              <ShowcaseCell key={manifest.levels[levelIndex]!.levelId} bundle={bundle} manifest={manifest} levelIndex={levelIndex} locale={props.locale} failAssets={props.failAssets === true} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
