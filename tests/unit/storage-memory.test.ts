import { describe, expect, it } from 'vitest'
import { MemoryPetStorageAdapter, createMemoryBackingStore } from '../../src/engine/storage/memory'

describe('memory storage adapter claim semantics (CTR-PET-013, CTR-PET-028)', () => {
  it('claims each receipt key exactly once', async () => {
    const store = createMemoryBackingStore()
    const adapter = new MemoryPetStorageAdapter(store)
    expect(await adapter.claimReceipt('s', 'u', 'r1')).toBe('won')
    expect(await adapter.claimReceipt('s', 'u', 'r1')).toBe('lost')
    expect(await adapter.listConsumedReceipts('s', 'u')).toEqual(['r1'])
  })

  it('claims each greeting day exactly once', async () => {
    const adapter = new MemoryPetStorageAdapter()
    expect(await adapter.claimGreetingDay('s', 'u', '2026-08-22')).toBe('won')
    expect(await adapter.claimGreetingDay('s', 'u', '2026-08-22')).toBe('lost')
    expect(await adapter.claimGreetingDay('s', 'u', '2026-08-23')).toBe('won')
    expect(await adapter.listGreetedDays('s', 'u')).toEqual(['2026-08-22', '2026-08-23'])
  })

  it('namespaces journals and keepsakes by subject', async () => {
    const store = createMemoryBackingStore()
    const adapter = new MemoryPetStorageAdapter(store)
    await adapter.claimReceipt('s', 'subject-1', 'r1')
    expect(await adapter.claimReceipt('s', 'subject-2', 'r1')).toBe('won')
    expect((await adapter.listConsumedReceipts('s', 'subject-1')).includes('r1')).toBe(true)
    expect((await adapter.listConsumedReceipts('s', 'subject-2')).includes('r1')).toBe(true)

    await adapter.unlockKeepsake({ sourceId: 's', subjectId: 'subject-1', packId: 'p', packVersion: '1.0.0', keepsakeId: 'k' })
    const unlocked = await adapter.listUnlockedKeepsakes('s', 'subject-2')
    expect(unlocked).toEqual([])
  })

  it('keepsake unlock is idempotent and version-scoped', async () => {
    const adapter = new MemoryPetStorageAdapter()
    const key = { sourceId: 's', subjectId: 'u', packId: 'p', packVersion: '1.0.0', keepsakeId: 'k' }
    expect(await adapter.unlockKeepsake(key)).toBe('won')
    expect(await adapter.unlockKeepsake(key)).toBe('lost')
    expect(
      await adapter.unlockKeepsake({ ...key, packVersion: '2.0.0' }),
    ).toBe('won')
  })

  it('persists activePackId as a device preference', async () => {
    const store = createMemoryBackingStore()
    const a = new MemoryPetStorageAdapter(store)
    const b = new MemoryPetStorageAdapter(store)
    await a.setActivePackId('autonomous-fleet')
    expect(await b.getActivePackId()).toBe('autonomous-fleet')
  })

  it('simulates two tabs over one shared backing store: exactly one winner', async () => {
    const store = createMemoryBackingStore()
    const tabA = new MemoryPetStorageAdapter(store)
    const tabB = new MemoryPetStorageAdapter(store)
    const results = await Promise.all([
      tabA.claimReceipt('s', 'u', 'shared-key'),
      tabB.claimReceipt('s', 'u', 'shared-key'),
    ])
    expect(results.filter((r) => r === 'won')).toHaveLength(1)
    expect(results.filter((r) => r === 'lost')).toHaveLength(1)
  })
})
