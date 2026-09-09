import { type ReactElement } from 'react';
import { type CharacterDefinition } from './characters';
import type { VehiclePetExpressionVariant } from './expressions';
interface Props {
    character: CharacterDefinition;
    variant: VehiclePetExpressionVariant;
    levelId: string | undefined;
    interactionCount: number;
}
export declare function CharacterVisual(props: Props): ReactElement;
export {};
//# sourceMappingURL=CharacterVisual.d.ts.map