# Investigation Record — Generic Pet Engine V1 Inputs

This record persists the external prototype evidence that inputs the proposed
`VEHICLE_PET_PRODUCT_DIRECTION_V1` and `CONFIGURABLE_PET_ENGINE_V1` Specs. It is
descriptive, not normative.

```text
external prototype evidence ≠ vehicle-pet authority
```

The DeepSeek Harness pet-mode prototype is investigation evidence only. It is not
Product Direction, Architecture, implementation authorization, or acceptance
authority in `mayf3/vehicle-pet`, and no DeepSeek Harness worktree participates in
`vehicle-pet` development flow.

## Identity

```text
INVESTIGATION_ID = INV-2026-001
REPOSITORY = mayf3/vehicle-pet
SUBJECT = DeepSeek Harness pet-mode prototype as evidence input for the generic Configurable Pet Engine V1
OPENED_AT = 2026-08-22T03:02:00Z
CLOSED_AT = 2026-08-22T03:06:00Z
OWNER = mayf3
DISPOSITION = reuse
```

## Goal

Determine what the existing autonomous-fleet pet prototype proves at its exact
revision, which of its mechanics generalize to a domain-neutral pet engine, which
parts are vehicle Pack semantics, and which required product capabilities it does
not provide. The answer feeds the two proposed Specs; it does not itself decide
product direction.

## Authority context

```text
RELATED_AUTHORITIES = VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1 (accepted)
                      VEHICLE_PET_PRODUCT_DIRECTION_V1 (proposed)
                      CONFIGURABLE_PET_ENGINE_V1 (proposed)
AUTHORITY_CHANGE_PROPOSED = YES (the two proposed Specs cite this record as evidence)
```

Prototype coordinates:

```text
PROTOTYPE_REPOSITORY = mayf3/deepseek-harness
PROTOTYPE_ADMIN_REPOSITORY = /Users/yanfenma/workspace/github/deepseek-harness
PROTOTYPE_COMMIT = 3084ac2c9b915c62a11b1ee8d15f4599eb235673
PROTOTYPE_PATH = packages/experimental/pet-mode/
```

## Observations

### OBS-INV-001 — Prototype exists at an exact external commit

- Repository: `mayf3/deepseek-harness`
- Exact commit: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Path: `packages/experimental/pet-mode/`
- Method: `git cat-file -e <commit>^{commit}`; `git worktree add --detach` at the commit; `git rev-parse HEAD`; porcelain status
- Result: commit exists; dedicated evidence worktree HEAD equals the commit; worktree clean; the package contains 8 source files, 3 test files, `package.json`, and README files
- Limitation: existence and cleanliness prove coordinates only, not product quality

### OBS-INV-002 — Package test suite passes 36 of 36

- Repository: `mayf3/deepseek-harness`
- Exact commit: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Path: `packages/experimental/pet-mode/tests/`
- Method: `pnpm install --frozen-lockfile` (completed in 12.2s, exit 0), then `pnpm --dir packages/experimental/pet-mode test`; porcelain status after the run
- Result: 3 test files passed — `levels.spec.ts` (16), `persistence.spec.ts` (13), `PetModeApp.spec.tsx` (7); 36/36 tests passed; worktree remained clean
- Limitation: coverage is limited to deterministic progression, persistence tolerance, and rendering basics; no ceremony, daily, or accessibility behavior exists to test

### OBS-INV-003 — Core progression mechanics are generalizable

- Repository: `mayf3/deepseek-harness`
- Exact commit: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Path: `packages/experimental/pet-mode/src/levels.ts`, `packages/experimental/pet-mode/src/persistence.ts`
- Method: read `deriveLevel`, `deriveProgress`, the frozen level table, and the storage layer
- Result: level is purely derived from a frozen threshold table with before/at/after threshold tests; progression caps at the final level even at `Number.MAX_SAFE_INTEGER`; the derived level is never persisted; untrusted storage parses with fallback to initial state on any damage; large fleets render a bounded set of representative nodes (12) while the logical count grows to 1,000,000
- Limitation: generalizability is a structural judgment; the prototype never implemented a second domain to prove it

### OBS-INV-004 — Token naming, level table, vehicle semantics, React shell, and persistence are mixed in one package

- Repository: `mayf3/deepseek-harness`
- Exact commit: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Path: `packages/experimental/pet-mode/`
- Method: inspect package layout, imports, and module boundaries across `src/`
- Result: token-flavored naming (`thresholdTokens`, `totalTokens`), the 12-row vehicle progression table, vehicle rendering, a React application shell, and `localStorage` persistence coexist in one package with no engine/Pack separation
- Limitation: the mix is acceptable for a disposable prototype and is not evidence about how a separated engine would behave

### OBS-INV-005 — Domain vocabulary is entirely vehicle Pack semantics

- Repository: `mayf3/deepseek-harness`
- Exact commit: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Path: `packages/experimental/pet-mode/src/levels.ts`, `packages/experimental/pet-mode/src/VehicleAsset.tsx`
- Method: enumerate exported domain types and table fields
- Result: `SceneKind = 'road-test' | 'fleet-ops'`; `OccupantRole = 'driver' | 'safety-officer' | null`; recurring fields `driver`, `passenger`, `protectionVehicle`, `remoteSupervisorVehicles`, `fleetSize`, `visibleVehicleCount`, `milestone`
- Limitation: none; the vocabulary list is exhaustive for the package source

### OBS-INV-006 — No real Progress Source exists

- Repository: `mayf3/deepseek-harness`
- Exact commit: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Path: `packages/experimental/pet-mode/src/invariant.ts`, `packages/experimental/pet-mode/src/PetModeApp.tsx`
- Method: read the invariant companion registration and the panel control handlers
- Result: progress changes only through local simulation buttons (+1K/+10K/+100K) and a development-only level selector, both writing local state and `localStorage`; the invariant companion is intentionally empty and registers no Harness service, event, tool, or model input
- Limitation: absence in the prototype does not by itself define the future Progress Source contract

### OBS-INV-007 — L8–L12 rely on numbers rather than distinct scale scenes

- Repository: `mayf3/deepseek-harness`
- Exact commit: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Path: `packages/experimental/pet-mode/src/levels.ts`, `packages/experimental/pet-mode/src/PetModeApp.tsx`
- Method: compare the L8–L12 table rows and the fleet scene renderer
- Result: all five rows share scene `fleet-ops`, `visibleVehicleCount` 12, and null occupants; the differences are `fleetSize` (100 → 1,000,000), a logarithmic density style value (`28 + 18·log10(fleetSize)`), stage names, and milestone text
- Limitation: the visual conclusion rests on these code facts; the screenshot board was not measured pixel-wise

### OBS-INV-008 — No Upgrade Receipt, Presentation Journal, ceremony, daily interaction, or Reduced Motion contracts

- Repository: `mayf3/deepseek-harness`
- Exact commit: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Path: `packages/experimental/pet-mode/src/`, `packages/experimental/pet-mode/tests/`
- Method: search source and tests for receipt, journal, ceremony, daily/greeting, and `prefers-reduced-motion` handling
- Result: no matches; level changes render silently with no at-most-once presentation guarantee, no celebration, no daily greeting, and no reduced-motion degradation
- Limitation: none; the search covers the whole package source and tests

### OBS-INV-009 — A seedling domain maps onto the same scene/layer/population model

- Repository: `mayf3/deepseek-harness`
- Exact commit: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Path: `packages/experimental/pet-mode/src/levels.ts` (structural reference)
- Method: analytically map a four-level seed → sprout → tree → forest progression onto the prototype's scene-kind, population-count, density, and threshold model
- Result: the mapping needs only different table rows, copy, and assets; no engine-specific field or branch is required
- Limitation: the mapping is analytical; no seedling implementation was built or tested in the prototype

### OBS-INV-010 — The threshold table and the 100-points-per-km display conversion already exist

- Repository: `mayf3/deepseek-harness`
- Exact commit: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Path: `packages/experimental/pet-mode/src/levels.ts`
- Method: read `TOKENS_PER_KILOMETER` and the mileage display in `PetModeApp.tsx`
- Result: thresholds are 0, 10,000, 30,000, 60,000, 100,000, 180,000, 300,000, 500,000, 800,000, 1,200,000, 1,800,000, 2,500,000; the prototype displays mileage as points divided by 100
- Limitation: the naming is token-flavored although the values are local mock points with no billing meaning

### OBS-INV-011 — The prototype performs no network, model, or Host transport calls

- Repository: `mayf3/deepseek-harness`
- Exact commit: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Path: `packages/experimental/pet-mode/tests/PetModeApp.spec.tsx`
- Method: run the package suite, which includes the test `never invokes network, LLM, or Host transports during interactions`
- Result: the assertion passed as part of the 36/36 run; interactions stay local
- Limitation: assertion scope is limited to the tested interactions under jsdom

## Claims

### CLM-INV-001 — The progression core can be lifted into a domain-neutral engine

- Support state: SUPPORTED
- Supported by: `OBS-INV-002`, `OBS-INV-003`
- Uncertainty: never exercised with a second domain

### CLM-INV-002 — The prototype cannot be adopted as the engine as-is

- Support state: SUPPORTED
- Supported by: `OBS-INV-004`, `OBS-INV-005`
- Uncertainty: none known

### CLM-INV-003 — A passive, model-free pet experience is demonstrable locally

- Support state: SUPPORTED
- Supported by: `OBS-INV-006`, `OBS-INV-011`
- Uncertainty: demonstration covers one domain and one locale

### CLM-INV-004 — Scale transitions, ceremony, daily, and accessibility behavior must be designed new

- Support state: SUPPORTED
- Supported by: `OBS-INV-007`, `OBS-INV-008`
- Uncertainty: none known

### CLM-INV-005 — A second domain is expressible declaratively without engine branches

- Support state: INFERRED
- Supported by: `OBS-INV-009`
- Uncertainty: analytical only; conformance must be proven by the seedling-fixture Pack under the same validator

## Alternatives considered

### ALT-INV-001 — Adopt the prototype package as the product directly

- Benefits: fastest path to a working pet page
- Costs/risks: welds vehicle semantics and token-flavored naming into the engine; blocks any second Pack
- Evidence: `OBS-INV-004`, `OBS-INV-005`

### ALT-INV-002 — Fork the prototype and strip the vehicle semantics

- Benefits: retains the passing test suite
- Costs/risks: the tests themselves encode the vehicle table and copy; stripping is a rewrite with worse provenance
- Evidence: `OBS-INV-002`, `OBS-INV-005`

### ALT-INV-003 — Build the engine fresh, reusing only the frozen patterns

- Benefits: clean engine/Pack boundary; prototype stays untouched external evidence
- Costs/risks: more initial work than forking
- Evidence: `CLM-INV-001`, `CLM-INV-002`

## Disposition

```text
DISPOSITION = reuse
REASON = the prototype is retained as exact-commit external evidence input for the proposed VEHICLE_PET_PRODUCT_DIRECTION_V1 and CONFIGURABLE_PET_ENGINE_V1; ALT-INV-003 is the followed alternative
IMPLEMENTATION_ALLOWED = NO (governed by accepted Specs only)
```

## What would reopen the question

- new evidence: the prototype advances beyond `3084ac2c9b915c62a11b1ee8d15f4599eb235673` with new capabilities relevant to the engine
- changed parent authority: an accepted Spec changes the Progress Source, Pack, or presentation model
- changed operational constraint: a second-domain implementation contradicts the seedling expressibility inference `CLM-INV-005`

## Stable links

- investigation proposal branch: `agent/propose-vehicle-pet-product-and-engine-v1`
- related Specs: `docs/specs/VEHICLE_PET_PRODUCT_DIRECTION_V1.md`, `docs/specs/CONFIGURABLE_PET_ENGINE_V1.md`
- evidence: `mayf3/deepseek-harness` commit `3084ac2c9b915c62a11b1ee8d15f4599eb235673`, path `packages/experimental/pet-mode/`
