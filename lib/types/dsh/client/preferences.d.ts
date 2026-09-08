/**
 * Overlay preferences: one versioned browser-local record owning normalized
 * position, collapsed state, the explicit reduced-motion choice, and the
 * SMALL/LARGE size choice (V3 CTR-OVERLAY-010). Tolerant of missing,
 * malformed, wrong-version, out-of-range, NaN/Infinity, quota-failed, and
 * unavailable storage; the pet never blocks on preferences. A record without
 * an explicit size choice — including every pre-V3 record — resolves to LARGE
 * without rewriting the stored bytes. Same-origin `storage` events sync
 * another tab without write loops; every listener is returned as a disposer.
 */
import type { VehiclePetOverlayPreferences } from './types';
export declare const OVERLAY_PREFERENCES_KEY = "vehicle-pet/overlay-preferences/v1";
export declare const DEFAULT_OVERLAY_PREFERENCES: Readonly<VehiclePetOverlayPreferences>;
/** Normalize any unknown stored value into valid preferences (or defaults). */
export declare function normalizeOverlayPreferences(value: unknown): VehiclePetOverlayPreferences;
export declare function copyOverlayDefaults(): VehiclePetOverlayPreferences;
export declare function loadOverlayPreferences(storage?: Pick<Storage, 'getItem'> | undefined | null): VehiclePetOverlayPreferences;
export declare function saveOverlayPreferences(preferences: VehiclePetOverlayPreferences, storage?: Pick<Storage, 'setItem'> | undefined | null): void;
/**
 * Multi-tab sync: adopt a same-origin `storage` event for our key. Returns the
 * adopted preferences when the stored record differs from ours, `null` when
 * nothing to adopt. Never writes, so no write loop can form.
 */
export declare function adoptStorageEvent(event: Pick<StorageEvent, 'key' | 'newValue'>, current: VehiclePetOverlayPreferences): VehiclePetOverlayPreferences | null;
/**
 * Subscribe to `storage` events (the same-origin cross-tab channel).
 * @returns disposer removing the listener.
 */
export declare function subscribeStorageEvents(onEvent: (event: StorageEvent) => void, target?: Pick<typeof window, 'addEventListener' | 'removeEventListener'> | undefined): () => void;
//# sourceMappingURL=preferences.d.ts.map