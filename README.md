# Configurable Pet Engine V1

A generic, passive, non-coercive pet growth engine driven by an external progress snapshot and declarative first-party Pet Packs.

## Included

- framework-neutral TypeScript engine with strict snapshot ordering and pure level derivation;
- strict `PetPackManifestV1` JSON Schema and atomic validator;
- deterministic bounded `SceneRenderPlan` renderer;
- IndexedDB atomic Presentation Journal, upgrade receipts, daily greeting, and keepsakes;
- generic React presentation layer with reduced motion and asset fallback;
- `autonomous-fleet` production Pack and `seedling-fixture` conformance Pack;
- local `MockProgressSource` prototype and ten-state showcase.

V1 has no real Token integration, model calls, remote Pack support, audio, multi-pet, or external network dependency. Real Token statistics remain a separate future Progress Source Spec.

## Requirements

- Node.js 22+
- pnpm 10.28.1
- Chrome for Playwright E2E

## Run

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Useful prototype parameters:

```text
?showcase=1
?pack=autonomous-fleet
?pack=seedling-fixture
?points=<safe integer>
?reducedMotion=1
```

## Verification

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
pnpm check:contracts
pnpm assets:check
pnpm verify
```

`pnpm assets:check` recreates every Pack raster from deterministic local recipes and compares the checked-in WebP/PNG outputs. The contract and architecture checks enforce dependency direction, domain neutrality, and the absence of remote/model/Host integration surfaces.

## DeepSeek Harness Web overlay plugin

The same Engine, React product layer, and both bundled Packs also ship as an
external DSH bundle/client plugin that mounts a bottom-right floating pet
inside Harness Web (`shell.overlay`, 112px pet / 320px compact panel / 36px
collapsed launcher, in-Harness full-journey dialog, structured session
reactions that never touch progression). The client bundle uses the
host-provided React 18 identity, inlines every Pack asset as data URLs, and
runs without any dev server. Only `src/dsh/**` imports Harness contracts.

### Build the plugin

```sh
pnpm build:dsh          # emits lib/index.js, lib/client.js, lib/types
pnpm check:dsh-bundle   # React-singleton / no-createRoot / data-URL / determinism gate
pnpm check:dsh-package    # npm pack allowlist gate
pnpm check:dsh-lifecycle  # disposable add/update/remove/reinstall gate
pnpm verify:dsh           # type/lint/contracts/build/package/lifecycle/unit/DOM/pinned-browser E2E
```

### Install into a Harness Web profile

```sh
dsh plugin --profile web add <path-to-this-checkout>   # local checkout
dsh plugin --profile web add github:mayf3/vehicle-pet#<ref>  # fixed remote ref
# restart the Web profile after add / update / remove:
dsh web
```

Remove with `dsh plugin --profile web remove @mayf3/vehicle-pet` and restart;
after removal no overlay DOM, styles, listeners, or subscriptions remain.
Harness session activity (running / needs-input / completed / failed /
cancelled) produces temporary visual reactions only — a turn, tool call, or
task is never converted into growth points, and real token usage is not read.
Pinned compatibility: `mayf3/deepseek-harness@f77b5a2fcebc2d9138f6608a60636f2294868d42`
(DeepSeek Harness Web `0.1.0-rc.8`, React 18).

### DSH browser acceptance

`pnpm test:dsh:e2e` launches the pinned Harness Web in a disposable
`$DSH_HOME` with the local plugin installed and a scripted mock LLM, then
drives the full overlay acceptance matrix in a real browser.

## Architecture

```text
Progress Source → Pet Engine → Pet Pack → Prototype Shell (standalone)
                                 └─ DSH bundle/client adapter → Harness Web shell.overlay
```

```text
src/engine/       domain-neutral engine and frozen schema
src/react/        generic React presentation
src/packs/        first-party bundled declarative Packs
src/prototype/    MockProgressSource browser shell
```

The Engine does not import React, the prototype, or a concrete Pack. The bundled application registry supplies Packs at assembly time.

## Conformance

See [`docs/conformance/CONFIGURABLE_PET_ENGINE_V1_CONFORMANCE.md`](docs/conformance/CONFIGURABLE_PET_ENGINE_V1_CONFORMANCE.md) and [`docs/conformance/CONFIGURABLE_PET_ENGINE_V1_SHOWCASE.webp`](docs/conformance/CONFIGURABLE_PET_ENGINE_V1_SHOWCASE.webp).

Author conformance evidence is complete. Independent engine and experience audits have not yet run.
