import { describe, expect, it } from 'vitest'
import { validatePack } from '../../src/engine/validation/validate-pack'
import { fleetBundle, fixturePackBundle, fleetManifest } from '../helpers/fixtures'

const validFixture = () => JSON.parse(JSON.stringify(fixturePackBundle().manifestCandidate))

describe('PetPackManifestV1 strict validation (CTR-PET-003, CTR-PET-004)', () => {
  it('accepts the bundled fleet pack through the shared validator', () => {
    const result = validatePack(fleetBundle().manifestCandidate, { requireBundledKeepsakes: true })
    expect(result.ok, result.ok ? '' : result.errors.join('; ')).toBe(true)
  })

  it('accepts a second-domain fixture pack through the same validator', () => {
    const result = validatePack(validFixture(), { requireBundledKeepsakes: true })
    expect(result.ok, result.ok ? '' : result.errors.join('; ')).toBe(true)
  })

  it('rejects unknown fields at every nesting level', () => {
    const mutations: Array<[string, (m: Record<string, any>) => void]> = [
      ['root', (m) => { m.extraField = 1 }],
      ['level', (m) => { m.levels[0].extra = 1 }],
      ['stagePresentation', (m) => { m.levels[0].presentation.extra = 1 }],
      ['scene', (m) => { m.scenes[0].extra = 1 }],
      ['layer', (m) => { m.scenes[0].layers[0].extra = 1 }],
      ['population', (m) => { m.scenes[0].layers[0].population.extra = 1 }],
      ['asset', (m) => { m.assets[0].extra = 1 }],
      ['keepsake', (m) => { m.keepsakes[0].extra = 1 }],
      ['localizedText', (m) => { m.levels[0].stageName.extra = 1 }],
      ['displayConversion', (m) => { m.displayConversion = { unitLabel: { 'zh-CN': 'x' }, pointsPerUnit: 1, extra: 1 } }],
    ]
    for (const [name, mutate] of mutations) {
      const candidate = validFixture()
      candidate.displayConversion = { unitLabel: { 'zh-CN': '单位' }, pointsPerUnit: 10 }
      mutate(candidate)
      const result = validatePack(candidate)
      expect(result.ok, `${name} should be rejected`).toBe(false)
    }
  })

  it('rejects malformed ids, versions, and duplicate ids', () => {
    for (const mutate of [
      (m: any) => { m.packId = 'BadId' },
      (m: any) => { m.packVersion = '1.0' },
      (m: any) => { m.packVersion = '1.0.0-beta' },
      (m: any) => { m.levels[1].levelId = m.levels[0].levelId },
      (m: any) => { m.scenes[0].layers[0].population.populationId = 'BAD' },
    ]) {
      const candidate = validFixture()
      mutate(candidate)
      expect(validatePack(candidate).ok).toBe(false)
    }
  })

  it('rejects threshold violations: non-zero first, non-increasing', () => {
    const nonZero = validFixture()
    nonZero.levels[0].threshold = 10
    expect(validatePack(nonZero).ok).toBe(false)

    const decreasing = validFixture()
    decreasing.levels[1].threshold = 0
    expect(validatePack(decreasing).ok).toBe(false)
  })

  it('rejects broken cross-references and keepsake binding violations', () => {
    const unknownScene = validFixture()
    unknownScene.levels[0].sceneId = 'no-such-scene'
    expect(validatePack(unknownScene).ok).toBe(false)

    const missingKeepsake = validFixture()
    missingKeepsake.levels[1].keepsakeId = 'ks-missing'
    expect(validatePack(missingKeepsake).ok).toBe(false)

    const bundledCount = validFixture()
    delete bundledCount.keepsakes
    expect(validatePack(bundledCount, { requireBundledKeepsakes: true }).ok).toBe(false)

    const initialKeepsake = validFixture()
    initialKeepsake.keepsakes[0].levelId = initialKeepsake.levels[0].levelId
    expect(validatePack(initialKeepsake).ok).toBe(false)
  })

  it('rejects localized text missing zh-CN', () => {
    const candidate = validFixture()
    delete candidate.levels[0].stageName['zh-CN']
    const result = validatePack(candidate)
    expect(result.ok).toBe(false)
  })

  it('accepts en-missing keys and resolves them deterministically via fallback', () => {
    const candidate = validFixture()
    delete candidate.levels[0].stageName.en
    expect(validatePack(candidate).ok).toBe(true)
  })

  it('rejects asset path escapes: URL, absolute, traversal, query, hash', () => {
    for (const badPath of [
      'https://example.invalid/a.png',
      '/etc/passwd.png',
      'assets/../escape.webp',
      'assets/g/a.webp?x=1',
      'assets/g/a.webp#frag',
      'assets/g/a.svg',
      'Assets/G/a.webp',
    ]) {
      const candidate = validFixture()
      candidate.assets[0].path = badPath
      candidate.assets[0].format = badPath.endsWith('.png') ? 'png' : 'webp'
      const result = validatePack(candidate)
      expect(result.ok, `path ${badPath}`).toBe(false)
    }
  })

  it('rejects format/extension mismatch and missing files', () => {
    const mismatch = validFixture()
    mismatch.assets[0].format = 'png'
    expect(validatePack(mismatch).ok).toBe(false)

    const missing = validFixture()
    const result = validatePack(missing, { resolveAssetUrl: () => undefined })
    expect(result.ok).toBe(false)
  })

  it('rejects dimension and byte budget violations', () => {
    const wideBackground = validFixture()
    wideBackground.assets[0].width = 3000
    expect(validatePack(wideBackground).ok).toBe(false)

    const tallOverlay = validFixture()
    tallOverlay.assets[0].role = 'overlay'
    tallOverlay.assets[0].height = 3000
    expect(validatePack(tallOverlay).ok).toBe(false)

    const bigFile = validFixture()
    bigFile.assets[0].byteSizeCompressed = 2_097_153
    expect(validatePack(bigFile).ok).toBe(false)

    const overBudget = validFixture()
    for (const asset of overBudget.assets) asset.byteSizeCompressed = 2_097_152
    // Push the total past 16,777,216 bytes with additional (unreferenced) assets.
    overBudget.assets.push(
      { ...overBudget.assets[0], assetId: 'budget-extra-1' },
      { ...overBudget.assets[0], assetId: 'budget-extra-2' },
      { ...overBudget.assets[0], assetId: 'budget-extra-3' },
      { ...overBudget.assets[0], assetId: 'budget-extra-4' },
      { ...overBudget.assets[0], assetId: 'budget-extra-5' },
    )
    const result = validatePack(overBudget)
    expect(result.ok).toBe(false)
    expect(result.ok === false && result.errors.some((e) => e.includes('16,777,216'))).toBe(true)
  })

  it('rejects unknown presets anywhere', () => {
    for (const mutate of [
      (m: any) => { m.levels[0].presentation.scale = 'gigantic' },
      (m: any) => { m.levels[0].presentation.camera = 'orbit' },
      (m: any) => { m.levels[0].presentation.milestone = 'popup' },
      (m: any) => { m.scenes[0].transition = 'morph' },
      (m: any) => { m.scenes[0].layers[1].placement = 'random' },
      (m: any) => { m.scenes[0].layers[0].population.density = 'packed' },
    ]) {
      const candidate = validFixture()
      mutate(candidate)
      expect(validatePack(candidate).ok).toBe(false)
    }
  })

  it('rejects scene structure violations', () => {
    const noSubject = validFixture()
    noSubject.scenes[0].layers = noSubject.scenes[0].layers.filter((l: any) => l.kind !== 'subject')
    expect(validatePack(noSubject).ok).toBe(false)

    const twoSubjects = validFixture()
    twoSubjects.scenes[0].layers.push({ ...twoSubjects.scenes[0].layers[1], layerId: 'subject-2' })
    expect(validatePack(twoSubjects).ok).toBe(false)

    const dupZ = validFixture()
    dupZ.scenes[0].layers[1].zOrder = dupZ.scenes[0].layers[0].zOrder
    expect(validatePack(dupZ).ok).toBe(false)

    const layerWithBoth = validFixture()
    layerWithBoth.scenes[0].layers[0].assetId = 'sprite-flower'
    expect(validatePack(layerWithBoth).ok).toBe(false)
  })

  it('rejects terminal camera without a terminal-overlay layer', () => {
    const candidate = validFixture()
    candidate.levels[1].presentation.camera = 'terminal'
    const result = validatePack(candidate)
    expect(result.ok).toBe(false)
  })

  it('rejects network/luminous density without the required visual class overlay', () => {
    const network = validFixture()
    network.scenes[0].layers[0].population.density = 'network'
    expect(validatePack(network).ok).toBe(false)

    const luminous = validFixture()
    luminous.scenes[0].layers[0].population.density = 'luminous'
    expect(validatePack(luminous).ok).toBe(false)
  })

  it('rejects functions, components, and script/CSS content anywhere in the manifest', () => {
    const withFunction = validFixture()
    withFunction.levels[0].summary = { 'zh-CN': 'x', extra: () => 'run' }
    expect(validatePack(withFunction).ok).toBe(false)

    const withComponent = validFixture()
    ;(withComponent as any).levels[0].summary = { $$typeof: Symbol.for('react.element'), 'zh-CN': 'x' }
    expect(validatePack(withComponent).ok).toBe(false)

    const withScript = validFixture()
    withScript.levels[0].milestone['zh-CN'] = '<script>alert(1)</script>'
    expect(validatePack(withScript).ok).toBe(false)

    const withCss = validFixture()
    withCss.assets[0].altText['zh-CN'] = 'text/css body{}'
    expect(validatePack(withCss).ok).toBe(false)
  })

  it('validates the real fleet manifest asset budget against its declared sizes', () => {
    const manifest = fleetManifest()
    const total = manifest.assets.reduce((sum, a) => sum + a.byteSizeCompressed, 0)
    expect(total).toBeLessThanOrEqual(16_777_216)
    expect(manifest.assets.every((a) => a.byteSizeCompressed <= 2_097_152)).toBe(true)
  })
})
