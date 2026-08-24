/**
 * Overlay preferences: one versioned browser-local record owning normalized
 * position, collapsed state, and the explicit reduced-motion choice
 * (CTR-OVERLAY-010). Tolerant of missing, malformed, wrong-version,
 * out-of-range, NaN/Infinity, quota-failed, and unavailable storage; the pet
 * never blocks on preferences. Same-origin `storage` events sync another tab
 * without write loops; every listener is returned as a disposer.
 */

import type { VehiclePetOverlayPreferences } from './types'

export const OVERLAY_PREFERENCES_KEY = 'vehicle-pet/overlay-preferences/v1'

export const DEFAULT_OVERLAY_PREFERENCES: Readonly<VehiclePetOverlayPreferences> = Object.freeze({
  schemaVersion: 1,
  position: Object.freeze({ xRatio: 1, yRatio: 1 }),
  collapsed: false,
  reducedMotion: undefined,
})

const finiteRatio = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback

/** Normalize any unknown stored value into valid preferences (or defaults). */
export function normalizeOverlayPreferences(value: unknown): VehiclePetOverlayPreferences {
  if (typeof value !== 'object' || value === null) return copyOverlayDefaults()
  const candidate = value as Partial<VehiclePetOverlayPreferences>
  if (candidate.schemaVersion !== 1) return copyOverlayDefaults()
  const position = typeof candidate.position === 'object' && candidate.position !== null
    ? (candidate.position as { xRatio?: unknown; yRatio?: unknown })
    : {}
  return {
    schemaVersion: 1,
    position: {
      xRatio: finiteRatio(position.xRatio, DEFAULT_OVERLAY_PREFERENCES.position.xRatio),
      yRatio: finiteRatio(position.yRatio, DEFAULT_OVERLAY_PREFERENCES.position.yRatio),
    },
    collapsed: typeof candidate.collapsed === 'boolean' ? candidate.collapsed : false,
    reducedMotion: typeof candidate.reducedMotion === 'boolean' ? candidate.reducedMotion : undefined,
  }
}

export function copyOverlayDefaults(): VehiclePetOverlayPreferences {
  return { ...DEFAULT_OVERLAY_PREFERENCES, position: { ...DEFAULT_OVERLAY_PREFERENCES.position } }
}

function readGlobalStorage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export function loadOverlayPreferences(
  storage: Pick<Storage, 'getItem'> | undefined | null = null,
): VehiclePetOverlayPreferences {
  const target = storage === null ? readGlobalStorage() : storage
  if (target === undefined) return copyOverlayDefaults()
  try {
    const raw = target.getItem(OVERLAY_PREFERENCES_KEY)
    if (raw === null) return copyOverlayDefaults()
    return normalizeOverlayPreferences(JSON.parse(raw) as unknown)
  } catch {
    return copyOverlayDefaults()
  }
}

export function saveOverlayPreferences(
  preferences: VehiclePetOverlayPreferences,
  storage: Pick<Storage, 'setItem'> | undefined | null = null,
): void {
  const target = storage === null ? readGlobalStorage() : storage
  if (target === undefined) return
  try {
    target.setItem(OVERLAY_PREFERENCES_KEY, JSON.stringify(normalizeOverlayPreferences(preferences)))
  } catch {
    // Storage may be disabled or full; the in-memory preference remains valid.
  }
}

/**
 * Multi-tab sync: adopt a same-origin `storage` event for our key. Returns the
 * adopted preferences when the stored record differs from ours, `null` when
 * nothing to adopt. Never writes, so no write loop can form.
 */
export function adoptStorageEvent(
  event: Pick<StorageEvent, 'key' | 'newValue'>,
  current: VehiclePetOverlayPreferences,
): VehiclePetOverlayPreferences | null {
  if (event.key !== OVERLAY_PREFERENCES_KEY) return null
  try {
    const next = event.newValue === null
      ? copyOverlayDefaults()
      : normalizeOverlayPreferences(JSON.parse(event.newValue) as unknown)
    if (next.position.xRatio !== current.position.xRatio
      || next.position.yRatio !== current.position.yRatio
      || next.collapsed !== current.collapsed
      || next.reducedMotion !== current.reducedMotion) {
      return next
    }
    return null
  } catch {
    return null
  }
}

/**
 * Subscribe to `storage` events (the same-origin cross-tab channel).
 * @returns disposer removing the listener.
 */
export function subscribeStorageEvents(
  onEvent: (event: StorageEvent) => void,
  target: Pick<typeof window, 'addEventListener' | 'removeEventListener'> | undefined
    = typeof window === 'undefined' ? undefined : window,
): () => void {
  if (target === undefined) return () => {}
  target.addEventListener('storage', onEvent)
  return () => {
    target.removeEventListener('storage', onEvent)
  }
}
