/**
 * V5 compact settings, opened by pet double-click or keyboard equivalent.
 * Character, size, Full Journey and Collapse; outside press / Escape close.
 */
import { type ReactElement, type RefObject } from 'react';
import { type VehiclePetOverlayPreferences, type VehiclePetSize } from './types';
export interface VehiclePetSecondaryMenuProps {
    readonly menuRef: RefObject<HTMLElement | null>;
    readonly preferences: VehiclePetOverlayPreferences;
    /** User-selectable pets with localized labels (V8 CTR-OVERLAY-041). */
    readonly pets: readonly {
        readonly id: string;
        readonly label: string;
    }[];
    readonly placement: {
        horizontal: 'left' | 'right';
        vertical: 'above' | 'below';
    };
    readonly onCommitSize: (size: VehiclePetSize) => void;
    readonly onCollapse: () => void;
    readonly onOpenJourney: () => void;
    readonly onRequestClose: () => void;
    /** V7 CTR-029: fired by the outside-press close only (never by Escape), so
     * the pet can drop the closing interaction's double-click chain. */
    readonly onOutsidePress?: () => void;
    /** While true, Escape belongs to the journey dialog, not the menu. */
    readonly dialogOpen?: boolean;
    readonly journeyTriggerRef: RefObject<HTMLButtonElement | null>;
}
export declare function VehiclePetSecondaryMenu(props: VehiclePetSecondaryMenuProps): ReactElement;
//# sourceMappingURL=VehiclePetSecondaryMenu.d.ts.map