/**
 * PetEngineProvider: the Engine React adapter.
 * Wires a PetEngine to React, subscribes the registered Progress Source, owns
 * greeting/ceremony presentation state, and exposes the local in-process
 * HostActivityEventV1 injection interface (a plain function boundary — not a
 * network, model, or Host transport capability).
 */
import { type ReactNode } from 'react';
import { type CeremonyPlan, type EngineSnapshot, type Locale, type LocalizedTextV1, type PackBundleInput, type ProgressSource, type PetStorageAdapter, type UpgradeReceipt, type HostFeedbackPresentation } from '../engine';
import { engineCopy } from './copy';
export interface PetEngineProviderProps {
    bundles: PackBundleInput[];
    defaultPackId: string;
    storage: PetStorageAdapter;
    source: ProgressSource;
    locale?: Locale;
    reducedMotion?: boolean;
    /** Standalone hosts may mirror locale to <html>; embedded hosts own it. */
    syncDocumentLanguage?: boolean;
    now?: () => Date;
    children: ReactNode;
}
export interface GreetingState {
    localDay: string;
    variantIndex: number;
}
export interface CeremonyState {
    plan: CeremonyPlan;
    receipts: UpgradeReceipt[];
}
export interface PetEngineContextValue {
    snapshot: EngineSnapshot;
    greeting: GreetingState | null;
    dismissGreeting: () => void;
    ceremony: CeremonyState | null;
    skipCeremony: () => void;
    hostFeedback: HostFeedbackPresentation | null;
    dispatchHostActivity: (candidate: unknown) => void;
    clearHostFeedback: () => void;
    switchPack: (packId: string) => void;
    setLocale: (locale: Locale) => void;
    setReducedMotion: (reduced: boolean) => void;
    copy: ReturnType<typeof engineCopy>;
    resolveText: (text: LocalizedTextV1) => string;
    assetUrl: (assetId: string) => string | undefined;
}
export declare function PetEngineProvider(props: PetEngineProviderProps): import("react").JSX.Element;
export declare function usePetEngine(): PetEngineContextValue;
//# sourceMappingURL=PetEngineProvider.d.ts.map