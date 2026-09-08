/**
 * VehiclePetOverlay: the `shell.overlay` entry (DSH_PET_OVERLAY_ADAPTER_V3).
 * Root layer is click-through; the pet hitbox, launcher, secondary menu, and
 * full journey dialog re-enable pointer events. The persisted interaction
 * machine is exactly VISIBLE with a collapsed browser-local preference — no
 * PANEL_OPEN, no full hide (CTR-OVERLAY-004). A normal pet click is a pet
 * reaction (expression variant + light motion + throttled line), never a
 * settings surface (CTR-OVERLAY-021). The resident hitbox hugs the visible
 * sprite within the recorded tolerance (CTR-OVERLAY-003). During structured
 * onboarding no surface is rendered, and the exact pre-suppression state
 * returns when onboarding ends in the same mount (CTR-OVERLAY-011). One
 * Engine instance backs the overlay, menu, and dialog; structured session
 * state drives transient visuals only and never progression.
 */

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactElement,
} from 'react'
import type { HostObservable, InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import { IndexedDbPetStorage, MemoryPetStorageAdapter, type Locale, type PetStorageAdapter } from '../../engine'
import {
  DailyGreeting, HostActivityFeedback, PetEngineProvider, PetSceneRenderer, UpgradeCeremony, usePetEngine,
} from '../../react'
import { dshPackBundles, dshDefaultPackId, resolveDshProductPackId } from './engine-bundles'
import type { VehiclePetLocaleKey } from './locales'
import { createOverlayProgressSource } from './OverlayProgressSource'
import type { VehiclePetBindingInfo } from './session-state-adapter'
import type { UsageSessionsSource } from './usage-progress-source'
import { adoptStorageEvent, loadOverlayPreferences, saveOverlayPreferences, subscribeStorageEvents } from './preferences'
import {
  OVERLAY_GEOMETRY, effectiveSize, residentSurfaceSizePx,
  type VehiclePetOverlayPreferences, type VehiclePetSessionView,
} from './types'
import { OVERLAY_KEYBOARD_STEPS, useOverlayDrag } from './useOverlayDrag'
import { levelVisibleBbox } from './level-bbox.generated'
import {
  expressionStateFromSession, selectExpressionVariant,
  type VehiclePetExpressionVariant,
} from './expressions'
import { ExpressionLayer } from './ExpressionLayer'
import { VehiclePetDialog } from './VehiclePetDialog'
import { VehiclePetSecondaryMenu } from './VehiclePetSecondaryMenu'
import { useVehiclePetSpeech, VehiclePetBubble } from './VehiclePetSpeech'

/** The injected hooks share the renderer binds from the `hooks` compartment. */
export interface VehiclePetInjected {
  hooks: {
    sessionView: HostObservable<VehiclePetSessionView>
    locale: HostObservable<{ active: string; revision: number }>
  }
  /** Structured adapter-binding handshake; exposed as inert data attributes. */
  sessionBinding?: () => VehiclePetBindingInfo
  /** Injected `ctx.sessions` face feeding the authorized usage source (DSH_USAGE_PROGRESS_SOURCE_V1). */
  usageSessions?: UsageSessionsSource
  clientGeneration?: string
}

export type VehiclePetOverlayProps = PropsRuntime<'shell.overlay'>
  & InjectFace<VehiclePetInjected>
  & PropsLocale<'vehicle-pet'>

/** Overlay chrome shared with the menu/dialog: translate + pref commit. */
interface OverlayChrome {
  t: PropsLocale<'vehicle-pet'>['t']
  commitPreferences: (update: (current: VehiclePetOverlayPreferences) => VehiclePetOverlayPreferences) => void
  engineLocale: Locale
}

const OverlayChromeContext = createContext<OverlayChrome | null>(null)

export function useOverlayChrome(): OverlayChrome {
  const value = useContext(OverlayChromeContext)
  if (value === null) throw new Error('Vehicle Pet overlay chrome used outside its provider')
  return value
}

/** Test/localization seam for menu copy: translate through the entry locale seat. */
export function useOverlayT(): PropsLocale<'vehicle-pet'>['t'] {
  return useOverlayChrome().t
}

export function useOverlayCommitPreferences(): OverlayChrome['commitPreferences'] {
  return useOverlayChrome().commitPreferences
}

export function VehiclePetOverlay(props: VehiclePetOverlayProps): ReactElement | null {
  const { useSessionView, useLocale, useSessions, t, sessionBinding, usageSessions, clientGeneration } = props

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

  const chrome = useMemo<OverlayChrome>(() => ({ t, commitPreferences, engineLocale }), [t, commitPreferences, engineLocale])

  // CTR-OVERLAY-011: onboarding renders no pet DOM, launcher, menu, dialog,
  // bubble, or pointer/focus target at all. The gate is ephemeral, not a
  // persisted state; nothing to restore but the ordinary render.
  if (onboarding) return null
  return (
    <OverlayChromeContext.Provider value={chrome}>
      <OverlayEngineGate
        preferences={preferences}
        sessionView={sessionView}
        engineLocale={engineLocale}
        sessionListCurrent={sessionListCurrent}
        sessionListContainsCurrent={sessionListContainsCurrent}
        bindingInfo={bindingInfo}
        usageSessions={usageSessions}
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
  sessionListCurrent,
  sessionListContainsCurrent,
  bindingInfo,
  usageSessions,
  clientGeneration,
}: {
  preferences: VehiclePetOverlayPreferences
  sessionView: VehiclePetSessionView
  engineLocale: Locale
  sessionListCurrent: string | undefined
  sessionListContainsCurrent: boolean
  bindingInfo: VehiclePetBindingInfo | undefined
  usageSessions: UsageSessionsSource | undefined
  clientGeneration: string | undefined
}): ReactElement | null {
  const [storage, setStorage] = useState<PetStorageAdapter | null>(null)
  const progressRuntime = useMemo(() => createOverlayProgressSource({ sessions: usageSessions }), [usageSessions])
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
 * The visible overlay: resident pet (SMALL 112 / LARGE 216), launcher (36px),
 * hover-revealed secondary menu, engine feedback surfaces, the speech bubble,
 * and the in-Harness full journey dialog. No panel, no resident progress
 * presentation (V3 CTR-OVERLAY-004/005/016).
 */
function OverlaySurface({
  preferences,
  sessionView,
  sessionListCurrent,
  sessionListContainsCurrent,
  bindingInfo,
  clientGeneration,
}: {
  preferences: VehiclePetOverlayPreferences
  sessionView: VehiclePetSessionView
  sessionListCurrent: string | undefined
  sessionListContainsCurrent: boolean
  bindingInfo: VehiclePetBindingInfo | undefined
  clientGeneration: string | undefined
}): ReactElement {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [petInteractionCount, setPetInteractionCount] = useState(0)
  const collapsed = preferences.collapsed
  const { t, commitPreferences } = useOverlayChrome()
  const { snapshot, switchPack } = usePetEngine()
  const journeyTriggerRef = useRef<HTMLButtonElement | null>(null)

  // CTR-OVERLAY-006: the DSH surface presents `autonomous-fleet` as the only
  // user-selectable product Pack; legacy non-product stored state resolves
  // through the ordinary Engine `activePackId` mechanism without data loss.
  const activePackId = snapshot.activePack?.manifest.packId
  useEffect(() => {
    if (!snapshot.initialized) return
    const resolved = resolveDshProductPackId(activePackId)
    if (activePackId !== undefined && activePackId !== resolved) {
      switchPack(resolved)
    }
  }, [snapshot.initialized, activePackId, switchPack])
  const drag = useOverlayDrag({
    preferences,
    menuOpen,
    commitPreferences,
  })

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
  }, [])

  // R4-B2 invariant carried to V3: every collapsed preference source (local
  // action, storage adoption, reload, or fallback) destroys transient open
  // state. A later restore therefore always starts from a clean VISIBLE.
  useEffect(() => {
    if (!collapsed) return
    setMenuOpen(false)
    setDialogOpen(false)
  }, [collapsed])

  const collapse = useCallback(() => {
    setMenuOpen(false)
    setDialogOpen(false)
    commitPreferences(current => ({ ...current, collapsed: true }))
  }, [commitPreferences])

  const restore = useCallback(() => {
    setDialogOpen(false)
    commitPreferences(current => ({ ...current, collapsed: false }))
  }, [commitPreferences])

  const handleSurfaceKeyDown = (event: ReactKeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Escape') {
      if (dialogOpen) return // the dialog owns Escape while open
      if (menuOpen) closeMenu()
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

  return (
    <div
      className="vpo-root"
      ref={drag.rootRef}
      data-vehicle-pet={collapsed ? 'COLLAPSED' : 'VISIBLE'}
      data-vehicle-pet-size={collapsed ? undefined : effectiveSize(preferences)}
      data-menu-open={menuOpen && !collapsed ? 'true' : 'false'}
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
      <div
        className="vpo-shell"
        style={{ ...drag.shellStyle, '--vp-subject-boost': subjectBoostFor(snapshot.plan, residentSurfaceSizePx(false, effectiveSize(preferences))) } as CSSProperties}
        data-dragging={drag.isDragging}
        data-menu-open={menuOpen ? 'true' : 'false'}
        data-live={sessionView.terminal !== null ? 'terminal' : sessionView.live}
        data-terminal={sessionView.terminal?.status}
      >
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
          <ResidentPet
            sessionView={sessionView}
            surfaceSize={residentSurfaceSizePx(false, effectiveSize(preferences))}
            menuOpen={menuOpen}
            onOpenMenu={() => setMenuOpen(true)}
            bubblePlacement={drag.point.y < 72 ? 'below' : 'above'}
            petInteractionCount={petInteractionCount}
            onPetClick={() => setPetInteractionCount(count => count + 1)}
            dragHandlers={drag}
            onKeyDown={handleSurfaceKeyDown}
          />
        )}

        {!collapsed && menuOpen ? (
          <VehiclePetSecondaryMenu
            menuRef={drag.menuRef}
            placement={drag.panelPlacement}
            preferences={preferences}
            onCommitSize={next => {
              commitPreferences(current => ({ ...current, size: next }))
            }}
            onCollapse={collapse}
            onRequestClose={closeMenu}
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
 * The resident pet surface (V3): the full-canvas scene renders the level
 * visual (pointer-events none, aria-hidden); one transparent hit button
 * overlays the visible sprite bbox within the recorded tolerance and carries
 * the pointer/focus/keyboard surface (CTR-OVERLAY-003 hitbox honesty, V3
 * CTR-OVERLAY-021 click reaction). The speech bubble and the hover-revealed
 * menu trigger live here.
 */
/**
 * LARGE presence boost (V3 audit craft round): the compact renderer sizes the
 * subject with the SMALL-era `max(42, planned)%` box, which leaves a LARGE
 * card mostly empty. The overlay scales the LARGE subject up (never beyond
 * the shell) through the `--vp-subject-boost` variable; the hitbox math uses
 * the same factor so pointer/focus honesty is preserved.
 */
export function subjectBoostFor(plan: ReturnType<typeof usePetEngine>['snapshot']['plan'], surfaceSize: number): number {
  if (plan === null || surfaceSize <= OVERLAY_GEOMETRY.smallSurfaceHeightPx) return 1
  const subject = plan.nodes.find(node => node.kind === 'subject')
  if (subject === undefined) return 1
  const camera = plan.cameraZoomPermille / 1000
  const subjectScale = plan.subjectScalePermille / 1000
  const planned = (SUBJECT_BASE_WIDTH_PERCENT * subject.placement.scalePermille * camera * subjectScale) / 1000
  const side = (Math.max(42, planned) / 100) * surfaceSize
  if (side <= 0) return 1
  return Math.min(SUBJECT_LARGE_SCALE_MAX, (surfaceSize * 0.94) / side)
}

const SUBJECT_LARGE_SCALE_MAX = 1.6

function levelIndex(levelId: string): number {
  const match = /(\d+)$/.exec(levelId)
  return match === null ? 0 : Number(match[1])
}

function ResidentPet({
  sessionView,
  surfaceSize,
  menuOpen,
  onOpenMenu,
  bubblePlacement,
  petInteractionCount,
  onPetClick,
  dragHandlers,
  onKeyDown,
}: {
  sessionView: VehiclePetSessionView
  surfaceSize: number
  menuOpen: boolean
  onOpenMenu: () => void
  bubblePlacement: 'above' | 'below'
  petInteractionCount: number
  onPetClick: () => void
  dragHandlers: ReturnType<typeof useOverlayDrag>
  onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void
}): ReactElement {
  const { t, engineLocale } = useOverlayChrome()
  const { snapshot } = usePetEngine()

  const speech = useVehiclePetSpeech({
    sessionView,
    locale: engineLocale,
    enabled: true,
  })

  // Level-up milestone: a derived-level increase announces a milestone line
  // and presents proudly (CTR-OVERLAY-018/019 event edge; deduplicated by the
  // level identity itself).
  const levelId = snapshot.viewModel?.derivedLevelId
  const lastLevelRef = useRef<string | null>(null)
  const lastVariantRef = useRef<VehiclePetExpressionVariant | undefined>(undefined)
  useEffect(() => {
    if (!snapshot.initialized) return
    if (levelId === undefined) return
    const previous = lastLevelRef.current
    lastLevelRef.current = levelId
    if (previous !== null && levelIndex(previous) < levelIndex(levelId)) {
      speech.speakMilestone()
    }
  }, [levelId, snapshot.initialized, speech])

  const state = expressionStateFromSession(sessionView)
  const variant = selectExpressionVariant({
    state,
    terminalStatus: sessionView.terminal?.status ?? null,
    milestoneActive: speech.milestoneActive,
    clickCount: petInteractionCount,
    idleBucket: speech.idleBucket,
    lastVariantForState: lastVariantRef.current,
  })
  lastVariantRef.current = variant

  const stateKey: VehiclePetLocaleKey = sessionView.terminal !== null
    ? `state.${sessionView.terminal.status}`
    : `state.${sessionView.live}`

  const hitStyle = visibleHitStyle(snapshot, surfaceSize, levelId)

  return (
    <>
      <span className="vpo-scene" aria-hidden="true">
        <PetSceneRenderer
          subjectInteractive={false}
          interactionCount={petInteractionCount}
          presentationMode="compact-overlay"
          subjectOverlay={
            <ExpressionLayer
              variant={variant}
              derivedLevelId={levelId}
            />
          }
        />
      </span>
      <button
        type="button"
        className="vpo-surface vpo-petHit"
        style={hitStyle}
        aria-label={t('overlay.label', { state: t(stateKey) })}
        data-vehicle-pet-pet="true"
        data-vehicle-pet-expression={variant}
        data-vehicle-pet-pack={snapshot.activePack?.manifest.packId}
        data-vehicle-pet-level={levelId}
        data-live={sessionView.terminal !== null ? 'terminal' : sessionView.live}
        data-terminal={sessionView.terminal?.status}
        onKeyDown={onKeyDown}
        onClick={() => {
          if (dragHandlers.consumeSuppressedClick()) return
          onPetClick()
          speech.speakForClick(state)
        }}
        onPointerDown={dragHandlers.onPointerDown}
        onPointerMove={dragHandlers.onPointerMove}
        onPointerUp={dragHandlers.onPointerUp}
        onPointerCancel={dragHandlers.onPointerCancel}
      />
      {sessionView.live === 'needs-input' ? <span className="vpo-badge" aria-hidden="true" /> : null}
      <VehiclePetBubble bubble={speech.bubble} placement={bubblePlacement} />
      <div className={`vpo-tools${menuOpen ? ' vpo-tools-open' : ''}`}>
        <button
          type="button"
          className="vpo-control vpo-toolsTrigger"
          aria-label={t('menu.open')}
          aria-expanded={menuOpen}
          data-vehicle-pet-menu-trigger="true"
          onClick={onOpenMenu}
          onKeyDown={onKeyDown}
        >
          ⋯
        </button>
      </div>
    </>
  )
}

/**
 * Visible-sprite hitbox geometry (V3 CTR-OVERLAY-003): mirror of the
 * renderer's compact-overlay subject math (NODE_BASE_WIDTH_PERCENT.subject =
 * 60, `max(42, planned)` square, plan-centred) intersected with the
 * generated per-level alpha bounding box, expanded by at most the recorded
 * tolerance. Falls back to the full canvas when the plan is not ready; a
 * contract test pins the mirror to the renderer's real subject rect.
 */
function visibleHitStyle(
  snapshot: ReturnType<typeof usePetEngine>['snapshot'],
  surfaceSize: number,
  levelId: string | undefined,
): CSSProperties {
  const plan = snapshot.plan
  if (plan === null || levelId === undefined) {
    return { left: 0, top: 0, width: '100%', height: '100%' }
  }
  const subject = plan.nodes.find(node => node.kind === 'subject')
  if (subject === undefined) {
    return { left: 0, top: 0, width: '100%', height: '100%' }
  }
  const boost = subjectBoostFor(plan, surfaceSize)
  const camera = plan.cameraZoomPermille / 1000
  const subjectScale = plan.subjectScalePermille / 1000
  const planned = (SUBJECT_BASE_WIDTH_PERCENT * subject.placement.scalePermille * camera * subjectScale) / 1000
  const sidePct = Math.max(42, planned)
  const centerX = 50 + (subject.placement.x / 100 - 50) * camera
  const centerY = 50 + (subject.placement.y / 100 - 50) * camera
  const side = (sidePct / 100) * surfaceSize * boost
  const packId = snapshot.activePack?.manifest.packId
  const bbox = packId === undefined ? undefined : levelVisibleBbox[`${packId}/${levelId}`]
  const boxLeft = (centerX / 100) * surfaceSize - side / 2
  const boxTop = (centerY / 100) * surfaceSize - side / 2
  const tolerance = Math.min(OVERLAY_GEOMETRY.hitboxTolerancePx, side / 8)
  const left = bbox === undefined ? boxLeft : boxLeft + (side * bbox.leftPct) / 100
  const top = bbox === undefined ? boxTop : boxTop + (side * bbox.topPct) / 100
  const width = bbox === undefined ? side : (side * bbox.widthPct) / 100
  const height = bbox === undefined ? side : (side * bbox.heightPct) / 100
  return {
    left: Math.max(0, left - tolerance),
    top: Math.max(0, top - tolerance),
    width: Math.min(surfaceSize, width + tolerance * 2),
    height: Math.min(surfaceSize, height + tolerance * 2),
  }
}

/** Mirrors PetSceneRenderer NODE_BASE_WIDTH_PERCENT.subject (pinned by contract test). */
const SUBJECT_BASE_WIDTH_PERCENT = 60

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
