/**
 * Engine/Pack assembly for the DSH overlay (CTR-OVERLAY-006): the SAME two
 * bundled Pack manifests and the SAME asset files as the standalone prototype,
 * with `resolveAssetUrl` backed by the generated DSH build-time asset map
 * instead of the Vite dev-server `import.meta.glob`. One engine instance, one
 * storage adapter, one active Pack authority, one progress source.
 */
import type { PackBundleInput } from '../../engine';
export declare const dshPackBundles: PackBundleInput[];
export declare const dshDefaultPackId = "autonomous-fleet";
/**
 * CTR-OVERLAY-006 (V2): the DSH surface presents `autonomous-fleet` as the
 * only user-selectable product Pack. Stored Engine state naming a non-product
 * Pack resolves to the product Pack on this surface; the standalone prototype
 * keeps both Packs selectable. Pure so the resolution stays unit-testable.
 */
export declare function resolveDshProductPackId(packId: string | undefined): string;
//# sourceMappingURL=engine-bundles.d.ts.map