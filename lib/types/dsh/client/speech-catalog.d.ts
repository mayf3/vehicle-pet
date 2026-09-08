/**
 * Speech catalog (DSH_PET_OVERLAY_ADAPTER_V3 CTR-OVERLAY-018): bundled,
 * versioned, curated original lines. All copy is original to this repository;
 * the installed whale reference's strings are forbidden. Triggers stay within
 * the structured sources of CTR-OVERLAY-018; selection is a pure function in
 * speech-rules.ts. Lines are short, companionable, and never report status
 * codes, percentages, or token counts.
 */
export type SpeechCategory = 'idle' | 'working' | 'needs-input' | 'completed' | 'failed' | 'milestone';
export interface SpeechCatalogEntry {
    readonly category: SpeechCategory;
    readonly text: string;
}
/** The bundled catalog for a locale; unknown locales fall back to zh-CN. */
export declare function speechCatalog(locale: string | undefined): readonly SpeechCatalogEntry[];
/** Catalog floors (V3 CTR-OVERLAY-018): ≥30 lines per locale, ≥5 per category. */
export declare function assertCatalogFloors(): void;
//# sourceMappingURL=speech-catalog.d.ts.map