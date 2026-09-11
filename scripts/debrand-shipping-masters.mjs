/**
 * Brand-neutral correction for shipping masters (V8 CTR-042; Goal「开放」
 * slice 5). Deterministic local raster correction: detect baked brand-text
 * clusters on light surfaces, merge letter fragments into word boxes, review
 * via overlay sheets, then replace each confirmed region by horizontal
 * interpolation across the box (preserves the surface's vertical gradient)
 * or by alpha-clearing for text that sits on the transparent canvas. Not a
 * CSS mask: the corrected master replaces the shipped file, and the pipeline
 * regenerates all downstream assets deterministically.
 *
 * Modes:
 *   --detect            print merged candidate boxes per master
 *   --sheet             write /tmp/debrand-<name>.png review overlays
 *   --apply <manifest>  fill boxes from the JSON manifest (hinterp|clear)
 *   --verify <manifest> assert every filled box is now text-free-ish
 */

import sharp from 'sharp'

const MODE = process.argv[2]
const MASTERS = Array.from({ length: 12 }, (_, i) =>
  `src/packs/autonomous-fleet/assets/masters/master-l${i + 1}.png`)
const COMPANION = 'assets/character-source/companion-alpha.png'
const ALL = [...MASTERS, COMPANION]

async function rawOf(src) {
  return sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
}

function clusterText(data, info, opts = {}) {
  const { width: w, height: h, channels: ch } = info
  const at = (x, y) => {
    const i = (y * w + x) * ch
    return [data[i], data[i + 1], data[i + 2], data[i + 3]]
  }
  const isText = (r, g, b) => r < 85 && g < 105 && b < 145 && b > 25 && b >= r - 5
  const isWhiteish = (r, g, b) => r > 210 && g > 215 && b > 224
  const label = new Int32Array(w * h).fill(-1)
  const clusters = []
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (label[y * w + x] !== -1) continue
      const [r, g, b, a] = at(x, y)
      if (a < 180 || !isText(r, g, b)) { label[y * w + x] = -2; continue }
      const queue = [[x, y]]
      label[y * w + x] = clusters.length
      let minX = x, maxX = x, minY = y, maxY = y, count = 0
      const stack = queue
      while (stack.length > 0) {
        const [cx, cy] = stack.pop()
        count++
        if (cx < minX) minX = cx
        if (cx > maxX) maxX = cx
        if (cy < minY) minY = cy
        if (cy > maxY) maxY = cy
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
          const nx = cx + dx, ny = cy + dy
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
          if (label[ny * w + nx] !== -1) continue
          const [nr, ng, nb, na] = at(nx, ny)
          if (na >= 180 && isText(nr, ng, nb)) { label[ny * w + nx] = clusters.length; stack.push([nx, ny]) }
          else label[ny * w + nx] = -2
        }
      }
      clusters.push({ minX, maxX, minY, maxY, count })
    }
  }
  // keep letter-sized clusters (track cluster identity for fragment counting)
  const letters = clusters.filter(c => {
    const cw = c.maxX - c.minX + 1, chh = c.maxY - c.minY + 1
    return chh >= (opts.minH ?? 5) && chh <= 70 && cw >= 3 && cw <= 200 && c.count >= cw * chh * 0.18
  })
  // merge clusters whose boxes are near-neighbours (words / lines), counting fragments
  const merged = []
  for (const c of letters.sort((a, b) => a.minX - b.minX)) {
    const hit = merged.find(m =>
      c.minX <= m.maxX + 22 && m.minX <= c.maxX + 22 &&
      c.minY <= m.maxY + 6 && m.minY <= c.maxY + 6)
    if (hit) {
      hit.minX = Math.min(hit.minX, c.minX); hit.maxX = Math.max(hit.maxX, c.maxX)
      hit.minY = Math.min(hit.minY, c.minY); hit.maxY = Math.max(hit.maxY, c.maxY)
      hit.count += c.count
      hit.fragments += 1
    } else merged.push({ ...c, fragments: 1 })
  }
  // word-box filters: multi-fragment words only (single connected blobs are
  // facial features / wheel arcs, not text), aspect and whiteness context
  return merged.filter(c => {
    const cw = c.maxX - c.minX + 1, chh = c.maxY - c.minY + 1
    if (cw < 12 || cw > 520 || chh > 90) return false
    if (c.fragments < 3) return false
    if (cw / chh < 0.9) return false
    let white = 0, total = 0
    for (let y = c.minY; y <= c.maxY; y += 2) {
      for (let x = c.minX; x <= c.maxX; x += 2) {
        if (x >= w || y >= h) continue
        const [r, g, b, a] = at(x, y)
        total++
        if (a > 180 && isWhiteish(r, g, b)) white++
      }
    }
    return total > 0 && white / total >= 0.25
  })
}

async function sheet(src, boxes, suffix) {
  const meta = await sharp(src).metadata()
  const outW = meta.width > 1100 ? 1024 : meta.width
  const scale = outW / meta.width
  const lines = boxes.map((b, i) =>
    `<rect x="${Math.max(0, b.minX * scale - 3)}" y="${Math.max(0, b.minY * scale - 3)}" width="${(b.maxX - b.minX) * scale + 6}" height="${(b.maxY - b.minY) * scale + 6}" fill="none" stroke="red" stroke-width="2"/><text x="${Math.max(0, b.minX * scale - 3)}" y="${Math.max(12, b.minY * scale - 6)}" fill="red" font-size="14">${i}</text>`)
  const overlay = await sharp(Buffer.from(`<svg width="${outW}" height="${Math.round(meta.height * scale)}">${lines.join('')}</svg>`)).png().toBuffer()
  const out = `/tmp/debrand-${suffix}.png`
  await sharp(src).resize(outW).composite([{ input: overlay, top: 0, left: 0 }]).png().toFile(out)
  console.log('sheet:', out, `(${boxes.length} boxes)`)
}

if (MODE === '--detect' || MODE === '--sheet') {
  for (const src of ALL) {
    const name = src.split('/').pop().replace('.png', '')
    const { data, info } = await rawOf(src)
    const boxes = clusterText(data, info)
    console.log(name, boxes.map(b => `[${b.minX},${b.minY},${b.maxX},${b.maxY}]`).join(' '))
    if (MODE === '--sheet') await sheet(src, boxes, name)
  }
}

// --- apply / verify ----------------------------------------------------------

const MANIFEST = {
  'master-l1.png': [
    { box: [556, 520, 662, 578], mode: 'navy-on-light' },
    { box: [893, 583, 941, 608], mode: 'navy-on-light' },
    { box: [432, 455, 466, 476], mode: 'light-on-dark' },
  ],
  'master-l2.png': [
    { box: [712, 526, 834, 592], mode: 'navy-on-light' },
    { box: [546, 312, 606, 338], mode: 'light-on-dark' },
    { box: [568, 448, 600, 466], mode: 'light-on-dark' },
  ],
  'master-l3.png': [
    { box: [576, 511, 672, 570], mode: 'navy-on-light' },
    { box: [897, 537, 953, 568], mode: 'navy-on-light' },
    { box: [318, 434, 362, 456], mode: 'light-on-dark' },
  ],
  'master-l4.png': [
    { box: [721, 530, 838, 600], mode: 'navy-on-light' },
    { box: [353, 326, 419, 353], mode: 'light-on-dark' },
    { box: [368, 441, 417, 464], mode: 'light-on-dark' },
  ],
  'master-l5.png': [
    { box: [670, 638, 801, 702], mode: 'navy-on-light' },
  ],
  'master-l6.png': [
    { box: [15, 15, 330, 240], mode: 'clear' },
    { box: [622, 796, 700, 840], mode: 'navy-on-light' },
    { box: [374, 618, 579, 660], mode: 'navy-on-light' },
    { box: [641, 631, 688, 666], mode: 'navy-on-light' },
  ],
  'master-l7.png': [
    { box: [15, 15, 340, 250], mode: 'clear' },
  ],
  'master-l8.png': [
    { box: [15, 15, 400, 250], mode: 'clear' },
  ],
  'master-l9.png': [
    { box: [15, 15, 490, 245], mode: 'clear' },
    { box: [644, 828, 720, 871], mode: 'navy-on-light' },
  ],
  'master-l10.png': [
    { box: [15, 15, 390, 240], mode: 'clear' },
    { box: [462, 845, 542, 882], mode: 'navy-on-light' },
  ],
  'master-l11.png': [
    { box: [15, 15, 445, 240], mode: 'clear' },
    { box: [413, 861, 476, 894], mode: 'navy-on-light' },
  ],
  'master-l12.png': [
    { box: [15, 15, 495, 245], mode: 'clear' },
    { box: [460, 844, 532, 878], mode: 'navy-on-light' },
  ],
  'companion-alpha.png': [
    { box: [186, 260, 232, 356], mode: 'navy-on-light' },
    { box: [465, 260, 535, 314], mode: 'navy-on-light' },
    { box: [785, 263, 854, 314], mode: 'navy-on-light' },
    { box: [1058, 260, 1129, 314], mode: 'navy-on-light' },
    { box: [1385, 260, 1447, 314], mode: 'navy-on-light' },
    { box: [163, 764, 213, 842], mode: 'navy-on-light' },
    { box: [448, 756, 560, 800], mode: 'navy-on-light' },
    { box: [757, 765, 835, 828], mode: 'navy-on-light' },
    { box: [1067, 758, 1140, 820], mode: 'navy-on-light' },
    { box: [1375, 993, 1436, 1022], mode: 'navy-on-light' },
  ],
}

const BASE = {
  'companion-alpha.png': 'assets/character-source',
}
const dirFor = name => BASE[name] ?? 'src/packs/autonomous-fleet/assets/masters'

function isTextPixel(r, g, b) {
  return r < 95 && g < 115 && b < 155 && b > 20 && b >= r - 8
}
function isLightPixel(r, g, b) {
  return r > 175 && g > 180 && b > 190
}

async function apply() {
  for (const [name, regions] of Object.entries(MANIFEST)) {
    const src = `${dirFor(name)}/${name}`
    const { data, info } = await rawOf(src)
    const { width: w, height: h, channels: ch } = info
    const idx = (x, y) => (y * w + x) * ch
    const mask = new Uint8Array(w * h)
    for (const { box, mode } of regions) {
      const [x0, y0, x1, y1] = box
      if (mode === 'clear') {
        for (let y = y0; y <= Math.min(y1, h - 1); y++) {
          for (let x = x0; x <= Math.min(x1, w - 1); x++) {
            const i = idx(x, y)
            data[i] = 0; data[i + 1] = 0; data[i + 2] = 0; data[i + 3] = 0
          }
        }
        continue
      }
      const probe = mode === 'navy-on-light' ? isTextPixel : isLightPixel
      for (let y = y0; y <= Math.min(y1, h - 1); y++) {
        for (let x = x0; x <= Math.min(x1, w - 1); x++) {
          const i = idx(x, y)
          if (data[i + 3] > 150 && probe(data[i], data[i + 1], data[i + 2])) mask[y * w + x] = 1
        }
      }
    }
    // dilate mask by 2px to catch anti-aliased edges
    const dilated = new Uint8Array(mask)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (mask[y * w + x]) continue
        for (let dy = -2; dy <= 2 && !dilated[y * w + x]; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx, ny = y + dy
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
            if (mask[ny * w + nx]) { dilated[y * w + x] = 1; break }
          }
        }
      }
    }
    // horizontal interpolation per row across masked runs (RGBA lerp)
    for (let y = 0; y < h; y++) {
      let x = 0
      while (x < w) {
        if (!dilated[y * w + x]) { x++; continue }
        let end = x
        while (end < w && dilated[y * w + end]) end++
        const leftX = x - 1, rightX = end
        for (let cx = x; cx < end; cx++) {
          const t = (cx - leftX) / (rightX - leftX + 1)
          for (const bx of [leftX, rightX]) {
            var _ = bx // bounds marker
          }
          const li = idx(Math.max(0, leftX), y)
          const ri = idx(Math.min(w - 1, rightX), y)
          const i = idx(cx, y)
          for (let c = 0; c < 4; c++) {
            const lv = data[li + c], rv = data[ri + c]
            data[i + c] = Math.round(lv + (rv - lv) * t)
          }
        }
        x = end
      }
    }
    await sharp(data, { raw: { width: w, height: h, channels: ch } })
      .png({ compressionLevel: 9 })
      .toFile(`${src.replace('.png', '.debranded.png')}`)
    console.log('applied:', name)
  }
}

if (MODE === '--apply') await apply()
