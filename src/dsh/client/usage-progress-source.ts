/**
 * DshUsageProgressSource — the single real Progress Source authorized by
 * DSH_USAGE_PROGRESS_SOURCE_V1 (accepted; CTR-USG-001..013), delivered under
 * the successor milestone authority VEHICLE_PET_PROGRESS_SOURCE_V2.
 *
 * Converts counts-only DSH `tokenUsage` projection growth into
 * ProgressSnapshotV1 points under the frozen calibration (CTR-USG-005:
 * `min(12000, 1350 x log2(1 + T / 1000000))`, floored per-day application).
 * Processes numeric projection counts and stable session ids only — never
 * Prompt text, Completion text, message bodies, titles, or credentials
 * (CTR-USG-003). First observations seed silently (no backfill, CTR-USG-006);
 * attribution uses the device-local day (CTR-USG-007); emission is monotone
 * and only on positive gain (CTR-USG-008); the versioned browser-local ledger
 * merge-guards field-wise maxima so a stale tab cannot regress a newer record
 * and degrades to memory on storage failure (CTR-USG-009/010/011). No timers,
 * no network; the owner disposes listeners with the plugin fiber
 * (CTR-USG-012/013).
 */

import type { ProgressSource } from '../../engine'
import type { OverlayObservable } from './session-state-adapter'

export const USAGE_SOURCE_ID = 'dsh-usage'
export const USAGE_SUBJECT_ID = 'companion'
export const USAGE_LEDGER_STORAGE_KEY = 'vehicle-pet/usage-ledger/v1'

/** Frozen calibration constants (DEC-USG-005); no configuration surface. */
export const TOKEN_SCALE = 1_000_000
export const DAILY_COEFFICIENT = 1_350
export const DAILY_CAP = 12_000
const BYDAY_RETENTION_DAYS = 90

/** The pinned projection value fields this source reads (counts only). */
export interface UsageTokenUsageLike {
  readonly uncachedInputTokens?: number
  readonly outputTokens?: number
  readonly cacheReadTokens?: number
  readonly cacheWriteTokens?: number
  readonly reasoningTokens?: number
}

export interface UsageSessionSummaryLike {
  readonly projectionValues?: { readonly tokenUsage?: UsageTokenUsageLike | undefined } & Record<string, unknown>
}

export interface UsageSessionListLike {
  readonly byId: Readonly<Record<string, UsageSessionSummaryLike | undefined>>
}

/** The pinned `ctx.sessions` surface this source consumes. */
export interface UsageSessionsSource {
  readonly list: OverlayObservable<UsageSessionListLike>
}

/** `n(v) = v` for safe non-negative integers, else 0 (CTR-USG-004). */
export function normalizedCount(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0
}

export function countedTokensOf(usage: UsageTokenUsageLike): number {
  // The host's tokenUsage projection value is the whole fold state
  // ({ totals: buckets, last: sample }); tolerate a bare-buckets shape too.
  const buckets = (usage as { totals?: UsageTokenUsageLike }).totals ?? usage
  return normalizedCount(buckets.uncachedInputTokens) + normalizedCount(buckets.outputTokens)
}

/** Frozen progress function target (real-valued; callers floor at application). */
export function dailyTargetPoints(totalTokens: number): number {
  if (!(totalTokens > 0)) return 0
  return Math.min(DAILY_CAP, DAILY_COEFFICIENT * Math.log2(1 + totalTokens / TOKEN_SCALE))
}

export interface UsageLedgerDay {
  dailyTokens: number
  appliedPoints: number
}

export interface UsageLedgerV1 {
  schemaVersion: 1
  cumulativePoints: number
  revision: number
  byDay: Record<string, UsageLedgerDay>
  lastSeen: Record<string, number>
}

/** Minimal storage face (localStorage subset) so tests can inject fakes. */
export interface UsageLedgerStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export interface UsageClock {
  /** Device-local `YYYY-MM-DD` of "now" (CTR-USG-007). */
  localDay(): string
  now(): Date
}

const realClock: UsageClock = {
  localDay(): string {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${now.getFullYear()}-${month}-${day}`
  },
  now(): Date {
    return new Date()
  },
}

function emptyLedger(): UsageLedgerV1 {
  return { schemaVersion: 1, cumulativePoints: 0, revision: 0, byDay: {}, lastSeen: {} }
}

function isSafeNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function normalizeDayEntry(value: unknown): UsageLedgerDay | null {
  if (typeof value !== 'object' || value === null) return null
  const candidate = value as Partial<UsageLedgerDay>
  if (!isSafeNonNegative(candidate.dailyTokens) || !isSafeNonNegative(candidate.appliedPoints)) return null
  return { dailyTokens: candidate.dailyTokens, appliedPoints: candidate.appliedPoints }
}

/** Tolerant load: malformed or wrong-version records read as absent (CTR-USG-009/010). */
function loadLedger(storage: UsageLedgerStorage | undefined): UsageLedgerV1 | null {
  if (!storage) return null
  let raw: string | null = null
  try {
    raw = storage.getItem(USAGE_LEDGER_STORAGE_KEY)
  } catch {
    return null
  }
  if (typeof raw !== 'string' || raw.length === 0) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const candidate = parsed as Partial<UsageLedgerV1>
  if (candidate.schemaVersion !== 1) return null
  const ledger = emptyLedger()
  if (isSafeNonNegative(candidate.cumulativePoints)) ledger.cumulativePoints = candidate.cumulativePoints
  if (isSafeNonNegative(candidate.revision)) ledger.revision = candidate.revision
  if (typeof candidate.byDay === 'object' && candidate.byDay !== null) {
    for (const [day, entry] of Object.entries(candidate.byDay)) {
      const normalized = normalizeDayEntry(entry)
      if (normalized !== null) ledger.byDay[day] = normalized
    }
  }
  if (typeof candidate.lastSeen === 'object' && candidate.lastSeen !== null) {
    for (const [sessionId, counted] of Object.entries(candidate.lastSeen)) {
      if (isSafeNonNegative(counted)) ledger.lastSeen[sessionId] = counted
    }
  }
  return ledger
}

/** Field-wise maxima of two ledgers; never regresses a strictly greater value (CTR-USG-009). */
function mergeLedgers(a: UsageLedgerV1, b: UsageLedgerV1): UsageLedgerV1 {
  const merged: UsageLedgerV1 = {
    schemaVersion: 1,
    cumulativePoints: Math.max(a.cumulativePoints, b.cumulativePoints),
    revision: Math.max(a.revision, b.revision),
    byDay: { ...a.byDay },
    lastSeen: { ...a.lastSeen },
  }
  for (const [day, entry] of Object.entries(b.byDay)) {
    const existing = merged.byDay[day]
    merged.byDay[day] = existing
      ? {
          dailyTokens: Math.max(existing.dailyTokens, entry.dailyTokens),
          appliedPoints: Math.max(existing.appliedPoints, entry.appliedPoints),
        }
      : { ...entry }
  }
  for (const [sessionId, counted] of Object.entries(b.lastSeen)) {
    merged.lastSeen[sessionId] = Math.max(merged.lastSeen[sessionId] ?? 0, counted)
  }
  return merged
}

/** Keep `byDay` bounded at 90 local days; drop `lastSeen` for absent sessions (CTR-USG-011). */
function pruneLedger(ledger: UsageLedgerV1, day: string, presentSessionIds: ReadonlySet<string>): void {
  const cutoff = new Date(`${day}T00:00:00`)
  cutoff.setDate(cutoff.getDate() - BYDAY_RETENTION_DAYS)
  const cutoffDay = cutoff.toISOString().slice(0, 10)
  for (const key of Object.keys(ledger.byDay)) {
    if (key < cutoffDay || key > day) delete ledger.byDay[key]
  }
  for (const sessionId of Object.keys(ledger.lastSeen)) {
    if (!presentSessionIds.has(sessionId)) delete ledger.lastSeen[sessionId]
  }
}

export interface DshUsageProgressSourceOptions {
  readonly storage?: UsageLedgerStorage
  readonly clock?: UsageClock
}

/**
 * The source observes session-list snapshots; gains beyond first-observation
 * baselines join the device-local day's `dailyTokens` and apply the frozen
 * log2 target's positive increment as `progressPoints` (CTR-USG-005..008).
 */
export class DshUsageProgressSource implements ProgressSource {
  readonly sourceId = USAGE_SOURCE_ID

  readonly #listeners = new Set<(snapshot: unknown) => void>()
  readonly #storage: UsageLedgerStorage | undefined
  readonly #clock: UsageClock
  #ledger: UsageLedgerV1 = emptyLedger()

  constructor(options: DshUsageProgressSourceOptions = {}) {
    this.#storage = options.storage
    this.#clock = options.clock ?? realClock
    // Hydrate from storage; malformed/absent records leave the empty ledger
    // (a lost ledger re-baselines at current totals per CTR-USG-009).
    const stored = loadLedger(this.#storage)
    if (stored !== null) this.#ledger = stored
  }

  subscribe(listener: (snapshot: unknown) => void): () => void {
    this.#listeners.add(listener)
    // Re-broadcast the persisted total so a reload converges on the stored
    // state (CTR-USG-009); same-revision duplicates are Engine-tolerated.
    listener(this.snapshot())
    return () => {
      this.#listeners.delete(listener)
    }
  }

  /** Apply one session-list observation. Silent on every degenerate input. */
  observe(list: UsageSessionListLike): void {
    try {
      this.#observe(list)
    } catch {
      // Never surface errors to the resident surface (CTR-USG-010).
    }
  }

  dispose(): void {
    this.#listeners.clear()
  }

  /** Current ledger state (test/inspection seam; not part of ProgressSource). */
  get ledger(): Readonly<UsageLedgerV1> {
    return this.#ledger
  }



  snapshot(): unknown {
    return {
      schemaVersion: 1 as const,
      sourceId: USAGE_SOURCE_ID,
      subjectId: USAGE_SUBJECT_ID,
      progressPoints: this.#ledger.cumulativePoints,
      revision: this.#ledger.revision,
      observedAt: this.#clock.now().toISOString(),
    }
  }

  #emit(): void {
    const snapshot = this.snapshot()
    for (const listener of this.#listeners) listener(snapshot)
  }

  /** Re-read stored state and adopt field-wise maxima before observing (CTR-USG-009). */
  #mergeStored(): void {
    const stored = loadLedger(this.#storage)
    if (stored !== null) this.#ledger = mergeLedgers(stored, this.#ledger)
  }

  #persist(): void {
    if (!this.#storage) return
    try {
      // Re-read then merge so a concurrent writer's strictly greater values
      // survive (stale tabs can never regress the stored record).
      const stored = loadLedger(this.#storage)
      if (stored !== null) this.#ledger = mergeLedgers(stored, this.#ledger)
      this.#storage.setItem(USAGE_LEDGER_STORAGE_KEY, JSON.stringify(this.#ledger))
    } catch {
      // Storage failure degrades this source to memory (CTR-USG-010).
    }
  }

  #observe(list: UsageSessionListLike): void {
    this.#mergeStored()
    const day = this.#clock.localDay()
    const byId = list.byId ?? {}
    const presentSessionIds = new Set(Object.keys(byId))
    const firstOfDay = this.#ledger.byDay[day] === undefined
    if (firstOfDay && (Object.keys(this.#ledger.byDay).length > 0 || Object.keys(this.#ledger.lastSeen).length > 0)) {
      pruneLedger(this.#ledger, day, presentSessionIds)
    }
    const dayEntry = this.#ledger.byDay[day] ?? { dailyTokens: 0, appliedPoints: 0 }
    let gainTotal = 0
    let touched = firstOfDay
    for (const [sessionId, summary] of Object.entries(byId)) {
      const usage = summary?.projectionValues?.tokenUsage
      if (!usage) continue // capability absent for this session: no new counts (CTR-USG-004)
      touched = true
      const counted = countedTokensOf(usage)
      const previous = this.#ledger.lastSeen[sessionId]
      if (previous === undefined) {
        // First observation seeds silently and attributes nothing (CTR-USG-006).
        this.#ledger.lastSeen[sessionId] = counted
        continue
      }
      const delta = Math.max(0, counted - previous)
      if (delta === 0) continue
      this.#ledger.lastSeen[sessionId] = counted
      dayEntry.dailyTokens += delta
      const target = Math.floor(dailyTargetPoints(dayEntry.dailyTokens))
      const gain = target - dayEntry.appliedPoints
      if (gain > 0) {
        dayEntry.appliedPoints = target
        this.#ledger.cumulativePoints += gain
        gainTotal += gain
      }
    }
    if (!touched) return
    this.#ledger.byDay[day] = dayEntry
    if (gainTotal > 0) {
      this.#ledger.revision += 1
      this.#persist()
      this.#emit()
    } else {
      // Seed/prune-only observations still persist so the baseline survives.
      this.#persist()
    }
  }
}
