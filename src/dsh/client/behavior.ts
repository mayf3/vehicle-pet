/**
 * Generic pet behavior profile type (V7 CTR-OVERLAY-037, V8 CTR-OVERLAY-038):
 * each declarative pet definition carries its own presentation tendencies over
 * the same underlying events. Generic presentation infrastructure consumes
 * these; no user-facing personality setting, no second scheduler. Individual
 * profiles are pet data under `pets/<petId>/`, never core constants.
 */

import type { VehiclePetExpressionVariant } from './expressions'

export interface CharacterBehaviorProfile {
  /** Ambient repertoire ids (see ambient-rules.ts); per-pet pools. */
  readonly ambientPool: readonly string[]
  /** Which playful reaction each structured state edge tends to present. */
  readonly stateReactions: {
    readonly completed: 'bounce' | 'proud' | 'nod'
    readonly failed: 'shy' | 'sleepy'
    readonly working: 'nod' | 'wave'
    readonly 'needs-input': 'peek' | 'wave'
  }
  /** Petting presentation family (approved masters only). */
  readonly petting: { readonly variant: VehiclePetExpressionVariant; readonly decoration: 'heart' | 'sparkles' }
}
