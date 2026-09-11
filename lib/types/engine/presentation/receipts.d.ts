/**
 * Upgrade Receipts with deterministic identity (CTR-PET-012, §9.14).
 */
import type { UpgradeReceipt } from '../types/derived';
export interface CreateReceiptInput {
    sourceId: string;
    subjectId: string;
    packId: string;
    packVersion: string;
    fromLevelId: string;
    toLevelId: string;
    revision: number;
    issuedAt: string;
}
export declare function createUpgradeReceipt(input: CreateReceiptInput): UpgradeReceipt;
/**
 * Receipts a forward crossing from level index `fromIndex` (0-based, exclusive)
 * to `toIndex` (inclusive) must issue: one per crossed level.
 */
export declare function crossedLevelRange(fromIndex: number, toIndex: number): number[];
//# sourceMappingURL=receipts.d.ts.map