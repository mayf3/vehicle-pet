/**
 * IndexedDB storage adapter (via `idb`) implementing the atomic once-per-key
 * claim of §9.15. Each claim performs its read and write inside one readwrite
 * transaction; IndexedDB serializes overlapping readwrite transactions on the
 * same object store across same-device same-origin tabs, so exactly one
 * concurrent claimer can win.
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { UnlockedKeepsakeKey } from '../types/derived'
import type { ClaimResult, PetStorageAdapter } from './adapter'
import { journalRecordKey, keepsakeRecordKey, keepsakeKeyFromRecord } from './keys'

interface JournalRecord {
  consumedReceiptIds: string[]
  greetedLocalDays: string[]
}

interface PetStoreDB extends DBSchema {
  journals: { key: string; value: JournalRecord }
  keepsakes: { key: string; value: string }
  preferences: { key: string; value: string }
}

export interface IndexedDbPetStorageOptions {
  dbName?: string
}

export class IndexedDbPetStorage implements PetStorageAdapter {
  private readonly db: IDBPDatabase<PetStoreDB>

  private constructor(db: IDBPDatabase<PetStoreDB>) {
    this.db = db
  }

  static async create(options: IndexedDbPetStorageOptions = {}): Promise<IndexedDbPetStorage> {
    const db = await openDB<PetStoreDB>(options.dbName ?? 'pet-engine-v1', 1, {
      upgrade(db) {
        db.createObjectStore('journals')
        db.createObjectStore('keepsakes')
        db.createObjectStore('preferences')
      },
    })
    return new IndexedDbPetStorage(db)
  }

  async claimReceipt(sourceId: string, subjectId: string, receiptId: string): Promise<ClaimResult> {
    const key = journalRecordKey(sourceId, subjectId)
    const tx = this.db.transaction('journals', 'readwrite')
    const store = tx.objectStore('journals')
    const record = (await store.get(key)) ?? { consumedReceiptIds: [], greetedLocalDays: [] }
    if (record.consumedReceiptIds.includes(receiptId)) {
      await tx.done
      return 'lost'
    }
    record.consumedReceiptIds.push(receiptId)
    await store.put(record, key)
    await tx.done
    return 'won'
  }

  async listConsumedReceipts(sourceId: string, subjectId: string): Promise<string[]> {
    const record = await this.db.get('journals', journalRecordKey(sourceId, subjectId))
    return record ? [...record.consumedReceiptIds] : []
  }

  async claimGreetingDay(sourceId: string, subjectId: string, localDay: string): Promise<ClaimResult> {
    const key = journalRecordKey(sourceId, subjectId)
    const tx = this.db.transaction('journals', 'readwrite')
    const store = tx.objectStore('journals')
    const record = (await store.get(key)) ?? { consumedReceiptIds: [], greetedLocalDays: [] }
    if (record.greetedLocalDays.includes(localDay)) {
      await tx.done
      return 'lost'
    }
    record.greetedLocalDays.push(localDay)
    await store.put(record, key)
    await tx.done
    return 'won'
  }

  async listGreetedDays(sourceId: string, subjectId: string): Promise<string[]> {
    const record = await this.db.get('journals', journalRecordKey(sourceId, subjectId))
    return record ? [...record.greetedLocalDays] : []
  }

  async unlockKeepsake(key: UnlockedKeepsakeKey): Promise<ClaimResult> {
    const recordKey = keepsakeRecordKey(key)
    const tx = this.db.transaction('keepsakes', 'readwrite')
    const store = tx.objectStore('keepsakes')
    const existing = await store.get(recordKey)
    if (existing !== undefined) {
      await tx.done
      return 'lost'
    }
    await store.put(recordKey, recordKey)
    await tx.done
    return 'won'
  }

  async listUnlockedKeepsakes(sourceId: string, subjectId: string): Promise<UnlockedKeepsakeKey[]> {
    const allKeys = await this.db.getAllKeys('keepsakes')
    return allKeys
      .filter((k) => k.startsWith(`${sourceId}|${subjectId}|`))
      .map((k) => keepsakeKeyFromRecord(k))
  }

  async getActivePackId(): Promise<string | null> {
    const value = await this.db.get('preferences', 'activePackId')
    return value ?? null
  }

  async setActivePackId(packId: string): Promise<void> {
    await this.db.put('preferences', packId, 'activePackId')
  }

  close(): void {
    this.db.close()
  }
}
