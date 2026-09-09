/**
 * Bounded cursor awareness (DSH_PET_OVERLAY_ADAPTER_V7 CTR-OVERLAY-031).
 * While the pointer is inside the recorded proximity radius of the resident
 * and no disabling condition applies, the expression/pose layer translates up
 * to ±4 px toward the cursor through two CSS custom properties updated at
 * most once per animation frame. No React state updates on pointermove; the
 * listener reads only event coordinates (payload- and target-ignored, the
 * same privacy class as the CTR-019 input-recency listener) and computes
 * proximity against the adapter's own element rect. Reduced motion keeps the
 * presentation fully static.
 */

import { useEffect, useRef, type RefObject } from 'react'

/** Proximity radius around the resident figure; frozen for V7. */
export const GAZE_PROXIMITY_RADIUS_PX = 160
/** Maximum translation toward the cursor (CTR-031 bound). */
export const GAZE_MAX_OFFSET_PX = 4

export interface CursorGazeOptions {
  readonly elementRef: RefObject<HTMLElement | null>
  /** Master switch: false keeps the presentation fully static. */
  readonly enabled: boolean
  /** Disabling conditions re-evaluated on every render. */
  readonly disabled: boolean
}

export function useCursorGaze({ elementRef, enabled, disabled }: CursorGazeOptions): void {
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    if (!enabled) {
      const element = elementRef.current
      if (element !== null) {
        element.style.setProperty('--vp-gaze-x', '0px')
        element.style.setProperty('--vp-gaze-y', '0px')
        element.removeAttribute('data-gaze-active')
      }
      return
    }
    let frame: number | undefined
    let pointerX = Number.NaN
    let pointerY = Number.NaN
    let active = false

    const apply = (): void => {
      frame = undefined
      const element = elementRef.current
      if (element === null) return
      if (Number.isNaN(pointerX) || disabledRef.current) {
        if (active) {
          active = false
          element.style.setProperty('--vp-gaze-x', '0px')
          element.style.setProperty('--vp-gaze-y', '0px')
          element.removeAttribute('data-gaze-active')
        }
        return
      }
      const rect = element.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) return
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const dx = pointerX - centerX
      const dy = pointerY - centerY
      const distance = Math.hypot(dx, dy)
      if (distance > GAZE_PROXIMITY_RADIUS_PX) {
        if (active) {
          active = false
          element.style.setProperty('--vp-gaze-x', '0px')
          element.style.setProperty('--vp-gaze-y', '0px')
          element.removeAttribute('data-gaze-active')
        }
        return
      }
      // Stronger when closer: magnitude ramps from 0 at the radius edge to
      // the ±4 px bound near the figure; direction follows the cursor.
      const closeness = 1 - distance / GAZE_PROXIMITY_RADIUS_PX
      const magnitude = GAZE_MAX_OFFSET_PX * closeness
      const offsetX = distance === 0 ? 0 : Math.max(-GAZE_MAX_OFFSET_PX, Math.min(GAZE_MAX_OFFSET_PX, (dx / distance) * magnitude))
      const offsetY = distance === 0 ? 0 : Math.max(-GAZE_MAX_OFFSET_PX, Math.min(GAZE_MAX_OFFSET_PX, (dy / distance) * magnitude))
      active = true
      element.style.setProperty('--vp-gaze-x', `${offsetX.toFixed(2)}px`)
      element.style.setProperty('--vp-gaze-y', `${offsetY.toFixed(2)}px`)
      element.setAttribute('data-gaze-active', 'true')
    }

    const onMove = (event: PointerEvent): void => {
      // Coordinates only: payload and target identity are never read.
      pointerX = event.clientX
      pointerY = event.clientY
      if (frame === undefined) frame = requestAnimationFrame(apply)
    }
    const onLeave = (): void => {
      pointerX = Number.NaN
      pointerY = Number.NaN
      if (frame === undefined) frame = requestAnimationFrame(apply)
    }
    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      if (frame !== undefined) cancelAnimationFrame(frame)
      const element = elementRef.current
      if (element !== null) {
        element.style.setProperty('--vp-gaze-x', '0px')
        element.style.setProperty('--vp-gaze-y', '0px')
        element.removeAttribute('data-gaze-active')
      }
    }
  }, [enabled, elementRef])
}
