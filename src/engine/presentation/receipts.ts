/**
 * Upgrade Receipts with deterministic identity (CTR-PET-012, §9.14).
 */

import type { UpgradeReceipt } from '../types/derived'
import { receiptId } from '../storage/keys'

export interface CreateReceiptInput {
  sourceId: string
  subjectId: string
  packId: string
  packVersion: string
  fromLevelId: string
  toLevelId: string
  revision: number
  issuedAt: string
}

export function createUpgradeReceipt(input: CreateReceiptInput): UpgradeReceipt {
  return {
    schemaVersion: 1,
    receiptId: receiptId(input.sourceId, input.subjectId, input.packId, input.packVersion, input.toLevelId),
    sourceId: input.sourceId,
    subjectId: input.subjectId,
    packId: input.packId,
    packVersion: input.packVersion,
    fromLevelId: input.fromLevelId,
    toLevelId: input.toLevelId,
    issuedAt: input.issuedAt,
    revision: input.revision,
  }
}

/**
 * Receipts a forward crossing from level index `fromIndex` (0-based, exclusive)
 * to `toIndex` (inclusive) must issue: one per crossed level.
 */
export function crossedLevelRange(fromIndex: number, toIndex: number): number[] {
  const crossed: number[] = []
  for (let i = fromIndex + 1; i <= toIndex; i++) crossed.push(i)
  return crossed
}
