/**
 * Overlay preference tolerance and multi-tab behavior (CTR-OVERLAY-010,
 * ACC-OVERLAY-011): safe defaults for missing/malformed/wrong-version/
 * out-of-range/NaN/Infinity records, quota-failed writes, storage-event
 * adoption without write loops, and listener disposal.
 */

import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_OVERLAY_PREFERENCES,
  OVERLAY_PREFERENCES_KEY,
  adoptStorageEvent,
  copyOverlayDefaults,
  loadOverlayPreferences,
  normalizeOverlayPreferences,
  saveOverlayPreferences,
  subscribeStorageEvents,
} from '../../../src/dsh/client/preferences'
import { OVERLAY_GEOMETRY } from '../../../src/dsh/client/types'
import { moveCompleteActiveSurface, pointFromRatios, resolveCompleteActiveSurfaceLayout } from '../../../src/dsh/client/useOverlayDrag'

function memoryStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial))
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
  }
}

describe('normalizeOverlayPreferences', () => {
  it('returns defaults for non-object, null, and wrong-version values', () => {
    expect(normalizeOverlayPreferences(undefined)).toEqual(copyOverlayDefaults())
    expect(normalizeOverlayPreferences(null)).toEqual(copyOverlayDefaults())
    expect(normalizeOverlayPreferences(42)).toEqual(copyOverlayDefaults())
    expect(normalizeOverlayPreferences('{"schemaVersion":2}')).toEqual(copyOverlayDefaults())
  })

  it('clamps out-of-range, NaN, and Infinity ratios to valid ratios', () => {
    const normalized = normalizeOverlayPreferences({
      schemaVersion: 1,
      position: { xRatio: 7, yRatio: -3 },
      collapsed: true,
    })
    expect(normalized.position).toEqual({ xRatio: 1, yRatio: 0 })
    expect(normalized.positionCustomized).toBe(true)
    const nan = normalizeOverlayPreferences({
      schemaVersion: 1,
      position: { xRatio: Number.NaN, yRatio: Number.POSITIVE_INFINITY },
    })
    expect(nan.position).toEqual({ xRatio: 1, yRatio: 1 })
    expect(nan.positionCustomized).toBe(false)
  })

  it('preserves collapsed and the explicit reduced-motion choice', () => {
    expect(normalizeOverlayPreferences({
      schemaVersion: 1,
      position: { xRatio: 0.25, yRatio: 0.5 },
      positionCustomized: true,
      collapsed: true,
      reducedMotion: true,
    })).toEqual({
      schemaVersion: 1,
      position: { xRatio: 0.25, yRatio: 0.5 },
      positionCustomized: true,
      collapsed: true,
      reducedMotion: true,
    })
    expect(normalizeOverlayPreferences({ schemaVersion: 1 }).reducedMotion).toBeUndefined()
  })
})

describe('safe bottom-right placement', () => {
  it('reserves the deterministic bottom inset only until the user customizes position', () => {
    const bounds = { width: 1440, height: 900 }
    const defaults = copyOverlayDefaults()
    const safe = pointFromRatios(defaults, bounds, OVERLAY_GEOMETRY.visibleSizePx)
    expect(safe.x).toBe(1440 - OVERLAY_GEOMETRY.visibleSizePx - OVERLAY_GEOMETRY.viewportMarginPx)
    expect(safe.y).toBe(900 - OVERLAY_GEOMETRY.visibleSizePx - OVERLAY_GEOMETRY.viewportMarginPx - OVERLAY_GEOMETRY.defaultBottomSafeInsetPx)

    const customized = { ...defaults, positionCustomized: true }
    const restored = pointFromRatios(customized, bounds, OVERLAY_GEOMETRY.visibleSizePx)
    expect(restored.y).toBe(900 - OVERLAY_GEOMETRY.visibleSizePx - OVERLAY_GEOMETRY.viewportMarginPx)
  })

  it('keeps the default visible and collapsed surfaces inside a 390px viewport', () => {
    for (const size of [OVERLAY_GEOMETRY.visibleSizePx, OVERLAY_GEOMETRY.collapsedLauncherSizePx]) {
      const point = pointFromRatios(copyOverlayDefaults(), { width: 390, height: 844 }, size)
      expect(point.x).toBeGreaterThanOrEqual(0)
      expect(point.y).toBeGreaterThanOrEqual(0)
      expect(point.x + size).toBeLessThanOrEqual(390)
      expect(point.y + size).toBeLessThanOrEqual(844)
    }
  })
})

describe('PANEL_COMPLETE_ACTIVE_SURFACE_CLAMP_TEST', () => {
  const viewports = [
    { width: 390, height: 844 },
    { width: 768, height: 720 },
    { width: 1280, height: 800 },
    { width: 1440, height: 900 },
  ] as const
  const xRatios = [0, 0.1, 0.25, 0.49, 0.5, 0.75, 0.9, 1] as const
  const yRatios = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1] as const

  it('clamps every real Pet + gap + Panel union and preserves the ratio anchor', () => {
    const margin = OVERLAY_GEOMETRY.viewportMarginPx
    for (const viewport of viewports) {
      for (const xRatio of xRatios) {
        for (const yRatio of yRatios) {
          const preferences = {
            ...copyOverlayDefaults(),
            position: { xRatio, yRatio },
            positionCustomized: true,
          }
          const anchor = pointFromRatios(preferences, viewport, OVERLAY_GEOMETRY.visibleSizePx)
          const original = { ...anchor }
          const layout = resolveCompleteActiveSurfaceLayout(
            anchor,
            viewport,
            OVERLAY_GEOMETRY.visibleSizePx,
            true,
            { width: OVERLAY_GEOMETRY.compactPanelWidthPx, height: 500 },
            { horizontal: xRatio > 0.5 ? 'right' : 'left', vertical: yRatio > 0.5 ? 'above' : 'below' },
          )
          expect(layout.activeBounds.left, `${viewport.width}x${viewport.height} x=${xRatio} y=${yRatio} left`).toBeGreaterThanOrEqual(margin)
          expect(layout.activeBounds.top, `${viewport.width}x${viewport.height} x=${xRatio} y=${yRatio} top`).toBeGreaterThanOrEqual(margin)
          expect(layout.activeBounds.right, `${viewport.width}x${viewport.height} x=${xRatio} y=${yRatio} right`).toBeLessThanOrEqual(viewport.width - margin)
          expect(layout.activeBounds.bottom, `${viewport.width}x${viewport.height} x=${xRatio} y=${yRatio} bottom`).toBeLessThanOrEqual(viewport.height - margin)
          expect(anchor).toEqual(original)
        }
      }
    }
  })

  it('keeps VISIBLE at 112px and COLLAPSED at 36px while flipping Panel directions', () => {
    const viewport = { width: 390, height: 844 }
    const nearCenter = { x: 16 + (390 - 112 - 32) * 0.49, y: 700 }
    const panel = resolveCompleteActiveSurfaceLayout(
      nearCenter,
      viewport,
      112,
      true,
      { width: 320, height: 500 },
      { horizontal: 'left', vertical: 'below' },
    )
    expect(panel.panelPlacement.vertical).toBe('above')
    expect(panel.activeBounds.right).toBeLessThanOrEqual(374)
    expect(panel.activeBounds.bottom).toBeLessThanOrEqual(828)

    for (const size of [112, 36]) {
      const layout = resolveCompleteActiveSurfaceLayout(
        { x: 999, y: 999 }, viewport, size, false, { width: 0, height: 0 },
        { horizontal: 'left', vertical: 'below' },
      )
      expect(layout.activeBounds.right - layout.activeBounds.left).toBe(size)
      expect(layout.activeBounds.bottom - layout.activeBounds.top).toBe(size)
      expect(layout.activeBounds.right).toBeLessThanOrEqual(374)
      expect(layout.activeBounds.bottom).toBeLessThanOrEqual(828)
    }
  })

  it('PANEL_OPEN_ALL_DIRECTIONS_TEST starts every valid first input at the rendered anchor', () => {
    const margin = OVERLAY_GEOMETRY.viewportMarginPx
    const panelSize = { width: 320, height: 500 }
    const deltas = [
      { name: 'left-5', x: -5, y: 0 }, { name: 'left-8', x: -8, y: 0 }, { name: 'left-32', x: -32, y: 0 },
      { name: 'right-5', x: 5, y: 0 }, { name: 'right-8', x: 8, y: 0 }, { name: 'right-32', x: 32, y: 0 },
      { name: 'up-5', x: 0, y: -5 }, { name: 'up-8', x: 0, y: -8 }, { name: 'up-32', x: 0, y: -32 },
      { name: 'down-5', x: 0, y: 5 }, { name: 'down-8', x: 0, y: 8 }, { name: 'down-32', x: 0, y: 32 },
    ] as const
    for (const viewport of viewports) {
      for (const xRatio of xRatios) {
        for (const yRatio of yRatios) {
          const anchor = pointFromRatios({
            ...copyOverlayDefaults(), position: { xRatio, yRatio }, positionCustomized: true,
          }, viewport, OVERLAY_GEOMETRY.visibleSizePx)
          const initial = resolveCompleteActiveSurfaceLayout(
            anchor, viewport, 112, true, panelSize,
            { horizontal: xRatio > 0.5 ? 'right' : 'left', vertical: yRatio > 0.5 ? 'above' : 'below' },
          )
          for (const delta of deltas) {
            const hasSpace = delta.x < 0 ? initial.activeBounds.left > margin
              : delta.x > 0 ? initial.activeBounds.right < viewport.width - margin
                : delta.y < 0 ? initial.activeBounds.top > margin
                  : initial.activeBounds.bottom < viewport.height - margin
            const next = moveCompleteActiveSurface(
              initial.point, delta, viewport, 112, true, panelSize, initial.panelPlacement,
            )
            expect(next.activeBounds.left, `${viewport.width}x${viewport.height} ${xRatio}/${yRatio} ${delta.name}`).toBeGreaterThanOrEqual(margin)
            expect(next.activeBounds.top).toBeGreaterThanOrEqual(margin)
            expect(next.activeBounds.right).toBeLessThanOrEqual(viewport.width - margin)
            expect(next.activeBounds.bottom).toBeLessThanOrEqual(viewport.height - margin)
            const visibleDelta = Math.abs(next.point.x - initial.point.x) + Math.abs(next.point.y - initial.point.y)
            if (hasSpace) expect(visibleDelta, `${viewport.width}x${viewport.height} ${xRatio}/${yRatio} ${delta.name}`).toBeGreaterThan(0)
          }
        }
      }
    }
  })

  it('PANEL_OPEN_BOUNDARY_OPPOSITE_DIRECTION_TEST moves immediately away from every boundary', () => {
    const viewport = { width: 1440, height: 900 }
    const panelSize = { width: 320, height: 440 }
    const cases = [
      { anchor: { x: -999, y: 300 }, toward: { x: -8, y: 0 }, opposite: { x: 8, y: 0 } },
      { anchor: { x: 9999, y: 300 }, toward: { x: 8, y: 0 }, opposite: { x: -8, y: 0 } },
      { anchor: { x: 600, y: -999 }, toward: { x: 0, y: -8 }, opposite: { x: 0, y: 8 } },
      { anchor: { x: 600, y: 9999 }, toward: { x: 0, y: 8 }, opposite: { x: 0, y: -8 } },
    ] as const
    for (const item of cases) {
      const initial = resolveCompleteActiveSurfaceLayout(
        item.anchor, viewport, 112, true, panelSize, { horizontal: 'left', vertical: 'below' },
      )
      const toward = moveCompleteActiveSurface(initial.point, item.toward, viewport, 112, true, panelSize, initial.panelPlacement)
      expect(toward.point).toEqual(initial.point)
      const opposite = moveCompleteActiveSurface(initial.point, item.opposite, viewport, 112, true, panelSize, initial.panelPlacement)
      expect(Math.abs(opposite.point.x - initial.point.x) + Math.abs(opposite.point.y - initial.point.y)).toBeGreaterThan(0)
    }
  })

  it('PANEL_OPEN_ALL_PANEL_ORIENTATIONS_TEST preserves each feasible preferred orientation', () => {
    const viewport = { width: 1440, height: 900 }
    const panelSize = { width: 320, height: 300 }
    for (const horizontal of ['left', 'right'] as const) {
      for (const vertical of ['above', 'below'] as const) {
        const layout = resolveCompleteActiveSurfaceLayout(
          { x: 664, y: 394 }, viewport, 112, true, panelSize, { horizontal, vertical },
        )
        expect(layout.panelPlacement).toEqual({ horizontal, vertical })
        const moved = moveCompleteActiveSurface(layout.point, { x: 8, y: 8 }, viewport, 112, true, panelSize, layout.panelPlacement)
        expect(moved.point.x).toBeGreaterThan(layout.point.x)
        expect(moved.point.y).toBeGreaterThan(layout.point.y)
      }
    }
  })
})

describe('loadOverlayPreferences', () => {
  it('returns defaults when storage is unavailable or empty', () => {
    expect(loadOverlayPreferences(undefined)).toEqual(copyOverlayDefaults())
    expect(loadOverlayPreferences(memoryStorage())).toEqual(copyOverlayDefaults())
  })

  it('falls back safely on corrupt JSON', () => {
    const storage = memoryStorage({ [OVERLAY_PREFERENCES_KEY]: '{not json' })
    expect(loadOverlayPreferences(storage)).toEqual(copyOverlayDefaults())
  })

  it('survives a throwing global localStorage getter', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get: () => { throw new Error('SecurityError') },
    })
    try {
      expect(loadOverlayPreferences()).toEqual(copyOverlayDefaults())
      expect(() => saveOverlayPreferences(copyOverlayDefaults())).not.toThrow()
    } finally {
      if (descriptor === undefined) delete (globalThis as { localStorage?: Storage }).localStorage
      else Object.defineProperty(globalThis, 'localStorage', descriptor)
    }
  })
})

describe('saveOverlayPreferences', () => {
  it('normalizes before writing', () => {
    const store = new Map<string, string>()
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
    }
    saveOverlayPreferences({
      schemaVersion: 1,
      position: { xRatio: 12, yRatio: Number.NaN },
      positionCustomized: false,
      collapsed: false,
      reducedMotion: undefined,
    }, storage)
    expect(JSON.parse(store.get(OVERLAY_PREFERENCES_KEY) ?? '')).toEqual({
      schemaVersion: 1,
      position: { xRatio: 1, yRatio: 1 },
      positionCustomized: false,
      collapsed: false,
      reducedMotion: undefined,
    })
  })

  it('swallows quota failures instead of throwing', () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
    }
    expect(() => {
      saveOverlayPreferences(copyOverlayDefaults(), storage)
    }).not.toThrow()
  })
})

describe('adoptStorageEvent', () => {
  it('ignores foreign keys, removals, and unchanged values', () => {
    const current = DEFAULT_OVERLAY_PREFERENCES
    expect(adoptStorageEvent({ key: 'other-key', newValue: '{}' }, current)).toBeNull()
    expect(adoptStorageEvent({ key: OVERLAY_PREFERENCES_KEY, newValue: null }, current)).toBeNull()
    const same = JSON.stringify(normalizeOverlayPreferences(current))
    expect(adoptStorageEvent({ key: OVERLAY_PREFERENCES_KEY, newValue: same }, current)).toBeNull()
  })

  it('adopts a differing valid record, removal defaults, and rejects corrupt payloads', () => {
    const current = copyOverlayDefaults()
    const next = JSON.stringify({ schemaVersion: 1, position: { xRatio: 0.2, yRatio: 0.4 }, collapsed: true, reducedMotion: false })
    expect(adoptStorageEvent({ key: OVERLAY_PREFERENCES_KEY, newValue: next }, current))
      .toEqual({ schemaVersion: 1, position: { xRatio: 0.2, yRatio: 0.4 }, positionCustomized: true, collapsed: true, reducedMotion: false })
    const nonDefault = normalizeOverlayPreferences(JSON.parse(next))
    expect(adoptStorageEvent({ key: OVERLAY_PREFERENCES_KEY, newValue: null }, nonDefault))
      .toEqual(copyOverlayDefaults())
    expect(adoptStorageEvent({ key: OVERLAY_PREFERENCES_KEY, newValue: 'corrupt{' }, current)).toBeNull()
  })
})

describe('subscribeStorageEvents', () => {
  it('returns a no-op disposer when window is absent', () => {
    const dispose = subscribeStorageEvents(() => {}, undefined)
    expect(dispose).toBeTypeOf('function')
    expect(dispose).not.toThrow()
  })

  it('adds and removes the listener on the given target', () => {
    const listeners = new Set<(event: StorageEvent) => void>()
    const target = {
      addEventListener: vi.fn((listener: (event: StorageEvent) => void) => {
        listeners.add(listener)
      }),
      removeEventListener: vi.fn((listener: (event: StorageEvent) => void) => {
        listeners.delete(listener)
      }),
    }
    const onEvent = vi.fn()
    const dispose = subscribeStorageEvents(onEvent, target as unknown as Window)
    expect(listeners.size).toBe(1)
    dispose()
    expect(listeners.size).toBe(0)
    expect(target.removeEventListener).toHaveBeenCalledWith('storage', onEvent)
  })
})
