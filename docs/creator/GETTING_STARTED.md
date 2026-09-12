# Creator Guide — Getting Started

Audience: a developer who can run `pnpm` and copy files. You do **not** need
to read the governing Specs or any engine code to ship a pet — and the flow
is **data only**: you never author TypeScript.

## Prerequisites

- Node.js 22.19+ (or 24+) and pnpm (both repos pin their version via
  `packageManager`; Corepack picks them up automatically).
- Commands are run from the repository root of your `vehicle-pet` checkout
  — never from inside the template or pet directories.

## What a pet is made of

| Piece | Lives in | You provide |
|---|---|---|
| Journey (growth) | `src/packs/<your-pack-id>/manifest.json` + `journey/assets/` | levels, thresholds, stage names, scenes, keepsakes, alt text |
| Presentation | `src/dsh/client/pets/<your-pet-id>/pet.json` + `levels.json` + `speech.json` + `assets/` | id, names, recipe, pose mapping, grade policy, speech, license |
| License/provenance | `LICENSE`, `pet/PROVENANCE.json` | your license and an honest art-origin statement |

Everything else — wiring, registry, menu, schedulers, rendering, persistence
— is generated or generic. The generated wiring modules carry a
"do not edit" header on purpose: re-running the tooling is the only
supported way to change them.

## The six steps

1. **Copy** `examples/minimal-pet` to `examples/my-pet`.
2. **Replace** configuration, textures, and copy (all inside your directory).
3. **Validate**: `pnpm pet:validate examples/my-pet`. Failures name the exact
   file and field; malformed types are rejected, never silently accepted.
4. **Install + preview**: copy `pet/` → `src/dsh/client/pets/<id>/` and
   `journey/` → `src/packs/<pack-id>/`, run
   `node scripts/generate-pet-wiring.mjs`, then `pnpm dev` and open
   **`?petPreview=1`** — this is the official Creator preview entry: the
   REAL resident renderer with pet/expression/level/size selectors, so what
   you approve is what ships. Both recipes (`engine-scene` and
   `pose-sprite`) preview through the same component the DSH overlay mounts.
   If a broken pet crashes the render, the page shows a readable error panel
   (with the error message) instead of a blank screen — fix the reported
   problem and reload.
5. **Build**: `pnpm build:dsh && pnpm check:dsh-bundle` — build:dsh
   regenerates the wiring and the DSH asset maps from a directory scan
   automatically, so your pet and its journey appear in the resident menu
   with no registry edits.
6. **Run it in a supported disposable DSH host**: the only supported host is
   the pinned Harness Web source checkout. Set it up once, then install your
   built plugin — all host commands run from inside the host clone via its
   own `pnpm dsh`:

   ```sh
   # one-time host setup (outside the vehicle-pet checkout):
   git clone https://github.com/mayf3/deepseek-harness
   cd deepseek-harness
   git checkout f77b5a2fcebc2d9138f6608a60636f2294868d42   # pinned interop ref
   pnpm install && pnpm build

   # per preview/acceptance run — keep DSH_HOME disposable, never ~/.dsh:
   export DSH_HOME=/tmp/my-pet-dsh-home && mkdir -p "$DSH_HOME"
   pnpm dsh plugin --profile web add <path-to-your-vehicle-pet-checkout>
   pnpm dsh web --port 3081    # prints the URL; open it in a browser
   ```

   In the page: the resident pet appears bottom-right; double-click it for
   the settings menu, where your pet is selectable. Reload the page and the
   selection persists. Uninstall with `pnpm dsh plugin --profile web remove
   @mayf3/vehicle-pet` and restart the profile.

   **Host version mismatch**: a globally installed `dsh` CLI (npm
   `@deepseek-ai/dsh`) is not supported. If `plugin add` succeeds but the
   web boot dies with `Cannot find the native Koffi module` or `Cannot find
   package '@mayf3/vehicle-pet'`, you are running the wrong binary — repeat
   the step above from inside the pinned `deepseek-harness` checkout. See
   [SUPPORTED_ENVIRONMENTS.md](../public/SUPPORTED_ENVIRONMENTS.md).

## Pet id and pack id

- Pet id: lowercase `[a-z][a-z0-9-]*`, unique among bundled pets, and it must
  match your directory name. It is the preference key — pick something
  stable; renaming it later sends existing users back to the default pet
  (their growth data is not lost).
- Pack id: the journey identity, also used in storage receipts. Stable, unique.

## Data only (no code)

A creator pet is configuration + images + copy — never code. The
`assetSource.kind: 'module'` option in the schema is a repository-internal
seam for the bundled reference pets' generated asset modules; creator pets
are **files-only** (`{ kind: 'files', dir: './assets' }`), and both the
validator and the wiring generator reject anything else.

## Art rules (short version)

- Original art only; no third-party characters, logos, or brand text; no
  baked level numerals or UI labels in base art. Scale/progression reads
  best through size, population, environment, and posture.
- Pose sprites: transparent PNG + WebP pairs, 320×540 canvas, named
  `pose-0.png/.webp`, `pose-1.png/.webp`, … The wiring generator measures
  the visible-alpha bounds for the honest pointer hitbox automatically.
- Deterministic pipelines are recommended (script → bytes) and make
  provenance trivial; generative tools are allowed offline, but record the
  route in `pet/PROVENANCE.json`. Runtime and build never call a model.

## Speech rules (short version)

At least one line per locale (`zh-CN`, `en`) for each core category
(`idle`, `working`, `needs-input`, `completed`, `failed`, `milestone`);
`petting`/`welcome`/`ritual` are optional but recommended. Lines are short,
original, and never mention status codes, percentages, or token counts.

## Grade presentation (your choice)

In `pet/pet.json` → `gradePolicy`: `showExactLevelNumber` (default false —
the resident surface stays pet-first; the exact level is always in DOM data
and the Full Journey), `showDescription`, and `insigniaMode`:
`none | wearable` today (`overlay` is rejected by validation until a
renderer implements it). See
[PET_DEFINITION_REFERENCE.md](PET_DEFINITION_REFERENCE.md).
