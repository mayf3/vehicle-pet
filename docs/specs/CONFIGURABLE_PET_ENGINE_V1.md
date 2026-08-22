---
spec_id: CONFIGURABLE_PET_ENGINE_V1
status: proposed
spec_kind: implementation
authority_level: governing_spec
implementation_authority: contracts
scope:
  - pet-engine
  - bundled-pet-packs
  - prototype-shell
governed_by:
  - VEHICLE_PET_PRODUCT_DIRECTION_V1
  - VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1
external_authorities: []
supersedes: []
superseded_by: null
owners:
  - mayf3
---

# CONFIGURABLE_PET_ENGINE_V1

## 1. Goal

Define the V1 architecture Contracts of the configurable, domain-neutral Pet
Engine, its declarative Pet Pack format, and the prototype shell, with
`implementation_authority: contracts`. The Engine consumes external
`ProgressSnapshotV1` input, derives level and presentation purely, renders
bounded declarative scenes, and delivers upgrade celebrations at-most-once.
Every Pet domain fact lives in bundled declarative Packs; replacing a standard
Pet requires no Engine change.

## 2. Scope and non-goals

In scope:

- `pet-engine`: snapshot ingestion, pure level derivation, Pack validation and
  lifecycle, presentation planning, upgrade receipts and journal, locale and
  reduced-motion handling;
- `bundled-pet-packs`: the frozen data of `autonomous-fleet` and
  `seedling-fixture`;
- `prototype-shell`: the V1 host that demonstrates both Packs using
  `MockProgressSource`.

Out of scope:

- real Token statistics, billing, or any DeepSeek Harness adapter — these belong
  to a separate future Progress Source Spec;
- multi-pet, cross-device sync, audio, sprite sheets, remote Packs, marketplace,
  runtime Pack installation, and Pack migration scripts;
- product code creation in this proposal round.

## 3. Authority and dependencies

This Spec is governed by `VEHICLE_PET_PRODUCT_DIRECTION_V1` and
`VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1` and binds to their decisions.

Review and activation constraints:

- This Spec and `VEHICLE_PET_PRODUCT_DIRECTION_V1` are proposed together in the
  same candidate Head and MUST be reviewed as one parent/child pair;
- implementation MUST NOT begin before both Specs are `accepted` and their
  accepted content is present on `mayf3/vehicle-pet:main`;
- the DeepSeek Harness prototype at commit
  `3084ac2c9b915c62a11b1ee8d15f4599eb235673` is Evidence recorded in
  `docs/investigations/GENERIC_PET_ENGINE_V1_INPUTS.md`, not a parent authority
  and not implementation input;
- a real Token Progress Source and any DeepSeek Harness adapter are outside this
  Spec's implementation authority and require their own accepted Spec.

## 4. Current State

### STATE-PET-001 — Engine implementation is NOT_STARTED

- Subject: `mayf3/vehicle-pet` product tree
- As of commit: `58adc4b930f0236fc194a524bb8547d552369471`
- Environment: `origin/main` worktree
- Observed at: `2026-08-22T03:03:00Z`
- Projection: no `src/`, `packages/`, `apps/`, `public/`, `assets/`, or dependency files exist; all Engine obligations in this Spec are future work
- Basis: `OBS-PET-006`, direct tree listing

### STATE-PET-002 — A passing external prototype exists as mechanics evidence

- Subject: DeepSeek Harness pet-mode prototype
- As of commit: `mayf3/deepseek-harness` `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Environment: detached read-only evidence worktree
- Observed at: `2026-08-22T03:04:12Z`
- Projection: derivation, capping, storage tolerance, and bounded representative nodes are demonstrated; receipts, journal, ceremony, daily, and reduced motion are not
- Basis: `OBS-PET-001`–`OBS-PET-005`, investigation record

## 5. Observations

### OBS-PET-001 — Prototype derivation and persistence mechanics pass tests

- Subject: prototype `deriveLevel`/`deriveProgress` and storage layer
- Source revision: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Environment: package test suite
- Observed at: `2026-08-22T03:04:12Z`
- Method: run the 36-test suite covering threshold before/at/after, final-level capping at `Number.MAX_SAFE_INTEGER`, and damaged-storage fallback
- Result: 36/36 passed; derived level never persisted
- Provenance: investigation record `OBS-INV-002`, `OBS-INV-003`

### OBS-PET-002 — Prototype bounds DOM nodes with logical populations

- Subject: prototype fleet scene rendering
- Source revision: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Environment: source inspection of `PetModeApp.tsx`
- Observed at: `2026-08-22T03:05:00Z`
- Method: read `visibleVehicleCount` usage and the fleet renderer
- Result: logical `fleetSize` grows to 1,000,000 while rendered representative nodes stay at 12 for large fleets
- Provenance: investigation record `OBS-INV-003`

### OBS-PET-003 — Prototype has no receipt, journal, ceremony, daily, or reduced-motion behavior

- Subject: prototype presentation layer
- Source revision: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Environment: whole-package source and test search
- Observed at: `2026-08-22T03:05:00Z`
- Method: search for receipt, journal, ceremony, daily/greeting, and `prefers-reduced-motion`
- Result: zero matches; level changes render silently
- Provenance: investigation record `OBS-INV-008`

### OBS-PET-004 — Prototype high levels differ mainly numerically

- Subject: prototype L8–L12 rows
- Source revision: `3084ac2c9b915c62a11b1ee8d15f4599eb235673`
- Environment: level table inspection
- Observed at: `2026-08-22T03:05:00Z`
- Method: compare scene, occupants, visible counts, and copy across L8–L12
- Result: identical scene facts; only `fleetSize`, a logarithmic density value, stage names, and milestone text differ
- Provenance: investigation record `OBS-INV-007`

### OBS-PET-005 — A second domain maps onto the same structures

- Subject: declarative expressibility of a seedling progression
- Source revision: `3084ac2c9b915c62a11b1ee8d15f4599eb235673` (structural reference)
- Environment: analytical mapping over the prototype's scene/population model
- Observed at: `2026-08-22T03:05:00Z`
- Method: map seed → sprout → tree → forest onto scene kinds, populations, density, and thresholds
- Result: no engine-specific field or branch is needed
- Provenance: investigation record `OBS-INV-009`

### OBS-PET-006 — vehicle-pet contains no product code

- Subject: `mayf3/vehicle-pet` tree
- Source revision: `58adc4b930f0236fc194a524bb8547d552369471`
- Environment: `origin/main` worktree
- Observed at: `2026-08-22T03:03:00Z`
- Method: list the tree at the exact base commit
- Result: governance and docs files only
- Provenance: worktree listing at the exact base commit

## 6. Claims and assumptions

### CLM-PET-001 — Level derivation can be a pure function of snapshot and Pack

- Support state: SUPPORTED
- Supported by evidence: `EVD-PET-001`
- Contradicted by evidence: NONE
- Uncertainty: V1 must preserve this purity under locale and reduced-motion variation

### CLM-PET-002 — One declarative manifest format can express both bundled Packs

- Support state: INFERRED
- Supported by evidence: `EVD-PET-002`
- Contradicted by evidence: NONE
- Uncertainty: analytical until `seedling-fixture` passes the same validator in conformance

### CLM-PET-003 — At-most-once celebrations require an engine-owned journal

- Support state: INFERRED
- Supported by evidence: `EVD-PET-003`
- Contradicted by evidence: NONE
- Uncertainty: local-device scope only; no cross-device claim is made

### CLM-PET-004 — Bounded DOM counts can express unbounded scale transitions

- Support state: SUPPORTED
- Supported by evidence: `EVD-PET-004`
- Contradicted by evidence: NONE
- Uncertainty: the prototype's numeric-only high levels show that bounding alone is insufficient without distinct scene transitions

## 7. Evidence relations

### EVD-PET-001 — Passing mechanics support pure derivation

- Source observations: `OBS-PET-001`
- Target: `CLM-PET-001`
- Relation: SUPPORTS
- Bound coordinates: `mayf3/deepseek-harness` `3084ac2c9b915c62a11b1ee8d15f4599eb235673`, observed `2026-08-22T03:04:12Z`
- Strength/sufficiency: test-backed derivation, capping, and storage tolerance
- Limitations: single domain; no locale or reduced-motion variation tested
- Provenance: investigation record `OBS-INV-002`, `OBS-INV-003`

### EVD-PET-002 — Structural mapping supports one manifest format

- Source observations: `OBS-PET-005`
- Target: `CLM-PET-002`
- Relation: SUPPORTS
- Bound coordinates: `mayf3/deepseek-harness` `3084ac2c9b915c62a11b1ee8d15f4599eb235673`, observed `2026-08-22T03:05:00Z`
- Strength/sufficiency: sufficient to justify building one validator for both Packs
- Limitations: conformance still mandatory
- Provenance: investigation record `OBS-INV-009`

### EVD-PET-003 — Absence of presentation state supports the journal design

- Source observations: `OBS-PET-003`
- Target: `CLM-PET-003`
- Relation: SUPPORTS
- Bound coordinates: `mayf3/deepseek-harness` `3084ac2c9b915c62a11b1ee8d15f4599eb235673`, observed `2026-08-22T03:05:00Z`
- Strength/sufficiency: establishes the gap; journal necessity follows from the at-most-once requirement
- Limitations: design inference, not prototype-validated
- Provenance: investigation record `OBS-INV-008`

### EVD-PET-004 — Representative nodes support bounded rendering

- Source observations: `OBS-PET-002`, `OBS-PET-004`
- Target: `CLM-PET-004`
- Relation: SUPPORTS
- Bound coordinates: `mayf3/deepseek-harness` `3084ac2c9b915c62a11b1ee8d15f4599eb235673`, observed `2026-08-22T03:05:00Z`
- Strength/sufficiency: demonstrates 12 nodes for 1,000,000 logical entities
- Limitations: also demonstrates that numeric-only variation reads as no transition
- Provenance: investigation record `OBS-INV-003`, `OBS-INV-007`

## 8. Decisions

### DEC-PET-001 — Snapshot-driven pure derivation, minimal persistence

- Decision owner: `mayf3`
- Decision: the Engine derives level, progress, and presentation plans purely from `ProgressSnapshotV1` plus the active Pack; it persists neither an authoritative snapshot nor a derived level.
- Rejected alternative: persisting derived level for speed.
- Reason: one truth source prevents level/snapshot divergence, as demonstrated by the prototype.
- Owner input remaining: NONE

### DEC-PET-002 — Strict, atomic Pack validation with bundled fallback

- Decision owner: `mayf3`
- Decision: Packs are validated completely before activation; invalid Packs are rejected atomically; a failed switch keeps the last valid Pack; an invalid startup Pack falls back to the bundled `autonomous-fleet` Pack; progress is preserved unchanged in every failure path.
- Rejected alternative: partial activation with best-effort defaults.
- Reason: declarative data permits total validation; atomicity keeps failure semantics simple.
- Owner input remaining: NONE

### DEC-PET-003 — Bounded DOM, unbounded logic

- Decision owner: `mayf3`
- Decision: logical populations may be arbitrarily large; rendered DOM nodes are capped at 32 per population and 64 per Pet.
- Rejected alternative: rendering one node per logical entity.
- Reason: the prototype already proves representative-node rendering at 1,000,000 entities.
- Owner input remaining: NONE

### DEC-PET-004 — Engine-owned receipts and consume-before-play journal

- Decision owner: `mayf3`
- Decision: the Engine owns Upgrade Receipts and the Presentation Journal through a storage adapter, local device only; journal entries are consumed before playback; a crash after consume may skip a celebration but never repeats it.
- Rejected alternative: Host-owned ceremony state or replay-on-mount.
- Reason: at-most-once delivery with a known, bounded loss window is the accepted tradeoff.
- Owner input remaining: NONE

### DEC-PET-005 — Merged, bounded ceremonies with mandatory reduced motion

- Decision owner: `mayf3`
- Decision: multi-level upgrades render the final level immediately, then one merged ceremony of at most 3 beats within 3 seconds; reduced motion is required and degrades to instant or brief-dissolve presentation with complete information; no audio in V1.
- Rejected alternative: one ceremony per level or skippable-but-long sequences.
- Reason: bounded ceremonies respect attention; reduced motion is an accessibility floor, not an option.
- Owner input remaining: NONE

### DEC-PET-006 — Whitelisted presets only

- Decision owner: `mayf3`
- Decision: all animation, transition, camera, scale, density, milestone, celebration, and reveal behavior is chosen from Engine-whitelisted presets; Packs carry no arbitrary animation parameters, scripts, or callbacks.
- Rejected alternative: Pack-provided CSS or animation code.
- Reason: presets keep Packs data-only and the renderer auditable.
- Owner input remaining: NONE

### DEC-PET-007 — Asset budgets and formats

- Decision owner: `mayf3`
- Decision: single compressed assets are at most 2,097,152 bytes; total Pack compressed assets at most 16,777,216 bytes; backgrounds at most 2560×1440; overlays at most 2048×2048; formats are WebP primary with PNG fallback; Packs provide no SVG; the Engine owns static SVG icons.
- Rejected alternative: unbounded or vector Pack assets.
- Reason: bounded raster budgets make validation total and rendering predictable.
- Owner input remaining: NONE

### DEC-PET-008 — Immutable Pack identity, no migration

- Decision owner: `mayf3`
- Decision: `(packId, packVersion)` is immutable; Pack schema version is 1; Packs install only with the application release; no runtime installer and no migration script exist; on Pack version change the current derived level initializes as already presented without replaying historical upgrades.
- Rejected alternative: runtime Pack updates with migration.
- Reason: bundled distribution makes migration unnecessary; skipping replay avoids ceremony spam.
- Owner input remaining: NONE

### DEC-PET-009 — V1 ships MockProgressSource only

- Decision owner: `mayf3`
- Decision: the prototype shell runs exclusively on `MockProgressSource`; real Token sources and DeepSeek Harness adapters are explicitly deferred to a separate Spec.
- Rejected alternative: shipping a partial real source in V1.
- Reason: keeps V1 decidable and free of billing semantics.
- Owner input remaining: NONE

### DEC-PET-010 — One package, layered, with frozen dependency direction

- Decision owner: `mayf3`
- Decision: V1 is one npm package with the layer sketch below; this Spec freezes the dependency direction but this proposal round creates none of the directories.

```text
src/
├── engine/
├── react/
├── packs/
│   ├── autonomous-fleet/
│   └── seedling-fixture/
└── prototype/
```

```text
engine
  不依赖 react、prototype 或具体 Pack

react
  依赖 engine

packs
  只依赖公开类型或 JSON Schema，不依赖 renderer 内部实现

prototype
  组合 engine、react、MockProgressSource 和 bundled Packs
```

- Rejected alternative: separate npm packages per layer for V1.
- Reason: one package minimizes V1 tooling while the frozen direction preserves later extraction.
- Owner input remaining: NONE

### DEC-PET-011 — Locale fallback and daily variant semantics

- Decision owner: `mayf3`
- Decision: locales are `zh-CN` (default) and `en` with deterministic fallback for missing keys; the daily variant uses the device-local timezone and changes only on the next mount, visibility regain, or interaction after the local day changes; no midnight forced transition.
- Rejected alternative: UTC days or timed midnight transitions.
- Reason: device-local days match user expectation; no forced transition preserves the passive form.
- Owner input remaining: NONE

## 9. Frozen data model

These shapes are normative for V1. All Pack-side structures are
JSON-compatible with `additionalProperties: false`.

### ProgressSnapshotV1

```text
ProgressSnapshotV1:
  schemaVersion = 1
  sourceId
  subjectId
  progressPoints
  revision
  observedAt
```

Constraints:

- `progressPoints` is a non-negative safe integer;
- `revision` is a safe integer monotonically increasing within one `(sourceId, subjectId)`;
- progress within one subject never regresses;
- an explicit reset uses a new `subjectId`;
- the Engine does not own or guess real Token accounting semantics;
- the Engine does not persist an authoritative ProgressSnapshot;
- the Engine does not persist a derived level.

### Pack-side structures

```text
PetPackManifestV1   Pack identity, schemaVersion = 1, locale tables, levels, scenes
LevelDefinition     level id, threshold, copy per locale, scene ref, presentation
SceneDefinition     background, layers, populations, transition preset
LayerDefinition     z-ordered layer with asset refs and optional parallax preset
PopulationDefinition logical count, asset ref, density preset, placement preset
AssetDescriptor     relative path, format (webp|png), dimensions, byte size
StagePresentation   scale/camera/density presets, milestone presentation
UpgradeReceipt      id, subjectId, from/to level, issuedAt, packId
PresentationJournal consumed receipt ids with consume-before-play ordering
PetViewModel        derived view state for one Pet render
SceneRenderPlan     bounded node plan produced from a SceneDefinition
```

Pack validation rules (normative):

- strictly JSON-compatible with `additionalProperties: false`;
- IDs and references are unique and stable;
- the first level threshold is 0 and thresholds strictly increase;
- assets reference only paths inside the Pack root; absolute paths, `..`, query strings, hashes, and URL schemes are forbidden;
- only WebP and PNG assets are accepted;
- functions, React components, CSS, scripts, and callbacks are rejected;
- Packs hold no network, model, Host transport, tool, or filesystem capability;
- animation and layout choices select only whitelisted presets;
- single-asset and total compressed budgets from `DEC-PET-007` are enforced;
- validation completes fully before activation; failures roll back atomically.

### Visual preset whitelist

```text
scalePreset:
individual
group
cluster
field
region
horizon

cameraPreset:
close
district
city
metro
regional
continental

densityPreset:
sparse
moderate
dense
network
luminous

milestonePresentation:
inline
banner
centered-card
terminal

sceneTransitionPreset:
instant
crossfade
zoom-out
layer-build

upgrade transition:
instant
crossfade
layer-build
camera-step-out

upgrade reveal:
subject-swap
scene-expand
milestone-card
collection-add

celebration:
glow-pulse
spark-burst
confetti-lite
ambient-highlight

reduced motion:
instant
brief-dissolve
```

Packs MUST NOT provide arbitrary animation parameters or scripts; unknown
preset names are validation failures.

### Bundled Pack content freeze — autonomous-fleet

Twelve levels with frozen zh-CN narrative and `MOCK_PROGRESS_POINTS` thresholds.
These thresholds are mock progression points for V1; they MUST NOT be described
as real Token billing rules.

| Level | MOCK_PROGRESS_POINTS | Frozen zh-CN narrative |
|---|---|---|
| L1 | 0 | 主驾有人，副驾无人，有后方保护车，1 辆车。 |
| L2 | 10,000 | 主驾有人，副驾无人，无后方保护车，1 辆车。 |
| L3 | 30,000 | 主驾无人，副驾有安全员，有后方保护车，1 辆车。 |
| L4 | 60,000 | 主驾无人，副驾有安全员，无后方保护车，1 辆车。 |
| L5 | 100,000 | 主驾、副驾均无人，无保护车，1 名远程人员监管 1 辆车。 |
| L6 | 180,000 | 1 名远程人员监管 3 辆无人车。 |
| L7 | 300,000 | 1 名远程人员监管 10 辆无人车。 |
| L8 | 500,000 | 1 名远程人员监管 100 辆无人车。 |
| L9 | 800,000 | 1 名远程人员监管 1,000 辆无人车。 |
| L10 | 1,200,000 | 1 名远程人员监管 10,000 辆无人车。 |
| L11 | 1,800,000 | 1 名远程人员监管 100,000 辆无人车。 |
| L12 | 2,500,000 | 1 名远程人员监管 1,000,000 辆无人车；V1 当前封顶。 |

Display conversion owned by the Pack:

```text
100 progressPoints = 1 km
```

The Engine MUST NOT know about kilometers or Tokens.

L7–L12 MUST use the following scale transitions; L10, L11, and L12 MUST NOT
change only numbers and titles; L12 MUST have a distinct terminal scene:

```text
L7  = individual / district / 10 个独立实体
L8  = group / city / 代表性组团
L9  = cluster / metro / 多城市节点
L10 = field / regional / 区域路线网
L11 = region / continental / 多区域网络
L12 = horizon / terminal / 抽象全球网络地平线
```

### Bundled Pack content freeze — seedling-fixture

```text
PACK_ID = seedling-fixture
LEVELS = seed, sprout, tree, forest
THRESHOLDS = 0, 10,000, 60,000, 300,000
STORY = 种子 → 发芽 → 小树 → 森林
```

The `seedling-fixture` Pack MUST use the same structures as `autonomous-fleet`:
ProgressSnapshot, Pack Manifest, level thresholds, scene, layer, population,
scale/camera/density presets, upgrade lifecycle, idle/daily/reaction, asset
fallback, and locale fallback. Seedling-specific Engine branches are forbidden.

## 10. Contracts

### CTR-PET-001 — Progress Source boundary

The Engine MUST consume progress only through `ProgressSnapshotV1` inputs from a registered Progress Source. It MUST NOT generate progress internally, and V1 MUST register only `MockProgressSource`.

### CTR-PET-002 — Non-negative safe progress and pure derivation

The Engine MUST clamp or reject non-safe, negative, fractional, or non-finite progress input, MUST derive level and within-level progress as a pure function of the latest snapshot and active Pack, and MUST NOT persist an authoritative snapshot or a derived level.

### CTR-PET-003 — Strict PetPackManifestV1 validation

The Engine MUST validate every Pack completely against the frozen schema (`additionalProperties: false`, unique stable IDs, first threshold 0, strictly increasing thresholds, whitelisted presets only, budget compliance) before activation, and MUST reject any violation.

### CTR-PET-004 — Local assets and capability isolation

Packs MUST reference only local assets inside the Pack root in WebP or PNG format. The validator MUST reject absolute paths, `..`, query strings, hashes, URL schemes, and any function, React component, CSS, script, or callback content. Packs MUST hold no network, model, Host transport, tool, or filesystem capability.

### CTR-PET-005 — Single active Pack with shared progress

The Engine MUST keep exactly one active Pack. Switching Packs MUST NOT change, reset, copy, or fork `progressPoints`.

### CTR-PET-006 — Atomic registration, switching, and invalid Pack fallback

Pack registration and switching MUST be atomic: an invalid Pack MUST be rejected without partial activation, a failed switch MUST keep the last valid Pack active, an invalid startup Pack MUST fall back to the bundled `autonomous-fleet` Pack, and progress MUST remain unchanged in every failure path.

### CTR-PET-007 — Generic Scene / Layer / Population RenderPlan

The Engine MUST render every Pack through one generic Scene/Layer/Population model producing a `SceneRenderPlan`, with no Pack-specific renderer branches.

### CTR-PET-008 — DOM caps

The Engine MUST cap rendered nodes at 32 per population and 64 per Pet. Logical population counts MAY exceed these caps without limitation.

### CTR-PET-009 — No domain semantics in the Engine

Engine production code MUST NOT contain vehicle, plant, or other Pet-domain rules or vocabulary, including `driver`, `passenger`, `protectionVehicle`, `vehicle`, `fleet`, `safetyOfficer`, and `remoteGuardian`.

### CTR-PET-010 — autonomous-fleet content freeze

The `autonomous-fleet` Pack MUST implement the frozen 12-level narrative, the frozen `MOCK_PROGRESS_POINTS` thresholds, and the Pack-owned 100-points-per-km display conversion. The thresholds MUST NOT be presented as real Token billing rules.

### CTR-PET-011 — seedling-fixture runs on the same Engine

The `seedling-fixture` Pack MUST validate and render through the same validator, derivation, and renderer as `autonomous-fleet` with the frozen levels, thresholds, and story. Adding this Pack MUST NOT modify Engine source files or the Engine schema.

### CTR-PET-012 — Receipt uniqueness and Engine-owned journal

The Engine MUST own Upgrade Receipt identity and the Presentation Journal through a storage adapter scoped to the local device. Each receipt MUST be presentable at most once.

### CTR-PET-013 — At-most-once, consume-before-play

The journal MUST consume a receipt entry before presenting its celebration. A page refresh, remount, or duplicate snapshot MUST NOT repeat a celebration. A crash after consume MAY skip a celebration but MUST NOT duplicate it.

### CTR-PET-014 — Multi-level merge, 3 beats, 3 seconds

A multi-level upgrade MUST render the final level immediately and then present exactly one merged ceremony of at most 3 beats within at most 3 seconds.

### CTR-PET-015 — Reduced motion, focus, and skippability

Reduced-motion mode MUST be supported, MUST remove displacement, scaling, and particle motion (using only `instant` or `brief-dissolve` degradation), MUST keep all level, progress, and milestone information complete, and every ceremony MUST keep or restore a clear focus target and remain skippable.

### CTR-PET-016 — Idle, daily greeting, Host activity, and click feedback

The Engine MUST provide for every Pet: light idle motion, one non-modal greeting on the first open of each device-local day (variant changing only on next mount, visibility regain, or interaction after the local day changes, with no midnight forced transition), short feedback after normal Host activity completion, and click or tap feedback.

### CTR-PET-017 — Asset failure degradation

When a Pack asset fails to load, the Pet MUST still present the current level, within-level progress, milestone copy, and accessibility semantics (including alt text), degrading visually without losing information.

### CTR-PET-018 — Pack version immutability, no migration

`(packId, packVersion)` MUST be immutable. V1 MUST NOT include a runtime Pack installer or Pack migration script. On Pack version change, the current derived level MUST initialize as already presented without replaying historical upgrades.

### CTR-PET-019 — Localization and controlled presets

The Engine MUST support `zh-CN` (default) and `en` with deterministic fallback for missing keys, and MUST accept only whitelisted theme/animation presets. Unknown presets MUST be validation failures.

### CTR-PET-020 — Prototype shell uses MockProgressSource only

The prototype shell MUST demonstrate both bundled Packs using only `MockProgressSource`, with no network, model, or Host transport usage.

### CTR-PET-021 — Real Token and DeepSeek Harness adapters deferred

V1 MUST NOT implement real Token accounting or any DeepSeek Harness adapter. Both require a separate accepted Progress Source Spec.

### CTR-PET-022 — L7–L12 non-textual scale transitions

L7 through L12 MUST each produce a visually distinct scale transition through the whitelisted scale/camera/density presets per the frozen mapping. L10, L11, and L12 MUST NOT differ from their predecessors by numbers and titles only, and L12 MUST present a distinct terminal scene.

## 11. Acceptance

### ACC-PET-001 — Snapshot-only progress

- Contracts: `CTR-PET-001`
- Method: attempt to mutate progress through any Engine API other than a registered Progress Source; enumerate registered sources
- Environment: Engine V1 test harness
- Required evidence: API audit and source-registration test transcript
- Expected result: no internal progress mutation path exists; V1 registers only `MockProgressSource`
- Failure condition: any non-snapshot progress mutation or non-mock registered source

### ACC-PET-002 — Safe input handling and pure derivation

- Contracts: `CTR-PET-002`
- Method: feed negative, fractional, infinite, unsafe, and regressing inputs; test each threshold before, at, and one past its value; test the final cap; inspect persisted keys
- Environment: Engine V1 unit tests
- Required evidence: threshold boundary, capping, sanitization, and persistence-key tests
- Expected result: invalid inputs clamp or reject; each level derives exactly at its threshold; the final level caps for arbitrarily large safe input; no authoritative snapshot or derived level is persisted
- Failure condition: any boundary misderivation, unsafe propagation, or persisted derived level

### ACC-PET-003 — Manifest validation rejects invalid Packs

- Contracts: `CTR-PET-003`
- Method: run both bundled Packs and a corpus of invalid Packs (unknown keys, duplicate IDs, non-zero first threshold, non-increasing thresholds, unknown presets, over-budget assets) through the validator
- Environment: Engine V1 validator tests
- Required evidence: validation test transcript covering accept and reject sets
- Expected result: both bundled Packs pass the same validator; every invalid corpus entry is rejected with no partial activation
- Failure condition: any invalid Pack passes or any valid bundled Pack fails

### ACC-PET-004 — Asset and capability isolation

- Contracts: `CTR-PET-004`
- Method: submit Packs containing remote URLs, absolute paths, `..` traversal, query/hash suffixes, functions, React components, CSS, and script callbacks; audit the Pack data surface reachable at runtime
- Environment: Engine V1 validator and runtime tests
- Required evidence: rejection transcript and runtime capability audit
- Expected result: all listed contents are rejected; no Pack data path reaches network, model, Host transport, tool, or filesystem capabilities
- Failure condition: any escape content activates or executes

### ACC-PET-005 — Shared progress across switches

- Contracts: `CTR-PET-005`
- Method: hold `progressPoints` fixed, switch between `autonomous-fleet` and `seedling-fixture`, and compare stored progress and derived states
- Environment: Engine V1 integration tests
- Required evidence: switch transcript with before/after values
- Expected result: exactly one active Pack at all times; `progressPoints` identical across switches with no reset, copy, or fork
- Failure condition: any progress mutation during switching or concurrent active Packs

### ACC-PET-006 — Atomic fallbacks

- Contracts: `CTR-PET-006`
- Method: switch to an invalid Pack at runtime and configure an invalid startup Pack; observe active Pack and progress before and after each failure
- Environment: Engine V1 integration tests
- Required evidence: failure-path transcripts
- Expected result: failed switch keeps the last valid Pack; invalid startup falls back to bundled `autonomous-fleet`; progress unchanged in all failure paths
- Failure condition: any partial activation, empty active Pack, or progress change on failure

### ACC-PET-007 — One renderer for all Packs

- Contracts: `CTR-PET-007`
- Method: render scenes from both bundled Packs through the RenderPlan pipeline and diff the renderer call graph per Pack
- Environment: Engine V1 rendering tests
- Required evidence: RenderPlan fixtures and call-graph comparison
- Expected result: both Packs produce `SceneRenderPlan` output consumed by one generic renderer with no Pack-conditional branches
- Failure condition: any Pack-specific renderer branch

### ACC-PET-008 — DOM caps with large logical populations

- Contracts: `CTR-PET-008`
- Method: render populations with logical counts far exceeding the caps (through 1,000,000) and count mounted nodes per population and per Pet
- Environment: Engine V1 rendering tests
- Required evidence: node-count measurements
- Expected result: logical counts are unbounded while mounted nodes never exceed 32 per population and 64 per Pet
- Failure condition: any cap breach or logical-count limitation

### ACC-PET-009 — Engine vocabulary audit

- Contracts: `CTR-PET-009`
- Method: search Engine production code for `driver`, `passenger`, `protectionVehicle`, `vehicle`, `fleet`, `safetyOfficer`, `remoteGuardian`, and equivalent domain rules
- Environment: Engine V1 source tree
- Required evidence: search transcript over `src/engine/` and `src/react/`
- Expected result: zero domain-rule matches
- Failure condition: any domain rule or vocabulary hit in Engine production code

### ACC-PET-010 — Fleet Pack content matches the freeze

- Contracts: `CTR-PET-010`
- Method: compare the Pack's level table, narrative copy, thresholds, and km conversion against the frozen values; search product copy for token-billing claims
- Environment: `autonomous-fleet` Pack data
- Required evidence: table diff and copy audit
- Expected result: all 12 rows, thresholds, narratives, and the 100-points-per-km conversion match; no real Token billing claim exists
- Failure condition: any frozen value differs or thresholds are described as billing rules

### ACC-PET-011 — Seedling conformance without Engine edits

- Contracts: `CTR-PET-011`
- Method: add the `seedling-fixture` Pack and verify it passes the same validator, derivation, and renderer; diff Engine source and schema before/after
- Environment: Engine V1 with both Packs
- Required evidence: conformance transcript and changed-path diff
- Expected result: seedling validates, derives, and renders through the unchanged Engine; the diff shows no Engine source or schema change
- Failure condition: any Seedling-specific Engine branch or Engine edit

### ACC-PET-012 — Receipt uniqueness and journal ownership

- Contracts: `CTR-PET-012`
- Method: issue receipts across level transitions and inspect receipt IDs and journal contents for duplicates
- Environment: Engine V1 journal tests
- Required evidence: receipt and journal state transcripts
- Expected result: each receipt has unique identity and is presentable at most once; journal lives in the Engine storage adapter, local device only
- Failure condition: duplicate receipts or Host-owned ceremony state

### ACC-PET-013 — No repeat celebrations

- Contracts: `CTR-PET-013`
- Method: upgrade, then refresh, remount, and replay duplicate snapshots; crash after consume and re-open
- Environment: Engine V1 presentation tests with a simulated storage adapter
- Required evidence: ceremony-count transcripts for refresh, remount, duplicate snapshot, and post-crash recovery
- Expected result: no celebration repeats in any replay path; a post-consume crash may skip exactly that celebration and never replays it
- Failure condition: any repeated ceremony, or a skipped ceremony later replayed

### ACC-PET-014 — One bounded merged ceremony

- Contracts: `CTR-PET-014`
- Method: jump progress across multiple level boundaries at once and measure rendered level, ceremony count, beats, and duration
- Environment: Engine V1 presentation tests
- Required evidence: timing and beat measurements
- Expected result: final level renders immediately; exactly one merged ceremony of at most 3 beats within 3 seconds
- Failure condition: per-level ceremonies, more than 3 beats, or more than 3 seconds

### ACC-PET-015 — Reduced motion completeness and skippability

- Contracts: `CTR-PET-015`
- Method: enable reduced motion and inspect ceremony styles for displacement, scaling, and particles; verify information parity and focus; attempt to skip each ceremony
- Environment: Engine V1 presentation tests, reduced motion on and off
- Required evidence: style audit, information parity diff, and skip-interaction transcript
- Expected result: reduced motion uses only `instant` or `brief-dissolve`, information is complete, focus is maintained or restored, and every ceremony is skippable
- Failure condition: any transform/particle motion under reduced motion, lost information, lost focus, or an unskippable ceremony

### ACC-PET-016 — Baseline interactions

- Contracts: `CTR-PET-016`
- Method: for each bundled Pet, verify idle motion, first-open daily greeting per device-local day (and variant change only on next mount/visibility/interaction after day change), Host activity completion feedback, and click feedback
- Environment: Engine V1 interaction tests with a controllable clock
- Required evidence: interaction transcripts across day boundaries
- Expected result: all baseline behaviors present; no midnight forced transition; greeting non-modal and once per local day
- Failure condition: any missing baseline behavior, repeated greeting, or forced midnight transition

### ACC-PET-017 — Asset failure degradation

- Contracts: `CTR-PET-017`
- Method: corrupt or remove Pack assets at runtime and inspect the rendered Pet
- Environment: Engine V1 rendering tests with failing asset loads
- Required evidence: degraded-render transcript and accessibility tree
- Expected result: current level, within-level progress, milestone copy, and alt text remain present and correct
- Failure condition: any loss of level, progress, milestone, or accessibility semantics

### ACC-PET-018 — Immutable Pack versions

- Contracts: `CTR-PET-018`
- Method: attempt to reinstall or mutate an existing `(packId, packVersion)`; change Pack version and observe first presentation; search for installer and migration code
- Environment: Engine V1 Pack lifecycle tests
- Required evidence: lifecycle transcript and code search
- Expected result: versions are immutable; no installer or migration script exists; a version change initializes the current derived level as already presented with no replay
- Failure condition: any version mutation, installer/migration presence, or historical upgrade replay

### ACC-PET-019 — Locale fallback and preset control

- Contracts: `CTR-PET-019`
- Method: request `zh-CN`, `en`, and an unsupported locale with partial key coverage; submit Packs with unknown presets
- Environment: Engine V1 localization and validator tests
- Required evidence: fallback output transcripts and rejection transcript
- Expected result: deterministic fallback to `zh-CN` for missing keys with no crashes; unknown presets rejected
- Failure condition: missing-key crash, nondeterministic fallback, or acceptance of an unknown preset

### ACC-PET-020 — Prototype shell demonstration

- Contracts: `CTR-PET-020`
- Method: run the prototype shell with `MockProgressSource` across both Packs; audit network, model, and Host transport usage
- Environment: prototype shell in a browser test environment
- Required evidence: demonstration transcript and transport audit
- Expected result: both Packs fully demonstrable; zero network, model, or Host transport calls
- Failure condition: any external call or an undemonstrable bundled Pack

### ACC-PET-021 — Deferred integrations absent

- Contracts: `CTR-PET-021`
- Method: search V1 for Token accounting and DeepSeek Harness adapter code; verify the Spec index deferral
- Environment: Engine V1 source and `docs/specs/README.md`
- Required evidence: search transcript and index state
- Expected result: no real Token or adapter implementation exists in V1
- Failure condition: any such implementation without its own accepted Spec

### ACC-PET-022 — Scale transition distinctness

- Contracts: `CTR-PET-022`
- Method: render L6 through L12 and compare scene structure, preset selection, and composition; specifically compare L9→L10, L10→L11, L11→L12
- Environment: Engine V1 rendering tests with `autonomous-fleet`
- Required evidence: per-level RenderPlan diffs and visual review records
- Expected result: each of L7–L12 selects the frozen scale/camera/density mapping with structurally distinct scenes; L10, L11, and L12 differ beyond numbers and titles; L12 presents a distinct terminal scene
- Failure condition: any high level differing only numerically, or an L12 without a dedicated terminal composition

### Contract coverage

| Contract | Acceptance | Covered |
|---|---|---|
| `CTR-PET-001` | `ACC-PET-001` | YES |
| `CTR-PET-002` | `ACC-PET-002` | YES |
| `CTR-PET-003` | `ACC-PET-003` | YES |
| `CTR-PET-004` | `ACC-PET-004` | YES |
| `CTR-PET-005` | `ACC-PET-005` | YES |
| `CTR-PET-006` | `ACC-PET-006` | YES |
| `CTR-PET-007` | `ACC-PET-007` | YES |
| `CTR-PET-008` | `ACC-PET-008` | YES |
| `CTR-PET-009` | `ACC-PET-009` | YES |
| `CTR-PET-010` | `ACC-PET-010` | YES |
| `CTR-PET-011` | `ACC-PET-011` | YES |
| `CTR-PET-012` | `ACC-PET-012` | YES |
| `CTR-PET-013` | `ACC-PET-013` | YES |
| `CTR-PET-014` | `ACC-PET-014` | YES |
| `CTR-PET-015` | `ACC-PET-015` | YES |
| `CTR-PET-016` | `ACC-PET-016` | YES |
| `CTR-PET-017` | `ACC-PET-017` | YES |
| `CTR-PET-018` | `ACC-PET-018` | YES |
| `CTR-PET-019` | `ACC-PET-019` | YES |
| `CTR-PET-020` | `ACC-PET-020` | YES |
| `CTR-PET-021` | `ACC-PET-021` | YES |
| `CTR-PET-022` | `ACC-PET-022` | YES |

Every Contract maps to one Acceptance item, and every Acceptance item maps back to one Contract.

## 12. Alternatives and disposition

| Alternative | Disposition | Reason | Evidence/claims | Reopen condition |
|---|---|---|---|---|
| Adopt the DeepSeek Harness prototype as the engine | Rejected | Welded domain semantics and shell | `OBS-PET-001`, investigation record | Never under this Spec |
| Persist derived level | Rejected | Second truth source diverges from snapshots | `DEC-PET-001` | A future accepted Spec changes the persistence model |
| Best-effort Pack validation | Rejected | Declarative data permits total validation | `DEC-PET-002` | Never without new accepted authority |
| Render one node per entity | Rejected | Unbounded DOM at fleet scale | `CLM-PET-004` | Never for V1 scale targets |
| Host-owned ceremony state | Rejected | Breaks at-most-once under refresh | `CLM-PET-003` | A cross-device sync Spec revisits presentation consistency |
| Per-level ceremonies on multi-level upgrade | Rejected | Exceeds attention budget | `DEC-PET-005` | Future accepted presentation Spec |
| Pack-provided CSS/animation code | Rejected | Breaks data-only Packs | `DEC-PET-006` | Never under the Product Direction trust model |
| Runtime Pack installer or migration | Rejected for V1 | Bundled distribution makes both unnecessary | `DEC-PET-008` | A future accepted distribution Spec |
| Separate npm packages per layer in V1 | Deferred | One package minimizes V1 tooling; direction stays frozen | `DEC-PET-010` | Extraction need demonstrated after V1 |
| Real Token Progress Source in V1 | Deferred | Requires its own accepted Spec | `DEC-PET-009` | Accepted future Progress Source Spec |

## 13. Migration, compatibility, and rollback

```text
MIGRATION = forward-only
HISTORICAL_REWRITE = none
PRODUCT_COMPATIBILITY = no product code exists; this proposal changes authority only
ROLLBACK = revert the complete docs-only commit proposing this Spec
```

This candidate creates documentation only. Implementation authorized by these
Contracts begins only after both this Spec and
`VEHICLE_PET_PRODUCT_DIRECTION_V1` are accepted and present on
`mayf3/vehicle-pet:main`. Rollback removes the proposal by reverting its full
commit; no partial supersession exists.

## 14. Open questions

```text
OPEN_OWNER_DECISIONS = NONE
NORMATIVE_TBD = NONE
UNRESOLVED_AUTHORITY_CONFLICT = NONE
PARTIAL_SUPERSESSION = NONE
READY_TO_MARK_ACCEPTED = NO
```

`READY_TO_MARK_ACCEPTED = NO` because this proposal still requires independent
exact-coordinate review — including its parent/child relationship with
`VEHICLE_PET_PRODUCT_DIRECTION_V1` — plus Owner acceptance and merge into
`mayf3/vehicle-pet:main`. Implementation-stage choices such as specific library
selections or internal function names are deliberately not elevated into
Contracts and are not open normative decisions.
