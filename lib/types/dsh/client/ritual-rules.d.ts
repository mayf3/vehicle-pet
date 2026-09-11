/**
 * Welcome-back and daily ritual rules (DSH_PET_OVERLAY_ADAPTER_V7
 * DEC-OVERLAY-025 / CTR-OVERLAY-035/036). Pure functions over the tolerant
 * browser-local ritual fields; no guilt, absence duration, streak, penalty,
 or obligation may ever be derived or phrased from these inputs.
 */
import type { RitualMarkers } from './types';
/** V7 band ≥8 h; frozen at 8 h. */
export declare const WELCOME_BACK_THRESHOLD_MS: number;
export declare const EMPTY_RITUAL_MARKERS: RitualMarkers;
/** Local calendar day key `YYYY-MM-DD` in device-local time. */
export declare function localDayKey(date: Date): string;
/**
 * Ritual day key for the late-night window: the hours before 05:00 belong to
 * the previous evening's ritual day, so one night never fires twice.
 */
export declare function lateNightRitualDayKey(date: Date): string;
export declare function shouldWelcomeBack(lastSeenAt: number | null | undefined, now: number, todayKey: string, markers: RitualMarkers): boolean;
/** First-completion-of-the-day check; the caller persists the marker after speaking. */
export declare function isFirstCompletionToday(markers: RitualMarkers, todayKey: string): boolean;
export declare function isLateNightRitualDue(markers: RitualMarkers, ritualDayKey: string): boolean;
/** Next marker record after a ritual of the given kind fired. */
export declare function recordRitual(markers: RitualMarkers, kind: 'first-completion' | 'late-night' | 'welcome', todayKey: string): RitualMarkers;
//# sourceMappingURL=ritual-rules.d.ts.map