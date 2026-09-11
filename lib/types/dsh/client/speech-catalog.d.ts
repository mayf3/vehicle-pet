/**
 * Speech catalog (DSH_PET_OVERLAY_ADAPTER_V3 CTR-OVERLAY-018; V8 CTR-038/041):
 * bundled, versioned, curated original lines resolved per pet from the
 * declarative presentation registry. All copy is original to this repository;
 * the installed whale reference's strings are forbidden. Triggers stay within
 * the structured sources of CTR-OVERLAY-018; selection is a pure function in
 * speech-rules.ts. Lines are short, companionable, and never report status
 * codes, percentages, or token counts.
 */
import type { PetId } from './types';
export type SpeechCategory = 'idle' | 'working' | 'needs-input' | 'completed' | 'failed' | 'milestone' | 'petting' | 'welcome' | 'ritual';
export interface SpeechCatalogEntry {
    readonly category: SpeechCategory;
    readonly text: string;
}
/** The bundled catalog for a locale; unknown locales fall back to zh-CN. */
export declare function speechCatalog(locale: string | undefined): readonly SpeechCatalogEntry[];
/** One pet's catalog through the same category selector and scheduler. */
export declare function characterSpeechCatalog(id: PetId, locale: string | undefined): readonly SpeechCatalogEntry[];
/**
 * Catalog floors (V3 CTR-OVERLAY-018; V7 adds petting/welcome/ritual >=3;
 * V8 reconciliation item 6): bundled reference pets keep the full floors
 * (30 lines, 5 per core category, 3 per ritual category per locale); any
 * other pet must cover the six session states plus idle with at least one
 * line each per locale, under the same content boundary and scheduler.
 */
export declare function assertCatalogFloors(): void;
//# sourceMappingURL=speech-catalog.d.ts.map