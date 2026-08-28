/**
 * VehiclePetDialog: the in-Harness full journey dialog (CTR-OVERLAY-005).
 * The same Engine product surface is reused, with complete modal focus
 * containment and lifecycle-owned document listeners.
 */

import { useCallback, useEffect, useRef, type ReactElement } from 'react'
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

function focusableChildren(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter(element => {
      if (element.hidden || element.getAttribute('aria-hidden') === 'true') return false
      const style = getComputedStyle(element)
      return style.display !== 'none' && style.visibility !== 'hidden'
    })
}

export function VehiclePetDialog({ onClose }: VehiclePetDialogProps): ReactElement {
  const { t } = useOverlayChrome()
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const closingRef = useRef(false)

  const requestClose = useCallback(() => {
    closingRef.current = true
    onClose()
  }, [onClose])

  useEffect(() => {
    const container = dialogRef.current
    if (container === null) return
    ;(closeRef.current ?? container).focus()

    const onDocumentKeyDown = (event: KeyboardEvent): void => {
      if (closingRef.current) return
      const current = dialogRef.current
      if (current === null) return
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        requestClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusables = focusableChildren(current)
      const first = focusables[0]
      const last = focusables.at(-1)
      if (first === undefined || last === undefined) {
        event.preventDefault()
        current.focus()
        return
      }
      const active = document.activeElement
      if (!current.contains(active) || active === current) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus()
      } else if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    const onDocumentFocusIn = (event: FocusEvent): void => {
      if (closingRef.current) return
      const current = dialogRef.current
      if (current === null || current.contains(event.target as Node | null)) return
      const first = focusableChildren(current)[0]
      ;(first ?? current).focus()
    }

    document.addEventListener('keydown', onDocumentKeyDown, true)
    document.addEventListener('focusin', onDocumentFocusIn, true)
    return () => {
      document.removeEventListener('keydown', onDocumentKeyDown, true)
      document.removeEventListener('focusin', onDocumentFocusIn, true)
    }
  }, [requestClose])

  return (
    <div
      className="vpo-dialogBackdrop"
      data-vehicle-pet-dialog-backdrop="true"
      onPointerDown={event => {
        if (event.target === event.currentTarget) requestClose()
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
      >
        <header className="vpo-dialogHeader">
          <h2 className="vpo-dialogTitle">{t('dialog.title')}</h2>
          <button
            ref={closeRef}
            type="button"
            className="vpo-control"
            aria-label={t('dialog.close')}
            data-vehicle-pet-dialog-close="true"
            onClick={requestClose}
          >
            ×
          </button>
        </header>
        <div className="vpo-dialogBody">
          <PetSceneRenderer presentationMode="full-journey" />
          <PetProgressPanel />
          <PetMilestonePanel />
          <PetKeepsakeCollection />
        </div>
      </div>
    </div>
  )
}
