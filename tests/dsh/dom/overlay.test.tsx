/**
 * Overlay DOM behavior (DSH_PET_OVERLAY_ADAPTER_V3 CTR-OVERLAY-003..007,
 * 010, 011, 014-021; ACC-OVERLAY-104/105/117/118/120/121): VISIBLE/COLLAPSED
 * machine with no PANEL_OPEN, SMALL/LARGE sizes with LARGE-on-absence, the
 * exact four-item secondary menu reached only through its trigger, resident
 * progress absence, the product-Pack-only DSH surface, static expression
 * variants, dialog accessibility and focus restore, onboarding suppression,
 * session reactions that never touch progressPoints, keyboard movement, and
 * multi-tab preference adoption.
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VehiclePetOverlay } from '../../../src/dsh/client/VehiclePetOverlay'
import type { VehiclePetOverlayProps } from '../../../src/dsh/client/VehiclePetOverlay'
import { en, zh, type VehiclePetLocaleKey } from '../../../src/dsh/client/locales'
import { OVERLAY_PREFERENCES_KEY } from '../../../src/dsh/client/preferences'
import { OVERLAY_GEOMETRY } from '../../../src/dsh/client/types'
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

function petButton(): HTMLElement {
  return screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) })
}

function openMenu(): HTMLElement {
  fireEvent.click(screen.getByRole('button', { name: t('menu.open') }))
  return screen.getByRole('group', { name: t('menu.title') })
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
})

describe('NO_NORMAL_CLICK_PANEL + two-state machine (V3 CTR-OVERLAY-004/021)', () => {
  it('normal clicks never open any panel, menu, or dialog; the machine is VISIBLE/COLLAPSED only', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    expect(document.querySelector('[data-vehicle-pet="VISIBLE"]')).not.toBeNull()
    expect(document.querySelector('[data-vehicle-pet="PANEL_OPEN"]')).toBeNull()

    const pet = petButton()
    for (let click = 0; click < 3; click += 1) {
      fireEvent.click(pet)
    }
    expect(screen.queryByRole('group', { name: t('menu.title') })).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-panel]')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-menu]')).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
    // The state machine never leaves VISIBLE on pet clicks.
    expect(document.querySelector('[data-vehicle-pet="VISIBLE"]')).not.toBeNull()
    view.unmount()
  })

  it('click gives a pet reaction: the idle expression variant changes without any surface', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    const pet = petButton()
    const before = pet.getAttribute('data-vehicle-pet-expression')
    fireEvent.click(pet)
    const after = pet.getAttribute('data-vehicle-pet-expression')
    expect(after).toBe('idle-happy') // clickCount=1 selects the second idle pool entry
    expect(before).toBe('idle')
    expect(screen.queryByRole('group', { name: t('menu.title') })).toBeNull()
    view.unmount()
  })

  it('collapses to the 36px launcher and restores on activation', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    await openMenu()
    fireEvent.click(screen.getByRole('button', { name: t('menu.collapse') }))

    const launcher = await screen.findByRole('button', { name: t('launcher.restore') })
    expect(launcher).toHaveAttribute('data-vehicle-pet-launcher', 'true')
    const shell = launcher.closest('.vpo-shell') as HTMLElement
    expect(shell.style.width).toBe(`${OVERLAY_GEOMETRY.collapsedLauncherSizePx}px`)
    expect(shell.style.height).toBe(`${OVERLAY_GEOMETRY.collapsedLauncherSizePx}px`)
    expect(JSON.parse(window.localStorage.getItem(OVERLAY_PREFERENCES_KEY) ?? '{}').collapsed).toBe(true)
    expect(document.querySelector('[data-vehicle-pet="COLLAPSED"]')).not.toBeNull()

    fireEvent.click(launcher)
    await screen.findByRole('button', { name: t('overlay.label', { state: t('state.idle') }) })
    expect(JSON.parse(window.localStorage.getItem(OVERLAY_PREFERENCES_KEY) ?? '{}').collapsed).toBe(false)
    view.unmount()
  })
})

describe('SIZE_MODE_SMALL / SIZE_MODE_LARGE / LARGE default (V3 CTR-OVERLAY-010/020)', () => {
  it('resolves an absent size choice to LARGE (216px shell)', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    const shell = document.querySelector('.vpo-shell') as HTMLElement
    expect(shell.style.width).toBe(`${OVERLAY_GEOMETRY.largeSurfaceHeightPx}px`)
    expect(shell.style.height).toBe(`${OVERLAY_GEOMETRY.largeSurfaceHeightPx}px`)
    expect(document.querySelector('[data-vehicle-pet-size]')?.getAttribute('data-vehicle-pet-size')).toBe('large')
    view.unmount()
  })

  it('renders an explicit SMALL choice at 112px', async () => {
    window.localStorage.setItem(OVERLAY_PREFERENCES_KEY, JSON.stringify({
      schemaVersion: 1,
      position: { xRatio: 0.9, yRatio: 0.9 },
      collapsed: false,
      reducedMotion: undefined,
      size: 'small',
    }))
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    const shell = document.querySelector('.vpo-shell') as HTMLElement
    expect(shell.style.width).toBe(`${OVERLAY_GEOMETRY.smallSurfaceHeightPx}px`)
    expect(shell.style.height).toBe(`${OVERLAY_GEOMETRY.smallSurfaceHeightPx}px`)
    expect(document.querySelector('[data-vehicle-pet-size]')?.getAttribute('data-vehicle-pet-size')).toBe('small')
    view.unmount()
  })

  it('the hitbox hugs the visible sprite instead of the square canvas', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    const pet = petButton()
    const width = Number(pet.style.width.replace('px', ''))
    const height = Number(pet.style.height.replace('px', ''))
    const shellSide = OVERLAY_GEOMETRY.largeSurfaceHeightPx
    // L1 car art: the visible bbox is wide and short, never the full square.
    expect(width).toBeLessThanOrEqual(shellSide)
    expect(height).toBeLessThan(shellSide * 0.9)
    expect(width).toBeGreaterThan(shellSide * 0.3)
    expect(height).toBeGreaterThan(shellSide * 0.2)
    view.unmount()
  })
})

describe('SECONDARY_SETTINGS_ACCESSIBLE (V3 CTR-OVERLAY-005, DEC-OVERLAY-008)', () => {
  it('the menu opens only through its trigger and contains exactly the four contracted groups', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    // Not opened by a normal pet click (covered above); only the trigger opens it.
    fireEvent.click(screen.getByRole('button', { name: t('menu.open') }))
    const menu = screen.getByRole('group', { name: t('menu.title') })
    expect(menu).toHaveAttribute('data-vehicle-pet-menu', 'true')
    expect(menu.style.width).toBe(`${OVERLAY_GEOMETRY.secondaryMenuWidthPx}px`)

    // Exactly: size, reduced motion, journey, collapse.
    expect(menu.querySelector('[data-vehicle-pet-size-control]')).not.toBeNull()
    expect(menu.querySelector('[data-vehicle-pet-reduced-motion]')).not.toBeNull()
    expect(menu.querySelector('[data-vehicle-pet-open-journey]')).not.toBeNull()
    expect(menu.querySelector('[data-vehicle-pet-collapse]')).not.toBeNull()
    expect(menu.querySelectorAll('[data-vehicle-pet-size-option]')).toHaveLength(2)
    expect(menu.querySelectorAll('[data-vehicle-pet-reduced-motion-option]')).toHaveLength(3)

    // No progression content, no Pack name, no keepsake, no engineering readout.
    for (const removed of ['[data-vehicle-pet-stage]', '[data-vehicle-pet-progress]', '[data-vehicle-pet-next-threshold]', '[data-vehicle-pet-pack-name]', '[data-vehicle-pet-keepsake]', '[data-vehicle-pet-pack-switch]', '[data-vehicle-pet-pack-option]']) {
      expect(menu.querySelector(removed)).toBeNull()
    }
    const menuText = menu.textContent ?? ''
    for (const forbidden of ['MockProgressSource', '精确输入', '故障', 'diagnostics', '开发控制台', '+100', '种子伙伴', 'seedling']) {
      expect(menuText).not.toContain(forbidden)
    }
    view.unmount()
  })

  it('size options commit the persisted preference and resize the surface immediately', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    await openMenu()
    fireEvent.click(screen.getByRole('button', { name: t('menu.size.small') }))
    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem(OVERLAY_PREFERENCES_KEY) ?? '{}')
      expect(stored.size).toBe('small')
    })
    const shell = document.querySelector('.vpo-shell') as HTMLElement
    expect(shell.style.width).toBe(`${OVERLAY_GEOMETRY.smallSurfaceHeightPx}px`)
    expect(document.querySelector('[data-vehicle-pet-size]')?.getAttribute('data-vehicle-pet-size')).toBe('small')
    view.unmount()
  })

  it('Escape closes the menu and offers no Pack switch anywhere (seedling stays internal)', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    const pet = petButton()
    await waitFor(() => {
      expect(pet.getAttribute('data-vehicle-pet-pack')).toBe('autonomous-fleet')
    })
    const menu = openMenu()
    fireEvent.keyDown(menu, { key: 'Escape' })
    expect(screen.queryByRole('group', { name: t('menu.title') })).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-pack-option]')).toBeNull()
    expect(document.body.textContent).not.toContain('种子伙伴')

    // The journey dialog opens from the menu and shows no Pack option either.
    fireEvent.click(screen.getByRole('button', { name: t('menu.open') }))
    fireEvent.click(screen.getByRole('button', { name: t('menu.viewJourney') }))
    await screen.findByRole('dialog', { name: t('dialog.title') })
    expect(document.querySelector('[data-vehicle-pet-pack-option]')).toBeNull()
    view.unmount()
  })
})

describe('NO_RESIDENT_PROGRESS_BAR (V3 CTR-OVERLAY-016)', () => {
  it('renders no resident progress presentation in either size, collapsed state, or dialog', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    expect(document.querySelector('.vpo-progress')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-progress]')).toBeNull()
    expect(document.querySelector('[data-within-level-percent]')).toBeNull()

    // LARGE explicit choice: still no gauge.
    window.localStorage.setItem(OVERLAY_PREFERENCES_KEY, JSON.stringify({
      schemaVersion: 1,
      position: { xRatio: 0.9, yRatio: 0.9 },
      collapsed: false,
      reducedMotion: undefined,
      size: 'large',
    }))
    view.rerender(<VehiclePetOverlay {...stubProps(source)} />)
    expect(document.querySelector('.vpo-progress')).toBeNull()
    view.unmount()
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
    expect(document.querySelector('.vpo-badge')).not.toBeNull()
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

    // Session reactions never feed progression (CTR-OVERLAY-007/013); the
    // resident surface renders no progress readout at all (V3 CTR-OVERLAY-016).
    expect(document.querySelector('[data-vehicle-pet-progress]')).toBeNull()
    const pet = screen.getByRole('button', { name: t('overlay.label', { state: t('state.completed') }) })
    fireEvent.click(pet)
    expect(JSON.parse(window.localStorage.getItem(OVERLAY_PREFERENCES_KEY) ?? '{}').size).toBeUndefined()
    view.unmount()
  })

  it('shows a distinct static expression variant per session state without adding interaction targets', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    const exprVariant = () => document.querySelector('[data-vehicle-pet-expression]')?.getAttribute('data-vehicle-pet-expression')
    await waitFor(() => {
      expect(exprVariant()).toBe('idle')
    })
    const expr = document.querySelector('[data-vehicle-pet-expression]') as HTMLElement
    expect(expr).toHaveAttribute('aria-hidden', 'true')
    expect(expr.querySelectorAll('button, [tabindex], input')).toHaveLength(0)
    expect(expr.querySelector('img')?.getAttribute('src')).not.toBe('')

    const expectState = async (viewState: VehiclePetSessionView, expected: string) => {
      source.view = viewState
      view.rerender(<VehiclePetOverlay {...stubProps(source)} />)
      await waitFor(() => {
        expect(exprVariant()).toBe(expected)
      })
    }
    await expectState({ live: 'running', terminal: null }, 'working')
    await expectState({ live: 'needs-input', terminal: null }, 'needs-input')
    await expectState({ live: 'idle', terminal: { identity: 's1#1#1', status: 'completed' } }, 'completed')
    await expectState({ live: 'idle', terminal: { identity: 's1#1#2', status: 'failed' } }, 'failed')
    await expectState({ live: 'idle', terminal: { identity: 's1#1#3', status: 'cancelled' } }, 'cancelled')
    await expectState(IDLE_VIEW, 'idle')
    view.unmount()
  })

  it('keeps the static expression layer rendered under reduced motion (V3 CTR-OVERLAY-015)', async () => {
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
    // The effective preference wins over the OS report on the scene gate.
    expect(document.querySelector('.vp-scene')).toHaveAttribute('data-reduced-motion', 'true')
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
    const view = await renderOverlay(source)
    fireEvent.click(screen.getByRole('button', { name: t('menu.open') }))
    const trigger = screen.getByRole('button', { name: t('menu.viewJourney') })
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
    view.unmount()
  })
})

describe('VehiclePetOverlay live Harness locale', () => {
  it('HARNESS_LOCALE_LIVE_SYNC_TEST updates chrome, Pack, stage, keepsake, and journey zh-CN → en → zh-CN without remounting', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh-CN' }
    const view = await renderOverlay(source)
    fireEvent.click(screen.getByRole('button', { name: t('menu.open') }))
    fireEvent.click(screen.getByRole('button', { name: zh['menu.viewJourney'] }))

    const assertLocale = async (locale: 'zh-CN' | 'en') => {
      const english = locale === 'en'
      await waitFor(() => {
        const menu = document.querySelector<HTMLElement>('[data-vehicle-pet-menu]')!
        const dialog = document.querySelector<HTMLElement>('[data-vehicle-pet-dialog]')!
        expect(menu.getAttribute('aria-label')).toBe(english ? en['menu.title'] : zh['menu.title'])
        expect(menu.querySelector('[data-vehicle-pet-size-control]')?.textContent).toContain(english ? 'Size' : '大小')
        expect(dialog.getAttribute('aria-label')).toBe(english ? en['dialog.title'] : zh['dialog.title'])
        expect(dialog.textContent).toContain(english ? 'One car: driver occupied, copilot empty, rear escort present.' : '主驾有人，副驾无人，有后方保护车，1 辆车。')
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
    view.unmount()
  })
})

describe('VehiclePetOverlay onboarding suppression matrix', () => {
  function expectSuppressed(): void {
    expect(document.querySelector('[data-vehicle-pet]')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-pet]')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-launcher]')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-menu]')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-dialog]')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-dialog-backdrop]')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-bubble]')).toBeNull()
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

  it('removes pet, menu, dialog, and focus targets then restores VISIBLE', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    fireEvent.click(screen.getByRole('button', { name: t('menu.open') }))
    fireEvent.click(screen.getByRole('button', { name: t('menu.viewJourney') }))
    expect(screen.queryByRole('dialog', { name: t('dialog.title') })).not.toBeNull()

    view.rerender(<VehiclePetOverlay {...stubProps({ ...source, sessions: SESSIONS_ONBOARDING })} />)
    await waitFor(expectSuppressed)
    view.rerender(<VehiclePetOverlay {...stubProps(source)} />)
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: t('overlay.label', { state: t('state.idle') }) })).not.toBeNull()
      expect(screen.queryByRole('dialog')).toBeNull()
    })
    expect(document.querySelector('[data-vehicle-pet="VISIBLE"]')).not.toBeNull()
  })

  it('removes the launcher and focus target then restores COLLAPSED', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    const view = await renderOverlay(source)
    await openMenu()
    fireEvent.click(screen.getByRole('button', { name: t('menu.collapse') }))
    await screen.findByRole('button', { name: t('launcher.restore') })

    view.rerender(<VehiclePetOverlay {...stubProps({ ...source, sessions: SESSIONS_ONBOARDING })} />)
    await waitFor(expectSuppressed)
    view.rerender(<VehiclePetOverlay {...stubProps(source)} />)
    await screen.findByRole('button', { name: t('launcher.restore') })
    expect(document.querySelector('[data-vehicle-pet="COLLAPSED"]')).not.toBeNull()
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
    expect(document.querySelector('[data-vehicle-pet="COLLAPSED"]')).not.toBeNull()
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
    const pet = petButton()
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

  it('CROSSTAB_COLLAPSE_RESTORE_VISIBLE_TEST destroys stale Menu and Dialog without writes', async () => {
    const source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }
    await renderOverlay(source)
    fireEvent.click(screen.getByRole('button', { name: t('menu.open') }))
    fireEvent.click(screen.getByRole('button', { name: t('menu.viewJourney') }))
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
    expect(document.querySelector('[data-vehicle-pet-menu]')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-dialog]')).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-pet]')).toBeNull()

    source.locale = 'en'
    fireEvent(window, new StorageEvent('storage', {
      key: OVERLAY_PREFERENCES_KEY,
      newValue: record(false),
    }))
    await waitFor(() => expect(document.querySelector('[data-vehicle-pet="VISIBLE"]')).not.toBeNull())
    expect(document.querySelector('[data-vehicle-pet-menu]')).toBeNull()
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
