/**
 * Pure level derivation (DEC-PET-001, CLM-PET-001).
 * Level and within-level progress are derived only from the last applied valid
 * snapshot plus the active Pack; nothing here is persisted.
 */

import type { Locale } from '../types/core'
import type { LevelDefinition, PetPackManifestV1 } from '../types/manifest'
import type { PetViewModel } from '../types/derived'

export interface DerivedProgress {
  level: LevelDefinition
  levelIndex: number
  withinLevelEarned: number
  withinLevelSpan: number
  nextLevelId: string | null
  remainingPoints: number
  capped: boolean
}

export function deriveLevel(
  points: number,
  pack: PetPackManifestV1,
): { level: LevelDefinition; levelIndex: number } {
  const levels = pack.levels
  let current = levels[0]!
  let currentIndex = 1
  for (let i = 0; i < levels.length; i++) {
    if (points >= levels[i]!.threshold) {
      current = levels[i]!
      currentIndex = i + 1
    }
  }
  return { level: current, levelIndex: currentIndex }
}

export function deriveProgress(
  points: number,
  pack: PetPackManifestV1,
): DerivedProgress {
  const levels = pack.levels
  let currentIndex = 0
  for (let i = 0; i < levels.length; i++) {
    if (points >= levels[i]!.threshold) currentIndex = i
  }
  const level = levels[currentIndex]!
  const next = levels[currentIndex + 1]
  if (next === undefined) {
    return {
      level,
      levelIndex: currentIndex + 1,
      withinLevelEarned: 0,
      withinLevelSpan: 1,
      nextLevelId: null,
      remainingPoints: 0,
      capped: true,
    }
  }
  const span = next.threshold - level.threshold
  const earned = Math.min(Math.max(points - level.threshold, 0), span)
  return {
    level,
    levelIndex: currentIndex + 1,
    withinLevelEarned: earned,
    withinLevelSpan: span,
    nextLevelId: next.levelId,
    remainingPoints: Math.max(next.threshold - points, 0),
    capped: false,
  }
}

export interface DeriveViewModelInput {
  sourceId: string
  subjectId: string
  progressPoints: number
  revision: number
  pack: PetPackManifestV1
  locale: Locale
  reducedMotion: boolean
}

export function derivePetViewModel(input: DeriveViewModelInput): PetViewModel {
  const derived = deriveProgress(input.progressPoints, input.pack)
  return {
    schemaVersion: 1,
    sourceId: input.sourceId,
    subjectId: input.subjectId,
    activePackId: input.pack.packId,
    packVersion: input.pack.packVersion,
    revision: input.revision,
    progressPoints: input.progressPoints,
    derivedLevelId: derived.level.levelId,
    derivedLevelIndex: derived.levelIndex,
    withinLevelEarned: derived.withinLevelEarned,
    withinLevelSpan: derived.withinLevelSpan,
    nextLevelId: derived.nextLevelId,
    remainingPoints: derived.remainingPoints,
    capped: derived.capped,
    locale: input.locale,
    reducedMotion: input.reducedMotion,
    state: 'ready',
  }
}
