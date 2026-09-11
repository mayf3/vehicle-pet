# Creator Guide — Getting Started

Audience: a developer who can run `pnpm` and copy files. You do **not** need
to read the governing Specs or any engine code to ship a pet.

## What a pet is made of

| Piece | Lives in | You provide |
|---|---|---|
| Journey (growth) | `src/packs/<your-pack-id>/manifest.json` + `journey/assets/` | levels, thresholds, stage names, scenes, keepsakes, alt text |
| Presentation | `src/dsh/client/pets/<your-pet-id>/definition.ts` + data + assets | id, names, recipe, pose mapping, grade policy, speech, license |
| License/provenance | `LICENSE`, provenance JSON in your directories | your license and art origin statement |

Everything else — registry, menu, schedulers, rendering, persistence — is
generic and discovered by directory scan.

## The five steps

1. **Copy** `examples/minimal-pet` to `examples/my-pet`.
2. **Replace** configuration, textures, and copy (all inside your directory).
3. **Validate**: `pnpm pet:validate examples/my-pet`. Failures name the exact
   file and field.
4. **Preview**: copy `pet/` → `src/dsh/client/pets/<id>/` and `journey/` →
   `src/packs/<pack-id>/`, run `pnpm dev`, pick your pack in the prototype UI.
5. **Build**: `pnpm build:dsh && pnpm check:dsh-bundle` — build:dsh
   regenerates the wiring and the DSH asset maps from a directory scan
   automatically, so your pet and its journey appear in the resident menu
   with no registry edits. (The generated files under `src/dsh/client/`
   carry a "do not edit" header on purpose: re-running the build is the only
   supported way to change them.) Note `pet/definition.ts` imports resolve
   only after step 4's install — validation in step 3 works in place.

## Pet id and pack id

- Pet id: lowercase `[a-z][a-z0-9-]*`, unique among bundled pets. It is the
  preference key — pick something stable; renaming it later sends existing
  users back to the default pet (their growth data is not lost).
- Pack id: the journey identity, also used in storage receipts. Stable, unique.

## Art rules (short version)

- Original art only; no third-party characters, logos, or brand text; no
  baked level numerals or UI labels in base art. Scale/progression reads best
  through size, population, environment, and posture — the renderer owns
  level presentation.
- Pose sprites: transparent PNG + lossless WebP pairs, 320×540 canvas,
  one image per pose index; declare the visible-alpha bounds per pose (the
  honest pointer hitbox).
- Deterministic pipelines are recommended (script → bytes) and make
  provenance trivial; generative tools are allowed offline, but record the
  route in your provenance file. Runtime and build never call a model.

## Speech rules (short version)

At least one line per locale (`zh-CN`, `en`) for each core category
(`idle`, `working`, `needs-input`, `completed`, `failed`, `milestone`);
`petting`/`welcome`/`ritual` are optional but recommended. Lines are short,
original, and never mention status codes, percentages, or token counts.

## Grade presentation (your choice)

`showExactLevelNumber` (default false — the resident surface stays pet-first;
the exact level is always in DOM data and the Full Journey),
`showDescription`, and `insigniaMode: none | overlay | wearable`. See
[PET_DEFINITION_REFERENCE.md](PET_DEFINITION_REFERENCE.md).
