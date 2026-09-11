/**
 * Public Pet Engine API. Everything a Host or Pack assembly layer may import.
 * The engine layer never imports react, prototype, or any concrete Pack.
 */
export { PetEngine, type PetEngineOptions, type EngineSnapshot } from './engine';
export type { RegisteredPack, PackBundleInput } from './packs/registry';
export { PackRegistry } from './packs/registry';
export { validatePack, overlayVisualClass, type PackValidationResult, type ValidatePackOptions } from './validation/validate-pack';
export { validateProgressSnapshot, type SnapshotValidationResult } from './validation/validate-snapshot';
export { validateHostActivityEvent, type HostEventValidationResult } from './validation/validate-host-event';
export * from './validation/patterns';
export { deriveLevel, deriveProgress, derivePetViewModel, type DerivedProgress } from './progress/derive';
export { buildSceneRenderPlan, buildStructureFingerprint, structuralDifferenceCount, sceneById, type BuildRenderPlanInput, } from './rendering/render-plan';
export { MAX_NODES_PER_POPULATION, MAX_NODES_PER_PET_SCENE, SCALE_SUBJECT_PERMILLE, CAMERA_ZOOM_PERMILLE, DENSITY_LIMIT_MULTIPLIER, populationRenderLimit, MILESTONE_PLACEMENT, placementPoint, } from './rendering/presets';
export type { PetStorageAdapter, ClaimResult } from './storage/adapter';
export { receiptId, computeLocalDay, journalRecordKey, keepsakeRecordKey, keepsakeKeyFromRecord, } from './storage/keys';
export { MemoryPetStorageAdapter, createMemoryBackingStore, type MemoryBackingStore } from './storage/memory';
export { IndexedDbPetStorage, type IndexedDbPetStorageOptions } from './storage/indexeddb';
export { createUpgradeReceipt, crossedLevelRange } from './presentation/receipts';
export { buildMergedCeremony, MAX_CEREMONY_BEATS, CEREMONY_MAX_TOTAL_MS, type CeremonyPlan, type CeremonyBeat, } from './presentation/ceremony';
export { HostActivityDispatcher, type HostFeedbackPresentation } from './events/host-activity';
export { resolveLocalizedText, isSupportedLocale, DEFAULT_LOCALE, SUPPORTED_LOCALES, } from './localization';
export type * from './types';
//# sourceMappingURL=index.d.ts.map