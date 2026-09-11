/**
 * Bundled pet presentation registry (DSH_PET_OVERLAY_ADAPTER_V8 §17
 * CTR-OVERLAY-038/041). This is the only place concrete pets are wired into
 * the DSH adapter; there is no runtime pet installer and no remote pack
 * support. The recipe vocabulary and lookup rules are generic; individual pet
 * facts live in each pet's data directory. Unknown or removed pet ids fail
 * soft to the documented default pet without mutating growth data.
 */

import type { CharacterBehaviorProfile } from '../behavior'
import type {
  GradeLevelDescription,
  PetPresentation,
  PetRecipe,
} from './types'
import { vehiclePresentation } from './vehicle/definition'
import { companionPresentation } from './companion/definition'
import { orbPresentation } from './orb/definition'

/** Every bundled pet presentation, in menu order. */
export const petPresentations: readonly PetPresentation[] = [
  vehiclePresentation,
  companionPresentation,
  orbPresentation,
]

/** Documented default pet for absent/unknown preference values (CTR-041). */
export const DEFAULT_PET_ID = 'vehicle'

/** All pets the secondary selector offers, in declared order (CTR-041). */
export function userSelectablePets(): readonly PetPresentation[] {
  return petPresentations.filter(pet => pet.userSelectable)
}

/** Resolve any stored value to a bundled pet id; unknown fails soft to the default. */
export function resolvePetId(value: unknown): string {
  const id = typeof value === 'string' ? value : undefined
  return petPresentations.some(pet => pet.id === id) ? (id as string) : DEFAULT_PET_ID
}

/** Look up a bundled pet presentation by id (undefined when absent). */
export function petPresentationById(id: string | undefined): PetPresentation | undefined {
  return petPresentations.find(pet => pet.id === id)
}

/** Required lookup for already-normalized ids (post resolvePetId). */
export function petDefinition(id: string): PetPresentation {
  const pet = petPresentationById(id)
  if (pet === undefined) throw new Error(`unknown pet id ${id}`)
  return pet
}

/** Recipe for a normalized pet id. */
export function petRecipe(id: string): PetRecipe {
  return petDefinition(id).recipe
}

/** Behavior profile for a normalized pet id (CTR-037 profiles are pet data). */
export function petBehavior(id: string): CharacterBehaviorProfile {
  return petDefinition(id).behavior
}

/**
 * Localized grade row for a level id (presentation data only; level meaning
 * stays Engine-owned). Null when the pet or level is unknown.
 */
export function petGrade(
  id: string,
  levelId: string | undefined,
  locale: string | undefined,
): { grade: string; description: string; index: number } | null {
  const pet = petPresentationById(id)
  if (pet === undefined || levelId === undefined) return null
  const index = pet.gradeLevels.findIndex(level => level.id === levelId)
  const level: GradeLevelDescription | undefined = pet.gradeLevels[index]
  if (level === undefined) return null
  const description = locale?.toLowerCase().startsWith('zh') ? level['zh-CN'] : level.en
  return { index, grade: level.id.toUpperCase(), description }
}

/** Display name for menus, fallback text, and aria labels. */
export function petDisplayName(id: string, locale: string | undefined): string {
  const pet = petPresentationById(id)
  if (pet === undefined) return DEFAULT_PET_ID
  return locale?.toLowerCase().startsWith('zh') ? pet.displayName['zh-CN'] : pet.displayName.en
}
