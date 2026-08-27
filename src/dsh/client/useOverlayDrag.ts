/**
 * Overlay drag / keyboard movement / viewport clamping controller
 * (CTR-OVERLAY-003). Ratios always describe the user's pet/launcher anchor.
 * PANEL_OPEN temporarily projects that anchor through the complete active
 * Pet + gap + Panel surface, flips the Panel, and clamps the final union.
 */

import {
  useCallback, useEffect, useMemo, useRef, useState,
  type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject,
} from 'react'
import { OVERLAY_GEOMETRY, type VehiclePetOverlayPreferences } from './types'

export interface OverlayBounds {
  readonly width: number
  readonly height: number
}

export interface OverlayPoint {
  readonly x: number
  readonly y: number
}

export interface PanelPlacement {
  readonly horizontal: 'left' | 'right'
  readonly vertical: 'above' | 'below'
}

export interface ActiveSurfaceBounds {
  readonly left: number
  readonly top: number
  readonly right: number
  readonly bottom: number
}

export interface CompleteActiveSurfaceLayout {
  readonly point: OverlayPoint
  readonly panelPlacement: PanelPlacement
  readonly activeBounds: ActiveSurfaceBounds
}

interface DragState {
  readonly pointerId: number
  readonly start: OverlayPoint
  readonly origin: OverlayPoint
  current: OverlayPoint
  moved: boolean
}

export interface UseOverlayDragOptions {
  readonly preferences: VehiclePetOverlayPreferences
  readonly panelOpen: boolean
  readonly commitPreferences: (update: (current: VehiclePetOverlayPreferences) => VehiclePetOverlayPreferences) => void
  /** Called after a real drag ended (never for a suppressed click). */
  readonly onDragEnd?: () => void
}

export interface OverlayDragController {
  readonly rootRef: RefObject<HTMLDivElement>
  readonly panelRef: RefObject<HTMLElement>
  readonly bounds: OverlayBounds
  readonly point: OverlayPoint
  readonly panelPlacement: PanelPlacement
  readonly activeBounds: ActiveSurfaceBounds
  readonly shellStyle: CSSProperties
  readonly isDragging: boolean
  /** True exactly once after a drag; consumes the flag so the click is ignored. */
  readonly consumeSuppressedClick: () => boolean
  readonly moveByKeyboard: (dx: number, dy: number) => void
  readonly onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void
  readonly onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void
  readonly onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void
  readonly onPointerCancel: (event: ReactPointerEvent<HTMLElement>) => void
}

const DRAG_THRESHOLD_PX = 4
const KEYBOARD_STEP_PX = 8
const KEYBOARD_LARGE_STEP_PX = 32
const PANEL_GAP_PX = 8
const PANEL_FALLBACK_HEIGHT_PX = 440

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

function activeSurfaceSize(collapsed: boolean): number {
  return collapsed ? OVERLAY_GEOMETRY.collapsedLauncherSizePx : OVERLAY_GEOMETRY.visibleSizePx
}

export function pointFromRatios(
  preferences: VehiclePetOverlayPreferences,
  bounds: OverlayBounds,
  size: number,
): OverlayPoint {
  const margin = OVERLAY_GEOMETRY.viewportMarginPx
  const availableX = Math.max(0, bounds.width - size - margin * 2)
  const availableY = Math.max(0, bounds.height - size - margin * 2)
  const ratioPoint = {
    x: margin + availableX * preferences.position.xRatio,
    y: margin + availableY * preferences.position.yRatio,
  }
  if (preferences.positionCustomized) return ratioPoint

  // Pinned Harness exposes panel actions but no typed composer/safe-area
  // geometry. Keep the uncustomized default in the right/lower region while
  // reserving a deterministic bottom work-entry inset. No Harness DOM, route,
  // copy, or CSS-class inspection participates in production placement.
  return {
    x: ratioPoint.x,
    y: Math.max(margin, ratioPoint.y - OVERLAY_GEOMETRY.defaultBottomSafeInsetPx),
  }
}

function ratiosFromPoint(point: OverlayPoint, bounds: OverlayBounds, size: number): { xRatio: number; yRatio: number } {
  const margin = OVERLAY_GEOMETRY.viewportMarginPx
  const availableX = Math.max(0, bounds.width - size - margin * 2)
  const availableY = Math.max(0, bounds.height - size - margin * 2)
  return {
    xRatio: availableX === 0 ? 1 : clamp((point.x - margin) / availableX, 0, 1),
    yRatio: availableY === 0 ? 1 : clamp((point.y - margin) / availableY, 0, 1),
  }
}

function overflowForAxis(anchor: number, minOffset: number, maxOffset: number, viewportSize: number): number {
  const margin = OVERLAY_GEOMETRY.viewportMarginPx
  return Math.max(0, margin - (anchor + minOffset))
    + Math.max(0, anchor + maxOffset - (viewportSize - margin))
}

/**
 * Resolve and clamp the complete active surface without mutating the persisted
 * anchor. `horizontal=left` means the Panel grows right from the Pet's left;
 * `horizontal=right` means it grows left from the Pet's right.
 */
export function resolveCompleteActiveSurfaceLayout(
  anchor: OverlayPoint,
  viewport: OverlayBounds,
  surfaceSize: number,
  panelOpen: boolean,
  panelSize: OverlayBounds,
  preferred: PanelPlacement,
): CompleteActiveSurfaceLayout {
  const margin = OVERLAY_GEOMETRY.viewportMarginPx
  if (!panelOpen) {
    const point = {
      x: clamp(anchor.x, margin, Math.max(margin, viewport.width - surfaceSize - margin)),
      y: clamp(anchor.y, margin, Math.max(margin, viewport.height - surfaceSize - margin)),
    }
    return {
      point,
      panelPlacement: preferred,
      activeBounds: { left: point.x, top: point.y, right: point.x + surfaceSize, bottom: point.y + surfaceSize },
    }
  }

  const horizontalOffsets = {
    left: { min: 0, max: Math.max(surfaceSize, panelSize.width) },
    right: { min: Math.min(0, surfaceSize - panelSize.width), max: surfaceSize },
  } as const
  const verticalOffsets = {
    below: { min: 0, max: Math.max(surfaceSize, surfaceSize + PANEL_GAP_PX + panelSize.height) },
    above: { min: Math.min(0, -PANEL_GAP_PX - panelSize.height), max: surfaceSize },
  } as const

  const leftOverflow = overflowForAxis(anchor.x, horizontalOffsets.left.min, horizontalOffsets.left.max, viewport.width)
  const rightOverflow = overflowForAxis(anchor.x, horizontalOffsets.right.min, horizontalOffsets.right.max, viewport.width)
  const horizontal: PanelPlacement['horizontal'] = leftOverflow === rightOverflow
    ? preferred.horizontal
    : leftOverflow < rightOverflow ? 'left' : 'right'

  const aboveOverflow = overflowForAxis(anchor.y, verticalOffsets.above.min, verticalOffsets.above.max, viewport.height)
  const belowOverflow = overflowForAxis(anchor.y, verticalOffsets.below.min, verticalOffsets.below.max, viewport.height)
  const vertical: PanelPlacement['vertical'] = aboveOverflow === belowOverflow
    ? preferred.vertical
    : aboveOverflow < belowOverflow ? 'above' : 'below'

  const xOffsets = horizontalOffsets[horizontal]
  const yOffsets = verticalOffsets[vertical]
  const point = {
    x: clamp(anchor.x, margin - xOffsets.min, Math.max(margin - xOffsets.min, viewport.width - margin - xOffsets.max)),
    y: clamp(anchor.y, margin - yOffsets.min, Math.max(margin - yOffsets.min, viewport.height - margin - yOffsets.max)),
  }
  return {
    point,
    panelPlacement: { horizontal, vertical },
    activeBounds: {
      left: point.x + xOffsets.min,
      top: point.y + yOffsets.min,
      right: point.x + xOffsets.max,
      bottom: point.y + yOffsets.max,
    },
  }
}

export function useOverlayDrag({
  preferences,
  panelOpen,
  commitPreferences,
  onDragEnd,
}: UseOverlayDragOptions): OverlayDragController {
  const [bounds, setBounds] = useState<OverlayBounds>(() => ({
    width: globalThis.innerWidth ?? 0,
    height: globalThis.innerHeight ?? 0,
  }))
  const [panelSize, setPanelSize] = useState<OverlayBounds>({
    width: OVERLAY_GEOMETRY.compactPanelWidthPx,
    height: PANEL_FALLBACK_HEIGHT_PX,
  })
  const [dragAnchor, setDragAnchor] = useState<OverlayPoint | undefined>()
  const [isDragging, setIsDragging] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const dragRef = useRef<DragState | undefined>()
  const ignoreClickRef = useRef(false)
  const onDragEndRef = useRef(onDragEnd)
  onDragEndRef.current = onDragEnd

  const size = activeSurfaceSize(preferences.collapsed)
  const persistedAnchor = useMemo(() => pointFromRatios(preferences, bounds, size), [preferences, bounds, size])
  const anchor = dragAnchor ?? persistedAnchor
  const preferredPlacement = useMemo<PanelPlacement>(() => ({
    horizontal: preferences.position.xRatio > 0.5 ? 'right' : 'left',
    vertical: preferences.position.yRatio > 0.5 ? 'above' : 'below',
  }), [preferences.position.xRatio, preferences.position.yRatio])
  const layout = useMemo(() => resolveCompleteActiveSurfaceLayout(
    anchor,
    bounds,
    size,
    panelOpen && !preferences.collapsed,
    panelSize,
    preferredPlacement,
  ), [anchor, bounds, panelOpen, panelSize, preferences.collapsed, preferredPlacement, size])

  useEffect(() => {
    const element = rootRef.current
    if (element === null) return
    const update = (): void => {
      const rect = element.getBoundingClientRect()
      setBounds({
        width: rect.width || globalThis.innerWidth || 0,
        height: rect.height || globalThis.innerHeight || 0,
      })
    }
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update)
    observer?.observe(element)
    globalThis.addEventListener('resize', update)
    update()
    return () => {
      observer?.disconnect()
      globalThis.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    if (!panelOpen) return
    const element = panelRef.current
    if (element === null) return
    const update = (): void => {
      const rect = element.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) setPanelSize({ width: rect.width, height: rect.height })
    }
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update)
    observer?.observe(element)
    update()
    return () => observer?.disconnect()
  }, [panelOpen])

  const finishDrag = useCallback((event: ReactPointerEvent<HTMLElement>): void => {
    const drag = dragRef.current
    if (drag === undefined || drag.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = undefined
    setDragAnchor(undefined)
    setIsDragging(false)
    if (drag.moved) {
      ignoreClickRef.current = true
      const position = ratiosFromPoint(drag.current, bounds, size)
      commitPreferences(current => ({ ...current, position, positionCustomized: true }))
      onDragEndRef.current?.()
    }
  }, [bounds, commitPreferences, size])

  const moveByKeyboard = useCallback((dx: number, dy: number): void => {
    const margin = OVERLAY_GEOMETRY.viewportMarginPx
    const next = {
      x: clamp(persistedAnchor.x + dx, margin, Math.max(margin, bounds.width - size - margin)),
      y: clamp(persistedAnchor.y + dy, margin, Math.max(margin, bounds.height - size - margin)),
    }
    const position = ratiosFromPoint(next, bounds, size)
    commitPreferences(current => ({ ...current, position, positionCustomized: true }))
  }, [bounds, commitPreferences, persistedAnchor, size])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>): void => {
    if (event.button !== 0) return
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      origin: persistedAnchor,
      current: persistedAnchor,
      moved: false,
    }
  }, [persistedAnchor])

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>): void => {
    const drag = dragRef.current
    if (drag === undefined || drag.pointerId !== event.pointerId) return
    const dx = event.clientX - drag.start.x
    const dy = event.clientY - drag.start.y
    if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) drag.moved = true
    if (!drag.moved) return
    const margin = OVERLAY_GEOMETRY.viewportMarginPx
    drag.current = {
      x: clamp(drag.origin.x + dx, margin, Math.max(margin, bounds.width - size - margin)),
      y: clamp(drag.origin.y + dy, margin, Math.max(margin, bounds.height - size - margin)),
    }
    setDragAnchor(drag.current)
  }, [bounds, size])

  return {
    rootRef,
    panelRef,
    bounds,
    point: layout.point,
    panelPlacement: layout.panelPlacement,
    activeBounds: layout.activeBounds,
    shellStyle: { left: layout.point.x, top: layout.point.y, width: size, height: size },
    isDragging,
    consumeSuppressedClick: () => {
      if (!ignoreClickRef.current) return false
      ignoreClickRef.current = false
      return true
    },
    moveByKeyboard,
    onPointerDown,
    onPointerMove,
    onPointerUp: finishDrag,
    onPointerCancel: finishDrag,
  }
}

export const OVERLAY_KEYBOARD_STEPS = { normal: KEYBOARD_STEP_PX, large: KEYBOARD_LARGE_STEP_PX } as const
