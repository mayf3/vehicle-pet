/**
 * Minimal pet template — presentation manifest (V8 CTR-OVERLAY-038).
 *
 * This file is your pet's own configuration. Replace the `my-pet` id, names,
 * grade policy, and pose mappings with your pet's facts. There is no engine,
 * overlay, scheduler, or build-script edit anywhere in the creator flow.
 *
 * Assets: `./assets/pose-N.png|webp` are sample poses copied from the
 * repository's deterministic fixture pipeline — replace them with your own
 * original art of the same canvas ratio (320x540) and file names.
 */

import p0 from './assets/pose-0.png'
import w0 from './assets/pose-0.webp'
import p1 from './assets/pose-1.png'
import w1 from './assets/pose-1.webp'
import p2 from './assets/pose-2.png'
import w2 from './assets/pose-2.webp'
import p3 from './assets/pose-3.png'
import w3 from './assets/pose-3.webp'
import p4 from './assets/pose-4.png'
import w4 from './assets/pose-4.webp'
import p5 from './assets/pose-5.png'
import w5 from './assets/pose-5.webp'
import p6 from './assets/pose-6.png'
import w6 from './assets/pose-6.webp'
import p7 from './assets/pose-7.png'
import w7 from './assets/pose-7.webp'
import p8 from './assets/pose-8.png'
import w8 from './assets/pose-8.webp'
import p9 from './assets/pose-9.png'
import w9 from './assets/pose-9.webp'
import petSpeech from './speech.json' with { type: 'json' }
import petLevels from './levels.json' with { type: 'json' }
import type { PetPresentation, PetSpeechCatalogData, PoseSpriteRecipeData } from '../types'
import type { VehiclePetExpressionVariant } from '../../expressions'

/** Every expression variant maps to one of your pose images (index below). */
const poseSprite: PoseSpriteRecipeData = {
  variantPose: {
    idle: 0, 'idle-happy': 1, 'idle-curious': 2, 'idle-sleepy': 3,
    working: 4, 'needs-input': 5, completed: 6, 'completed-proud': 7, failed: 8, cancelled: 9,
  } as Record<VehiclePetExpressionVariant, number>,
  poses: [
    { png: p0, webp: w0 }, { png: p1, webp: w1 }, { png: p2, webp: w2 }, { png: p3, webp: w3 },
    { png: p4, webp: w4 }, { png: p5, webp: w5 }, { png: p6, webp: w6 }, { png: p7, webp: w7 },
    { png: p8, webp: w8 }, { png: p9, webp: w9 },
  ],
  /** Per-pose visible-alpha bounds [x0, y0, x1, y1] on the 320x540 canvas —
   * used for the honest pointer hitbox. The sample bounds hug the full canvas;
   * tighten them to your art's real alpha. */
  alphaBounds: [
    [0, 0, 320, 540], [0, 0, 320, 540], [0, 0, 320, 540], [0, 0, 320, 540], [0, 0, 320, 540],
    [0, 0, 320, 540], [0, 0, 320, 540], [0, 0, 320, 540], [0, 0, 320, 540], [0, 0, 320, 540],
  ],
  /** Optional wearable insignia — omit (`undefined`) for insigniaMode: 'none'. */
  insignia: undefined,
}

/** Grade presentation policy (V8 DEC-029): exact number, description, and
 * insignia are per-pet choices; the Full Journey always shows details. */
const gradePolicy = {
  showExactLevelNumber: false,
  showDescription: true,
  insigniaMode: 'none',
} as const

const behavior = {
  ambientPool: ['look-left', 'look-right', 'rest', 'look-around'],
  stateReactions: { completed: 'nod', failed: 'shy', working: 'nod', 'needs-input': 'peek' },
  petting: { variant: 'idle-happy', decoration: 'sparkles' },
} as const satisfies PetPresentation['behavior']

export const auditPetPresentation: PetPresentation = {
  id: 'audit-pet',
  displayName: { 'zh-CN': '审计宠物', en: 'Audit Pet' },
  recipe: 'pose-sprite',
  packId: 'audit-pet-journey',
  userSelectable: true,
  gradePolicy,
  gradeLevels: petLevels,
  behavior,
  speech: petSpeech as PetSpeechCatalogData,
  license: {
    license: 'Replace with your code-free asset license, e.g. "CC-BY-4.0" (Owner gate pending repository-wide).',
    attribution: 'Replace with your attribution line.',
    provenance: 'Replace with a pointer to your provenance record.',
  },
  poseSprite,
}
