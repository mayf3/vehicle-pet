/**
 * Welcome-back and daily ritual rules (DSH_PET_OVERLAY_ADAPTER_V7
 * DEC-OVERLAY-025 / CTR-OVERLAY-035/036). Pure functions over the tolerant
 * browser-local ritual fields; no guilt, absence duration, streak, penalty,
 or obligation may ever be derived or phrased from these inputs.
 */

import type { RitualMarkers } from './types'

/** V7 band ≥8 h; frozen at 8 h. */
export const WELCOME_BACK_THRESHOLD_MS = 8 * 60 * 60 * 1000


export const EMPTY_RITUAL_MARKERS: RitualMarkers = {
  dayKey: undefined,
  firstCompletionDone: false,
  lateNightDone: false,
  welcomeDayKey: undefined,
}

/** Local calendar day key `YYYY-MM-DD` in device-local time. */
export function localDayKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Ritual day key for the late-night window: the hours before 05:00 belong to
 * the previous evening's ritual day, so one night never fires twice.
 */
export function lateNightRitualDayKey(date: Date): string {
  if (date.getHours() < 5) {
    return localDayKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1))
  }
  return localDayKey(date)
}

export function shouldWelcomeBack(
  lastSeenAt: number | null | undefined,
  now: number,
  todayKey: string,
  markers: RitualMarkers,
): boolean {
  if (typeof lastSeenAt !== 'number' || !Number.isFinite(lastSeenAt) || lastSeenAt <= 0) return false
  if (now - lastSeenAt < WELCOME_BACK_THRESHOLD_MS) return false
  if (markers.welcomeDayKey === todayKey) return false
  return true
}

/** First-completion-of-the-day check; the caller persists the marker after speaking. */
export function isFirstCompletionToday(markers: RitualMarkers, todayKey: string): boolean {
  return markers.dayKey === todayKey ? !markers.firstCompletionDone : true
}

export function isLateNightRitualDue(markers: RitualMarkers, ritualDayKey: string): boolean {
  return !(markers.dayKey === ritualDayKey && markers.lateNightDone)
}

/** Next marker record after a ritual of the given kind fired. */
export function recordRitual(
  markers: RitualMarkers,
  kind: 'first-completion' | 'late-night' | 'welcome',
  todayKey: string,
): RitualMarkers {
  if (kind === 'welcome') {
    return { ...markers, welcomeDayKey: todayKey }
  }
  // First completion / late night reset when the local day rolled over.
  const base = markers.dayKey === todayKey ? markers : { ...markers, firstCompletionDone: false, lateNightDone: false }
  return kind === 'first-completion'
    ? { ...base, dayKey: todayKey, firstCompletionDone: true }
    : { ...base, dayKey: todayKey, lateNightDone: true }
}
