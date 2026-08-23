/**
 * DailyGreeting: one non-modal greeting on the first open of each device-local
 * day (CTR-PET-016, CTR-PET-028). Never blocks interaction; dismissible.
 */

import { useEffect } from 'react'
import { usePetEngine } from './PetEngineProvider'
import { IconSunrise } from './icons'

export function DailyGreeting() {
  const { greeting, dismissGreeting, copy } = usePetEngine()

  useEffect(() => {
    if (greeting === null) return
    const timer = window.setTimeout(() => dismissGreeting(), 8000)
    return () => window.clearTimeout(timer)
  }, [greeting, dismissGreeting])

  if (greeting === null) return null
  const text = copy.greetingVariants[greeting.variantIndex] ?? copy.greetingVariants[0]!

  return (
    <div className="vp-greeting" role="status" aria-live="polite" data-pet-greeting="true" data-local-day={greeting.localDay}>
      <span aria-hidden="true" style={{ color: '#7dd3fc', fontSize: 18 }}>
        <IconSunrise />
      </span>
      <span>{text}</span>
      <button type="button" className="vp-greeting-close" onClick={dismissGreeting} aria-label={copy.skip} data-pet-greeting-close="true">
        ×
      </button>
    </div>
  )
}
