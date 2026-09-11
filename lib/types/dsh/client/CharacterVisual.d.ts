import { type ReactElement } from 'react';
import type { PetPresentation } from './pets/types';
import type { VehiclePetExpressionVariant } from './expressions';
interface Props {
    pet: PetPresentation;
    variant: VehiclePetExpressionVariant;
    levelId: string | undefined;
    locale: string | undefined;
    interactionCount: number;
}
export declare function CharacterVisual(props: Props): ReactElement;
/** Hit-style helper resolved from a pet's own recipe data (generic). */
export declare function petHitStyle(pet: PetPresentation, variant: VehiclePetExpressionVariant, surfaceSize: number): {
    left: string;
    top: string;
    width: string;
    height: string;
} | undefined;
export {};
//# sourceMappingURL=CharacterVisual.d.ts.map