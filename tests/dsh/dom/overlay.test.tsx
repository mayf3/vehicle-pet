/**
 * Overlay DOM behavior (CTR-OVERLAY-003..005, 010, 011; ACC-OVERLAY-004/005/
 * 008/011/012/017): three-state machine and sizes, exact compact-panel item
 * inventory, dialog accessibility and focus restore, onboarding suppression
 * with exact same-mount restoration, pack switching without progress change,
 * session reactions that never touch progressPoints, keyboard movement, and
 * multi-tab preference adoption.
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
  it('renders the default VISIBLE pet at 112px and toggles the 320px panel', async () => {
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
    expect(panel.style.width).toBe('320px')

    fireEvent.click(pet)
    expect(screen.queryByRole('group', { name: t('panel.title') })).toBeNull()
  })

  it('contains exactly the eight authorized compact items and no dev surfaces', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    await renderOverlay(source)
    fireEvent.click(screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) }))
    const panel = screen.getByRole('group', { name: t('panel.title') })

    const authorized = [
      panel.querySelector('[data-vehicle-pet-pack-name]'),
      panel.querySelector('[data-vehicle-pet-stage]'),
      panel.querySelector('[data-vehicle-pet-progress]'),
      panel.querySelector('[data-vehicle-pet-next-threshold]'),
      panel.querySelector('[data-vehicle-pet-keepsake]'),
      panel.querySelector('[data-vehicle-pet-pack-switch]'),
      panel.querySelector('[data-vehicle-pet-reduced-motion]'),
      panel.querySelector('[data-vehicle-pet-collapse]'),
      panel.querySelector('[data-vehicle-pet-open-journey]'),
    ]
    // 1 pack name, 2 stage, 3 progress+next, 4 keepsake, 5 switch, 6 reduced
    // motion, 7 collapse, 8 view journey (close is chrome, not content).
    expect(authorized.every(node => node !== null)).toBe(true)
    expect(panel.querySelectorAll('button').length).toBe(
      2 /* pack options */ + 3 /* reduced-motion options */ + 1 /* journey */ + 1 /* collapse */ + 1 /* close chrome */,
    )

    const panelText = panel.textContent ?? ''
    for (const forbidden of ['MockProgressSource', '精确输入', '故障', 'diagnostics', '开发控制台', '+100']) {
      expect(panelText).not.toContain(forbidden)
    }
    expect(document.querySelector('[data-prototype-controls]')).toBeNull()
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

  it('switches packs both ways without touching progress', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    await renderOverlay(source)
    const pet = screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) })
    fireEvent.click(pet)

    const fleet = screen.getByRole('button', { name: '无人车队' })
    const seedling = screen.getByRole('button', { name: '种子伙伴' })
    fireEvent.click(seedling)
    await waitFor(() => {
      expect(screen.getByRole('group', { name: t('panel.title') }).querySelector('[data-vehicle-pet-pack-name]')?.textContent).toBe('种子伙伴')
    })
    const pointsOf = () => {
      const text = screen.getByRole('group', { name: t('panel.title') }).querySelector('[data-vehicle-pet-progress]')?.textContent ?? ''
      return /^([0-9,.]+)/.exec(text.replace(/\s/g, ''))?.[1] ?? ''
    }
    const progressAfterSwitch = pointsOf()
    fireEvent.click(fleet)
    await waitFor(() => {
      expect(screen.getByRole('group', { name: t('panel.title') }).querySelector('[data-vehicle-pet-pack-name]')?.textContent).toBe('无人车队')
    })
    expect(pointsOf()).toBe(progressAfterSwitch)
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
        expect(panel.querySelector('[data-vehicle-pet-pack-name]')?.textContent).toBe(english ? 'Autonomous Fleet' : '无人车队')
        expect(panel.querySelector('[data-vehicle-pet-stage]')?.textContent).toContain(english ? 'First Road Test' : '首航路测')
        expect(panel.querySelector('[data-vehicle-pet-next-threshold]')?.textContent).toContain(english ? 'Next milestone' : '下一目标')
        expect(panel.querySelector('[data-vehicle-pet-keepsake]')?.textContent).toBe(english ? 'No keepsakes yet' : '还没有纪念品')
        expect(dialog.getAttribute('aria-label')).toBe(english ? en['dialog.title'] : zh['dialog.title'])
        expect(dialog.textContent).toContain(english ? 'First run on the road; road testing begins.' : '第一次上路，路测正式开始。')
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
