/**
 * DshUsageProgressSource: the exactly-one real Progress Source authorized by
 * DSH_USAGE_PROGRESS_SOURCE_V1 (CTR-USG-001..013). Converts counts-only
 * `tokenUsage` projection growth into monotone ProgressSnapshotV1 emissions.
 *
 * Structural inputs only: session ids plus the numeric `tokenUsage` counts of
 * a structured session-list snapshot (`observe`). No message bodies, no raw
 * event streams, no timers, no network. Degradation is silent: absent keys,
 * regressed projections, and storage failures all attribute nothing.
 */

import type { ProgressSource } from '../../engine'
import {
  countedFromTokenUsage,
  dailyTargetPoints,
  emptyLedger,
  localDayOf,
  mergeLedger,
  normalizeLedger,
  pruneLedger,
  USAGE_LEDGER_KEY,
  USAGE_SOURCE_ID,
  USAGE_SUBJECT_ID,
  type UsageLedger,
} from './usage-economy'

/** Structural mirror of one session-list row (counts-only fields). */
export interface UsageSessionSummaryLike {
  readonly projectionValues?: Readonly<Record<string, unknown>> | undefined
}

/** Structural mirror of a structured session-list snapshot. */
export interface UsageSessionListLike {
  readonly byId: Record<string, UsageSessionSummaryLike | undefined>
}

/**
 * CTR-USG-009 persistence seam. `save` re-reads the stored record, merges
 * field-wise maxima, writes, and returns the merged record actually stored —
 * a stale tab's record can never regress a newer one.
 */
export interface UsageLedgerStore {
  load(): UsageLedger
  save(ledger: UsageLedger): UsageLedger
}

/** Browser-local store (CTR-USG-009/DEC-USG-007); memory fallback is silent. */
export class LocalStorageUsageLedgerStore implements UsageLedgerStore {
  readonly #storage: Pick<Storage, 'getItem' | 'setItem'> | undefined
  #unavailable: boolean

  constructor(storage: Pick<Storage, 'getItem' | 'setItem'> | null = null) {
    this.#storage = storage === null ? readGlobalStorage() : storage
    this.#unavailable = this.#storage === undefined
  }

  load(): UsageLedger {
    if (this.#unavailable || this.#storage === undefined) return emptyLedger()
    try {
      const raw = this.#storage.getItem(USAGE_LEDGER_KEY)
      if (raw === null) return emptyLedger()
      return normalizeLedger(JSON.parse(raw) as unknown)
    } catch {
      // Malformed record: degrade to memory and re-baseline at current totals.
      this.#unavailable = true
      return emptyLedger()
    }
  }

  save(ledger: UsageLedger): UsageLedger {
    if (this.#unavailable || this.#storage === undefined) return ledger
    try {
      const storedRaw = this.#storage.getItem(USAGE_LEDGER_KEY)
      const stored = storedRaw === null ? emptyLedger() : normalizeLedger(JSON.parse(storedRaw) as unknown)
      const merged = mergeLedger(ledger, stored)
      this.#storage.setItem(USAGE_LEDGER_KEY, JSON.stringify(merged))
      return merged
    } catch {
      // Quota/unavailable mid-session: stay memory-only, silently.
      this.#unavailable = true
      return ledger
    }
  }
}

function readGlobalStorage(): Pick<Storage, 'getItem' | 'setItem'> | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export interface DshUsageProgressSourceOptions {
  readonly store?: UsageLedgerStore
  readonly now?: () => Date
}

/**
 * The one authorized real source (sourceId `dsh-usage`, subjectId
 * `companion`). `subscribe` mirrors the mock source contract and delivers the
 * current snapshot immediately, so a freshly mounted Engine receives the
 * persisted cumulative total even before the next list change.
 */
export class DshUsageProgressSource implements ProgressSource {
  readonly sourceId = USAGE_SOURCE_ID

  readonly #store: UsageLedgerStore
  readonly #now: () => Date
  readonly #listeners = new Set<(snapshot: unknown) => void>()
  #ledger: UsageLedger
  #lastObservedDay: string | null = null
  #disposed = false

  constructor(options: DshUsageProgressSourceOptions = {}) {
    this.#store = options.store ?? new LocalStorageUsageLedgerStore()
    this.#now = options.now ?? (() => new Date())
    this.#ledger = this.#store.load()
  }

  subscribe(listener: (snapshot: unknown) => void): () => void {
    if (this.#disposed) return () => {}
    this.#listeners.add(listener)
    listener(this.#snapshot())
    return () => {
      this.#listeners.delete(listener)
    }
  }

  /**
   * CTR-USG-006/007/008: attribute non-negative per-session growth to the
   * device-local day of observation, apply the frozen per-day target, and
   * emit at most one snapshot per observation when the applied gain is
   * positive. First observations seed silently (no backfill).
   */
  observe(list: UsageSessionListLike): void {
    if (this.#disposed) return
    const today = localDayOf(this.#now())

    let ledger = this.#ledger
    let dirty = false

    if (this.#lastObservedDay !== null && today !== this.#lastObservedDay) {
      ledger = pruneLedger(ledger, today, new Set(Object.keys(list.byId)))
      dirty = true
    }
    this.#lastObservedDay = today

    const lastSeen = { ...ledger.lastSeen }
    let countedDelta = 0
    for (const [sessionId, summary] of Object.entries(list.byId)) {
      const counted = countedFromTokenUsage(summary?.projectionValues?.['tokenUsage'])
      const previous = lastSeen[sessionId]
      if (previous === undefined) {
        // CTR-USG-006: first observation seeds at the current total.
        lastSeen[sessionId] = counted
        dirty = true
        continue
      }
      if (counted > previous) {
        countedDelta += counted - previous
        lastSeen[sessionId] = counted
        dirty = true
      }
    }

    if (countedDelta > 0) {
      const day = ledger.byDay[today] ?? { tokens: 0, appliedPoints: 0 }
      const tokens = day.tokens + countedDelta
      const gain = Math.floor(dailyTargetPoints(tokens)) - day.appliedPoints
      if (gain > 0) {
        ledger = {
          ...ledger,
          cumulativePoints: ledger.cumulativePoints + gain,
          revision: ledger.revision + 1,
          byDay: { ...ledger.byDay, [today]: { tokens, appliedPoints: day.appliedPoints + gain } },
          lastSeen,
        }
        dirty = true
        this.#ledger = ledger
        this.#emit()
      } else {
        ledger = { ...ledger, byDay: { ...ledger.byDay, [today]: { ...day, tokens } }, lastSeen }
        this.#ledger = ledger
      }
    } else {
      if (dirty) this.#ledger = { ...ledger, lastSeen }
    }

    if (dirty) {
      // CTR-USG-009: adopt the merged record actually stored (a concurrent
      // tab may hold higher values; field-wise maxima keep every writer
      // monotone and convergent).
      this.#ledger = this.#store.save(this.#ledger)
    }
  }

  dispose(): void {
    this.#disposed = true
    this.#listeners.clear()
  }

  #snapshot(): { schemaVersion: 1; sourceId: string; subjectId: string; progressPoints: number; revision: number; observedAt: string } {
    return {
      schemaVersion: 1,
      sourceId: USAGE_SOURCE_ID,
      subjectId: USAGE_SUBJECT_ID,
      progressPoints: this.#ledger.cumulativePoints,
      revision: this.#ledger.revision,
      observedAt: this.#now().toISOString(),
    }
  }

  #emit(): void {
    const snapshot = this.#snapshot()
    for (const listener of this.#listeners) listener(snapshot)
  }
}
