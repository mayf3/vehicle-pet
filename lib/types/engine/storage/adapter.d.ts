/**
 * Engine storage adapter contract (DEC-PET-004, §9.15).
 *
 * The adapter owns the Presentation Journal, keepsake retention, and the
 * activePackId device preference on the local device only. The authoritative
 * ProgressSnapshot and the derived level are deliberately NOT part of this
 * surface: the engine must never persist them.
 */
import type { UnlockedKeepsakeKey } from '../types/derived';
export type ClaimResult = 'won' | 'lost';
export interface PetStorageAdapter {
    /** Atomic once-per-receiptId claim; visible across same-device same-origin tabs. */
    claimReceipt(sourceId: string, subjectId: string, receiptId: string): Promise<ClaimResult>;
    /**
     * Atomic all-or-nothing claim for one deterministic presentation batch.
     * The winner consumes every id; if any id was already consumed, the caller loses.
     */
    claimReceiptBatch(sourceId: string, subjectId: string, receiptIds: string[]): Promise<ClaimResult>;
    listConsumedReceipts(sourceId: string, subjectId: string): Promise<string[]>;
    /** Atomic once-per-localDay greeting claim using the same semantics. */
    claimGreetingDay(sourceId: string, subjectId: string, localDay: string): Promise<ClaimResult>;
    listGreetedDays(sourceId: string, subjectId: string): Promise<string[]>;
    /** Keepsake retention keyed by the five-tuple; idempotent. */
    unlockKeepsake(key: UnlockedKeepsakeKey): Promise<ClaimResult>;
    listUnlockedKeepsakes(sourceId: string, subjectId: string): Promise<UnlockedKeepsakeKey[]>;
    /** Device-level pack preference; survives subject reset. */
    getActivePackId(): Promise<string | null>;
    setActivePackId(packId: string): Promise<void>;
}
//# sourceMappingURL=adapter.d.ts.map