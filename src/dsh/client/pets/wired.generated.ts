/**
 * GENERATED FILE — do not edit. Run `node scripts/generate-pet-wiring.mjs`.
 * Bundled pet presentations discovered from pets/<petId>/definition.ts.
 * Order: the documented default pet first, then ids alphabetically.
 */

import { vehiclePresentation } from './vehicle/definition'
import { audit-petPresentation } from './audit-pet/definition'
import { companionPresentation } from './companion/definition'
import { orbPresentation } from './orb/definition'

import type { PetPresentation } from './types'

export const wiredPetPresentations: readonly PetPresentation[] = [
  vehiclePresentation,
  audit-petPresentation,
  companionPresentation,
  orbPresentation,
]
