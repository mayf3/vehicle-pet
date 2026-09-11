/**
 * Deterministic SceneRenderPlan builder (CTR-PET-007, CTR-PET-008, §9.17, §10).
 *
 * Allocation algorithm (frozen):
 *   1. non-population nodes enter the plan in scene declaration order
 *      (background, layer nodes, milestone node, then one aggregate-label per
 *      population in declaration order — aggregate semantics are always kept);
 *   2. the remaining budget of MAX_NODES_PER_PET_SCENE goes to populations;
 *   3. each population, in declaration order, receives
 *      min(logicalCount, renderLimit, 32, remainingBudget) representatives;
 *   4. once the budget is exhausted, later populations get 0 representatives
 *      while their logical count and aggregate-label remain in the plan.
 *
 * The plan is a pure function of its inputs; repeated builds are byte-identical.
 */
import type { Locale } from '../types/core';
import type { LevelDefinition, PetPackManifestV1, SceneDefinition } from '../types/manifest';
import type { SceneRenderPlan, SceneStructureFingerprint } from '../types/derived';
export interface BuildRenderPlanInput {
    manifest: PetPackManifestV1;
    level: LevelDefinition;
    locale: Locale;
}
export declare function buildSceneRenderPlan({ manifest, level, locale }: BuildRenderPlanInput): SceneRenderPlan;
export declare function sceneById(manifest: PetPackManifestV1, sceneId: string): SceneDefinition;
/**
 * Mechanical structural fingerprint for the §10.1 adjacent-level diff.
 * Text, numbers, and titles never enter this structure.
 */
export declare function buildStructureFingerprint(manifest: PetPackManifestV1, level: LevelDefinition): SceneStructureFingerprint;
/** Counts the differing non-text dimensions between two fingerprints (§10.1). */
export declare function structuralDifferenceCount(a: SceneStructureFingerprint, b: SceneStructureFingerprint): string[];
//# sourceMappingURL=render-plan.d.ts.map