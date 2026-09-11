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
import type { ProgressSource } from '../../engine';
import type { OverlayObservable } from './session-state-adapter';
export declare const USAGE_SOURCE_ID = "dsh-usage";
export declare const USAGE_SUBJECT_ID = "companion";
export declare const USAGE_LEDGER_STORAGE_KEY = "vehicle-pet/usage-ledger/v1";
/** Frozen calibration constants (DEC-USG-005); no configuration surface. */
export declare const TOKEN_SCALE = 1000000;
export declare const DAILY_COEFFICIENT = 1350;
export declare const DAILY_CAP = 12000;
/** The pinned projection value fields this source reads (counts only). */
export interface UsageTokenUsageLike {
    readonly uncachedInputTokens?: number;
    readonly outputTokens?: number;
    readonly cacheReadTokens?: number;
    readonly cacheWriteTokens?: number;
    readonly reasoningTokens?: number;
}
export interface UsageSessionSummaryLike {
    readonly projectionValues?: {
        readonly tokenUsage?: UsageTokenUsageLike | undefined;
    } & Record<string, unknown>;
}
export interface UsageSessionListLike {
    readonly byId: Readonly<Record<string, UsageSessionSummaryLike | undefined>>;
}
/** The pinned `ctx.sessions` surface this source consumes. */
export interface UsageSessionsSource {
    readonly list: OverlayObservable<UsageSessionListLike>;
}
/** `n(v) = v` for safe non-negative integers, else 0 (CTR-USG-004). */
export declare function normalizedCount(value: unknown): number;
export declare function countedTokensOf(usage: UsageTokenUsageLike): number;
/** Frozen progress function target (real-valued; callers floor at application). */
export declare function dailyTargetPoints(totalTokens: number): number;
export interface UsageLedgerDay {
    dailyTokens: number;
    appliedPoints: number;
}
export interface UsageLedgerV1 {
    schemaVersion: 1;
    cumulativePoints: number;
    revision: number;
    byDay: Record<string, UsageLedgerDay>;
    lastSeen: Record<string, number>;
}
/** Minimal storage face (localStorage subset) so tests can inject fakes. */
export interface UsageLedgerStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}
export interface UsageClock {
    /** Device-local `YYYY-MM-DD` of "now" (CTR-USG-007). */
    localDay(): string;
    now(): Date;
}
export interface DshUsageProgressSourceOptions {
    readonly storage?: UsageLedgerStorage;
    readonly clock?: UsageClock;
}
/**
 * The source observes session-list snapshots; gains beyond first-observation
 * baselines join the device-local day's `dailyTokens` and apply the frozen
 * log2 target's positive increment as `progressPoints` (CTR-USG-005..008).
 */
export declare class DshUsageProgressSource implements ProgressSource {
    #private;
    readonly sourceId = "dsh-usage";
    constructor(options?: DshUsageProgressSourceOptions);
    subscribe(listener: (snapshot: unknown) => void): () => void;
    /** Apply one session-list observation. Silent on every degenerate input. */
    observe(list: UsageSessionListLike): void;
    dispose(): void;
    /** Current ledger state (test/inspection seam; not part of ProgressSource). */
    get ledger(): Readonly<UsageLedgerV1>;
    snapshot(): unknown;
}
//# sourceMappingURL=usage-progress-source.d.ts.map