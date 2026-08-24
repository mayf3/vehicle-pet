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
import { zh, type VehiclePetLocaleKey } from '../../../src/dsh/client/locales'
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
    t: (key: VehiclePetLocaleKey, params?: Record<string, string>) => t(key, params),
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
  it('opens an accessible in-Harness dialog, restores focus on close', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    await renderOverlay(source)
    fireEvent.click(screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) }))
    const trigger = screen.getByRole('button', { name: t('panel.viewJourney') })
    fireEvent.click(trigger)

    const dialog = await screen.findByRole('dialog', { name: t('dialog.title') })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true)
    })
    expect(dialog.querySelector('.vp-scene')).not.toBeNull()

    fireEvent.keyDown(dialog, { key: 'Escape', bubbles: true })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(document.activeElement).toBe(trigger)
  })
})

describe('VehiclePetOverlay onboarding suppression', () => {
  it('renders no surface during onboarding and restores the exact state after', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    fireEvent.click(screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) }))
    expect(screen.queryByRole('group', { name: t('panel.title') })).not.toBeNull()

    view.rerender(<VehiclePetOverlay {...stubProps({ ...source, sessions: SESSIONS_ONBOARDING })} />)
    await waitFor(() => {
      expect(document.querySelector('.vpo-root')).toBeNull()
      expect(document.querySelector('[data-vehicle-pet-pet]')).toBeNull()
      expect(document.querySelector('[data-vehicle-pet-launcher]')).toBeNull()
    })

    view.rerender(<VehiclePetOverlay {...stubProps(source)} />)
    await waitFor(() => {
      // Exact restoration: the panel that was open before suppression returns.
      expect(screen.queryByRole('group', { name: t('panel.title') })).not.toBeNull()
    })
    view.unmount()
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

