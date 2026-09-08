/**
 * Unit tests for the package-content projection and state comparison
 * (Goal 发布 §12, §13).
 */
import { describe, expect, it } from 'vitest'
import { expectedPackageProjectionFromList, lockfileVehiclePetRef } from '../../scripts/release/lib/proof.mjs'
import { comparePetState } from '../../scripts/release/lib/stateprobe.mjs'

describe('expectedPackageProjectionFromList', () => {
  const tree = {
    'package.json': 'h_pkg',
    'README.md': 'h_readme',
    'LICENSE': 'h_lic',
    'lib/client.js': 'h_client',
    'lib/index.js': 'h_index',
    'src/index.ts': 'h_src',
    'cordis.patch.yml': 'h_patch',
    '.agents/README.md': 'h_dot',
  }

  it('projects the files whitelist plus always-included metadata files', () => {
    const projection = expectedPackageProjectionFromList(['lib', 'cordis.patch.yml'], tree)
    expect(projection.ok).toBe(true)
    if (!projection.ok) return
    expect(Object.keys(projection.files).sort()).toEqual([
      'LICENSE',
      'README.md',
      'cordis.patch.yml',
      'lib/client.js',
      'lib/index.js',
      'package.json',
    ])
  })

  it('fails closed on wildcards, negations, and missing files field', () => {
    expect(expectedPackageProjectionFromList(['lib', '!lib/x'], tree)).toMatchObject({ ok: false })
    expect(expectedPackageProjectionFromList(['lib/**/*.js'], tree)).toMatchObject({ ok: false })
    expect(expectedPackageProjectionFromList(undefined, tree)).toMatchObject({ ok: false })
  })
})

describe('lockfileVehiclePetRef', () => {
  it('extracts the exact ref from a lock summary', () => {
    const REF = 'a81809c3fbcc2b5b4b97917463bf75f862aeaee9'
    const ref = lockfileVehiclePetRef({
      lockfileVersion: '9.0',
      importerDeps: {
        '@mayf3/vehicle-pet': {
          specifier: `git+https://github.com/mayf3/vehicle-pet.git#${REF}`,
          version: `https://codeload.github.com/mayf3/vehicle-pet/tar.gz/${REF}`,
        },
      },
      packageBlocks: {},
      snapshotBlocks: {},
    })
    expect(ref).toBe(REF)
  })
})

describe('comparePetState', () => {
  const prefsTemplate = {
    schemaVersion: 1,
    position: { xRatio: 0.7236745365973253, yRatio: 0.6020287296807217 },
    positionCustomized: true,
    collapsed: false,
    reducedMotion: 'system',
  }

  function capture(overrides: any) {
    return {
      status: 'CAPTURED',
      targets: [{
        url: 'http://127.0.0.1:3080/',
        storage: {
          origin: 'http://127.0.0.1:3080',
          values: {
            'vehicle-pet/overlay-preferences/v1': JSON.stringify(overrides.prefs ?? prefsTemplate),
            'vehicle-pet/usage-ledger/v1': JSON.stringify(overrides.ledger ?? {
              schemaVersion: 1, cumulativePoints: 5, revision: 2,
              byDay: { '2026-09-08': { dailyTokens: 100, appliedPoints: 5 } },
              lastSeen: { a: 1, b: 2 },
            }),
            'deepseek-pet:scale': overrides.scale ?? '1.25',
          },
        },
        idb: { present: true, activePackId: 'autonomous-fleet', stores: { keepsakes: { count: 0 } } },
      }],
    }
  }

  it('passes byte-stable preservation with natural usage advance', () => {
    const pre = capture({})
    const post = capture({
      ledger: {
        schemaVersion: 1, cumulativePoints: 7, revision: 3,
        byDay: { '2026-09-08': { dailyTokens: 130, appliedPoints: 7 } },
        lastSeen: { a: 1, b: 2, c: 3 },
      },
    })
    const verdicts = comparePetState({ pre, post })
    expect(verdicts.POSITION_PREFERENCE_PRESERVED?.verdict).toBe('PASS')
    expect(verdicts.REDUCED_MOTION_PREFERENCE_PRESERVED?.verdict).toBe('PASS')
    expect(verdicts.SIZE_PREFERENCE_PRESERVED?.verdict).toBe('PASS')
    expect(verdicts.PREFERENCE_BYTES_PRESERVED?.verdict).toBe('PASS')
    expect(verdicts.USAGE_LEDGER_PRESERVED?.verdict).toBe('PASS')
    expect(verdicts.PROGRESS_PRESERVED?.verdict).toBe('PASS')
    expect(verdicts.ENGINE_IDB_PRESERVED?.verdict).toBe('PASS')
    expect(verdicts.OTHER_CLIENT_STATE_PRESERVED?.verdict).toBe('PASS')
  })

  it('fails when position drifts', () => {
    const post = capture({}) as any
    ;(post.targets[0].storage.values as any)['vehicle-pet/overlay-preferences/v1'] = JSON.stringify({
      ...prefsTemplate,
      position: { xRatio: 0.1, yRatio: 0.1 },
    })
    const verdicts = comparePetState({ pre: capture({}), post })
    expect(verdicts.POSITION_PREFERENCE_PRESERVED?.verdict).toBe('FAIL')
    expect(verdicts.PREFERENCE_BYTES_PRESERVED?.verdict).toBe('FAIL')
  })

  it('fails when the usage ledger regresses', () => {
    const post = capture({
      ledger: {
        schemaVersion: 1, cumulativePoints: 0, revision: 0,
        byDay: {}, lastSeen: {},
      },
    })
    const verdicts = comparePetState({ pre: capture({}), post })
    expect(verdicts.USAGE_LEDGER_PRESERVED?.verdict).toBe('FAIL')
    expect(verdicts.PROGRESS_PRESERVED?.verdict).toBe('FAIL')
  })

  it('reports UNAVAILABLE when the probe could not capture', () => {
    const verdicts = comparePetState({
      pre: { status: 'UNAVAILABLE', targets: [] },
      post: { status: 'UNAVAILABLE', targets: [] },
    })
    expect(verdicts.STATE_PROBE?.verdict).toBe('UNAVAILABLE')
  })
})
