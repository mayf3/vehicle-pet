import type { VehiclePetExpressionState } from './expressions';
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
type Reaction = typeof PLAYFUL_REACTIONS[number];
interface Context {
    state: VehiclePetExpressionState;
    terminalIdentity: string | null;
    characterId: CharacterId;
    menuOpen: boolean;
    dragging: boolean;
    ambientKey: number | null;
}
export declare function usePlayfulReaction(context: Context): {
    reaction: {
        definition: Reaction;
        key: number;
        motionAllowed: boolean;
    } | null;
    reduced: boolean;
    play: () => void;
    cancel: () => void;
};
export declare function ReactionDecoration({ kind }: {
    kind: Reaction['decoration'];
}): import("react").JSX.Element;
export {};
//# sourceMappingURL=playful-reactions.d.ts.map