/**
 * DSH adapter architecture gate (CTR-OVERLAY-001/006/008/009/013,
 * ACC-OVERLAY-018): DSH coupling is isolated to `src/dsh/**`; the shared
 * engine/react/packs layers stay DSH-independent; the adapter exposes no
 * network, model, token, or progression-mutation path; no second React root
 * or Vite runtime can be introduced through source.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
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

function sourceFiles(under: string): { rel: string; text: string }[] {
  const root = path.join(REPO, under)
  return walk(root)
    .filter(file => /\.(ts|tsx)$/.test(file))
    .map(file => ({
      rel: path.relative(REPO, file).split(path.sep).join('/'),
      text: readFileSync(file, 'utf8'),
    }))
}

/** Remove block and line comments so doc prose never trips capability scans. */
function stripComments(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

function importsOf(text: string): string[] {
  const specs: string[] = []
  const patterns = [/from '([^']+)'/g, /from "([^"]+)"/g, /import '([^']+)'/g, /import\('([^']+)'\)/g]
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) specs.push(match[1]!)
  }
  return specs
}

describe('DSH adapter boundary (CTR-OVERLAY-001, CTR-OVERLAY-006)', () => {
  it('imports @deepseek-ai contracts only inside src/dsh', () => {
    const violations: string[] = []
    for (const file of sourceFiles('src')) {
      const isDsh = file.rel.startsWith('src/dsh/')
      for (const spec of importsOf(file.text)) {
        if (spec.startsWith('@deepseek-ai/') && !isDsh) violations.push(`${file.rel} → ${spec}`)
      }
    }
    expect(violations).toEqual([])
  })

  it('keeps engine, react, and packs free of any adapter import', () => {
    const violations: string[] = []
    for (const file of sourceFiles('src')) {
      const shared = file.rel.startsWith('src/engine/')
        || file.rel.startsWith('src/react/')
        || file.rel.startsWith('src/packs/')
      if (!shared) continue
      for (const spec of importsOf(file.text)) {
        if (spec.includes('/dsh/') || spec === '../dsh' || spec === '../../dsh') {
          violations.push(`${file.rel} → ${spec}`)
        }
      }
    }
    expect(violations).toEqual([])
  })
})

describe('no forbidden adapter capability (CTR-OVERLAY-008, CTR-OVERLAY-009, CTR-OVERLAY-013)', () => {
  const forbiddenPatterns: [RegExp, string][] = [
    [/\.addPoints\(/, 'progress mutation (addPoints)'],
    [/\.setPoints\(/, 'progress mutation (setPoints)'],
    [/\.resetSubject\(/, 'subject reset'],
    [/\bfetch\s*\(/, 'network (fetch)'],
    [/XMLHttpRequest/, 'network (XHR)'],
    [/\bWebSocket\b/, 'network (WebSocket)'],
    [/\bEventSource\b/, 'network (SSE)'],
    [/\bcreateRoot\b/, 'second React root (createRoot)'],
    [/\bhydrateRoot\b/, 'second React root (hydrateRoot)'],
    [/import\.meta\.glob/, 'Vite import.meta.glob'],
    [/\biframe\b/i, 'iframe'],
  ]

  it('src/dsh contains none of the forbidden capabilities', () => {
    const violations: string[] = []
    for (const file of sourceFiles('src/dsh')) {
      const code = stripComments(file.text)
      for (const [pattern, label] of forbiddenPatterns) {
        if (pattern.test(code)) violations.push(`${file.rel}: ${label}`)
      }
    }
    expect(violations).toEqual([])
  })

  it('uses exactly the authorized window-facing entry files', () => {
    const dshFiles = sourceFiles('src/dsh').map(file => file.rel)
    expect(dshFiles).toContain('src/dsh/index.ts')
    expect(dshFiles).toContain('src/dsh/client/index.ts')
  })
})
