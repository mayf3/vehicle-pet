/**
 * VehiclePetOverlay: the `shell.overlay` entry (CTR-OVERLAY-002..013).
 * Root layer is click-through; the pet, launcher, compact panel, and full
 * journey dialog re-enable pointer events. Exactly three persisted
 * interaction states (VISIBLE / PANEL_OPEN / COLLAPSED, default VISIBLE,
 * no full hide). During structured onboarding no surface is rendered, and the
 * exact pre-suppression state returns when onboarding ends in the same mount.
 * One Engine instance backs the overlay, panel, and dialog; structured
 * session state drives transient visuals only and never progression.
 */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type KeyboardEvent as ReactKeyboardEvent, type ReactElement,
} from 'react'
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { IndexedDbPetStorage, MemoryPetStorageAdapter, type Locale, type PetStorageAdapter } from '../../engine'
import {
  DailyGreeting, HostActivityFeedback, PetEngineProvider, PetSceneRenderer, UpgradeCeremony, usePetEngine,
} from '../../react'
import { dshPackBundles, dshDefaultPackId } from './engine-bundles'
import type { VehiclePetLocaleKey } from './locales'
import { createOverlayProgressSource } from './OverlayProgressSource'
import type { VehiclePetBindingInfo } from './session-state-adapter'
import { adoptStorageEvent, loadOverlayPreferences, saveOverlayPreferences, subscribeStorageEvents } from './preferences'
import type {
  VehiclePetInteractionState, VehiclePetOverlayPreferences, VehiclePetSessionView,
} from './types'
import { OVERLAY_KEYBOARD_STEPS, useOverlayDrag } from './useOverlayDrag'
import { VehiclePetDialog } from './VehiclePetDialog'
import { VehiclePetPanel } from './VehiclePetPanel'

/** The injected hooks share the renderer binds from the `hooks` compartment. */
export interface VehiclePetInjected {
  hooks: {
    sessionView: HostObservable<VehiclePetSessionView>
    locale: HostObservable<{ active: string; revision: number }>
  }
  /** Structured adapter-binding handshake; exposed as inert data attributes. */
  sessionBinding?: () => VehiclePetBindingInfo
  clientGeneration?: string
}

export type VehiclePetOverlayProps = PropsRuntime<'shell.overlay'>
  & InjectFace<VehiclePetInjected>
  & PropsLocale<'vehicle-pet'>

/** Overlay chrome shared with the panel/dialog: translate + pref commit. */
interface OverlayChrome {
  t: PropsLocale<'vehicle-pet'>['t']
  commitPreferences: (update: (current: VehiclePetOverlayPreferences) => VehiclePetOverlayPreferences) => void
}

const OverlayChromeContext = createContext<OverlayChrome | null>(null)

export function useOverlayChrome(): OverlayChrome {
  const value = useContext(OverlayChromeContext)
  if (value === null) throw new Error('Vehicle Pet overlay chrome used outside its provider')
  return value
}

/** Test/localization seam for panel copy: translate through the entry locale seat. */
export function useOverlayT(): PropsLocale<'vehicle-pet'>['t'] {
  return useOverlayChrome().t
}

export function useOverlayCommitPreferences(): OverlayChrome['commitPreferences'] {
  return useOverlayChrome().commitPreferences
}

export function VehiclePetOverlay(props: VehiclePetOverlayProps): ReactElement | null {
  const { useSessionView, useLocale, useSessions, t, sessionBinding, clientGeneration } = props

  const sessionView = useSessionView(view => view)
  const activeLocale = useLocale(snapshot => snapshot.active)
  const engineLocale: Locale = activeLocale === 'en' ? 'en' : 'zh-CN'
  const sessionListCurrent = useSessions(state => state.current)
  const sessionListContainsCurrent = useSessions(state =>
    state.current !== undefined && state.byId[state.current] !== undefined)
  const onboarding = useSessions(state =>
    state.phase === 'ready'
    && (state.current === undefined || state.byId[state.current]?.blank === true))
  const bindingInfo = sessionBinding?.()

  const [preferences, setPreferences] = useState<VehiclePetOverlayPreferences>(() => loadOverlayPreferences())
  const preferencesRef = useRef(preferences)
  preferencesRef.current = preferences

  // CTR-OVERLAY-010: multi-tab sync via same-origin storage events; adopting
  // never writes, so no write loop can form. Listener disposed on unmount.
  useEffect(() => {
    return subscribeStorageEvents(event => {
      const adopted = adoptStorageEvent(event, preferencesRef.current)
      if (adopted !== null) setPreferences(adopted)
    })
  }, [])

  const commitPreferences = useCallback((update: (current: VehiclePetOverlayPreferences) => VehiclePetOverlayPreferences) => {
    setPreferences(current => {
      const next = update(current)
      saveOverlayPreferences(next)
      return next
    })
  }, [])

  const chrome = useMemo<OverlayChrome>(() => ({ t, commitPreferences }), [t, commitPreferences])

  // CTR-OVERLAY-004/011: the interaction state lives above the onboarding
  // gate. Suppression is an ephemeral host-visibility gate, not a fourth
  // persisted state: when it ends in the same mount, the exact
  // pre-suppression interaction state returns.
  const [interaction, setInteraction] = useState<VehiclePetInteractionState>('VISIBLE')
  const interactionRef = useRef(interaction)
  interactionRef.current = interaction
  const preSuppressionRef = useRef<VehiclePetInteractionState | null>(null)

  // R4-B2 invariant: every collapsed preference source (local action,
  // storage adoption, reload, migration, or fallback) destroys transient open
  // state. A later launcher restore therefore always starts from VISIBLE.
  useEffect(() => {
    if (!preferences.collapsed) return
    preSuppressionRef.current = 'VISIBLE'
    setInteraction('VISIBLE')
  }, [preferences.collapsed])

  useEffect(() => {
    if (onboarding) {
      preSuppressionRef.current ??= interactionRef.current
    } else if (preSuppressionRef.current !== null) {
      const restore = preferences.collapsed ? 'VISIBLE' : preSuppressionRef.current
      preSuppressionRef.current = null
      setInteraction(restore)
    }
  }, [onboarding, preferences.collapsed])

  // CTR-OVERLAY-011: onboarding renders no pet DOM, launcher, panel, dialog,
  // or pointer/focus target at all.
  if (onboarding) return null
  return (
    <OverlayChromeContext.Provider value={chrome}>
      <OverlayEngineGate
        preferences={preferences}
        sessionView={sessionView}
        engineLocale={engineLocale}
        interaction={interaction}
        onInteractionChange={setInteraction}
        sessionListCurrent={sessionListCurrent}
        sessionListContainsCurrent={sessionListContainsCurrent}
        bindingInfo={bindingInfo}
        clientGeneration={clientGeneration}
      />
    </OverlayChromeContext.Provider>
  )
}

/** An adapter created by this Overlay and therefore closed by its lifecycle. */
export type OwnedOverlayStorage = PetStorageAdapter & { close(): void }

export interface OwnedOverlayStorageLifecycleOptions {
  readonly create: () => Promise<OwnedOverlayStorage>
  readonly onReady: (storage: PetStorageAdapter) => void
  readonly fallback: PetStorageAdapter
}

/**
 * Own one asynchronous storage acquisition across mount, stop, and HMR.
 * The returned disposer is idempotent. A connection resolving after disposal
 * is closed immediately and is never published into the unmounted tree.
 */
export function acquireOwnedOverlayStorage({
  create,
  onReady,
  fallback,
}: OwnedOverlayStorageLifecycleOptions): () => void {
  let disposed = false
  let createdAdapter: OwnedOverlayStorage | undefined

  void create()
    .then(created => {
      if (disposed) {
        created.close()
        return
      }
      createdAdapter = created
      onReady(created)
    })
    .catch(() => {
      // Storage unavailable: keep the pet alive with memory-only engine
      // storage. The fallback is externally owned and is never closed here.
      if (!disposed) onReady(fallback)
    })

  return () => {
    if (disposed) return
    disposed = true
    createdAdapter?.close()
    createdAdapter = undefined
  }
}

/** Creates the one Engine storage adapter (IndexedDB, memory fallback) and mounts the provider. */
function OverlayEngineGate({
  preferences,
  sessionView,
  engineLocale,
  interaction,
  onInteractionChange,
  sessionListCurrent,
  sessionListContainsCurrent,
  bindingInfo,
  clientGeneration,
}: {
  preferences: VehiclePetOverlayPreferences
  sessionView: VehiclePetSessionView
  engineLocale: Locale
  interaction: VehiclePetInteractionState
  onInteractionChange: (next: VehiclePetInteractionState) => void
  sessionListCurrent: string | undefined
  sessionListContainsCurrent: boolean
  bindingInfo: VehiclePetBindingInfo | undefined
  clientGeneration: string | undefined
}): ReactElement | null {
  const [storage, setStorage] = useState<PetStorageAdapter | null>(null)
  const progressRuntime = useMemo(() => createOverlayProgressSource(clientGeneration), [clientGeneration])
  useEffect(() => () => progressRuntime.dispose(), [progressRuntime])
  useEffect(() => acquireOwnedOverlayStorage({
    create: () => IndexedDbPetStorage.create(),
    onReady: setStorage,
    fallback: MemoryStorageFallback,
  }), [])

  const reducedMotion = preferences.reducedMotion ?? systemPrefersReducedMotion()
  if (storage === null) return null
  return (
    <PetEngineProvider
      bundles={dshPackBundles}
      defaultPackId={dshDefaultPackId}
      storage={storage}
      source={progressRuntime.source}
      locale={engineLocale}
      reducedMotion={reducedMotion}
      syncDocumentLanguage={false}
    >
      <OverlaySurface
        preferences={preferences}
        sessionView={sessionView}
        interaction={interaction}
        onInteractionChange={onInteractionChange}
        sessionListCurrent={sessionListCurrent}
        sessionListContainsCurrent={sessionListContainsCurrent}
        bindingInfo={bindingInfo}
        clientGeneration={clientGeneration}
      />
    </PetEngineProvider>
  )
}

const MemoryStorageFallback = new MemoryPetStorageAdapter()

function systemPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * The visible overlay: pet (112px), launcher (36px), compact panel (320px),
 * engine feedback surfaces, and the in-Harness full journey dialog.
 */
function OverlaySurface({
  preferences,
  sessionView,
  interaction,
  onInteractionChange,
  sessionListCurrent,
  sessionListContainsCurrent,
  bindingInfo,
  clientGeneration,
}: {
  preferences: VehiclePetOverlayPreferences
  sessionView: VehiclePetSessionView
  interaction: VehiclePetInteractionState
  onInteractionChange: (next: VehiclePetInteractionState) => void
  sessionListCurrent: string | undefined
  sessionListContainsCurrent: boolean
  bindingInfo: VehiclePetBindingInfo | undefined
  clientGeneration: string | undefined
}): ReactElement {
  const setInteraction = onInteractionChange
  const [dialogOpen, setDialogOpen] = useState(false)
  const [petInteractionCount, setPetInteractionCount] = useState(0)
  const collapsed = preferences.collapsed
  const effectiveInteraction: VehiclePetInteractionState = collapsed ? 'VISIBLE' : interaction
  const { t, commitPreferences } = useOverlayChrome()
  const { snapshot } = usePetEngine()
  const petButtonRef = useRef<HTMLButtonElement | null>(null)
  const journeyTriggerRef = useRef<HTMLButtonElement | null>(null)
  const drag = useOverlayDrag({
    preferences,
    panelOpen: effectiveInteraction === 'PANEL_OPEN',
    commitPreferences,
  })

  useEffect(() => {
    if (!collapsed) return
    setInteraction('VISIBLE')
    setDialogOpen(false)
  }, [collapsed, setInteraction])

  const collapse = useCallback(() => {
    setInteraction('VISIBLE')
    setDialogOpen(false)
    commitPreferences(current => ({ ...current, collapsed: true }))
  }, [commitPreferences, setInteraction])

  const restore = useCallback(() => {
    setInteraction('VISIBLE')
    setDialogOpen(false)
    commitPreferences(current => ({ ...current, collapsed: false }))
  }, [commitPreferences, setInteraction])

  const closePanelToPet = useCallback(() => {
    setInteraction('VISIBLE')
    petButtonRef.current?.focus()
  }, [])

  const handleSurfaceKeyDown = (event: ReactKeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Escape') {
      if (dialogOpen) return // the dialog owns Escape while open
      if (effectiveInteraction === 'PANEL_OPEN') closePanelToPet()
      return
    }
    const step = event.shiftKey ? OVERLAY_KEYBOARD_STEPS.large : OVERLAY_KEYBOARD_STEPS.normal
    const movement: Record<string, { x: number; y: number }> = {
      ArrowLeft: { x: -step, y: 0 },
      ArrowRight: { x: step, y: 0 },
      ArrowUp: { x: 0, y: -step },
      ArrowDown: { x: 0, y: step },
    }
    const delta = movement[event.key]
    if (delta === undefined) return
    event.preventDefault()
    drag.moveByKeyboard(delta.x, delta.y)
  }

  const stateKey: VehiclePetLocaleKey = sessionView.terminal !== null
    ? `state.${sessionView.terminal.status}`
    : `state.${sessionView.live}`

  return (
    <div
      className="vpo-root"
      ref={drag.rootRef}
      data-vehicle-pet={collapsed ? 'collapsed' : effectiveInteraction}
      data-active-surface-left={drag.activeBounds.left}
      data-active-surface-top={drag.activeBounds.top}
      data-active-surface-right={drag.activeBounds.right}
      data-active-surface-bottom={drag.activeBounds.bottom}
      data-session-list-current={sessionListCurrent}
      data-session-list-contains-current={sessionListContainsCurrent ? 'true' : 'false'}
      data-adapter-session={bindingInfo?.currentId}
      data-adapter-binding-ready={bindingInfo?.ready ? 'true' : 'false'}
      data-adapter-generation={bindingInfo?.generation}
      data-client-generation={clientGeneration}
    >
      <div className="vpo-shell" style={drag.shellStyle} data-dragging={drag.isDragging}>
        {collapsed ? (
          <button
            type="button"
            className="vpo-launcher"
            aria-label={t('launcher.restore')}
            data-vehicle-pet-launcher="true"
            onClick={restore}
            onKeyDown={handleSurfaceKeyDown}
          >
            <span className="vpo-launcherDot" aria-hidden="true" />
          </button>
        ) : (
          <button
            ref={petButtonRef}
            type="button"
            className="vpo-surface vpo-pet"
            aria-label={t('overlay.label', { state: t(stateKey) })}
            aria-expanded={effectiveInteraction === 'PANEL_OPEN'}
            data-vehicle-pet-pet="true"
            data-vehicle-pet-pack={snapshot.activePack?.manifest.packId}
            data-vehicle-pet-level={snapshot.viewModel?.derivedLevelId}
            data-live={sessionView.terminal !== null ? 'terminal' : sessionView.live}
            data-terminal={sessionView.terminal?.status}
            onKeyDown={handleSurfaceKeyDown}
            onClick={() => {
              if (drag.consumeSuppressedClick()) return
              setPetInteractionCount(count => count + 1)
              setInteraction(effectiveInteraction === 'PANEL_OPEN' ? 'VISIBLE' : 'PANEL_OPEN')
            }}
            onPointerDown={drag.onPointerDown}
            onPointerMove={drag.onPointerMove}
            onPointerUp={drag.onPointerUp}
            onPointerCancel={drag.onPointerCancel}
          >
            <span className="vpo-scene">
              <PetSceneRenderer subjectInteractive={false} interactionCount={petInteractionCount} presentationMode="compact-overlay" />
            </span>
            <WithinLevelMicroProgress viewModel={snapshot.viewModel} />
            {sessionView.live === 'needs-input' ? <span className="vpo-badge" aria-hidden="true" /> : null}
          </button>
        )}

        {!collapsed && effectiveInteraction === 'PANEL_OPEN' ? (
          <VehiclePetPanel
            panelRef={drag.panelRef}
            horizontal={drag.panelPlacement.horizontal}
            vertical={drag.panelPlacement.vertical}
            preferences={preferences}
            onCollapse={collapse}
            onRequestClose={closePanelToPet}
            onOpenJourney={() => {
              setDialogOpen(true)
            }}
            journeyTriggerRef={journeyTriggerRef}
          />
        ) : null}

        {!collapsed ? (
          <span className="vpo-feedbackWrap">
            <DailyGreeting />
            <HostActivityFeedback />
            <TerminalFeedbackDispatcher sessionView={sessionView} />
            <UpgradeCeremony />
          </span>
        ) : null}
      </div>

      {!collapsed && dialogOpen ? (
        <VehiclePetDialog
          onClose={() => {
            setDialogOpen(false)
            journeyTriggerRef.current?.focus()
          }}
        />
      ) : null}
    </div>
  )
}

/**
 * Resident within-level micro progress (§8.1 temporary session-state surface):
 * a non-interactive, aria-hidden sliver under the pet so stage-internal
 * progress is perceivable without opening the panel. It renders from the
 * derived view model only, adds no pointer/focus target, and therefore does
 * not alter the CTR-OVERLAY-004 click contract.
 */
function WithinLevelMicroProgress({ viewModel }: { viewModel: { withinLevelEarned: number; withinLevelSpan: number; capped: boolean } | null | undefined }): ReactElement | null {
  if (!viewModel || viewModel.withinLevelSpan <= 0 || viewModel.capped) return null
  const percent = Math.max(0, Math.min(100, Math.round((viewModel.withinLevelEarned / viewModel.withinLevelSpan) * 100)))
  return (
    <span className="vpo-progress" aria-hidden="true" data-within-level-percent={percent}>
      <span className="vpo-progressFill" style={{ width: `${percent}%` }} />
    </span>
  )
}

/**
 * Terminal turns dispatch one short HostActivityEventV1 each. EventIds derive
 * from the adapter's edge-deduped identities through a deterministic digest
 * (the engine's eventId pattern allows only [a-z0-9-], while identities carry
 * session ids, '#', and seqs); the dispatcher additionally ignores duplicate
 * eventIds (first wins). Dispatching never mutates progression
 * (CTR-OVERLAY-007/013). The visible pill is the single
 * <HostActivityFeedback /> in the feedback wrap above.
 */
function terminalEventId(identity: string): string {
  let a = 0x811c9dc5
  let b = 0x01000193
  for (let index = 0; index < identity.length; index += 1) {
    const code = identity.charCodeAt(index)
    a = Math.imul(a ^ code, 0x01000193) >>> 0
    b = Math.imul(b + code + 1, 0x85ebca6b) >>> 0
  }
  return `dsh-session-turn-${a.toString(36)}-${b.toString(36)}`
}

function TerminalFeedbackDispatcher({ sessionView }: { sessionView: VehiclePetSessionView }): null {
  const { dispatchHostActivity } = usePetEngine()
  const terminal = sessionView.terminal
  useEffect(() => {
    if (terminal === null) return
    dispatchHostActivity({
      schemaVersion: 1,
      eventId: terminalEventId(terminal.identity),
      activityId: 'dsh-session',
      status: terminal.status,
      occurredAt: new Date().toISOString(),
    })
  }, [dispatchHostActivity, terminal])
  return null
}
