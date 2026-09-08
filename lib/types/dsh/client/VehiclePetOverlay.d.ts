/**
 * VehiclePetOverlay: the `shell.overlay` entry (DSH_PET_OVERLAY_ADAPTER_V3).
 * Root layer is click-through; the pet hitbox, launcher, secondary menu, and
 * full journey dialog re-enable pointer events. The persisted interaction
 * machine is exactly VISIBLE with a collapsed browser-local preference — no
 * PANEL_OPEN, no full hide (CTR-OVERLAY-004). A normal pet click is a pet
 * reaction (expression variant + light motion + throttled line), never a
 * settings surface (CTR-OVERLAY-021). The resident hitbox hugs the visible
 * sprite within the recorded tolerance (CTR-OVERLAY-003). During structured
 * onboarding no surface is rendered, and the exact pre-suppression state
 * returns when onboarding ends in the same mount (CTR-OVERLAY-011). One
 * Engine instance backs the overlay, menu, and dialog; structured session
 * state drives transient visuals only and never progression.
 */
import { type ReactElement } from 'react';
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type Locale, type PetStorageAdapter } from '../../engine';
import type { VehiclePetBindingInfo } from './session-state-adapter';
import type { UsageSessionsSource } from './usage-progress-source';
import { type VehiclePetOverlayPreferences, type VehiclePetSessionView } from './types';
/** The injected hooks share the renderer binds from the `hooks` compartment. */
export interface VehiclePetInjected {
    hooks: {
        sessionView: HostObservable<VehiclePetSessionView>;
        locale: HostObservable<{
            active: string;
            revision: number;
        }>;
    };
    /** Structured adapter-binding handshake; exposed as inert data attributes. */
    sessionBinding?: () => VehiclePetBindingInfo;
    /** Injected `ctx.sessions` face feeding the authorized usage source (DSH_USAGE_PROGRESS_SOURCE_V1). */
    usageSessions?: UsageSessionsSource;
    clientGeneration?: string;
}
export type VehiclePetOverlayProps = PropsRuntime<'shell.overlay'> & InjectFace<VehiclePetInjected> & PropsLocale<'vehicle-pet'>;
/** Overlay chrome shared with the menu/dialog: translate + pref commit. */
interface OverlayChrome {
    t: PropsLocale<'vehicle-pet'>['t'];
    commitPreferences: (update: (current: VehiclePetOverlayPreferences) => VehiclePetOverlayPreferences) => void;
    engineLocale: Locale;
}
export declare function useOverlayChrome(): OverlayChrome;
/** Test/localization seam for menu copy: translate through the entry locale seat. */
export declare function useOverlayT(): PropsLocale<'vehicle-pet'>['t'];
export declare function useOverlayCommitPreferences(): OverlayChrome['commitPreferences'];
export declare function VehiclePetOverlay(props: VehiclePetOverlayProps): ReactElement | null;
/** An adapter created by this Overlay and therefore closed by its lifecycle. */
export type OwnedOverlayStorage = PetStorageAdapter & {
    close(): void;
};
export interface OwnedOverlayStorageLifecycleOptions {
    readonly create: () => Promise<OwnedOverlayStorage>;
    readonly onReady: (storage: PetStorageAdapter) => void;
    readonly fallback: PetStorageAdapter;
}
/**
 * Own one asynchronous storage acquisition across mount, stop, and HMR.
 * The returned disposer is idempotent. A connection resolving after disposal
 * is closed immediately and is never published into the unmounted tree.
 */
export declare function acquireOwnedOverlayStorage({ create, onReady, fallback, }: OwnedOverlayStorageLifecycleOptions): () => void;
export {};
//# sourceMappingURL=VehiclePetOverlay.d.ts.map