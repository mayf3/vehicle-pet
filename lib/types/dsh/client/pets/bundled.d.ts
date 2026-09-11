/**
 * Bundled pet presentation registry (DSH_PET_OVERLAY_ADAPTER_V8 §17
 * CTR-OVERLAY-038/041). This is the only place concrete pets are wired into
 * the DSH adapter; there is no runtime pet installer and no remote pack
 * support. The recipe vocabulary and lookup rules are generic; individual pet
 * facts live in each pet's data directory. Unknown or removed pet ids fail
 * soft to the documented default pet without mutating growth data.
 */
import type { CharacterBehaviorProfile } from '../behavior';
import type { PetPresentation, PetRecipe } from './types';
/** Every bundled pet presentation, in menu order. */
export declare const petPresentations: readonly PetPresentation[];
/** Documented default pet for absent/unknown preference values (CTR-041). */
export declare const DEFAULT_PET_ID = "vehicle";
/** All pets the secondary selector offers, in declared order (CTR-041). */
export declare function userSelectablePets(): readonly PetPresentation[];
/** Resolve any stored value to a bundled pet id; unknown fails soft to the default. */
export declare function resolvePetId(value: unknown): string;
/** Look up a bundled pet presentation by id (undefined when absent). */
export declare function petPresentationById(id: string | undefined): PetPresentation | undefined;
/** Required lookup for already-normalized ids (post resolvePetId). */
export declare function petDefinition(id: string): PetPresentation;
/** Recipe for a normalized pet id. */
export declare function petRecipe(id: string): PetRecipe;
/** Behavior profile for a normalized pet id (CTR-037 profiles are pet data). */
export declare function petBehavior(id: string): CharacterBehaviorProfile;
/**
 * Localized grade row for a level id (presentation data only; level meaning
 * stays Engine-owned). Null when the pet or level is unknown.
 */
export declare function petGrade(id: string, levelId: string | undefined, locale: string | undefined): {
    grade: string;
    description: string;
    index: number;
} | null;
/** Display name for menus, fallback text, and aria labels. */
export declare function petDisplayName(id: string, locale: string | undefined): string;
//# sourceMappingURL=bundled.d.ts.map