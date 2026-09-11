# minimal-pet — the Creator Kit V1 template

One directory = one complete pet: presentation (`pet/`) + journey
(`journey/`) + license metadata. You need **zero edits** to engine,
overlay, scheduler, persistence, or build-script code.

## The five steps

```sh
# 0. from a checkout of this repository, with dependencies installed:
#    (Node 22+, pnpm 10.28.1)

# 1. copy the template to your own pet directory and work there
cp -r examples/minimal-pet examples/my-pet
cd examples/my-pet

# 2. replace configuration, textures, and copy
#    - pet/definition.ts        your pet id, names, grade policy, pose mapping
#    - pet/levels.json          per-level localized descriptions
#    - pet/speech.json          bilingual lines (six session states + idle at minimum)
#    - pet/assets/              your pose art (320x540, transparent PNG+WebP pairs)
#    - journey/manifest.json    the growth journey (levels, scenes, keepsakes)
#    - journey/assets/          your journey art
#    - LICENSE                  your license metadata

# 3. validate (errors point at the exact file and field)
pnpm pet:validate examples/my-pet

# 4. preview in the standalone prototype
#    copy the two halves into the bundled locations:
cp -r examples/my-pet/pet      src/dsh/client/pets/my-pet
cp -r examples/my-pet/journey  src/packs/my-pet-journey
pnpm dev        # then open the printed URL; switch packs/pets in the UI

# 5. build the DSH plugin (wiring AND the DSH asset maps regenerate by
#    directory scan — your pet appears in the resident menu automatically)
pnpm build:dsh && pnpm check:dsh-bundle
```

## Rules of the road

- **No core edits.** `src/engine/**`, overlay rendering/scheduler/persistence
  cores, pet-id unions, and build scripts stay untouched. If you find yourself
  editing one, stop — that is a bug in this kit, please report it.
- **Original art only.** No third-party characters, logos, or brand text; no
  baked level numerals in base art (the renderer owns level presentation).
- **No executable content.** Pet data is configuration + assets + copy.
  `definition.ts` is a declarative manifest in the repository's data idiom —
  it must not contain logic beyond the mapping tables shown in the template.
- **Growth is engine-owned.** Thresholds and stage names are journey data;
  the usage points and token economy are shared and must not be changed.

See `docs/creator/GETTING_STARTED.md` and
`docs/creator/PET_DEFINITION_REFERENCE.md` for the full guides.
