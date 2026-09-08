import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { MemoryPetStorageAdapter, PetEngine } from '../../src/engine'
import { MockProgressSource } from '../../src/prototype/MockProgressSource'
import { PetEngineProvider, PetKeepsakeCollection } from '../../src/react'
import aliases from '../../src/packs/keepsake-compatibility.json'
import { fleetBundle, snapshot } from '../helpers/fixtures'

afterEach(cleanup)

it('preserves real old-version earned records in the corrected collection without replay or foreign-domain unlocks', async () => {
  const storage = new MemoryPetStorageAdapter()
  const oldBundle = fleetBundle()
  const oldManifest = structuredClone(oldBundle.manifestCandidate) as { packVersion: string }
  oldManifest.packVersion = '2.0.0'
  const old = new PetEngine({ bundles: [{ ...oldBundle, manifestCandidate: oldManifest }], defaultPackId: 'autonomous-fleet', storage })
  await old.initialize()
  old.ingestSnapshot(snapshot(0, 0))
  old.ingestSnapshot(snapshot(10_000, 1))
  await old.settled()
  const key = { sourceId: 'mock-progress', subjectId: 'subject-1', packId: 'autonomous-fleet', packVersion: '2.0.0', keepsakeId: 'ks-l3' }
  await storage.unlockKeepsake({ ...key, subjectId: 'another-subject' })
  await storage.unlockKeepsake({ ...key, sourceId: 'another-source' })
  await storage.unlockKeepsake({ ...key, packId: 'another-pack' })
  await storage.unlockKeepsake({ ...key, packVersion: '1.0.0' })
  const before = await storage.listUnlockedKeepsakes('mock-progress', 'subject-1')
  const source = new MockProgressSource(10_000)
  const mounted = render(<PetEngineProvider bundles={[fleetBundle()]} defaultPackId="autonomous-fleet" storage={storage} source={source} keepsakeVersionAliases={aliases}><PetKeepsakeCollection /></PetEngineProvider>)
  await waitFor(() => expect(mounted.container.querySelector('[data-pet-keepsakes]')).toHaveAttribute('data-pet-keepsakes', '1/11'))
  expect(mounted.container.querySelector('[data-pet-keepsake="ks-l2"]')).toHaveAttribute('data-unlocked', 'true')
  expect(mounted.container.querySelector('[data-pet-keepsake="ks-l3"]')).toHaveAttribute('data-unlocked', 'false')
  expect(await storage.listUnlockedKeepsakes('mock-progress', 'subject-1')).toEqual(before)
  act(() => source.setPoints(30_000))
  await waitFor(() => expect(mounted.container.querySelector('[data-pet-keepsakes]')).toHaveAttribute('data-pet-keepsakes', '2/11'))
  const after = await storage.listUnlockedKeepsakes('mock-progress', 'subject-1')
  expect(after.filter(k => k.packVersion === '2.0.1')).toEqual([{ ...key, packVersion: '2.0.1' }])
  act(() => source.resetSubject())
  await waitFor(() => expect(mounted.container.querySelector('[data-pet-keepsakes]')).toHaveAttribute('data-pet-keepsakes', '0/11'))
  expect(await storage.listUnlockedKeepsakes('mock-progress', 'subject-1')).toEqual(after)
})
