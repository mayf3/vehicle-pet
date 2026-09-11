/**
 * Bundled Pack discovery for the standalone application (CTR-PET-025 as
 * generalized by V8 CTR-OVERLAY-038): every `src/packs/<packId>/manifest.json`
 * directory is a bundled Pack. This is generic wiring — adding a Pack means
 * adding a data directory, never editing a registry file; there is no runtime
 * Pack installer and no remote Pack support. The engine never imports this;
 * the registry layer passes bundles in. (The DSH build uses the generated
 * manifest map instead, because its esbuild bundle forbids `import.meta`.)
 */
import type { PackBundleInput } from '../engine';
export declare function discoverPackBundles(): PackBundleInput[];
export declare const bundledPackBundles: PackBundleInput[];
export declare const defaultPackId = "autonomous-fleet";
//# sourceMappingURL=bundledRegistry.d.ts.map