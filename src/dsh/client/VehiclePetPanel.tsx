/**
 * VehiclePetPanel: the 320px compact panel (CTR-OVERLAY-005). Contains
 * exactly the eight authorized items: Pack name, stage/level, progress plus
 * next threshold, latest keepsake, Pack switch, Reduced Motion control,
 * Collapse, and "View full journey". No mock controls, no exact-points input,
 * no fault injection, no diagnostics, no dev console. Escape closes the panel
 * and returns focus to the pet.
 */

import { type KeyboardEvent as ReactKeyboardEvent, type ReactElement, type RefObject } from 'react'
import { usePetEngine } from '../../react'
import type { VehiclePetOverlayPreferences } from './types'
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
  const { snapshot, resolveText, switchPack, setReducedMotion } = usePetEngine()
  const { t, commitPreferences } = useOverlayChrome()
  const viewModel = snapshot.viewModel
  const activePack = snapshot.activePack
  const manifest = activePack?.manifest ?? null
  const level = viewModel === null || manifest === null
    ? null
    : manifest.levels.find(candidate => candidate.levelId === viewModel.derivedLevelId) ?? null
  const nextLevel = viewModel === null || manifest === null
    ? null
    : manifest.levels.find(candidate => candidate.threshold > viewModel.progressPoints) ?? null
  const unlockedIds = new Set(snapshot.unlockedKeepsakes.map(key => key.keepsakeId))
  const keepsake = manifest === null
    ? null
    : [...(manifest.keepsakes ?? [])]
      .filter(item => unlockedIds.has(item.keepsakeId))
      .at(-1) ?? null
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
      style={{ width: '320px', maxWidth: 'calc(100vw - 32px)' }}
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
        <dt>{t('panel.pack')}</dt>
        <dd data-vehicle-pet-pack-name="true">{manifest === null ? '—' : resolveText(manifest.name)}</dd>
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
        <dt>{t('panel.keepsake')}</dt>
        <dd data-vehicle-pet-keepsake="true">
          {keepsake === null ? t('panel.keepsake.none') : resolveText(keepsake.title)}
        </dd>
      </dl>

      <div className="vpo-actions" role="group" aria-label={t('panel.packSwitch')} data-vehicle-pet-pack-switch="true">
        {snapshot.availablePacks.map(pack => (
          <span key={pack.manifest.packId} className="vpo-packRow">
            <button
              type="button"
              className="vpo-control"
              aria-pressed={pack.manifest.packId === manifest?.packId ? 'true' : 'false'}
              data-vehicle-pet-pack-option={pack.manifest.packId}
              onClick={() => {
                switchPack(pack.manifest.packId)
              }}
            >
              {resolveText(pack.manifest.name)}
            </button>
          </span>
        ))}
      </div>

      <div className="vpo-actions" role="group" aria-label={t('panel.reducedMotion')} data-vehicle-pet-reduced-motion="true">
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
