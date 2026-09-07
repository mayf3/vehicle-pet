/**
 * Overlay DOM behavior (DSH_PET_OVERLAY_ADAPTER_V2 CTR-OVERLAY-003..007,
 * 010, 011, 014, 015; ACC-OVERLAY-004/005/008/011/012/017/019/020): three-state
 * machine and sizes, exact five-item compact-panel inventory, the product-Pack
 * only DSH surface (no seedling option), static five-state expression layers,
 * dialog accessibility and focus restore, onboarding suppression with exact
 * same-mount restoration, session reactions that never touch progressPoints,
 * keyboard movement, and multi-tab preference adoption.
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VehiclePetOverlay } from '../../../src/dsh/client/VehiclePetOverlay'
import type { VehiclePetOverlayProps } from '../../../src/dsh/client/VehiclePetOverlay'
import { en, zh, type VehiclePetLocaleKey } from '../../../src/dsh/client/locales'
import { OVERLAY_PREFERENCES_KEY } from '../../../src/dsh/client/preferences'
import type { VehiclePetSessionView } from '../../../src/dsh/client/types'

const IDLE_VIEW: VehiclePetSessionView = Object.freeze({ live: 'idle', terminal: null })
const SESSIONS_ON: SessionListFixture = { phase: 'ready', current: 's1', byId: { s1: { blank: false } } }
const SESSIONS_ONBOARDING: SessionListFixture = { phase: 'ready', byId: {} }

function t(key: VehiclePetLocaleKey, params?: Record<string, string>): string {
  let text: string = zh[key]
  for (const [name, value] of Object.entries(params ?? {})) {
    text = text.replace(`{${name}}`, value)
  }
  return text
}

interface SessionListFixture {
  phase: string
  current?: string
  byId: Record<string, { blank?: boolean; pendingInteraction?: string }>
}

interface Source {
  view: VehiclePetSessionView
  sessions: SessionListFixture
  locale: string
}

function stubProps(source: Source): VehiclePetOverlayProps {
  return {
    useSessionView: selector => selector(source.view),
    useLocale: selector => selector({ active: source.locale, revision: 1 }),
    useSessions: selector => selector(source.sessions as never),
    t: (key: VehiclePetLocaleKey, params?: Record<string, string>) => {
      let text = (source.locale === 'en' ? en : zh)[key]
      for (const [name, value] of Object.entries(params ?? {})) text = text.replace(`{${name}}`, value)
      return text
    },
  } as VehiclePetOverlayProps
}

async function renderOverlay(source: Source) {
  const view = render(<VehiclePetOverlay {...stubProps(source)} />)
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: t('overlay.label', { state: t('state.idle') }) })).not.toBeNull()
  })
  return view
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
})

describe('VehiclePetOverlay states', () => {
  it('renders the default VISIBLE pet at 112px and toggles the 264px panel', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    await renderOverlay(source)
    const pet = screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) })
    expect(pet).toHaveAttribute('data-vehicle-pet-pet', 'true')
    expect(pet.querySelector('button')).toBeNull()
    const shell = pet.closest('.vpo-shell') as HTMLElement
    expect(shell.style.width).toBe('112px')
    expect(shell.style.height).toBe('112px')

    fireEvent.click(pet)
    const panel = screen.getByRole('group', { name: t('panel.title') })
    expect(panel).toHaveAttribute('data-vehicle-pet-panel', 'true')
    expect(panel.style.width).toBe('264px')

    fireEvent.click(pet)
    expect(screen.queryByRole('group', { name: t('panel.title') })).toBeNull()
  })

  it('contains exactly the five authorized compact items and no dev surfaces', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    await renderOverlay(source)
    fireEvent.click(screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) }))
    const panel = screen.getByRole('group', { name: t('panel.title') })

    const authorized = [
      panel.querySelector('[data-vehicle-pet-stage]'),
      panel.querySelector('[data-vehicle-pet-progress]'),
      panel.querySelector('[data-vehicle-pet-next-threshold]'),
      panel.querySelector('[data-vehicle-pet-open-journey]'),
      panel.querySelector('[data-vehicle-pet-more]'),
      panel.querySelector('[data-vehicle-pet-reduced-motion]'),
      panel.querySelector('[data-vehicle-pet-collapse]'),
    ]
    // 1 stage, 2 progress+next, 3 view journey, 4 "More" disclosure holding
    // the reduced-motion control, 5 collapse (close is chrome, not content).
    expect(authorized.every(node => node !== null)).toBe(true)

    // V2 removals: no pack name row, no keepsake row, no Pack switch.
    for (const removed of ['[data-vehicle-pet-pack-name]', '[data-vehicle-pet-keepsake]', '[data-vehicle-pet-pack-switch]', '[data-vehicle-pet-pack-option]']) {
      expect(panel.querySelector(removed)).toBeNull()
    }
    expect(panel.querySelectorAll('button').length).toBe(
      3 /* reduced-motion options inside More */ + 1 /* journey */ + 1 /* collapse */ + 1 /* close chrome */,
    )

    const panelText = panel.textContent ?? ''
    for (const forbidden of ['MockProgressSource', '精确输入', '故障', 'diagnostics', '开发控制台', '+100', '种子伙伴', 'seedling']) {
      expect(panelText).not.toContain(forbidden)
    }
    expect(document.querySelector('[data-prototype-controls]')).toBeNull()
  })

  it('offers no Pack switch anywhere: autonomous-fleet is the only product Pack (seedling stays internal)', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    await renderOverlay(source)
    const pet = screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) })
    await waitFor(() => {
      expect(pet.getAttribute('data-vehicle-pet-pack')).toBe('autonomous-fleet')
    })
    fireEvent.click(pet)
    // Panel and whole overlay surface expose no Pack option and no seedling copy.
    expect(document.querySelector('[data-vehicle-pet-pack-option]')).toBeNull()
    expect(document.body.textContent).not.toContain('种子伙伴')
    fireEvent.click(screen.getByRole('button', { name: t('panel.viewJourney') }))
    await screen.findByRole('dialog', { name: t('dialog.title') })
    expect(document.querySelector('[data-vehicle-pet-pack-option]')).toBeNull()
  })

  it('Escape closes the panel and returns focus to the pet', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    await renderOverlay(source)
    const pet = screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) })
    fireEvent.click(pet)
    expect(screen.queryByRole('group', { name: t('panel.title') })).not.toBeNull()
    fireEvent.keyDown(pet, { key: 'Escape' })
    expect(screen.queryByRole('group', { name: t('panel.title') })).toBeNull()
    expect(document.activeElement).toBe(pet)
  })

  it('collapses to the 36px launcher and restores on activation', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    await renderOverlay(source)
    const pet = screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) })
    fireEvent.click(pet)
    fireEvent.click(screen.getByRole('button', { name: t('panel.collapse') }))

    const launcher = await screen.findByRole('button', { name: t('launcher.restore') })
    expect(launcher).toHaveAttribute('data-vehicle-pet-launcher', 'true')
    const shell = launcher.closest('.vpo-shell') as HTMLElement
    expect(shell.style.width).toBe('36px')
    expect(shell.style.height).toBe('36px')
    expect(JSON.parse(window.localStorage.getItem(OVERLAY_PREFERENCES_KEY) ?? '{}').collapsed).toBe(true)

    fireEvent.click(launcher)
    await screen.findByRole('button', { name: t('overlay.label', { state: t('state.idle') }) })
    expect(JSON.parse(window.localStorage.getItem(OVERLAY_PREFERENCES_KEY) ?? '{}').collapsed).toBe(false)
  })
})

describe('VehiclePetOverlay session reactions', () => {
  it('shows the working state while running and the needs-input badge', async () => {
    const source: Source = { view: { live: 'running', terminal: null }, sessions: SESSIONS_ON, locale: 'zh' }
    const view = render(<VehiclePetOverlay {...stubProps(source)} />)
    const pet = await view.findByRole('button', { name: t('overlay.label', { state: t('state.running') }) })
    expect(pet).toHaveAttribute('data-live', 'running')

    source.view = { live: 'needs-input', terminal: null }
    view.rerender(<VehiclePetOverlay {...stubProps(source)} />)
    const updated = await view.findByRole('button', { name: t('overlay.label', { state: t('state.needs-input') }) })
    expect(updated).toHaveAttribute('data-live', 'needs-input')
    expect(updated.querySelector('.vpo-badge')).not.toBeNull()
    view.unmount()
  })

  it('presents a short terminal feedback without changing progressPoints', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)

    view.rerender(<VehiclePetOverlay {...stubProps({
      ...source,
      view: { live: 'idle', terminal: { identity: 's1#3#42', status: 'completed' } },
    })} />)
    const feedback = await screen.findByText(/dsh-session/, { exact: false })
    expect(feedbackStatus(feedback)).toBe('completed')

    // The engine's points stay at the initial placeholder value (0): session
    // reactions never feed progression (CTR-OVERLAY-007/013).
    const pet = screen.getByRole('button', { name: t('overlay.label', { state: t('state.completed') }) })
    fireEvent.click(pet)
    const progress = await screen.findByText(/0/, { selector: '[data-vehicle-pet-progress]' })
    expect(progress.textContent).toContain('0')
    view.unmount()
  })

  it('shows the static expression layer for every session state without adding interaction targets', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    const exprState = () => document.querySelector('[data-vehicle-pet-expression]')?.getAttribute('data-vehicle-pet-expression')
    await waitFor(() => {
      expect(exprState()).toBe('idle')
    })
    const expr = document.querySelector('[data-vehicle-pet-expression]') as HTMLElement
    expect(expr).toHaveAttribute('aria-hidden', 'true')
    expect(expr.querySelectorAll('button, [tabindex], input')).toHaveLength(0)
    expect(expr.querySelector('img')?.getAttribute('src')).not.toBe('')

    const expectState = async (viewState: VehiclePetSessionView, expected: string) => {
      source.view = viewState
      view.rerender(<VehiclePetOverlay {...stubProps(source)} />)
      await waitFor(() => {
        expect(exprState()).toBe(expected)
      })
    }
    await expectState({ live: 'running', terminal: null }, 'working')
    await expectState({ live: 'needs-input', terminal: null }, 'needs-input')
    await expectState({ live: 'idle', terminal: { identity: 's1#1#1', status: 'completed' } }, 'completed')
    await expectState({ live: 'idle', terminal: { identity: 's1#1#2', status: 'failed' } }, 'failed')
    await expectState({ live: 'idle', terminal: { identity: 's1#1#3', status: 'cancelled' } }, 'failed')
    await expectState(IDLE_VIEW, 'idle')
    view.unmount()
  })

  it('keeps the static expression layer rendered under reduced motion (CTR-OVERLAY-015)', async () => {
    window.localStorage.setItem(OVERLAY_PREFERENCES_KEY, JSON.stringify({
      schemaVersion: 1,
      position: { xRatio: 0.9, yRatio: 0.9 },
      collapsed: false,
      reducedMotion: true,
    }))
    const source: Source = { view: { live: 'running', terminal: null }, sessions: SESSIONS_ON, locale: 'zh' }
    const view = render(<VehiclePetOverlay {...stubProps(source)} />)
    const expr = await waitFor(() => {
      const node = document.querySelector('[data-vehicle-pet-expression]')
      expect(node).not.toBeNull()
      return node
    }, { timeout: 3000 })
    expect(expr).toHaveAttribute('data-vehicle-pet-expression', 'working')
    expect(expr?.querySelectorAll('button, [tabindex], input')).toHaveLength(0)
    view.unmount()
  })
})

function feedbackStatus(node: HTMLElement): string {
  const feedback = node.closest('[data-pet-host-feedback]') as HTMLElement | null
  expect(feedback).not.toBeNull()
  return feedback?.getAttribute('data-pet-host-feedback') ?? ''
}

describe('VehiclePetOverlay full journey dialog', () => {
  it('DIALOG_INITIAL_SHIFT_TAB_CONTAINMENT_TEST contains every focus path and restores focus', async () => {
    const outside = document.createElement('button')
    outside.textContent = 'background focus target'
    document.body.append(outside)
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    await renderOverlay(source)
    fireEvent.click(screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) }))
    const trigger = screen.getByRole('button', { name: t('panel.viewJourney') })
    fireEvent.click(trigger)

    const dialog = await screen.findByRole('dialog', { name: t('dialog.title') })
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'))
    const first = focusables[0]
    const last = focusables.at(-1)
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(first).toBeDefined()
    expect(last).toBeDefined()
    await waitFor(() => expect(document.activeElement).toBe(first))
    expect(dialog.querySelector('.vp-scene')).not.toBeNull()

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true, bubbles: true })
    expect(document.activeElement).toBe(last)
    fireEvent.keyDown(document, { key: 'Tab', bubbles: true })
    expect(document.activeElement).toBe(first)

    dialog.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true, bubbles: true })
    expect(document.activeElement).toBe(last)
    outside.focus()
    expect(dialog.contains(document.activeElement)).toBe(true)

    fireEvent.keyDown(document, { key: 'Escape', bubbles: true })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(document.activeElement).toBe(trigger)
    outside.remove()
  })
})

describe('VehiclePetOverlay live Harness locale', () => {
  it('HARNESS_LOCALE_LIVE_SYNC_TEST updates chrome, Pack, stage, next target, keepsake, and journey zh-CN → en → zh-CN without remounting', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh-CN' }
    const view = await renderOverlay(source)
    fireEvent.click(screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) }))
    fireEvent.click(screen.getByRole('button', { name: zh['panel.viewJourney'] }))

    const assertLocale = async (locale: 'zh-CN' | 'en') => {
      const english = locale === 'en'
      await waitFor(() => {
        const panel = document.querySelector<HTMLElement>('[data-vehicle-pet-panel]')!
        const dialog = document.querySelector<HTMLElement>('[data-vehicle-pet-dialog]')!
        expect(panel.getAttribute('aria-label')).toBe(english ? en['panel.title'] : zh['panel.title'])
        expect(panel.querySelector('[data-vehicle-pet-stage]')?.textContent).toContain(english ? 'First Dispatch' : '首航出发')
        expect(panel.querySelector('[data-vehicle-pet-next-threshold]')?.textContent).toContain(english ? 'Next milestone' : '下一目标')
        expect(panel.querySelector('[data-vehicle-pet-more] summary')?.textContent).toBe(english ? en['panel.more'] : zh['panel.more'])
        expect(dialog.getAttribute('aria-label')).toBe(english ? en['dialog.title'] : zh['dialog.title'])
        expect(dialog.textContent).toContain(english ? 'First run on the road; the journey begins.' : '第一次上路，旅程正式开始。')
      })
    }

    await assertLocale('zh-CN')
    source.locale = 'en'
    view.rerender(<VehiclePetOverlay {...stubProps(source)} />)
    await assertLocale('en')
    source.locale = 'zh-CN'
    view.rerender(<VehiclePetOverlay {...stubProps(source)} />)
    await assertLocale('zh-CN')
    expect(document.querySelectorAll('[data-vehicle-pet]')).toHaveLength(1)
  })
})

describe('VehiclePetOverlay onboarding suppression matrix', () => {
  function expectSuppressed(): void {
    expect(document.querySelector('[data-vehicle-pet]')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-pet]')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-launcher]')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-panel]')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-dialog]')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-dialog-backdrop]')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet] button, [data-vehicle-pet] [tabindex]')).toBeNull()
  }

  it('restores VISIBLE after same-mount onboarding suppression', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    expect(document.querySelector('[data-vehicle-pet="VISIBLE"]')).not.toBeNull()

    view.rerender(<VehiclePetOverlay {...stubProps({ ...source, sessions: SESSIONS_ONBOARDING })} />)
    await waitFor(expectSuppressed)
    view.rerender(<VehiclePetOverlay {...stubProps(source)} />)
    await screen.findByRole('button', { name: t('overlay.label', { state: t('state.idle') }) })
    expect(document.querySelector('[data-vehicle-pet="VISIBLE"]')).not.toBeNull()
  })

  it('removes pet, panel, dialog, and focus targets then restores PANEL_OPEN', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    fireEvent.click(screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) }))
    fireEvent.click(screen.getByRole('button', { name: t('panel.viewJourney') }))
    expect(screen.queryByRole('dialog', { name: t('dialog.title') })).not.toBeNull()

    view.rerender(<VehiclePetOverlay {...stubProps({ ...source, sessions: SESSIONS_ONBOARDING })} />)
    await waitFor(expectSuppressed)
    view.rerender(<VehiclePetOverlay {...stubProps(source)} />)
    await waitFor(() => {
      expect(screen.queryByRole('group', { name: t('panel.title') })).not.toBeNull()
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(document.querySelector('[data-vehicle-pet="PANEL_OPEN"]')).not.toBeNull()
  })

  it('removes the launcher and focus target then restores COLLAPSED', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    fireEvent.click(screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) }))
    fireEvent.click(screen.getByRole('button', { name: t('panel.collapse') }))
    await screen.findByRole('button', { name: t('launcher.restore') })

    view.rerender(<VehiclePetOverlay {...stubProps({ ...source, sessions: SESSIONS_ONBOARDING })} />)
    await waitFor(expectSuppressed)
    view.rerender(<VehiclePetOverlay {...stubProps(source)} />)
    await screen.findByRole('button', { name: t('launcher.restore') })
    expect(document.querySelector('[data-vehicle-pet="collapsed"]')).not.toBeNull()
  })

  it('restores persisted COLLAPSED after a reload that starts in onboarding', async () => {
    window.localStorage.setItem(OVERLAY_PREFERENCES_KEY, JSON.stringify({
      schemaVersion: 1,
      position: { xRatio: 0.7, yRatio: 0.8 },
      collapsed: true,
    }))
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ONBOARDING, locale: 'zh' }
    const view = render(<VehiclePetOverlay {...stubProps(source)} />)
    expectSuppressed()

    source.sessions = SESSIONS_ON
    view.rerender(<VehiclePetOverlay {...stubProps(source)} />)
    await screen.findByRole('button', { name: t('launcher.restore') })
    expect(document.querySelector('[data-vehicle-pet="collapsed"]')).not.toBeNull()
  })

  it('stays available on ordinary typed conversation/settings/workspace and non-ready no-current states', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    const ordinaryStates: SessionListFixture[] = [
      { phase: 'ready', current: 'conversation', byId: { conversation: { blank: false } } },
      { phase: 'ready', current: 'settings', byId: { settings: { blank: false } } },
      { phase: 'ready', current: 'workspace', byId: { workspace: { blank: false } } },
      { phase: 'loading', byId: {} },
    ]
    for (const sessions of ordinaryStates) {
      source.sessions = sessions
      view.rerender(<VehiclePetOverlay {...stubProps(source)} />)
      await waitFor(() => expect(document.querySelector('[data-vehicle-pet-pet]')).not.toBeNull())
    }
  })

  it('is invariant to unrelated copy, CSS classes, DOM structure, and pathname', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ONBOARDING, locale: 'zh' }
    const view = render(<VehiclePetOverlay {...stubProps(source)} />)
    expectSuppressed()

    document.documentElement.className = 'unrelated-onboarding-looking-class'
    document.title = 'New Session Settings Workspace onboarding'
    window.history.pushState({}, '', '/settings/onboarding-looking-path')
    const unrelated = document.createElement('aside')
    unrelated.className = 'session blank current'
    unrelated.textContent = 'Choose workspace New Session'
    document.body.append(unrelated)
    view.rerender(<VehiclePetOverlay {...stubProps(source)} />)
    expectSuppressed()

    source.sessions = SESSIONS_ON
    view.rerender(<VehiclePetOverlay {...stubProps(source)} />)
    await waitFor(() => expect(document.querySelector('[data-vehicle-pet-pet]')).not.toBeNull())
    unrelated.remove()
    document.documentElement.className = ''
    window.history.pushState({}, '', '/')
  })
})

describe('VehiclePetOverlay movement and multi-tab sync', () => {
  it('moves by keyboard arrows and persists normalized ratios', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    await renderOverlay(source)
    const pet = screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) })
    Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true, writable: true })
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true, writable: true })
    fireEvent.keyDown(pet, { key: 'ArrowLeft' })
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(OVERLAY_PREFERENCES_KEY) ?? '{}')
      expect(stored.position.xRatio).toBeLessThan(1)
      expect(stored.position.xRatio).toBeGreaterThanOrEqual(0)
      expect(Number.isFinite(stored.position.xRatio)).toBe(true)
    })
    const shell = pet.closest('.vpo-shell') as HTMLElement
    const before = shell.style.left
    fireEvent.keyDown(pet, { key: 'ArrowUp', shiftKey: true })
    await waitFor(() => {
      expect((pet.closest('.vpo-shell') as HTMLElement).style.left).toBe(before)
    })
  })

  it('CROSSTAB_COLLAPSE_RESTORE_VISIBLE_TEST destroys stale Panel and Dialog without writes', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    await renderOverlay(source)
    fireEvent.click(screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) }))
    fireEvent.click(screen.getByRole('button', { name: t('panel.viewJourney') }))
    await screen.findByRole('dialog', { name: t('dialog.title') })

    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const record = (collapsed: boolean) => JSON.stringify({
      schemaVersion: 1,
      position: { xRatio: 0.49, yRatio: 0.5 },
      positionCustomized: true,
      collapsed,
      reducedMotion: false,
    })
    fireEvent(window, new StorageEvent('storage', {
      key: OVERLAY_PREFERENCES_KEY,
      newValue: record(true),
    }))
    await screen.findByRole('button', { name: t('launcher.restore') })
    expect(document.querySelector('[data-vehicle-pet-panel]')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-dialog]')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-pet]')).toBeNull()

    source.locale = 'en'
    fireEvent(window, new StorageEvent('storage', {
      key: OVERLAY_PREFERENCES_KEY,
      newValue: record(false),
    }))
    await waitFor(() => expect(document.querySelector('[data-vehicle-pet="VISIBLE"]')).not.toBeNull())
    expect(document.querySelector('[data-vehicle-pet-panel]')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-dialog]')).toBeNull()
    expect(setItem).not.toHaveBeenCalled()
    setItem.mockRestore()
  })

  it('adopts a same-origin storage event without writing back', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    await renderOverlay(source)
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    fireEvent(window, new StorageEvent('storage', {
      key: OVERLAY_PREFERENCES_KEY,
      newValue: JSON.stringify({ schemaVersion: 1, position: { xRatio: 0.1, yRatio: 0.2 }, collapsed: false, reducedMotion: undefined }),
    }))
    await waitFor(() => {
      const shell = document.querySelector('.vpo-shell') as HTMLElement
      expect(shell.style.left).not.toBe('')
    })
    // Adoption itself performs no write (no write loop).
    expect(setItem).not.toHaveBeenCalled()
    setItem.mockRestore()
  })
})

describe('resident within-level micro progress', () => {
  const prefRecord = (overrides: { collapsed?: boolean; reducedMotion?: boolean | undefined }) =>
    JSON.stringify({
      schemaVersion: 1,
      position: { xRatio: 0.9, yRatio: 0.9 },
      collapsed: false,
      reducedMotion: undefined,
      ...overrides,
    })

  function stubOsReduce(matches: boolean): () => void {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'matchMedia')
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: (query: string) => ({
        matches: query.includes('prefers-reduced-motion') ? matches : false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
      }),
    })
    return () => {
      if (descriptor) Object.defineProperty(window, 'matchMedia', descriptor)
      else delete (window as { matchMedia?: unknown }).matchMedia
    }
  }

  it('renders an aria-hidden, non-interactive micro bar inside the pet button', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    await renderOverlay(source)
    const pet = screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) })
    const micro = pet.querySelector('.vpo-progress')
    expect(micro).not.toBeNull()
    expect(micro).toHaveAttribute('aria-hidden', 'true')
    expect(micro?.querySelectorAll('button, [tabindex], input')).toHaveLength(0)
    expect(micro).toHaveAttribute('data-within-level-percent')
    const fill = micro?.querySelector('.vpo-progressFill') as HTMLElement
    expect(fill).not.toBeNull()
    expect(fill.style.width).toMatch(/%$/)
  })

  it('renders no micro bar in the collapsed launcher state', async () => {
    window.localStorage.setItem(OVERLAY_PREFERENCES_KEY, prefRecord({ collapsed: true }))
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    render(<VehiclePetOverlay {...stubProps(source)} />)
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: t('launcher.restore') })).not.toBeNull()
    })
    expect(document.querySelector('[data-vehicle-pet-pet]')).toBeNull()
    expect(document.querySelector('.vpo-progress')).toBeNull()
  })

  it('explicit reduced-motion ON silences the width transition even when the OS reports no preference', async () => {
    const restoreOs = stubOsReduce(false)
    window.localStorage.setItem(OVERLAY_PREFERENCES_KEY, prefRecord({ reducedMotion: true }))
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    try {
      await renderOverlay(source)
      expect(document.querySelector('.vpo-progress')).toHaveAttribute('data-reduced-motion', 'true')
    } finally {
      restoreOs()
    }
  })

  it('explicit reduced-motion OFF follows the effective preference over the OS reduce report', async () => {
    const restoreOs = stubOsReduce(true)
    window.localStorage.setItem(OVERLAY_PREFERENCES_KEY, prefRecord({ reducedMotion: false }))
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    try {
      await renderOverlay(source)
      expect(document.querySelector('.vpo-progress')).toHaveAttribute('data-reduced-motion', 'false')
    } finally {
      restoreOs()
    }
  })

  it('without an explicit preference the OS reduce report drives the transition gate', async () => {
    const restoreOs = stubOsReduce(true)
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    try {
      await renderOverlay(source)
      expect(document.querySelector('.vpo-progress')).toHaveAttribute('data-reduced-motion', 'true')
    } finally {
      restoreOs()
    }
  })
})
