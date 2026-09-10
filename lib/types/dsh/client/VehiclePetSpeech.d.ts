/**
 * VehiclePetSpeech: the single non-modal speech bubble and its scheduler
 * (DSH_PET_OVERLAY_ADAPTER_V3 CTR-OVERLAY-017/018/019; V7 CTR-030/033/035/036
 * add explicit petting/welcome/ritual triggers through the same scheduler).
 * Lines come only from the bundled catalog through the pure rules in
 * speech-rules.ts; triggers are structured session edges, engine milestone
 * events, direct interaction, a bounded idle timer, and the V7 explicit path.
 * The input-recency listener records timestamps only — never key values,
 * targets, or any host content. Every timer and listener is returned as a
 * disposer (CTR-OVERLAY-012). The bubble is aria-live=polite, never
 * focusable, replaces (never stacks), and auto-dismisses within the bounded
 * window.
 */
import { type ReactElement } from 'react';
import type { VehiclePetSessionView } from './types';
import type { RitualMarkers } from './types';
import { type SpeechTriggerSource } from './speech-rules';
import { type SpeechCategory } from './speech-catalog';
import type { CharacterId } from './types';
type DaypartBucket = 'morning' | 'daytime' | 'evening' | 'late-night';
export interface VehiclePetSpeechController {
    /** Current visible line, or null. Replacements reuse the same bubble. */
    readonly bubble: {
        readonly text: string;
        readonly key: number;
        readonly source?: SpeechTriggerSource['kind'];
    } | null;
    /** Attempt a click line (throttled by CTR-OVERLAY-019(7)). */
    readonly speakForClick: (category: SpeechCategory) => void;
    /** Announce a level-up / keepsake moment (proud presentation + line). */
    readonly speakMilestone: () => void;
    /** V7 explicit path: petting / welcome-back / ritual line, once called. */
    readonly speakExplicit: (category: SpeechCategory) => void;
    /** V7 explicit path delayed until the load-quiet period has elapsed. */
    readonly speakAfterQuiet: (category: SpeechCategory) => void;
    /** Effective idle bucket for the expression layer. */
    readonly idleBucket: 0 | 1 | 2;
    /** True while a level-up / keepsake moment should present proudly. */
    readonly milestoneActive: boolean;
    /** Payload-ignored cadence snapshot for the ambient behavior layer. */
    readonly readCadence: () => {
        readonly mountedAt: number;
        readonly lastInputAt: number | null;
        readonly sessionState: 'idle' | 'working' | 'needs-input' | 'terminal';
        readonly now: number;
    };
}
export interface VehiclePetRitualHooks {
    /** Current tolerant ritual markers (preference record). */
    readonly getMarkers: () => RitualMarkers;
    /** Persist a fired ritual (once-per-local-day bookkeeping). */
    readonly onRitual: (kind: 'first-completion' | 'late-night' | 'welcome') => void;
}
interface SchedulerOptions {
    readonly characterId?: CharacterId;
    readonly random?: () => number;
    readonly sessionView: VehiclePetSessionView;
    readonly locale: string | undefined;
    readonly enabled: boolean;
    /** V7 CTR-034: daypart slides the recurring delay inside the 20–40 s band. */
    readonly daypartBucket?: DaypartBucket;
    /** V7 CTR-036: first-completion-of-day speaks the ritual category once. */
    readonly rituals?: VehiclePetRitualHooks;
    /**
     * V7 CTR-030: while a petting hold is active, recurring attempts are
     * consumed (no catch-up) instead of interrupting the episode.
     */
    readonly pettingActive?: boolean;
}
export declare function useVehiclePetSpeech(options: SchedulerOptions): VehiclePetSpeechController;
export interface VehiclePetBubbleProps {
    readonly bubble: {
        readonly text: string;
        readonly key: number;
        readonly source?: SpeechTriggerSource['kind'];
    } | null;
    readonly placement: 'above' | 'below';
}
/** The polite, non-modal, non-focusable bubble surface (CTR-OVERLAY-017). */
export declare function VehiclePetBubble(props: VehiclePetBubbleProps): ReactElement | null;
export {};
//# sourceMappingURL=VehiclePetSpeech.d.ts.map