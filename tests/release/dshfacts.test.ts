/**
 * Unit tests for profile fact parsing and the surgical pin rewrite
 * (Goal 发布 §5, §9).
 */
import { describe, expect, it } from 'vitest'
import {
  parseVehiclePetSpec,
  buildPinnedPackageJson,
  rewriteDeltaIsSurgical,
  resolveDshHome,
} from '../../scripts/release/lib/dshfacts.mjs'

const REF_A = 'a81809c3fbcc2b5b4b97917463bf75f862aeaee9'
const REF_B = 'cce0e9d24907e7c17e42fd2b310a68a98860d5cf'

describe('parseVehiclePetSpec', () => {
  it('parses the production git-fixed-ref shape', () => {
    const parsed = parseVehiclePetSpec(`git+https://github.com/mayf3/vehicle-pet.git#${REF_A}`)
    expect(parsed).toEqual({ kind: 'git-fixed-ref', url: 'git+https://github.com/mayf3/vehicle-pet.git', ref: REF_A })
  })

  it('reports floating / branch / short specs as unsupported (never guesses a ref)', () => {
    for (const spec of [
      'git+https://github.com/mayf3/vehicle-pet.git#main',
      'git+https://github.com/mayf3/vehicle-pet.git#a81809c',
      'github:mayf3/vehicle-pet',
      'latest',
    ]) {
      expect(parseVehiclePetSpec(spec).kind, spec).toBe('unsupported')
    }
    expect(parseVehiclePetSpec(undefined).kind).toBe('missing')
  })
})

describe('buildPinnedPackageJson', () => {
  const raw = JSON.stringify({
    name: 'profile',
    dependencies: {
      'deepseek-pet': 'github:keleus/deepseek-pet',
      '@mayf3/vehicle-pet': `git+https://github.com/mayf3/vehicle-pet.git#${REF_A}`,
    },
    dsh: { profile: { bundles: ['deepseek-pet', '@mayf3/vehicle-pet'] } },
  }, null, 2)

  it('rewrites exactly the vehicle-pet spec, preserving the rest byte-for-byte', () => {
    const result = buildPinnedPackageJson(raw, `git+https://github.com/mayf3/vehicle-pet.git#${REF_A}`, {
      url: 'git+https://github.com/mayf3/vehicle-pet.git',
      ref: REF_B,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.text).toContain(`#${REF_B}`)
    expect(result.text).not.toContain(`#${REF_A}`)
    expect(result.text).toContain('"github:keleus/deepseek-pet"')
    expect(result.text).toContain('"bundles"')
  })

  it('fails when the old spec appears zero times', () => {
    const result = buildPinnedPackageJson(raw, `git+https://github.com/mayf3/vehicle-pet.git#${'9'.repeat(40)}`, {
      url: 'git+https://github.com/mayf3/vehicle-pet.git',
      ref: REF_B,
    })
    expect(result).toMatchObject({ ok: false, reason: 'PIN_REWRITE_FAILED' })
  })
})

describe('rewriteDeltaIsSurgical', () => {
  it('accepts a single-dependency delta', () => {
    const before = JSON.stringify({ name: 'p', version: 1, dependencies: { a: '1', '@mayf3/vehicle-pet': `x#${REF_A}` } }, null, 2)
    const after = JSON.stringify({ name: 'p', version: 1, dependencies: { a: '1', '@mayf3/vehicle-pet': `x#${REF_B}` } }, null, 2)
    expect(rewriteDeltaIsSurgical(before, after, `x#${REF_B}`)).toBe(true)
  })

  it('rejects collateral changes (membership or other deps moved)', () => {
    const before = JSON.stringify({ dependencies: { a: '1', '@mayf3/vehicle-pet': `x#${REF_A}` }, dsh: { profile: { bundles: ['a', 'p'] } } }, null, 2)
    const afterMembership = JSON.stringify({ dependencies: { a: '1', '@mayf3/vehicle-pet': `x#${REF_B}` }, dsh: { profile: { bundles: ['a'] } } }, null, 2)
    expect(rewriteDeltaIsSurgical(before, afterMembership, `x#${REF_B}`)).toBe(false)
    const afterOtherDep = JSON.stringify({ dependencies: { a: '2', '@mayf3/vehicle-pet': `x#${REF_B}` } }, null, 2)
    expect(rewriteDeltaIsSurgical(before, afterOtherDep, `x#${REF_B}`)).toBe(false)
  })
})

describe('resolveDshHome', () => {
  it('CLI override wins over env, env wins over ~/.dsh', () => {
    expect(resolveDshHome('/tmp/one', { DSH_HOME: '/tmp/two' })).toBe('/tmp/one')
    expect(resolveDshHome(undefined, { DSH_HOME: '/tmp/two' })).toBe('/tmp/two')
    expect(resolveDshHome(undefined, {})).toContain('/.dsh')
    expect(resolveDshHome(undefined, { DSH_HOME: '   ' })).toContain('/.dsh')
  })
})
