/**
 * Deterministic gesture arbitration (DSH_PET_OVERLAY_ADAPTER_V7
 * CTR-OVERLAY-029; ACC-OVERLAY-127): click/double-click/petting/drag never
 * misfire. Goal §24 cases: PET_SINGLE_CLICK, PET_DOUBLE_CLICK, PET_LONG_PRESS,
 * PETTING_RELEASE, DRAG_GESTURE_ARBITRATION,
 * LONG_PRESS_DOES_NOT_DOUBLE_CLICK, DOUBLE_CLICK_DOES_NOT_FIRE_TWO_SPEECH_
 * BUBBLES, CLICK_DOES_NOT_DRAG, DRAG_DOES_NOT_CLICK,
 * DROP_DOES_NOT_TRIGGER_ACCIDENTAL_CLICK.
 */

import { describe, expect, it } from 'vitest'
import {
  GESTURE_DRAG_THRESHOLD_PX, GESTURE_DOUBLE_CLICK_MS, GESTURE_PETTING_HOLD_MS,
  INITIAL_GESTURE_STATE, isPettingHoldDue, promoteToPetting, reduceGesture,
} from '../../../src/dsh/client/gesture-rules'

const T0 = 1000000
const at = (offset: number): number => T0 + offset
const point = (x: number, y: number) => ({ x, y })

describe('DRAG_GESTURE_ARBITRATION (V7 CTR-029 constants and bands)', () => {
  it('declares the recorded constants inside their V7 bands', () => {
    expect(GESTURE_PETTING_HOLD_MS).toBeGreaterThanOrEqual(400)
    expect(GESTURE_PETTING_HOLD_MS).toBeLessThanOrEqual(800)
    expect(GESTURE_DRAG_THRESHOLD_PX).toBe(4)
    expect(GESTURE_DOUBLE_CLICK_MS).toBeGreaterThan(0)
  })
})

describe('PET_SINGLE_CLICK / CLICK_DOES_NOT_DRAG', () => {
  it('a quick stationary release is a single click, never a drag or petting', () => {
    let state = INITIAL_GESTURE_STATE
    let result = reduceGesture(state, { type: 'press', at: at(0), point: point(10, 10) })
    state = result.state
    expect(state.phase).toBe('pressed')
    // Jitter below the drag threshold never becomes a drag.
    result = reduceGesture(state, { type: 'move', at: at(60), point: point(12, 11) })
    state = result.state
    expect(result.verdict.kind).toBe('none')
    expect(state.phase).toBe('pressed')
    expect(isPettingHoldDue(state, at(60))).toBe(false)
    result = reduceGesture(state, { type: 'release', at: at(120), point: point(12, 11) })
    expect(result.verdict).toEqual({ kind: 'click', doubleClick: false })
    expect(result.state.phase).toBe('idle')
  })
})

describe('PET_DOUBLE_CLICK / DOUBLE_CLICK_DOES_NOT_FIRE_TWO_SPEECH_BUBBLES', () => {
  it('the second click inside the window carries the double-click verdict; one reaction verdict per sequence', () => {
    let state = INITIAL_GESTURE_STATE
    let result = reduceGesture(state, { type: 'press', at: at(0), point: point(10, 10) })
    state = result.state
    result = reduceGesture(state, { type: 'release', at: at(50), point: point(10, 10) })
    expect(result.verdict).toEqual({ kind: 'click', doubleClick: false })
    result = reduceGesture(state, { type: 'press', at: at(120), point: point(10, 10) })
    state = result.state
    result = reduceGesture(state, { type: 'release', at: at(160), point: point(10, 10) })
    expect(result.verdict).toEqual({ kind: 'click', doubleClick: true })
    // A third click after the window is an ordinary single click again.
    result = reduceGesture(state, { type: 'press', at: at(2000), point: point(10, 10) })
    state = result.state
    result = reduceGesture(state, { type: 'release', at: at(2040), point: point(10, 10) })
    expect(result.verdict).toEqual({ kind: 'click', doubleClick: false })
  })
})

describe('PET_LONG_PRESS / PETTING_RELEASE / LONG_PRESS_DOES_NOT_DOUBLE_CLICK', () => {
  it('a stationary hold promotes to petting and releases without any click verdict', () => {
    let state = INITIAL_GESTURE_STATE
    let result = reduceGesture(state, { type: 'press', at: at(0), point: point(10, 10) })
    state = result.state
    expect(isPettingHoldDue(state, at(GESTURE_PETTING_HOLD_MS - 1))).toBe(false)
    expect(isPettingHoldDue(state, at(GESTURE_PETTING_HOLD_MS))).toBe(true)
    const promotion = promoteToPetting(state)
    expect(promotion.verdict.kind).toBe('petting-start')
    state = promotion.state
    expect(state.petting).toBe(true)
    // The hold may not drift into a click, and release is a settle, not a click.
    result = reduceGesture(state, { type: 'release', at: at(GESTURE_PETTING_HOLD_MS + 400), point: point(10, 10) })
    expect(result.verdict.kind).toBe('petting-release')
    expect(result.state.phase).toBe('petting-release')
    expect(result.state.petting).toBe(false)
    // The next press starts a fresh session whose first click is not a double.
    result = reduceGesture(result.state, { type: 'press', at: at(GESTURE_PETTING_HOLD_MS + 500), point: point(10, 10) })
    state = result.state
    result = reduceGesture(state, { type: 'release', at: at(GESTURE_PETTING_HOLD_MS + 540), point: point(10, 10) })
    expect(result.verdict).toEqual({ kind: 'click', doubleClick: false })
  })

  it('a press right after petting-release is not a double-click: the suppressed click left no trace', () => {
    let state = INITIAL_GESTURE_STATE
    let result = reduceGesture(state, { type: 'press', at: at(0), point: point(10, 10) })
    state = result.state
    const promotion = promoteToPetting(state)
    state = promotion.state
    result = reduceGesture(state, { type: 'release', at: at(700), point: point(10, 10) })
    expect(result.verdict.kind).toBe('petting-release')
    result = reduceGesture(result.state, { type: 'press', at: at(900), point: point(10, 10) })
    state = result.state
    result = reduceGesture(state, { type: 'release', at: at(940), point: point(10, 10) })
    expect(result.verdict).toEqual({ kind: 'click', doubleClick: false })
  })
})

describe('DRAG_DOES_NOT_CLICK / DROP_DOES_NOT_TRIGGER_ACCIDENTAL_CLICK', () => {
  it('movement past the threshold drags; release drops without a click verdict', () => {
    let state = INITIAL_GESTURE_STATE
    let result = reduceGesture(state, { type: 'press', at: at(0), point: point(10, 10) })
    state = result.state
    result = reduceGesture(state, { type: 'move', at: at(80), point: point(30, 12) })
    expect(result.verdict.kind).toBe('drag-start')
    state = result.state
    expect(state.phase).toBe('dragged')
    result = reduceGesture(state, { type: 'release', at: at(200), point: point(30, 12) })
    expect(result.verdict.kind).toBe('drop')
    state = result.state
    expect(state.phase).toBe('drop')
    // The trailing synthetic click after a drop finds no pressed session.
    result = reduceGesture(state, { type: 'release', at: at(220), point: point(30, 12) })
    expect(result.verdict.kind).toBe('none')
    // A drag interrupting a petting hold cancels it instead of drag-starting twice.
    result = reduceGesture(state, { type: 'press', at: at(400), point: point(30, 12) })
    state = result.state
    const promotion = promoteToPetting(state)
    state = promotion.state
    result = reduceGesture(state, { type: 'move', at: at(1200), point: point(80, 12) })
    expect(result.verdict.kind).toBe('cancel')
    expect(result.state.phase).toBe('dragged')
  })

  it('pointercancel returns to idle without verdicts and without leaking a press', () => {
    let state = INITIAL_GESTURE_STATE
    let result = reduceGesture(state, { type: 'press', at: at(0), point: point(10, 10) })
    state = result.state
    result = reduceGesture(state, { type: 'cancel', at: at(50) })
    expect(result.verdict.kind).toBe('cancel')
    expect(result.state.phase).toBe('idle')
    expect(isPettingHoldDue(result.state, at(10000))).toBe(false)
  })
})
