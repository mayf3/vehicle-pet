/**
 * The framework-agnostic Pet Engine runtime.
 *
 * Owns: snapshot ingestion with entire-snapshot rejection and ordering
 * (CTR-PET-002, CTR-PET-026), pure derivation, Pack lifecycle with atomic
 * switching and pack-unavailable (CTR-PET-005, CTR-PET-006, CTR-PET-025),
 * receipts and consume-before-play ceremonies (CTR-PET-012..CTR-PET-015),
 * keepsakes (CTR-PET-023), daily greeting (CTR-PET-028), Host activity
 * feedback (CTR-PET-024), and locale / reduced-motion handling.
 *
 * It persists neither an authoritative ProgressSnapshot nor a derived level;
 * the per-subject applied-snapshot runtime record used for ordering is
 * in-memory only and is neither of those.
 */
import type { EngineDiagnostic, EngineState, Locale, ProgressSnapshotV1 } from './types/core';
import type { PetPackManifestV1 } from './types/manifest';
import type { PetViewModel, SceneRenderPlan, UnlockedKeepsakeKey, UpgradeReceipt } from './types/derived';
import type { PetStorageAdapter } from './storage/adapter';
import { type PackBundleInput, type RegisteredPack } from './packs/registry';
import { type CeremonyPlan } from './presentation/ceremony';
import { type HostFeedbackPresentation } from './events/host-activity';
export interface PetEngineOptions {
    bundles: PackBundleInput[];
    defaultPackId: string;
    storage: PetStorageAdapter;
    locale?: Locale;
    reducedMotion?: boolean;
    now?: () => Date;
    requireBundledKeepsakes?: boolean;
}
export interface EngineSnapshot {
    initialized: boolean;
    state: EngineState;
    activePack: RegisteredPack | null;
    availablePacks: RegisteredPack[];
    defaultPackId: string;
    viewModel: PetViewModel | null;
    plan: SceneRenderPlan | null;
    /** Presentation-time metadata for the current level's upgrade preset (§10). */
    stagePack: PetPackManifestV1 | null;
    stageLevelId: string | null;
    pendingReceipts: UpgradeReceipt[];
    unlockedKeepsakes: UnlockedKeepsakeKey[];
    hostFeedback: HostFeedbackPresentation | null;
    diagnostics: EngineDiagnostic[];
    locale: Locale;
    reducedMotion: boolean;
    lastValidSnapshot: ProgressSnapshotV1 | null;
}
export declare class PetEngine {
    private readonly options;
    private readonly bundles;
    private readonly storage;
    private readonly defaultPackId;
    private readonly registry;
    private readonly appliedBySubject;
    private readonly hostDispatcher;
    private readonly listeners;
    private initialized;
    private state;
    private activePack;
    private localeValue;
    private reducedMotionValue;
    private lastValidSnapshot;
    private boundSourceId;
    private presentationEpoch;
    private pendingReceipts;
    private unlockedKeepsakes;
    private hostFeedback;
    private diagnostics;
    private ops;
    private snapshotCache;
    constructor(options: PetEngineOptions);
    initialize(): Promise<void>;
    subscribe(listener: () => void): () => void;
    getSnapshot(): EngineSnapshot;
    ingestSnapshot(candidate: unknown): void;
    /** Marks every non-initial level up to the derived level as already presented (no replay). */
    private establishBaseline;
    /** Issues receipts and keepsake unlocks for a forward crossing. */
    private issueCrossings;
    setActivePack(packId: string): Promise<boolean>;
    /** Consume-before-play: atomically claims the deterministic receipt batch before any ceremony. */
    claimPendingCeremony(): Promise<{
        receipts: UpgradeReceipt[];
        plan: CeremonyPlan;
    } | null>;
    completeCeremony(): void;
    /** At-most-once daily greeting per (sourceId, subjectId, localDay). */
    claimDailyGreeting(): Promise<{
        localDay: string;
    } | null>;
    dispatchHostActivity(candidate: unknown): HostFeedbackPresentation | null;
    clearHostFeedback(): void;
    setLocale(locale: Locale): void;
    setReducedMotion(reduced: boolean): void;
    /** Waits for all tracked async side effects (tests and deterministic flows). */
    settled(): Promise<void>;
    private buildViewModel;
    private buildPlan;
    private viewModelLevelId;
    private refreshKeepsakes;
    private invalidatePendingPresentation;
    private track;
    private pushDiagnostics;
    private pushDiagnostic;
    private notify;
}
//# sourceMappingURL=engine.d.ts.map