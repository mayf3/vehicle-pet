/**
 * Packed-package gate (CTR-OVERLAY-001, ACC-OVERLAY-001): validates the
 * `package.json` DSH declarations mechanically and checks the `npm pack`
 * file list against the closed allowlist (lib artifacts, patch, README,
 * package metadata) so sources, tests, and dev files never ship.
 */

import { spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const failures = []

const pkg = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'))

if (pkg.main !== './lib/index.js') failures.push(`main must be ./lib/index.js (got ${pkg.main})`)
if (pkg.exports?.['.']?.default !== './lib/index.js') failures.push('exports["."] must default to ./lib/index.js')
if (pkg.exports?.['./client']?.default !== './lib/client.js') failures.push('exports["./client"] must default to ./lib/client.js')
if (pkg.exports?.['./cordis.patch.yml'] !== './cordis.patch.yml') failures.push('exports["./cordis.patch.yml"] missing')
if (pkg.exports?.['./package.json'] !== './package.json') failures.push('exports["./package.json"] missing')
if (pkg.dsh?.bundle?.patch !== './cordis.patch.yml') failures.push('dsh.bundle.patch must be ./cordis.patch.yml')
if (pkg.dsh?.client?.platform !== 'web') failures.push('dsh.client.platform must be "web"')
if (!Array.isArray(pkg.dsh?.client?.inject) || pkg.dsh.client.inject.length === 0) {
  failures.push('dsh.client.inject must be a non-empty string array')
}
for (const name of pkg.dsh?.client?.inject ?? []) {
  if (!name.startsWith('@deepseek-ai/')) failures.push(`dsh.client.inject contains a non-DSH edge: ${name}`)
}

const patch = await readFile(path.join(repoRoot, 'cordis.patch.yml'), 'utf8')
if (!patch.includes('id: vehicle-pet') || !patch.includes(`name: '@mayf3/vehicle-pet'`)) {
  failures.push('cordis.patch.yml must insert exactly the vehicle-pet / @mayf3/vehicle-pet row')
}

const result = spawnSync('npm', ['pack', '--json', '--dry-run', '--ignore-scripts'], {
  encoding: 'utf8',
  cwd: repoRoot,
})
if (result.status !== 0) {
  process.stderr.write(result.stderr)
  process.exit(result.status ?? 1)
}
const report = JSON.parse(result.stdout)[0]
const paths = report.files.map(file => file.path)

const forbidden = paths.filter(file =>
  file.startsWith('src/')
  || file.startsWith('tests/')
  || file.startsWith('scripts/')
  || file.startsWith('docs/')
  || file.endsWith('.DS_Store')
  || file.includes('.env'))
const required = ['package.json', 'cordis.patch.yml', 'README.md', 'lib/index.js', 'lib/client.js']
const missing = required.filter(file => !paths.includes(file))
if (forbidden.length > 0) failures.push(`forbidden pack files: ${forbidden.join(', ')}`)
if (missing.length > 0) failures.push(`missing pack files: ${missing.join(', ')}`)
for (const file of paths) {
  if (file.startsWith('lib/') && !/\.js$|\.js\.map$|\.d\.ts$|\.d\.ts\.map$/.test(file)) {
    failures.push(`unexpected packed file under lib/: ${file}`)
  }
}

// PACKAGE_PUBLIC_HYGIENE_CHECK (V8 CTR-039/041): the shipped projection must
// be brand-neutral and free of personal paths and credential-shaped strings.
const shippedText = []
// Scan every shipped text-bearing file, including source maps (their
// sourcesContent embeds original sources verbatim).
for (const file of paths) {
  if (file === 'README.md' || /^lib\/.*(\.js$|\.d\.ts$|\.map$)/.test(file) || /^(LICENSE|NOTICE)/.test(file)) {
    shippedText.push([file, await readFile(path.join(repoRoot, file), 'utf8')])
  }
}
for (const [file, content] of shippedText) {
  // License/attribution files NAME third-party brands in their exclusion
  // clauses (nominative use) — that is not brand binding, so the brand scan
  // applies to identity-bearing files only. Personal-path and key-material
  // scans still cover every shipped text file.
  const isLicenseNotice = /^(LICENSE|NOTICE)/.test(file)
  if (!isLicenseNotice) {
    for (const brand of ['Pony.ai', 'pony.ai']) {
      if (content.includes(brand)) failures.push(`shipped file ${file} contains third-party brand "${brand}"`)
    }
  }
  if (content.includes('/Users/')) failures.push(`shipped file ${file} contains a personal absolute path`)
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(content)) failures.push(`shipped file ${file} contains private key material`)
}

if (failures.length > 0) {
  console.error(failures.map(message => `- ${message}`).join('\n'))
  process.exit(1)
}
console.log(`DSH package OK: ${paths.length} files, ${report.size} bytes packed`)
