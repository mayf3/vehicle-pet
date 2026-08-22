/**
 * HostActivityFeedback: short, distinguishable, non-punitive feedback for
 * HostActivityEventV1 statuses (CTR-PET-024). Auto-clears; never modal.
 */

import { useEffect } from 'react'
import { usePetEngine } from './PetEngineProvider'
import { IconCheck, IconPause, IconSlash } from './icons'

export function HostActivityFeedback() {
  const { snapshot, copy, clearHostFeedback } = usePetEngine()
  const feedback = snapshot.hostFeedback

  useEffect(() => {
    if (feedback === null) return
    const timer = window.setTimeout(() => clearHostFeedback(), 3200)
    return () => window.clearTimeout(timer)
  }, [feedback, clearHostFeedback])

  if (feedback === null) return null

  const className =
    feedback.status === 'completed'
      ? 'vp-host-feedback vp-host-completed'
      : feedback.status === 'failed'
        ? 'vp-host-feedback vp-host-failed'
        : 'vp-host-feedback vp-host-cancelled'
  const text =
    feedback.status === 'completed' ? copy.hostCompleted : feedback.status === 'failed' ? copy.hostFailed : copy.hostCancelled
  const icon =
    feedback.status === 'completed' ? <IconCheck /> : feedback.status === 'failed' ? <IconPause /> : <IconSlash />

  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      data-pet-host-feedback={feedback.status}
      data-event-id={feedback.eventId}
    >
      <span aria-hidden="true">{icon}</span>
      <span>
        {text} <span style={{ opacity: 0.65, fontSize: 12 }}>({feedback.activityId})</span>
      </span>
    </div>
  )
}
