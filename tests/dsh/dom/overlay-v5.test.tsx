import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ActiveSessionFooter } from '../../../src/dsh/client/ActiveSessionFooter'
import { activeSessionsFromList } from '../../../src/dsh/client/active-sessions'
import { useVehiclePetSpeech } from '../../../src/dsh/client/VehiclePetSpeech'
import type { VehiclePetSessionView, PetId } from '../../../src/dsh/client/types'

const idle: VehiclePetSessionView = { live: 'idle', terminal: null }
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

describe('V5 active session metadata', () => {
  it('shows only listed active rows, current first, sanitizes and bounds titles', () => {
    const rows = activeSessionsFromList({ current: 'z', ids: ['a', 'z', 'idle', 'missing', 'path'], byId: {
      a: { running: true, title: 'A\u202e\nB' }, z: { pendingInteraction: 'permission', title: '🐴'.repeat(100) },
      idle: { title: 'private idle text' }, hidden: { running: true, title: 'unlisted' }, path: { running: true, title: '/private/folder' },
    } })
    expect(rows.map(row => row.id)).toEqual(['z', 'a', 'path'])
    expect(Array.from(rows[0]!.title)).toHaveLength(80)
    expect(rows[1]!.title).toBe('A  B')
    expect(rows[2]!.title).toBe('')
  })
  it('rotates every six seconds, updates metadata, and disposes the timer', () => {
    vi.useFakeTimers()
    const sessions = [{ id: '1', title: '<b>First</b>', pending: false }, { id: '2', title: '', pending: true }]
    const view = render(<ActiveSessionFooter sessions={sessions} locale="en" />)
    expect(screen.getByText('<b>First</b>')).toBeTruthy()
    expect(view.container.querySelector('b')).toBeNull()
    act(() => vi.advanceTimersByTime(6000))
    expect(screen.getByText('Untitled session')).toBeTruthy()
    expect(screen.getByText('Needs input · 2')).toBeTruthy()
    view.rerender(<ActiveSessionFooter sessions={[]} locale="zh" />)
    expect(screen.getByText('暂无活跃会话')).toBeTruthy()
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('V5 continuous shared random speech', () => {
  it.each(['idle', 'running', 'needs-input'] as const)('continues beyond three lines in %s without repeats', live => {
    vi.useFakeTimers(); vi.setSystemTime(100000)
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    const hook = renderHook(() => useVehiclePetSpeech({ sessionView: { ...idle, live }, locale: 'zh', enabled: true, random: () => 0 }))
    const texts: string[] = []
    for (let i = 0; i < 6; i++) {
      act(() => vi.advanceTimersByTime(20000))
      expect(hook.result.current.bubble).not.toBeNull()
      const text = hook.result.current.bubble!.text
      expect(text).not.toBe(texts.at(-1)); texts.push(text)
    }
    hook.unmount(); expect(vi.getTimerCount()).toBe(0)
  })
  it('preserves deadlines on character switch and skips typing/background attempts without catchup', () => {
    vi.useFakeTimers(); vi.setSystemTime(100000)
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
    const hook = renderHook(({ petId }: { petId: PetId }) => useVehiclePetSpeech({ sessionView: idle, locale: 'zh', enabled: true, petId, random: () => 0 }), { initialProps: { petId: 'vehicle' as PetId } })
    act(() => vi.advanceTimersByTime(19000))
    act(() => document.dispatchEvent(new KeyboardEvent('keydown')))
    act(() => vi.advanceTimersByTime(1000))
    expect(hook.result.current.bubble).toBeNull()
    hook.rerender({ petId: 'companion' })
    act(() => vi.advanceTimersByTime(19000))
    expect(hook.result.current.bubble).toBeNull()
    act(() => vi.advanceTimersByTime(1000))
    expect(hook.result.current.bubble).not.toBeNull()
    hidden.mockReturnValue(true)
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    act(() => vi.advanceTimersByTime(60000))
    expect(hook.result.current.bubble).toBeNull()
    hidden.mockReturnValue(false)
    act(() => document.dispatchEvent(new Event('visibilitychange')))
    act(() => vi.advanceTimersByTime(19000))
    expect(hook.result.current.bubble).toBeNull()
    act(() => vi.advanceTimersByTime(1000))
    expect(hook.result.current.bubble).not.toBeNull()
  })
})
