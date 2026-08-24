/**
 * DSH DOM test environment: the shared jest-dom setup plus an in-memory
 * Storage polyfill (this Node runtime exposes no localStorage without a
 * backing file, while the overlay persists preferences through it).
 */

import '@testing-library/jest-dom/vitest'

class MemoryStorage {
  #store = new Map<string, string>()

  get length(): number {
    return this.#store.size
  }

  key(index: number): string | null {
    return [...this.#store.keys()][index] ?? null
  }

  getItem(key: string): string | null {
    return this.#store.has(key) ? this.#store.get(key)! : null
  }

  setItem(key: string, value: string): void {
    this.#store.set(key, String(value))
  }

  removeItem(key: string): void {
    this.#store.delete(key)
  }

  clear(): void {
    this.#store.clear()
  }
}

const storage = new MemoryStorage()
Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true, writable: true })
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true, writable: true })
}
