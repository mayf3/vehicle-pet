/**
 * In-memory storage adapter. Multiple adapters can share one backing store to
 * simulate same-device same-origin tabs; claims stay exclusive because each
 * check-and-set is synchronous within one event-loop turn.
 */

import type { UnlockedKeepsakeKey } from '../types/derived'
import type { ClaimResult, PetStorageAdapter } from './adapter'
import { journalRecordKey, keepsakeRecordKey } from './keys'

export interface MemoryBackingStore {
  journals: Map<string, { consumedReceiptIds: string[]; greetedLocalDays: string[] }>
  keepsakes: Set<string>
  preferences: Map<string, string>
}

export function createMemoryBackingStore(): MemoryBackingStore {
  return {
    journals: new Map(),
    keepsakes: new Set(),
    preferences: new Map(),
  }
}

export class MemoryPetStorageAdapter implements PetStorageAdapter {
  private readonly store: MemoryBackingStore

  constructor(shared?: MemoryBackingStore) {
    this.store = shared ?? createMemoryBackingStore()
  }

  async claimReceipt(sourceId: string, subjectId: string, receiptId: string): Promise<ClaimResult> {
    return this.claimReceiptBatch(sourceId, subjectId, [receiptId])
  }

  async claimReceiptBatch(sourceId: string, subjectId: string, receiptIds: string[]): Promise<ClaimResult> {
    const ids = [...new Set(receiptIds)].sort()
    if (ids.length === 0) return 'lost'
    const record = this.journal(sourceId, subjectId)
    if (ids.some((id) => record.consumedReceiptIds.includes(id))) return 'lost'
    record.consumedReceiptIds.push(...ids)
    return 'won'
  }

  async listConsumedReceipts(sourceId: string, subjectId: string): Promise<string[]> {
    return [...this.journal(sourceId, subjectId).consumedReceiptIds]
  }

  async claimGreetingDay(sourceId: string, subjectId: string, localDay: string): Promise<ClaimResult> {
    const record = this.journal(sourceId, subjectId)
    if (record.greetedLocalDays.includes(localDay)) return 'lost'
    record.greetedLocalDays.push(localDay)
    return 'won'
  }

  async listGreetedDays(sourceId: string, subjectId: string): Promise<string[]> {
    return [...this.journal(sourceId, subjectId).greetedLocalDays]
  }

  async unlockKeepsake(key: UnlockedKeepsakeKey): Promise<ClaimResult> {
    const recordKey = keepsakeRecordKey(key)
    if (this.store.keepsakes.has(recordKey)) return 'lost'
    this.store.keepsakes.add(recordKey)
    return 'won'
  }

  async listUnlockedKeepsakes(sourceId: string, subjectId: string): Promise<UnlockedKeepsakeKey[]> {
    const prefix = `${sourceId}|${subjectId}|`
    return [...this.store.keepsakes]
      .filter((k) => k.startsWith(prefix))
      .map((k) => {
        const parts = k.split('|')
        return {
          sourceId: parts[0]!,
          subjectId: parts[1]!,
          packId: parts[2]!,
          packVersion: parts[3]!,
          keepsakeId: parts[4]!,
        }
      })
  }

  async getActivePackId(): Promise<string | null> {
    return this.store.preferences.get('activePackId') ?? null
  }

  async setActivePackId(packId: string): Promise<void> {
    this.store.preferences.set('activePackId', packId)
  }

  private journal(sourceId: string, subjectId: string) {
    const key = journalRecordKey(sourceId, subjectId)
    let record = this.store.journals.get(key)
    if (record === undefined) {
      record = { consumedReceiptIds: [], greetedLocalDays: [] }
      this.store.journals.set(key, record)
    }
    return record
  }
}
