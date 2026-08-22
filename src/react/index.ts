/**
 * Public React adapter API for the Pet Engine.
 * This layer depends only on the engine public API and contains no Pack branches.
 */

export { PetEngineProvider, usePetEngine, type PetEngineProviderProps, type PetEngineContextValue } from './PetEngineProvider'
export { PetSceneRenderer, type PetSceneRendererProps } from './PetSceneRenderer'
export { PetProgressPanel } from './PetProgressPanel'
export { PetMilestonePanel } from './PetMilestonePanel'
export { PetKeepsakeCollection } from './PetKeepsakeCollection'
export { UpgradeCeremony } from './UpgradeCeremony'
export { DailyGreeting } from './DailyGreeting'
export { HostActivityFeedback } from './HostActivityFeedback'
export { AssetFallback, type AssetFallbackProps } from './AssetFallback'
export { PackSelector } from './PackSelector'
export { LocaleSelector } from './LocaleSelector'
export { engineCopy, textResolver, stableVariantIndex } from './copy'
