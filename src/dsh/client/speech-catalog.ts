/**
 * Speech catalog (DSH_PET_OVERLAY_ADAPTER_V3 CTR-OVERLAY-018; V8 CTR-038/041):
 * bundled, versioned, curated original lines resolved per pet from the
 * declarative presentation registry. All copy is original to this repository;
 * the installed whale reference's strings are forbidden. Triggers stay within
 * the structured sources of CTR-OVERLAY-018; selection is a pure function in
 * speech-rules.ts. Lines are short, companionable, and never report status
 * codes, percentages, or token counts.
 */

import type { PetId } from './types'
import { petDefinition, petPresentations } from './pets/bundled'

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

/** Flatten a pet's compact bilingual catalog data for one locale (zh-CN fallback). */
function catalogFor(petId: PetId, locale: string | undefined): readonly SpeechCatalogEntry[] {
  const language = locale === 'en' ? 'en' : 'zh-CN'
  return Object.entries(petDefinition(petId).speech).flatMap(([category, lines]) =>
    lines.map(line => ({ category: category as SpeechCategory, text: line[language] })))
}

/** The bundled catalog for a locale; unknown locales fall back to zh-CN. */
export function speechCatalog(locale: string | undefined): readonly SpeechCatalogEntry[] {
  return catalogFor('vehicle', locale)
}

/** One pet's catalog through the same category selector and scheduler. */
export function characterSpeechCatalog(id: PetId, locale: string | undefined): readonly SpeechCatalogEntry[] {
  return catalogFor(id, locale)
}

/**
 * Catalog floors (V3 CTR-OVERLAY-018; V7 adds petting/welcome/ritual >=3;
 * V8 reconciliation item 6): bundled reference pets keep the full floors
 * (30 lines, 5 per core category, 3 per ritual category per locale); any
 * other pet must cover the six session states plus idle with at least one
 * line each per locale, under the same content boundary and scheduler.
 */
export function assertCatalogFloors(): void {
  const coreCategories = ['idle', 'working', 'needs-input', 'completed', 'failed', 'milestone'] as const
  const ritualCategories = ['petting', 'welcome', 'ritual'] as const
  for (const pet of petPresentations) {
    const referencePet = pet.id === 'vehicle' || pet.id === 'companion'
    for (const locale of ['zh-CN', 'en'] as const) {
      const entries = characterSpeechCatalog(pet.id, locale)
      const perCategory = new Map<string, number>()
      for (const entry of entries) perCategory.set(entry.category, (perCategory.get(entry.category) ?? 0) + 1)
      const label = `speech catalog ${pet.id}/${locale}`
      if (referencePet) {
        if (entries.length < 30) throw new Error(`${label}: ${entries.length} < 30 lines`)
        for (const category of coreCategories) {
          const count = perCategory.get(category) ?? 0
          if (count < 5) throw new Error(`${label}: category ${category} has ${count} < 5 lines`)
        }
        for (const category of ritualCategories) {
          const count = perCategory.get(category) ?? 0
          if (count < 3) throw new Error(`${label}: category ${category} has ${count} < 3 lines`)
        }
      } else {
        for (const category of coreCategories) {
          const count = perCategory.get(category) ?? 0
          if (count < 1) throw new Error(`${label}: category ${category} has ${count} < 1 line`)
        }
      }
    }
  }
}
