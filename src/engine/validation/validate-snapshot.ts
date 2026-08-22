/**
 * Entire-snapshot validation for ProgressSnapshotV1 (CTR-PET-002, DEC-PET-012).
 * Any violation rejects the whole snapshot: no clamping, rounding, or partial application.
 */

import type { ProgressSnapshotV1 } from '../types/core'
import {
  hasNoUnknownFields,
  isPlainObject,
  isSafeNonNegativeInteger,
  SOURCE_ID_PATTERN,
  SUBJECT_ID_PATTERN,
  TIMESTAMP_PATTERN,
} from './patterns'

const SNAPSHOT_FIELDS = [
  'schemaVersion',
  'sourceId',
  'subjectId',
  'progressPoints',
  'revision',
  'observedAt',
] as const

export type SnapshotValidationResult =
  | { ok: true; snapshot: ProgressSnapshotV1 }
  | { ok: false; reason: string }

export function validateProgressSnapshot(candidate: unknown): SnapshotValidationResult {
  if (!isPlainObject(candidate)) {
    return { ok: false, reason: 'snapshot must be a JSON object' }
  }
  if (!hasNoUnknownFields(candidate, SNAPSHOT_FIELDS)) {
    return { ok: false, reason: 'snapshot contains unknown fields' }
  }
  if (candidate.schemaVersion !== 1) {
    return { ok: false, reason: `schemaVersion must be exactly 1, got ${String(candidate.schemaVersion)}` }
  }
  if (typeof candidate.sourceId !== 'string' || !SOURCE_ID_PATTERN.test(candidate.sourceId)) {
    return { ok: false, reason: 'sourceId is missing or malformed' }
  }
  if (typeof candidate.subjectId !== 'string' || !SUBJECT_ID_PATTERN.test(candidate.subjectId)) {
    return { ok: false, reason: 'subjectId is missing or malformed' }
  }
  if (!isSafeNonNegativeInteger(candidate.progressPoints)) {
    return {
      ok: false,
      reason: `progressPoints must be a non-negative safe integer, got ${String(candidate.progressPoints)}`,
    }
  }
  if (!isSafeNonNegativeInteger(candidate.revision)) {
    return { ok: false, reason: `revision must be a non-negative safe integer, got ${String(candidate.revision)}` }
  }
  if (typeof candidate.observedAt !== 'string' || !TIMESTAMP_PATTERN.test(candidate.observedAt)) {
    return { ok: false, reason: 'observedAt must be an ISO-8601 UTC timestamp' }
  }
  return {
    ok: true,
    snapshot: {
      schemaVersion: 1,
      sourceId: candidate.sourceId,
      subjectId: candidate.subjectId,
      progressPoints: candidate.progressPoints,
      revision: candidate.revision,
      observedAt: candidate.observedAt,
    },
  }
}
