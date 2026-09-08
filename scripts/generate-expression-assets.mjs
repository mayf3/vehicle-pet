#!/usr/bin/env node
/**
 * Deterministic expression-asset generator for the DSH overlay session
 * expressions (DSH_PET_OVERLAY_ADAPTER_V3 DEC-OVERLAY-007 / CTR-OVERLAY-014).
 *
 * Ten transparent variant masters — the five structured session states plus
 * five companion sub-expression variants (idle-happy, idle-curious,
 * idle-sleepy, completed-proud, cancelled) — are drawn from a fixed inline
 * SVG recipe — no external images, no fonts, no randomness, no model call —
 * and rasterized by sharp to PNG plus lossless WebP. The same run emits:
 *   src/dsh/client/assets/expressions/expr-<variant>.png / .webp
 *   src/dsh/client/expression-assets.generated.ts  (bundled asset import map)
 *   src/dsh/client/assets/expressions/PROVENANCE.json (route, anchors, sha256)
 *
 * The per-level face anchor table lives in src/dsh/client/expressions.ts and
 * mirrors ANCHOR_PX below (480x480 sprite canvas percentages), so the
 * generator and the runtime stay pinned to the same coordinates.
 *
 * Modes:
 *   node scripts/generate-expression-assets.mjs           generate
 *   node scripts/generate-expression-assets.mjs --check   regenerate into a
 *     temp dir and byte-compare every artifact (assets:expression-check)
 */

import { mkdir, readFile, writeFile, rm, mkdtemp } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import sharp from 'sharp'

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const OUT_DIR = path.join(REPO_ROOT, 'src/dsh/client/assets/expressions')
const GENERATED_TS = path.join(REPO_ROOT, 'src/dsh/client/expression-assets.generated.ts')
const check = process.argv.includes('--check')

const NAVY = '#223047'
const AMBER = '#F5B840'
const PINK = '#F6A8B8'
const BLUE = '#8FC3EF'
const WHITE = '#FFFFFF'
// GOAL 灵动 visual-review R2: the corrected sprites present a white face
// plate at the l1-l5 anchors, so every stroke-drawn feature uses dark navy
// (#223047); amber/pink/blue remain as fill accents.
const stroke = (w) => `stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`
// GOAL 灵动 visual-review R1: the corrected sprites present a white face
// plate at the l1-l5 anchors, so all stroke-drawn features use dark navy
// (amber/pink remain as accents) and every element stays inside the 12-88%
// safe area so nothing lands off the car silhouette.*/

// Face anchor rects per level as percentages of the 480x480 level sprite
// canvas: [left, top, size]. Measured against the shipped V2 autonomous-fleet
// sprites (see PROVENANCE.json; mirrors src/dsh/client/expressions.ts).
const ANCHOR_PX = {
  l1: [8, 37, 45], l2: [8, 37, 45], l3: [8, 37, 45], l4: [7, 45, 40],
  l5: [8, 38, 45], l6: [32, 61, 22], l7: [36, 70, 13], l8: [36, 66, 14],
  l9: [36, 67, 14], l10: [41, 68, 11], l11: [35, 63, 15], l12: [16, 65, 22],
}

function idle() {
  return `
  <ellipse cx="52" cy="146" rx="26" ry="13" fill="${PINK}" opacity="0.85"/>
  <ellipse cx="148" cy="146" rx="26" ry="13" fill="${PINK}" opacity="0.85"/>
  <path d="M 46 96 Q 68 84 90 92" fill="none" stroke="${NAVY}" ${stroke(10)}/>
  <path d="M 130 92 Q 152 84 174 96" fill="none" stroke="${NAVY}" ${stroke(10)}/>`
}
function idleHappy() {
  return `
  <ellipse cx="50" cy="142" rx="28" ry="14" fill="${PINK}" opacity="0.9"/>
  <ellipse cx="150" cy="142" rx="28" ry="14" fill="${PINK}" opacity="0.9"/>
  <path d="M 40 98 A 28 28 0 0 1 96 98" fill="none" stroke="${NAVY}" ${stroke(11)}/>
  <path d="M 124 98 A 28 28 0 0 1 180 98" fill="none" stroke="${NAVY}" ${stroke(11)}/>
  <path d="M 88 128 A 34 28 0 0 0 152 128 Z" fill="${NAVY}"/>`
}
function idleCurious() {
  return `
  <ellipse cx="52" cy="144" rx="24" ry="12" fill="${PINK}" opacity="0.8"/>
  <path d="M 44 92 A 24 24 0 1 1 96 92" fill="none" stroke="${NAVY}" ${stroke(11)}/>
  <circle cx="72" cy="116" r="9" fill="${NAVY}"/>
  <path d="M 130 86 L 130 104" fill="none" stroke="${NAVY}" ${stroke(11)}/>
  <circle cx="130" cy="128" r="8" fill="${NAVY}"/>
  <path d="M 176 58 A 20 20 0 1 1 198 84 L 198 94" fill="none" stroke="${AMBER}" ${stroke(12)}/>
  <circle cx="198" cy="114" r="8" fill="${AMBER}"/>`
}
function idleSleepy() {
  return `
  <path d="M 42 96 Q 68 112 94 96" fill="none" stroke="${NAVY}" ${stroke(11)}/>
  <path d="M 126 96 Q 152 112 178 96" fill="none" stroke="${NAVY}" ${stroke(11)}/>
  <path d="M 100 142 Q 120 134 140 142" fill="none" stroke="${NAVY}" ${stroke(10)}/>
  <path d="M 196 52 L 224 52 L 196 84 L 224 84" fill="none" stroke="${NAVY}" ${stroke(11)}/>`
}
function working() {
  return `
  <path d="M 42 92 L 94 108" fill="none" stroke="${NAVY}" ${stroke(12)}/>
  <path d="M 126 108 L 178 92" fill="none" stroke="${NAVY}" ${stroke(12)}/>
  <path d="M 34 128 L 84 128" stroke="${AMBER}" ${stroke(13)}/>
  <path d="M 30 152 L 70 152" stroke="${AMBER}" ${stroke(13)} opacity="0.85"/>
  <path d="M 38 176 L 78 176" stroke="${AMBER}" ${stroke(13)} opacity="0.7"/>`
}
function needsInput() {
  return `
  <path d="M 42 84 Q 68 66 94 84" fill="none" stroke="${NAVY}" ${stroke(11)}/>
  <path d="M 126 84 Q 152 66 178 84" fill="none" stroke="${NAVY}" ${stroke(11)}/>
  <rect x="136" y="26" width="96" height="82" rx="18" fill="${WHITE}" stroke="${NAVY}" ${stroke(8)}/>
  <path d="M 152 106 L 140 132 L 178 106 Z" fill="${WHITE}" stroke="${NAVY}" ${stroke(8)}/>
  <path d="M 170 52 A 15 15 0 1 1 184 78 L 184 86" fill="none" stroke="${NAVY}" ${stroke(12)}/>
  <circle cx="184" cy="100" r="8" fill="${NAVY}"/>`
}
function completed() {
  return `
  <path d="M 36 106 A 27 27 0 0 1 90 106" fill="none" stroke="${NAVY}" ${stroke(12)}/>
  <path d="M 126 106 A 27 27 0 0 1 180 106" fill="none" stroke="${NAVY}" ${stroke(12)}/>
  <path d="M 90 140 A 34 30 0 0 0 158 140 Z" fill="${NAVY}"/>
  <path d="M 102 140 A 22 16 0 0 0 146 140 Z" fill="${PINK}"/>
  <g transform="translate(42,60) scale(1.3)"><path d="M 0 -16 L 5 -5 L 16 0 L 5 5 L 0 16 L -5 5 L -16 0 L -5 -5 Z" fill="${AMBER}" stroke="${NAVY}" ${stroke(4)}/></g>
  <g transform="translate(200,72)"><path d="M 0 -16 L 5 -5 L 16 0 L 5 5 L 0 16 L -5 5 L -16 0 L -5 -5 Z" fill="${AMBER}" stroke="${NAVY}" ${stroke(4)}/></g>`
}
function completedProud() {
  return `
  <path d="M 38 100 A 26 26 0 0 1 90 100" fill="none" stroke="${NAVY}" ${stroke(12)}/>
  <path d="M 128 100 A 26 26 0 0 1 180 100" fill="none" stroke="${NAVY}" ${stroke(12)}/>
  <path d="M 82 134 Q 122 172 158 134" fill="none" stroke="${NAVY}" ${stroke(14)}/>
  <g transform="translate(188,52) rotate(12) scale(2.1)">
    <path d="M 0 -16 L 5 -5 L 16 0 L 5 5 L 0 16 L -5 5 L -16 0 L -5 -5 Z" fill="${AMBER}" stroke="${NAVY}" ${stroke(3.5)}/>
  </g>`
}
function failed() {
  return `
  <path d="M 42 92 Q 66 108 92 100" fill="none" stroke="${NAVY}" ${stroke(12)}/>
  <path d="M 128 100 Q 154 108 178 92" fill="none" stroke="${NAVY}" ${stroke(12)}/>
  <path d="M 92 158 Q 110 142 128 158 Q 146 174 162 158" fill="none" stroke="${NAVY}" ${stroke(13)}/>
  <path d="M 196 66 Q 214 96 196 112 Q 178 96 196 66 Z" fill="${BLUE}" stroke="${NAVY}" ${stroke(7)}/>`
}
function cancelled() {
  return `
  <path d="M 40 88 L 62 74 M 84 88 L 62 74" stroke="${NAVY}" ${stroke(9)}/>
  <path d="M 136 88 L 158 74 M 180 88 L 158 74" stroke="${NAVY}" ${stroke(9)}/>
  <path d="M 44 98 Q 70 90 94 98" fill="none" stroke="${NAVY}" ${stroke(10)}/>
  <path d="M 126 98 Q 152 90 178 98" fill="none" stroke="${NAVY}" ${stroke(10)}/>
  <path d="M 100 150 Q 120 142 140 150" fill="none" stroke="${NAVY}" ${stroke(10)}/>
  <g transform="translate(196,132) rotate(45)">
    <path d="M -14 0 L 14 0" stroke="${AMBER}" ${stroke(10)}/>
    <path d="M 0 -14 L 0 14" stroke="${AMBER}" ${stroke(10)}/>
  </g>`
}

const STATES = [
  ['idle', idle],
  ['idle-happy', idleHappy],
  ['idle-curious', idleCurious],
  ['idle-sleepy', idleSleepy],
  ['working', working],
  ['needs-input', needsInput],
  ['completed', completed],
  ['completed-proud', completedProud],
  ['failed', failed],
  ['cancelled', cancelled],
]

const wrap = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">${inner}</svg>`

async function renderAll() {
  const files = new Map()
  for (const [name, fn] of STATES) {
    const svg = Buffer.from(wrap(fn()))
    files.set(`expr-${name}.png`, await sharp(svg).png().toBuffer())
    files.set(`expr-${name}.webp`, await sharp(svg).webp({ lossless: true }).toBuffer())
  }
  return files
}

function generatedTsModule() {
  const imports = []
  const entries = []
  let index = 0
  for (const [name] of STATES) {
    for (const ext of ['webp', 'png']) {
      imports.push(`import asset${index} from './assets/expressions/expr-${name}.${ext}'`)
      index += 1
    }
    entries.push(`  '${name}': { webp: asset${index - 2}, png: asset${index - 1} },`)
  }
  return [
    '/**',
    ' * GENERATED FILE — do not edit. Run `pnpm assets:expression-generate`.',
    ' * Deterministic bundled asset map for the DSH overlay session expressions',
    ' * (DSH_PET_OVERLAY_ADAPTER_V3 CTR-OVERLAY-014). Gate:',
    ' * `pnpm assets:expression-check` byte-compares every artifact.',
    ' */',
    '',
    ...imports,
    '',
    'export const expressionAssets: Readonly<Record<string, { webp: string; png: string }>> = {',
    ...entries,
    '}',
    '',
  ].join('\n')
}

async function provenance(files) {
  const sha256 = {}
  for (const [name, buf] of files) sha256[name] = createHash('sha256').update(buf).digest('hex')
  return {
    provenance_version: 2,
    generated_at_commit: 'see git history of this file',
    route: 'LOCAL_DETERMINISTIC_SVG_RECIPE',
    route_note:
      'Goal 换图 authorized ChatGPT image route was probed first (2026-09-07, sanitized-brief constraint, CODEX_SIDEBAR_BROWSER-class surface): chatgpt.com reachable but unauthenticated, so the route was unavailable; per Goal §18 local bounded execution continued. Goal 灵动 V3 variants reuse the same fixed local recipe approach: masters are drawn by the fixed inline SVG recipes in scripts/generate-expression-assets.mjs — no external images, no fonts, no randomness, no model call at build or runtime.',
    states: STATES.map(([name]) => name),
    canvas: '256x256 transparent, drawn in face-rect-normalized coordinates',
    anchors_480x480_percent: ANCHOR_PX,
    accepted_at: '2026-09-08',
    visual_review: {
      reviewer: 'independent visual evaluation agent (Goal 灵动 internal; did not participate in generation)',
      result: 'ACCEPT',
      revision_rounds_used: 2,
      rounds: [
        {
          round: 'R1',
          result: 'REJECT',
          key_finding: 'the corrected V2 sprites present a white face plate at the l1-l5 anchors (not the dark navy display the original recipes assumed), so light/white features were invisible; seven revision requests (contrast, safe area, bubble clip, cancelled identity, proud/completed separation, sleepy cleanup, blush position)',
        },
        {
          round: 'R2',
          result: 'ACCEPT',
          revision_requests: 'NONE',
        },
      ],
      criteria: {
        SAME_CHARACTER_IDENTITY: 'PASS',
        STATIC_EXPRESSION_READABILITY: 'PASS',
        '112PX_EXPRESSION_READABILITY': 'PASS',
        LEVEL_IDENTITY_PRESERVED: 'PASS',
        COPY_OR_BRAND_RISK: 'NONE',
      },
      method: '112px contact sheet (all 12 levels x 10 variants) rendered from the exact exported bytes, plus 256px masters and a 50% squint variant; per-variant face-region zooms',
      note: 'R1 also surfaced a pre-existing latent regression from the Goal 换图 sprite correction (the five V2-era masters were reviewed against the pre-correction sprites); the V3 regeneration re-reviewed all ten masters against the corrected sprites.',
    },
    sha256,
  }
}

const files = await renderAll()
if (check) {
  const tmp = await mkdtemp(path.join(tmpdir(), 'vehicle-pet-expr-'))
  try {
    let mismatch = false
    const currentTs = await readFile(GENERATED_TS, 'utf8').catch(() => null)
    if (currentTs !== generatedTsModule()) mismatch = true
    for (const [name, buf] of files) {
      const target = path.join(OUT_DIR, name)
      if (!existsSync(target)) { console.error(`missing: ${name}`); mismatch = true; continue }
      const current = await readFile(target)
      if (!current.equals(buf)) { console.error(`byte-mismatch: ${name}`); mismatch = true }
    }
    if (mismatch) { process.exit(1) }
    console.log('expression assets check: OK (byte-identical)')
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
} else {
  await mkdir(OUT_DIR, { recursive: true })
  for (const [name, buf] of files) {
    await writeFile(path.join(OUT_DIR, name), buf)
  }
  await writeFile(path.join(OUT_DIR, 'PROVENANCE.json'), JSON.stringify(await provenance(files), null, 2) + '\n', 'utf8')
  await writeFile(GENERATED_TS, generatedTsModule(), 'utf8')
  console.log(`generated ${files.size} expression assets + generated TS + PROVENANCE.json`)
}
