/** Test-build-only resource ledger surfaced to real pinned-Harness Playwright. */
export interface E2EResourceLedger {
    readonly enabled: boolean;
    track(category: string): () => void;
}
export declare function createE2EResourceLedger(generation: string): E2EResourceLedger;
//# sourceMappingURL=e2e-resource-ledger.d.ts.map