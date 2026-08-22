/**
 * Validation for HostActivityEventV1 (CTR-PET-024, §9.4).
 * Events are local in-process input only; there is no transport here.
 */

import type { HostActivityEventV1, HostActivityStatus } from '../types/core'
import {
  ACTIVITY_ID_PATTERN,
  EVENT_ID_PATTERN,
  hasNoUnknownFields,
  isPlainObject,
  TIMESTAMP_PATTERN,
} from './patterns'

const HOST_EVENT_FIELDS = ['schemaVersion', 'eventId', 'activityId', 'status', 'occurredAt'] as const

const STATUSES: readonly HostActivityStatus[] = ['completed', 'failed', 'cancelled']

export type HostEventValidationResult =
  | { ok: true; event: HostActivityEventV1 }
  | { ok: false; reason: string }

export function validateHostActivityEvent(candidate: unknown): HostEventValidationResult {
  if (!isPlainObject(candidate)) {
    return { ok: false, reason: 'host activity event must be a JSON object' }
  }
  if (!hasNoUnknownFields(candidate, HOST_EVENT_FIELDS)) {
    return { ok: false, reason: 'host activity event contains unknown fields' }
  }
  if (candidate.schemaVersion !== 1) {
    return { ok: false, reason: 'schemaVersion must be exactly 1' }
  }
  if (typeof candidate.eventId !== 'string' || !EVENT_ID_PATTERN.test(candidate.eventId)) {
    return { ok: false, reason: 'eventId is missing or malformed' }
  }
  if (typeof candidate.activityId !== 'string' || !ACTIVITY_ID_PATTERN.test(candidate.activityId)) {
    return { ok: false, reason: 'activityId is missing or malformed' }
  }
  if (typeof candidate.status !== 'string' || !STATUSES.includes(candidate.status as HostActivityStatus)) {
    return { ok: false, reason: 'status must be one of completed | failed | cancelled' }
  }
  if (typeof candidate.occurredAt !== 'string' || !TIMESTAMP_PATTERN.test(candidate.occurredAt)) {
    return { ok: false, reason: 'occurredAt must be an ISO-8601 UTC timestamp' }
  }
  return {
    ok: true,
    event: {
      schemaVersion: 1,
      eventId: candidate.eventId,
      activityId: candidate.activityId,
      status: candidate.status as HostActivityStatus,
      occurredAt: candidate.occurredAt,
    },
  }
}
