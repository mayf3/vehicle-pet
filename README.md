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

V1 has no real Token integration, model calls, DeepSeek Harness adapter, remote Pack support, audio, multi-pet, or external network dependency.

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

## Architecture

```text
Progress Source → Pet Engine → Pet Pack → Prototype Shell
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
