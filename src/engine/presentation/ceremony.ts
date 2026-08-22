/**
 * Merged, bounded ceremony planning (CTR-PET-014, DEC-PET-005).
 * A multi-level upgrade renders the final level immediately, then one merged
 * ceremony of at most 3 beats within at most 3 seconds; skippable throughout.
 */

import type { Locale } from '../types/core'
import type { PetPackManifestV1 } from '../types/manifest'
import type { UpgradeReceipt } from '../types/derived'
import { resolveLocalizedText } from '../localization'

export const MAX_CEREMONY_BEATS = 3
export const CEREMONY_MAX_TOTAL_MS = 3000

export interface CeremonyBeat {
  levelId: string
  stageName: string
  milestone: string
  celebration: string
}

export interface CeremonyPlan {
  beats: CeremonyBeat[]
  totalMs: number
  skippable: true
}

/** Deterministically merges any number of receipts into at most 3 beats. */
export function buildMergedCeremony(
  receipts: UpgradeReceipt[],
  pack: PetPackManifestV1,
  locale: Locale,
): CeremonyPlan | null {
  if (receipts.length === 0) return null
  const ordered = [...receipts].sort((a, b) => {
    const aIndex = pack.levels.findIndex((l) => l.levelId === a.toLevelId)
    const bIndex = pack.levels.findIndex((l) => l.levelId === b.toLevelId)
    return aIndex - bIndex
  })
  let selected = ordered
  if (ordered.length > MAX_CEREMONY_BEATS) {
    const last = ordered.length - 1
    const middle = Math.floor(last / 2)
    selected = [ordered[0]!, ordered[middle]!, ordered[last]!]
  }
  const beats = selected.map((r) => {
    const level = pack.levels.find((l) => l.levelId === r.toLevelId)
    return {
      levelId: r.toLevelId,
      stageName: level !== undefined ? resolveLocalizedText(level.stageName, locale) : r.toLevelId,
      milestone: level !== undefined ? resolveLocalizedText(level.milestone, locale) : '',
      celebration: level?.upgrade?.celebration ?? 'ambient-highlight',
    }
  })
  return {
    beats,
    totalMs: Math.min(beats.length * 1000, CEREMONY_MAX_TOTAL_MS),
    skippable: true,
  }
}
