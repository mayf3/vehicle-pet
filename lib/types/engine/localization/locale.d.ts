/**
 * Locale resolution with deterministic zh-CN fallback (DEC-PET-011, CTR-PET-019).
 */
import type { Locale, LocalizedTextV1 } from '../types/core';
export declare const DEFAULT_LOCALE: Locale;
export declare const SUPPORTED_LOCALES: readonly Locale[];
export declare function isSupportedLocale(value: unknown): value is Locale;
export declare function resolveLocalizedText(text: LocalizedTextV1, locale: Locale): string;
//# sourceMappingURL=locale.d.ts.map