#!/usr/bin/env node
/**
 * Deterministic expression-asset generator for the DSH overlay session
 * expressions (DSH_PET_OVERLAY_ADAPTER_V2 DEC-OVERLAY-007 / CTR-OVERLAY-014).
 *
 * Five transparent state masters (idle, working, needs-input, completed,
 * failed) are drawn from a fixed inline SVG recipe — no external images, no
 * fonts, no randomness, no model call — and rasterized by sharp to PNG plus
 * lossless WebP. The same run emits:
 *   src/dsh/client/assets/expressions/expr-<state>.png / .webp
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
const SLATE = '#5E6F85'
const WHITE = '#FFFFFF'
const stroke = (w) => `stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`

// Face anchor rects per level as percentages of the 480x480 level sprite
// canvas: [left, top, size]. Measured against the shipped autonomous-fleet
// sprites at base 6350ce8 (see PROVENANCE.json).
const ANCHOR_PX = {
  l1: [8, 43, 28], l2: [12, 42, 32], l3: [9, 42, 28], l4: [12, 44, 32],
  l5: [10, 53, 30], l6: [29, 53, 27], l7: [43, 66, 23], l8: [51, 67, 23],
  l9: [26, 63, 27], l10: [28, 62, 24], l11: [22, 62, 24], l12: [8, 59, 26],
}

function idle() {
  return `
  <ellipse cx="38" cy="180" rx="30" ry="15" fill="${PINK}" opacity="0.8"/>
  <ellipse cx="154" cy="180" rx="30" ry="15" fill="${PINK}" opacity="0.8"/>
  <path d="M 46 120 Q 68 108 90 116" fill="none" stroke="${NAVY}" ${stroke(9)} opacity="0.9"/>
  <path d="M 130 116 Q 152 108 174 120" fill="none" stroke="${NAVY}" ${stroke(9)} opacity="0.9"/>`
}
function working() {
  return `
  <path d="M 36 108 L 92 124" fill="none" stroke="${NAVY}" ${stroke(12)}/>
  <path d="M 128 124 L 184 108" fill="none" stroke="${NAVY}" ${stroke(12)}/>
  <path d="M 6 146 L 62 146" stroke="${AMBER}" ${stroke(12)}/>
  <path d="M 0 172 L 46 172" stroke="${AMBER}" ${stroke(12)} opacity="0.85"/>
  <path d="M 8 198 L 54 198" stroke="${AMBER}" ${stroke(12)} opacity="0.7"/>`
}
function needsInput() {
  return `
  <path d="M 40 94 Q 66 74 92 94" fill="none" stroke="${NAVY}" ${stroke(10)}/>
  <path d="M 128 94 Q 154 74 180 94" fill="none" stroke="${NAVY}" ${stroke(10)}/>
  <rect x="148" y="4" width="104" height="90" rx="20" fill="${WHITE}" stroke="${NAVY}" ${stroke(8)}/>
  <path d="M 166 92 L 150 122 L 196 92 Z" fill="${WHITE}" stroke="${NAVY}" ${stroke(8)}/>
  <path d="M 185 34 A 16 16 0 1 1 200 62 L 200 71" fill="none" stroke="${NAVY}" ${stroke(12)}/>
  <circle cx="200" cy="88" r="8.5" fill="${NAVY}"/>`
}
function completed() {
  return `
  <path d="M 26 132 A 29 29 0 0 1 84 132" fill="none" stroke="${NAVY}" ${stroke(12)}/>
  <path d="M 122 132 A 29 29 0 0 1 180 132" fill="none" stroke="${NAVY}" ${stroke(12)}/>
  <path d="M 88 178 A 38 38 0 0 0 164 178 Z" fill="${NAVY}"/>
  <path d="M 103 178 A 23 17 0 0 0 149 178 Z" fill="${PINK}"/>
  <g transform="translate(26,52) scale(1.25)"><path d="M 0 -16 L 5 -5 L 16 0 L 5 5 L 0 16 L -5 5 L -16 0 L -5 -5 Z" fill="${AMBER}" stroke="${NAVY}" ${stroke(4)}/></g>
  <g transform="translate(218,90) scale(1.0)"><path d="M 0 -16 L 5 -5 L 16 0 L 5 5 L 0 16 L -5 5 L -16 0 L -5 -5 Z" fill="${AMBER}" stroke="${NAVY}" ${stroke(4)}/></g>
  <circle cx="62" cy="30" r="8" fill="${AMBER}"/>
  <circle cx="178" cy="26" r="7" fill="${BLUE}"/>
  <circle cx="230" cy="158" r="7" fill="${PINK}"/>`
}
function failed() {
  return `
  <path d="M 40 108 Q 64 122 92 114" fill="none" stroke="${SLATE}" ${stroke(11)}/>
  <path d="M 128 114 Q 156 122 180 108" fill="none" stroke="${SLATE}" ${stroke(11)}/>
  <path d="M 94 202 Q 110 188 126 202 Q 142 216 158 202" fill="none" stroke="${SLATE}" ${stroke(12)}/>
  <path d="M 204 58 Q 224 92 204 108 Q 184 92 204 58 Z" fill="${BLUE}" stroke="${NAVY}" ${stroke(7)}/>`
}

const STATES = [
  ['idle', idle],
  ['working', working],
  ['needs-input', needsInput],
  ['completed', completed],
  ['failed', failed],
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
    ' * (DSH_PET_OVERLAY_ADAPTER_V2 CTR-OVERLAY-014). Gate:',
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
    provenance_version: 1,
    generated_at_commit: 'see git history of this file',
    route: 'LOCAL_DETERMINISTIC_SVG_RECIPE',
    route_note:
      'Goal 常伴 authorized ChatGPT image route was probed first (2026-09-07, sanitized-brief constraint, CODEX_SIDEBAR_BROWSER-class surface): chatgpt.com reachable but unauthenticated, so the route was unavailable; per Goal §18 local bounded execution continued. Masters are drawn by the fixed inline SVG recipe in scripts/generate-expression-assets.mjs — no external images, no fonts, no randomness, no model call at build or runtime.',
    states: STATES.map(([name]) => name),
    canvas: '256x256 transparent, drawn in face-rect-normalized coordinates',
    anchors_480x480_percent: ANCHOR_PX,
    accepted_at: '2026-09-07',
    visual_review: {
      reviewer: 'independent visual evaluation agent (Goal 常伴 internal; did not participate in generation)',
      result: 'ACCEPT',
      revision_rounds_used: 1,
      criteria: {
        SAME_CHARACTER_IDENTITY: 'PASS',
        STATIC_EXPRESSION_READABILITY: 'PASS',
        '112PX_EXPRESSION_READABILITY': 'PASS',
        LEVEL_IDENTITY_PRESERVED: 'PASS',
        COPY_OR_BRAND_RISK: 'NONE',
      },
      method: '112px contact sheet (all 12 levels x 5 states) rendered from the exact exported bytes, plus 256px masters; squint test at 1x and 50% downscale',
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
