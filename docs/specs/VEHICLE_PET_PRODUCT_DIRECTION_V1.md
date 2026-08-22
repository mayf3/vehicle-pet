---
spec_id: VEHICLE_PET_PRODUCT_DIRECTION_V1
status: proposed
spec_kind: invariant
authority_level: governing_spec
implementation_authority: none
scope:
  - mayf3/vehicle-pet
governed_by:
  - VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1
external_authorities: []
supersedes: []
superseded_by: null
owners:
  - mayf3
---

# VEHICLE_PET_PRODUCT_DIRECTION_V1

## 1. Goal

Freeze the Owner-adopted product direction for `mayf3/vehicle-pet`: a generic,
passive, non-coercive pet growth engine whose progression is driven entirely by an
external Progress Source and whose standard pets are replaced by declarative,
first-party, bundled Pet Packs. This Spec is a `proposed` candidate reviewed
together with `CONFIGURABLE_PET_ENGINE_V1` in the same candidate Head. It carries
`implementation_authority: none` and authorizes no code.

## 2. Scope and non-goals

In scope:

- the product form and the core product model
  `External Progress Source → Configurable Pet Engine → Declarative Pet Pack → Host / Prototype Shell`;
- Pack trust, distribution, and capability policy for V1;
- the passive, non-coercive experience principles every Pack must deliver;
- localization and asset-format product policy;
- the explicit deferral boundary for real Token statistics, DeepSeek Harness
  integration, cross-device sync, multi-pet, audio, and marketplace features;
- the V1 Pack lineup: `autonomous-fleet` (first production Pack) and
  `seedling-fixture` (conformance Pack).

Out of scope:

- engine internals, data contracts, rendering caps, presentation journal
  mechanics, and every other implementation-level obligation, which belong to
  `CONFIGURABLE_PET_ENGINE_V1`;
- product code, assets, tests, or build files of any kind;
- real Token accounting, billing, or any model-call behavior.

## 3. Authority and dependencies

This Spec is governed by `VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1`. The
external `mayf3/deepseek-harness` prototype at commit
`3084ac2c9b915c62a11b1ee8d15f4599eb235673` is investigation evidence recorded in
`docs/investigations/GENERIC_PET_ENGINE_V1_INPUTS.md`; it is not a parent
authority and not implementation input.

The following Owner product-direction parameters are adopted with this proposal:

```text
REPOSITORY_NAME = vehicle-pet
REPOSITORY_RENAME = NO
PRODUCT_FORM = 通用、被动、非强迫式 Pet 养成引擎
CORE_PRODUCT_MODEL = External Progress Source → Configurable Pet Engine → Declarative Pet Pack → Host / Prototype Shell
FIRST_PRODUCTION_PACK = autonomous-fleet
SECOND_CONFORMANCE_PACK = seedling-fixture
ENGINE_MUST_BE_PET_DOMAIN_NEUTRAL = YES
PACK_REPLACEMENT_REQUIRES_ENGINE_CHANGE = NO
REAL_TOKEN_ACCOUNTING_IN_V1 = OUT_OF_SCOPE
V1_PROGRESS_SOURCE = MockProgressSource
FUTURE_TOKEN_INTEGRATION = 单独的 Progress Source Spec 和实现
PET_SYSTEM_MAY_TRIGGER_MODEL_CALLS = NO
PET_SYSTEM_MAY_TRIGGER_TOKEN_CONSUMPTION = NO
ACTIVE_PET_COUNT = 1
PACK_SWITCH_SHARES_PROGRESS = YES
PACK_SWITCH_RESETS_PROGRESS = NO
MULTI_PET = OUT_OF_SCOPE
PACK_TRUST_MODEL = FIRST_PARTY_BUNDLED_ONLY
REMOTE_PACK_DOWNLOAD = NO
PACK_MARKETPLACE = NO
PACK_EXECUTABLE_CODE = NO
PACK_REACT_COMPONENT = NO
PACK_CSS = NO
PACK_SCRIPT_OR_CALLBACK = NO
PACK_NETWORK_OR_MODEL_ACCESS = NO
SUPPORTED_LOCALES = zh-CN, en
DEFAULT_LOCALE = zh-CN
PACK_ASSET_FORMATS = WebP primary, PNG fallback
PACK_PROVIDED_SVG = NO
ENGINE_OWNED_STATIC_SVG_ICONS = YES
SPRITE_SHEET = OUT_OF_SCOPE_V1
AUDIO = OUT_OF_SCOPE_V1
CROSS_DEVICE_SYNC = OUT_OF_SCOPE_V1
HUNGER_OR_DECAY = NO
STREAK_OR_ABSENCE_PENALTY = NO
SHOP_CURRENCY_GACHA_TASK_SYSTEM = NO
ENGINE_CAP_PER_POPULATION = 32
ENGINE_CAP_PER_PET = 64
```

Upgrade and daily-experience Owner decisions:

```text
UPGRADE_RECEIPT_OWNER = Pet Engine
PRESENTATION_JOURNAL_OWNER = Pet Engine storage adapter
PRESENTATION_CONSISTENCY_SCOPE = local device only
UPGRADE_DELIVERY_PRIORITY = at-most-once; never duplicate
JOURNAL_POLICY = consume-before-play
KNOWN_TRADEOFF = a crash after consume may skip a celebration, but must not repeat it
MULTI_LEVEL_UPGRADE_POLICY = render final level immediately, then present one merged ceremony
MAX_UPGRADE_BEATS = 3
MAX_UPGRADE_PRESENTATION_SECONDS = 3
DAILY_TIMEZONE = device local timezone
DAILY_VARIANT_CHANGE = on next mount, visibility regain, or interaction after local day changes
MIDNIGHT_FORCED_TRANSITION = NO
REDUCED_MOTION = REQUIRED
AUDIO_IN_V1 = NO
```

## 4. Current State

### STATE-DIR-001 — No product implementation exists

- Subject: `mayf3/vehicle-pet` product tree
- As of commit: `58adc4b930f0236fc194a524bb8547d552369471`
- Environment: `origin/main` after governance adoption merge
- Observed at: `2026-08-22T03:03:00Z`
- Projection: the repository contains governance files and docs skeletons only; product implementation is `NOT_STARTED`
- Basis: `OBS-DIR-006`

### STATE-DIR-002 — External prototype exists as evidence only

- Subject: DeepSeek Harness pet-mode prototype
- As of commit: `mayf3/deepseek-harness` `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Environment: detached read-only evidence worktree
- Observed at: `2026-08-22T03:04:12Z`
- Projection: the prototype passes 36/36 tests and demonstrates feasibility, but is not authority and not the vehicle-pet implementation
- Basis: `OBS-DIR-001`, `docs/investigations/GENERIC_PET_ENGINE_V1_INPUTS.md`

## 5. Observations

### OBS-DIR-001 — External prototype exists at an exact commit and passes its tests

- Subject: `packages/experimental/pet-mode/` in `mayf3/deepseek-harness`
- Source revision: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Environment: detached evidence worktree, frozen-lockfile install
- Observed at: `2026-08-22T03:04:12Z`
- Method: exact-commit checkout, `pnpm install --frozen-lockfile`, package test run
- Result: 3 test files, 36/36 tests passed; worktree clean before and after
- Provenance: `docs/investigations/GENERIC_PET_ENGINE_V1_INPUTS.md` `OBS-INV-001`, `OBS-INV-002`

### OBS-DIR-002 — The prototype's progression core is domain-neutral in mechanics

- Subject: prototype level derivation, capping, persistence tolerance, representative nodes
- Source revision: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Environment: source inspection of `src/levels.ts`, `src/persistence.ts`
- Observed at: `2026-08-22T03:05:00Z`
- Method: structural reading of derivation, capping, and storage code
- Result: derivation is pure and table-driven; caps at the final level; derived level never persisted; damaged storage falls back safely; bounded representative nodes express large populations
- Provenance: investigation record `OBS-INV-003`

### OBS-DIR-003 — The prototype welds vehicle semantics into one package

- Subject: prototype package structure and vocabulary
- Source revision: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Environment: source inspection of `src/levels.ts`, `src/VehicleAsset.tsx`, `src/PetModeApp.tsx`, `src/persistence.ts`
- Observed at: `2026-08-22T03:05:00Z`
- Method: package layout and vocabulary enumeration
- Result: token-flavored naming, the vehicle table, `driver`/`passenger`/`protectionVehicle`/`fleetSize`/`road-test`/`fleet-ops` semantics, the React shell, and persistence coexist with no engine/Pack boundary
- Provenance: investigation record `OBS-INV-004`, `OBS-INV-005`

### OBS-DIR-004 — The prototype has no real Progress Source and no model access

- Subject: prototype progress inputs and side effects
- Source revision: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Environment: source and test inspection
- Observed at: `2026-08-22T03:05:00Z`
- Method: read controls, invariant companion, and interaction tests
- Result: progress changes only through local simulation controls; no Harness service, network, LLM, or Host transport is invoked
- Provenance: investigation record `OBS-INV-006`, `OBS-INV-011`

### OBS-DIR-005 — The prototype lacks scale transitions, ceremony, daily, and accessibility behavior

- Subject: prototype high-level presentation and interaction contracts
- Source revision: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Environment: source and test search
- Observed at: `2026-08-22T03:05:00Z`
- Method: compare L8–L12 rows; search for receipt, journal, ceremony, daily, and reduced-motion handling
- Result: L8–L12 differ mainly by numbers and copy; no upgrade ceremony, at-most-once delivery, daily greeting, or reduced-motion degradation exists
- Provenance: investigation record `OBS-INV-007`, `OBS-INV-008`

### OBS-DIR-006 — The vehicle-pet repository contains no product code

- Subject: `mayf3/vehicle-pet` tree
- Source revision: `58adc4b930f0236fc194a524bb8547d552369471`
- Environment: `origin/main` worktree
- Observed at: `2026-08-22T03:03:00Z`
- Method: list the tree at the base commit
- Result: only `AGENTS.md`, `.agents/**`, and `docs/**` exist; no `src/`, `packages/`, `apps/`, `public/`, `assets/`, or dependency files
- Provenance: worktree listing at the exact base commit

## 6. Claims and assumptions

### CLM-DIR-001 — A domain-neutral engine driven by external progress can deliver the pet experience

- Support state: SUPPORTED
- Supported by evidence: `EVD-DIR-001`
- Contradicted by evidence: NONE
- Uncertainty: never exercised with a second production Pack; `seedling-fixture` exists to retire this risk under conformance

### CLM-DIR-002 — The prototype cannot serve as the vehicle-pet engine

- Support state: SUPPORTED
- Supported by evidence: `EVD-DIR-002`
- Contradicted by evidence: NONE
- Uncertainty: none known

### CLM-DIR-003 — A passive, model-free pet experience is demonstrable locally

- Support state: SUPPORTED
- Supported by evidence: `EVD-DIR-003`
- Contradicted by evidence: NONE
- Uncertainty: demonstration covers one domain, one locale, and local-device persistence only

### CLM-DIR-004 — Ceremony, daily, and accessibility capabilities require new design

- Support state: SUPPORTED
- Supported by evidence: `EVD-DIR-004`
- Contradicted by evidence: NONE
- Uncertainty: none known

## 7. Evidence relations

### EVD-DIR-001 — Prototype mechanics support the generalizable-engine claim

- Source observations: `OBS-DIR-001`, `OBS-DIR-002`
- Target: `CLM-DIR-001`
- Relation: SUPPORTS
- Bound coordinates: `mayf3/deepseek-harness` `3084ac2c9b915c62a11b1ee8d15f4599eb235673`, observed `2026-08-22T03:04:12Z`
- Strength/sufficiency: sufficient for the mechanical core; insufficient for multi-Pack conformance
- Limitations: single domain, single locale, local device only
- Provenance: investigation record `OBS-INV-001`–`OBS-INV-003`

### EVD-DIR-002 — Prototype structure supports the cannot-adopt-as-is claim

- Source observations: `OBS-DIR-003`
- Target: `CLM-DIR-002`
- Relation: SUPPORTS
- Bound coordinates: `mayf3/deepseek-harness` `3084ac2c9b915c62a11b1ee8d15f4599eb235673`, observed `2026-08-22T03:05:00Z`
- Strength/sufficiency: exhaustive vocabulary and layout enumeration
- Limitations: none known
- Provenance: investigation record `OBS-INV-004`, `OBS-INV-005`

### EVD-DIR-003 — Prototype behavior supports the passive-experience claim

- Source observations: `OBS-DIR-004`
- Target: `CLM-DIR-003`
- Relation: SUPPORTS
- Bound coordinates: `mayf3/deepseek-harness` `3084ac2c9b915c62a11b1ee8d15f4599eb235673`, observed `2026-08-22T03:05:00Z`
- Strength/sufficiency: source inspection plus passing interaction tests
- Limitations: jsdom-scoped assertions
- Provenance: investigation record `OBS-INV-006`, `OBS-INV-011`

### EVD-DIR-004 — Prototype gaps support the new-design claim

- Source observations: `OBS-DIR-005`
- Target: `CLM-DIR-004`
- Relation: SUPPORTS
- Bound coordinates: `mayf3/deepseek-harness` `3084ac2c9b915c62a11b1ee8d15f4599eb235673`, observed `2026-08-22T03:05:00Z`
- Strength/sufficiency: whole-package search with zero matches
- Limitations: none known
- Provenance: investigation record `OBS-INV-007`, `OBS-INV-008`

## 8. Decisions

### DEC-DIR-001 — Product form is a generic, passive, non-coercive pet engine

- Decision owner: `mayf3`
- Decision: `vehicle-pet` ships a reusable pet growth engine, not a vehicle-specific page; the pet never demands attention.
- Rejected alternative: a dedicated autonomous-fleet demo page.
- Reason: the engine/Pack split makes a second pet a content change, and passive design avoids compulsion mechanics.
- Owner input remaining: NONE

### DEC-DIR-002 — Progress is external; V1 uses MockProgressSource

- Decision owner: `mayf3`
- Decision: all progression comes from an external Progress Source; V1 ships `MockProgressSource`; the pet system never triggers model calls or Token consumption; real Token integration is a separate future Progress Source Spec and implementation.
- Rejected alternative: engine-owned token counters or DSH-coupled progress in V1.
- Reason: keeps the engine domain- and billing-neutral and preserves a clean seam for real integration.
- Owner input remaining: NONE

### DEC-DIR-003 — One active pet with shared, never-resetting progress

- Decision owner: `mayf3`
- Decision: `ACTIVE_PET_COUNT = 1`; Pack switches share `progressPoints` and never reset or copy progress; multi-pet is out of scope.
- Rejected alternative: per-Pack progress or multiple simultaneous pets.
- Reason: a single shared growth narrative across packs is simpler and loss-free for the user.
- Owner input remaining: NONE

### DEC-DIR-004 — The experience is explicitly non-coercive

- Decision owner: `mayf3`
- Decision: no hunger or decay, no streak or absence penalty, no loss mechanics, no shop/currency/gacha/task system, and no red-dot recall pressure.
- Rejected alternative: retention-driven compulsion mechanics.
- Reason: the product rewards real external progress; it must not manufacture anxiety.
- Owner input remaining: NONE

### DEC-DIR-005 — Packs are declarative, first-party, and bundled

- Decision owner: `mayf3`
- Decision: V1 accepts only first-party bundled Packs; Packs are strictly declarative data with local assets; no executable code, React components, CSS, scripts, callbacks, network, or model access; remote download and marketplace are out of scope.
- Rejected alternative: scriptable or remotely installable Packs.
- Reason: declarative data keeps validation total and the trust boundary closed.
- Owner input remaining: NONE

### DEC-DIR-006 — Deferred capabilities require separate Specs

- Decision owner: `mayf3`
- Decision: real Token statistics, DeepSeek Harness adapters, cross-device sync, multi-pet, audio, sprite sheets, and marketplace features are deferred and MUST be established by separate Specs rather than implied here.
- Rejected alternative: bundling future integration decisions into this Spec.
- Reason: this Spec must remain decidable now; each integration carries its own authority questions.
- Owner input remaining: NONE

### DEC-DIR-007 — V1 Pack lineup is autonomous-fleet plus seedling-fixture

- Decision owner: `mayf3`
- Decision: `autonomous-fleet` is the first production Pack (12 levels, mock thresholds); `seedling-fixture` is the conformance Pack proving engine neutrality.
- Rejected alternative: shipping only the production Pack.
- Reason: a second domain under the same validator is the cheapest proof that the engine is domain-neutral.
- Owner input remaining: NONE

### DEC-DIR-008 — Localization and asset policy

- Decision owner: `mayf3`
- Decision: supported locales are `zh-CN` (default) and `en`; Pack assets are WebP primary with PNG fallback; Packs provide no SVG; the Engine owns static SVG icons; sprite sheets and audio are out of scope for V1.
- Rejected alternative: Pack-provided SVG or animation code.
- Reason: bounded formats and engine-owned icons keep Packs data-only.
- Owner input remaining: NONE

### DEC-DIR-009 — Upgrade and daily experience are engine-owned and at-most-once

- Decision owner: `mayf3`
- Decision: the Engine owns Upgrade Receipts and the Presentation Journal (local device only); delivery is at-most-once with consume-before-play (a crash after consume may skip a celebration but never repeats it); multi-level upgrades render the final level immediately and present one merged ceremony within 3 beats and 3 seconds; the daily variant uses the device-local timezone and changes on the next mount, visibility regain, or interaction after the local day changes, with no midnight forced transition; reduced motion is required; no audio in V1.
- Rejected alternative: Host-owned ceremony state or replayable celebrations.
- Reason: engine ownership with at-most-once delivery prevents duplicate celebrations without introducing cross-device claims.
- Owner input remaining: NONE

### DEC-DIR-010 — Product implementation remains blocked until authority completes

- Decision owner: `mayf3`
- Decision: product implementation stays `NOT_STARTED` until this Spec and `CONFIGURABLE_PET_ENGINE_V1` are both accepted and present on `main`.
- Rejected alternative: starting implementation from this proposal.
- Reason: governance requires accepted, merged authority before non-mechanical implementation.
- Owner input remaining: NONE

## 9. Contracts

### CTR-DIR-001 — Generic Pet Engine, not a vehicle-specific page

`vehicle-pet` MUST be a generic Pet Engine. The repository's product identity MUST NOT be a vehicle-only page, and the Engine MUST NOT depend on any single Pack's semantics for its correctness.

### CTR-DIR-002 — Pack replacement is declarative only

Replacing the standard Pet MUST require only a declarative Pet Pack, bilingual copy, and local assets. A valid Pack replacement MUST NOT modify Engine source, Engine schema, or Engine tests.

### CTR-DIR-003 — External progress; no model calls

Pet progression MUST come from an external Progress Source. The pet system MUST NOT actively call models, and MUST NOT create or trigger Token consumption. V1's only Progress Source MUST be `MockProgressSource`.

### CTR-DIR-004 — autonomous-fleet is a Pack, not built-in semantics

`autonomous-fleet` MUST be the first production Pack delivered as Pack data. Its vehicle narrative, thresholds, copy, and assets MUST NOT become Engine built-in semantics.

### CTR-DIR-005 — Single active Pack with shared progress

V1 MUST have exactly one active Pack at a time. Switching Packs MUST share the same `progressPoints` and MUST NOT reset, copy, or fork progress.

### CTR-DIR-006 — Non-coercive experience

The product MUST NOT include hunger or decay, streak or absence penalties, loss or punishment mechanics, shop/currency/gacha/task systems, or red-dot recall pressure. The pet MUST NOT force interaction.

### CTR-DIR-007 — Mandatory per-Pet experience baseline

Every Pet MUST provide: a single clear subject visual focus; light idle motion; within-level progress state; one non-modal greeting on the first open of each local day; short feedback after normal Host activity completion; click or tap feedback; unlockable milestone keepsakes; and accessibility degradation. Every Pet MUST remain free of punishment and MUST NOT call models.

### CTR-DIR-008 — First-party bundled Packs only in V1

V1 MUST accept only first-party Packs bundled with the application release. Third-party Packs, remote Pack download, and any Pack marketplace MUST NOT exist in V1.

### CTR-DIR-009 — Deferred integrations require separate Specs

Real Token statistics, DeepSeek Harness adapters, and cross-device sync MUST NOT be implemented under this Spec or implied by Engine V1. Each MUST be established by its own accepted Spec before implementation.

### CTR-DIR-010 — No implementation authority

This Spec has `implementation_authority: none`. Product implementation MUST remain `NOT_STARTED` while this Spec is `proposed`, and acceptance of this Spec alone MUST NOT authorize code.

## 10. Acceptance

### ACC-DIR-001 — Engine neutrality is reviewable

- Contracts: `CTR-DIR-001`
- Method: review Engine scope and conformance evidence that a non-vehicle Pack runs unmodified
- Environment: accepted Engine V1 with both bundled Packs
- Required evidence: `CONFIGURABLE_PET_ENGINE_V1` conformance records for `seedling-fixture`
- Expected result: the Engine contains no vehicle-domain rules and a second domain works without Engine changes
- Failure condition: Engine correctness depends on any single Pack's domain semantics

### ACC-DIR-002 — Declarative Pack replacement

- Contracts: `CTR-DIR-002`
- Method: diff Engine source, schema, and tests before/after adding or replacing a valid Pack
- Environment: Engine V1 repository
- Required evidence: Pack-only changed-path lists
- Expected result: zero Engine file changes for a valid Pack replacement
- Failure condition: any Engine source, schema, or test edit is required to install a valid Pack

### ACC-DIR-003 — External progress boundary

- Contracts: `CTR-DIR-003`
- Method: static and runtime audit of pet-system code for model, network, or Token-consuming calls; enumerate V1 Progress Sources
- Environment: Engine V1 and prototype shell
- Required evidence: audit output and source inventory
- Expected result: no model or Token-consuming call sites exist; V1 registers only `MockProgressSource`
- Failure condition: any model call, Token consumption trigger, or non-mock V1 Progress Source appears

### ACC-DIR-004 — Fleet Pack is data

- Contracts: `CTR-DIR-004`
- Method: locate the autonomous-fleet narrative, thresholds, copy, and assets; search Engine code for fleet vocabulary
- Environment: Engine V1 repository
- Required evidence: Pack manifest and Engine vocabulary search
- Expected result: all fleet facts live in the Pack; Engine code contains no fleet semantics
- Failure condition: any level fact, threshold, or narrative string is compiled into the Engine

### ACC-DIR-005 — Shared progress across Pack switches

- Contracts: `CTR-DIR-005`
- Method: switch Packs with fixed `progressPoints` and inspect stored progress
- Environment: Engine V1 with both bundled Packs
- Required evidence: switch test transcript
- Expected result: one active Pack at a time; identical `progressPoints` after switching; no reset, copy, or fork
- Failure condition: progress changes, forks, or more than one Pack is simultaneously active

### ACC-DIR-006 — No compulsion mechanics

- Contracts: `CTR-DIR-006`
- Method: inspect product vocabulary, state model, and UI for hunger, decay, streaks, penalties, loss, shop, currency, gacha, tasks, and red dots
- Environment: Engine V1 UI and state
- Required evidence: feature inventory and state-model review
- Expected result: none of the listed mechanics exist
- Failure condition: any compulsion mechanic or forced interaction appears

### ACC-DIR-007 — Experience baseline per Pet

- Contracts: `CTR-DIR-007`
- Method: exercise each bundled Pet and check subject focus, idle motion, within-level progress, daily greeting, Host activity feedback, click feedback, milestone keepsakes, and reduced-motion degradation
- Environment: Engine V1 with each bundled Pack, reduced motion on and off
- Required evidence: per-Pack interaction transcript
- Expected result: all baseline items present for every bundled Pet
- Failure condition: any bundled Pet misses a baseline item or calls a model

### ACC-DIR-008 — Bundled-only Pack trust

- Contracts: `CTR-DIR-008`
- Method: search for runtime Pack installation, download, or marketplace entry points
- Environment: Engine V1 codebase
- Required evidence: capability inventory
- Expected result: no runtime installer, downloader, or marketplace exists
- Failure condition: any remote Pack acquisition path exists

### ACC-DIR-009 — Deferral boundary holds

- Contracts: `CTR-DIR-009`
- Method: audit V1 for real Token accounting, DSH adapters, and sync services; verify separate Specs exist before any such integration
- Environment: Engine V1 repository and Spec index
- Required evidence: audit output and `docs/specs/README.md`
- Expected result: none of the deferred integrations exist in V1
- Failure condition: any deferred integration is implemented without its own accepted Spec

### ACC-DIR-010 — Implementation stays blocked

- Contracts: `CTR-DIR-010`
- Method: inspect repository product paths while this Spec is `proposed`
- Environment: `mayf3/vehicle-pet` at any commit before both Specs are accepted on `main`
- Required evidence: tree listings and Spec index
- Expected result: no product implementation exists
- Failure condition: product code, assets, dependencies, or build files appear before acceptance and merge of both Specs

### Contract coverage

| Contract | Acceptance | Covered |
|---|---|---|
| `CTR-DIR-001` | `ACC-DIR-001` | YES |
| `CTR-DIR-002` | `ACC-DIR-002` | YES |
| `CTR-DIR-003` | `ACC-DIR-003` | YES |
| `CTR-DIR-004` | `ACC-DIR-004` | YES |
| `CTR-DIR-005` | `ACC-DIR-005` | YES |
| `CTR-DIR-006` | `ACC-DIR-006` | YES |
| `CTR-DIR-007` | `ACC-DIR-007` | YES |
| `CTR-DIR-008` | `ACC-DIR-008` | YES |
| `CTR-DIR-009` | `ACC-DIR-009` | YES |
| `CTR-DIR-010` | `ACC-DIR-010` | YES |

Every Contract maps to one Acceptance item, and every Acceptance item maps back to one Contract.

## 11. Alternatives and disposition

| Alternative | Disposition | Reason | Evidence/claims | Reopen condition |
|---|---|---|---|---|
| Vehicle-specific pet page | Rejected | Blocks all non-vehicle pets | `CLM-DIR-001` | A future accepted Spec reverses the product form |
| Engine built-in Packs | Rejected | Pack replacement would require Engine changes | `OBS-DIR-003` | Never without a new accepted authority |
| Engine-owned or token-driven progress | Rejected | Couples engine to billing and one domain | `OBS-DIR-004` | Separate accepted Progress Source Spec |
| Multiple simultaneous pets | Rejected for V1 | Complicates progress and focus | `DEC-DIR-003` | Future accepted multi-pet Spec |
| Remote Packs or marketplace | Rejected for V1 | No executable Pack content in the trust model | `DEC-DIR-005` | Future accepted distribution Spec |
| Hunger/streak/shop retention mechanics | Rejected | Contradicts non-coercive form | `DEC-DIR-004` | Never under this Spec |
| Real Token statistics in V1 | Deferred | Requires its own authority and billing semantics | `DEC-DIR-006` | Separate accepted Progress Source Spec |
| Audio and sprite sheets in V1 | Deferred | Not needed for the core experience | `DEC-DIR-008` | Future accepted presentation Spec |

## 12. Migration, compatibility, and rollback

```text
MIGRATION = forward-only
HISTORICAL_REWRITE = none
PRODUCT_COMPATIBILITY = no product code exists; no product behavior changes
ROLLBACK = revert the complete docs-only commit proposing this Spec
```

This candidate adds documentation only. Acceptance of this Spec changes repository
authority, not code. Rollback removes the proposal by reverting its full commit;
there is no partial supersession.

## 13. Open questions

```text
OPEN_OWNER_DECISIONS = NONE
NORMATIVE_TBD = NONE
UNRESOLVED_AUTHORITY_CONFLICT = NONE
PARTIAL_SUPERSESSION = NONE
READY_TO_MARK_ACCEPTED = NO
```

`READY_TO_MARK_ACCEPTED = NO` because this proposal still requires independent
exact-coordinate review, Owner acceptance, and merge into `mayf3/vehicle-pet:main`
before it becomes active authority. The remaining process steps are not open
normative decisions.
