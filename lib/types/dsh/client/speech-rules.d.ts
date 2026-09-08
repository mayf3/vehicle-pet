/**
 * Pure speech cadence and selection rules (DSH_PET_OVERLAY_ADAPTER_V3
 * CTR-OVERLAY-018/019). Every function here is deterministic over structured
 * inputs and unit-testable; the React scheduler only applies their verdicts
 * and owns the timers. No model call, no content reading — line selection
 * never sees anything but a category, a rotation counter, and recent-history
 * indices.
 */
import { type SpeechCategory } from './speech-catalog';
/** Bubble auto-dismiss: target 4 s, hard bounds 3–6 s (CTR-OVERLAY-017). */
export declare const SPEECH_AUTO_DISMISS_MS = 4000;
export declare const SPEECH_AUTO_DISMISS_MIN_MS = 3000;
export declare const SPEECH_AUTO_DISMISS_MAX_MS = 6000;
/** Load quiet period: no speech within 30 s of surface mount (CTR-019(1)). */
export declare const SPEECH_LOAD_QUIET_MS = 30000;
/** Ambient idle lines: at most one per 600 s (CTR-019(3)). */
export declare const SPEECH_AMBIENT_MIN_INTERVAL_MS = 600000;
/** Payload-ignored input recency window suppressing ambient lines (CTR-019(3)). */
export declare const SPEECH_TYPING_SUPPRESSION_MS = 15000;
/** Working rotation: min gap and per-running-period cap (CTR-019(4)). */
export declare const SPEECH_WORKING_ROTATION_MS = 120000;
export declare const SPEECH_WORKING_MAX_PER_PERIOD = 3;
/** Click lines: at most one per 30 s (CTR-019(7)). */
export declare const SPEECH_CLICK_THROTTLE_MS = 30000;
/** Activity recency buckets for the idle expression (bounded, payload-ignored). */
export declare const IDLE_BUCKET_MID_MS = 120000;
export declare const IDLE_BUCKET_LONG_MS = 600000;
/** Why the scheduler wants to speak; one verdict per source. */
export type SpeechTriggerSource = {
    readonly kind: 'session-edge';
    readonly category: SpeechCategory;
} | {
    readonly kind: 'milestone';
    readonly category: 'milestone';
} | {
    readonly kind: 'ambient';
} | {
    readonly kind: 'click';
    readonly category: SpeechCategory;
};
export interface SpeechCadenceState {
    /** Epoch ms of surface mount. */
    readonly mountedAt: number;
    /** Epoch ms of the last shown line (any category), or null. */
    readonly lastSpokenAt: number | null;
    /** Epoch ms of the last payload-ignored user input signal, or null. */
    readonly lastInputAt: number | null;
    /** Epoch ms of the last ambient line, or null. */
    readonly lastAmbientAt: number | null;
    /** Epoch ms of the last click line, or null. */
    readonly lastClickSpokenAt: number | null;
    /** Epoch ms when the current running period started, or null. */
    readonly runningPeriodStartedAt: number | null;
    /** Lines already shown in the current running period. */
    readonly workingLinesThisPeriod: number;
    /** "now", injected for determinism. */
    readonly now: number;
}
export type SpeechVerdict = {
    readonly allowed: true;
} | {
    readonly allowed: false;
    readonly reason: 'load-quiet' | 'typing' | 'ambient-interval' | 'click-throttle' | 'working-cap';
};
/** CTR-OVERLAY-019 cadence matrix. Ambient uses only the `ambient` source. */
export declare function evaluateCadence(source: SpeechTriggerSource, cadence: SpeechCadenceState): SpeechVerdict;
export interface SpeechSelectionState {
    /** The index of the most recently spoken line within the same category, or null. */
    readonly lastIndexInCategory: number | null;
    /** Stable per-session rotation counter (incremented on every selection). */
    readonly rotationCounter: number;
}
export interface SpeechSelection {
    /** Index into the locale catalog for the chosen line. */
    readonly index: number;
    readonly text: string;
    readonly nextRotationCounter: number;
}
/**
 * CTR-OVERLAY-018 selection: pure, rotation-driven, and never repeats the
 * identical line twice in a row within the same category.
 */
export declare function selectSpeechLine(category: SpeechCategory, locale: string | undefined, selection: SpeechSelectionState): SpeechSelection;
/** Bounded idle bucket from payload-ignored activity recency (expressions). */
export declare function idleBucketFor(lastActivityAt: number | null, now: number): 0 | 1 | 2;
//# sourceMappingURL=speech-rules.d.ts.map