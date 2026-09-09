import { type ReactElement } from 'react';
import { type CharacterDefinition } from './characters';
import type { VehiclePetExpressionVariant } from './expressions';
export declare function companionHitStyle(variant: VehiclePetExpressionVariant, surfaceSize: number): {
    left: string;
    top: string;
    width: string;
    height: string;
};
interface Props {
    character: CharacterDefinition;
    variant: VehiclePetExpressionVariant;
    levelId: string | undefined;
    interactionCount: number;
}
export declare function CharacterVisual(props: Props): ReactElement;
export {};
//# sourceMappingURL=CharacterVisual.d.ts.map