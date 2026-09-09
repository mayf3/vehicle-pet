import type { CharacterId } from './types'
import type { VehiclePetExpressionVariant } from './expressions'
import levels from './character-levels.json' with { type: 'json' }

export const CHARACTER_DEFINITIONS = {
  vehicle: { id: 'vehicle', recipe: 'engine-scene', brand: 'Pony.ai' },
  companion: { id: 'companion', recipe: 'pose-sprite', brand: 'Pony.ai' },
} as const
export type CharacterDefinition = typeof CHARACTER_DEFINITIONS[CharacterId]
export const COMPANION_POSES: Record<VehiclePetExpressionVariant, number> = {
  idle: 0, 'idle-happy': 6, 'idle-curious': 7, 'idle-sleepy': 5,
  working: 2, 'needs-input': 1, completed: 3, 'completed-proud': 8, failed: 4, cancelled: 9,
}
export function characterLevel(levelId: string | undefined, locale: string | undefined): { grade: string; description: string; index: number } | null {
  const index = levels.findIndex(level => level.id === levelId)
  const level = levels[index]
  if (level === undefined) return null
  return { index, grade: level.id.toUpperCase(), description: locale?.toLowerCase().startsWith('zh') ? level['zh-CN'] : level.en }
}

/**
 * Declarative behavior profiles (V7 CTR-OVERLAY-037): each bundled character
 * definition carries its own presentation tendencies over the same underlying
 * events. Generic presentation infrastructure consumes these; no user-facing
 * personality setting, no third character, no second scheduler.
 */
export interface CharacterBehaviorProfile {
  /** Ambient repertoire ids (see ambient-rules.ts); per-character pools. */
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

export const BEHAVIOR_PROFILES: Record<CharacterId, CharacterBehaviorProfile> = {
  vehicle: {
    ambientPool: ['look-left', 'look-right', 'sensor-check', 'wheel-blink', 'small-shuffle'],
    stateReactions: { completed: 'bounce', failed: 'shy', working: 'nod', 'needs-input': 'peek' },
    petting: { variant: 'idle-happy', decoration: 'sparkles' },
  },
  companion: {
    ambientPool: ['stretch', 'yawn', 'glance-terminal', 'rest', 'tidy-cuff', 'look-around'],
    stateReactions: { completed: 'nod', failed: 'shy', working: 'wave', 'needs-input': 'peek' },
    petting: { variant: 'idle-happy', decoration: 'heart' },
  },
}
