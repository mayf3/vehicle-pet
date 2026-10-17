/**
 * PANEL_OPEN movement coordinate model (CTR-OVERLAY-003; R5 blocker
 * PANEL_OPEN_INPUT_COORDINATE_MOVEMENT_DEAD_ZONE).
 *
 * Every movement input — keyboard step, Shift+keyboard step, or pointer drag —
 * must start from the pet position that is actually rendered after the
 * PANEL_OPEN complete-active-surface clamp, never from the latent preference
 * anchor. Otherwise the first inputs walk an invisible anchor through the
 * clamp window (input applied, ratio persisted, zero visible movement) until
 * the latent anchor re-enters the visible range: the movement dead zone.
 *
 * Each focused input records one trace line:
 *   INPUT_TYPE / INPUT_DIRECTION / INPUT_APPLIED / MOVEMENT_SPACE_REMAINING /
 *   PERSISTED_RATIO_BEFORE / PERSISTED_RATIO_AFTER /
 *   VISIBLE_PET_POSITION_BEFORE / VISIBLE_PET_POSITION_AFTER /
 *   VISIBLE_ACTIVE_SURFACE_DELTA_PX
 * Invariant: whenever MOVEMENT_SPACE_REMAINING = YES and the input is
 * applied, VISIBLE_ACTIVE_SURFACE_DELTA_PX is nonzero in the input direction
 * on the FIRST input after opening the panel.
 */

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { VehiclePetOverlay } from '../../../src/dsh/client/VehiclePetOverlay'
import type { VehiclePetOverlayProps } from '../../../src/dsh/client/VehiclePetOverlay'
import { en, zh, type VehiclePetLocaleKey } from '../../../src/dsh/client/locales'
import { OVERLAY_PREFERENCES_KEY } from '../../../src/dsh/client/preferences'
import type { VehiclePetSessionView } from '../../../src/dsh/client/types'
import { OVERLAY_GEOMETRY } from '../../../src/dsh/client/types'

// jsdom does not implement pointer capture; the drag controller only needs
// the capture/release pair to exist so real drags reach the move handler.
if (typeof Element.prototype.setPointerCapture !== 'function') {
  Element.prototype.setPointerCapture = (): void => {}
  Element.prototype.releasePointerCapture = (): void => {}
  Element.prototype.hasPointerCapture = (): boolean => false
}

const IDLE_VIEW: VehiclePetSessionView = Object.freeze({ live: 'idle', terminal: null })
const SESSIONS_ON = { phase: 'ready', current: 's1', byId: { s1: { blank: false } } }

/** (0.49, 0.49) lands inside both PANEL_OPEN clamp bands on 390x844. */
const CENTERED_RATIOS = { x: 0.49, y: 0.49 }
const MARGIN = OVERLAY_GEOMETRY.viewportMarginPx
const EPSILON = 0.01

const MATRIX_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 720 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
] as const
const MATRIX_X_RATIOS = [0, 0.1, 0.25, 0.49, 0.5, 0.75, 0.9, 1] as const
const MATRIX_Y_RATIOS = [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1] as const
const POINTER_DELTAS = [-32, -8, -5, 5, 8, 32] as const

function t(key: VehiclePetLocaleKey, params?: Record<string, string>): string {
  let text: string = zh[key]
  for (const [name, value] of Object.entries(params ?? {})) {
    text = text.replace(`{${name}}`, value)
  }
  return text
}

interface Source {
  view: VehiclePetSessionView
  sessions: typeof SESSIONS_ON
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

function setViewport(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true, writable: true })
}

function seedPosition(xRatio: number, yRatio: number): string {
  const record = JSON.stringify({
    schemaVersion: 1,
    position: { xRatio, yRatio },
    positionCustomized: true,
    collapsed: false,
    reducedMotion: false,
  })
  window.localStorage.setItem(OVERLAY_PREFERENCES_KEY, record)
  return record
}

function storedRecord(): { schemaVersion: number; position: { xRatio: number; yRatio: number }; positionCustomized: boolean; collapsed: boolean; reducedMotion: boolean | undefined } {
  return JSON.parse(window.localStorage.getItem(OVERLAY_PREFERENCES_KEY) ?? '{}')
}

function shellPoint(): { x: number; y: number } {
  const shell = document.querySelector('.vpo-shell') as HTMLElement
  return { x: Number.parseFloat(shell.style.left), y: Number.parseFloat(shell.style.top) }
}

function activeSurface(): { left: number; top: number; right: number; bottom: number } {
  const root = document.querySelector('[data-vehicle-pet]') as HTMLElement
  return {
    left: Number.parseFloat(root.dataset.activeSurfaceLeft ?? ''),
    top: Number.parseFloat(root.dataset.activeSurfaceTop ?? ''),
    right: Number.parseFloat(root.dataset.activeSurfaceRight ?? ''),
    bottom: Number.parseFloat(root.dataset.activeSurfaceBottom ?? ''),
  }
}

function panelOrientation(): { horizontal: string; vertical: string } {
  const panel = document.querySelector('[data-vehicle-pet-panel]') as HTMLElement
  return { horizontal: panel.dataset.horizontal ?? '', vertical: panel.dataset.vertical ?? '' }
}

function expectSurfaceInsideViewport(): void {
  const surface = activeSurface()
  expect(surface.left).toBeGreaterThanOrEqual(MARGIN - EPSILON)
  expect(surface.top).toBeGreaterThanOrEqual(MARGIN - EPSILON)
  expect(surface.right).toBeLessThanOrEqual(window.innerWidth - MARGIN + EPSILON)
  expect(surface.bottom).toBeLessThanOrEqual(window.innerHeight - MARGIN + EPSILON)
}

type Direction = 'left' | 'right' | 'up' | 'down'

/** Direction has room when that active-surface edge is not at the viewport margin. */
function spaceRemaining(direction: Direction): boolean {
  const surface = activeSurface()
  if (direction === 'left') return surface.left > MARGIN + EPSILON
  if (direction === 'right') return surface.right < window.innerWidth - MARGIN - EPSILON
  if (direction === 'up') return surface.top > MARGIN + EPSILON
  return surface.bottom < window.innerHeight - MARGIN - EPSILON
}

interface MovementRecord {
  INPUT_TYPE: 'keyboard' | 'pointer'
  INPUT_DIRECTION: Direction
  INPUT_APPLIED: boolean
  MOVEMENT_SPACE_REMAINING: boolean
  PERSISTED_RATIO_BEFORE: string
  PERSISTED_RATIO_AFTER: string
  VISIBLE_PET_POSITION_BEFORE: string
  VISIBLE_PET_POSITION_AFTER: string
  VISIBLE_ACTIVE_SURFACE_DELTA_PX: number
}

const SURFACE_EDGE: Record<Direction, 'left' | 'right' | 'top' | 'bottom'> = {
  left: 'left', right: 'right', up: 'top', down: 'bottom',
}

const formatRatio = (ratio: { xRatio: number; yRatio: number }): string => `${ratio.xRatio},${ratio.yRatio}`
const formatPoint = (point: { x: number; y: number }): string => `${point.x},${point.y}`

/** The parameter matrix silences per-input lines and reports violations only. */
let quietLogging = false

function logRecord(record: MovementRecord): void {
  if (quietLogging) return
  console.log(`PANEL_OPEN_MOVEMENT_RECORD input=${record.INPUT_TYPE} direction=${record.INPUT_DIRECTION}`
    + ` applied=${record.INPUT_APPLIED ? 'YES' : 'NO'} spaceRemaining=${record.MOVEMENT_SPACE_REMAINING ? 'YES' : 'NO'}`
    + ` ratioBefore=<${record.PERSISTED_RATIO_BEFORE}> ratioAfter=<${record.PERSISTED_RATIO_AFTER}>`
    + ` visibleBefore=<${record.VISIBLE_PET_POSITION_BEFORE}> visibleAfter=<${record.VISIBLE_PET_POSITION_AFTER}>`
    + ` deltaPx=${record.VISIBLE_ACTIVE_SURFACE_DELTA_PX}`)
}

async function renderOverlay(source: Source = { view: IDLE_VIEW, sessions: SESSIONS_ON, locale: 'zh' }) {
  const view = render(<VehiclePetOverlay {...stubProps(source)} />)
  await waitFor(() => {
    expect(screen.queryByRole('button', { name: t('overlay.label', { state: t('state.idle') }) })).not.toBeNull()
  })
  return view
}

async function openPanel(): Promise<HTMLElement> {
  const pet = screen.getByRole('button', { name: t('overlay.label', { state: t('state.idle') }) })
  fireEvent.click(pet)
  await screen.findByRole('group', { name: t('panel.title') })
  return pet
}

function closePanel(pet: HTMLElement): void {
  fireEvent.click(pet)
}

const ARROW_FOR: Record<Direction, string> = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' }

/** One keyboard input; returns the audit record. */
function pressArrow(pet: HTMLElement, direction: Direction, shiftKey = false): MovementRecord {
  const ratioBefore = storedRecord().position
  const visibleBefore = shellPoint()
  const surfaceBefore = activeSurface()[SURFACE_EDGE[direction]]
  const remaining = spaceRemaining(direction)
  fireEvent.keyDown(pet, { key: ARROW_FOR[direction], shiftKey })
  const delta = activeSurface()[SURFACE_EDGE[direction]] - surfaceBefore
  const record: MovementRecord = {
    INPUT_TYPE: 'keyboard',
    INPUT_DIRECTION: direction,
    INPUT_APPLIED: formatRatio(ratioBefore) !== formatRatio(storedRecord().position),
    MOVEMENT_SPACE_REMAINING: remaining,
    PERSISTED_RATIO_BEFORE: formatRatio(ratioBefore),
    PERSISTED_RATIO_AFTER: formatRatio(storedRecord().position),
    VISIBLE_PET_POSITION_BEFORE: formatPoint(visibleBefore),
    VISIBLE_PET_POSITION_AFTER: formatPoint(shellPoint()),
    VISIBLE_ACTIVE_SURFACE_DELTA_PX: Number(delta.toFixed(2)),
  }
  logRecord(record)
  return record
}

/** One pointer drag toward `direction` by `distance` px; returns the audit record. */
function dragPet(pet: HTMLElement, direction: Direction, distance: number): MovementRecord {
  const sign = direction === 'left' || direction === 'up' ? -1 : 1
  const ratioBefore = storedRecord().position
  const visibleBefore = shellPoint()
  const surfaceBefore = activeSurface()[SURFACE_EDGE[direction]]
  const remaining = spaceRemaining(direction)
  const startX = 200
  const startY = 400
  fireEvent.pointerDown(pet, { pointerId: 1, button: 0, clientX: startX, clientY: startY })
  fireEvent.pointerMove(pet, {
    pointerId: 1,
    clientX: startX + (direction === 'left' || direction === 'right' ? sign * distance : 0),
    clientY: startY + (direction === 'up' || direction === 'down' ? sign * distance : 0),
  })
  const visibleAfter = shellPoint()
  const delta = activeSurface()[SURFACE_EDGE[direction]] - surfaceBefore
  fireEvent.pointerUp(pet, { pointerId: 1, clientX: startX, clientY: startY })
  // A real browser fires the click after pointerup; the app suppresses it.
  fireEvent.click(pet)
  const record: MovementRecord = {
    INPUT_TYPE: 'pointer',
    INPUT_DIRECTION: direction,
    INPUT_APPLIED: true,
    MOVEMENT_SPACE_REMAINING: remaining,
    PERSISTED_RATIO_BEFORE: formatRatio(ratioBefore),
    PERSISTED_RATIO_AFTER: formatRatio(storedRecord().position),
    VISIBLE_PET_POSITION_BEFORE: formatPoint(visibleBefore),
    VISIBLE_PET_POSITION_AFTER: formatPoint(visibleAfter),
    VISIBLE_ACTIVE_SURFACE_DELTA_PX: Number(delta.toFixed(2)),
  }
  logRecord(record)
  return record
}

/** Immediacy floor: any real first movement (steps 8/32, drags ≥5) clears it. */
const IMMEDIACY_FLOOR_PX = 2

function expectImmediateMovement(record: MovementRecord): void {
  expect(record.MOVEMENT_SPACE_REMAINING).toBe(true)
  expect(record.INPUT_APPLIED).toBe(true)
  expect(Math.abs(record.VISIBLE_ACTIVE_SURFACE_DELTA_PX)).toBeGreaterThanOrEqual(IMMEDIACY_FLOOR_PX)
  if (record.INPUT_DIRECTION === 'left' || record.INPUT_DIRECTION === 'up') {
    expect(record.VISIBLE_ACTIVE_SURFACE_DELTA_PX).toBeLessThan(0)
  } else {
    expect(record.VISIBLE_ACTIVE_SURFACE_DELTA_PX).toBeGreaterThan(0)
  }
}

/**
 * Apply one first-input from a freshly (re)opened PANEL_OPEN state and assert
 * the frozen semantics: with space the delta is strictly directional; at the
 * boundary the toward-input delta is exactly zero.
 */
function freshFirstInput(apply: () => MovementRecord): MovementRecord {
  const record = apply()
  expectSurfaceInsideViewport()
  if (record.MOVEMENT_SPACE_REMAINING) {
    expectImmediateMovement(record)
  } else {
    expect(record.VISIBLE_ACTIVE_SURFACE_DELTA_PX).toBe(0)
  }
  return record
}

/** Wrap the shared in-memory Storage instance to count writes. */
function spyOnStorageWrites(): { writeCount: () => number; restore: () => void } {
  const store = window.localStorage
  const original = store.setItem.bind(store)
  let calls = 0
  store.setItem = (...args: Parameters<typeof original>) => {
    calls += 1
    return original(...args)
  }
  return { writeCount: () => calls, restore: () => {
    store.setItem = original
  } }
}

beforeEach(() => {
  window.localStorage.clear()
  setViewport(390, 844)
})

afterEach(() => {
  cleanup()
})

describe('VehiclePetOverlay PANEL_OPEN movement coordinate gates', () => {
  it('PANEL_OPEN_OPEN_CLOSE_WITHOUT_INPUT_PRESERVES_ANCHOR_TEST opening and closing alone never rewrites the position', async () => {
    const seeded = seedPosition(CENTERED_RATIOS.x, CENTERED_RATIOS.y)
    await renderOverlay()
    const userAnchor = shellPoint()
    const pet = await openPanel()
    const duringOpen = shellPoint()
    expect(window.localStorage.getItem(OVERLAY_PREFERENCES_KEY)).toBe(seeded)
    closePanel(pet)
    await waitFor(() => expect(screen.queryByRole('group', { name: t('panel.title') })).toBeNull())
    // Without any movement input the pet returns to the original user anchor.
    expect(shellPoint()).toEqual(userAnchor)
    expect(window.localStorage.getItem(OVERLAY_PREFERENCES_KEY)).toBe(seeded)
    // Reopening reproduces the same clamped projection without writing, and
    // the panel flip alone (left/right, above/below) never writes either.
    await openPanel()
    expect(shellPoint()).toEqual(duringOpen)
    expect(window.localStorage.getItem(OVERLAY_PREFERENCES_KEY)).toBe(seeded)
  })

  it('PANEL_OPEN_FIRST_KEYBOARD_STEP_MOVES_TEST first keyboard step and Shift step move visibly', async () => {
    seedPosition(CENTERED_RATIOS.x, CENTERED_RATIOS.y)
    await renderOverlay()
    const pet = await openPanel()
    const first = pressArrow(pet, 'left')
    expectImmediateMovement(first)
    expect(first.VISIBLE_ACTIVE_SURFACE_DELTA_PX).toBe(-8)
    expect(shellPoint().x).toBe(46)
    const shift = pressArrow(pet, 'up', true)
    expectImmediateMovement(shift)
    expect(shift.VISIBLE_ACTIVE_SURFACE_DELTA_PX).toBe(-32)
    expect(shellPoint().y).toBe(236)
  })

  it('PANEL_OPEN_FIRST_POINTER_DRAG_MOVES_TEST first small pointer drag moves visibly and persists a normalized ratio', async () => {
    seedPosition(CENTERED_RATIOS.x, CENTERED_RATIOS.y)
    await renderOverlay()
    const pet = await openPanel()
    const record = dragPet(pet, 'left', 12)
    expectImmediateMovement(record)
    expect(record.VISIBLE_ACTIVE_SURFACE_DELTA_PX).toBe(-12)
    const position = storedRecord().position
    expect(position.xRatio).toBeGreaterThanOrEqual(0)
    expect(position.xRatio).toBeLessThanOrEqual(1)
    expect(Number.isFinite(position.xRatio)).toBe(true)
    // The drag moved the surface, it did not toggle the panel.
    expect(screen.queryByRole('group', { name: t('panel.title') })).not.toBeNull()
  })

  it('PANEL_OPEN_BOUNDARY_OPPOSITE_DIRECTION_TEST boundary toward-input is zero, opposite input moves immediately', async () => {
    seedPosition(CENTERED_RATIOS.x, CENTERED_RATIOS.y)
    await renderOverlay()
    const pet = await openPanel()
    // Walk left to the union boundary, then verify both boundary rules.
    for (let guard = 0; guard < 40 && spaceRemaining('left'); guard += 1) {
      pressArrow(pet, 'left')
    }
    expect(spaceRemaining('left')).toBe(false)
    const toward = pressArrow(pet, 'left')
    expect(toward.VISIBLE_ACTIVE_SURFACE_DELTA_PX).toBe(0)
    expectImmediateMovement(pressArrow(pet, 'right'))
    expectSurfaceInsideViewport()
  })

  it('PANEL_OPEN_MOVEMENT_COMMITS_CANONICAL_RATIO_TEST the persisted ratio is recomputed from the visible anchor', async () => {
    seedPosition(CENTERED_RATIOS.x, CENTERED_RATIOS.y)
    await renderOverlay()
    const pet = await openPanel()
    pressArrow(pet, 'left')
    pressArrow(pet, 'up', true)
    const visible = shellPoint()
    const availableX = window.innerWidth - 112 - MARGIN * 2
    const availableY = window.innerHeight - 112 - MARGIN * 2
    const record = storedRecord()
    expect(record.position.xRatio).toBeCloseTo((visible.x - MARGIN) / availableX, 9)
    expect(record.position.yRatio).toBeCloseTo((visible.y - MARGIN) / availableY, 9)
    expect(record.positionCustomized).toBe(true)
    expect(record.collapsed).toBe(false)
    // No panel-flip or transient key leaked into the preference record.
    expect(Object.keys(record).sort()).toEqual(['collapsed', 'position', 'positionCustomized', 'reducedMotion', 'schemaVersion'])
    // Closing the panel keeps the pet on the moved position.
    closePanel(pet)
    await waitFor(() => expect(screen.queryByRole('group', { name: t('panel.title') })).toBeNull())
    expect(Math.abs(shellPoint().x - visible.x)).toBeLessThanOrEqual(0.5)
    expect(Math.abs(shellPoint().y - visible.y)).toBeLessThanOrEqual(0.5)
  })

  it('PANEL_OPEN_REFRESH_RESTORES_MOVED_POSITION_TEST reload restores the moved position without a dead zone', async () => {
    seedPosition(CENTERED_RATIOS.x, CENTERED_RATIOS.y)
    const view = await renderOverlay()
    const pet = await openPanel()
    pressArrow(pet, 'left')
    pressArrow(pet, 'up')
    const moved = shellPoint()

    view.unmount()
    cleanup()
    await renderOverlay()
    const reloadPet = await openPanel()
    expect(Math.abs(shellPoint().x - moved.x)).toBeLessThanOrEqual(0.5)
    expect(Math.abs(shellPoint().y - moved.y)).toBeLessThanOrEqual(0.5)
    expectImmediateMovement(pressArrow(reloadPet, 'left'))
  })

  it('PANEL_OPEN_RESIZE_HAS_NO_DEAD_ZONE_TEST resize clamps and the first input still moves', async () => {
    seedPosition(CENTERED_RATIOS.x, CENTERED_RATIOS.y)
    await renderOverlay()
    const pet = await openPanel()
    setViewport(360, 740)
    fireEvent(window, new Event('resize'))
    await waitFor(() => expect(activeSurface().right).toBeLessThanOrEqual(360 - MARGIN + EPSILON))
    expectSurfaceInsideViewport()
    expectImmediateMovement(pressArrow(pet, 'up'))
  })

  it('PANEL_OPEN_MULTITAB_MOVEMENT_SYNC_TEST a same-origin storage adoption shows the same position without writes', async () => {
    seedPosition(CENTERED_RATIOS.x, CENTERED_RATIOS.y)
    await renderOverlay()
    const pet = await openPanel()
    const spy = spyOnStorageWrites()
    const otherTab = JSON.stringify({
      schemaVersion: 1,
      position: { xRatio: 0.98, yRatio: 0.03 },
      positionCustomized: true,
      collapsed: false,
      reducedMotion: false,
    })
    fireEvent(window, new StorageEvent('storage', { key: OVERLAY_PREFERENCES_KEY, newValue: otherTab }))
    await waitFor(() => {
      const availableX = window.innerWidth - 112 - MARGIN * 2
      const availableY = window.innerHeight - 112 - MARGIN * 2
      expect(shellPoint().x).toBeCloseTo(MARGIN + availableX * 0.98, 6)
      expect(shellPoint().y).toBeCloseTo(MARGIN + availableY * 0.03, 6)
    })
    expectSurfaceInsideViewport()
    // Adoption itself performs no write (no cross-tab write loop).
    expect(spy.writeCount()).toBe(0)
    expectImmediateMovement(pressArrow(pet, 'left'))
    spy.restore()
  })
})

describe('VehiclePetOverlay PANEL_OPEN movement parameter matrix', () => {
  /** 4 viewports × 8 x ratios × 7 y ratios × {8 keyboard inputs, 12 signed pointer deltas}. */
  const KEYBOARD_CASES: readonly { step: number; shift: boolean }[] = [
    { step: 8, shift: false },
    { step: 32, shift: true },
  ]
  const DIRECTIONS: readonly Direction[] = ['left', 'right', 'up', 'down']

  const orientations = new Set<string>()

  async function runMatrixCase(width: number, height: number, xRatio: number, yRatio: number): Promise<void> {
    setViewport(width, height)
    seedPosition(xRatio, yRatio)
    await renderOverlay()
    const pet = await openPanel()
    expectSurfaceInsideViewport()
    orientations.add(`${panelOrientation().horizontal}/${panelOrientation().vertical}`)

    // All eight keyboard inputs, each from a freshly reopened panel.
    for (const direction of DIRECTIONS) {
      for (const { step, shift } of KEYBOARD_CASES) {
        closePanel(pet)
        await openPanel()
        const record = freshFirstInput(() => pressArrow(pet, direction, shift))
        if (record.MOVEMENT_SPACE_REMAINING) {
          expect(Math.abs(record.VISIBLE_ACTIVE_SURFACE_DELTA_PX)).toBeLessThanOrEqual(step + EPSILON)
        }
      }
    }

    // All six signed pointer magnitudes along both axes, each from a fresh reopen.
    for (const axis of ['x', 'y'] as const) {
      for (const delta of POINTER_DELTAS) {
        const direction: Direction = axis === 'x' ? (delta < 0 ? 'left' : 'right') : (delta < 0 ? 'up' : 'down')
        closePanel(pet)
        await openPanel()
        const record = freshFirstInput(() => dragPet(pet, direction, Math.abs(delta)))
        if (record.MOVEMENT_SPACE_REMAINING) {
          expect(Math.abs(record.VISIBLE_ACTIVE_SURFACE_DELTA_PX)).toBeLessThanOrEqual(Math.abs(delta) + EPSILON)
        }
      }
    }
    cleanup()
  }

  for (const viewport of MATRIX_VIEWPORTS) {
    it(`PANEL_OPEN_ALL_DIRECTIONS_TEST viewport ${viewport.width}x${viewport.height} every ratio, step, and drag moves or stops exactly at the boundary`, async () => {
      quietLogging = true
      try {
        for (const xRatio of MATRIX_X_RATIOS) {
          for (const yRatio of MATRIX_Y_RATIOS) {
            await runMatrixCase(viewport.width, viewport.height, xRatio, yRatio)
          }
        }
      } finally {
        quietLogging = false
      }
    }, 600_000)
  }

  it('PANEL_OPEN_ALL_PANEL_ORIENTATIONS_TEST every panel orientation occurred in the matrix', () => {
    expect(orientations).toContain('left/below')
    expect(orientations).toContain('left/above')
    expect(orientations).toContain('right/below')
    expect(orientations).toContain('right/above')
  })
})
