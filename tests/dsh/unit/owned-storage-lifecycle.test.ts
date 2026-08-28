import { describe, expect, it, vi } from 'vitest'
import type { PetStorageAdapter } from '../../../src/engine'
import {
  acquireOwnedOverlayStorage,
  type OwnedOverlayStorage,
} from '../../../src/dsh/client/VehiclePetOverlay'

const fallback = {} as PetStorageAdapter

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

function adapter(close = vi.fn()): OwnedOverlayStorage {
  return { close } as unknown as OwnedOverlayStorage
}

async function flush(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

describe('owned IndexedDB overlay lifecycle', () => {
  it('closes a connection that resolves before cleanup exactly once', async () => {
    const created = adapter()
    const onReady = vi.fn()
    const dispose = acquireOwnedOverlayStorage({ create: async () => created, onReady, fallback })
    await flush()

    expect(onReady).toHaveBeenCalledWith(created)
    dispose()
    dispose()
    expect(created.close).toHaveBeenCalledTimes(1)
  })

  it('immediately closes a connection that resolves after cleanup without publishing it', async () => {
    const pending = deferred<OwnedOverlayStorage>()
    const created = adapter()
    const onReady = vi.fn()
    const dispose = acquireOwnedOverlayStorage({ create: () => pending.promise, onReady, fallback })

    dispose()
    pending.resolve(created)
    await flush()

    expect(created.close).toHaveBeenCalledTimes(1)
    expect(onReady).not.toHaveBeenCalled()
  })

  it('leaves zero connections after repeated mount/unmount cycles', async () => {
    let openConnections = 0
    for (let generation = 0; generation < 5; generation += 1) {
      const created = adapter(vi.fn(() => { openConnections -= 1 }))
      const dispose = acquireOwnedOverlayStorage({
        create: async () => {
          openConnections += 1
          return created
        },
        onReady: vi.fn(),
        fallback,
      })
      await flush()
      dispose()
    }
    expect(openConnections).toBe(0)
  })

  it('closes generation 1 before HMR generation 2 and closes generation 2 on stop', async () => {
    const first = adapter()
    const second = adapter()
    const disposeFirst = acquireOwnedOverlayStorage({ create: async () => first, onReady: vi.fn(), fallback })
    await flush()
    disposeFirst()

    const disposeSecond = acquireOwnedOverlayStorage({ create: async () => second, onReady: vi.fn(), fallback })
    await flush()
    expect(first.close).toHaveBeenCalledTimes(1)
    expect(second.close).not.toHaveBeenCalled()

    disposeSecond()
    expect(second.close).toHaveBeenCalledTimes(1)
  })

  it('uses but never closes the external fallback after initialization failure', async () => {
    const onReady = vi.fn()
    const dispose = acquireOwnedOverlayStorage({
      create: async () => { throw new Error('indexeddb unavailable') },
      onReady,
      fallback,
    })
    await flush()

    expect(onReady).toHaveBeenCalledWith(fallback)
    expect('close' in fallback).toBe(false)
    dispose()
  })

  it('does not publish fallback when initialization fails after cleanup', async () => {
    const pending = deferred<OwnedOverlayStorage>()
    const onReady = vi.fn()
    const dispose = acquireOwnedOverlayStorage({ create: () => pending.promise, onReady, fallback })
    dispose()
    pending.reject(new Error('late failure'))
    await flush()
    expect(onReady).not.toHaveBeenCalled()
  })
})
