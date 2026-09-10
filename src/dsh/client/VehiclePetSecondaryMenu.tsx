/**
 * V5 compact settings, opened by pet double-click or keyboard equivalent.
 * Character, size, Full Journey and Collapse; outside press / Escape close.
 */

import {
  useCallback, useEffect,
  type KeyboardEvent as ReactKeyboardEvent, type ReactElement, type RefObject,
} from 'react'
import { OVERLAY_GEOMETRY, type VehiclePetOverlayPreferences, type VehiclePetSize } from './types'
import { useOverlayChrome } from './VehiclePetOverlay'

export interface VehiclePetSecondaryMenuProps {
  readonly menuRef: RefObject<HTMLElement | null>
  readonly preferences: VehiclePetOverlayPreferences
  readonly placement: { horizontal: 'left' | 'right'; vertical: 'above' | 'below' }
  readonly onCommitSize: (size: VehiclePetSize) => void
  readonly onCollapse: () => void
  readonly onOpenJourney: () => void
  readonly onRequestClose: () => void
  /** V7 CTR-029: fired by the outside-press close only (never by Escape), so
   * the pet can drop the closing interaction's double-click chain. */
  readonly onOutsidePress?: () => void
  /** While true, Escape belongs to the journey dialog, not the menu. */
  readonly dialogOpen?: boolean
  readonly journeyTriggerRef: RefObject<HTMLButtonElement | null>
}

export function VehiclePetSecondaryMenu(props: VehiclePetSecondaryMenuProps): ReactElement {
  const { t, commitPreferences } = useOverlayChrome()

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      props.onRequestClose()
    }
  }, [props])

  // Outside press closes the menu (CTR-OVERLAY-005), and Escape closes it from
  // wherever focus happens to rest (host page interactions can leave
  // activeElement on body, outside the overlay's React tree); a V7 open
  // journey dialog owns Escape first. Both listeners are capture-phase,
  // scoped to this mount, and removed with it.
  useEffect(() => {
    const onDocumentKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || props.dialogOpen) return
      event.stopPropagation()
      props.onRequestClose()
    }
    const onDocumentPointerDown = (event: PointerEvent): void => {
      const element = props.menuRef.current
      if (element === null) return
      if (event.target instanceof Node && element.contains(event.target)) return
      props.onOutsidePress?.()
      props.onRequestClose()
    }
    document.addEventListener('keydown', onDocumentKeyDown, { capture: true })
    document.addEventListener('pointerdown', onDocumentPointerDown, { capture: true })
    return () => {
      document.removeEventListener('keydown', onDocumentKeyDown, { capture: true })
      document.removeEventListener('pointerdown', onDocumentPointerDown, { capture: true })
    }
  }, [props])

  return (
    <section
      ref={props.menuRef as RefObject<HTMLElement>}
      className="vpo-menu"
      role="group"
      aria-label={t('menu.title')}
      data-vehicle-pet-menu="true"
      data-horizontal={props.placement.horizontal}
      data-vertical={props.placement.vertical}
      style={{ width: `${OVERLAY_GEOMETRY.secondaryMenuWidthPx}px`, maxWidth: 'calc(100vw - 32px)' }}
      onKeyDown={handleKeyDown}
    >
      <div className="vpo-menuRow" role="group" aria-label={t('menu.character')}>
        <span className="vpo-menuLabel">{t('menu.character')}</span>
        {(['vehicle', 'companion'] as const).map(id => <button
          key={id} type="button" className="vpo-control"
          data-vehicle-pet-character-option={id}
          aria-pressed={(props.preferences.characterId ?? 'vehicle') === id}
          onClick={() => commitPreferences(current => ({ ...current, characterId: id }))}
        >{t(`menu.character.${id}`)}</button>)}
      </div>
      <div className="vpo-menuRow" role="group" aria-label={t('menu.size')} data-vehicle-pet-size-control="true">
        <span className="vpo-menuLabel">{t('menu.size')}</span>
        <button
          type="button"
          className="vpo-control"
          aria-pressed={props.preferences.size === 'small' ? 'true' : 'false'}
          data-vehicle-pet-size-option="small"
          onClick={() => props.onCommitSize('small')}
        >
          {t('menu.size.small')}
        </button>
        <button
          type="button"
          className="vpo-control"
          aria-pressed={props.preferences.size !== 'small' ? 'true' : 'false'}
          data-vehicle-pet-size-option="large"
          onClick={() => props.onCommitSize('large')}
        >
          {t('menu.size.large')}
        </button>
      </div>

      <div className="vpo-menuRow">
        <button
          ref={props.journeyTriggerRef as RefObject<HTMLButtonElement>}
          type="button"
          className="vpo-control"
          data-vehicle-pet-open-journey="true"
          onClick={props.onOpenJourney}
        >
          {t('menu.viewJourney')}
        </button>
        <button
          type="button"
          className="vpo-control"
          data-vehicle-pet-collapse="true"
          onClick={props.onCollapse}
        >
          {t('menu.collapse')}
        </button>
      </div>
    </section>
  )
}
