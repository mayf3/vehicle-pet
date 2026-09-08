/**
 * VehiclePetSecondaryMenu: the small non-modal secondary settings affordance
 * (DSH_PET_OVERLAY_ADAPTER_V3 DEC-OVERLAY-008 / CTR-OVERLAY-005). Revealed by
 * hover / focus / the keyboard-equivalent toggle — never by a normal pet click
 * — and contains exactly: size (SMALL/LARGE), Reduced Motion (system/on/off
 * semantics unchanged), Full Journey entry, and Collapse. No progression
 * numbers, level names, Pack names, keepsakes, or engineering readouts.
 * Outside press and Escape close it. Narrow fixed width ≤224px.
 */
import { type ReactElement, type RefObject } from 'react';
import { type VehiclePetOverlayPreferences, type VehiclePetSize } from './types';
export interface VehiclePetSecondaryMenuProps {
    readonly menuRef: RefObject<HTMLElement | null>;
    readonly preferences: VehiclePetOverlayPreferences;
    readonly placement: {
        horizontal: 'left' | 'right';
        vertical: 'above' | 'below';
    };
    readonly onCommitSize: (size: VehiclePetSize) => void;
    readonly onCollapse: () => void;
    readonly onOpenJourney: () => void;
    readonly onRequestClose: () => void;
    readonly journeyTriggerRef: RefObject<HTMLButtonElement | null>;
}
export declare function VehiclePetSecondaryMenu(props: VehiclePetSecondaryMenuProps): ReactElement;
//# sourceMappingURL=VehiclePetSecondaryMenu.d.ts.map