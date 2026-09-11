/**
 * Orb fixture pet asset pipeline (DSH_PET_OVERLAY_ADAPTER_V8 §17, Goal「开放」
 * slice 3b): deterministically generates the third-pet fixture's journey pack
 * (`src/packs/orb-fixture`) and its pose-sprite presentation assets
 * (`src/dsh/client/pets/orb`), then emits the generated asset module and a
 * provenance record. Pure local SVG → sharp rasterization: no model calls, no
 * network, no baked brand text, no baked level numerals (CTR-042); scale is
 * expressed through orbit rings and satellite population only.
 *
 * Deterministic: fixed geometry and colors, stable star placement by hash.
 * `--check` regenerates into a temp dir and byte-compares the checked-in outputs.
 */

import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const packDir = path.join(repoRoot, 'src/packs/orb-fixture')
const assetsDir = path.join(packDir, 'assets/orb-fixture')
const petDir = path.join(repoRoot, 'src/dsh/client/pets/orb')
const check = process.argv.includes('--check')

const hash = bytes => createHash('sha256').update(bytes).digest('hex')
const emitted = {}

async function emit(filePath, bytes) {
  const relative = path.relative(repoRoot, filePath)
  if (check) {
    if (!existsSync(filePath)) throw new Error(`Asset drift (missing): ${relative}`)
    const current = await readFile(filePath)
    if (!current.equals(Buffer.from(bytes))) throw new Error(`Asset drift: ${relative}`)
  } else {
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, bytes)
  }
  emitted[relative] = hash(bytes)
}

// --- deterministic pseudo-random star field ---------------------------------

function seeded(seed) {
  let state = 0
  for (const ch of seed) state = (Math.imul(state ^ ch.charCodeAt(0), 2654435761) >>> 0)
  return () => {
    state = (Math.imul(state ^ (state >>> 15), 2246822519) >>> 0)
    state = (Math.imul(state ^ (state >>> 13), 3266489917) >>> 0)
    return ((state ^= state >>> 16) >>> 0) / 4294967296
  }
}

// --- journey pack definitions -----------------------------------------------

const LEVELS = [
  { id: 'l1', threshold: 0, stage: { 'zh-CN': '微光', en: 'Spark' }, summary: { 'zh-CN': '一颗安静悬浮的光球。', en: 'A quiet orb floating in the dark.' }, milestone: { 'zh-CN': '旅程从一点微光开始。', en: 'The journey begins with a single spark.' }, rings: 0, moons: 0, radius: 46, camera: 'close', scale: 'individual' },
  { id: 'l2', threshold: 40, stage: { 'zh-CN': '晕光', en: 'Glow' }, summary: { 'zh-CN': '光球学会了稳定自己的光晕。', en: 'The orb steadies its own halo.' }, milestone: { 'zh-CN': '第一圈光晕稳定下来了。', en: 'The first halo holds steady.' }, rings: 1, moons: 0, radius: 54, camera: 'close', scale: 'individual' },
  { id: 'l3', threshold: 160, stage: { 'zh-CN': '辉光', en: 'Shine' }, summary: { 'zh-CN': '两颗小卫星加入了光球的轨道。', en: 'Two small moons join the orbit.' }, milestone: { 'zh-CN': '轨道上有了第一批同伴。', en: 'The orbit gains its first company.' }, rings: 1, moons: 2, radius: 60, camera: 'district', scale: 'group' },
  { id: 'l4', threshold: 400, stage: { 'zh-CN': '光辉', en: 'Radiance' }, summary: { 'zh-CN': '三颗卫星与双环，光球照亮了整个星域。', en: 'Three moons and twin rings light up the whole sector.' }, milestone: { 'zh-CN': '光球成为一片星域的中心。', en: 'The orb becomes the center of a sector.' }, rings: 2, moons: 3, radius: 64, camera: 'district', scale: 'cluster' },
]

const orbPalette = { core: '#7fd4ff', halo: '#2a6f9e', ring: '#9ad9f2', moon: '#cfe9f7', bg: '#0d1b2a' }

/** Scene background: dark space, deterministic stars, no text. */
function backgroundSvg(level) {
  const rand = seeded(`orb-bg-${level.id}`)
  const stars = []
  for (let i = 0; i < 90; i += 1) {
    const x = Math.round(rand() * 800)
    const y = Math.round(rand() * 450)
    const r = rand() < 0.85 ? 1 : 2
    const o = (0.25 + rand() * 0.55).toFixed(2)
    stars.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#cfe9f7" opacity="${o}"/>`)
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect width="800" height="450" fill="${orbPalette.bg}"/>${stars.join('')}</svg>`
}

/** Level subject sprite: the orb itself, rings and moons as population. */
function subjectSvg(level) {
  const c = 240
  const { radius, rings, moons } = level
  const moonNodes = Array.from({ length: moons }, (_, i) => {
    const angle = (i / Math.max(1, moons)) * Math.PI * 2 + 0.6
    const mx = c + Math.cos(angle) * (radius + 34)
    const my = c + Math.sin(angle) * (radius + 34) * 0.45
    return `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="11" fill="${orbPalette.moon}"/>`
  }).join('')
  const ringNodes = Array.from({ length: rings }, (_, i) => {
    const rx = radius + 22 + i * 18
    return `<ellipse cx="${c}" cy="${c}" rx="${rx}" ry="${(rx * 0.42).toFixed(1)}" fill="none" stroke="${orbPalette.ring}" stroke-width="4" opacity="${0.85 - i * 0.25}"/>`
  }).join('')
  return `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
  <circle cx="${c}" cy="${c}" r="${radius + 16}" fill="${orbPalette.halo}" opacity="0.35"/>
  <circle cx="${c}" cy="${c}" r="${radius}" fill="${orbPalette.core}"/>
  <circle cx="${c - radius * 0.3}" cy="${c - radius * 0.32}" r="${radius * 0.2}" fill="#ffffff" opacity="0.5"/>
  ${ringNodes}${moonNodes}
</svg>`
}

// --- pose sprites (pet presentation, 320x540 canvas) -------------------------

const POSE_CANVAS = { width: 320, height: 540 }

const POSE_EXPRESSIONS = {
  idle: { eyes: 'open', mouth: 'soft', tilt: 0, extra: '' },
  'idle-happy': { eyes: 'happy', mouth: 'smile', tilt: 0, extra: '' },
  'idle-curious': { eyes: 'open', mouth: 'o', tilt: 8, extra: '' },
  'idle-sleepy': { eyes: 'closed', mouth: 'soft', tilt: -4, extra: '' },
  working: { eyes: 'focused', mouth: 'flat', tilt: 0, extra: 'spin' },
  'needs-input': { eyes: 'wide', mouth: 'o', tilt: 0, extra: 'mark' },
  completed: { eyes: 'happy', mouth: 'smile', tilt: 0, extra: 'burst' },
  'completed-proud': { eyes: 'happy', mouth: 'grin', tilt: -3, extra: 'sparkle' },
  failed: { eyes: 'sad', mouth: 'frown', tilt: 6, extra: 'droop' },
  cancelled: { eyes: 'closed', mouth: 'soft', tilt: 0, extra: 'wisp' },
}

function face(x, y, r, expression) {
  const eye = (dx) => {
    switch (expression.eyes) {
      case 'happy': return `<path d="M ${x + dx - 9} ${y} q 9 -10 18 0" stroke="#0d1b2a" stroke-width="5" fill="none" stroke-linecap="round"/>`
      case 'closed': return `<path d="M ${x + dx - 9} ${y} q 9 7 18 0" stroke="#0d1b2a" stroke-width="5" fill="none" stroke-linecap="round"/>`
      case 'wide': return `<circle cx="${x + dx}" cy="${y - 2}" r="8" fill="#0d1b2a"/><circle cx="${x + dx + 3}" cy="${y - 5}" r="2.5" fill="#fff"/>`
      case 'sad': return `<circle cx="${x + dx}" cy="${y}" r="7" fill="#0d1b2a"/><path d="M ${x + dx - 11} ${y - 12} q 11 -7 22 0" stroke="#0d1b2a" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.6"/>`
      case 'focused': return `<path d="M ${x + dx - 9} ${y - 3} h 18" stroke="#0d1b2a" stroke-width="5" fill="none" stroke-linecap="round"/>`
      default: return `<circle cx="${x + dx}" cy="${y}" r="7.5" fill="#0d1b2a"/><circle cx="${x + dx + 2.5}" cy="${y - 2.5}" r="2.2" fill="#fff"/>`
    }
  }
  const mouth = () => {
    switch (expression.mouth) {
      case 'smile': return `<path d="M ${x - 12} ${y + 26} q 12 12 24 0" stroke="#0d1b2a" stroke-width="5" fill="none" stroke-linecap="round"/>`
      case 'grin': return `<path d="M ${x - 14} ${y + 24} q 14 18 28 0 z" fill="#0d1b2a" opacity="0.85"/>`
      case 'frown': return `<path d="M ${x - 12} ${y + 32} q 12 -10 24 0" stroke="#0d1b2a" stroke-width="5" fill="none" stroke-linecap="round"/>`
      case 'o': return `<circle cx="${x}" cy="${y + 28}" r="7" fill="#0d1b2a"/>`
      case 'flat': return `<path d="M ${x - 10} ${y + 28} h 20" stroke="#0d1b2a" stroke-width="5" fill="none" stroke-linecap="round"/>`
      default: return `<path d="M ${x - 8} ${y + 28} q 8 6 16 0" stroke="#0d1b2a" stroke-width="4.5" fill="none" stroke-linecap="round"/>`
    }
  }
  return eye(-20) + eye(20) + mouth()
}

function poseSvg(variant) {
  const expression = POSE_EXPRESSIONS[variant]
  const cx = 160
  const cy = 250
  const r = 86
  const rotate = expression.tilt ? ` transform="rotate(${expression.tilt} ${cx} ${cy})"` : ''
  let extra = ''
  if (expression.extra === 'spin') {
    extra = `<ellipse cx="${cx}" cy="${cy}" rx="${r + 34}" ry="${(r + 34) * 0.32}" fill="none" stroke="${orbPalette.ring}" stroke-width="5" stroke-dasharray="16 10" opacity="0.9"/>`
  } else if (expression.extra === 'burst') {
    extra = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2
      const x1 = cx + Math.cos(a) * (r + 18), y1 = cy + Math.sin(a) * (r + 18)
      const x2 = cx + Math.cos(a) * (r + 40), y2 = cy + Math.sin(a) * (r + 40)
      return `<path d="M ${x1} ${y1} L ${x2} ${y2}" stroke="#ffd766" stroke-width="6" stroke-linecap="round"/>`
    }).join('')
  } else if (expression.extra === 'sparkle') {
    extra = `<path d="M ${cx + r - 6} ${cy - r - 6} l 6 16 l 16 6 l -16 6 l -6 16 l -6 -16 l -16 -6 l 16 -6 z" fill="#ffd766"/>`
  } else if (expression.extra === 'droop') {
    extra = `<ellipse cx="${cx}" cy="${cy + r + 26}" rx="40" ry="8" fill="${orbPalette.halo}" opacity="0.4"/>`
  } else if (expression.extra === 'wisp') {
    extra = `<path d="M ${cx + r + 10} ${cy - r + 10} q 18 -14 8 -34" stroke="${orbPalette.moon}" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.8"/>`
  } else if (expression.extra === 'mark') {
    extra = `<circle cx="${cx + r + 8}" cy="${cy - r - 4}" r="13" fill="#ffd766"/><text x="${cx + r + 8}" y="${cy - r + 3}" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="#0d1b2a">?</text>`
  }
  const rings = variant === 'working' ? '' : `<ellipse cx="${cx}" cy="${cy}" rx="${r + 22}" ry="${(r + 22) * 0.3}" fill="none" stroke="${orbPalette.ring}" stroke-width="4" opacity="0.55"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${POSE_CANVAS.width}" height="${POSE_CANVAS.height}" viewBox="0 0 320 540">
  <g${rotate}>
    <circle cx="${cx}" cy="${cy}" r="${r + 14}" fill="${orbPalette.halo}" opacity="0.4"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${orbPalette.core}"/>
    <circle cx="${cx - 28}" cy="${cy - 30}" r="18" fill="#ffffff" opacity="0.5"/>
    ${rings}${extra}${face(cx, cy - 6, r, expression)}
  </g>
</svg>`
}

// --- rasterization + emission ------------------------------------------------

async function rasterize(svg, width, height) {
  return sharp(Buffer.from(svg)).resize(width, height, { fit: 'contain', background: '#00000000' }).png().toBuffer()
}

async function emitPair(assetIdStem, relativePathStem, svg, width, height) {
  const png = await rasterize(svg, width, height)
  const webp = await sharp(png).webp({ lossless: false, effort: 6 }).toBuffer()
  await emit(path.join(assetsDir, `${relativePathStem}.png`), png)
  await emit(path.join(assetsDir, `${relativePathStem}.webp`), webp)
  const meta = await sharp(png).metadata()
  return {
    pngAsset: { assetId: `${assetIdStem}-png`, path: `assets/orb-fixture/${relativePathStem}.png`, format: 'png', role: 'art', width: meta.width, height: meta.height, byteSizeCompressed: png.length },
    webpAsset: { assetId: `${assetIdStem}-webp`, path: `assets/orb-fixture/${relativePathStem}.webp`, format: 'webp', role: 'art', width: meta.width, height: meta.height, byteSizeCompressed: webp.length },
    png, webp,
  }
}

async function buildManifestAssets() {
  const assets = []
  const levelArt = {}
  for (const level of LEVELS) {
    const bg = await emitPair(`bg-s-${level.id}`, `bg-s-${level.id}`, backgroundSvg(level), 800, 450)
    bg.webpAsset.role = 'background'
    bg.pngAsset.role = 'background'
    const subject = await emitPair(`sprite-subject-${level.id}`, `sprite-subject-${level.id}`, subjectSvg(level), 480, 480)
    subject.webpAsset.role = 'sprite'
    subject.pngAsset.role = 'sprite'
    assets.push(bg.webpAsset, bg.pngAsset, subject.webpAsset, subject.pngAsset)
    levelArt[level.id] = { bgAlt: { 'zh-CN': `星域背景（${level.stage['zh-CN']}）`, en: `Sector background (${level.stage.en})` }, subjectAlt: { 'zh-CN': `${level.stage['zh-CN']}形态的光球`, en: `The orb in its ${level.stage.en} form` } }
  }
  return { assets, levelArt }
}

function manifestJson(assets) {
  return {
    schemaVersion: 1,
    packId: 'orb-fixture',
    packVersion: '1.0.0',
    name: { 'zh-CN': '光球伙伴', en: 'Orb Companion' },
    displayConversion: { unitLabel: { 'zh-CN': '点', en: 'pts' }, pointsPerUnit: 1 },
    levels: LEVELS.map(level => ({
      levelId: level.id,
      threshold: level.threshold,
      stageName: level.stage,
      summary: level.summary,
      milestone: level.milestone,
      sceneId: `s-${level.id}`,
      keepsakeId: level.id === 'l1' ? undefined : `ks-${level.id}`,
      presentation: { scale: level.scale, camera: level.camera, milestone: 'inline' },
    })),
    scenes: LEVELS.map(level => ({
      sceneId: `s-${level.id}`,
      backgroundAssetId: `bg-s-${level.id}-webp`,
      layers: [{ layerId: `orb-subject-${level.id}`, kind: 'subject', assetId: `sprite-subject-${level.id}-webp`, placement: 'center', zOrder: 10 }],
      transition: level.id === 'l1' ? 'instant' : 'crossfade',
      sceneLabel: { 'zh-CN': `${LEVELS.find(l => l.id === level.id).stage['zh-CN']}星域中的光球`, en: `The orb in its ${level.stage.en} sector` },
    })),
    assets,
    keepsakes: [
      { keepsakeId: 'ks-l2', levelId: 'l2', title: { 'zh-CN': '第一圈光晕', en: 'First Halo' }, accessDescription: { 'zh-CN': '纪念光晕第一次稳定下来。', en: 'Marks the first steady halo.' }, assetId: 'sprite-subject-l2-webp' },
      { keepsakeId: 'ks-l3', levelId: 'l3', title: { 'zh-CN': '两颗小卫星', en: 'Two Moons' }, accessDescription: { 'zh-CN': '纪念轨道上的第一批同伴。', en: 'Marks the first company in orbit.' }, assetId: 'sprite-subject-l3-webp' },
      { keepsakeId: 'ks-l4', levelId: 'l4', title: { 'zh-CN': '双环星域', en: 'Twin Rings' }, accessDescription: { 'zh-CN': '纪念照亮整片星域的时刻。', en: 'Marks the moment the whole sector lit up.' }, assetId: 'sprite-subject-l4-webp' },
    ],
  }
}

async function altTextPatch(manifest, levelArt) {
  for (const asset of manifest.assets) {
    const levelId = asset.assetId.replace(/^bg-s-/, '').replace(/^sprite-subject-/, '').replace(/-png$/, '').replace(/-webp$/, '')
    const art = levelArt[levelId]
    if (art === undefined) continue
    asset.altText = asset.assetId.startsWith('bg-') ? art.bgAlt : art.subjectAlt
  }
}

async function buildPoseAssets() {
  const emitted = {}
  let index = 0
  for (const variant of Object.keys(POSE_EXPRESSIONS)) {
    const png = await rasterize(poseSvg(variant), POSE_CANVAS.width, POSE_CANVAS.height)
    const webp = await sharp(png).webp({ lossless: true, effort: 6 }).toBuffer()
    await emit(path.join(petDir, `assets/pose-${index}.png`), png)
    await emit(path.join(petDir, `assets/pose-${index}.webp`), webp)
    index += 1
  }
  // The pet wiring generator scans these pose files and measures alpha
  // bounds itself; no generated TS module is needed here (R3 fix round).
}

async function main() {
  const { assets, levelArt } = await buildManifestAssets()
  const manifest = manifestJson(assets)
  await altTextPatch(manifest, levelArt)
  await emit(path.join(packDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
  await buildPoseAssets()
  await emit(path.join(petDir, 'PROVENANCE-orb.json'), JSON.stringify({
    route: 'LOCAL_DETERMINISTIC_SCRIPT',
    generator: 'scripts/generate-orb-fixture-assets.mjs',
    note: 'Original fixture art rasterized from in-repo SVG recipes; no model generation, no third-party brand, no baked level numerals.',
    outputs: emitted,
  }, null, 2) + '\n')
  console.log(`Orb fixture assets ${check ? 'check' : 'generation'} PASS (${Object.keys(emitted).length} files)`)
}

await main().catch(async error => {
  if (check && process.env.ORB_TMPDIR) await rm(process.env.ORB_TMPDIR, { recursive: true, force: true })
  console.error(error)
  process.exit(1)
})
