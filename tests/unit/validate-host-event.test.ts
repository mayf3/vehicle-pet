import { describe, expect, it } from 'vitest'
import { validateHostActivityEvent } from '../../src/engine/validation/validate-host-event'

function event(status: string, eventId = 'evt-1') {
  return { schemaVersion: 1, eventId, activityId: 'task-a', status, occurredAt: '2026-08-22T01:02:03Z' }
}

describe('HostActivityEventV1 validation (CTR-PET-024)', () => {
  it('accepts all three statuses', () => {
    expect(validateHostActivityEvent(event('completed')).ok).toBe(true)
    expect(validateHostActivityEvent(event('failed')).ok).toBe(true)
    expect(validateHostActivityEvent(event('cancelled')).ok).toBe(true)
  })

  it('rejects unknown status and schemaVersion', () => {
    expect(validateHostActivityEvent(event('pending')).ok).toBe(false)
    expect(validateHostActivityEvent({ ...event('completed'), schemaVersion: 2 }).ok).toBe(false)
  })

  it('rejects malformed eventId/activityId/occurredAt', () => {
    expect(validateHostActivityEvent(event('completed', 'BadEvent!')).ok).toBe(false)
    expect(validateHostActivityEvent({ ...event('completed'), activityId: 'BAD' }).ok).toBe(false)
    expect(validateHostActivityEvent({ ...event('completed'), occurredAt: 'yesterday' }).ok).toBe(false)
  })

  it('rejects unknown fields and non-objects', () => {
    expect(validateHostActivityEvent({ ...event('completed'), extra: true }).ok).toBe(false)
    expect(validateHostActivityEvent(null).ok).toBe(false)
  })
})
