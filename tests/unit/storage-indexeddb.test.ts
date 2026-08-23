import { afterEach, describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { deleteDB } from 'idb'
import { IndexedDbPetStorage } from '../../src/engine/storage/indexeddb'

const openConnections: IndexedDbPetStorage[] = []

async function openStorage(dbName: string) {
  const storage = await IndexedDbPetStorage.create({ dbName })
  openConnections.push(storage)
  return storage
}

async function freshStorage(dbName: string) {
  await deleteDB(dbName)
  return openStorage(dbName)
}

const DB = 'vp-test-journal'

afterEach(async () => {
  for (const storage of openConnections.splice(0)) storage.close()
  await deleteDB(DB)
})

describe('IndexedDB storage adapter (CTR-PET-013)', () => {
  it('claims each receipt exactly once across two same-origin connections', async () => {
    const tabA = await freshStorage(DB)
    const tabB = await openStorage(DB)
    expect(await tabA.claimReceipt('s', 'u', 'r1')).toBe('won')
    expect(await tabB.claimReceipt('s', 'u', 'r1')).toBe('lost')
    expect(await tabA.listConsumedReceipts('s', 'u')).toEqual(['r1'])
  })

  it('races two connections on one key: exactly one winner', async () => {
    const tabA = await freshStorage(DB)
    const tabB = await openStorage(DB)
    const results = await Promise.all([
      tabA.claimReceipt('s', 'u', 'race-key'),
      tabB.claimReceipt('s', 'u', 'race-key'),
    ])
    expect(results.filter((r) => r === 'won')).toHaveLength(1)
    expect(results.filter((r) => r === 'lost')).toHaveLength(1)
  })

  it('claims daily greetings once per local day', async () => {
    const storage = await freshStorage(DB)
    expect(await storage.claimGreetingDay('s', 'u', '2026-08-22')).toBe('won')
    expect(await storage.claimGreetingDay('s', 'u', '2026-08-22')).toBe('lost')
    expect(await storage.claimGreetingDay('s', 'u', '2026-08-23')).toBe('won')
  })

  it('unlocks keepsakes idempotently under the five-tuple key', async () => {
    const storage = await freshStorage(DB)
    const key = { sourceId: 's', subjectId: 'u', packId: 'p', packVersion: '1.0.0', keepsakeId: 'k' }
    expect(await storage.unlockKeepsake(key)).toBe('won')
    expect(await storage.unlockKeepsake(key)).toBe('lost')
    expect(await storage.unlockKeepsake({ ...key, packVersion: '2.0.0' })).toBe('won')
    const unlocked = await storage.listUnlockedKeepsakes('s', 'u')
    expect(unlocked).toHaveLength(2)
    expect(unlocked.map((k) => k.packVersion).sort()).toEqual(['1.0.0', '2.0.0'])
  })

  it('persists activePackId across connections', async () => {
    const a = await freshStorage(DB)
    const b = await openStorage(DB)
    await a.setActivePackId('autonomous-fleet')
    expect(await b.getActivePackId()).toBe('autonomous-fleet')
  })
})
