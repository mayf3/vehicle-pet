import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryPetStorageAdapter } from '../../src/engine'
import { autonomousFleetBundle } from '../../src/packs/autonomous-fleet'
import { MockProgressSource } from '../../src/prototype/MockProgressSource'
import { EngineStyles } from '../../src/react/styles'
import { PetEngineProvider } from '../../src/react/PetEngineProvider'
import { LocaleSelector } from '../../src/react/LocaleSelector'

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

describe('X03 accessibility mechanics', () => {
  it('provides WCAG AA contrast for title, greeting, and every host feedback status', () => {
    const { container } = render(
      <><EngineStyles /><header className="vp-product-header"><h1 className="vp-product-title">Vehicle Pet</h1><span className="vp-product-tagline">Growing companion</span></header><div className="vp-panel"><h3 className="vp-title">Title</h3></div><div className="vp-greeting">Greeting</div><div className="vp-host-feedback vp-host-completed">Completed</div><div className="vp-host-feedback vp-host-failed">Failed</div><div className="vp-host-feedback vp-host-cancelled">Cancelled</div></>,
    )
    for (const selector of ['.vp-product-title', '.vp-product-tagline', '.vp-title', '.vp-greeting', '.vp-host-completed', '.vp-host-failed', '.vp-host-cancelled']) {
      expect(contrast(container.querySelector(selector)!), selector).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('synchronizes document html lang immediately when locale switches and restores it on unmount', async () => {
    document.documentElement.lang = 'test-original'
    const view = render(
      <PetEngineProvider
        bundles={[autonomousFleetBundle]}
        defaultPackId="autonomous-fleet"
        storage={new MemoryPetStorageAdapter()}
        source={new MockProgressSource()}
        locale="zh-CN"
      >
        <LocaleSelector />
      </PetEngineProvider>,
    )
    await waitFor(() => expect(document.documentElement.lang).toBe('zh-CN'))
    fireEvent.click(view.getByRole('button', { name: 'en' }))
    await waitFor(() => expect(document.documentElement.lang).toBe('en'))
    view.unmount()
    expect(document.documentElement.lang).toBe('test-original')
  })
})
