/**
 * VehiclePetPanel: the 320px compact panel (CTR-OVERLAY-005). Contains
 * exactly the eight authorized items: Pack name, stage/level, progress plus
 * next threshold, latest keepsake, Pack switch, Reduced Motion control,
 * Collapse, and "View full journey". No mock controls, no exact-points input,
 * no fault injection, no diagnostics, no dev console. Escape closes the panel
 * and returns focus to the pet.
 */
import { type ReactElement, type RefObject } from 'react';
import type { VehiclePetOverlayPreferences } from './types';
export interface VehiclePetPanelProps {
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