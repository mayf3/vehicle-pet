import { execFileSync } from 'node:child_process'
import { readFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dshRoot = process.env.DSH_REFERENCE_WORKTREE
  ?? '/Users/yanfenma/workspace/github/deepseek-harness-wt-vehicle-pet-overlay-f77b5a2f'
const dshHome = process.env.DISPOSABLE_DSH_LIFECYCLE_HOME
  ?? '/tmp/vehicle-pet-overlay-dsh-home-lifecycle-r1'
const packageName = '@mayf3/vehicle-pet'

if (!dshHome.startsWith('/tmp/')) throw new Error(`refusing non-disposable DSH_HOME: ${dshHome}`)

const run = (...args) => execFileSync('pnpm', ['dsh', 'plugin', '--profile', 'web', ...args], {
  cwd: dshRoot,
  env: { ...process.env, DSH_HOME: dshHome },
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
})

const profilePath = path.join(dshHome, 'profiles/web/package.json')
async function assertMembership(expected, phase) {
  const profile = JSON.parse(await readFile(profilePath, 'utf8'))
  const dependency = profile.dependencies?.[packageName]
  const bundles = profile.dsh?.profile?.bundles ?? []
  const count = bundles.filter(name => name === packageName).length
  if (expected) {
    if (typeof dependency !== 'string' || count !== 1) {
      throw new Error(`${phase}: expected one dependency/bundle membership, got dependency=${dependency}, count=${count}`)
    }
  } else if (dependency !== undefined || count !== 0) {
    throw new Error(`${phase}: expected complete removal, got dependency=${dependency}, count=${count}`)
  }
}

await rm(dshHome, { recursive: true, force: true })
run('add', repoRoot)
await assertMembership(true, 'local add')
run('update', packageName)
await assertMembership(true, 'update')
run('remove', packageName)
await assertMembership(false, 'remove')
run('add', repoRoot)
await assertMembership(true, 'reinstall')

console.log(`DSH lifecycle OK: local add, update, remove, reinstall in ${dshHome}`)
