/**
 * IndexedDB storage adapter (via `idb`) implementing the atomic once-per-key
 * claim of §9.15. Each claim performs its read and write inside one readwrite
 * transaction; IndexedDB serializes overlapping readwrite transactions on the
 * same object store across same-device same-origin tabs, so exactly one
 * concurrent claimer can win.
 */
import type { UnlockedKeepsakeKey } from '../types/derived';
import type { ClaimResult, PetStorageAdapter } from './adapter';
export interface IndexedDbPetStorageOptions {
    dbName?: string;
}
export declare class IndexedDbPetStorage implements PetStorageAdapter {
    private readonly db;
    private constructor();
    static create(options?: IndexedDbPetStorageOptions): Promise<IndexedDbPetStorage>;
    claimReceipt(sourceId: string, subjectId: string, receiptId: string): Promise<ClaimResult>;
    claimReceiptBatch(sourceId: string, subjectId: string, receiptIds: string[]): Promise<ClaimResult>;
    listConsumedReceipts(sourceId: string, subjectId: string): Promise<string[]>;
    claimGreetingDay(sourceId: string, subjectId: string, localDay: string): Promise<ClaimResult>;
    listGreetedDays(sourceId: string, subjectId: string): Promise<string[]>;
    unlockKeepsake(key: UnlockedKeepsakeKey): Promise<ClaimResult>;
    listUnlockedKeepsakes(sourceId: string, subjectId: string): Promise<UnlockedKeepsakeKey[]>;
    getActivePackId(): Promise<string | null>;
    setActivePackId(packId: string): Promise<void>;
    close(): void;
}
//# sourceMappingURL=indexeddb.d.ts.map