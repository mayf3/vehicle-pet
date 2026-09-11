/**
 * Key derivation for all once-semantics state (CTR-PET-027).
 * Every key is rooted at (sourceId, subjectId); a new subjectId is a new namespace.
 */
import type { UnlockedKeepsakeKey } from '../types/derived';
export declare function receiptId(sourceId: string, subjectId: string, packId: string, packVersion: string, toLevelId: string): string;
export declare function journalRecordKey(sourceId: string, subjectId: string): string;
export declare function keepsakeRecordKey(key: UnlockedKeepsakeKey): string;
export declare function keepsakeKeyFromRecord(recordKey: string): UnlockedKeepsakeKey;
export declare function isLocalDay(value: string): boolean;
/** Device-local calendar day (YYYY-MM-DD); the daily variant uses the local timezone. */
export declare function computeLocalDay(date: Date): string;
//# sourceMappingURL=keys.d.ts.map