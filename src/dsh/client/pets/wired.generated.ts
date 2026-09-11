/**
 * GENERATED FILE — do not edit. Run `node scripts/generate-pet-wiring.mjs`.
 * Bundled pet wiring discovered from pets/<petId>/pet.json.
 * Order: the documented default pet first, then ids alphabetically.
 */

import { vehiclePresentation } from './vehicle/vehicle-wiring.generated'
import { companionPresentation } from './companion/companion-wiring.generated'
import { orbPresentation } from './orb/orb-wiring.generated'

import type { PetPresentation } from './types'

export const wiredPetPresentations: readonly PetPresentation[] = [
  vehiclePresentation,
  companionPresentation,
  orbPresentation,
]
