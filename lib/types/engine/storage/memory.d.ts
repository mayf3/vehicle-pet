/**
 * In-memory storage adapter. Multiple adapters can share one backing store to
 * simulate same-device same-origin tabs; claims stay exclusive because each
 * check-and-set is synchronous within one event-loop turn.
 */
import type { UnlockedKeepsakeKey } from '../types/derived';
import type { ClaimResult, PetStorageAdapter } from './adapter';
export interface MemoryBackingStore {
    journals: Map<string, {
        consumedReceiptIds: string[];
        greetedLocalDays: string[];
    }>;
    keepsakes: Set<string>;
    preferences: Map<string, string>;
}
export declare function createMemoryBackingStore(): MemoryBackingStore;
export declare class MemoryPetStorageAdapter implements PetStorageAdapter {
    private readonly store;
    constructor(shared?: MemoryBackingStore);
    claimReceipt(sourceId: string, subjectId: string, receiptId: string): Promise<ClaimResult>;
    claimReceiptBatch(sourceId: string, subjectId: string, receiptIds: string[]): Promise<ClaimResult>;
    listConsumedReceipts(sourceId: string, subjectId: string): Promise<string[]>;
    claimGreetingDay(sourceId: string, subjectId: string, localDay: string): Promise<ClaimResult>;
    listGreetedDays(sourceId: string, subjectId: string): Promise<string[]>;
    unlockKeepsake(key: UnlockedKeepsakeKey): Promise<ClaimResult>;
    listUnlockedKeepsakes(sourceId: string, subjectId: string): Promise<UnlockedKeepsakeKey[]>;
    getActivePackId(): Promise<string | null>;
    setActivePackId(packId: string): Promise<void>;
    private journal;
}
//# sourceMappingURL=memory.d.ts.map