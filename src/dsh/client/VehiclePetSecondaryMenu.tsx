/**
 * VehiclePetSecondaryMenu: the small non-modal secondary settings affordance
 * (DSH_PET_OVERLAY_ADAPTER_V3 DEC-OVERLAY-008 / CTR-OVERLAY-005). Revealed by
 * hover / focus / the keyboard-equivalent toggle — never by a normal pet click
 * — and contains exactly: size (SMALL/LARGE), Reduced Motion (system/on/off
 * semantics unchanged), Full Journey entry, and Collapse. No progression
 * numbers, level names, Pack names, keepsakes, or engineering readouts.
 * Outside press and Escape close it. Narrow fixed width ≤224px.
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
  readonly journeyTriggerRef: RefObject<HTMLButtonElement | null>
}

export function VehiclePetSecondaryMenu(props: VehiclePetSecondaryMenuProps): ReactElement {
  const { t, commitPreferences } = useOverlayChrome()

  const commitReducedMotion = useCallback((reduced: boolean | undefined): void => {
    commitPreferences(current => ({ ...current, reducedMotion: reduced }))
  }, [commitPreferences])

  const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      props.onRequestClose()
    }
  }, [props])

  // Outside press closes the menu (CTR-OVERLAY-005); the listener is scoped to
  // this mount and removed with it.
  useEffect(() => {
    const onDocumentPointerDown = (event: PointerEvent): void => {
      const element = props.menuRef.current
      if (element === null) return
      if (event.target instanceof Node && element.contains(event.target)) return
      props.onRequestClose()
    }
    document.addEventListener('pointerdown', onDocumentPointerDown, { capture: true })
    return () => {
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

      <div className="vpo-menuRow" role="group" aria-label={t('menu.reducedMotion')} data-vehicle-pet-reduced-motion="true">
        <span className="vpo-menuLabel">{t('menu.reducedMotion')}</span>
        <button
          type="button"
          className="vpo-control"
          aria-pressed={props.preferences.reducedMotion === undefined ? 'true' : 'false'}
          data-vehicle-pet-reduced-motion-option="system"
          onClick={() => commitReducedMotion(undefined)}
        >
          {t('menu.reducedMotion.system')}
        </button>
        <button
          type="button"
          className="vpo-control"
          aria-pressed={props.preferences.reducedMotion === true ? 'true' : 'false'}
          data-vehicle-pet-reduced-motion-option="on"
          onClick={() => commitReducedMotion(true)}
        >
          {t('menu.reducedMotion.on')}
        </button>
        <button
          type="button"
          className="vpo-control"
          aria-pressed={props.preferences.reducedMotion === false ? 'true' : 'false'}
          data-vehicle-pet-reduced-motion-option="off"
          onClick={() => commitReducedMotion(false)}
        >
          {t('menu.reducedMotion.off')}
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
