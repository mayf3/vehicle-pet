import { act, fireEvent, render, type RenderResult } from '@testing-library/react'
import { useSyncExternalStore, type ComponentType } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { IndexedDbPetStorage, MemoryPetStorageAdapter } from '../../../src/engine'
import { apply } from '../../../src/dsh/client'
import { zh, type VehiclePetLocaleKey } from '../../../src/dsh/client/locales'
import type {
  ConversationLike,
  SessionListLike,
  VehiclePetSessionsSource,
} from '../../../src/dsh/client/session-state-adapter'
import type { VehiclePetOverlayProps } from '../../../src/dsh/client/VehiclePetOverlay'
import type { VehiclePetSessionView } from '../../../src/dsh/client/types'

class Observable<T> {
  #snapshot: T
  readonly listeners = new Set<() => void>()

  constructor(snapshot: T) {
    this.#snapshot = snapshot
  }

  getSnapshot = (): T => this.#snapshot

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  update(snapshot: T): void {
    this.#snapshot = snapshot
    for (const listener of this.listeners) listener()
  }
}

interface RegisteredEntry {
  readonly component: ComponentType<VehiclePetOverlayProps>
  readonly injected: {
    hooks: {
      sessionView: Observable<VehiclePetSessionView>
      locale: Observable<{ active: string; revision: number }>
    }
    sessionBinding?: VehiclePetOverlayProps['sessionBinding']
  }
}

class GenerationFiber {
  readonly disposers: Array<() => void> = []
  entry: RegisteredEntry | undefined
  slotRegistrations = 0
  dictionaries = 0

  constructor(
    readonly sessions: VehiclePetSessionsSource,
    readonly locale: Observable<{ active: string; revision: number }>,
  ) {}

  context(): unknown {
    return {
      sessions: this.sessions,
      locale: Object.assign(this.locale, {
        register: () => {
          this.dictionaries += 1
          return () => { this.dictionaries -= 1 }
        },
      }),
      effect: (register: () => (() => void) | void) => {
        const dispose = register()
        if (dispose !== undefined) this.disposers.push(dispose)
      },
      slots: {
        register: (
          descriptor: { inject: () => RegisteredEntry['injected'] },
          component: ComponentType<VehiclePetOverlayProps>,
        ) => {
          this.slotRegistrations += 1
          this.entry = { component, injected: descriptor.inject() }
          return () => {
            this.slotRegistrations -= 1
            this.entry = undefined
          }
        },
        inject: (_name: string, register: () => (() => void)) => {
          this.disposers.push(register())
        },
      },
    }
  }

  stop(): void {
    for (const dispose of this.disposers.reverse()) dispose()
    this.disposers.length = 0
  }
}

function translate(key: VehiclePetLocaleKey, params?: Record<string, string>): string {
  let text: string = zh[key]
  for (const [name, value] of Object.entries(params ?? {})) text = text.replace(`{${name}}`, value)
  return text
}

function mountEntry(fiber: GenerationFiber, sessionsList: Observable<SessionListLike>): RenderResult {
  const entry = fiber.entry
  if (entry === undefined) throw new Error('vehicle-pet slot entry was not registered')
  const Component = entry.component
  const props = {
    useSessionView: (selector: (value: unknown) => unknown) => selector(useSyncExternalStore(
      entry.injected.hooks.sessionView.subscribe,
      entry.injected.hooks.sessionView.getSnapshot,
    )),
    useLocale: (selector: (value: { active: string; revision: number }) => unknown) => selector(useSyncExternalStore(
      entry.injected.hooks.locale.subscribe,
      entry.injected.hooks.locale.getSnapshot,
    )),
    useSessions: (selector: (value: SessionListLike) => unknown) => selector(useSyncExternalStore(
      sessionsList.subscribe,
      sessionsList.getSnapshot,
    )),
    sessionBinding: entry.injected.sessionBinding,
    t: translate,
  } as unknown as VehiclePetOverlayProps
  return render(<Component {...props} />)
}

function closedConversation(turns: Array<{ turn: number; seq: number }>): ConversationLike {
  return {
    running: false,
    pending: [],
    openState: 'open',
    lastAgentError: null,
    chat: {
      timeline: {
        turns: new Map(turns.map(({ turn, seq }) => [turn, {
          status: 'closed',
          end: { seq, data: { turn, reason: { kind: 'completed' } } },
        }])),
      },
    },
  }
}

interface ResourceInventory {
  shellOverlayRegistrations: number
  overlayDom: number
  dialogDom: number
  injectedStyles: number
  sessionListSubscriptions: number
  currentSessionSubscriptions: number
  terminalEventSubscriptions: number
  storageListeners: number
  resizeListeners: number
  mediaListeners: number
  keyboardDocumentListeners: number
  pointerCaptureListeners: number
  timers: number
  observers: number
  indexedDbConnections: number
  dictionaries: number
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  document.querySelectorAll('[data-plugin="vehicle-pet"]').forEach(node => node.remove())
})

describe('client HMR generation and complete resource disposal inventory', () => {
  it('replaces generation 1 with generation 2, never duplicates, and returns to baseline', async () => {
    vi.useFakeTimers()
    let activeObservers = 0
    class TrackingResizeObserver {
      #active = true
      constructor(_callback: ResizeObserverCallback) { activeObservers += 1 }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {
        if (!this.#active) return
        this.#active = false
        activeObservers -= 1
      }
    }
    vi.stubGlobal('ResizeObserver', TrackingResizeObserver)

    const windowListeners = new Map<string, Set<EventListenerOrEventListenerObject>>()
    const originalAdd = window.addEventListener.bind(window)
    const originalRemove = window.removeEventListener.bind(window)
    vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
      const listeners = windowListeners.get(type) ?? new Set<EventListenerOrEventListenerObject>()
      listeners.add(listener)
      windowListeners.set(type, listeners)
      originalAdd(type, listener, options)
    })
    vi.spyOn(window, 'removeEventListener').mockImplementation((type, listener, options) => {
      windowListeners.get(type)?.delete(listener)
      originalRemove(type, listener, options)
    })
    const documentListeners = new Map<string, Set<EventListenerOrEventListenerObject>>()
    const originalDocumentAdd = document.addEventListener.bind(document)
    const originalDocumentRemove = document.removeEventListener.bind(document)
    vi.spyOn(document, 'addEventListener').mockImplementation((type, listener, options) => {
      const listeners = documentListeners.get(type) ?? new Set<EventListenerOrEventListenerObject>()
      listeners.add(listener)
      documentListeners.set(type, listeners)
      originalDocumentAdd(type, listener, options)
    })
    vi.spyOn(document, 'removeEventListener').mockImplementation((type, listener, options) => {
      documentListeners.get(type)?.delete(listener)
      originalDocumentRemove(type, listener, options)
    })

    let indexedDbConnections = 0
    vi.spyOn(IndexedDbPetStorage, 'create').mockImplementation(async () => {
      indexedDbConnections += 1
      const storage = new MemoryPetStorageAdapter()
      return Object.assign(storage, {
        close: vi.fn(() => { indexedDbConnections -= 1 }),
      }) as unknown as IndexedDbPetStorage
    })

    const list = new Observable<SessionListLike>({
      phase: 'ready',
      current: 's1',
      byId: { s1: { pendingInteraction: undefined } },
    })
    const session = new Observable<ConversationLike>(closedConversation([{ turn: 1, seq: 10 }]))
    const sessions: VehiclePetSessionsSource = {
      list,
      binding: id => id === 's1' ? { session } : undefined,
    }
    const locale = new Observable({ active: 'zh', revision: 1 })

    const inventory = (fiber?: GenerationFiber): ResourceInventory => ({
      shellOverlayRegistrations: fiber?.slotRegistrations ?? 0,
      overlayDom: document.querySelectorAll('[data-vehicle-pet]').length,
      dialogDom: document.querySelectorAll('[data-vehicle-pet-dialog]').length,
      injectedStyles: document.querySelectorAll('style[data-plugin-css="vehicle-pet/overlay-styles"]').length,
      sessionListSubscriptions: list.listeners.size,
      currentSessionSubscriptions: session.listeners.size,
      terminalEventSubscriptions: session.listeners.size,
      storageListeners: windowListeners.get('storage')?.size ?? 0,
      resizeListeners: windowListeners.get('resize')?.size ?? 0,
      mediaListeners: windowListeners.get('change')?.size ?? 0,
      // ReactDOM installs one process-wide selectionchange listener for its
      // shared root; it is host-owned, not a vehicle-pet generation resource.
      keyboardDocumentListeners: [...documentListeners.entries()]
        .filter(([type]) => type !== 'selectionchange')
        .reduce((total, [, listeners]) => total + listeners.size, 0),
      pointerCaptureListeners: document.querySelector('[data-vehicle-pet-pet]') === null ? 0 : 4,
      timers: vi.getTimerCount(),
      observers: activeObservers,
      indexedDbConnections,
      dictionaries: fiber?.dictionaries ?? 0,
    })

    const RESOURCE_BASELINE = inventory()

    const generation1 = new GenerationFiber(sessions, locale)
    apply(generation1.context() as Parameters<typeof apply>[0])
    const view1 = mountEntry(generation1, list)
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    fireEvent.doubleClick(document.querySelector('[data-vehicle-pet-pet]') as HTMLElement)
    fireEvent.click(document.querySelector('[data-vehicle-pet-open-journey]') as HTMLElement)
    // Let zero-duration React scheduling settle; only genuinely live plugin
    // timers belong in the ACTIVE inventory.
    act(() => vi.advanceTimersByTime(0))
    const RESOURCE_ACTIVE = inventory(generation1)

    expect(RESOURCE_ACTIVE).toMatchObject({
      shellOverlayRegistrations: 1,
      overlayDom: 1,
      dialogDom: 1,
      injectedStyles: 1,
      sessionListSubscriptions: 5,
      currentSessionSubscriptions: 1,
      storageListeners: 1,
      resizeListeners: 1,
      // React's two host listeners, the dialog's lifecycle-owned keydown and
      // focusin containment listeners, the speech input-recency pair
      // (payload-ignored keydown+pointerdown, V3 CTR-OVERLAY-019(3)), and the
      // open menu's outside-press pointerdown and V6 visibilitychange — all disposed with the mount.
      keyboardDocumentListeners: 9,
      pointerCaptureListeners: 4,
      // Root viewport + open Panel measurement; both must dispose at HMR.
      observers: 2,
      indexedDbConnections: 1,
      dictionaries: 1,
    })

    // Explicit client-watcher/HMR replacement boundary: generation 1 first
    // disposes its React subtree and Cordis fiber, then generation 2 activates.
    view1.unmount()
    generation1.stop()
    expect(generation1.slotRegistrations).toBe(0)
    expect(session.listeners.size).toBe(0)
    expect(indexedDbConnections).toBe(0)

    const generation2 = new GenerationFiber(sessions, locale)
    apply(generation2.context() as Parameters<typeof apply>[0])
    const view2 = mountEntry(generation2, list)
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(generation1.slotRegistrations + generation2.slotRegistrations).toBe(1)
    expect(document.querySelectorAll('[data-vehicle-pet]').length).toBe(1)
    expect(document.querySelector('[data-terminal]')).toBeNull()

    // The historical terminal is seeded, not replayed. A genuinely new edge
    // emits once on generation 2; generation 1 has no subscription to call.
    act(() => session.update({ ...closedConversation([{ turn: 1, seq: 10 }]), running: true }))
    expect(document.querySelector('[data-vehicle-pet-pet]')?.getAttribute('data-live')).toBe('running')
    act(() => session.update(closedConversation([{ turn: 1, seq: 10 }, { turn: 2, seq: 20 }])))
    expect(document.querySelector('[data-terminal]')?.getAttribute('data-terminal')).toBe('completed')
    expect(session.listeners.size).toBe(1)

    view2.unmount()
    generation2.stop()
    const RESOURCE_DISPOSED = inventory()
    expect(RESOURCE_DISPOSED).toEqual(RESOURCE_BASELINE)
  })
})
