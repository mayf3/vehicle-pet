import sharp from 'sharp'
// Surroundedness-based letter fill: fills text-colored pixels whose 8-ray
// neighborhood is mostly light within R pixels. Letters on doors qualify;
// car outlines (light on one side), eye interiors, and wheels do not.
async function processMaster(name) {
  const src = `src/packs/autonomous-fleet/assets/masters/${name}`
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h, channels: ch } = info
  const idx = (x, y) => (y * w + x) * ch
  const R = 4
  const isText = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false
    const i = idx(x, y)
    return data[i + 3] > 150 && data[i] < 100 && data[i + 1] < 120 && data[i + 2] < 158 && data[i + 2] > 15
  }
  const isLight = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false
    const i = idx(x, y)
    return data[i + 3] < 60 || (data[i] > 195 && data[i + 1] > 200 && data[i + 2] > 210)
  }
  const mask = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!isText(x, y)) continue
    let hits = 0
    for (let d = 0; d < 8; d++) {
      const dx = Math.round(Math.cos(d * Math.PI / 4) * R)
      const dy = Math.round(Math.sin(d * Math.PI / 4) * R)
      if (isLight(x + dx, y + dy)) hits++
    }
    if (hits >= 5) mask[y * w + x] = 1
  }
  let count = 0
  for (let i = 0; i < mask.length; i++) if (mask[i]) count++
  // dilate 1
  const dilated = new Uint8Array(mask)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (mask[y * w + x]) continue
    for (let dy = -1; dy <= 1 && !dilated[y * w + x]; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && mask[ny * w + nx]) { dilated[y * w + x] = 1; break }
    }
  }
  // row interpolation across masked runs
  for (let y = 0; y < h; y++) {
    let x = 0
    while (x < w) {
      if (!dilated[y * w + x]) { x++; continue }
      let end = x
      while (end < w && dilated[y * w + end]) end++
      const li = idx(Math.max(0, x - 1), y), ri = idx(Math.min(w - 1, end), y)
      for (let cx = x; cx < end; cx++) {
        const t = (cx - (x - 1)) / (end - (x - 1) + 1)
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
    .png({ compressionLevel: 9 }).toFile(src.replace('.png', '.debranded.png'))
  console.log(name, 'letter pixels filled:', count)
}
await processMaster('master-l8.png')
await processMaster('master-l9.png')
