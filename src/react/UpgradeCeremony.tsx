/**
 * UpgradeCeremony: one merged, bounded ceremony (CTR-PET-014, CTR-PET-015).
 * At most 3 beats within at most 3 seconds; skippable; no focus trap — focus
 * moves to the status region on open and returns to the previous target on
 * close. Reduced motion renders a static completion marker with no motion.
 */

import { useEffect, useRef, useState } from 'react'
import { usePetEngine } from './PetEngineProvider'
import { IconSkip } from './icons'

export function UpgradeCeremony() {
  const { ceremony, skipCeremony, copy, snapshot } = usePetEngine()
  const [beatIndex, setBeatIndex] = useState(0)
  const regionRef = useRef<HTMLDivElement | null>(null)
  const previousFocusRef = useRef<Element | null>(null)

  useEffect(() => {
    if (ceremony === null) return
    previousFocusRef.current =
      typeof document !== 'undefined' ? document.activeElement : null
    regionRef.current?.focus()
    setBeatIndex(0)
    const beats = ceremony.plan.beats.length
    const perBeatMs = Math.floor(ceremony.plan.totalMs / beats)
    const timers: number[] = []
    for (let i = 1; i < beats; i++) {
      timers.push(window.setTimeout(() => setBeatIndex(i), perBeatMs * i))
    }
    timers.push(window.setTimeout(() => skipCeremony(), ceremony.plan.totalMs))
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') skipCeremony()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      timers.forEach((t) => window.clearTimeout(t))
      document.removeEventListener('keydown', onKey)
    }
  }, [ceremony, skipCeremony])

  useEffect(() => {
    if (ceremony === null && previousFocusRef.current !== null) {
      const target = previousFocusRef.current
      if (target instanceof HTMLElement) target.focus()
      previousFocusRef.current = null
    }
  }, [ceremony])

  if (ceremony === null) return null

  const reduced = snapshot.reducedMotion
  const beats = ceremony.plan.beats

  return (
    <div className="vp-ceremony" data-pet-ceremony="true" data-beats={beats.length} data-total-ms={ceremony.plan.totalMs}>
      <div
        className="vp-ceremony-inner"
        ref={regionRef}
        role="status"
        aria-live="polite"
        tabIndex={-1}
        style={reduced ? undefined : { animation: 'vp-glow-pulse 1.5s ease-in-out 2' }}
      >
        {reduced ? (
          <div className="vp-ceremony-static" data-pet-ceremony-reduced="true">
            {beats.map((beat) => (
              <div key={beat.levelId}>
                {copy.upgradeTo} · {beat.stageName}
              </div>
            ))}
          </div>
        ) : (
          <div className="vp-ceremony-beat" key={`${beats[beatIndex]?.levelId ?? 'beat'}-${beatIndex}`}>
            {copy.upgradeTo} · {beats[beatIndex]?.stageName ?? ''}
            <div style={{ fontSize: 12, color: '#9db7e0', marginTop: 6 }}>{beats[beatIndex]?.milestone ?? ''}</div>
          </div>
        )}
        <button type="button" className="vp-ceremony-skip" onClick={skipCeremony} data-pet-ceremony-skip="true">
          <IconSkip /> {copy.skip}
        </button>
      </div>
    </div>
  )
}
