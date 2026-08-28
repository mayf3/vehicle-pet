/**
 * Build-time static bundled Pack registry (CTR-PET-025).
 * The Engine never imports concrete Packs; the assembly layer passes validated
 * bundles in. All bundles are fully validated before use; invalid bundles are
 * dropped with diagnostics and can never become active.
 */
import type { EngineDiagnostic } from '../types/core';
import type { PetPackManifestV1 } from '../types/manifest';
export interface PackBundleInput {
    /** Raw manifest candidate; validated here, never trusted as-is. */
    manifestCandidate: unknown;
    /** Resolves a manifest asset path to a bundled file URL; undefined = missing file. */
    resolveAssetUrl: (path: string) => string | undefined;
}
export interface RegisteredPack {
    manifest: PetPackManifestV1;
    resolveAssetUrl: (path: string) => string | undefined;
}
export interface CreateRegistryResult {
    registry: PackRegistry;
    diagnostics: EngineDiagnostic[];
}
export declare class PackRegistry {
    private readonly packs;
    private constructor();
    static create(bundles: PackBundleInput[], now: () => Date, requireBundledKeepsakes?: boolean): CreateRegistryResult;
    get(packId: string): RegisteredPack | undefined;
    list(): RegisteredPack[];
    has(packId: string): boolean;
}
//# sourceMappingURL=registry.d.ts.map