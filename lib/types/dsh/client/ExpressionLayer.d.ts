/**
 * ExpressionLayer: the static per-state expression overlay rendered inside
 * the subject box (DSH_PET_OVERLAY_ADAPTER_V2 CTR-OVERLAY-014). The layer is
 * aria-hidden, non-interactive, and positioned by the per-level face anchor
 * table; reduced motion never hides it (CTR-OVERLAY-015 static carrier).
 */
import { type ReactElement } from 'react';
import type { VehiclePetSessionView } from './types';
export interface ExpressionLayerProps {
    readonly sessionView: VehiclePetSessionView;
    readonly derivedLevelId: string | undefined;
}
export declare function ExpressionLayer(props: ExpressionLayerProps): ReactElement | null;
//# sourceMappingURL=ExpressionLayer.d.ts.map