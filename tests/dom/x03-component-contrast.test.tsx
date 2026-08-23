import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocked = vi.hoisted(() => ({ context: null as unknown }))
vi.mock('../../src/react/PetEngineProvider', () => ({ usePetEngine: () => mocked.context }))
import { DailyGreeting } from '../../src/react/DailyGreeting'
import { HostActivityFeedback } from '../../src/react/HostActivityFeedback'
import { EngineStyles } from '../../src/react/styles'

afterEach(cleanup)

function rgb(value: string): [number, number, number] {
  const values = value.match(/[\d.]+/g)?.slice(0, 3).map(Number)
  if (values?.length !== 3) throw new Error(`unparseable color: ${value}`)
  return values as [number, number, number]
}

function luminance(color: string): number {
  const linear = rgb(color).map((channel) => {
    const normalized = channel / 255
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!
}

function contrast(element: Element): number {
  const style = getComputedStyle(element)
  const foreground = luminance(style.color)
  const background = luminance(style.backgroundColor)
  return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05)
}

describe('X03 rendered component contrast', () => {
  it('keeps the actual DailyGreeting status at WCAG AA contrast', () => {
    mocked.context = {
      greeting: { localDay: '2026-08-22', variantIndex: 0 },
      dismissGreeting: vi.fn(),
      copy: { greetingVariants: ['Welcome back'], skip: 'Dismiss' },
    }
    const { container } = render(<><EngineStyles /><DailyGreeting /></>)
    expect(contrast(container.querySelector('[data-pet-greeting="true"]')!)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(['completed', 'failed', 'cancelled'] as const)('keeps the actual %s Host feedback at WCAG AA contrast', (status) => {
    mocked.context = {
      snapshot: { hostFeedback: { status, activityId: `activity-${status}`, eventId: `event-${status}` } },
      copy: { hostCompleted: 'Completed', hostFailed: 'Failed', hostCancelled: 'Cancelled' },
      clearHostFeedback: vi.fn(),
    }
    const { container } = render(<><EngineStyles /><HostActivityFeedback /></>)
    expect(contrast(container.querySelector(`[data-pet-host-feedback="${status}"]`)!)).toBeGreaterThanOrEqual(4.5)
  })
})
