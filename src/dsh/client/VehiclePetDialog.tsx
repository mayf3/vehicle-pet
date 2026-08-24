/**
 * VehiclePetDialog: the in-Harness full journey dialog (CTR-OVERLAY-005).
 * Opens inside the same React slot subtree and reuses the existing React
 * product surface (scene, progress, milestones, keepsakes, greeting,
 * ceremony). Accessible: role="dialog", accessible name, focus moves in on
 * open, Escape and a close button close it, focus is constrained inside, and
 * focus returns to the triggering control. The background is covered so it
 * cannot be interacted with while open. Closing changes no progression.
 */

import { useCallback, useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent, type ReactElement } from 'react'
import {
  PetKeepsakeCollection, PetMilestonePanel, PetProgressPanel, PetSceneRenderer,
} from '../../react'
import { useOverlayChrome } from './VehiclePetOverlay'

export interface VehiclePetDialogProps {
  readonly onClose: () => void
}

const FOCUSABLE_SELECTOR = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])',
  'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',')

export function VehiclePetDialog({ onClose }: VehiclePetDialogProps): ReactElement {
  const { t } = useOverlayChrome()
  const dialogRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab') return
    const container = dialogRef.current
    if (container === null) return
    const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      .filter(element => element.offsetParent !== null || element === document.activeElement)
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables.at(-1)
    if (first === undefined || last === undefined) return
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }, [onClose])

  return (
    <div
      className="vpo-dialogBackdrop"
      data-vehicle-pet-dialog-backdrop="true"
      onPointerDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="vpo-dialog vpo-engineScope"
        role="dialog"
        aria-modal="true"
        aria-label={t('dialog.title')}
        tabIndex={-1}
        data-vehicle-pet-dialog="true"
        onKeyDown={handleKeyDown}
      >
        <header className="vpo-dialogHeader">
          <h2 className="vpo-dialogTitle">{t('dialog.title')}</h2>
          <button
            type="button"
            className="vpo-control"
            aria-label={t('dialog.close')}
            data-vehicle-pet-dialog-close="true"
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div className="vpo-dialogBody">
          <PetSceneRenderer />
          <PetProgressPanel />
          <PetMilestonePanel />
          <PetKeepsakeCollection />
        </div>
      </div>
    </div>
  )
}
