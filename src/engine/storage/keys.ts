/**
 * Key derivation for all once-semantics state (CTR-PET-027).
 * Every key is rooted at (sourceId, subjectId); a new subjectId is a new namespace.
 */

import type { UnlockedKeepsakeKey } from '../types/derived'
import { LOCAL_DAY_PATTERN } from '../validation/patterns'

export function receiptId(
  sourceId: string,
  subjectId: string,
  packId: string,
  packVersion: string,
  toLevelId: string,
): string {
  return `${sourceId}|${subjectId}|${packId}|${packVersion}|${toLevelId}`
}

export function journalRecordKey(sourceId: string, subjectId: string): string {
  return `${sourceId}|${subjectId}`
}

export function keepsakeRecordKey(key: UnlockedKeepsakeKey): string {
  return `${key.sourceId}|${key.subjectId}|${key.packId}|${key.packVersion}|${key.keepsakeId}`
}

export function keepsakeKeyFromRecord(recordKey: string): UnlockedKeepsakeKey {
  const parts = recordKey.split('|')
  if (parts.length !== 5) {
    throw new Error(`malformed keepsake record key ${recordKey}`)
  }
  return {
    sourceId: parts[0]!,
    subjectId: parts[1]!,
    packId: parts[2]!,
    packVersion: parts[3]!,
    keepsakeId: parts[4]!,
  }
}

export function isLocalDay(value: string): boolean {
  return LOCAL_DAY_PATTERN.test(value)
}

/** Device-local calendar day (YYYY-MM-DD); the daily variant uses the local timezone. */
export function computeLocalDay(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
