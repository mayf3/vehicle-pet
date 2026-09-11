/**
 * Vehicle reference pet presentation (DSH_PET_OVERLAY_ADAPTER_V8 §17): the
 * bundled `engine-scene` reference implementation over the `autonomous-fleet`
 * journey. This file is per-pet bundled data wiring — the only place the
 * vehicle's own facts (name, grade policy, levels, behavior, speech, license)
 * are assembled. Generic runtime consumes it through `pets/bundled.ts`; no
 * overlay or Engine core may gain vehicle semantics.
 */

import vehicleSpeech from './speech.json' with { type: 'json' }
import vehicleLevels from './levels.json' with { type: 'json' }
import type { PetPresentation, PetSpeechCatalogData } from '../types'

/** Face anchor `[left, top, size]` per level id, % of the 480x480 level sprite. */
const EXPRESSION_ANCHORS: Record<string, readonly [number, number, number]> = {
  l1: [8, 37, 45], l2: [8, 37, 45], l3: [8, 37, 45], l4: [7, 45, 40],
  l5: [8, 38, 45], l6: [32, 61, 22], l7: [36, 70, 13], l8: [36, 66, 14],
  l9: [36, 67, 14], l10: [41, 68, 11], l11: [35, 63, 15], l12: [16, 65, 22],
}

/** V8 DEC-OVERLAY-029 default public experience: pet first; exact level identity stays in DOM data and the Full Journey. */
const gradePolicy = {
  showExactLevelNumber: false,
  showDescription: true,
  insigniaMode: 'none',
} as const

const behavior = {
  ambientPool: ['look-left', 'look-right', 'sensor-check', 'wheel-blink', 'small-shuffle'],
  stateReactions: { completed: 'bounce', failed: 'shy', working: 'nod', 'needs-input': 'peek' },
  petting: { variant: 'idle-happy', decoration: 'sparkles' },
} as const satisfies PetPresentation['behavior']

export const vehiclePresentation: PetPresentation = {
  id: 'vehicle',
  displayName: { 'zh-CN': '小车', en: 'Vehicle' },
  recipe: 'engine-scene',
  packId: 'autonomous-fleet',
  userSelectable: true,
  gradePolicy,
  gradeLevels: vehicleLevels,
  behavior,
  speech: vehicleSpeech as PetSpeechCatalogData,
  license: {
    license: 'SEE REPOSITORY LICENSE GATE (docs/public/ASSET_AND_BRAND_POLICY.md)',
    attribution: 'Original character art produced by mayf3 via the Owner-designated offline art route.',
    provenance: 'src/packs/autonomous-fleet/assets/masters/PROVENANCE-v2-identity.json',
  },
  engineScene: {
    expressionAnchors: EXPRESSION_ANCHORS,
  },
}
