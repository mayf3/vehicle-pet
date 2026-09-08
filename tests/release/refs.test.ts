/**
 * Unit tests for exact-ref validation and tree diffing (Goal 发布 §5, §7).
 */
import { describe, expect, it } from 'vitest'
import { validateExactRef, diffTrees } from '../../scripts/release/lib/refs.mjs'

const VALID = 'a81809c3fbcc2b5b4b97917463bf75f862aeaee9'

describe('validateExactRef', () => {
  it('accepts an exact 40-hex sha', () => {
    const result = validateExactRef(VALID)
    expect(result).toEqual({ ok: true, ref: VALID })
  })

  it('accepts and normalizes uppercase hex', () => {
    const result = validateExactRef(VALID.toUpperCase())
    expect(result).toEqual({ ok: true, ref: VALID })
  })

  it('rejects main / latest / branch / tag shapes', () => {
    for (const input of ['main', 'latest', 'origin/main', 'release-1', 'v1.2.3', 'HEAD']) {
      const result = validateExactRef(input)
      expect(result.ok, input).toBe(false)
      if (!result.ok) expect(result.reason).toBe('TARGET_REF_NOT_EXACT_40HEX')
    }
  })

  it('rejects short shas', () => {
    const result = validateExactRef(VALID.slice(0, 7))
    expect(result.ok).toBe(false)
  })

  it('rejects 39-hex and 41-hex', () => {
    expect(validateExactRef(`${VALID.slice(0, 39)}`).ok).toBe(false)
    expect(validateExactRef(`${VALID}a`).ok).toBe(false)
  })

  it('rejects non-hex 40-char input and empty input', () => {
    expect(validateExactRef('z'.repeat(40)).ok).toBe(false)
    expect(validateExactRef('').ok).toBe(false)
    expect(validateExactRef(undefined).ok).toBe(false)
  })
})

describe('diffTrees', () => {
  it('reports no differences for equal maps', () => {
    expect(diffTrees({ 'a.txt': 'h1', 'b/c.js': 'h2' }, { 'a.txt': 'h1', 'b/c.js': 'h2' })).toEqual([])
  })

  it('classifies missing, unexpected, and mismatched files', () => {
    const differences = diffTrees(
      { 'a.txt': 'h1', 'b.txt': 'h2', 'c.txt': 'h3' },
      { 'a.txt': 'h1', 'b.txt': 'hX', 'd.txt': 'h4' },
    )
    expect(differences).toEqual([
      { path: 'b.txt', kind: 'CONTENT_MISMATCH' },
      { path: 'c.txt', kind: 'MISSING_IN_INSTALLED' },
      { path: 'd.txt', kind: 'UNEXPECTED_IN_INSTALLED' },
    ])
  })
})
