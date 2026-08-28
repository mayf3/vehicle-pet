/**
 * PetEngineProvider: the Engine React adapter.
 * Wires a PetEngine to React, subscribes the registered Progress Source, owns
 * greeting/ceremony presentation state, and exposes the local in-process
 * HostActivityEventV1 injection interface (a plain function boundary — not a
 * network, model, or Host transport capability).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  PetEngine,
  computeLocalDay,
  type CeremonyPlan,
  type EngineSnapshot,
  type Locale,
  type LocalizedTextV1,
  type PackBundleInput,
  type ProgressSource,
  type PetStorageAdapter,
  type UpgradeReceipt,
  type HostFeedbackPresentation,
} from '../engine'
import { engineCopy, stableVariantIndex } from './copy'
import { EngineStyles } from './styles'

export interface PetEngineProviderProps {
  bundles: PackBundleInput[]
  defaultPackId: string
  storage: PetStorageAdapter
  source: ProgressSource
  locale?: Locale
  reducedMotion?: boolean
  /** Standalone hosts may mirror locale to <html>; embedded hosts own it. */
  syncDocumentLanguage?: boolean
  now?: () => Date
  children: ReactNode
}

export interface GreetingState {
  localDay: string
  variantIndex: number
}

export interface CeremonyState {
  plan: CeremonyPlan
  receipts: UpgradeReceipt[]
}

export interface PetEngineContextValue {
  snapshot: EngineSnapshot
  greeting: GreetingState | null
  dismissGreeting: () => void
  ceremony: CeremonyState | null
  skipCeremony: () => void
  hostFeedback: HostFeedbackPresentation | null
  dispatchHostActivity: (candidate: unknown) => void
  clearHostFeedback: () => void
  switchPack: (packId: string) => void
  setLocale: (locale: Locale) => void
  setReducedMotion: (reduced: boolean) => void
  copy: ReturnType<typeof engineCopy>
  resolveText: (text: LocalizedTextV1) => string
  assetUrl: (assetId: string) => string | undefined
}

const PetEngineContext = createContext<PetEngineContextValue | null>(null)

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function PetEngineProvider(props: PetEngineProviderProps) {
  const { bundles, defaultPackId, storage, source, children } = props

  const engine = useMemo(
    () =>
      new PetEngine({
        bundles,
        defaultPackId,
        storage,
        locale: props.locale,
        reducedMotion: props.reducedMotion ?? prefersReducedMotion(),
        now: props.now,
      }),
    // The engine instance is created once per provider mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const subscribe = useCallback((listener: () => void) => engine.subscribe(listener), [engine])
  const snapshot = useSyncExternalStore(subscribe, () => engine.getSnapshot())
  const originalDocumentLangRef = useRef<string | null>(null)

  // The provider owns one Engine for its whole mount, but locale and motion are
  // live host inputs. Synchronize them into that same Engine instead of relying
  // on constructor-only values (or remounting and losing progress).
  useLayoutEffect(() => {
    if (props.locale !== undefined) engine.setLocale(props.locale)
  }, [engine, props.locale])

  useEffect(() => {
    if (props.reducedMotion !== undefined) engine.setReducedMotion(props.reducedMotion)
  }, [engine, props.reducedMotion])

  useEffect(() => {
    if (props.syncDocumentLanguage === false || typeof document === 'undefined') return
    originalDocumentLangRef.current = document.documentElement.lang
    return () => {
      if (originalDocumentLangRef.current !== null) document.documentElement.lang = originalDocumentLangRef.current
    }
  }, [props.syncDocumentLanguage])

  useEffect(() => {
    if (props.syncDocumentLanguage !== false && typeof document !== 'undefined') {
      document.documentElement.lang = snapshot.locale
    }
  }, [props.syncDocumentLanguage, snapshot.locale])

  const [greeting, setGreeting] = useState<GreetingState | null>(null)
  const [ceremony, setCeremony] = useState<CeremonyState | null>(null)
  const claimingRef = useRef(false)
  // This is an attempted presentation key, not a day-only UI cache. The
  // durable storage claim remains the cross-mount/cross-tab source of truth.
  const greetedKeyRef = useRef<string | null>(null)

  // Engine bootstrap + Progress Source subscription.
  useEffect(() => {
    void engine.initialize()
    const unsubscribe = source.subscribe((candidate) => engine.ingestSnapshot(candidate))
    return unsubscribe
  }, [engine, source])

  // Consume-before-play: claim pending receipts, then present one merged ceremony.
  useEffect(() => {
    if (snapshot.pendingReceipts.length === 0 || claimingRef.current) return
    claimingRef.current = true
    void engine
      .claimPendingCeremony()
      .then((claimed) => {
        if (claimed !== null) {
          setCeremony({ plan: claimed.plan, receipts: claimed.receipts })
        } else {
          engine.completeCeremony()
        }
      })
      .finally(() => {
        claimingRef.current = false
      })
  }, [engine, snapshot.pendingReceipts.length])

  const skipCeremony = useCallback(() => {
    setCeremony(null)
    engine.completeCeremony()
  }, [engine])

  // Daily greeting: re-evaluated on mount, every visibility regain, and every
  // interaction. Midnight itself never forces UI; the next allowed event sees
  // the new (sourceId, subjectId, localDay) key and atomically claims it.
  const tryGreeting = useCallback(() => {
    const viewModel = snapshot.viewModel
    if (!snapshot.initialized || viewModel === null) return
    const localDay = computeLocalDay(props.now ? props.now() : new Date())
    const greetingKey = `${viewModel.sourceId}|${viewModel.subjectId}|${localDay}`
    if (greetedKeyRef.current === greetingKey) return
    greetedKeyRef.current = greetingKey
    void engine.claimDailyGreeting().then((claimed) => {
      // Ignore a claim that completed after the active subject/day changed.
      if (claimed !== null && greetedKeyRef.current === greetingKey) {
        setGreeting({
          localDay: claimed.localDay,
          variantIndex: stableVariantIndex(greetingKey, 3),
        })
      }
    })
  }, [engine, props.now, snapshot.initialized, snapshot.viewModel])

  const greetingSubjectKey = snapshot.viewModel === null
    ? null
    : `${snapshot.viewModel.sourceId}|${snapshot.viewModel.subjectId}`

  useEffect(() => {
    // Clear only when the source/subject identity changes. Engine notifications
    // rebuild the view model object and must not erase an already won greeting.
    setGreeting(null)
  }, [greetingSubjectKey])

  useEffect(() => {
    tryGreeting()
  }, [tryGreeting])

  useEffect(() => {
    const onVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') tryGreeting()
    }
    const onPointer = () => tryGreeting()
    document.addEventListener('visibilitychange', onVisibility)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [tryGreeting])

  const dismissGreeting = useCallback(() => setGreeting(null), [])

  const dispatchHostActivity = useCallback((candidate: unknown) => engine.dispatchHostActivity(candidate), [engine])
  const clearHostFeedback = useCallback(() => engine.clearHostFeedback(), [engine])

  const switchPack = useCallback(
    (packId: string) => {
      void engine.setActivePack(packId)
    },
    [engine],
  )

  const setLocale = useCallback((locale: Locale) => engine.setLocale(locale), [engine])
  const setReducedMotion = useCallback((reduced: boolean) => engine.setReducedMotion(reduced), [engine])

  const resolveText = useCallback(
    (text: LocalizedTextV1) => (snapshot.locale === 'en' && text.en !== undefined ? text.en : text['zh-CN']),
    [snapshot.locale],
  )

  const assetUrl = useCallback(
    (assetId: string) => {
      const pack = snapshot.activePack
      if (pack === null) return undefined
      const asset = pack.manifest.assets.find((a) => a.assetId === assetId)
      if (asset === undefined) return undefined
      return pack.resolveAssetUrl(asset.path)
    },
    [snapshot.activePack],
  )

  const value = useMemo<PetEngineContextValue>(
    () => ({
      snapshot,
      greeting,
      dismissGreeting,
      ceremony,
      skipCeremony,
      hostFeedback: snapshot.hostFeedback,
      dispatchHostActivity,
      clearHostFeedback,
      switchPack,
      setLocale,
      setReducedMotion,
      copy: engineCopy(snapshot.locale),
      resolveText,
      assetUrl,
    }),
    [
      snapshot,
      greeting,
      dismissGreeting,
      ceremony,
      skipCeremony,
      dispatchHostActivity,
      clearHostFeedback,
      switchPack,
      setLocale,
      setReducedMotion,
      resolveText,
      assetUrl,
    ],
  )

  return (
    <PetEngineContext.Provider value={value}>
      <EngineStyles />
      {children}
    </PetEngineContext.Provider>
  )
}

export function usePetEngine(): PetEngineContextValue {
  const value = useContext(PetEngineContext)
  if (value === null) {
    throw new Error('usePetEngine must be used inside <PetEngineProvider>')
  }
  return value
}
