import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const REPO = path.resolve(import.meta.dirname, '../..')

function walk(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...walk(full))
    } else {
      out.push(full)
    }
  }
  return out
}

const SRC = path.join(REPO, 'src')
const srcFiles = walk(SRC).filter((f) => /\.(ts|tsx|json)$/.test(f))

const toPosix = (p: string) => path.relative(REPO, p).split(path.sep).join('/')

function importsOf(file: string): string[] {
  const text = readFileSync(file, 'utf8')
  const specs: string[] = []
  const patterns = [/from '([^']+)'/g, /from "([^"]+)"/g, /import '([^']+)'/g, /import\('([^']+)'\)/g]
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      specs.push(match[1]!)
    }
  }
  return specs
}

/** Maps a relative import inside src/** to its target file (best-effort resolution). */
function resolveImport(fromFile: string, spec: string): string | null {
  if (!spec.startsWith('.')) return null
  const base = path.resolve(path.dirname(fromFile), spec)
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.json`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ]
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  }
  return null
}

describe('frozen dependency direction (DEC-PET-010)', () => {
  it('engine never imports react, prototype, packs, or react-dom', () => {
    const violations: string[] = []
    for (const file of srcFiles) {
      const rel = toPosix(file)
      if (!rel.startsWith('src/engine/')) continue
      for (const spec of importsOf(file)) {
        if (
          spec === 'react' ||
          spec === 'react-dom' ||
          spec.startsWith('react/') ||
          spec.includes('src/react') ||
          spec.includes('src/prototype') ||
          spec.includes('src/packs') ||
          /^(\.\.\/)+react/.test(spec) ||
          /^(\.\.\/)+prototype/.test(spec) ||
          /^(\.\.\/)+packs/.test(spec)
        ) {
          violations.push(`${rel}: ${spec}`)
        }
        const resolved = resolveImport(file, spec)
        if (resolved !== null) {
          const resolvedRel = toPosix(resolved)
          if (!resolvedRel.startsWith('src/engine/') && resolvedRel.startsWith('src/')) {
            violations.push(`${rel} -> ${resolvedRel}`)
          }
        }
      }
    }
    expect(violations).toEqual([])
  })

  it('react layer imports only the engine public API (never prototype or packs)', () => {
    const violations: string[] = []
    for (const file of srcFiles) {
      const rel = toPosix(file)
      if (!rel.startsWith('src/react/')) continue
      for (const spec of importsOf(file)) {
        if (spec.includes('prototype') || spec.includes('packs')) {
          violations.push(`${rel}: ${spec}`)
        }
        const resolved = resolveImport(file, spec)
        if (resolved !== null) {
          const resolvedRel = toPosix(resolved)
          if (resolvedRel.startsWith('src/prototype/') || resolvedRel.startsWith('src/packs/')) {
            violations.push(`${rel} -> ${resolvedRel}`)
          }
        }
      }
    }
    expect(violations).toEqual([])
  })

  it('packs depend only on public types and their own data — never on renderer internals or prototype', () => {
    const violations: string[] = []
    for (const file of srcFiles) {
      const rel = toPosix(file)
      if (!rel.startsWith('src/packs/')) continue
      for (const spec of importsOf(file)) {
        if (spec.includes('prototype')) {
          violations.push(`${rel}: ${spec}`)
        }
        const resolved = resolveImport(file, spec)
        if (resolved !== null) {
          const resolvedRel = toPosix(resolved)
          const deepEngine = resolvedRel.startsWith('src/engine/') && !resolvedRel.endsWith('src/engine/index.ts'.replace('src/engine/', '')) && !resolvedRel.startsWith('src/engine/schema/') && resolvedRel !== 'src/engine/index.ts'
          if (deepEngine || resolvedRel.startsWith('src/react/') || resolvedRel.startsWith('src/prototype/')) {
            violations.push(`${rel} -> ${resolvedRel}`)
          }
        }
      }
    }
    expect(violations).toEqual([])
  })

  it('prototype is the only layer allowed to import every other layer', () => {
    const rels = srcFiles.map(toPosix).filter((rel) => rel.startsWith('src/prototype/'))
    expect(rels.length).toBeGreaterThan(0)
  })
})

describe('no domain semantics in engine/react production code (CTR-PET-009, ACC-PET-009)', () => {
  const DOMAIN_WORDS = /\b(driver|drivers|passenger|passengers|protectionVehicle|vehicles?|fleet|fleets|safetyOfficer|remoteGuardian)\b/gi

  it('src/engine/** and src/react/** contain zero domain-rule hits', () => {
    const hits: string[] = []
    for (const file of srcFiles) {
      const rel = toPosix(file)
      if (!rel.startsWith('src/engine/') && !rel.startsWith('src/react/')) continue
      if (file.endsWith('.json') && rel.startsWith('src/engine/schema/')) {
        // The JSON Schema is generic (enums/regex only); still scan it.
      }
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(DOMAIN_WORDS)) {
        hits.push(`${rel}: ${match[0]}`)
      }
    }
    expect(hits).toEqual([])
  })
})

describe('no network, model, transport, or runtime pack installation anywhere in src (CTR-PET-004, CTR-PET-020, CTR-PET-021, ACC-PET-004/020/021)', () => {
  const FORBIDDEN_CALLS = /\b(fetch\s*\(|new\s+WebSocket|EventSource|XMLHttpRequest|navigator\.sendBeacon|importScripts\s*\(|new\s+Function\b|eval\s*\()/g

  it('contains zero network/exec call sites', () => {
    const hits: string[] = []
    for (const file of srcFiles.filter((f) => /\.(ts|tsx)$/.test(f))) {
      const rel = toPosix(file)
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(FORBIDDEN_CALLS)) {
        hits.push(`${rel}: ${match[0].trim()}`)
      }
    }
    expect(hits).toEqual([])
  })

  it('contains no model SDK, DeepSeek Harness adapter, or token accounting', () => {
    const BANNED = /deepseek|openai|anthropic|llm|chatgpt|token[-_ ]?(usage|accounting|billing|consumption)|model[-_ ]?(sdk|client|call)/gi
    const hits: string[] = []
    for (const file of srcFiles.filter((f) => /\.(ts|tsx)$/.test(f))) {
      const rel = toPosix(file)
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(BANNED)) {
        hits.push(`${rel}: ${match[0]}`)
      }
    }
    expect(hits).toEqual([])
  })

  it('has no runtime pack installer, downloader, or remote pack URL support', () => {
    const BANNED = /(installPack|downloadPack|packMarketplace|marketplace|remotePack|https?:\/\/[^'"\s]*pack)/gi
    const hits: string[] = []
    for (const file of srcFiles.filter((f) => /\.(ts|tsx)$/.test(f))) {
      const rel = toPosix(file)
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(BANNED)) {
        hits.push(`${rel}: ${match[0]}`)
      }
    }
    expect(hits).toEqual([])
  })

  it('registers exactly one Progress Source: the prototype MockProgressSource', () => {
    const mockSourcePath = path.join(SRC, 'prototype', 'MockProgressSource.ts')
    expect(existsSync(mockSourcePath)).toBe(true)
    const engineSources = srcFiles.filter((f) => toPosix(f).startsWith('src/engine/')).map(toPosix)
    expect(engineSources.some((rel) => rel.includes('MockProgressSource'))).toBe(false)
    const progressSourceImplementations = walk(SRC)
      .filter((f) => f.endsWith('.ts'))
      .map(toPosix)
      .filter((rel) => /ProgressSource\.(ts|tsx)$/.test(rel) && rel !== 'engine/types/core.ts')
    expect(progressSourceImplementations).toEqual(['src/prototype/MockProgressSource.ts'])
  })
})
