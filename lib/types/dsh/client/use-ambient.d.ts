/**
 * Ambient behavior scheduler (DSH_PET_OVERLAY_ADAPTER_V7
 * DEC-OVERLAY-023 / CTR-OVERLAY-033). One slow adapter-owned timer; verdicts
 * come from the pure rules in ambient-rules.ts. Attempts consumed by typing,
 * hidden documents, non-idle states, or the interaction cooldown are not
 * replayed. The deadline persists across character switches (shared cadence,
 * CTR-037); the repertoire follows the selected character.
 */
import { type AmbientActionDefinition } from './ambient-rules';
import type { DaypartBucket } from './daypart';
import type { CharacterId } from './types';
export interface AmbientSchedulerOptions {
    readonly characterId: CharacterId;
    readonly daypartBucket: DaypartBucket;
    /** Payload-ignored cadence snapshot from the speech controller. */
    readonly readCadence: () => {
        readonly mountedAt: number;
        readonly lastInputAt: number | null;
        readonly sessionState: 'idle' | 'working' | 'needs-input' | 'terminal';
        readonly now: number;
    };
    /** Epoch ms of the last direct interaction (click/petting/drag/menu), or 0. */
    readonly readLastInteractionAt: () => number;
    /** False while reduced motion or the petting episode suppresses actions. */
    readonly enabled: boolean;
    readonly play: (action: AmbientActionDefinition) => void;
    readonly random?: () => number;
}
export declare function useAmbientBehavior(options: AmbientSchedulerOptions): void;
//# sourceMappingURL=use-ambient.d.ts.map