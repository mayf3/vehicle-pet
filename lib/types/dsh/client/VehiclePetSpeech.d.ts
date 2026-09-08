/**
 * VehiclePetSpeech: the single non-modal speech bubble and its scheduler
 * (DSH_PET_OVERLAY_ADAPTER_V3 CTR-OVERLAY-017/018/019). Lines come only from
 * the bundled catalog through the pure rules in speech-rules.ts; triggers are
 * structured session edges, engine milestone events, direct interaction, and
 * a bounded idle timer. The input-recency listener records timestamps only —
 * never key values, targets, or any host content. Every timer and listener is
 * returned as a disposer (CTR-OVERLAY-012). The bubble is aria-live=polite,
 * never focusable, replaces (never stacks), and auto-dismisses within the
 * bounded window.
 */
import { type ReactElement } from 'react';
import type { VehiclePetSessionView } from './types';
import type { SpeechCategory } from './speech-catalog';
export interface VehiclePetSpeechController {
    /** Current visible line, or null. Replacements reuse the same bubble. */
    readonly bubble: {
        readonly text: string;
        readonly key: number;
    } | null;
    /** Attempt a click line (throttled by CTR-OVERLAY-019(7)). */
    readonly speakForClick: (category: SpeechCategory) => void;
    /** Announce a level-up / keepsake moment (proud presentation + line). */
    readonly speakMilestone: () => void;
    /** Effective idle bucket for the expression layer. */
    readonly idleBucket: 0 | 1 | 2;
    /** True while a level-up / keepsake moment should present proudly. */
    readonly milestoneActive: boolean;
}
interface SchedulerOptions {
    readonly sessionView: VehiclePetSessionView;
    readonly locale: string | undefined;
    readonly enabled: boolean;
}
export declare function useVehiclePetSpeech(options: SchedulerOptions): VehiclePetSpeechController;
export interface VehiclePetBubbleProps {
    readonly bubble: {
        readonly text: string;
        readonly key: number;
    } | null;
    readonly placement: 'above' | 'below';
}
/** The polite, non-modal, non-focusable bubble surface (CTR-OVERLAY-017). */
export declare function VehiclePetBubble(props: VehiclePetBubbleProps): ReactElement | null;
export {};
//# sourceMappingURL=VehiclePetSpeech.d.ts.map