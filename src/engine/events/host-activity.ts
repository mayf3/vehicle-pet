/**
 * HostActivityEventV1 handling (CTR-PET-024).
 * Local in-process injection only: no network, no model, no Host transport.
 * The same eventId feeds back at most once (first wins); duplicates emit a
 * diagnostic. Events never change progressPoints and never issue receipts.
 */

import type { EngineDiagnostic, HostActivityEventV1 } from '../types/core'
import { validateHostActivityEvent } from '../validation/validate-host-event'

export interface HostFeedbackPresentation {
  eventId: string
  activityId: string
  status: HostActivityEventV1['status']
  receivedAt: string
}

export interface HostActivityDispatchResult {
  feedback: HostFeedbackPresentation | null
  diagnostics: EngineDiagnostic[]
}

export class HostActivityDispatcher {
  private readonly seenEventIds = new Set<string>()

  dispatch(candidate: unknown, now: () => Date): HostActivityDispatchResult {
    const validation = validateHostActivityEvent(candidate)
    if (!validation.ok) {
      return {
        feedback: null,
        diagnostics: [{ code: 'host-event-invalid', message: validation.reason, at: now().toISOString() }],
      }
    }
    const event = validation.event
    if (this.seenEventIds.has(event.eventId)) {
      return {
        feedback: null,
        diagnostics: [
          {
            code: 'host-event-duplicate',
            message: `eventId ${event.eventId} already processed; duplicate ignored`,
            at: now().toISOString(),
          },
        ],
      }
    }
    this.seenEventIds.add(event.eventId)
    return {
      feedback: {
        eventId: event.eventId,
        activityId: event.activityId,
        status: event.status,
        receivedAt: now().toISOString(),
      },
      diagnostics: [],
    }
  }
}
