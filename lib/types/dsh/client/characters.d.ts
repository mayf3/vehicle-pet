import type { CharacterId } from './types';
import type { VehiclePetExpressionVariant } from './expressions';
export declare const CHARACTER_DEFINITIONS: {
    readonly vehicle: {
        readonly id: "vehicle";
        readonly recipe: "engine-scene";
        readonly brand: "Pony.ai";
    };
    readonly companion: {
        readonly id: "companion";
        readonly recipe: "pose-sprite";
        readonly brand: "Pony.ai";
    };
};
export type CharacterDefinition = typeof CHARACTER_DEFINITIONS[CharacterId];
export declare const COMPANION_POSES: Record<VehiclePetExpressionVariant, number>;
export declare function characterLevel(levelId: string | undefined, locale: string | undefined): {
    grade: string;
    description: string;
    index: number;
} | null;
/**
 * Declarative behavior profiles (V7 CTR-OVERLAY-037): each bundled character
 * definition carries its own presentation tendencies over the same underlying
 * events. Generic presentation infrastructure consumes these; no user-facing
 * personality setting, no third character, no second scheduler.
 */
export interface CharacterBehaviorProfile {
    /** Ambient repertoire ids (see ambient-rules.ts); per-character pools. */
    readonly ambientPool: readonly string[];
    /** Which playful reaction each structured state edge tends to present. */
    readonly stateReactions: {
        readonly completed: 'bounce' | 'proud' | 'nod';
        readonly failed: 'shy' | 'sleepy';
        readonly working: 'nod' | 'wave';
        readonly 'needs-input': 'peek' | 'wave';
    };
    /** Petting presentation family (approved masters only). */
    readonly petting: {
        readonly variant: VehiclePetExpressionVariant;
        readonly decoration: 'heart' | 'sparkles';
    };
}
export declare const BEHAVIOR_PROFILES: Record<CharacterId, CharacterBehaviorProfile>;
//# sourceMappingURL=characters.d.ts.map