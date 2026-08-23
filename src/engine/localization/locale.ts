/**
 * Locale resolution with deterministic zh-CN fallback (DEC-PET-011, CTR-PET-019).
 */

import type { Locale, LocalizedTextV1 } from '../types/core'

export const DEFAULT_LOCALE: Locale = 'zh-CN'
export const SUPPORTED_LOCALES: readonly Locale[] = ['zh-CN', 'en']

export function isSupportedLocale(value: unknown): value is Locale {
  return value === 'zh-CN' || value === 'en'
}

export function resolveLocalizedText(text: LocalizedTextV1, locale: Locale): string {
  if (locale === 'en' && text.en !== undefined) return text.en
  return text['zh-CN']
}
