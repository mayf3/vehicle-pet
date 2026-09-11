/**
 * Strict, atomic PetPackManifestV1 validation (CTR-PET-003, CTR-PET-004).
 * JSON Schema first, then total semantic checks; any violation rejects the Pack
 * entirely with no partial activation.
 */
import type { PetPackManifestV1 } from '../types/manifest';
export declare const PACK_TOTAL_ASSET_BUDGET_BYTES = 16777216;
export declare const SINGLE_ASSET_MAX_BYTES = 2097152;
export type PackValidationResult = {
    ok: true;
    manifest: PetPackManifestV1;
} | {
    ok: false;
    errors: string[];
};
/** Overlay visual classes required by density presets (§10). */
export type OverlayVisualClass = 'route-network' | 'glow';
export declare function overlayVisualClass(path: string): OverlayVisualClass | null;
export interface ValidatePackOptions {
    /** When provided, every declared asset path must resolve to a real bundled file. */
    resolveAssetUrl?: (path: string) => string | undefined;
    /** Bundled packs must declare exactly levels.length - 1 keepsakes (§9.5). */
    requireBundledKeepsakes?: boolean;
}
export declare function validatePack(candidate: unknown, options?: ValidatePackOptions): PackValidationResult;
//# sourceMappingURL=validate-pack.d.ts.map