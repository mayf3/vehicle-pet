import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PLAYFUL_REACTIONS, usePlayfulReaction } from '../../../src/dsh/client/playful-reactions'

const idle = { state: 'idle' as const, terminalIdentity: null, petId: 'vehicle', menuOpen: false, dragging: false, ambientKey: null }
beforeEach(() => {
  vi.useFakeTimers()
  Object.defineProperty(document, 'hidden', { configurable: true, value: false })
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

it('reaches all eight reactions, replaces its one timer, and expires without replay', () => {
  const { result, unmount } = renderHook(() => usePlayfulReaction(idle))
  expect(result.current.reaction).toBeNull()
  for (const reaction of PLAYFUL_REACTIONS) {
    act(() => result.current.play())
    expect(result.current.reaction?.definition.id).toBe(reaction.id)
    expect(vi.getTimerCount()).toBe(1)
  }
  act(() => vi.advanceTimersByTime(2400))
  expect(result.current.reaction).toBeNull()
  expect(vi.getTimerCount()).toBe(0)
  act(() => result.current.play())
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})

it('prioritizes real task state and does not replay historical completion on mount', () => {
  const completed = { ...idle, state: 'completed' as const, terminalIdentity: 'turn1' }
  const { result, rerender } = renderHook(usePlayfulReaction, { initialProps: completed })
  expect(result.current.reaction).toBeNull()
  act(() => result.current.play())
  expect(result.current.reaction).toBeNull()
  rerender({ ...completed, terminalIdentity: 'turn2' })
  expect(result.current.reaction?.definition.id).toBe('bounce')
  act(() => vi.advanceTimersByTime(2400))
  rerender({ ...completed, terminalIdentity: 'turn2' })
  expect(result.current.reaction).toBeNull()
})

it('cancels on menu, drag, character switch and hide; never queues hidden interactions', () => {
  const { result, rerender } = renderHook(usePlayfulReaction, { initialProps: { ...idle, petId: 'vehicle' } })
  for (const blocked of [{ menuOpen: true }, { dragging: true }]) {
    act(() => result.current.play())
    rerender({ ...idle, ...blocked })
    expect(result.current.reaction).toBeNull()
    act(() => result.current.play())
    expect(result.current.reaction).toBeNull()
    rerender(idle)
  }
  act(() => result.current.play())
  rerender({ ...idle, petId: 'companion' })
  expect(result.current.reaction).toBeNull()
  act(() => result.current.play())
  act(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })
  expect(result.current.reaction).toBeNull()
  act(() => result.current.play())
  expect(result.current.reaction).toBeNull()
  expect(vi.getTimerCount()).toBe(0)
})

it('uses fresh ambient bubble keys once without adding an interval', () => {
  const { result, rerender } = renderHook(usePlayfulReaction, { initialProps: { ...idle, ambientKey: 1 as number | null } })
  expect(result.current.reaction).toBeNull()
  rerender({ ...idle, ambientKey: 2 })
  expect(result.current.reaction?.definition.id).toBe('wave')
  const key = result.current.reaction?.key
  rerender({ ...idle, ambientKey: 2 })
  expect(result.current.reaction?.key).toBe(key)
  act(() => vi.advanceTimersByTime(2400))
  expect(vi.getTimerCount()).toBe(0)
})

it('adopts live OS reduced-motion changes and disposes the listener', () => {
  const media = new EventTarget() as MediaQueryList
  Object.defineProperty(media, 'matches', { configurable: true, value: true })
  const remove = vi.spyOn(media, 'removeEventListener')
  vi.stubGlobal('matchMedia', () => media)
  const { result, unmount } = renderHook(() => usePlayfulReaction(idle))
  expect(result.current.reduced).toBe(true)
  act(() => {
    Object.defineProperty(media, 'matches', { configurable: true, value: false })
    media.dispatchEvent(new Event('change'))
  })
  expect(result.current.reduced).toBe(false)
  act(() => result.current.play())
  expect(result.current.reduced).toBe(false)
  act(() => {
    Object.defineProperty(media, 'matches', { configurable: true, value: true })
    media.dispatchEvent(new Event('change'))
  })
  act(() => {
    Object.defineProperty(media, 'matches', { configurable: true, value: false })
    media.dispatchEvent(new Event('change'))
  })
  expect(result.current.reaction).not.toBeNull()
  expect(result.current.reduced).toBe(true)
  act(() => result.current.play())
  expect(result.current.reduced).toBe(false)
  unmount()
  expect(remove).toHaveBeenCalledWith('change', expect.any(Function))
  vi.unstubAllGlobals()
})
