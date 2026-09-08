/**
 * Git fixtures for the release E2E driver (no vitest dependency).
 * @module scripts/release/e2e/e2e-fixtures
 */

import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { run } from '../lib/util.mjs'

/**
 * Bare origin + working repo whose main holds REF_A then REF_B.
 * @param {{name?: string}} [options]
 */
export async function createTwoRefRepoFixture(options = {}) {
  const name = options.name ?? 'tworef'
  const root = await mkdtemp(join(tmpdir(), `vp-release-e2e-${name}-`))
  const origin = join(root, 'origin.git')
  const work = join(root, 'work')
  await run('git', ['init', '-q', '--bare', origin], { timeoutMs: 30_000 })
  await run('git', ['init', '-q', '-b', 'main', work], { timeoutMs: 30_000 })
  await writeFile(join(work, 'README.md'), 'fixture\n', 'utf8')
  await run('git', ['-C', work, 'add', 'README.md'], { timeoutMs: 30_000 })
  await run('git', ['-C', work, '-c', 'user.email=e2e@example.invalid', '-c', 'user.name=e2e', 'commit', '-q', '-m', 'a'], { timeoutMs: 30_000 })
  const refA = (await run('git', ['-C', work, 'rev-parse', 'HEAD'], { timeoutMs: 30_000 })).stdout.trim()
  await run('git', ['-C', work, '-c', 'user.email=e2e@example.invalid', '-c', 'user.name=e2e', 'commit', '-q', '--allow-empty', '-m', 'b'], { timeoutMs: 30_000 })
  const refB = (await run('git', ['-C', work, 'rev-parse', 'HEAD'], { timeoutMs: 30_000 })).stdout.trim()
  await run('git', ['-C', work, 'push', '-q', origin, 'main'], { timeoutMs: 30_000 })
  await run('git', ['-C', origin, 'config', 'uploadpack.allowAnySHA1InWant', 'true'], { timeoutMs: 30_000 })
  return { root, origin, work, refA, refB }
}
