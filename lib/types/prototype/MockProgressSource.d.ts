/**
 * MockProgressSource: the ONLY Progress Source registered in V1 (CTR-PET-001,
 * CTR-PET-020, DEC-PET-009). Entirely local and in-process; no network, model,
 * or Host transport is reachable from here.
 */
import type { ProgressSource } from '../engine';
export declare class MockProgressSource implements ProgressSource {
    readonly sourceId = "mock-progress";
    private subjectCounter;
    private subjectId;
    private points;
    private revision;
    private readonly listeners;
    constructor(initialPoints?: number);
    subscribe(listener: (snapshot: unknown) => void): () => void;
    addPoints(delta: number): void;
    /** Exact input; regressions are still emitted so the engine's ordering rules are demonstrable. */
    setPoints(exact: number): void;
    /** Re-emits the current snapshot unchanged (same revision) to demonstrate duplicate handling. */
    emitDuplicate(): void;
    /** Subject reset: a new subjectId starts a new growth journey namespace. */
    resetSubject(): void;
    get currentSubjectId(): string;
    private snapshot;
    private emit;
}
//# sourceMappingURL=MockProgressSource.d.ts.map