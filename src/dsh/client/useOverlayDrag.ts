/**
 * Overlay drag / keyboard movement / viewport clamping controller
 * (V3 CTR-OVERLAY-003). Ratios always describe the user's pet/launcher anchor.
 * An open secondary menu temporarily projects that anchor through the complete
 * active Pet + gap + Menu surface, flips the Menu, and clamps the final union.
 */

import {
  useCallback, useEffect, useMemo, useRef, useState,
  type CSSProperties, type PointerEvent as ReactPointerEvent, type RefObject,
} from 'react'
import {
  OVERLAY_GEOMETRY, effectiveSize, residentSurfaceSizePx,
  type VehiclePetOverlayPreferences, type VehiclePetSize,
} from './types'

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
  placement: PanelPlacement
  moved: boolean
  visibleMoved: boolean
}

export interface UseOverlayDragOptions {
  readonly preferences: VehiclePetOverlayPreferences
  readonly menuOpen: boolean
  readonly commitPreferences: (update: (current: VehiclePetOverlayPreferences) => VehiclePetOverlayPreferences) => void
  /** Called after a real drag ended (never for a suppressed click). */
  readonly onDragEnd?: () => void
}

export interface OverlayDragController {
  readonly rootRef: RefObject<HTMLDivElement>
  readonly menuRef: RefObject<HTMLElement | null>
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
// The menu clears the active-session footer. The modeled gap must equal
// the CSS offset (styles.ts) so the
// complete-active-surface union is honest (V3 audit F1).
const PANEL_GAP_PX = 40
const footerHeight = (size: number): number => size === OVERLAY_GEOMETRY.collapsedLauncherSizePx ? 0 : 32
const PANEL_FALLBACK_HEIGHT_PX = 240

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

/**
 * Deterministic composer- and coexistence-safe default (V3 CTR-OVERLAY-003).
 * No Harness DOM, route, copy, CSS-class, or other-plugin inspection
 * participates in production placement: the LARGE default reserves the
 * recorded coexistence footprint constant from OVERLAY_GEOMETRY.
 */
export function defaultBottomSafeInsetPx(size: VehiclePetSize): number {
  return size === 'small'
    ? OVERLAY_GEOMETRY.smallDefaultBottomSafeInsetPx
    : OVERLAY_GEOMETRY.largeDefaultBottomSafeInsetPx
}

export function pointFromRatios(
  preferences: VehiclePetOverlayPreferences,
  bounds: OverlayBounds,
  size: number,
): OverlayPoint {
  const margin = OVERLAY_GEOMETRY.viewportMarginPx
  const availableX = Math.max(0, bounds.width - size - margin * 2)
  const availableY = Math.max(0, bounds.height - size - footerHeight(size) - margin * 2)
  const ratioPoint = {
    x: margin + availableX * preferences.position.xRatio,
    y: margin + availableY * preferences.position.yRatio,
  }
  if (preferences.positionCustomized) return ratioPoint
  return {
    x: ratioPoint.x,
    y: Math.max(margin, ratioPoint.y - defaultBottomSafeInsetPx(sizeToVehiclePetSize(size))),
  }
}

/** The rendered surface edge resolves to its size mode for the safe inset. */
function sizeToVehiclePetSize(size: number): VehiclePetSize {
  return size <= OVERLAY_GEOMETRY.smallSurfaceHeightPx ? 'small' : 'large'
}

function ratiosFromPoint(point: OverlayPoint, bounds: OverlayBounds, size: number): { xRatio: number; yRatio: number } {
  const margin = OVERLAY_GEOMETRY.viewportMarginPx
  const availableX = Math.max(0, bounds.width - size - margin * 2)
  const availableY = Math.max(0, bounds.height - size - footerHeight(size) - margin * 2)
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
 * anchor. `horizontal=left` means the Menu grows right from the Pet's left;
 * `horizontal=right` means it grows left from the Pet's right.
 */
export function resolveCompleteActiveSurfaceLayout(
  anchor: OverlayPoint,
  viewport: OverlayBounds,
  surfaceSize: number,
  menuOpen: boolean,
  menuSize: OverlayBounds,
  preferred: PanelPlacement,
): CompleteActiveSurfaceLayout {
  const margin = OVERLAY_GEOMETRY.viewportMarginPx
  if (!menuOpen) {
    const point = {
      x: clamp(anchor.x, margin, Math.max(margin, viewport.width - surfaceSize - margin)),
      y: clamp(anchor.y, margin, Math.max(margin, viewport.height - surfaceSize - footerHeight(surfaceSize) - margin)),
    }
    return {
      point,
      panelPlacement: preferred,
      activeBounds: { left: point.x, top: point.y, right: point.x + surfaceSize, bottom: point.y + surfaceSize + footerHeight(surfaceSize) },
    }
  }

  const horizontalOffsets = {
    left: { min: 0, max: Math.max(surfaceSize, menuSize.width) },
    right: { min: Math.min(0, surfaceSize - menuSize.width), max: surfaceSize },
  } as const
  const verticalOffsets = {
    below: { min: 0, max: Math.max(surfaceSize + footerHeight(surfaceSize), surfaceSize + PANEL_GAP_PX + menuSize.height) },
    above: { min: Math.min(0, -PANEL_GAP_PX - menuSize.height), max: surfaceSize + footerHeight(surfaceSize) },
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

/**
 * Apply one pointer/keyboard delta from the currently rendered Pet anchor.
 * This is deliberately distinct from the latent preference anchor: an open
 * menu may project that preference to keep the full Pet + Menu union visible,
 * and the first real input must start from that projected on-screen position.
 */
export function moveCompleteActiveSurface(
  renderedPoint: OverlayPoint,
  delta: OverlayPoint,
  viewport: OverlayBounds,
  surfaceSize: number,
  menuOpen: boolean,
  menuSize: OverlayBounds,
  currentPlacement: PanelPlacement,
): CompleteActiveSurfaceLayout {
  return resolveCompleteActiveSurfaceLayout(
    { x: renderedPoint.x + delta.x, y: renderedPoint.y + delta.y },
    viewport,
    surfaceSize,
    menuOpen,
    menuSize,
    currentPlacement,
  )
}

export function useOverlayDrag({
  preferences,
  menuOpen,
  commitPreferences,
  onDragEnd,
}: UseOverlayDragOptions): OverlayDragController {
  const [bounds, setBounds] = useState<OverlayBounds>(() => ({
    width: globalThis.innerWidth ?? 0,
    height: globalThis.innerHeight ?? 0,
  }))
  const [menuSize, setMenuSize] = useState<OverlayBounds>({
    width: OVERLAY_GEOMETRY.secondaryMenuWidthPx,
    height: PANEL_FALLBACK_HEIGHT_PX,
  })
  const [dragAnchor, setDragAnchor] = useState<OverlayPoint | undefined>()
  const [isDragging, setIsDragging] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLElement | null>(null)
  const dragRef = useRef<DragState | undefined>()
  const ignoreClickRef = useRef(false)
  const onDragEndRef = useRef(onDragEnd)
  onDragEndRef.current = onDragEnd

  const size = residentSurfaceSizePx(preferences.collapsed, effectiveSize(preferences))
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
    menuOpen && !preferences.collapsed,
    menuSize,
    preferredPlacement,
  ), [anchor, bounds, menuOpen, menuSize, preferences.collapsed, preferredPlacement, size])

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
    if (!menuOpen) return
    const element = menuRef.current
    if (element === null) return
    const update = (): void => {
      const rect = element.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) setMenuSize({ width: rect.width, height: rect.height })
    }
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update)
    observer?.observe(element)
    update()
    return () => observer?.disconnect()
  }, [menuOpen])

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
      if (drag.visibleMoved) {
        const position = ratiosFromPoint(drag.current, bounds, size)
        commitPreferences(current => ({ ...current, position, positionCustomized: true }))
      }
      onDragEndRef.current?.()
    }
  }, [bounds, commitPreferences, size])

  const movementUsesMenu = menuOpen && !preferences.collapsed
  const moveByKeyboard = useCallback((dx: number, dy: number): void => {
    const next = moveCompleteActiveSurface(
      layout.point,
      { x: dx, y: dy },
      bounds,
      size,
      movementUsesMenu,
      menuSize,
      layout.panelPlacement,
    )
    if (next.point.x === layout.point.x && next.point.y === layout.point.y) return
    const position = ratiosFromPoint(next.point, bounds, size)
    commitPreferences(current => ({ ...current, position, positionCustomized: true }))
  }, [bounds, commitPreferences, layout.panelPlacement, layout.point, movementUsesMenu, menuSize, size])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>): void => {
    if (event.button !== 0) return
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      origin: layout.point,
      current: layout.point,
      placement: layout.panelPlacement,
      moved: false,
      visibleMoved: false,
    }
  }, [layout.panelPlacement, layout.point])

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>): void => {
    const drag = dragRef.current
    if (drag === undefined || drag.pointerId !== event.pointerId) return
    const dx = event.clientX - drag.start.x
    const dy = event.clientY - drag.start.y
    if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) drag.moved = true
    if (!drag.moved) return
    const next = moveCompleteActiveSurface(
      drag.origin,
      { x: dx, y: dy },
      bounds,
      size,
      movementUsesMenu,
      menuSize,
      drag.placement,
    )
    if (next.point.x !== drag.current.x || next.point.y !== drag.current.y) drag.visibleMoved = true
    drag.current = next.point
    drag.placement = next.panelPlacement
    setDragAnchor(next.point)
  }, [bounds, movementUsesMenu, menuSize, size])

  return {
    rootRef,
    menuRef,
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
