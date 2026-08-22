import type { PetPackManifestV1, SceneRenderPlan } from '../../src/engine'

export function rendererContext(manifest: PetPackManifestV1, plan: SceneRenderPlan, reducedMotion = false) {
  return {
    snapshot: {
      initialized: true,
      plan,
      reducedMotion,
      activePack: { manifest, resolveAssetUrl: (path: string) => `/assets/${path}` },
      viewModel: { derivedLevelId: plan.levelId },
      locale: 'en',
    },
    copy: { waitingProgress: 'Waiting', clickFeedback: 'Hello' },
    assetUrl: (assetId: string) => `/assets/${assetId}.webp`,
    resolveText: (text: { en?: string; 'zh-CN': string }) => text.en ?? text['zh-CN'],
  }
}
