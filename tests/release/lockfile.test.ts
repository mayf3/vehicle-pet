/**
 * Unit tests for the pnpm-lock drift guard (Goal 发布 §9, RISK_3):
 * only the @mayf3/vehicle-pet dependency may move; any unrelated
 * resolution change must be classified as UNRELATED_DEPENDENCY_DRIFT.
 */
import { describe, expect, it } from 'vitest'
import { summarizeLockfile, classifyLockDrift, preInstallConsistency } from '../../scripts/release/lib/lockfile.mjs'

const REF_A = 'a81809c3fbcc2b5b4b97917463bf75f862aeaee9'
const REF_B = 'cce0e9d24907e7c17e42fd2b310a68a98860d5cf'

function lockText({ vehicleRef, deepseekSha }: { vehicleRef: string, deepseekSha: string }) {
  return [
    "lockfileVersion: '9.0'",
    '',
    'importers:',
    '',
    '  .:',
    '    dependencies:',
    "      '@mayf3/vehicle-pet':",
    `        specifier: git+https://github.com/mayf3/vehicle-pet.git#${vehicleRef}`,
    `        version: https://codeload.github.com/mayf3/vehicle-pet/tar.gz/${vehicleRef}`,
    '      deepseek-pet:',
    '        specifier: github:keleus/deepseek-pet',
    `        version: https://codeload.github.com/keleus/deepseek-pet/tar.gz/${deepseekSha}(react-dom@18.3.1(react@18.3.1))(react@18.3.1)`,
    '      dsh-better-sidebar:',
    '        specifier: github:omdsh-dev/DSH-better-sidebar#a5c52b3f1bc450b04578bd9252f67b7d79c98502',
    '        version: https://codeload.github.com/omdsh-dev/DSH-better-sidebar/tar.gz/a5c52b3f1bc450b04578bd9252f67b7d79c98502',
    '',
    'packages:',
    '',
    `  '@mayf3/vehicle-pet@https://codeload.github.com/mayf3/vehicle-pet/tar.gz/${vehicleRef}':`,
    `    resolution: {tarball: https://codeload.github.com/mayf3/vehicle-pet/tar.gz/${vehicleRef}}`,
    '    version: 0.1.0',
    '',
    `  deepseek-pet@https://codeload.github.com/keleus/deepseek-pet/tar.gz/${deepseekSha}:`,
    `    resolution: {tarball: https://codeload.github.com/keleus/deepseek-pet/tar.gz/${deepseekSha}}`,
    '    version: 1.2.3',
    '',
    'snapshots:',
    '',
    `  '@mayf3/vehicle-pet@https://codeload.github.com/mayf3/vehicle-pet/tar.gz/${vehicleRef}':`,
    '    dependencies: {}',
    '',
  ].join('\n')
}

const SHA_1 = '35132a4fcfa1a40e4cab7e0163939cc5b25de38b'
const SHA_2 = '00000000000000000000000000000000000000ff'

describe('summarizeLockfile', () => {
  it('extracts importer deps and package blocks from a production-shaped lock', () => {
    const result = summarizeLockfile(lockText({ vehicleRef: REF_A, deepseekSha: SHA_1 }))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.summary.importerDeps['@mayf3/vehicle-pet']?.specifier).toContain(REF_A)
    expect(result.summary.importerDeps['deepseek-pet']?.version).toContain(SHA_1)
    expect(Object.keys(result.summary.packageBlocks)).toHaveLength(2)
    expect(Object.keys(result.summary.snapshotBlocks)).toHaveLength(1)
  })

  it('fails closed on non-lockfile text', () => {
    const result = summarizeLockfile('hello: world\n')
    expect(result).toMatchObject({ ok: false, reason: 'LOCKFILE_UNPARSEABLE' })
  })
})

describe('classifyLockDrift', () => {
  const base = lockText({ vehicleRef: REF_A, deepseekSha: SHA_1 })

  it('accepts a pure vehicle-pet move (importers + packages + snapshots all moved)', () => {
    const pre = summarizeLockfile(base)
    const post = summarizeLockfile(lockText({ vehicleRef: REF_B, deepseekSha: SHA_1 }))
    expect(pre.ok && post.ok).toBe(true)
    if (!pre.ok || !post.ok) return
    const verdict = classifyLockDrift({ pre: pre.summary, post: post.summary, fromRef: REF_A, toRef: REF_B })
    expect(verdict).toMatchObject({ ok: true, vehiclePetMoved: true })
  })

  it('accepts an identical lock (idempotent re-install)', () => {
    const pre = summarizeLockfile(base)
    const post = summarizeLockfile(base)
    if (!pre.ok || !post.ok) throw new Error('fixture parse failed')
    const verdict = classifyLockDrift({ pre: pre.summary, post: post.summary, fromRef: REF_A, toRef: REF_A })
    expect(verdict.ok).toBe(true)
  })

  it('rejects an unrelated floating dep re-resolution (RISK_3)', () => {
    const pre = summarizeLockfile(base)
    const post = summarizeLockfile(lockText({ vehicleRef: REF_B, deepseekSha: SHA_2 }))
    if (!pre.ok || !post.ok) throw new Error('fixture parse failed')
    const verdict = classifyLockDrift({ pre: pre.summary, post: post.summary, fromRef: REF_A, toRef: REF_B })
    expect(verdict).toMatchObject({ ok: false, reason: 'UNRELATED_DEPENDENCY_DRIFT' })
    if (verdict.ok) return
    expect(verdict.drift.join('\n')).toContain('deepseek-pet')
  })

  it('rejects a new or removed unrelated dependency', () => {
    const pre = summarizeLockfile(base)
    const addedText = base.replace(
      '    dependencies:\n',
      '    dependencies:\n      dsh-session-doctor:\n        specifier: github:mayf3/dsh-session-doctor\n        version: 0.0.1\n',
    )
    const post = summarizeLockfile(addedText)
    if (!pre.ok || !post.ok) throw new Error('fixture parse failed')
    const verdict = classifyLockDrift({ pre: pre.summary, post: post.summary, fromRef: REF_A, toRef: REF_B })
    expect(verdict).toMatchObject({ ok: false, reason: 'UNRELATED_DEPENDENCY_DRIFT' })
  })

  it('rejects a vehicle-pet entry that moved to the wrong ref (anomaly)', () => {
    const WRONG = 'f'.repeat(40)
    const pre = summarizeLockfile(base)
    const post = summarizeLockfile(lockText({ vehicleRef: WRONG, deepseekSha: SHA_1 }))
    if (!pre.ok || !post.ok) throw new Error('fixture parse failed')
    const verdict = classifyLockDrift({ pre: pre.summary, post: post.summary, fromRef: REF_A, toRef: REF_B })
    expect(verdict).toMatchObject({ ok: false, reason: 'UNRELATED_DEPENDENCY_DRIFT' })
    if (verdict.ok) return
    expect(verdict.drift.join('\n')).toContain('@mayf3/vehicle-pet')
  })
})

describe('preInstallConsistency', () => {
  it('passes when every non-vehicle-pet spec agrees with the lock', () => {
    const lock = summarizeLockfile(lockText({ vehicleRef: REF_A, deepseekSha: SHA_1 }))
    if (!lock.ok) throw new Error('fixture parse failed')
    const verdict = preInstallConsistency({
      packageDeps: {
        'deepseek-pet': 'github:keleus/deepseek-pet',
        '@mayf3/vehicle-pet': `git+https://github.com/mayf3/vehicle-pet.git#${REF_B}`, // vehicle-pet excluded from this gate
      },
      lock: lock.summary,
    })
    expect(verdict.ok).toBe(true)
  })

  it('stops when an unrelated dep spec no longer matches the lock (pending re-resolution)', () => {
    const lock = summarizeLockfile(lockText({ vehicleRef: REF_A, deepseekSha: SHA_1 }))
    if (!lock.ok) throw new Error('fixture parse failed')
    const verdict = preInstallConsistency({
      packageDeps: {
        'deepseek-pet': 'github:keleus/deepseek-pet#00000000000000000000000000000000000000ff',
        '@mayf3/vehicle-pet': `git+https://github.com/mayf3/vehicle-pet.git#${REF_A}`,
      },
      lock: lock.summary,
    })
    expect(verdict).toMatchObject({ ok: false, reason: 'UNRELATED_DEPENDENCY_DRIFT', phase: 'PRE_INSTALL' })
  })
})
