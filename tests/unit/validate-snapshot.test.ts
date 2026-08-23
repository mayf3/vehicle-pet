import { describe, expect, it } from 'vitest'
import { validateProgressSnapshot } from '../../src/engine/validation/validate-snapshot'
import { snapshot } from '../helpers/fixtures'

describe('ProgressSnapshotV1 entire-snapshot rejection (CTR-PET-002)', () => {
  it('accepts a well-formed snapshot', () => {
    const result = validateProgressSnapshot(snapshot(0, 0))
    expect(result.ok).toBe(true)
  })

  it('rejects wrong schemaVersion', () => {
    expect(validateProgressSnapshot({ ...snapshot(0, 0), schemaVersion: 2 }).ok).toBe(false)
    expect(validateProgressSnapshot({ ...snapshot(0, 0), schemaVersion: '1' }).ok).toBe(false)
  })

  it('rejects missing required fields', () => {
    for (const field of ['schemaVersion', 'sourceId', 'subjectId', 'progressPoints', 'revision', 'observedAt']) {
      const candidate: Record<string, unknown> = { ...snapshot(0, 0) }
      delete candidate[field]
      expect(validateProgressSnapshot(candidate).ok, `missing ${field}`).toBe(false)
    }
  })

  it('rejects unknown fields', () => {
    expect(validateProgressSnapshot({ ...snapshot(0, 0), extra: 1 }).ok).toBe(false)
  })

  it('rejects negative, fractional, non-finite, and unsafe progressPoints and revision', () => {
    for (const bad of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 2 ** 53]) {
      expect(validateProgressSnapshot({ ...snapshot(bad, 1) }).ok, `progressPoints ${String(bad)}`).toBe(false)
      expect(validateProgressSnapshot({ ...snapshot(1, bad) }).ok, `revision ${String(bad)}`).toBe(false)
    }
  })

  it('accepts MAX_SAFE_INTEGER points and revision', () => {
    const result = validateProgressSnapshot(snapshot(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER))
    expect(result.ok).toBe(true)
  })

  it('rejects malformed sourceId/subjectId', () => {
    expect(validateProgressSnapshot(snapshot(0, 0, 'subject-1', 'Bad_Source')).ok).toBe(false)
    expect(validateProgressSnapshot(snapshot(0, 0, 'BadSubject!')).ok).toBe(false)
    expect(validateProgressSnapshot(snapshot(0, 0, '')).ok).toBe(false)
  })

  it('rejects malformed observedAt', () => {
    expect(validateProgressSnapshot({ ...snapshot(0, 0), observedAt: '2026-08-22 00:00:00' }).ok).toBe(false)
    expect(validateProgressSnapshot({ ...snapshot(0, 0), observedAt: 'not-a-time' }).ok).toBe(false)
  })

  it('rejects non-object candidates', () => {
    expect(validateProgressSnapshot(null).ok).toBe(false)
    expect(validateProgressSnapshot('snapshot').ok).toBe(false)
    expect(validateProgressSnapshot(42).ok).toBe(false)
  })
})
