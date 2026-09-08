/**
 * Test fixtures for the release tool tests: hermetic git fixture repos
 * (origin + clone with stale local main) and fake DSH profile homes.
 * @module tests/release/helpers
 */

import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { run } from '../../scripts/release/lib/util.mjs'

const GIT_IDENTITY = ['-c', 'user.email=fixture@example.invalid', '-c', 'user.name=fixture']

/** @param {string[]} args */
async function git(args: string[]) {
  const result = await run('git', args, { timeoutMs: 30_000 })
  if (result.code !== 0) {
    throw new Error(`fixture git ${args.join(' ')} failed: ${result.stderr.trim() || result.stdout.trim()}`)
  }
  return result
}

/**
 * Create a fixture vehicle-pet-like repository pair: a bare `origin` whose
 * main holds two commits (REF_A then REF_B), and a clone whose local main
 * is stale at REF_A with an untracked WIP file.
 * @param {{name?: string}} [options]
 */
export async function createStaleCloneFixture(options: { name?: string } = {}) {
  const name = options.name ?? 'fixture'
  const root = await mkdtemp(join(tmpdir(), `vp-release-${name}-`))
  const seed = join(root, 'seed')
  const origin = join(root, 'origin.git')
  const clone = join(root, 'clone')

  await run('git', ['init', '-q', '--bare', origin], { timeoutMs: 30_000 })
  await run('git', ['init', '-q', '-b', 'main', seed], { timeoutMs: 30_000 })
  await writeFile(join(seed, 'README.md'), 'seed\n', 'utf8')
  await git(['-C', seed, 'add', 'README.md'])
  await git(['-C', seed, ...GIT_IDENTITY, 'commit', '-q', '-m', 'seed'])
  await git(['-C', seed, 'remote', 'add', 'origin', origin])
  await git(['-C', seed, 'push', '-q', 'origin', 'main'])

  await git(['-C', seed, ...GIT_IDENTITY, 'commit', '-q', '--allow-empty', '-m', 'commit-a'])
  const refA = (await git(['-C', seed, 'rev-parse', 'HEAD'])).stdout.trim()
  await git(['-C', seed, 'push', '-q', 'origin', 'main'])

  await run('git', ['clone', '-q', origin, clone], { timeoutMs: 30_000 })
  // The clone is now at REF_A. Push REF_B to origin from the seed, leaving
  // the clone's local main stale, then drop a WIP file into the clone.
  await git(['-C', seed, ...GIT_IDENTITY, 'commit', '-q', '--allow-empty', '-m', 'commit-b'])
  const refB = (await git(['-C', seed, 'rev-parse', 'HEAD'])).stdout.trim()
  await git(['-C', seed, 'push', '-q', 'origin', 'main'])

  await writeFile(join(clone, 'WIP.txt'), 'owner work in progress\n', 'utf8')
  // Allow the fixture to serve fetch-by-SHA for the tool's git-truth check.
  await git(['-C', origin, 'config', 'uploadpack.allowAnySHA1InWant', 'true'])
  await git(['-C', origin, 'config', 'uploadpack.allowReachableSHA1InWant', 'true'])
  return { root, origin, clone, refA, refB }
}

/**
 * Create a single-repo fixture whose main already contains both commits.
 * @param {{name?: string}} [options]
 */
export async function createTwoRefRepoFixture(options: { name?: string } = {}) {
  const name = options.name ?? 'tworef'
  const root = await mkdtemp(join(tmpdir(), `vp-release-${name}-`))
  const origin = join(root, 'origin.git')
  const work = join(root, 'work')
  await run('git', ['init', '-q', '--bare', origin], { timeoutMs: 30_000 })
  await run('git', ['init', '-q', '-b', 'main', work], { timeoutMs: 30_000 })
  await writeFile(join(work, 'package.json'), '{"name":"fixture","version":"0.0.0"}\n', 'utf8')
  await git(['-C', work, 'add', 'package.json'])
  await git(['-C', work, ...GIT_IDENTITY, 'commit', '-q', '-m', 'a'])
  const refA = (await git(['-C', work, 'rev-parse', 'HEAD'])).stdout.trim()
  await git(['-C', work, ...GIT_IDENTITY, 'commit', '-q', '--allow-empty', '-m', 'b'])
  const refB = (await git(['-C', work, 'rev-parse', 'HEAD'])).stdout.trim()
  await git(['-C', work, 'push', '-q', origin, 'main'])
  await git(['-C', origin, 'config', 'uploadpack.allowAnySHA1InWant', 'true'])
  return { root, origin, work, refA, refB }
}

/**
 * Fake DSH profile home: `<home>/profiles/<profile>/{package.json,pnpm-lock.yaml}`.
 * @param {{home: string, profile?: string, spec: string, lockedSpecifier?: string, lockedVersion?: string, extraDeps?: Record<string, string>, extraLocked?: Record<string, {specifier: string, version: string}>, membership?: string[]}} input
 */
export async function createFixtureProfile(input: any) {
  const {
    home,
    profile = 'web',
    spec,
    lockedSpecifier = spec,
    lockedVersion = `https://codeload.github.com/mayf3/vehicle-pet/tar.gz/${spec.split('#')[1] ?? 'x'}`,
    extraDeps = { 'deepseek-pet': 'github:keleus/deepseek-pet' },
    extraLocked = {
      'deepseek-pet': {
        specifier: 'github:keleus/deepseek-pet',
        version: 'https://codeload.github.com/keleus/deepseek-pet/tar.gz/35132a4fcfa1a40e4cab7e0163939cc5b25de38b',
      },
    },
    membership = ['@deepseek-ai/dsh-base', '@deepseek-ai/dsh-web-app', 'deepseek-pet', '@mayf3/vehicle-pet'],
  } = input
  const profileDir = join(home, 'profiles', profile)
  await mkdir(profileDir, { recursive: true })
  const deps = { ...extraDeps, '@mayf3/vehicle-pet': spec }
  const locked = { ...extraLocked, '@mayf3/vehicle-pet': { specifier: lockedSpecifier, version: lockedVersion } }
  const packageJson = {
    name: 'dsh-profile-fixture',
    dependencies: deps,
    dsh: { profile: { bundles: membership } },
  }
  await writeFile(join(profileDir, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8')
  const lockLines = [
    "lockfileVersion: '9.0'",
    '',
    'importers:',
    '',
    '  .:',
    '    dependencies:',
  ]
  for (const path of Object.keys(locked)) {
    const depSpec = locked[path].specifier
    const version = locked[path].version
    lockLines.push(`      ${/[@/]/.test(path) ? `'${path}'` : path}:`)
    lockLines.push(`        specifier: ${quoteYaml(depSpec)}`)
    lockLines.push(`        version: ${quoteYaml(version)}`)
  }
  lockLines.push('')
  lockLines.push('packages:')
  lockLines.push('')
  lockLines.push(`  '@mayf3/vehicle-pet@${quoteYaml(lockedVersion)}':`)
  lockLines.push(`    resolution: {tarball: ${quoteYaml(lockedVersion)}}`)
  lockLines.push('    version: 0.1.0')
  lockLines.push('')
  lockLines.push('snapshots:')
  lockLines.push('')
  lockLines.push(`  '@mayf3/vehicle-pet@${quoteYaml(lockedVersion)}':`)
  lockLines.push('    dependencies: {}')
  lockLines.push('')
  await writeFile(join(profileDir, 'pnpm-lock.yaml'), `${lockLines.join('\n')}`, 'utf8')
  return { home, profileDir }
}

/** @param {string} value */
function quoteYaml(value: string): string {
  return `'${String(value).replaceAll("'", "''")}'`
}

/** Read a file as text (test assertions). */
export async function readText(path: string): Promise<string> {
  const { readFile } = await import('node:fs/promises')
  return readFile(path, 'utf8')
}
