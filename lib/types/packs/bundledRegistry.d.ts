/**
 * Build-time static bundled Pack registry (CTR-PET-025).
 * This is the only place where concrete Packs are wired into the application;
 * there is no runtime Pack installer and no remote Pack support.
 */
import type { PackBundleInput } from '../engine';
export declare const bundledPackBundles: PackBundleInput[];
export declare const defaultPackId = "autonomous-fleet";
//# sourceMappingURL=bundledRegistry.d.ts.map