import keepsakeVersionAliases from '../../packs/keepsake-compatibility.json'
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
  DailyGreeting, HostActivityFeedback, PetEngineProvider, UpgradeCeremony, usePetEngine,
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
import { usePlayfulReaction, ReactionDecoration } from './playful-reactions'
import {
  GESTURE_PETTING_HOLD_MS, INITIAL_GESTURE_STATE, promoteToPetting, reduceGesture,
  readClickChainAt, storeClickChainAt,
  type GestureInputEvent, type GestureState,
} from './gesture-rules'
import { useAmbientBehavior } from './use-ambient'
import { useCursorGaze } from './use-cursor-gaze'
import { daypartFromDate, type DaypartBucket } from './daypart'
import {
  EMPTY_RITUAL_MARKERS, isLateNightRitualDue, lateNightRitualDayKey,
  localDayKey, recordRitual, shouldWelcomeBack,
} from './ritual-rules'
import {activeSessionsFromList, type ActiveSession} from './active-sessions'
import {ActiveSessionFooter} from './ActiveSessionFooter'
import { CharacterVisual } from './CharacterVisual'
import { petDefinition, petDisplayName, petGrade, resolvePetId, userSelectablePets } from './pets/bundled'
import { petHitStyle } from './CharacterVisual'
import type { PetId, RitualMarkers } from './types'
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
  activeSessions?: readonly ActiveSession[]
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
  const sessionMetadata = useSessions(state => state)
  const activeSessions = useMemo(()=>activeSessionsFromList(sessionMetadata),[sessionMetadata])
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

  // V7: the state updater stays PURE (React may re-invoke it during renders —
  // a side-effecting updater amplifies into write storms); the persistence
  // write happens exactly once per commit, immediately, from the ref-chained
  // next value so same-tick commits chain correctly (CTR-010).
  const commitPreferences = useCallback((update: (current: VehiclePetOverlayPreferences) => VehiclePetOverlayPreferences) => {
    const next = update(preferencesRef.current)
    preferencesRef.current = next
    setPreferences(next)
    saveOverlayPreferences(next)
  }, [])

  const chrome = useMemo<OverlayChrome>(() => ({ t, commitPreferences, engineLocale, activeSessions }), [t, commitPreferences, engineLocale, activeSessions])

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

  const reducedMotion = true
  if (storage === null) return null
  return (
    <PetEngineProvider
      keepsakeVersionAliases={keepsakeVersionAliases}
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
  const { t, commitPreferences, engineLocale } = useOverlayChrome()
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



  // R4-B2 invariant carried to V3: every collapsed preference source (local
  // action, storage adoption, reload, or fallback) destroys transient open
  // state. A later restore therefore always starts from a clean VISIBLE.
  useEffect(() => {
    if (!collapsed) return
    setMenuOpen(false)
    setDialogOpen(false)
  }, [collapsed])

  // V7 CTR-035/036 ritual bookkeeping: tolerant optional preference fields.
  // The late-night marker stamps the RITUAL day key (the hours before 05:00
  // belong to the previous evening), matching the key the due-check uses —
  // otherwise the marker never matches and the ritual re-fires forever.
  const commitRitual = useCallback((kind: 'first-completion' | 'late-night' | 'welcome') => {
    const now = new Date()
    const dayKey = kind === 'late-night' ? lateNightRitualDayKey(now) : localDayKey(now)
    commitPreferences(current => ({
      ...current,
      rituals: recordRitual(current.rituals ?? EMPTY_RITUAL_MARKERS, kind, dayKey),
    }))
  }, [commitPreferences])
  const touchLastSeen = useCallback(() => {
    commitPreferences(current => ({ ...current, lastSeenAt: Date.now() }))
  }, [commitPreferences])
  // CTR-035: WELCOME_BACK wins over the normal greeting in the same return
  // window — when the stored absence crosses the threshold (welcome pending)
  // or today's welcome was already claimed, the Engine greeting pill stays
  // suppressed for this session.
  const suppressDailyGreetingToday = useMemo(() => {
    const todayKey = localDayKey(new Date())
    const markers = preferences.rituals ?? EMPTY_RITUAL_MARKERS
    return shouldWelcomeBack(preferences.lastSeenAt, Date.now(), todayKey, markers)
      || markers.welcomeDayKey === todayKey
  }, [preferences.lastSeenAt, preferences.rituals])

  const ritualBridge = useMemo(() => ({
    lastSeenAt: preferences.lastSeenAt,
    markers: preferences.rituals ?? EMPTY_RITUAL_MARKERS,
    onRitual: commitRitual,
    onTouchLastSeen: touchLastSeen,
  }), [preferences.lastSeenAt, preferences.rituals, commitRitual, touchLastSeen])

  // V7 CTR-029: an outside press closes the menu, and Chromium may synthesize
  // a native dblclick from that same closing click plus the previous pet
  // click — which would instantly reopen what it just closed. Outside-press
  // closes are therefore stamped, and the resident's gesture session is
  // reset through gestureResetRef (chain + session cleared); Escape closes
  // are never stamped, so close-then-reopen flows stay instant.
  const gestureResetRef = useRef<() => void>(() => {})
  const armOutsidePressReset = useCallback(() => {
    gestureResetRef.current()
  }, [])
  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    drag.rootRef.current?.querySelector<HTMLButtonElement>('[data-vehicle-pet-pet]')?.focus()
  }, [drag.rootRef])
  const openSecondaryMenu = useCallback(() => setMenuOpen(true), [])

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
        data-reduced-motion={snapshot.reducedMotion}
        style={{ ...drag.shellStyle, '--vpo-x': `${drag.point.x}px`, '--vp-subject-boost': subjectBoostFor(snapshot.plan, residentSurfaceSizePx(false, effectiveSize(preferences))), '--vp-tilt': `${drag.tiltDeg}deg` } as CSSProperties}
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
            petId={resolvePetId(preferences.characterId)}
            sessionView={sessionView}
            surfaceSize={residentSurfaceSizePx(false, effectiveSize(preferences))}
            menuOpen={menuOpen}
            onOpenMenu={openSecondaryMenu}
            bubblePlacement={drag.point.y < 72 ? 'below' : 'above'}
            petInteractionCount={petInteractionCount}
            onPetClick={() => setPetInteractionCount(count => count + 1)}
            dragHandlers={drag}
            onKeyDown={handleSurfaceKeyDown}
            rituals={ritualBridge}
            gestureResetRef={gestureResetRef}
          />
        )}

        {!collapsed && menuOpen ? (
          <VehiclePetSecondaryMenu
            menuRef={drag.menuRef}
            placement={drag.panelPlacement}
            preferences={preferences}
            pets={userSelectablePets().map(pet => ({
              id: pet.id,
              label: petDisplayName(pet.id, engineLocale),
            }))}
            onCommitSize={next => {
              commitPreferences(current => ({ ...current, size: next }))
            }}
            onCollapse={collapse}
            onRequestClose={closeMenu}
            onOutsidePress={armOutsidePressReset}
            dialogOpen={dialogOpen}
            onOpenJourney={() => {
              setDialogOpen(true)
            }}
            journeyTriggerRef={journeyTriggerRef}
          />
        ) : null}

        {!collapsed ? (
          <span className="vpo-feedbackWrap" data-placement={drag.point.y < 110 ? 'below' : 'above'}>
            {/* CTR-035: a return-day welcome takes the first-open-of-day
                greeting slot — the Engine greeting pill stays suppressed for
                this session so the return day never double-greets. */}
            {!suppressDailyGreetingToday ? <DailyGreeting /> : null}
            <HostActivityFeedback />
            <TerminalFeedbackDispatcher sessionView={sessionView} />
          </span>
        ) : null}
        {!collapsed ? <UpgradeCeremony /> : null}
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

/** Direct interactions (click/petting/drag/menu) arm the ambient cooldown. */
const LATE_NIGHT_INPUT_RECENCY_MS = 30 * 60 * 1000
/** The lastSeenAt touch rewrites only stamps older than this (V7 CTR-035). */
const LASTSEEN_TOUCH_STALE_MS = 60 * 1000

function ResidentPet({
  petId,
  menuOpen,
  sessionView,
  surfaceSize,
  onOpenMenu,
  bubblePlacement,
  petInteractionCount,
  onPetClick,
  dragHandlers,
  onKeyDown,
  rituals,
  gestureResetRef,
}: {
  petId: PetId
  sessionView: VehiclePetSessionView
  surfaceSize: number
  menuOpen: boolean
  onOpenMenu: () => void
  bubblePlacement: 'above' | 'below'
  petInteractionCount: number
  onPetClick: () => void
  dragHandlers: ReturnType<typeof useOverlayDrag>
  onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void
  gestureResetRef: { current: () => void }
  rituals: {
    readonly lastSeenAt: number | undefined
    readonly markers: RitualMarkers
    readonly onRitual: (kind: 'first-completion' | 'late-night' | 'welcome') => void
    readonly onTouchLastSeen: () => void
  }
}): ReactElement {
  const { t, engineLocale, activeSessions = [] } = useOverlayChrome()
  const { snapshot } = usePetEngine()

  const [gesture, setGesture] = useState<GestureState>(INITIAL_GESTURE_STATE)
  const gestureRef = useRef(gesture)
  gestureRef.current = gesture
  // Menu closes invoke this synchronously (raw-listener ordering included):
  // the closing interaction's gesture chain dies with the menu — including
  // the module-level double-click chain memory (587bf81), which would
  // otherwise let the closing click synthesize a reopen.
  gestureResetRef.current = () => {
    gestureRef.current = INITIAL_GESTURE_STATE
    setGesture(INITIAL_GESTURE_STATE)
    storeClickChainAt(null)
    suppressDblClickRef.current = true
  }
  const suppressClickRef = useRef(false)
  // Armed by an outside-press menu close: the closing interaction's own
  // synthesized dblclick is consumed once instead of reopening (CTR-005).
  const suppressDblClickRef = useRef(false)
  const lastInteractionRef = useRef(0)
  const noteInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now()
  }, [])
  const [daypart, setDaypart] = useState<DaypartBucket>(() => daypartFromDate(new Date()))
  const markersRef = useRef(rituals.markers)
  markersRef.current = rituals.markers
  const ritualBridgeRef = useRef(rituals)
  ritualBridgeRef.current = rituals
  const characterAreaRef = useRef<HTMLSpanElement | null>(null)

  // V7 CTR-034: device-local daypart, re-evaluated each minute.
  useEffect(() => {
    const handle = globalThis.setInterval(() => setDaypart(daypartFromDate(new Date())), 60000)
    return () => globalThis.clearInterval(handle)
  }, [])

  const speech = useVehiclePetSpeech({
    sessionView,
    locale: engineLocale,
    enabled: true,
    petId,
    daypartBucket: daypart,
    pettingActive: gesture.petting,
    rituals: {
      getMarkers: () => markersRef.current,
      onRitual: kind => ritualBridgeRef.current.onRitual(kind),
    },
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
  const baselineVariant = selectExpressionVariant({
    state,
    terminalStatus: sessionView.terminal?.status ?? null,
    milestoneActive: speech.milestoneActive,
    clickCount: petInteractionCount,
    idleBucket: speech.idleBucket,
    lastVariantForState: lastVariantRef.current,
    daypartSleepy: daypart === 'late-night',
  })
  // "Dragging" means a real position drag (gesture phase), not a held
  // pointer: petting holds present while isDragging (pointer-down) is true.
  const realDragging = dragHandlers.isDragging && gesture.phase === 'dragged'
  const playful = usePlayfulReaction({ state, terminalIdentity: sessionView.terminal?.identity ?? null,
    petId, menuOpen, dragging: realDragging,
    ambientKey: speech.bubble?.source === 'ambient' ? speech.bubble.key : null })
  const baselineForSelection = baselineVariant
  const variant = state === 'idle' && playful.reaction ? playful.reaction.definition.variant : baselineForSelection
  lastVariantRef.current = baselineForSelection

  // V7 CTR-031: bounded cursor awareness — static under reduced motion,
  // disabled while busy; reads only pointer coordinates near the figure.
  useCursorGaze({
    elementRef: characterAreaRef,
    enabled: true,
    disabled: playful.reduced || menuOpen || dragHandlers.isDragging || gesture.petting || state !== 'idle',
  })

  // V7 CTR-033: the one ambient behavior timer; verdicts pure in ambient-rules.
  useAmbientBehavior({
    petId,
    daypartBucket: daypart,
    readCadence: speech.readCadence,
    readLastInteractionAt: () => lastInteractionRef.current,
    enabled: !gesture.petting,
    play: playful.playAmbient,
  })

  // Gesture arbiter (CTR-029): one pure state model for the pointer session.
  // The menu's outside-press close resets the session through gestureResetRef
  // (document capture ordering), so the closing interaction's trailing click
  // cannot chain into a synthetic double-click that would reopen what it just
  // closed (CTR-005/029).
  const handleGesture = useCallback((event: GestureInputEvent) => {
    // Hydrate the double-click chain only where it is consumed (a release
    // from `pressed`): the overlay can be re-created between the two clicks
    // of a double-click (session remounts), while the native dblclick this
    // arbiter replaced was remount-resilient (CTR-029).
    const previous = gestureRef.current.phase === 'pressed' && event.type === 'release'
      ? { ...gestureRef.current, lastClickAt: readClickChainAt() }
      : gestureRef.current
    const result = reduceGesture(previous, event)
    gestureRef.current = result.state
    setGesture(result.state)
    switch (result.verdict.kind) {
      case 'click':
        storeClickChainAt(result.state.lastClickAt)
        if (result.verdict.doubleClick) noteInteraction()
        break
      case 'petting-start':
      case 'drag-start':
      case 'drop':
      case 'petting-release':
        // Anything between two clicks breaks a double-click chain (native
        // dblclick semantics): petting holds, drags, and drops clear it.
        storeClickChainAt(null)
        break
      default:
        break
    }
    switch (result.verdict.kind) {
      case 'click':
        // CTR-005/021: double-click opens only the settings menu; the single
        // click of the sequence may already have shown at most one reaction.
        if (result.verdict.doubleClick) {
          suppressClickRef.current = false
          onOpenMenu()
          break
        }
        playful.play()
        onPetClick()
        noteInteraction()
        speech.speakForClick(state)
        break
      case 'petting-start':
        suppressClickRef.current = true
        playful.playPetting()
        noteInteraction()
        break
      case 'petting-release':
        playful.releasePetting()
        noteInteraction()
        break
      case 'drag-start':
        // CTR-032: the lift holds a surprised/curious variant for the drag;
        // the settle on drop replaces it.
        playful.playDragLift()
        noteInteraction()
        break
      case 'drop':
        playful.playSettle()
        noteInteraction()
        break
      default:
        break
    }
  }, [noteInteraction, onOpenMenu, onPetClick, playful, speech, state])

  // Petting hold promotion (CTR-029/030): a stationary hold inside the band
  // becomes petting; the click path stays suppressed for that press.
  useEffect(() => {
    if (gesture.phase !== 'pressed' || gesture.pressedAt === null) return
    const remaining = Math.max(0, GESTURE_PETTING_HOLD_MS - (Date.now() - gesture.pressedAt))
    const handle = globalThis.setTimeout(() => {
      const result = promoteToPetting(gestureRef.current)
      if (result.verdict.kind !== 'petting-start') return
      gestureRef.current = result.state
      setGesture(result.state)
      suppressClickRef.current = true
      playful.playPetting()
      noteInteraction()
    }, remaining)
    return () => globalThis.clearTimeout(handle)
  }, [gesture.phase, gesture.pressedAt, noteInteraction, playful])

  // V7 CTR-035: welcome back after a long absence — one line, no guilt, the
  // greeting slot is taken for the day. lastSeenAt refreshes once per mount
  // (the absence boundary is a remount; absent field = no welcome, and a
  // fired welcome never repeats within its local day). No event-driven
  // preference writes exist: every other write stays a user action.
  const welcomedRef = useRef(false)
  useEffect(() => {
    if (welcomedRef.current) return
    welcomedRef.current = true
    const now = Date.now()
    const todayKey = localDayKey(new Date())
    if (shouldWelcomeBack(rituals.lastSeenAt, now, todayKey, markersRef.current)) {
      speech.speakAfterQuiet('welcome')
      ritualBridgeRef.current.onRitual('welcome')
    }
    // Freshness-gated touch: write only when the stored stamp is absent or
    // stale (an adopt-restored resident remounts without writing again).
    const stored = rituals.lastSeenAt
    if (stored === undefined || now - stored > LASTSEEN_TOUCH_STALE_MS) {
      ritualBridgeRef.current.onTouchLastSeen()
    }
  }, [rituals.lastSeenAt, speech])

  // V7 CTR-036: the late-night ritual — at most once per ritual day, only
  // while the user is actually around, gentle copy only. The firedRef keeps
  // the marker-write race from double-attempting before the re-render lands.
  const lateNightFiredRef = useRef(false)
  useEffect(() => {
    if (daypart !== 'late-night' || lateNightFiredRef.current) return
    if (!isLateNightRitualDue(markersRef.current, lateNightRitualDayKey(new Date()))) return
    const cadence = speech.readCadence()
    const recent = cadence.lastInputAt !== null
      && cadence.now - cadence.lastInputAt <= LATE_NIGHT_INPUT_RECENCY_MS
    if (!recent) return
    lateNightFiredRef.current = true
    speech.speakAfterQuiet('ritual')
    ritualBridgeRef.current.onRitual('late-night')
  }, [daypart, speech])

  const stateKey: VehiclePetLocaleKey = sessionView.terminal !== null
    ? `state.${sessionView.terminal.status}`
    : `state.${sessionView.live}`

  const pet = petDefinition(petId)
  const hitStyle = pet.recipe === 'engine-scene'
    ? visibleHitStyle(snapshot, surfaceSize, levelId)
    : (petHitStyle(pet, variant, surfaceSize) ?? visibleHitStyle(snapshot, surfaceSize, levelId))
  const grade = petGrade(petId, levelId, engineLocale)
  const alpha = pet.recipe === 'engine-scene' ? visibleHitStyle(snapshot, surfaceSize, levelId, false) : null
  const scale = surfaceSize <= 112 ? .72 : .8
  const gradeHeight = surfaceSize <= 112 ? 22 : 26
  const captionTop = alpha && typeof alpha.top === 'number' && typeof alpha.height === 'number'
    ? Math.min(surfaceSize - gradeHeight, (alpha.top + alpha.height) * scale + 8) : undefined

  return (
    <>
      <span className="vpo-characterArea" ref={characterAreaRef}
        data-gesture={playful.reaction?.definition.anim}
        data-vehicle-pet-reaction-id={playful.reaction?.definition.id}
        data-vehicle-pet-petting={gesture.petting ? 'true' : 'false'}
        data-gaze-active={undefined}
        data-motion={playful.reduced ? 'reduced' : 'allowed'}>
      <span className="vpo-scene vpo-characterScene" aria-hidden="true">
        <CharacterVisual pet={pet} variant={variant}
          levelId={levelId} locale={engineLocale} interactionCount={petInteractionCount} />
      </span>
      {playful.reaction ? <ReactionDecoration kind={playful.reaction.definition.decoration} /> : null}
      <button
        type="button"
        className="vpo-surface vpo-petHit"
        style={hitStyle}
        aria-label={t('overlay.label', { state: t(stateKey) })}
        aria-description={`${engineLocale==='en'?'Double-click or Shift+Enter for settings. Hold to pet. ':'双击或 Shift+Enter 打开设置。长按可以摸摸。'}${petDisplayName(petId, engineLocale)}${grade === null ? '' : ` · ${grade.grade} ${grade.description}`}`}
        data-vehicle-pet-pet="true"
        data-vehicle-pet-character={petId}
        data-vehicle-pet-expression={variant}
        data-vehicle-pet-pack={snapshot.activePack?.manifest.packId}
        data-vehicle-pet-level={levelId}
        data-live={sessionView.terminal !== null ? 'terminal' : sessionView.live}
        data-terminal={sessionView.terminal?.status}
        onKeyDown={event => {
          if ((event.shiftKey && event.key==='Enter') || event.key==='ContextMenu') {
            event.preventDefault(); onOpenMenu(); return
          }
          onKeyDown(event)
        }}
        onDoubleClick={event => {
          // Native double-click parity with the arbiter's synthetic window;
          // both paths converge on the same idempotent menu open (CTR-005).
          event.preventDefault()
          if (dragHandlers.consumeSuppressedClick()) return
          if (suppressClickRef.current) { suppressClickRef.current = false; return }
          if (suppressDblClickRef.current) { suppressDblClickRef.current = false; return }
          onOpenMenu()
        }}
        onClick={event => {
          // Suppressed native clicks: after a real drag the trailing click is
          // consumed; after petting the whole click path stays suppressed.
          if (dragHandlers.consumeSuppressedClick()) return
          if (suppressClickRef.current) { suppressClickRef.current = false; return }
          if (event.detail > 0) return // pointer clicks are arbiter-handled
          // Keyboard activation (Enter/Space, event.detail === 0): single
          // click reaction, CTR-021 keyboard parity.
          playful.play()
          onPetClick()
          speech.speakForClick(state)
        }}
        onPointerDown={event => {
          dragHandlers.onPointerDown(event)
          handleGesture({ type: 'press', at: Date.now(), point: { x: event.clientX, y: event.clientY } })
        }}
        onPointerMove={event => {
          dragHandlers.onPointerMove(event)
          handleGesture({ type: 'move', at: Date.now(), point: { x: event.clientX, y: event.clientY } })
        }}
        onPointerUp={event => {
          dragHandlers.onPointerUp(event)
          handleGesture({ type: 'release', at: Date.now(), point: { x: event.clientX, y: event.clientY } })
        }}
        onPointerCancel={event => {
          dragHandlers.onPointerCancel(event)
          handleGesture({ type: 'cancel', at: Date.now() })
        }}
      />
      </span>
      <div className={captionTop === undefined ? undefined : 'vpo-captionGroup'} style={captionTop === undefined ? { display: 'contents' } : { top: captionTop }}>
      {grade === null ? null : <span className="vpo-grade" data-vehicle-pet-grade={grade.grade}>
        <span className="vpo-gradeBrand">Pony.ai · {grade.grade}</span>
        <span>{grade.description}</span>
      </span>}
      <ActiveSessionFooter sessions={activeSessions} locale={engineLocale} />
      </div>
      {sessionView.live === 'needs-input' ? <span className="vpo-badge" aria-hidden="true" /> : null}
      <VehiclePetBubble bubble={speech.bubble} placement={bubblePlacement} />
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
  includeTolerance = true,
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
  const tolerance = includeTolerance ? Math.min(OVERLAY_GEOMETRY.hitboxTolerancePx, side / 8) : 0
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
