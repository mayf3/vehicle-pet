/**
 * Overlay drag / keyboard movement / viewport clamping controller
 * (CTR-OVERLAY-003). Pointer drags have a threshold so a plain click never
 * counts as a drag and never toggles the panel; the active surface is clamped
 * inside the viewport; positions persist as normalized x/y ratios, never
 * absolute pixels. Viewport resize recomputes from the ratios.
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

interface DragState {
  readonly pointerId: number
  readonly start: OverlayPoint
  readonly origin: OverlayPoint
  current: OverlayPoint
  moved: boolean
}

export interface UseOverlayDragOptions {
  readonly preferences: VehiclePetOverlayPreferences
  readonly commitPreferences: (update: (current: VehiclePetOverlayPreferences) => VehiclePetOverlayPreferences) => void
  /** Called after a real drag ended (never for a suppressed click). */
  readonly onDragEnd?: () => void
}

export interface OverlayDragController {
  readonly rootRef: RefObject<HTMLDivElement>
  readonly bounds: OverlayBounds
  readonly point: OverlayPoint
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

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

function activeSurfaceSize(collapsed: boolean): number {
  return collapsed ? OVERLAY_GEOMETRY.collapsedLauncherSizePx : OVERLAY_GEOMETRY.visibleSizePx
}

function pointFromRatios(
  preferences: VehiclePetOverlayPreferences,
  bounds: OverlayBounds,
  size: number,
): OverlayPoint {
  const margin = OVERLAY_GEOMETRY.viewportMarginPx
  const availableX = Math.max(0, bounds.width - size - margin * 2)
  const availableY = Math.max(0, bounds.height - size - margin * 2)
  return {
    x: margin + availableX * preferences.position.xRatio,
    y: margin + availableY * preferences.position.yRatio,
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

export function useOverlayDrag({
  preferences,
  commitPreferences,
  onDragEnd,
}: UseOverlayDragOptions): OverlayDragController {
  const [bounds, setBounds] = useState<OverlayBounds>(() => ({
    width: globalThis.innerWidth ?? 0,
    height: globalThis.innerHeight ?? 0,
  }))
  const [dragPoint, setDragPoint] = useState<OverlayPoint | undefined>()
  const [isDragging, setIsDragging] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | undefined>()
  const ignoreClickRef = useRef(false)
  const onDragEndRef = useRef(onDragEnd)
  onDragEndRef.current = onDragEnd

  const size = activeSurfaceSize(preferences.collapsed)
  const persistedPoint = useMemo(() => pointFromRatios(preferences, bounds, size), [preferences, bounds, size])
  const point = dragPoint ?? persistedPoint

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

  const finishDrag = useCallback((event: ReactPointerEvent<HTMLElement>): void => {
    const drag = dragRef.current
    if (drag === undefined || drag.pointerId !== event.pointerId) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = undefined
    setDragPoint(undefined)
    setIsDragging(false)
    if (drag.moved) {
      ignoreClickRef.current = true
      const position = ratiosFromPoint(drag.current, bounds, size)
      commitPreferences(current => ({ ...current, position }))
      onDragEndRef.current?.()
    }
  }, [bounds, commitPreferences, size])

  const moveByKeyboard = useCallback((dx: number, dy: number): void => {
    const margin = OVERLAY_GEOMETRY.viewportMarginPx
    const next = {
      x: clamp(persistedPoint.x + dx, margin, Math.max(margin, bounds.width - size - margin)),
      y: clamp(persistedPoint.y + dy, margin, Math.max(margin, bounds.height - size - margin)),
    }
    const position = ratiosFromPoint(next, bounds, size)
    commitPreferences(current => ({ ...current, position }))
  }, [bounds, commitPreferences, persistedPoint, size])

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>): void => {
    if (event.button !== 0) return
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      origin: persistedPoint,
      current: persistedPoint,
      moved: false,
    }
  }, [persistedPoint])

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
    setDragPoint(drag.current)
  }, [bounds, size])

  return {
    rootRef,
    bounds,
    point,
    shellStyle: { left: point.x, top: point.y, width: size, height: size },
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
