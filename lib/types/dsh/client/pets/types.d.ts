/**
 * Declarative pet presentation definitions (DSH_PET_OVERLAY_ADAPTER_V8 §17
 * CTR-OVERLAY-038). The recipe vocabulary and these types are generic; every
 * pet-specific fact — ids, display names, pose mappings, anchors, insignia,
 * catalogs, grade descriptions, behavior tendencies, license and provenance —
 * lives in per-pet bundled data, never in runtime core TypeScript.
 */
import type { VehiclePetExpressionVariant } from '../expressions';
import type { CharacterBehaviorProfile } from '../behavior';
/** Compact bilingual speech catalog data shape (category → lines). */
export type PetSpeechCatalogData = Readonly<Record<string, readonly {
    readonly 'zh-CN': string;
    readonly en: string;
    readonly id?: string;
}[]>>;
/** Fixed generic recipe vocabulary (CTR-OVERLAY-038); pet ids are open. */
export type PetRecipe = 'engine-scene' | 'pose-sprite';
/** Per-pet grade presentation policy (V8 DEC-OVERLAY-029 / CTR-OVERLAY-040). */
export interface GradePresentationPolicy {
    /** Exact `L<n>` numeral on the resident caption; exact identity always stays in DOM data and the Full Journey. */
    readonly showExactLevelNumber: boolean;
    /** Localized grade description on the resident caption. */
    readonly showDescription: boolean;
    /** Symbolic insignia presentation (CTR-OVERLAY-040). */
    readonly insigniaMode: 'none' | 'overlay' | 'wearable';
}
/** One localized grade description row keyed by the Engine level id. */
export interface GradeLevelDescription {
    readonly id: string;
    readonly 'zh-CN': string;
    readonly en: string;
}
/** Pose-sprite recipe data: whole-body pose images swap per expression variant. */
export interface PoseSpriteRecipeData {
    /** Expression variant → pose index (mapping is pet data, not core). */
    readonly variantPose: Readonly<Record<VehiclePetExpressionVariant, number>>;
    /** Bundled pose images (WebP primary with PNG fallback), index-aligned. */
    readonly poses: readonly {
        readonly png: string;
        readonly webp: string;
    }[];
    /** Per-pose visible-alpha bounds `[x0, y0, x1, y1]` on the pose canvas. */
    readonly alphaBounds: readonly (readonly [number, number, number, number])[];
    /** Wearable symbolic insignia; absent when the grade policy declares none. */
    readonly insignia: {
        readonly mode: 'wearable';
        /** Asset URL per journey level index. */
        readonly assets: readonly string[];
        /** `[left%, top%, rotateDeg]` per pose index on the pose canvas. */
        readonly anchors: readonly (readonly [number, number, number])[];
    } | undefined;
}
/** Engine-scene recipe data: pack scenes render through the generic renderer. */
export interface EngineSceneRecipeData {
    /** Per-level face anchor `[left, top, size]` in % of the level sprite canvas. */
    readonly expressionAnchors: Readonly<Record<string, readonly [number, number, number]>>;
}
/** License / attribution / provenance metadata contract (CTR-OVERLAY-038). */
export interface PetLicenseMetadata {
    readonly license: string;
    readonly attribution: string;
    /** Pointer to the in-repo provenance record for generated/raster assets. */
    readonly provenance: string;
}
/**
 * One bundled pet presentation. Everything below except wired asset bytes is
 * declarative data under `src/dsh/client/pets/<petId>/`.
 */
export interface PetPresentationDefinition {
    /** Stable open pet id (preference key); `vehicle` is the documented default. */
    readonly id: string;
    /** Localized display name for the menu, fallback text, and aria labels. */
    readonly displayName: {
        readonly 'zh-CN': string;
        readonly en: string;
    };
    readonly recipe: PetRecipe;
    /** The Engine Pack (journey) this pet presents (V8 DEC-OVERLAY-028). */
    readonly packId: string;
    /** Whether the secondary selector offers this pet (seedling stays internal). */
    readonly userSelectable: boolean;
    readonly gradePolicy: GradePresentationPolicy;
    /** Per-level localized grade descriptions keyed by Engine level id order. */
    readonly gradeLevels: readonly GradeLevelDescription[];
    readonly behavior: CharacterBehaviorProfile;
    /**
     * Bundled speech catalog, compact data shape: category → bilingual lines.
     * The same category set and scheduler apply to every pet (CTR-018/019).
     */
    readonly speech: PetSpeechCatalogData;
    readonly license: PetLicenseMetadata;
}
/** A registry entry: the declarative definition plus its wired recipe data. */
export interface PetPresentation extends PetPresentationDefinition {
    readonly poseSprite?: PoseSpriteRecipeData;
    readonly engineScene?: EngineSceneRecipeData;
}
//# sourceMappingURL=types.d.ts.map