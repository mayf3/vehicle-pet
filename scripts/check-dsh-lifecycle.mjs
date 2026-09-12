import { execFileSync } from 'node:child_process'
import { readFile, rm } from 'node:fs/promises'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dshRoot = process.env.DSH_REFERENCE_WORKTREE
  ?? '/Users/yanfenma/workspace/github/deepseek-harness-wt-vehicle-pet-overlay-f77b5a2f'
const dshHome = process.env.DISPOSABLE_DSH_LIFECYCLE_HOME
  ?? '/tmp/vehicle-pet-overlay-dsh-home-lifecycle-r1'
const packageName = '@mayf3/vehicle-pet'

// Disposable-only safety contract (T59): the guard decides on the
// canonical/resolved filesystem target, not the raw string. Rejects the tmp
// root itself, anything resolving outside the real tmp root, and any symlink
// component (dedicated real directories only).
function assertDisposableTmpHome(home) {
  const tmpRoot = fs.realpathSync('/tmp') // e.g. /private/tmp on macOS
  const resolved = path.resolve(home)
  if (resolved === '/tmp') throw new Error(`refusing non-disposable DSH_HOME: ${home}`)
  if (!resolved.startsWith('/tmp/') && !resolved.startsWith(tmpRoot + '/')) {
    throw new Error(`refusing non-disposable DSH_HOME: ${home}`)
  }
  // the deepest existing ancestor must live inside the real tmp root
  let cur = resolved
  for (;;) {
    let real
    try {
      real = fs.realpathSync(cur)
    } catch (e) {
      if (e.code === 'ENOENT') {
        const parent = path.dirname(cur)
        if (parent === cur) throw new Error(`refusing non-disposable DSH_HOME: ${home}`)
        cur = parent
        continue
      }
      throw new Error(`refusing non-disposable DSH_HOME: ${home} (${e.message})`)
    }
    if (real === tmpRoot) {
      // acceptable only for a not-yet-created direct child of the textual /tmp
      if (cur !== tmpRoot || path.dirname(resolved) !== '/tmp') {
        throw new Error(`refusing non-disposable DSH_HOME: ${home}`)
      }
      break
    }
    if (!real.startsWith(tmpRoot + '/')) {
      throw new Error(`refusing non-disposable DSH_HOME: ${home} (resolves to ${real})`)
    }
    break
  }
  // no symlink games: textual leaf lstat + every real component between the
  // tmp root and the deepest existing ancestor
  try {
    const st = fs.lstatSync(resolved)
    if (st.isSymbolicLink()) {
      throw new Error(`refusing non-disposable DSH_HOME: ${home} (symlink ${resolved})`)
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw new Error(`refusing non-disposable DSH_HOME: ${home} (${e.message})`)
  }
  const rel = path.relative(tmpRoot, cur)
  if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) {
    let acc = tmpRoot
    for (const seg of rel.split(path.sep)) {
      acc = path.join(acc, seg)
      const st = fs.lstatSync(acc)
      if (st.isSymbolicLink()) {
        throw new Error(`refusing non-disposable DSH_HOME: ${home} (symlink component ${acc})`)
      }
    }
  }
}
assertDisposableTmpHome(dshHome)

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
