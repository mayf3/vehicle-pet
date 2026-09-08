/**
 * ExpressionLayer: the static per-variant expression overlay rendered inside
 * the subject box (DSH_PET_OVERLAY_ADAPTER_V3 CTR-OVERLAY-014). The layer is
 * aria-hidden, non-interactive, and positioned by the per-level face anchor
 * table; reduced motion never hides it (CTR-OVERLAY-015 static carrier).
 */
import { type ReactElement } from 'react';
import { type VehiclePetExpressionVariant } from './expressions';
export interface ExpressionLayerProps {
    readonly variant: VehiclePetExpressionVariant;
    readonly derivedLevelId: string | undefined;
}
export declare function ExpressionLayer(props: ExpressionLayerProps): ReactElement | null;
//# sourceMappingURL=ExpressionLayer.d.ts.map