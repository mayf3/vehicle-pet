/**
 * Frozen counts-only token economy for DshUsageProgressSource
 * (DSH_USAGE_PROGRESS_SOURCE_V1 §8 DEC-USG-002..007, Contracts CTR-USG-004/005).
 * The constants and the mapping form are normative only in that Spec: no
 * configuration surface may alter them. Pure functions only — deterministic,
 * replay-safe, no reads of anything but the numeric arguments given.
 */

export const USAGE_SOURCE_ID = 'dsh-usage'
export const USAGE_SUBJECT_ID = 'companion'

/** DEC-USG-005: frozen calibration constants. */
export const TOKEN_SCALE = 1_000_000
export const DAILY_COEFFICIENT = 1_350
export const DAILY_CAP = 12_000

/** DEC-USG-007: ledger retention bound (local days). */
export const LEDGER_RETENTION_DAYS = 90

export const USAGE_LEDGER_KEY = 'vehicle-pet/usage-ledger/v1'

/**
 * CTR-USG-005: `DAILY_TARGET_POINTS(T) = min(12000, 1350 x log2(1 + T / 1e6))`.
 * Float target; callers apply the floor-to-integer rule per day.
 */
export function dailyTargetPoints(countedTokens: number): number {
  return Math.min(DAILY_CAP, DAILY_COEFFICIENT * Math.log2(1 + countedTokens / TOKEN_SCALE))
}

/** CTR-USG-004 normalization: `n(v) = v` for safe non-negative integers, else 0. */
export function normalizeCount(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : 0
}

/**
 * CTR-USG-003/004: structural counts-only read of one `tokenUsage` projection
 * value. Only the two counted numeric fields are touched; cache read/write and
 * reasoning classes are ignored even when present; absent/malformed reads as 0.
 */
export function countedFromTokenUsage(value: unknown): number {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return 0
  const record = value as Record<string, unknown>
  return normalizeCount(record['uncachedInputTokens']) + normalizeCount(record['outputTokens'])
}

/** CTR-USG-007: device-local `YYYY-MM-DD` day of the given moment. */
export function localDayOf(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** The frozen ledger record shape (CTR-USG-009). */
export interface UsageLedger {
  schemaVersion: 1
  cumulativePoints: number
  revision: number
  byDay: Record<string, { tokens: number; appliedPoints: number }>
  lastSeen: Record<string, number>
}

export function emptyLedger(): UsageLedger {
  return { schemaVersion: 1, cumulativePoints: 0, revision: 0, byDay: {}, lastSeen: {} }
}

function normalizeDayEntry(value: unknown): { tokens: number; appliedPoints: number } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { tokens: 0, appliedPoints: 0 }
  }
  const record = value as Record<string, unknown>
  return {
    tokens: normalizeCount(record['tokens']),
    appliedPoints: normalizeCount(record['appliedPoints']),
  }
}

function normalizeCountMap(value: unknown): Record<string, number> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return {}
  const source = value as Record<string, unknown>
  const result: Record<string, number> = {}
  for (const [key, entry] of Object.entries(source)) {
    if (typeof entry === 'number' && Number.isSafeInteger(entry) && entry >= 0) {
      result[key] = entry
    }
  }
  return result
}

/**
 * CTR-USG-009: tolerant normalization. Any malformed, wrong-version, or
 * hostile stored value degrades to an empty (in-memory) ledger.
 */
export function normalizeLedger(raw: unknown): UsageLedger {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return emptyLedger()
  const record = raw as Record<string, unknown>
  if (record['schemaVersion'] !== 1) return emptyLedger()
  const byDay: Record<string, { tokens: number; appliedPoints: number }> = {}
  if (typeof record['byDay'] === 'object' && record['byDay'] !== null && !Array.isArray(record['byDay'])) {
    for (const [day, entry] of Object.entries(record['byDay'] as Record<string, unknown>)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue
      byDay[day] = normalizeDayEntry(entry)
    }
  }
  return {
    schemaVersion: 1,
    cumulativePoints: normalizeCount(record['cumulativePoints']),
    revision: normalizeCount(record['revision']),
    byDay,
    lastSeen: normalizeCountMap(record['lastSeen']),
  }
}

/** Lexicographic max for `YYYY-MM-DD` strings (zero-padded, sortable). */
export function maxDay(a: string, b: string): string {
  return a >= b ? a : b
}

/**
 * CTR-USG-011: bound the ledger at the first observation of a new day.
 * `byDay` entries older than the 90-day window are dropped (their applied
 * points remain baked into `cumulativePoints`); `lastSeen` entries for
 * sessions absent from that day's first list snapshot are dropped.
 */
export function pruneLedger(
  ledger: UsageLedger,
  today: string,
  presentSessionIds: ReadonlySet<string>,
): UsageLedger {
  const cutoffDay = (() => {
    const parts = today.split('-').map(Number) as [number, number, number]
    const cutoff = new Date(parts[0]!, parts[1]! - 1, parts[2]! - LEDGER_RETENTION_DAYS)
    return localDayOf(cutoff)
  })()
  const byDay: UsageLedger['byDay'] = {}
  for (const [day, entry] of Object.entries(ledger.byDay)) {
    if (day >= cutoffDay) byDay[day] = entry
  }
  const lastSeen: Record<string, number> = {}
  for (const [sessionId, seen] of Object.entries(ledger.lastSeen)) {
    if (presentSessionIds.has(sessionId)) lastSeen[sessionId] = seen
  }
  return { ...ledger, byDay, lastSeen }
}

/**
 * CTR-USG-009 merge-guard: field-wise maxima of two records of the same
 * lineage. A stale tab's record can never regress a newer stored value.
 */
export function mergeLedger(a: UsageLedger, b: UsageLedger): UsageLedger {
  const byDay: UsageLedger['byDay'] = {}
  for (const day of new Set([...Object.keys(a.byDay), ...Object.keys(b.byDay)])) {
    const left = a.byDay[day]
    const right = b.byDay[day]
    byDay[day] = {
      tokens: Math.max(left?.tokens ?? 0, right?.tokens ?? 0),
      appliedPoints: Math.max(left?.appliedPoints ?? 0, right?.appliedPoints ?? 0),
    }
  }
  const lastSeen: Record<string, number> = { ...a.lastSeen }
  for (const [sessionId, seen] of Object.entries(b.lastSeen)) {
    lastSeen[sessionId] = Math.max(lastSeen[sessionId] ?? 0, seen)
  }
  return {
    schemaVersion: 1,
    cumulativePoints: Math.max(a.cumulativePoints, b.cumulativePoints),
    revision: Math.max(a.revision, b.revision),
    byDay,
    lastSeen,
  }
}
