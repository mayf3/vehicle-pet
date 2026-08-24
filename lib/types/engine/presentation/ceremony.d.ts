/**
 * Merged, bounded ceremony planning (CTR-PET-014, DEC-PET-005).
 * A multi-level upgrade renders the final level immediately, then one merged
 * ceremony of at most 3 beats within at most 3 seconds; skippable throughout.
 */
import type { Locale } from '../types/core';
import type { PetPackManifestV1 } from '../types/manifest';
import type { UpgradeReceipt } from '../types/derived';
export declare const MAX_CEREMONY_BEATS = 3;
export declare const CEREMONY_MAX_TOTAL_MS = 3000;
export interface CeremonyBeat {
    levelId: string;
    stageName: string;
    milestone: string;
    celebration: string;
}
export interface CeremonyPlan {
    beats: CeremonyBeat[];
    totalMs: number;
    skippable: true;
}
/** Deterministically merges any number of receipts into at most 3 beats. */
export declare function buildMergedCeremony(receipts: UpgradeReceipt[], pack: PetPackManifestV1, locale: Locale): CeremonyPlan | null;
//# sourceMappingURL=ceremony.d.ts.map