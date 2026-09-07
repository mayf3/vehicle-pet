/**
 * VehiclePetPanel: the 264px low-frequency compact panel (DSH_PET_OVERLAY_ADAPTER_V2
 * CTR-OVERLAY-005). Contains exactly the five authorized §8.2 items: stage/level,
 * progress plus next threshold, "View full journey", one "More" disclosure holding
 * the Reduced Motion control, and Collapse. The header keeps only the title and the
 * close action. No Pack switch (the DSH surface exposes `autonomous-fleet` as the
 * only user-selectable product Pack, CTR-OVERLAY-006), no keepsake row, no pack
 * name row, no mock controls, no dev console. Escape closes the panel and returns
 * focus to the pet.
 */

import { type KeyboardEvent as ReactKeyboardEvent, type ReactElement, type RefObject } from 'react'
import { usePetEngine } from '../../react'
import { OVERLAY_GEOMETRY, type VehiclePetOverlayPreferences } from './types'
import { useOverlayChrome } from './VehiclePetOverlay'

export interface VehiclePetPanelProps {
  readonly panelRef: RefObject<HTMLElement>
  readonly horizontal: 'left' | 'right'
  readonly vertical: 'above' | 'below'
  readonly preferences: VehiclePetOverlayPreferences
  readonly onCollapse: () => void
  readonly onRequestClose: () => void
  readonly onOpenJourney: () => void
  readonly journeyTriggerRef: RefObject<HTMLButtonElement>
}

export function VehiclePetPanel(props: VehiclePetPanelProps): ReactElement {
  const { snapshot, resolveText, setReducedMotion } = usePetEngine()
  const { t, commitPreferences } = useOverlayChrome()
  const viewModel = snapshot.viewModel
  const manifest = snapshot.activePack?.manifest ?? null
  const level = viewModel === null || manifest === null
    ? null
    : manifest.levels.find(candidate => candidate.levelId === viewModel.derivedLevelId) ?? null
  const nextLevel = viewModel === null || manifest === null
    ? null
    : manifest.levels.find(candidate => candidate.threshold > viewModel.progressPoints) ?? null
  const progressText = viewModel === null
    ? '—'
    : `${Math.floor(viewModel.progressPoints).toLocaleString()}${manifest?.displayConversion
      ? ` ${resolveText(manifest.displayConversion.unitLabel)}`
      : ''}`

  const commitReducedMotion = (reduced: boolean | undefined): void => {
    setReducedMotion(reduced ?? systemReducedMotion())
    commitPreferences(current => ({ ...current, reducedMotion: reduced }))
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Escape') {
      event.stopPropagation()
      props.onRequestClose()
    }
  }

  return (
    <section
      ref={props.panelRef}
      style={{ width: `${OVERLAY_GEOMETRY.compactPanelWidthPx}px`, maxWidth: 'calc(100vw - 32px)' }}
      className="vpo-panel"
      role="group"
      aria-label={t('panel.title')}
      data-vehicle-pet-panel="true"
      data-horizontal={props.horizontal}
      data-vertical={props.vertical}
      onKeyDown={handleKeyDown}
    >
      <header className="vpo-panelHeader">
        <span className="vpo-panelTitle">{t('panel.title')}</span>
        <button
          type="button"
          className="vpo-control vpo-panelClose"
          aria-label={t('panel.close')}
          data-vehicle-pet-panel-close="true"
          onClick={props.onRequestClose}
        >
          ×
        </button>
      </header>

      <dl className="vpo-meta">
        <dt>{t('panel.stage')}</dt>
        <dd data-vehicle-pet-stage="true">{level === null ? '—' : `${resolveText(level.stageName)} · ${viewModel?.derivedLevelIndex ?? '—'}`}</dd>
        <dt>{t('panel.progress')}</dt>
        <dd data-vehicle-pet-progress="true">
          {progressText}
          {nextLevel === null
            ? null
            : (
              <span data-vehicle-pet-next-threshold="true">
                {' · '}
                {t('panel.nextThreshold', {
                  points: `${nextLevel.threshold.toLocaleString()} ${manifest?.displayConversion ? resolveText(manifest.displayConversion.unitLabel) : ''}`.trim(),
                })}
              </span>
            )}
        </dd>
      </dl>

      <div className="vpo-actions">
        <button
          ref={props.journeyTriggerRef}
          type="button"
          className="vpo-control"
          data-vehicle-pet-open-journey="true"
          onClick={props.onOpenJourney}
        >
          {t('panel.viewJourney')}
        </button>
      </div>

      <details className="vpo-more" data-vehicle-pet-more="true">
        <summary className="vpo-control vpo-moreSummary">{t('panel.more')}</summary>
        <div className="vpo-moreContent" role="group" aria-label={t('panel.reducedMotion')} data-vehicle-pet-reduced-motion="true">
          <button
            type="button"
            className="vpo-control"
            aria-pressed={props.preferences.reducedMotion === undefined ? 'true' : 'false'}
            data-vehicle-pet-reduced-motion-option="system"
            onClick={() => {
              commitReducedMotion(undefined)
            }}
          >
            {t('panel.reducedMotion.system')}
          </button>
          <button
            type="button"
            className="vpo-control"
            aria-pressed={props.preferences.reducedMotion === true ? 'true' : 'false'}
            data-vehicle-pet-reduced-motion-option="on"
            onClick={() => {
              commitReducedMotion(true)
            }}
          >
            {t('panel.reducedMotion')} · ON
          </button>
          <button
            type="button"
            className="vpo-control"
            aria-pressed={props.preferences.reducedMotion === false ? 'true' : 'false'}
            data-vehicle-pet-reduced-motion-option="off"
            onClick={() => {
              commitReducedMotion(false)
            }}
          >
            {t('panel.reducedMotion')} · OFF
          </button>
        </div>
      </details>

      <div className="vpo-actions">
        <button
          type="button"
          className="vpo-control"
          data-vehicle-pet-collapse="true"
          onClick={props.onCollapse}
        >
          {t('panel.collapse')}
        </button>
      </div>
    </section>
  )
}

function systemReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
