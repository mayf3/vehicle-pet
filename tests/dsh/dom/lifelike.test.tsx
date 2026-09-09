/**
 * V7 lifelike layer DOM integration (DSH_PET_OVERLAY_ADAPTER_V7 CTR-029/030/
 * 032/033/035; ACC-OVERLAY-127/129/130/132). Goal §24 cases covered here:
 * PET_LONG_PRESS end-to-end, PETTING_RELEASE, DROP_REACTION persistence
 * neutrality, CURSOR_TRACKING static pin, AMBIENT_CADENCE,
 * AMBIENT_NO_REPEAT, TYPING_SUPPRESSION, WELCOME_BACK_NO_GUILT bubble,
 * CHARACTER_BEHAVIOR_PROFILE decoration difference, REDUCED_MOTION_PARITY
 * static style pin, and COMPOSER_NO_OCCLUSION/SMALL/LARGE invariants carried
 * by overlay.test.tsx and the DSH coexistence suite.
 */

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { VehiclePetOverlay } from '../../../src/dsh/client/VehiclePetOverlay'
import type { VehiclePetOverlayProps } from '../../../src/dsh/client/VehiclePetOverlay'
import { zh, type VehiclePetLocaleKey } from '../../../src/dsh/client/locales'
import { OVERLAY_PREFERENCES_KEY } from '../../../src/dsh/client/preferences'
import { adoptStyles } from '../../../src/dsh/client/styles'
import type { VehiclePetSessionView } from '../../../src/dsh/client/types'
import { GESTURE_PETTING_HOLD_MS as GESTURE_HOLD } from '../../../src/dsh/client/gesture-rules'

const IDLE_VIEW: VehiclePetSessionView = Object.freeze({ live: 'idle', terminal: null })
const SESSIONS_ON = { phase: 'ready', current: 's1', byId: { s1: { blank: false } } }

const MOUNT_TIME = new Date('2026-09-10T14:00:00').getTime()

function t(key: VehiclePetLocaleKey, params?: Record<string, string>): string {
  let text: string = zh[key]
  for (const [name, value] of Object.entries(params ?? {})) text = text.replace(`{${name}}`, value)
  return text
}

function stubProps(): VehiclePetOverlayProps {
  return {
    useSessionView: selector => selector(IDLE_VIEW),
    useLocale: selector => selector({ active: 'zh-CN', revision: 1 }),
    useSessions: selector => selector(SESSIONS_ON as never),
    t: (key: VehiclePetLocaleKey) => zh[key],
  } as VehiclePetOverlayProps
}

async function renderOverlay() {
  const view = render(<VehiclePetOverlay {...stubProps()} />)
  await vi.waitFor(() => {
    expect(screen.queryByRole('button', { name: t('overlay.label', { state: t('state.idle') }) })).not.toBeNull()
  })
  return view
}

function petButton(): HTMLElement {
  return screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) })
}

function characterArea(): HTMLElement {
  return document.querySelector('.vpo-characterArea') as HTMLElement
}

const AMBIENT_IDS = new Set(['look-left', 'look-right', 'sensor-check', 'wheel-blink', 'small-shuffle'])

beforeEach(() => {
  window.localStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(MOUNT_TIME)
  Object.defineProperty(document, 'hidden', { configurable: true, value: false })
  Element.prototype.setPointerCapture = vi.fn() as never
  Element.prototype.releasePointerCapture = vi.fn() as never
  Element.prototype.hasPointerCapture = vi.fn(() => false) as never
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('PET_LONG_PRESS / PETTING_RELEASE (V7 CTR-029/030)', () => {
  it('a stationary hold inside the band pets, suppresses the click path, and settles on release', async () => {
    await renderOverlay()
    const pet = petButton()
    const area = characterArea()
    expect(area.getAttribute('data-vehicle-pet-petting')).toBe('false')

    fireEvent.pointerDown(pet, { pointerId: 1, button: 0, isPrimary: true, clientX: 10, clientY: 10 })
    act(() => vi.advanceTimersByTime(GESTURE_HOLD - 1))
    expect(area.getAttribute('data-vehicle-pet-petting')).toBe('false')
    act(() => vi.advanceTimersByTime(1))
    expect(area.getAttribute('data-vehicle-pet-petting')).toBe('true')
    expect(area.getAttribute('data-vehicle-pet-reaction-id')).toBe('petting')

    // Release settles back to baseline; no click reaction, no menu, no bubble stack.
    fireEvent.pointerUp(pet, { pointerId: 1, clientX: 10, clientY: 10 })
    expect(area.getAttribute('data-vehicle-pet-petting')).toBe('false')
    fireEvent.click(pet, { detail: 1 })
    expect(pet.getAttribute('data-vehicle-pet-expression')).toBe('idle')
    expect(screen.queryByRole('group', { name: t('menu.title') })).toBeNull()
    expect(document.querySelector('[data-vehicle-pet-bubble]')).toBeNull()
  })

  it('an ambient action never fires while a petting episode is held (CTR-030 suppression)', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    await renderOverlay()
    const pet = petButton()
    const area = characterArea()
    fireEvent.pointerDown(pet, { pointerId: 1, button: 0, isPrimary: true, clientX: 10, clientY: 10 })
    act(() => vi.advanceTimersByTime(GESTURE_HOLD))
    // CTR-030: the held episode also suppresses recurring speech attempts.
    act(() => vi.advanceTimersByTime(60000))
    expect(document.querySelector('[data-vehicle-pet-bubble]')).toBeNull()
    // Cross the first ambient deadline (165 s with the fixed sample) while held.
    act(() => vi.advanceTimersByTime(110000))
    expect(area.getAttribute('data-vehicle-pet-reaction-id')).toBe('petting')
    expect(AMBIENT_IDS.has(area.getAttribute('data-vehicle-pet-reaction-id') ?? '')).toBe(false)
    fireEvent.pointerUp(pet, { pointerId: 1, clientX: 10, clientY: 10 })
  })
})

describe('DROP_REACTION / persistence neutrality (V7 CTR-032)', () => {
  it('a real drag drops with a settle reaction and persists ratios exactly as before V7', async () => {
    await renderOverlay()
    const pet = petButton()
    const area = characterArea()
    fireEvent.pointerDown(pet, { pointerId: 1, button: 0, isPrimary: true, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(pet, { pointerId: 1, clientX: 130, clientY: 104 })
    expect(area.getAttribute('data-vehicle-pet-petting')).toBe('false')
    fireEvent.pointerUp(pet, { pointerId: 1, clientX: 130, clientY: 104 })
    expect(area.getAttribute('data-vehicle-pet-reaction-id')).toBe('settle')
    act(() => vi.advanceTimersByTime(2400))
    expect(area.getAttribute('data-vehicle-pet-reaction-id')).toBeNull()
    // Position persistence semantics unchanged: the dragged position persists.
    const stored = JSON.parse(window.localStorage.getItem(OVERLAY_PREFERENCES_KEY) ?? '{}')
    expect(stored.positionCustomized).toBe(true)
    // The drop never opened the settings menu.
    expect(screen.queryByRole('group', { name: t('menu.title') })).toBeNull()
  })
})

describe('AMBIENT_CADENCE / AMBIENT_NO_REPEAT / TYPING_SUPPRESSION (V7 CTR-033)', () => {
  it('fires on the minutes-level deadline, never back-to-back, and consumes typed-over attempts', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    await renderOverlay()
    const area = characterArea()
    // Deadline at mount + 165 s; load-quiet (120 s) has passed by then.
    act(() => vi.advanceTimersByTime(164000))
    expect(AMBIENT_IDS.has(area.getAttribute('data-vehicle-pet-reaction-id') ?? '')).toBe(false)
    act(() => vi.advanceTimersByTime(1000))
    expect(area.getAttribute('data-vehicle-pet-reaction-id')).toBe('sensor-check')
    act(() => vi.advanceTimersByTime(2400))
    // Next deadline at +165 s: no ambient action may appear before it.
    act(() => vi.advanceTimersByTime(162000))
    expect(AMBIENT_IDS.has(area.getAttribute('data-vehicle-pet-reaction-id') ?? '')).toBe(false)
    // Typing 1 s before the deadline consumes the attempt without catch-up…
    document.dispatchEvent(new KeyboardEvent('keydown'))
    act(() => vi.advanceTimersByTime(1000))
    act(() => vi.advanceTimersByTime(2400))
    expect(AMBIENT_IDS.has(area.getAttribute('data-vehicle-pet-reaction-id') ?? '')).toBe(false)
    // …and the resampled deadline still fires minutes later.
    act(() => vi.advanceTimersByTime(164000))
    expect(AMBIENT_IDS.has(area.getAttribute('data-vehicle-pet-reaction-id') ?? '')).toBe(true)
  })
})

describe('WELCOME_BACK_NO_GUILT (V7 CTR-035)', () => {
  it('speaks one welcome line after the load-quiet period and records the ritual day', async () => {
    window.localStorage.setItem(OVERLAY_PREFERENCES_KEY, JSON.stringify({
      schemaVersion: 1,
      position: { xRatio: 1, yRatio: 1 },
      collapsed: false,
      lastSeenAt: MOUNT_TIME - 9 * 60 * 60 * 1000,
    }))
    await renderOverlay()
    act(() => vi.advanceTimersByTime(15000))
    const bubble = document.querySelector('[data-vehicle-pet-bubble]')
    expect(bubble).not.toBeNull()
    const lines = ['回来啦！', '又见面啦，今天也一起吧。', '正好，我热好车了。']
    expect(lines).toContain(bubble!.textContent)
    const stored = JSON.parse(window.localStorage.getItem(OVERLAY_PREFERENCES_KEY) ?? '{}')
    expect(typeof stored.lastSeenAt).toBe('number')
    expect(stored.rituals.welcomeDayKey).toBe('2026-09-10')
  })

  it('never welcomes without a usable lastSeenAt field', async () => {
    await renderOverlay()
    act(() => vi.advanceTimersByTime(15000))
    expect(document.querySelector('[data-vehicle-pet-bubble]')).toBeNull()
    const stored = JSON.parse(window.localStorage.getItem(OVERLAY_PREFERENCES_KEY) ?? '{}')
    expect(stored.rituals.welcomeDayKey).toBeUndefined()
  })
})

describe('CHARACTER_BEHAVIOR_PROFILE + REDUCED_MOTION_PARITY (V7 CTR-037/015)', () => {
  it('petting presents the vehicle sparkles family and the companion heart family', async () => {
    for (const characterId of ['vehicle', 'companion'] as const) {
      window.localStorage.setItem(OVERLAY_PREFERENCES_KEY, JSON.stringify({
        schemaVersion: 1,
        position: { xRatio: 1, yRatio: 1 },
        collapsed: false,
        characterId,
      }))
      await renderOverlay()
      const pet = petButton()
      expect(pet.getAttribute('data-vehicle-pet-character')).toBe(characterId)
      fireEvent.pointerDown(pet, { pointerId: 1, button: 0, isPrimary: true, clientX: 10, clientY: 10 })
      act(() => vi.advanceTimersByTime(550))
      const decoration = document.querySelector('[data-reaction-decoration]')
      expect(decoration?.getAttribute('data-reaction-decoration'))
        .toBe(characterId === 'vehicle' ? 'sparkles' : 'heart')
      fireEvent.pointerUp(pet, { pointerId: 1, clientX: 10, clientY: 10 })
      cleanup()
    }
  })

  it('pins gaze/tilt to rest under OS reduced motion and keeps the surface geometry intact', async () => {
    await renderOverlay()
    const disposeStyles = adoptStyles()
    const styles = document.querySelector('style[data-plugin-css="vehicle-pet/overlay-styles"]')
    expect(styles?.textContent).toContain('@media(prefers-reduced-motion:reduce){.vpo-characterArea{--vp-gaze-x:0px!important;--vp-gaze-y:0px!important;--vp-tilt:0deg!important}}')
    disposeStyles()
    // SMALL/LARGE surface invariants unaffected by the V7 layer.
    expect(document.querySelector('[data-vehicle-pet-size]')).not.toBeNull()
    expect(document.querySelector('[data-vehicle-pet="VISIBLE"]')).not.toBeNull()
  })
})
