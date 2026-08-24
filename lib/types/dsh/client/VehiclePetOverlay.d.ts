/**
 * VehiclePetOverlay: the `shell.overlay` entry (CTR-OVERLAY-002..013).
 * Root layer is click-through; the pet, launcher, compact panel, and full
 * journey dialog re-enable pointer events. Exactly three persisted
 * interaction states (VISIBLE / PANEL_OPEN / COLLAPSED, default VISIBLE,
 * no full hide). During structured onboarding no surface is rendered, and the
 * exact pre-suppression state returns when onboarding ends in the same mount.
 * One Engine instance backs the overlay, panel, and dialog; structured
 * session state drives transient visuals only and never progression.
 */
import { type ReactElement } from 'react';
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import type { VehiclePetOverlayPreferences, VehiclePetSessionView } from './types';
/** The injected hooks share the renderer binds from the `hooks` compartment. */
export interface VehiclePetInjected {
    hooks: {
        sessionView: HostObservable<VehiclePetSessionView>;
        locale: HostObservable<{
            active: string;
            revision: number;
        }>;
    };
}
export type VehiclePetOverlayProps = PropsRuntime<'shell.overlay'> & InjectFace<VehiclePetInjected> & PropsLocale<'vehicle-pet'>;
/** Overlay chrome shared with the panel/dialog: translate + pref commit. */
interface OverlayChrome {
    t: PropsLocale<'vehicle-pet'>['t'];
    commitPreferences: (update: (current: VehiclePetOverlayPreferences) => VehiclePetOverlayPreferences) => void;
}
export declare function useOverlayChrome(): OverlayChrome;
/** Test/localization seam for panel copy: translate through the entry locale seat. */
export declare function useOverlayT(): PropsLocale<'vehicle-pet'>['t'];
export declare function useOverlayCommitPreferences(): OverlayChrome['commitPreferences'];
export declare function VehiclePetOverlay(props: VehiclePetOverlayProps): ReactElement | null;
export {};
//# sourceMappingURL=VehiclePetOverlay.d.ts.map