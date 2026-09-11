/**
 * Companion reference pet presentation (DSH_PET_OVERLAY_ADAPTER_V8 §17): the
 * bundled `pose-sprite` reference implementation over the shared
 * `autonomous-fleet` journey. Per-pet bundled data wiring only; generic
 * runtime consumes it through `pets/bundled.ts`.
 */

import {
  companionAssets,
  insigniaAssets,
  poseAnchors,
  poseAlphaBounds,
} from '../../character-assets.generated'
import { type VehiclePetExpressionVariant } from '../../expressions'
import companionSpeech from './speech.json' with { type: 'json' }
import companionLevels from './levels.json' with { type: 'json' }
import type { PetPresentation, PetSpeechCatalogData, PoseSpriteRecipeData } from '../types'

/** Expression variant → pose index into the generated companion pose set. */
const VARIANT_POSE: Record<VehiclePetExpressionVariant, number> = {
  idle: 0, 'idle-happy': 6, 'idle-curious': 7, 'idle-sleepy': 5,
  working: 2, 'needs-input': 1, completed: 3, 'completed-proud': 8, failed: 4, cancelled: 9,
}

/**
 * Wearable symbolic insignia (no numeric text) kept as decorative identity
 * continuity (V8 DEC-OVERLAY-029). Placement is the per-pose anchor table
 * from the deterministic asset pipeline (pose canvas %, translate(-50%,-50%)).
 */
const poseSprite: PoseSpriteRecipeData = {
  variantPose: VARIANT_POSE,
  poses: companionAssets,
  alphaBounds: poseAlphaBounds,
  insignia: {
    mode: 'wearable',
    /** Index-aligned with journey levels (l1..l12). */
    assets: insigniaAssets as readonly string[],
    /** Index-aligned with poses; [left%, top%, rotateDeg]. */
    anchors: poseAnchors,
  },
}

const gradePolicy = {
  showExactLevelNumber: false,
  showDescription: true,
  insigniaMode: 'wearable',
} as const

const behavior = {
  ambientPool: ['stretch', 'yawn', 'glance-terminal', 'rest', 'tidy-cuff', 'look-around'],
  stateReactions: { completed: 'nod', failed: 'shy', working: 'wave', 'needs-input': 'peek' },
  petting: { variant: 'idle-happy', decoration: 'heart' },
} as const satisfies PetPresentation['behavior']

export const companionPresentation: PetPresentation = {
  id: 'companion',
  displayName: { 'zh-CN': '伙伴', en: 'Companion' },
  recipe: 'pose-sprite',
  packId: 'autonomous-fleet',
  userSelectable: true,
  gradePolicy,
  gradeLevels: companionLevels,
  behavior,
  speech: companionSpeech as PetSpeechCatalogData,
  license: {
    license: 'Apache-2.0 (code) / CC-BY-4.0 (assets) — see NOTICE and LICENSE.assets',
    attribution: 'Original character art produced by mayf3 via the Owner-designated offline art route.',
    provenance: 'assets/character-source/PROVENANCE.json',
  },
  poseSprite,
}

// Wired asset bytes flow through the generated modules above.
void companionAssets
void poseAlphaBounds
