/** Display-only metadata projection. Never used by speech or progression. */
export interface ActiveSession {
    id: string;
    title: string;
    pending: boolean;
}
interface SessionListMetadata {
    ids?: readonly string[];
    current?: string | undefined;
    byId: Record<string, {
        title?: string;
        displayTitle?: string;
        running?: boolean;
        pendingInteraction?: string;
    } | undefined>;
}
export declare function activeSessionsFromList(list: SessionListMetadata): ActiveSession[];
export {};
//# sourceMappingURL=active-sessions.d.ts.map