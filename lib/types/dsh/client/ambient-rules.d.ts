/**
 * Quiet ambient behavior layer (DSH_PET_OVERLAY_ADAPTER_V7
 * DEC-OVERLAY-023 / CTR-OVERLAY-033). Pure cadence and selection rules; the
 * React hook only applies verdicts and owns the one ambient timer. The
 * repertoire is declarative per character (BEHAVIOR_PROFILES in
 * characters.ts); every action renders from approved masters plus bounded
 * code-native motion. Daypart weighting (CTR-034) enters only as selection
 * weights. No speech scheduling happens here — any line still flows through
 * the single CTR-019 scheduler.
 */
import type { CharacterId } from './types';
import { type DaypartBucket } from './daypart';
/** Minutes-level randomized gap; V7 band floor 90 s, frozen 90–240 s. */
export declare const AMBIENT_GAP_MIN_MS = 90000;
export declare const AMBIENT_GAP_MAX_MS = 240000;
/** No ambient action within the first 120 s of mount. */
export declare const AMBIENT_LOAD_QUIET_MS = 120000;
/** Payload-ignored input recency window suppressing ambient actions. */
export declare const AMBIENT_TYPING_SUPPRESSION_MS = 10000;
/** No ambient action within 120 s of the last direct interaction. */
export declare const AMBIENT_INTERACTION_COOLDOWN_MS = 120000;
/** Declarative ambient repertoire (approved masters + bounded motion only). */
export interface AmbientActionDefinition {
    readonly id: string;
    readonly variant: 'idle' | 'idle-happy' | 'idle-curious' | 'idle-sleepy';
    readonly gesture: 'look-left' | 'look-right' | 'peek' | 'blink' | 'shuffle' | 'stretch' | 'nod' | 'melt';
    readonly decoration: 'none' | 'question' | 'sparkles' | 'sleep' | 'flower';
    /** -1 sleepy … +1 energetic; daypart energy bias multiplies selection. */
    readonly energy: number;
}
export declare const AMBIENT_ACTIONS: Readonly<Record<string, AmbientActionDefinition>>;
export interface AmbientCadenceState {
    /** Epoch ms of surface mount. */
    readonly mountedAt: number;
    /** Payload-ignored input recency, or null. */
    readonly lastInputAt: number | null;
    /** Epoch ms of the last direct interaction (click/petting/drag/menu), or null. */
    readonly lastInteractionAt: number | null;
    /** Epoch ms of the last emitted ambient action, or null. */
    readonly lastActionAt: number | null;
    /** Mapped session state ('terminal' covers an active terminal reaction). */
    readonly sessionState: 'idle' | 'working' | 'needs-input' | 'terminal';
    readonly documentHidden: boolean;
    readonly now: number;
}
export type AmbientVerdict = {
    readonly allowed: true;
} | {
    readonly allowed: false;
    readonly reason: 'load-quiet' | 'typing' | 'interaction-cooldown' | 'gap' | 'not-idle' | 'hidden';
};
export declare function evaluateAmbient(cadence: AmbientCadenceState): AmbientVerdict;
/** Injected random sample keeps the minutes-level deadline pure. */
export declare function nextAmbientDelayMs(sample: number): number;
/**
 * CTR-033/034 selection: pure over (profile pool, daypart, recent history,
 * injected random sample). Weight = base energy affinity × daypart energy
 * bias; the immediately previous action is excluded (no back-to-back).
 */
export declare function selectAmbientAction(characterId: CharacterId, bucket: DaypartBucket, lastActionId: string | null, randomSample: number): AmbientActionDefinition;
//# sourceMappingURL=ambient-rules.d.ts.map