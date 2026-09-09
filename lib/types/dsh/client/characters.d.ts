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
//# sourceMappingURL=characters.d.ts.map