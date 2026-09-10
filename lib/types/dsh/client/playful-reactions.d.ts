import type { VehiclePetExpressionState, VehiclePetExpressionVariant } from './expressions';
import type { AmbientActionDefinition } from './ambient-rules';
import type { CharacterId } from './types';
export declare const PLAYFUL_REACTIONS: readonly [{
    readonly id: "wave";
    readonly variant: "idle-happy";
    readonly decoration: "hello";
}, {
    readonly id: "wink";
    readonly variant: "completed-proud";
    readonly decoration: "star";
}, {
    readonly id: "bounce";
    readonly variant: "completed";
    readonly decoration: "notes";
}, {
    readonly id: "peek";
    readonly variant: "idle-curious";
    readonly decoration: "question";
}, {
    readonly id: "shy";
    readonly variant: "cancelled";
    readonly decoration: "heart";
}, {
    readonly id: "sleepy";
    readonly variant: "idle-sleepy";
    readonly decoration: "sleep";
}, {
    readonly id: "proud";
    readonly variant: "completed-proud";
    readonly decoration: "sparkles";
}, {
    readonly id: "nod";
    readonly variant: "idle-happy";
    readonly decoration: "flower";
}];
/**
 * A rendered reaction: pool entries keep their own animation key; ambient and
 * petting presentations carry the gesture class their action definition
 * selects. `anim` keys into the bounded one-shot CSS gesture set.
 */
export interface RenderedReaction {
    readonly definition: {
        readonly id: string;
        readonly anim: string;
        readonly variant: VehiclePetExpressionVariant;
        readonly decoration: string;
    };
    readonly key: number;
    readonly motionAllowed: boolean;
    /** Held reactions (petting) persist until released; never auto-cleared. */
    readonly held: boolean;
}
interface Context {
    state: VehiclePetExpressionState;
    terminalIdentity: string | null;
    characterId: CharacterId;
    menuOpen: boolean;
    dragging: boolean;
    ambientKey: number | null;
}
export declare function usePlayfulReaction(context: Context): {
    reaction: RenderedReaction | null;
    reduced: boolean;
    play: () => void;
    playPetting: () => void;
    releasePetting: () => void;
    playAmbient: (action: AmbientActionDefinition) => void;
    playSettle: () => void;
    playDragLift: () => void;
    cancel: () => void;
};
export declare function ReactionDecoration({ kind }: {
    kind: string;
}): import("react").JSX.Element;
export {};
//# sourceMappingURL=playful-reactions.d.ts.map