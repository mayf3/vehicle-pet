/**
 * Speech catalog (DSH_PET_OVERLAY_ADAPTER_V3 CTR-OVERLAY-018): bundled,
 * versioned, curated original lines. All copy is original to this repository;
 * the installed whale reference's strings are forbidden. Triggers stay within
 * the structured sources of CTR-OVERLAY-018; selection is a pure function in
 * speech-rules.ts. Lines are short, companionable, and never report status
 * codes, percentages, or token counts.
 */

import characterSpeech from './character-speech.json' with { type: 'json' }
import type { CharacterId } from './types'

export type SpeechCategory =
  | 'idle'
  | 'working'
  | 'needs-input'
  | 'completed'
  | 'failed'
  | 'milestone'
  | 'petting'
  | 'welcome'
  | 'ritual'

export interface SpeechCatalogEntry {
  readonly category: SpeechCategory
  readonly text: string
}

/** The bundled catalog for a locale; unknown locales fall back to zh-CN. */
export function speechCatalog(locale: string | undefined): readonly SpeechCatalogEntry[] {
  return characterSpeechCatalog('vehicle', locale)
}

/** Catalog floors (V3 CTR-OVERLAY-018; V7 adds petting/welcome/ritual ≥3). */
export function assertCatalogFloors(): void {
  for (const character of ['vehicle', 'companion'] as const) {
    for (const [locale, entries] of (['zh-CN', 'en'] as const).map(locale => [locale, characterSpeechCatalog(character, locale)] as const)) {
      if (entries.length < 30) throw new Error(`speech catalog ${character}/${locale}: ${entries.length} < 30 lines`)
      const perCategory = new Map<string, number>()
      for (const entry of entries) perCategory.set(entry.category, (perCategory.get(entry.category) ?? 0) + 1)
      for (const category of ['idle', 'working', 'needs-input', 'completed', 'failed', 'milestone']) {
        const count = perCategory.get(category) ?? 0
        if (count < 5) throw new Error(`speech catalog ${character}/${locale}: category ${category} has ${count} < 5 lines`)
      }
      for (const category of ['petting', 'welcome', 'ritual']) {
        const count = perCategory.get(category) ?? 0
        if (count < 3) throw new Error(`speech catalog ${character}/${locale}: category ${category} has ${count} < 3 lines`)
      }
    }
  }
}

/** Both catalogs use the existing category selector and scheduler. */
export function characterSpeechCatalog(id: CharacterId, locale: string | undefined): readonly SpeechCatalogEntry[] {
  const language = locale === 'en' ? 'en' : 'zh-CN'
  return Object.entries(characterSpeech[id]).flatMap(([category, lines]) =>
    lines.map(line => ({ category: category as SpeechCategory, text: line[language] })))
}
