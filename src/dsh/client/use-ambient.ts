/**
 * Ambient behavior scheduler (DSH_PET_OVERLAY_ADAPTER_V7
 * DEC-OVERLAY-023 / CTR-OVERLAY-033). One slow adapter-owned timer; verdicts
 * come from the pure rules in ambient-rules.ts. Attempts consumed by typing,
 * hidden documents, non-idle states, or the interaction cooldown are not
 * replayed. The deadline persists across character switches (shared cadence,
 * CTR-037); the repertoire follows the selected character.
 */

import { useCallback, useEffect, useRef } from 'react'
import {
  evaluateAmbient, nextAmbientDelayMs, selectAmbientAction,
  type AmbientActionDefinition,
} from './ambient-rules'
import type { DaypartBucket } from './daypart'
import type { PetId } from './types'

export interface AmbientSchedulerOptions {
  readonly petId: PetId
  readonly daypartBucket: DaypartBucket
  /** Payload-ignored cadence snapshot from the speech controller. */
  readonly readCadence: () => {
    readonly mountedAt: number
    readonly lastInputAt: number | null
    readonly sessionState: 'idle' | 'working' | 'needs-input' | 'terminal'
    readonly now: number
  }
  /** Epoch ms of the last direct interaction (click/petting/drag/menu), or 0. */
  readonly readLastInteractionAt: () => number
  /** False while reduced motion or the petting episode suppresses actions. */
  readonly enabled: boolean
  readonly play: (action: AmbientActionDefinition) => void
  readonly random?: () => number
}

export function useAmbientBehavior(options: AmbientSchedulerOptions): void {
  const optionsRef = useRef(options)
  optionsRef.current = options
  const deadlineRef = useRef<number | null>(null)
  const lastActionIdRef = useRef<string | null>(null)
  const lastActionAtRef = useRef<number | null>(null)

  const resample = useCallback((now: number): void => {
    const sample = (optionsRef.current.random ?? Math.random)()
    deadlineRef.current = now + nextAmbientDelayMs(sample)
  }, [])

  useEffect(() => {
    resample(Date.now())
    const handle = globalThis.setInterval(() => {
      const current = optionsRef.current
      const now = Date.now()
      if (deadlineRef.current === null) resample(now)
      if (now < (deadlineRef.current ?? now)) return
      // Consumed attempt: the next deadline is sampled whether or not the
      // action fires, so suppression never creates a catch-up burst.
      resample(now)
      if (document.hidden || !current.enabled) return
      const cadence = current.readCadence()
      const verdict = evaluateAmbient({
        mountedAt: cadence.mountedAt,
        lastInputAt: cadence.lastInputAt,
        lastInteractionAt: current.readLastInteractionAt() || null,
        lastActionAt: lastActionAtRef.current,
        sessionState: cadence.sessionState,
        documentHidden: document.hidden,
        now,
      })
      if (!verdict.allowed) return
      const action = selectAmbientAction(
        current.petId,
        current.daypartBucket,
        lastActionIdRef.current,
        (current.random ?? Math.random)(),
      )
      lastActionIdRef.current = action.id
      lastActionAtRef.current = now
      current.play(action)
    }, 1000)
    return () => globalThis.clearInterval(handle)
  }, [resample])
}
