/**
 * Structured Harness session → visual-only pet session view (CTR-OVERLAY-007,
 * CTR-OVERLAY-013). Consumes only typed/structured DSH session snapshots —
 * never DOM text, classes, or observers. Live states (running, needs-input)
 * persist while true; terminal turns (completed, failed, cancelled) produce
 * one short, edge-deduplicated reaction. Nothing here can touch progression.
 *
 * Terminal identity is deterministic (`sessionId#turn#turnEndSeq`), so reload,
 * resubscribe, list refresh, HMR, reconnect, and current-session switches
 * cannot replay an already-seen terminal as a new reaction: the first
 * snapshot observed for a binding seeds the seen-set silently, and only
 * identities appearing later emit.
 */
import type { VehiclePetSessionView, VehiclePetTerminalReaction } from './types';
/** Minimal structural mirror of the pinned DSH `HostObservable`. */
export interface OverlayObservable<T> {
    getSnapshot(): T;
    subscribe(fn: () => void): () => void;
}
/** The `turn/end` payload fields this adapter reads. */
interface TurnEndDataLike {
    readonly turn: number;
    readonly reason: {
        readonly kind: string;
    };
}
/** The `TurnLocation` fields this adapter reads. */
interface TurnLocationLike {
    readonly status: string;
    readonly end?: {
        readonly seq: number;
        readonly data: TurnEndDataLike;
    } | null;
}
/** The `ConversationSnapshot` fields this adapter reads. */
export interface ConversationLike {
    readonly running: boolean;
    readonly pending: readonly {
        readonly kind?: string;
    }[];
    /** 'cold' | 'loading' while the durable log has not been replayed yet. */
    readonly openState?: string;
    readonly lastAgentError?: string | null;
    readonly chat?: {
        readonly timeline?: {
            readonly turns?: ReadonlyMap<number, TurnLocationLike>;
        };
    };
}
/** The `SessionSummary` fields this adapter reads. */
export interface SessionSummaryLike {
    readonly pendingInteraction?: string;
}
/** The `SessionListState` fields this adapter reads. */
export interface SessionListLike {
    readonly phase: string;
    readonly current: string | undefined;
    readonly byId: Record<string, SessionSummaryLike | undefined>;
}
/** One selected-session binding (`sessions.binding(id)`). */
export interface SessionBindingLike {
    readonly session: OverlayObservable<ConversationLike>;
}
/** The pinned `ctx.sessions` surface this adapter consumes. */
export interface VehiclePetSessionsSource {
    readonly list: OverlayObservable<SessionListLike>;
    binding(id: string): SessionBindingLike | undefined;
}
export interface VehiclePetSessionAdapterOptions {
    /** How long a terminal reaction stays presented. */
    readonly terminalDurationMs?: number;
    readonly setTimer?: (callback: () => void, delay: number) => unknown;
    readonly clearTimer?: (handle: unknown) => void;
}
/** Map a structured `turn/end` reason kind to the pet terminal reaction status. */
export declare function terminalStatusOf(reasonKind: string): VehiclePetTerminalReaction['status'] | null;
export declare class VehiclePetSessionAdapter implements OverlayObservable<VehiclePetSessionView> {
    #private;
    constructor(sessions: VehiclePetSessionsSource, options?: VehiclePetSessionAdapterOptions);
    getSnapshot: () => VehiclePetSessionView;
    subscribe: (listener: () => void) => (() => void);
    dispose(): void;
}
export {};
//# sourceMappingURL=session-state-adapter.d.ts.map