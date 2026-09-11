# vehicle-pet — a configurable desktop pet framework

A generic, passive, non-coercive pet growth framework: declarative Pet Packs
drive everything visible, an external progress source drives growth, and a
DeepSeek Harness Web overlay plugin renders the resident pet. Three pets ship
bundled — the **Vehicle** and **Companion** reference characters (one shared
growth journey) and the **Orb** fixture pet (its own journey), which doubles
as the third-pet proof that a complete pet needs configuration, textures,
copy, and license metadata only.

> **Status: Public Preview.** The framework is feature-complete for the
> preview scope, passing its full verification suite, and licensed under a
> code/assets split (Apache-2.0 / CC BY 4.0 — see below). Production
> deployment and release announcements remain separate project-owner actions.

## What it is

- a framework-neutral TypeScript pet engine with strict snapshot ordering and
  pure level derivation (`src/engine/`), fed by an external progress snapshot
  it can never influence;
- a declarative Pet Pack format (JSON manifest + assets) with an atomic
  validator: levels, thresholds, scenes, keepsakes, and localized copy are
  all pack data (`src/packs/`);
- a generic React presentation layer with reduced-motion and asset fallback
  (`src/react/`);
- a DSH bundle/client adapter that mounts a bottom-right resident pet inside
  Harness Web (`src/dsh/`): two sizes, click/double-click/long-press-petting/
  drag interactions, deterministic gesture arbitration, bounded cursor
  awareness, a quiet ambient behavior layer, daypart weighting, a guilt-free
  welcome-back ritual, and a restrained original speech bubble system;
- a Creator Kit (`examples/minimal-pet/` + `pnpm pet:validate`) so a third
  party can add a complete pet with **zero** edits to engine or overlay code.

## What it reads — and what it never reads

The DSH adapter consumes **structured session metadata only**: live state
(idle / running / needs-input) and terminal turn status (completed / failed /
cancelled), edge-deduplicated. It reads token counts from the host's
counts-only usage seam for growth math.

It never reads prompt bodies, completion bodies, user message content,
reasoning text, credentials, or clipboard, and it never writes to the host
profile. Session activity produces temporary visual reactions only — a turn
is never converted into growth points. See
[PRIVACY_AND_DATA_BOUNDARY.md](docs/public/PRIVACY_AND_DATA_BOUNDARY.md).

## Pets and growth

- Every pet declares its own journey pack: thresholds, stage names, scenes,
  and keepsakes are pack data. Switching pets switches journey by
  declaration; points, ledger, receipts, and each journey's growth state are
  preserved.
- Grade presentation is per-pet policy: whether the exact level number and a
  localized description appear on the resident surface, and whether a
  symbolic insignia is worn. Exact level identity is always available to
  accessibility and in the Full Journey view.
- Bundled pets are brand-neutral by policy; historical provenance records are
  kept intact. See [ASSET_AND_BRAND_POLICY.md](docs/public/ASSET_AND_BRAND_POLICY.md).

## Install (DeepSeek Harness Web)

Requirements: see [SUPPORTED_ENVIRONMENTS.md](docs/public/SUPPORTED_ENVIRONMENTS.md).

```sh
dsh plugin --profile web add github:mayf3/vehicle-pet#<ref>   # fixed remote ref
# or, from a local checkout:
dsh plugin --profile web add <path-to-this-checkout>
dsh web    # restart the Web profile after add / update / remove
```

Remove with `dsh plugin --profile web remove @mayf3/vehicle-pet` and restart;
after removal no overlay DOM, styles, listeners, or subscriptions remain. To
roll back, pin the previous ref the same way — growth data survives both
directions.

The overlay offers three pets in its settings menu (double-click the pet),
`SMALL`/`LARGE` sizes, reduced-motion (explicit or follow-system), the Full
Journey dialog, and a collapse launcher. Pinned compatibility:
`mayf3/deepseek-harness@f77b5a2fcebc2d9138f6608a60636f2294868d42`
(DeepSeek Harness Web `0.1.0-rc.8`, React 18).

## Make your own pet

```sh
cp -r examples/minimal-pet examples/my-pet     # configuration + textures + copy
pnpm pet:validate examples/my-pet              # errors name the exact field
# follow examples/minimal-pet/README.md for preview + build
```

No engine or overlay code changes are required — that is a verified contract
(`THIRD_PARTY_NO_CORE_EDIT_ACCEPTANCE`). Guides:
[GETTING_STARTED.md](docs/creator/GETTING_STARTED.md) ·
[PET_DEFINITION_REFERENCE.md](docs/creator/PET_DEFINITION_REFERENCE.md).

## Architecture

```text
Progress Source → Pet Engine → Pet Pack (journey)      ← declarative data
                                  ↓
        Pet Presentation (per-pet visuals, speech, policy) ← declarative data
                                  ↓
     Prototype Shell (standalone)   DSH bundle/client adapter → Harness Web
```

```text
src/engine/     domain-neutral engine, frozen schema, validation
src/react/      generic React presentation
src/packs/      bundled declarative Packs (discovered by directory scan)
src/dsh/        DSH adapter: resident surface + declarative pet presentations
src/prototype/  MockProgressSource browser shell
examples/       Creator Kit template
```

The Engine does not import React, the prototype, or a concrete Pack. Adding a
bundled Pack or pet means adding a data directory — registries are generated
by directory scan.

## Development and verification

```sh
pnpm install --frozen-lockfile
pnpm dev                 # standalone prototype (?showcase=1 ?pack=… ?points=… ?reducedMotion=1)
pnpm verify              # typecheck + lint + unit/dom + e2e + build + contracts + asset determinism
pnpm verify:dsh          # type/lint/contracts/build/bundle/package/lifecycle/unit/dom/pinned-browser e2e
pnpm pet:validate examples/minimal-pet
```

`pnpm assets:check`, `assets:dsh-check`, `assets:expression-check`, and
`assets:character-check` regenerate every generated raster from their
deterministic recipes and byte-compare the checked-in outputs. Contract
checks enforce dependency direction, domain neutrality, brand-neutral current
identity, and the third-pet zero-core-edit path.

## License (split: code vs assets)

- **Code, build scripts, tests, and code documentation:** Apache-2.0 (`LICENSE`).
- **Original project assets** — bundled pet data, artwork, insignia, and copy:
  **CC BY 4.0** (`LICENSE.assets`). Art provenance ships with each pet and in
  `NOTICE`; parts were produced with recorded AI assistance, and the license
  is granted only to the extent of the owner's actual rights.
- **Third-party brands, works, and historical evidence are NOT relicensed**
  and remain the property of their owners (named in `NOTICE`; see
  [ASSET_AND_BRAND_POLICY.md](docs/public/ASSET_AND_BRAND_POLICY.md)).
- Creator pets keep their own license/attribution metadata — your pet stays
  your property.
- Security/privacy boundary and classification rules:
  [PRIVACY_AND_DATA_BOUNDARY.md](docs/public/PRIVACY_AND_DATA_BOUNDARY.md).
- Not supported (by design): marketplace/remote pack installation, runtime
  untrusted code, arbitrary JavaScript in pet data, multi-pet on one
  resident, audio/TTS, Live2D/model-driven animation, mobile, telemetry.
