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
