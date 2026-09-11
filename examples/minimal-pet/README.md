# minimal-pet — the Creator Kit V1 template

One directory = one complete pet: presentation data (`pet/`) + journey
(`journey/`) + license metadata. Everything here is **data and images** —
there is no creator-authored code anywhere in the flow, and **zero edits**
to engine, overlay, scheduler, persistence, or build-script code.

## The five steps (run every command from the repository root)

```sh
# 0. from a checkout of this repository, with dependencies installed:
#    (Node 22+, pnpm 10.28.1)

# 1. copy the template to your own pet directory
cp -r examples/minimal-pet examples/my-pet

# 2. replace configuration, textures, and copy — all inside your directory:
#    - pet/pet.json             your pet id, names, grade policy, pose mapping
#    - pet/levels.json          per-level localized descriptions
#    - pet/speech.json          bilingual lines (six session states + idle at minimum)
#    - pet/assets/              your pose art (320x540, transparent PNG+WebP pairs)
#    - journey/manifest.json    the growth journey (levels, scenes, keepsakes)
#    - journey/assets/          your journey art
#    - pet/PROVENANCE.json      how your art was made (honest disclosure)
#    - LICENSE                  your license statement
#    (the old definition.ts is gone: the wiring is generated from pet.json)

# 3. validate — failures name the exact file and field
pnpm pet:validate examples/my-pet

# 4. install into the bundled locations and PREVIEW THE REAL PET
cp -r examples/my-pet/pet      src/dsh/client/pets/my-pet
cp -r examples/my-pet/journey  src/packs/my-pet-journey
node scripts/generate-pet-wiring.mjs
pnpm dev        # open the printed URL with ?petPreview=1 — the REAL resident
                # renderer (CharacterVisual) with pet/expression/level/size
                # selectors, so you see exactly what ships

# 5. build the DSH plugin (wiring and asset maps regenerate by scan —
#    your pet appears in the resident menu automatically)
pnpm build:dsh && pnpm check:dsh-bundle
```

All commands above are run from the repository root — never `cd` into the
template directory.

## Rules of the road

- **No core edits.** `src/engine/**`, overlay rendering/scheduler/persistence
  cores, pet-id unions, and build scripts stay untouched. If you find
  yourself editing one, stop — that is a bug in this kit, please report it.
- **Data only.** There is no creator-authored TypeScript in this flow: the
  generated wiring modules are tool output and carry a do-not-edit header.
  Pet configuration may not contain or execute JavaScript.
- **Original art only.** No third-party characters, logos, or brand text; no
  baked level numerals in base art (the renderer owns level presentation).
- **Growth is engine-owned.** Thresholds and stage names are journey data;
  the usage points and token economy are shared and must not be changed.

See `docs/creator/GETTING_STARTED.md` and
`docs/creator/PET_DEFINITION_REFERENCE.md` for the full guides.
