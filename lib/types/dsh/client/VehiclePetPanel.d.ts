/**
 * VehiclePetPanel: the 264px low-frequency compact panel (DSH_PET_OVERLAY_ADAPTER_V2
 * CTR-OVERLAY-005). Contains exactly the five authorized §8.2 items: stage/level,
 * progress plus next threshold, "View full journey", one "More" disclosure holding
 * the Reduced Motion control, and Collapse. The header keeps only the title and the
 * close action. No Pack switch (the DSH surface exposes `autonomous-fleet` as the
 * only user-selectable product Pack, CTR-OVERLAY-006), no keepsake row, no pack
 * name row, no mock controls, no dev console. Escape closes the panel and returns
 * focus to the pet.
 */
import { type ReactElement, type RefObject } from 'react';
import { type VehiclePetOverlayPreferences } from './types';
export interface VehiclePetPanelProps {
    readonly panelRef: RefObject<HTMLElement>;
    readonly horizontal: 'left' | 'right';
    readonly vertical: 'above' | 'below';
    readonly preferences: VehiclePetOverlayPreferences;
    readonly onCollapse: () => void;
    readonly onRequestClose: () => void;
    readonly onOpenJourney: () => void;
    readonly journeyTriggerRef: RefObject<HTMLButtonElement>;
}
export declare function VehiclePetPanel(props: VehiclePetPanelProps): ReactElement;
//# sourceMappingURL=VehiclePetPanel.d.ts.map