#!/usr/bin/env node
/**
 * Deterministic first-version raster asset generator for bundled Pet Packs.
 *
 * Every visual is drawn from a fixed inline SVG recipe (no external images,
 * no fonts, no randomness), rasterized by sharp to PNG, and encoded as
 * lossless WebP. Both formats are checked into the Pack directory.
 *
 * Modes:
 *   node scripts/generate-pack-assets.mjs           generate into src/packs/** and sync manifest metadata
 *   node scripts/generate-pack-assets.mjs --check   regenerate into a temp dir and compare byte-for-byte
 *
 * The script is manifest-driven: it renders exactly the assets declared by
 * each src/packs/<pack>/manifest.json found on disk.
 */

import { mkdir, readFile, readdir, writeFile, rm, mkdtemp } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const PACKS_DIR = path.join(REPO_ROOT, 'src', 'packs')
const W = 1600
const H = 900

// ---------------------------------------------------------------------------
// SVG recipe helpers (deterministic; every number is fixed)
// ---------------------------------------------------------------------------

function skyGradient(id, top, bottom) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${top}"/>
    <stop offset="1" stop-color="${bottom}"/>
  </linearGradient>`
}

function svgWrap(w, h, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`
}

function cloud(cx, cy, s, color = '#ffffff', opacity = '0.85') {
  return `<g opacity="${opacity}" fill="${color}">
    <ellipse cx="${cx}" cy="${cy}" rx="${40 * s}" ry="${16 * s}"/>
    <ellipse cx="${cx + 26 * s}" cy="${cy - 8 * s}" rx="${30 * s}" ry="${14 * s}"/>
    <ellipse cx="${cx - 28 * s}" cy="${cy - 4 * s}" rx="${24 * s}" ry="${11 * s}"/>
  </g>`
}

function dashedLine(x1, y1, x2, y2, color, width, dash) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" stroke-dasharray="${dash}"/>`
}

function perspRoad(horizonY, roadColor, edgeColor) {
  return `<polygon points="620,${horizonY} 980,${horizonY} 1520,900 80,900" fill="${roadColor}"/>
  <polygon points="612,${horizonY} 620,${horizonY} 96,900 60,900" fill="${edgeColor}"/>
  <polygon points="980,${horizonY} 988,${horizonY} 1540,900 1504,900" fill="${edgeColor}"/>`
}

function buildingRow(seed, baseY, minH, maxH, fill, windowColor, windowChance = 0.7) {
  // Deterministic pseudo-layout from a fixed numeric seed.
  let state = seed
  const rand = () => {
    state = (state * 1103515245 + 12345) % 2147483648
    return state / 2147483648
  }
  let x = -20
  let out = ''
  while (x < W + 20) {
    const bw = 60 + Math.floor(rand() * 90)
    const bh = minH + Math.floor(rand() * (maxH - minH))
    out += `<rect x="${x}" y="${baseY - bh}" width="${bw}" height="${bh}" fill="${fill}"/>`
    for (let wy = baseY - bh + 16; wy < baseY - 12; wy += 24) {
      for (let wx = x + 10; wx < x + bw - 14; wx += 20) {
        if (rand() < windowChance) {
          out += `<rect x="${wx}" y="${wy}" width="9" height="12" fill="${windowColor}" opacity="0.9"/>`
        }
      }
    }
    x += bw + 8
  }
  return out
}

function nodeNetwork(nodes, edges, lineColor, nodeColor, wide = 5, thin = 2) {
  let out = `<g stroke-linecap="round" fill="none">`
  for (const [a, b] of edges) {
    const [ax, ay] = nodes[a]
    const [bx, by] = nodes[b]
    out += `<path d="M${ax},${ay} Q${(ax + bx) / 2},${Math.min(ay, by) - 60} ${bx},${by}" stroke="${lineColor}" stroke-width="${wide}" opacity="0.25"/>`
    out += `<path d="M${ax},${ay} Q${(ax + bx) / 2},${Math.min(ay, by) - 60} ${bx},${by}" stroke="${lineColor}" stroke-width="${thin}" opacity="0.95"/>`
  }
  out += `</g>`
  for (const [x, y] of nodes) {
    out += `<circle cx="${x}" cy="${y}" r="7" fill="${nodeColor}"/>`
    out += `<circle cx="${x}" cy="${y}" r="13" fill="${nodeColor}" opacity="0.25"/>`
  }
  return out
}

function bracketFrame(color, inset = 70, len = 120, width = 10) {
  return `<g stroke="${color}" stroke-width="${width}" fill="none" opacity="0.95">
    <path d="M${inset},${inset + len} V${inset} H${inset + len}"/>
    <path d="M${W - inset - len},${inset} H${W - inset} V${inset + len}"/>
    <path d="M${W - inset},${H - inset - len} V${H - inset} H${W - inset - len}"/>
    <path d="M${inset + len},${H - inset} H${inset} V${H - inset - len}"/>
  </g>
  <line x1="${inset}" y1="${H / 2}" x2="${W - inset}" y2="${H / 2}" stroke="${color}" stroke-width="2" opacity="0.4"/>`
}

// ---------------------------------------------------------------------------
// Recipes: packId -> { stem -> { width, height, svg } }
// ---------------------------------------------------------------------------

const RECIPES = {
  'autonomous-fleet': {
    'bg-road-test': {
      width: W,
      height: H,
      svg: svgWrap(W, H, `<defs>${skyGradient('sky', '#a8d4f5', '#e6f3fb')}</defs>
        <rect width="${W}" height="${H}" fill="url(#sky)"/>
        ${cloud(300, 130, 1.1)}${cloud(980, 90, 0.8)}${cloud(1350, 160, 1.0, '#ffffff', '0.7')}
        <rect x="0" y="560" width="${W}" height="60" fill="#9fb37f"/>
        <rect x="0" y="560" width="${W}" height="10" fill="#87a06b"/>
        ${perspRoad(590, '#5c6675', '#48505c')}
        ${dashedLine(770, 640, 620, 900, '#f2f6ff', 14, '70 50')}
        ${dashedLine(840, 640, 980, 900, '#f2f6ff', 14, '70 50')}
        <rect x="0" y="556" width="${W}" height="6" fill="#c6d2e2" opacity="0.8"/>`),
    },
    'bg-convoy': {
      width: W,
      height: H,
      svg: svgWrap(W, H, `<defs>${skyGradient('sky', '#9ccbe0', '#dff0ec')}</defs>
        <rect width="${W}" height="${H}" fill="url(#sky)"/>
        ${cloud(500, 110, 1.0)}${cloud(1250, 150, 0.9, '#ffffff', '0.75')}
        <rect x="0" y="540" width="${W}" height="70" fill="#8fa878"/>
        ${perspRoad(570, '#525e6e', '#3f4a58')}
        ${dashedLine(760, 620, 560, 900, '#ffe9a8', 16, '80 55')}
        ${dashedLine(850, 620, 1050, 900, '#ffe9a8', 16, '80 55')}
        <rect x="430" y="470" width="14" height="100" fill="#5a6b7d"/>
        <rect x="1160" y="470" width="14" height="100" fill="#5a6b7d"/>
        <rect x="420" y="462" width="164" height="10" fill="#6b7d90"/>
        <rect x="1150" y="462" width="164" height="10" fill="#6b7d90"/>`),
    },
    'bg-district-fleet': {
      width: W,
      height: H,
      svg: svgWrap(W, H, `<defs>${skyGradient('sky', '#8fbfe0', '#dceaf3')}</defs>
        <rect width="${W}" height="${H}" fill="url(#sky)"/>
        ${cloud(700, 100, 0.9)}${cloud(1400, 140, 0.7, '#ffffff', '0.7')}
        ${buildingRow(560, 42, 560, 200, '#b9c9dc', '#e8f2ff', 0.25)}
        ${buildingRow(600, 60, 600, 240, '#93a9c2', '#d6e6f7', 0.15)}
        <rect x="0" y="600" width="${W}" height="${H - 600}" fill="#77828f"/>
        <rect x="0" y="600" width="${W}" height="8" fill="#8e9aa8"/>
        ${Array.from({ length: 9 }, (_, i) => `<line x1="${120 + i * 160}" y1="640" x2="${120 + i * 160}" y2="860" stroke="#aeb9c6" stroke-width="6"/>`).join('')}
        <line x1="0" y1="750" x2="${W}" y2="750" stroke="#aeb9c6" stroke-width="6"/>`),
    },
    'bg-city-fleet': {
      width: W,
      height: H,
      svg: svgWrap(W, H, `<defs>${skyGradient('sky', '#274a7c', '#0d1c36')}</defs>
        <rect width="${W}" height="${H}" fill="url(#sky)"/>
        <circle cx="1330" cy="150" r="56" fill="#f4eccf" opacity="0.9"/>
        ${buildingRow(640, 11, 300, 640, '#152a4d', '#ffd98a', 0.5)}
        ${buildingRow(660, 23, 200, 560, '#0f2142', '#ffca6b', 0.4)}
        <rect x="0" y="660" width="${W}" height="${H - 660}" fill="#313f5c"/>
        <rect x="0" y="660" width="${W}" height="8" fill="#48587a"/>
        ${dashedLine(0, 780, W, 780, '#ffd98a', 8, '60 60')}
        ${dashedLine(0, 780, W, 780, '#ffedb8', 3, '60 60')}`),
    },
    'bg-metro-network': {
      width: W,
      height: H,
      svg: svgWrap(W, H, `<defs>${skyGradient('sky', '#2c3d86', '#101738')}
        <radialGradient id="glow" cx="0.5" cy="0.42" r="0.6">
          <stop offset="0" stop-color="#7ea6ff" stop-opacity="0.35"/>
          <stop offset="1" stop-color="#7ea6ff" stop-opacity="0"/>
        </radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#sky)"/>
        <rect width="${W}" height="${H}" fill="url(#glow)"/>
        ${nodeNetwork(
          [
            [240, 300], [620, 210], [1010, 260], [1380, 330], [430, 470], [860, 430], [1210, 500], [640, 620], [1020, 640],
          ],
          [
            [0, 1], [1, 2], [2, 3], [0, 4], [1, 4], [1, 5], [2, 5], [2, 6], [3, 6], [4, 7], [5, 7], [5, 8], [6, 8], [7, 8],
          ],
          '#9db8ff',
          '#cfe0ff',
        )}
        <rect x="0" y="700" width="${W}" height="${H - 700}" fill="#1a2450"/>
        <rect x="0" y="700" width="${W}" height="6" fill="#39498c"/>`),
    },
    'bg-regional-field': {
      width: W,
      height: H,
      svg: svgWrap(W, H, `<defs>${skyGradient('sky', '#5b4a8f', '#221c3f')}</defs>
        <rect width="${W}" height="${H}" fill="url(#sky)"/>
        <path d="M0,420 Q300,330 560,400 T1180,380 T1600,430 L1600,900 L0,900 Z" fill="#37305e"/>
        <path d="M0,560 Q400,470 900,540 T1600,520 L1600,900 L0,900 Z" fill="#2c274e"/>
        <g stroke="#b9a6ff" stroke-width="3" fill="none" opacity="0.75">
          <path d="M180,860 L420,700 L700,760 L980,640 L1260,700 L1480,600"/>
          <path d="M420,700 L520,540 L820,480 L1120,560"/>
          <path d="M700,760 L820,480"/>
        </g>
        <g fill="#d9c8ff">
          <circle cx="180" cy="860" r="6"/><circle cx="420" cy="700" r="6"/><circle cx="700" cy="760" r="6"/>
          <circle cx="980" cy="640" r="6"/><circle cx="1260" cy="700" r="6"/><circle cx="1480" cy="600" r="6"/>
          <circle cx="520" cy="540" r="5"/><circle cx="820" cy="480" r="5"/><circle cx="1120" cy="560" r="5"/>
        </g>`),
    },
    'bg-continental-web': {
      width: W,
      height: H,
      svg: svgWrap(W, H, `<defs>${skyGradient('sky', '#182556', '#070c20')}
        <radialGradient id="glow2" cx="0.5" cy="0.5" r="0.65">
          <stop offset="0" stop-color="#6f8dff" stop-opacity="0.4"/>
          <stop offset="1" stop-color="#6f8dff" stop-opacity="0"/>
        </radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#sky)"/>
        <path d="M240,260 L520,180 L900,230 L1240,190 L1420,280 L1280,520 L940,560 L600,520 L340,470 Z"
          fill="#1c2a5c" stroke="#4f6bd8" stroke-width="3" opacity="0.95"/>
        ${nodeNetwork(
          [
            [380, 320], [660, 280], [980, 320], [1240, 360], [520, 440], [860, 460], [1140, 470],
          ],
          [
            [0, 1], [1, 2], [2, 3], [0, 4], [1, 4], [1, 5], [2, 5], [2, 6], [3, 6], [4, 5], [5, 6],
          ],
          '#8fa8ff',
          '#e4ecff',
        )}
        <rect width="${W}" height="${H}" fill="url(#glow2)"/>`),
    },
    'bg-terminal-horizon': {
      width: W,
      height: H,
      svg: svgWrap(W, H, `<defs>${skyGradient('sky', '#0b1022', '#02040c')}
        <linearGradient id="horizon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffcf7d" stop-opacity="0"/>
          <stop offset="0.55" stop-color="#ffcf7d" stop-opacity="0.55"/>
          <stop offset="1" stop-color="#ffcf7d" stop-opacity="0"/>
        </linearGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#sky)"/>
        <g stroke="#26304f" stroke-width="1">
          ${Array.from({ length: 15 }, (_, i) => `<line x1="${i * (W / 14)}" y1="0" x2="${i * (W / 14)}" y2="${H}"/>`).join('')}
          ${Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${i * (H / 8)}" x2="${W}" y2="${i * (H / 8)}"/>`).join('')}
        </g>
        <rect x="0" y="540" width="${W}" height="120" fill="url(#horizon)"/>
        <line x1="0" y1="600" x2="${W}" y2="600" stroke="#ffe6b0" stroke-width="3" opacity="0.9"/>
        <g fill="#ffe6b0">
          ${Array.from({ length: 24 }, (_, i) => `<circle cx="${60 + i * 65}" cy="${560 + (i % 3) * 30}" r="${2 + (i % 3)}" opacity="${0.5 + (i % 4) * 0.12}"/>`).join('')}
        </g>
        <rect x="0" y="640" width="${W}" height="${H - 640}" fill="#05070f"/>`),
    },
    'sprite-cabin-driver': {
      width: 480,
      height: 480,
      svg: svgWrap(480, 480, `<defs><linearGradient id="driverBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b9dff5"/></linearGradient></defs>
        <ellipse cx="240" cy="420" rx="160" ry="24" fill="#0d1220" opacity="0.3"/>
        <path d="M72,330 L96,178 Q108,132 160,120 H320 Q372,132 384,178 L408,330 Q410,370 370,378 H110 Q70,370 72,330 Z" fill="url(#driverBody)" stroke="#4b7896" stroke-width="7"/>
        <path d="M120,190 Q240,126 360,190 L344,260 H136 Z" fill="#bce9ff" stroke="#5aa5ca" stroke-width="6"/>
        <path d="M240,158 V270" stroke="#5aa5ca" stroke-width="6"/>
        <circle cx="183" cy="208" r="27" fill="#2563a6"/><path d="M145,267 Q183,228 221,267 V292 H145 Z" fill="#2563a6"/>
        <circle cx="297" cy="210" r="25" fill="none" stroke="#8ba5b5" stroke-width="6" stroke-dasharray="8 7"/>
        <path d="M267,269 Q297,239 327,269" fill="none" stroke="#8ba5b5" stroke-width="6" stroke-dasharray="8 7"/>
        <rect x="128" y="315" width="224" height="42" rx="21" fill="#2563a6"/><circle cx="155" cy="336" r="9" fill="#d9f2ff"/><circle cx="325" cy="336" r="9" fill="#d9f2ff"/>`),
    },
    'sprite-cabin-safety': {
      width: 480,
      height: 480,
      svg: svgWrap(480, 480, `<defs><linearGradient id="safetyBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d8e4f5"/></linearGradient></defs>
        <ellipse cx="240" cy="420" rx="160" ry="24" fill="#0d1220" opacity="0.3"/>
        <path d="M72,330 L96,178 Q108,132 160,120 H320 Q372,132 384,178 L408,330 Q410,370 370,378 H110 Q70,370 72,330 Z" fill="url(#safetyBody)" stroke="#6269a8" stroke-width="7"/>
        <path d="M120,190 Q240,126 360,190 L344,260 H136 Z" fill="#d8dcff" stroke="#777fc5" stroke-width="6"/>
        <path d="M240,158 V270" stroke="#777fc5" stroke-width="6"/>
        <circle cx="183" cy="210" r="25" fill="none" stroke="#8ba5b5" stroke-width="6" stroke-dasharray="8 7"/>
        <path d="M153,269 Q183,239 213,269" fill="none" stroke="#8ba5b5" stroke-width="6" stroke-dasharray="8 7"/>
        <circle cx="297" cy="208" r="27" fill="#7c3fb2"/><path d="M259,267 Q297,228 335,267 V292 H259 Z" fill="#7c3fb2"/>
        <path d="M272,235 L297,260 L322,235" fill="none" stroke="#f4dd69" stroke-width="8"/>
        <rect x="128" y="315" width="224" height="42" rx="21" fill="#6269a8"/><circle cx="155" cy="336" r="9" fill="#f1efff"/><circle cx="325" cy="336" r="9" fill="#f1efff"/>`),
    },
    'sprite-subject-pod': {
      width: 480,
      height: 480,
      svg: svgWrap(480, 480, `<defs>
        <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d8e4f5"/>
        </linearGradient></defs>
        <ellipse cx="240" cy="420" rx="150" ry="26" fill="#0d1220" opacity="0.35"/>
        <rect x="90" y="150" width="300" height="210" rx="95" fill="url(#body)" stroke="#9db4d6" stroke-width="6"/>
        <path d="M140,190 Q240,120 340,190 L340,230 Q240,190 140,230 Z" fill="#8fd8ff" stroke="#5fb6e8" stroke-width="5"/>
        <circle cx="196" cy="286" r="17" fill="#22314f"/>
        <circle cx="284" cy="286" r="17" fill="#22314f"/>
        <circle cx="201" cy="281" r="5" fill="#ffffff"/>
        <circle cx="289" cy="281" r="5" fill="#ffffff"/>
        <path d="M216,322 Q240,340 264,322" stroke="#22314f" stroke-width="6" fill="none" stroke-linecap="round"/>
        <circle cx="150" cy="250" r="6" fill="#7dd3fc"/>
        <circle cx="330" cy="250" r="6" fill="#7dd3fc"/>
        <rect x="120" y="352" width="46" height="26" rx="12" fill="#3a4a66"/>
        <rect x="314" y="352" width="46" height="26" rx="12" fill="#3a4a66"/>`),
    },
    'sprite-unit-car': {
      width: 240,
      height: 240,
      svg: svgWrap(240, 240, `<ellipse cx="120" cy="208" rx="74" ry="12" fill="#0d1220" opacity="0.3"/>
        <path d="M42,140 Q46,96 84,88 L156,88 Q196,96 198,140 L198,164 Q198,176 186,176 L54,176 Q42,176 42,164 Z"
          fill="#67c7f5" stroke="#3f9ccf" stroke-width="5"/>
        <path d="M84,104 L120,100 L120,132 L74,132 Z" fill="#dff2ff"/>
        <path d="M128,100 L158,104 L168,132 L128,132 Z" fill="#dff2ff"/>
        <circle cx="82" cy="178" r="17" fill="#26314a"/>
        <circle cx="158" cy="178" r="17" fill="#26314a"/>`),
    },
    'overlay-lane-lines': {
      width: W,
      height: H,
      svg: svgWrap(W, H, `
        ${dashedLine(0, 620, W, 620, '#ffffff', 16, '90 70')}
        ${dashedLine(0, 730, W, 730, '#ffffff', 10, '70 70')}
        ${dashedLine(0, 820, W, 820, '#ffffff', 8, '60 80')}`),
    },
    'overlay-route-network': {
      width: W,
      height: H,
      svg: svgWrap(W, H, `${nodeNetwork(
        [
          [220, 220], [560, 160], [920, 210], [1300, 260], [380, 430], [780, 400], [1180, 460], [560, 640], [960, 660],
        ],
        [
          [0, 1], [1, 2], [2, 3], [0, 4], [1, 4], [1, 5], [2, 5], [2, 6], [3, 6], [4, 7], [5, 7], [5, 8], [6, 8], [7, 8],
        ],
        '#9db8ff',
        '#e6efff',
      )}`),
    },
    'overlay-glow-veil': {
      width: W,
      height: H,
      svg: svgWrap(W, H, `<defs>
        <radialGradient id="veil" cx="0.5" cy="0.45" r="0.55">
          <stop offset="0" stop-color="#ffd88a" stop-opacity="0.4"/>
          <stop offset="0.6" stop-color="#ffd88a" stop-opacity="0.14"/>
          <stop offset="1" stop-color="#ffd88a" stop-opacity="0"/>
        </radialGradient></defs>
        <rect width="${W}" height="${H}" fill="url(#veil)"/>`),
    },
    'overlay-terminal-frame': {
      width: W,
      height: H,
      svg: svgWrap(W, H, `${bracketFrame('#ffd88a')}
        <rect x="70" y="70" width="${W - 140}" height="${H - 140}" fill="none" stroke="#ffd88a" stroke-width="2" opacity="0.35"/>`),
    },
  },
  'seedling-fixture': {
    'bg-s-seed': {
      width: W,
      height: H,
      svg: svgWrap(W, H, `<defs>${skyGradient('soil', '#d9bd93', '#b3895c')}</defs>
        <rect width="${W}" height="${H}" fill="url(#soil)"/>
        <g fill="#a17a4e" opacity="0.7">
          <circle cx="260" cy="240" r="26"/><circle cx="520" cy="420" r="18"/><circle cx="880" cy="200" r="30"/>
          <circle cx="1180" cy="480" r="22"/><circle cx="1420" cy="260" r="16"/><circle cx="360" cy="680" r="24"/>
          <circle cx="760" cy="760" r="20"/><circle cx="1240" cy="700" r="26"/>
        </g>
        <ellipse cx="800" cy="450" rx="240" ry="90" fill="#c9a374" opacity="0.8"/>
        <ellipse cx="800" cy="450" rx="150" ry="55" fill="#e0c49b"/>`),
    },
    'bg-s-sprout': {
      width: W,
      height: H,
      svg: svgWrap(W, H, `<defs>${skyGradient('morning', '#e2f4cf', '#a9d894')}</defs>
        <rect width="${W}" height="${H}" fill="url(#morning)"/>
        <g opacity="0.5" stroke="#f7f3c8" stroke-width="26" stroke-linecap="round">
          <line x1="420" y1="-40" x2="620" y2="620"/>
          <line x1="800" y1="-40" x2="880" y2="660"/>
          <line x1="1180" y1="-40" x2="1060" y2="640"/>
        </g>
        <rect x="0" y="660" width="${W}" height="${H - 660}" fill="#8ec97a"/>
        <rect x="0" y="660" width="${W}" height="10" fill="#a4d68e"/>`),
    },
    'bg-s-tree': {
      width: W,
      height: H,
      svg: svgWrap(W, H, `<defs>${skyGradient('sky', '#cde9ff', '#eef8ff')}</defs>
        <rect width="${W}" height="${H}" fill="url(#sky)"/>
        ${cloud(420, 150, 1.0)}${cloud(1180, 110, 0.8, '#ffffff', '0.8')}
        <circle cx="1300" cy="140" r="60" fill="#ffe9a8"/>
        <rect x="0" y="620" width="${W}" height="${H - 620}" fill="#9ed07a"/>
        <path d="M0,620 Q400,590 800,620 T1600,610 L1600,640 L0,640 Z" fill="#8bc46a"/>`),
    },
    'bg-s-forest': {
      width: W,
      height: H,
      svg: svgWrap(W, H, `<defs>${skyGradient('forest', '#39684a', '#17351f')}</defs>
        <rect width="${W}" height="${H}" fill="url(#forest)"/>
        <g fill="#27492f">
          ${Array.from({ length: 9 }, (_, i) => {
            const x = 60 + i * 180
            return `<polygon points="${x},560 ${x + 70},420 ${x + 140},560"/><rect x="${x + 55}" y="560" width="30" height="60"/>`
          }).join('')}
        </g>
        <g fill="#1d3a25">
          ${Array.from({ length: 7 }, (_, i) => {
            const x = 140 + i * 220
            return `<polygon points="${x},700 ${x + 90},520 ${x + 180},700"/><rect x="${x + 70}" y="700" width="40" height="80"/>`
          }).join('')}
        </g>
        <rect x="0" y="600" width="${W}" height="46" fill="#cfe3d2" opacity="0.18"/>
        <rect x="0" y="780" width="${W}" height="${H - 780}" fill="#16301d"/>`),
    },
    'sprite-subject-seed': {
      width: 320,
      height: 320,
      svg: svgWrap(320, 320, `<ellipse cx="160" cy="220" rx="80" ry="16" fill="#3a2c1a" opacity="0.3"/>
        <path d="M100,200 Q100,110 160,96 Q220,110 220,200 Q220,250 160,256 Q100,250 100,200 Z"
          fill="#a9713f" stroke="#82552c" stroke-width="6"/>
        <path d="M126,160 Q132,124 158,114" stroke="#d9a877" stroke-width="10" fill="none" stroke-linecap="round"/>
        <circle cx="150" cy="196" r="7" fill="#3a2c1a"/>
        <circle cx="184" cy="204" r="7" fill="#3a2c1a"/>
        <path d="M156,226 Q168,236 182,226" stroke="#3a2c1a" stroke-width="5" fill="none" stroke-linecap="round"/>`),
    },
    'sprite-subject-sprout': {
      width: 320,
      height: 320,
      svg: svgWrap(320, 320, `<ellipse cx="160" cy="290" rx="84" ry="14" fill="#3a2c1a" opacity="0.3"/>
        <path d="M160,286 Q156,210 160,160" stroke="#5f9e4a" stroke-width="14" fill="none" stroke-linecap="round"/>
        <path d="M158,170 Q110,150 96,108 Q150,112 160,160 Z" fill="#79c263" stroke="#559a45" stroke-width="5"/>
        <path d="M164,160 Q214,140 232,100 Q176,104 164,152 Z" fill="#8fd276" stroke="#5da84c" stroke-width="5"/>
        <circle cx="160" cy="216" r="6" fill="#2f4f2a"/>
        <circle cx="184" cy="228" r="6" fill="#2f4f2a"/>
        <path d="M150,244 Q166,254 182,244" stroke="#2f4f2a" stroke-width="5" fill="none" stroke-linecap="round"/>`),
    },
    'sprite-subject-tree': {
      width: 320,
      height: 320,
      svg: svgWrap(320, 320, `<ellipse cx="160" cy="296" rx="88" ry="14" fill="#3a2c1a" opacity="0.3"/>
        <rect x="142" y="170" width="36" height="118" rx="10" fill="#8a5a34"/>
        <circle cx="160" cy="120" r="72" fill="#5cae54" stroke="#417f3c" stroke-width="6"/>
        <circle cx="118" cy="150" r="30" fill="#79c263"/>
        <circle cx="204" cy="146" r="26" fill="#6dbb5c"/>
        <circle cx="146" cy="112" r="6" fill="#2f4f2a"/>
        <circle cx="178" cy="118" r="6" fill="#2f4f2a"/>
        <path d="M150,138 Q162,148 176,138" stroke="#2f4f2a" stroke-width="5" fill="none" stroke-linecap="round"/>`),
    },
    'sprite-unit-tree': {
      width: 240,
      height: 240,
      svg: svgWrap(240, 240, `<rect x="110" y="140" width="20" height="60" fill="#7a4e2c"/>
        <circle cx="120" cy="104" r="56" fill="#4c9a4c"/>
        <circle cx="96" cy="126" r="26" fill="#5cae54"/>
        <circle cx="148" cy="122" r="22" fill="#5cae54"/>`),
    },
    'overlay-root-network': {
      width: W,
      height: H,
      svg: svgWrap(W, H, `<g stroke="#d9c08a" fill="none" stroke-linecap="round">
        <path d="M800,300 L620,430 L480,560 L360,700" stroke-width="10" opacity="0.22"/>
        <path d="M800,300 L620,430 L480,560 L360,700" stroke-width="4"/>
        <path d="M800,300 L980,440 L1140,580 L1260,720" stroke-width="10" opacity="0.22"/>
        <path d="M800,300 L980,440 L1140,580 L1260,720" stroke-width="4"/>
        <path d="M620,430 L560,600 L520,760" stroke-width="8" opacity="0.25"/>
        <path d="M620,430 L560,600 L520,760" stroke-width="3"/>
        <path d="M980,440 L1060,620 L1100,780" stroke-width="8" opacity="0.25"/>
        <path d="M980,440 L1060,620 L1100,780" stroke-width="3"/>
      </g>
      <g fill="#e8d5a8">
        <circle cx="800" cy="300" r="8"/><circle cx="620" cy="430" r="7"/><circle cx="980" cy="440" r="7"/>
        <circle cx="480" cy="560" r="6"/><circle cx="1140" cy="580" r="6"/><circle cx="360" cy="700" r="6"/>
        <circle cx="1260" cy="720" r="6"/><circle cx="520" cy="760" r="5"/><circle cx="1100" cy="780" r="5"/>
      </g>`),
    },
  },
}

// Pack-owned subject sprites used by the frozen road-test scene and the
// subject-swap keepsake seam. The protection vehicle is composited into the
// subject art so each declared level state stays visually explicit.
const fleetRecipes = RECIPES['autonomous-fleet']
const protectionBadge = `<g transform="translate(318 292) scale(.56)">
  <path d="M36,142 Q42,100 80,90 H160 Q198,100 204,142 V170 H36 Z" fill="#f59e42" stroke="#b85f18" stroke-width="7"/>
  <rect x="102" y="72" width="36" height="17" rx="8" fill="#ffd84d" stroke="#a75b15" stroke-width="4"/>
  <path d="M120,60 V44 M94,67 L82,52 M146,67 L159,52" stroke="#ffd84d" stroke-width="8" stroke-linecap="round"/>
  <circle cx="76" cy="176" r="18" fill="#26314a"/><circle cx="164" cy="176" r="18" fill="#26314a"/>
</g>`
function withProtectionVehicle(recipe) {
  return { ...recipe, svg: recipe.svg.replace('</svg>', `${protectionBadge}</svg>`) }
}
fleetRecipes['sprite-subject-pod--l1'] = withProtectionVehicle(fleetRecipes['sprite-cabin-driver'])
fleetRecipes['sprite-subject-pod--l2'] = fleetRecipes['sprite-cabin-driver']
fleetRecipes['sprite-subject-pod--l3'] = withProtectionVehicle(fleetRecipes['sprite-cabin-safety'])
fleetRecipes['sprite-subject-pod--l4'] = fleetRecipes['sprite-cabin-safety']

// ---------------------------------------------------------------------------
// Master-image-driven subject sprites. L1–L5 (GOAL 陪伴 R1 · 12 级方案):
// the committed L1–L6 family master is cut at measured group boundaries and
// deterministically post-processed (fragment cleanup); no image model runs at
// build time. L6–L12 (GOAL 进化 · V3 DEC-PET-032; provenance in
// assets/masters/PROVENANCE-l6-l12-evolution.json): each level derives from
// its own committed scale-evolution master (supervision-count label, remote
// operator, and scale outline already composed in the approved art), so no
// fragment cleanup or escort restoration applies there.
// ---------------------------------------------------------------------------
const MASTER_SPRITE_STEMS = Array.from({ length: 12 }, (_, i) => `sprite-subject-pod--l${i + 1}`)

function evolutionMasterPath(levelIndex) {
  // Goal 换图 correction (2026-09-08): every level derives from the Owner's
  // per-level master (pony-v1-scale-v2 material for L1-L5, the accepted
  // L6-L12 scale-evolution masters) — no family-cut path.
  return path.join(PACKS_DIR, 'autonomous-fleet/assets/masters', `master-l${levelIndex + 1}.png`)
}

async function renderMasterSprite(levelIndex) {
  const cell = await sharp(evolutionMasterPath(levelIndex)).png().toBuffer()
  const MARGIN = 14
  const inner = 480 - MARGIN * 2
  const m = await sharp(cell).metadata()
  const scale = Math.min(inner / m.width, inner / m.height)
  const w = Math.round(m.width * scale), h = Math.round(m.height * scale)
  const resized = await sharp(cell).resize(w, h).png().toBuffer()
  const png = await sharp({ create: { width: 480, height: 480, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: resized, left: Math.round((480 - w) / 2), top: 480 - MARGIN - h }])
    .png({ compressionLevel: 9 })
    .toBuffer()
  const webp = await sharp(png).webp({ lossless: true }).toBuffer()
  return { png, webp, width: 480, height: 480 }
}

// ---------------------------------------------------------------------------
// Rendering and sync
// ---------------------------------------------------------------------------

async function renderAsset(stem, packId) {
  if (packId === 'autonomous-fleet') {
    const levelIndex = MASTER_SPRITE_STEMS.indexOf(stem)
    if (levelIndex >= 0) return renderMasterSprite(levelIndex)
  }
  const recipe = RECIPES[packId]?.[stem]
  if (recipe === undefined) {
    throw new Error(`no recipe for pack ${packId} asset stem ${stem}`)
  }
  const png = await sharp(Buffer.from(recipe.svg)).png({ compressionLevel: 9 }).toBuffer()
  const webp = await sharp(png).webp({ lossless: true }).toBuffer()
  return { png, webp, width: recipe.width, height: recipe.height }
}

async function listPackDirs() {
  const entries = await readdir(PACKS_DIR, { withFileTypes: true })
  return entries.filter((e) => e.isDirectory() && existsSync(path.join(PACKS_DIR, e.name, 'manifest.json'))).map((e) => e.name)
}

async function run() {
  const checkMode = process.argv.includes('--check')
  const packDirs = await listPackDirs()
  let failures = 0

  for (const dirName of packDirs) {
    const packDir = path.join(PACKS_DIR, dirName)
    const manifestPath = path.join(packDir, 'manifest.json')
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    const packId = manifest.packId
    const rendered = new Map()

    for (const asset of manifest.assets) {
      const stem = path.basename(asset.path).replace(/\.(webp|png)$/, '')
      const buffers = await renderAsset(stem, packId)
      rendered.set(asset.path, buffers)
      if (buffers.width !== asset.width || buffers.height !== asset.height) {
        console.error(`DIMENSION MISMATCH ${packId} ${asset.assetId}: manifest ${asset.width}x${asset.height}, rendered ${buffers.width}x${buffers.height}`)
        failures++
      }
    }

    // WebP/PNG twins must always exist in pairs.
    const paths = new Set(manifest.assets.map((a) => a.path))
    for (const asset of manifest.assets) {
      if (asset.format === 'webp') {
        const twin = asset.path.replace(/\.webp$/, '.png')
        if (!paths.has(twin)) {
          console.error(`MISSING PNG TWIN for ${asset.path}`)
          failures++
        }
      }
    }

    if (checkMode) {
      for (const [assetPath, buffers] of rendered) {
        const target = path.join(packDir, assetPath)
        if (!existsSync(target)) {
          console.error(`MISSING FILE ${assetPath}`)
          failures++
          continue
        }
        const onDisk = await readFile(target)
        const expected = assetPath.endsWith('.webp') ? buffers.webp : buffers.png
        if (!onDisk.equals(expected)) {
          const meta = await sharp(onDisk).metadata()
          const renderedSharp = await sharp(expected).metadata()
          const pixelsEqual =
            meta.width === renderedSharp.width &&
            meta.height === renderedSharp.height &&
            (await sharp(onDisk).raw().toBuffer()).equals(await sharp(expected).raw().toBuffer())
          if (!pixelsEqual) {
            console.error(`BYTE/PIXEL MISMATCH ${assetPath}`)
            failures++
          }
        }
      }
      // Manifest metadata must match rendered bytes.
      for (const asset of manifest.assets) {
        const buffers = rendered.get(asset.path)
        const expected = asset.path.endsWith('.webp') ? buffers.webp : buffers.png
        if (asset.byteSizeCompressed !== expected.length) {
          console.error(`SIZE MISMATCH ${asset.path}: manifest ${asset.byteSizeCompressed}, actual ${expected.length}`)
          failures++
        }
      }
      console.log(`checked ${manifest.assets.length} assets for pack ${packId}`)
      continue
    }

    // Sync mode: write files and manifest metadata.
    for (const [assetPath, buffers] of rendered) {
      const target = path.join(packDir, assetPath)
      await mkdir(path.dirname(target), { recursive: true })
      await writeFile(target, assetPath.endsWith('.webp') ? buffers.webp : buffers.png)
    }
    for (const asset of manifest.assets) {
      const buffers = rendered.get(asset.path)
      asset.byteSizeCompressed = (asset.path.endsWith('.webp') ? buffers.webp : buffers.png).length
      asset.width = buffers.width
      asset.height = buffers.height
    }
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
    console.log(`generated ${manifest.assets.length} assets for pack ${packId}`)
  }

  if (failures > 0) {
    console.error(`ASSETS_CHECK_FAILED (${failures} failures)`)
    process.exit(1)
  }
  console.log('ASSETS_CHECK_PASS')
}

async function main() {
  const tmp = await mkdtemp(path.join(tmpdir(), 'vehicle-pet-assets-'))
  try {
    await run()
  } finally {
    await rm(tmp, { recursive: true, force: true })
  }
}

await main()
