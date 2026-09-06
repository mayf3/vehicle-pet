---
spec_id: CONFIGURABLE_PET_ENGINE_V2
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
supersedes:
  - CONFIGURABLE_PET_ENGINE_V1
superseded_by: null
owners:
  - mayf3
---

# CONFIGURABLE_PET_ENGINE_V2

## 1. Goal

This V2 supersedes `CONFIGURABLE_PET_ENGINE_V1` and carries every V1
Decision and Contract forward unchanged except the §11.1 autonomous-fleet
content revision (`DEC-PET-031`). Define the V1 architecture Contracts of the configurable, domain-neutral Pet
Engine, its declarative Pet Pack format, and the prototype shell, with
`implementation_authority: contracts`. The Engine consumes external
`ProgressSnapshotV1` input, derives level and presentation purely, renders
bounded declarative scenes, and delivers upgrade celebrations at-most-once.
Every Pet domain fact lives in bundled declarative Packs; replacing a standard
Pet requires no Engine change.

## 2. Scope and non-goals

In scope:

- `pet-engine`: snapshot ingestion and rejection, pure level derivation, Pack
  validation and lifecycle (including `activePackId`), presentation planning,
  upgrade receipts, journal and greeting once-semantics, keepsakes, Host
  activity events, locale and reduced-motion handling;
- `bundled-pet-packs`: the frozen data of `autonomous-fleet` and
  `seedling-fixture`, including per-level presets, scenes, and keepsakes;
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
Under `CTR-DIR-011` of the parent Spec, this Spec is the single normative owner
of DOM node caps, presentation journal mechanics, and ceremony numeric limits.

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
- Decision: the Engine derives level, progress, and presentation plans purely from the last applied valid `ProgressSnapshotV1` plus the active Pack; it persists neither an authoritative snapshot nor a derived level. The per-subject applied-snapshot runtime record used for ordering and deduplication is neither of those.
- Rejected alternative: persisting derived level for speed.
- Reason: one truth source prevents level/snapshot divergence, as demonstrated by the prototype.
- Owner input remaining: NONE

### DEC-PET-002 — Strict, atomic Pack validation with bundled fallback

- Decision owner: `mayf3`
- Decision: Packs are validated completely against the frozen field-level schema before activation; invalid Packs are rejected atomically; a failed switch keeps the last valid Pack; an invalid startup Pack falls back to the bundled `autonomous-fleet` Pack; progress is preserved unchanged in every failure path; if the default Pack itself is invalid the Engine enters the explicit `pack-unavailable` state rather than running an unverified Pack.
- Rejected alternative: partial activation with best-effort defaults.
- Reason: declarative data permits total validation; atomicity keeps failure semantics simple.
- Owner input remaining: NONE

### DEC-PET-003 — Bounded DOM, unbounded logic

- Decision owner: `mayf3`
- Decision: logical populations may be arbitrarily large; rendered scene nodes are capped at 32 per population and 64 per Pet scene renderer, allocated by the frozen deterministic algorithm.
- Rejected alternative: rendering one node per logical entity.
- Reason: the prototype already proves representative-node rendering at 1,000,000 entities.
- Owner input remaining: NONE

### DEC-PET-004 — Engine-owned receipts and consume-before-play journal

- Decision owner: `mayf3`
- Decision: the Engine owns Upgrade Receipts and the Presentation Journal through a storage adapter, local device only; journal keys are claimed atomically before playback; a crash or storage failure after a successful claim may skip a celebration but never repeats it.
- Rejected alternative: Host-owned ceremony state or replay-on-mount.
- Reason: at-most-once delivery with a known, bounded loss window is the accepted tradeoff.
- Owner input remaining: NONE

### DEC-PET-005 — Merged, bounded ceremonies with mandatory reduced motion

- Decision owner: `mayf3`
- Decision: multi-level upgrades render the final level immediately, then one merged ceremony of at most 3 beats within 3 seconds; reduced motion is required and degrades to `instant` or `brief-dissolve` presentation with complete information; no audio in V1.
- Rejected alternative: one ceremony per level or skippable-but-long sequences.
- Reason: bounded ceremonies respect attention; reduced motion is an accessibility floor, not an option.
- Owner input remaining: NONE

### DEC-PET-006 — Whitelisted presets with observable semantics

- Decision owner: `mayf3`
- Decision: all animation, transition, camera, scale, density, milestone, placement, celebration, and reveal behavior is chosen from Engine-whitelisted presets, and every preset carries a minimal, stable, observable RenderPlan semantic defined in this Spec; Packs carry no arbitrary animation parameters, scripts, or callbacks.
- Rejected alternative: Pack-provided CSS or animation code, or name-only preset lists.
- Reason: preset semantics make scale transitions and accessibility mechanically checkable.
- Owner input remaining: NONE

### DEC-PET-007 — Asset budgets and formats

- Decision owner: `mayf3`
- Decision: single compressed assets are at most 2,097,152 bytes; total Pack compressed assets at most 16,777,216 bytes; backgrounds at most 2560×1440; overlays and sprites at most 2048×2048; formats are WebP primary with PNG fallback; Packs provide no SVG; the Engine owns static SVG icons.
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

### DEC-PET-031 — Unmanned visual identity with per-level subject sprites (V2)

- Decision owner: `mayf3` (Owner direction, 2026-09-06)
- Decision: the autonomous-fleet growth story is revised to a fully unmanned
  identity — every level's cabin is empty, and each level's subject sprite
  carries its own mini escort car(s) behind it (L12: two). Each of the twelve
  levels binds to its own subject sprite (`sprite-subject-pod--l1`…`--l12`).
  The §11.1 narrative column, the Pack manifest narrative copy, and the
  sprite alt-texts are revised to match. Thresholds, scenes, scale
  transitions, keepsake count/binding, and all Engine mechanics are unchanged.
- Rejected alternative: keeping the V1 occupancy narrative and changing only
  sprite bytes (the empty-cabin art would contradict the "主驾有人" copy).
- Reason: Owner product decision; the pet reads as one autonomous car growing
  alongside its escort companions into a fleet.
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
- Decision: locales are `zh-CN` (default) and `en`; `zh-CN` copy is required for every localized text and a localized text without `zh-CN` fails validation; `en` keys may be absent with deterministic fallback to `zh-CN`; the daily variant uses the device-local timezone and changes only on the next mount, visibility regain, or interaction after the local day changes; no midnight forced transition.
- Rejected alternative: UTC days or timed midnight transitions.
- Reason: device-local days match user expectation; no forced transition preserves the passive form.
- Owner input remaining: NONE

### DEC-PET-012 — Illegal snapshots are rejected entire (Owner B04, OPTION_A)

- Decision owner: `mayf3`
- Decision: any required-field violation in a `ProgressSnapshotV1` rejects the entire snapshot — no clamping, rounding, or partial application; the last applied valid snapshot stays effective; with no prior valid snapshot the Pet enters the explicit `waiting-for-valid-progress` state; a diagnosable error is emitted.
- Rejected alternative: clamping, rounding, or field-level patching of invalid snapshots.
- Reason: silent repair of untrusted input manufactures progress the source never reported.
- Owner input remaining: NONE

### DEC-PET-013 — Pack switch and version change render silently (Owner B10, OPTION_A)

- Decision owner: `mayf3`
- Decision: Pack switches and Pack version changes render the new derivation immediately and silently — no ceremony in either direction and no Upgrade Receipt; the current derived level initializes as already presented; receipts are issued only for forward `progressPoints` growth crossing a threshold within the same `(sourceId, subjectId)`.
- Rejected alternative: issuing receipts or playing ceremonies when a switch changes the derived level.
- Reason: switch-driven celebrations would reward navigation, not progress, and round-trip switching could farm ceremonies.
- Owner input remaining: NONE

### DEC-PET-014 — Mechanical structural-difference criteria for scale transitions

- Decision owner: `mayf3`
- Decision: adjacent high levels (L7→L12) must differ in at least two frozen non-text structural dimensions, judged by RenderPlan structure diff; accessibility semantics for populations are one deterministic aggregate node per population carrying the real logical count; reduced motion removes only motion and preserves all static structural differences.
- Rejected alternative: human "looks different" judgment for acceptance.
- Reason: mechanical criteria make pseudo-implementations (numbers-and-titles changes) rejectable.
- Owner input remaining: NONE

## 9. Frozen data model (field-level)

These structures are normative for V1. A strict JSON Schema MUST be generatable
from this section alone, without chat context. Field names and internal JSON
arrangement are frozen here; any observable deviation is a validation failure.

### 9.1 Common conventions

- Every Pack-side, event-side, and engine-internal structure below is a JSON object with `additionalProperties: false` at every nesting level; an unknown field anywhere is a validation failure.
- `ID` (all Pack and engine entity identifiers except `receiptId`, `subjectId`, `eventId`, `activityId`): string matching `^[a-z][a-z0-9-]{0,63}$`.
- `SOURCE_ID`: string matching `^[a-z][a-z0-9-]{0,63}$`.
- `SUBJECT_ID`: string matching `^[a-z0-9][a-z0-9-]{0,127}$`.
- `EVENT_ID` / `ACTIVITY_ID`: string matching `^[a-z0-9][a-z0-9-]{0,127}$`.
- `VERSION` (`packVersion`): string matching `^([0-9]|[1-9][0-9]+)\.([0-9]|[1-9][0-9]+)\.([0-9]|[1-9][0-9]+)$` (semver core; no pre-release or build suffix).
- `TIMESTAMP`: string matching `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$` (ISO-8601 UTC).
- `LOCAL_DAY`: string matching `^\d{4}-\d{2}-\d{2}$` (device-local calendar day).
- `SAFE_INT`: integer in `0..9007199254740991` (`Number.MAX_SAFE_INTEGER`).
- All array members must satisfy their element schema; arrays are ordered and order is significant where stated.

### 9.2 LocalizedTextV1

| Field | Type | Required | Rules |
|---|---|---|---|
| `zh-CN` | string, length 1..200 | YES | Default-locale copy; a LocalizedTextV1 without it fails validation |
| `en` | string, length 1..200 | NO | When absent, rendering falls back deterministically to `zh-CN` |

A localized text with neither language present cannot exist structurally:
`zh-CN` is required, so "neither language exists" is always a validation
failure.

### 9.3 ProgressSnapshotV1 (external input)

| Field | Type | Required | Rules |
|---|---|---|---|
| `schemaVersion` | integer literal `1` | YES | Any other value rejects the snapshot |
| `sourceId` | `SOURCE_ID` | YES | Identifies the Progress Source |
| `subjectId` | `SUBJECT_ID` | YES | Identifies the growth subject |
| `progressPoints` | `SAFE_INT` ≥ 0 | YES | Negative, fractional, non-finite, or unsafe values reject the snapshot |
| `revision` | `SAFE_INT` ≥ 0 | YES | Monotonically increasing within `(sourceId, subjectId)` at the source |
| `observedAt` | `TIMESTAMP` | YES | Observation time |

Application rules (normative):

- any required-field violation rejects the entire snapshot (B04/`DEC-PET-012`): no clamping, rounding, or partial application; the last applied valid snapshot stays effective; derived state, rendering, and receipts are unchanged; a diagnosable error is emitted;
- with no prior valid snapshot the Pet enters `waiting-for-valid-progress`;
- ordering per `(sourceId, subjectId)` (`CTR-PET-026`): `revision <= applied revision` is ignored; `progressPoints < applied progressPoints` is ignored; same-`revision` duplicates or conflicts are ignored with a diagnostic;
- the Engine does not own or guess real Token accounting semantics;
- the Engine does not persist an authoritative ProgressSnapshot and does not persist a derived level; the per-subject applied-snapshot runtime record used for ordering is neither.

### 9.4 HostActivityEventV1 (Host input)

| Field | Type | Required | Rules |
|---|---|---|---|
| `schemaVersion` | integer literal `1` | YES | |
| `eventId` | `EVENT_ID` | YES | Stable identity; duplicates are processed once (first wins), later copies ignored with a diagnostic |
| `activityId` | `ACTIVITY_ID` | YES | Identifies the Host activity kind |
| `status` | enum `completed \| failed \| cancelled` | YES | |
| `occurredAt` | `TIMESTAMP` | YES | |

Injection interface: events are delivered through a local in-process
registration interface on the Engine React adapter (callback or context
prop). That interface is a plain function boundary; it is not a network,
model, or Host transport capability (`CTR-PET-024`).

### 9.5 PetPackManifestV1

| Field | Type | Required | Rules |
|---|---|---|---|
| `schemaVersion` | integer literal `1` | YES | Pack schema version for V1 |
| `packId` | `ID` | YES | Unique bundled Pack identity |
| `packVersion` | `VERSION` | YES | Immutable together with `packId` |
| `name` | LocalizedTextV1 | YES | |
| `levels` | array 2..64 of LevelDefinition | YES | Ordered by strictly increasing `threshold`; first `threshold` = 0 |
| `scenes` | array 1..16 of SceneDefinition | YES | |
| `assets` | array 1..256 of AssetDescriptor | YES | Sum of `byteSizeCompressed` ≤ 16,777,216 |
| `keepsakes` | array 0..63 of KeepsakeDefinition | NO | Bundled Packs MUST declare exactly `levels.length − 1` keepsakes, one per non-initial level |
| `displayConversion` | object | NO | `{ unitLabel: LocalizedTextV1 (YES), pointsPerUnit: SAFE_INT ≥ 1 (YES) }`; Pack-owned display conversion (e.g. `100 progressPoints = 1 km`); the Engine knows neither kilometers nor Tokens |

### 9.6 LevelDefinition

| Field | Type | Required | Rules |
|---|---|---|---|
| `levelId` | `ID` | YES | Unique within the manifest |
| `threshold` | `SAFE_INT` ≥ 0 | YES | First level = 0; strictly increasing in array order |
| `stageName` | LocalizedTextV1 | YES | |
| `summary` | LocalizedTextV1 | YES | |
| `milestone` | LocalizedTextV1 | YES | |
| `sceneId` | `ID` | YES | MUST reference `scenes[].sceneId` |
| `presentation` | StagePresentation | YES | |
| `upgrade` | UpgradePresentation | NO | Ceremony selection for receipt-driven upgrades to this level |
| `keepsakeId` | `ID` | NO | REQUIRED on every non-initial level of a bundled Pack; MUST reference `keepsakes[].keepsakeId`; each keepsake is referenced by at most one level |

### 9.7 StagePresentation

| Field | Type | Required | Rules |
|---|---|---|---|
| `scale` | `scalePreset` enum | YES | See §10 |
| `camera` | `cameraPreset` enum | YES | See §10; `terminal` denotes a terminal-scope camera and is distinct from `milestonePresentation=terminal` |
| `milestone` | `milestonePresentation` enum | YES | See §10 |

### 9.8 UpgradePresentation

| Field | Type | Required | Rules |
|---|---|---|---|
| `transition` | enum `instant \| crossfade \| layer-build \| camera-step-out` | YES | |
| `reveal` | enum `subject-swap \| scene-expand \| milestone-card \| collection-add` | YES | |
| `celebration` | enum `glow-pulse \| spark-burst \| confetti-lite \| ambient-highlight` | YES | |

### 9.9 SceneDefinition

| Field | Type | Required | Rules |
|---|---|---|---|
| `sceneId` | `ID` | YES | Unique within the manifest |
| `backgroundAssetId` | `ID` | YES | MUST reference an asset with `role=background` |
| `layers` | array 1..8 of LayerDefinition | YES | |
| `transition` | `sceneTransitionPreset` enum | YES | See §10 |
| `sceneLabel` | LocalizedTextV1 | YES | Accessible scene summary |

### 9.10 LayerDefinition

| Field | Type | Required | Rules |
|---|---|---|---|
| `layerId` | `ID` | YES | Unique within the scene |
| `kind` | enum `subject \| decoration \| overlay \| terminal-overlay` | YES | Exactly one `subject` layer per scene; at most one `terminal-overlay` per scene |
| `assetId` | `ID` | NO | MUST reference an asset with `role=overlay` or `role=sprite` |
| `population` | PopulationDefinition | NO | At most one per layer |
| `placement` | `placementPreset` enum | YES | See §10 |
| `zOrder` | integer 0..63 | YES | Unique within the scene |

### 9.11 PopulationDefinition

| Field | Type | Required | Rules |
|---|---|---|---|
| `populationId` | `ID` | YES | Unique within the scene |
| `logicalCount` | `SAFE_INT` ≥ 0 | YES | Logical entities; may be arbitrarily larger than render caps |
| `assetId` | `ID` | YES | MUST reference an asset |
| `density` | `densityPreset` enum | YES | See §10 |
| `placement` | `placementPreset` enum | YES | See §10 |
| `aggregateLabel` | LocalizedTextV1 | YES | Localized object name for the aggregate accessibility node |

### 9.12 AssetDescriptor

| Field | Type | Required | Rules |
|---|---|---|---|
| `assetId` | `ID` | YES | Unique within the manifest |
| `path` | string | YES | POSIX-relative, matching `^assets/[a-z0-9-]+/[a-z0-9-]+\.(webp|png)$`; absolute paths, `..`, query strings, hashes, and URL schemes are validation failures; the file MUST exist inside the Pack root |
| `format` | enum `webp \| png` | YES | MUST equal the `path` extension |
| `role` | enum `background \| overlay \| sprite` | YES | |
| `width` | integer | YES | `background`: 1..2560; `overlay`/`sprite`: 1..2048 |
| `height` | integer | YES | `background`: 1..1440; `overlay`/`sprite`: 1..2048 |
| `byteSizeCompressed` | integer 1..2097152 | YES | Compressed size on disk |
| `altText` | LocalizedTextV1 | YES | Accessibility text |

### 9.13 KeepsakeDefinition

| Field | Type | Required | Rules |
|---|---|---|---|
| `keepsakeId` | `ID` | YES | Unique within the manifest |
| `levelId` | `ID` | YES | MUST reference a non-initial level; each level is referenced by at most one keepsake |
| `title` | LocalizedTextV1 | YES | |
| `accessDescription` | LocalizedTextV1 | YES | Accessibility description |
| `assetId` | `ID` | NO | Optional local static asset |

Retention key domain (engine storage adapter): at least
`(sourceId, subjectId, packId, packVersion, keepsakeId)`. No currency,
rarity, draw, task, or penalty fields exist structurally
(`additionalProperties: false`).

### 9.14 UpgradeReceipt (engine-emitted)

| Field | Type | Required | Rules |
|---|---|---|---|
| `schemaVersion` | integer literal `1` | YES | |
| `receiptId` | string | YES | Deterministically derived: exactly `"{sourceId}|{subjectId}|{packId}|{packVersion}|{toLevelId}"` |
| `sourceId` | `SOURCE_ID` | YES | |
| `subjectId` | `SUBJECT_ID` | YES | |
| `packId` | `ID` | YES | |
| `packVersion` | `VERSION` | YES | |
| `fromLevelId` | `ID` | YES | Level valid before the crossing |
| `toLevelId` | `ID` | YES | Newly reached level |
| `issuedAt` | `TIMESTAMP` | YES | |
| `revision` | `SAFE_INT` ≥ 0 | YES | Snapshot revision at issuance |

Receipts are issued only for forward `progressPoints` growth crossing a
threshold within the same `(sourceId, subjectId)` under an unchanged Pack
identity; Pack switches, Pack version changes, and subject changes never issue
receipts (`CTR-PET-029`).

### 9.15 PresentationJournal (engine storage adapter, local device)

| Field | Type | Required | Rules |
|---|---|---|---|
| `schemaVersion` | integer literal `1` | YES | |
| `sourceId` | `SOURCE_ID` | YES | Root namespace |
| `subjectId` | `SUBJECT_ID` | YES | Root namespace; subject reset uses a new namespace |
| `consumedReceiptIds` | array of `receiptId` | YES | Once-per-key claim ledger |
| `greetedLocalDays` | array of `LOCAL_DAY` | YES | Once-per-key daily greeting ledger |

Operations (normative):

- `claim(key) -> won | lost`: atomic, exclusive, and visible across same-device,
  same-origin tabs (storage-backed visibility);
- consume-before-play: only a `won` claim MAY present; `lost` and concurrent
  losers MUST NOT present;
- a storage write failure during claim MUST allow skipping the celebration and
  MUST NOT allow a duplicate;
- final-level presentation never depends on celebration success;
- cold start with no journal: the first valid snapshot establishes an
  already-presented baseline; historical upgrades are not replayed.

### 9.16 PetViewModel (derived)

| Field | Type | Required | Rules |
|---|---|---|---|
| `schemaVersion` | integer literal `1` | YES | |
| `sourceId` | `SOURCE_ID` | YES | |
| `subjectId` | `SUBJECT_ID` | YES | |
| `activePackId` | `ID` | YES | |
| `packVersion` | `VERSION` | YES | |
| `revision` | `SAFE_INT` ≥ 0 | YES | Of the last applied valid snapshot |
| `progressPoints` | `SAFE_INT` ≥ 0 | YES | |
| `derivedLevelId` | `ID` | YES | |
| `derivedLevelIndex` | integer ≥ 1 | YES | 1-based position in `levels` |
| `withinLevelEarned` | `SAFE_INT` ≥ 0 | YES | Points above the current threshold, clamped to the level span |
| `withinLevelSpan` | `SAFE_INT` ≥ 1 | YES | Distance to the next threshold; for the final level = 1 with `withinLevelEarned` = 0 |
| `nextLevelId` | `ID \| null` | YES | `null` at the final level |
| `remainingPoints` | `SAFE_INT` ≥ 0 | YES | 0 at the final level |
| `capped` | boolean | YES | True at the final level |
| `locale` | enum `zh-CN \| en` | YES | |
| `reducedMotion` | boolean | YES | |
| `state` | enum `ready \| waiting-for-valid-progress \| pack-unavailable` | YES | |

### 9.17 SceneRenderPlan (derived)

| Field | Type | Required | Rules |
|---|---|---|---|
| `schemaVersion` | integer literal `1` | YES | |
| `packId` | `ID` | YES | Manifest identity half |
| `packVersion` | `VERSION` | YES | Manifest identity half |
| `sceneId` | `ID` | YES | |
| `levelId` | `ID` | YES | |
| `cameraZoomPermille` | integer 200..1000 | YES | From `cameraPreset` (§10) |
| `subjectScalePermille` | integer 60..600 | YES | From `scalePreset` (§10) |
| `nodes` | array 0..64 of RenderNode | YES | Produced by the allocation algorithm (`CTR-PET-008`) |

RenderNode:

| Field | Type | Required | Rules |
|---|---|---|---|
| `nodeId` | string | YES | Non-population: `"{sceneId}:{layerId}"`; population representative: `"{sceneId}:{populationId}:{index}"` |
| `kind` | enum `background \| subject \| decoration \| overlay \| terminal-overlay \| population-representative \| aggregate-label \| milestone \| fallback` | YES | |
| `assetId` | `ID \| null` | YES | Null for pure text nodes |
| `altText` | string \| null | YES | Carried by `subject`, `aggregate-label`, `milestone`, `fallback`; always null for `population-representative` and `decoration` |
| `ariaHidden` | boolean | YES | True for `population-representative` and `decoration` |
| `text` | string \| null | YES | `aggregate-label` renders `"{logicalCount} {aggregateLabel}"` deterministically |
| `logicalCount` | `SAFE_INT \| null` | YES | `aggregate-label` only; the real logical count |
| `zOrder` | integer 0..63 | YES | |
| `placement` | `{ x: 0..10000, y: 0..10000, scalePermille: 1..10000 }` | YES | Integer permille on the 10000×10000 scene box (§10 placement formulas) |

Determinism: the RenderPlan is a pure function of `(packId, packVersion,
sceneId, populationId, index)`; repeated renders of the same inputs produce
byte-identical plans; runtime randomness is forbidden.

## 10. Preset whitelist and observable semantics

The complete whitelist (B08 adds `terminal` to `cameraPreset`; B07 adds
`placementPreset`):

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
terminal

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

placementPreset:
center
edge-left
edge-right
top-strip
bottom-strip
grid-even
ring
horizon-band
```

`cameraPreset=terminal` denotes a terminal-scope camera. It is a different
field from `milestonePresentation=terminal`; sharing the name creates no
coupling. Unknown preset names anywhere are validation failures.

Minimal, stable, observable semantics per preset (RenderPlan-checkable):

| Preset family | Observable semantic |
|---|---|
| `scalePreset` | `subjectScalePermille` of the subject node: individual 600, group 380, cluster 240, field 150, region 95, horizon 60 |
| `cameraPreset` | `cameraZoomPermille` of the plan: close 1000, district 820, city 660, metro 520, regional 400, continental 300, terminal 220; `terminal` additionally requires a `terminal-overlay` layer in the scene |
| `densityPreset` | Per-population representative limit multiplier and required visual class: sparse ×0.50, moderate ×0.75, dense ×1.00, network ×1.00 + required route/network line class, luminous ×1.00 + required glow/highlight class; effective limit = floor(32 × multiplier) |
| `milestonePresentation` | Milestone node placement: inline = in-flow below the subject; banner = top-strip; centered-card = scene-center card; terminal = full-width bottom band over the terminal overlay |
| `sceneTransitionPreset` | instant = 0 intermediate frames; crossfade = alpha blend ≤ 400 ms; zoom-out = scale 105%→100% ≤ 400 ms; layer-build = staggered layer reveal ≤ 600 ms |
| `upgrade transition` | instant = 0 frames; crossfade ≤ 400 ms; layer-build ≤ 600 ms; camera-step-out ≤ 600 ms interpolation to the next `cameraZoomPermille` |
| `upgrade reveal` | subject-swap = subject node asset swap; scene-expand = next-level population/layer nodes added; milestone-card = centered card node; collection-add = keepsake node added |
| `celebration` | glow-pulse = subject glow, ≤ 2 pulses; spark-burst = particle burst from the subject; confetti-lite = ≤ 24 falling nodes; ambient-highlight = background highlight sweep; all inside the 3-beat / 3-second merged budget and skippable |
| `reduced motion` | Scene and upgrade transitions render as `instant`; reveals fade via `brief-dissolve` only; celebrations render as a static completion marker with no displacement, scaling, or particles; static structural differences are preserved exactly |
| `placementPreset` | Deterministic coordinates below |

`placementPreset` formulas — permille coordinates on the 10000×10000 scene
box, origin top-left; `n` = number of nodes in the placement group; `i` =
0-based index; float64 arithmetic, then floored to integers:

```text
center        x = 5000,                          y = 5000
edge-left     x = 1000,                          y = 1000 + 8000·(i+1)/(n+1)
edge-right    x = 9000,                          y = 1000 + 8000·(i+1)/(n+1)
top-strip     x = 1000 + 8000·(i+1)/(n+1),       y = 1200
bottom-strip  x = 1000 + 8000·(i+1)/(n+1),       y = 8800
grid-even     c = ceil(sqrt(n)); r = ceil(n/c)
              x = 1000 + 8000·((i mod c) + 0.5)/c
              y = 1000 + 8000·((floor(i/c) mod r) + 0.5)/r
ring          x = 5000 + 3000·cos(2π·i/n)
              y = 5000 + 3000·sin(2π·i/n)
horizon-band  x = 1000 + 8000·(i+1)/(n+1)
              y = 4400 + 2800·(i+1)/(n+1)
```

### 10.1 Mechanical structural-difference criteria (B13)

For adjacent levels L_k → L_{k+1} with k ≥ 7, at least two of the following
non-text dimensions MUST differ, judged by RenderPlan structure diff:

- scene/background identity;
- `cameraPreset`;
- `scalePreset`;
- `densityPreset`;
- population group count (number of populations with `logicalCount ≥ 1`);
- region/route/network layer set (overlay-class layers and route/network visual classes);
- terminal overlay presence;
- layer-kind multiset of the rendered scene.

Changes to numbers, titles, or copy never count as structural differences.

### 10.2 Accessibility semantics (B13)

- `population-representative` nodes MUST be decorative: `ariaHidden = true`, no `altText`, never individually announced by screen readers;
- each population MUST produce exactly one deterministic `aggregate-label` node announcing the real `logicalCount` and the Pack-localized `aggregateLabel`;
- the Pet subject MUST carry an accessible name from its asset `altText`;
- on asset failure, level, progress, milestone copy, keepsake copy, and aggregate counts MUST remain in the accessibility tree.

## 11. Bundled Pack content freezes

### 11.1 autonomous-fleet

Twelve levels with frozen zh-CN narrative, `MOCK_PROGRESS_POINTS` thresholds,
and per-level scene/preset assignments. These thresholds are mock progression
points for V1; they MUST NOT be described as real Token billing rules.

| Level | Points | Frozen zh-CN narrative | subject sprite | sceneId | scale | camera | density | milestone | population |
|---|---|---|---|---|---|---|---|---|---|
| L1 | 0 | 无人驾驶小车首航出发，车内无人，后方跟着 1 辆迷你保护车。 | `sprite-subject-pod--l1` | `road-test` | individual | close | sparse | inline | — |
| L2 | 10,000 | 车顶立起天线，小车渐入佳境，迷你保护车紧随其后，车内无人。 | `sprite-subject-pod--l2` | `road-test-l2` | individual | close | sparse | inline | — |
| L3 | 30,000 | 第一条黄色饰条与小灯条点亮，保护车同行，车内无人。 | `sprite-subject-pod--l3` | `road-test-l3` | individual | close | sparse | inline | — |
| L4 | 60,000 | 方形传感盒装上车顶，车身略长，保护车随行，车内无人。 | `sprite-subject-pod--l4` | `road-test-l4` | individual | close | sparse | inline | — |
| L5 | 100,000 | 完整传感环绕上车顶，小车眼神更自信，1 名远程人员监管 1 辆无人车。 | `sprite-subject-pod--l5` | `road-test-l5` | individual | close | moderate | inline | — |
| L6 | 180,000 | 车身加宽，双侧灯带点亮，1 名远程人员监管 3 辆无人车。 | `sprite-subject-pod--l6` | `convoy` | individual | close | moderate | inline | vehicles ×3 |
| L7 | 300,000 | 更大的传感环上车顶，巡游范围扩大，1 名远程人员监管 10 辆无人车。 | `sprite-subject-pod--l7` | `district-fleet` | individual | district | moderate | inline | vehicles ×10 |
| L8 | 500,000 | 车侧发光显示窗与双灯条点亮，1 名远程人员监管 100 辆无人车。 | `sprite-subject-pod--l8` | `city-fleet` | group | city | dense | inline | vehicles ×100 |
| L9 | 800,000 | 加长车身与车顶传感塔就位，1 名远程人员监管 1,000 辆无人车。 | `sprite-subject-pod--l9` | `metro-network` | cluster | metro | network | inline | vehicles ×1,000 |
| L10 | 1,200,000 | 双层传感环转动，1 名远程人员监管 10,000 辆无人车。 | `sprite-subject-pod--l10` | `regional-field` | field | regional | network | inline | vehicles ×10,000 |
| L11 | 1,800,000 | 发光灯带、传感环与天线全开，1 名远程人员监管 100,000 辆无人车。 | `sprite-subject-pod--l11` | `continental-web` | region | continental | luminous | inline | vehicles ×100,000 |
| L12 | 2,500,000 | 旗舰传感冠与多灯带点亮，两辆迷你保护车随行，1 名远程人员监管 1,000,000 辆无人车；V2 当前封顶。 | `sprite-subject-pod--l12` | `terminal-horizon` | horizon | terminal | luminous | terminal | vehicles ×1,000,000 |

Per-level subject sprites and scene variants (V2 revision): every level binds
to exactly its own subject sprite (`sprite-subject-pod--lN`, PNG + lossless
WebP pair, 480×480 transparent canvas, mini escort included; L12 carries two
minis) through its own scene — no level shares another level's subject
sprite. The shared V1 `road-test` scene becomes five per-level variants of
the same visual scene (`road-test` for L1; `road-test-l2`…`road-test-l5` for
L2–L5), identical except each variant's subject assetId; L6–L12 already have
unique scenes and rebind their subject assetId to `sprite-subject-pod--lN`.

Scene set: `road-test` family (`road-test` for L1; `road-test-l2`…`road-test-l5`
for L2–L5), `convoy`, `district-fleet`, `city-fleet`,
`metro-network` (route/network overlay class), `regional-field` (route/network
overlay class), `continental-web` (network + glow/highlight class),
`terminal-horizon` (dedicated terminal scene with `terminal-overlay` layer and
glow/highlight class — L12's independent finale).

Display conversion owned by the Pack:

```text
100 progressPoints = 1 km
```

The Engine MUST NOT know about kilometers or Tokens.

Scale-transition mapping (frozen; see §10.1 for the mechanical criteria):

```text
L7  = individual / district / 10 个独立实体
L8  = group / city / 代表性组团
L9  = cluster / metro / 多城市节点
L10 = field / regional / 区域路线网
L11 = region / continental / 多区域网络
L12 = horizon / terminal / 抽象全球网络地平线
```

Keepsakes: exactly 11, bound one-to-one to the non-initial levels L2–L12
(`CTR-PET-023`).

### 11.2 seedling-fixture

```text
PACK_ID = seedling-fixture
LEVELS = seed, sprout, tree, forest
THRESHOLDS = 0, 10,000, 60,000, 300,000
STORY = 种子 → 发芽 → 小树 → 森林
```

| Level | Points | sceneId | scale | camera | density | milestone | population |
|---|---|---|---|---|---|---|---|
| seed | 0 | `s-seed` | individual | close | sparse | inline | — |
| sprout | 10,000 | `s-sprout` | individual | close | moderate | inline | — |
| tree | 60,000 | `s-tree` | group | city | dense | inline | — |
| forest | 300,000 | `s-forest` | cluster | metro | network | banner | trees ×1,000 |

Keepsakes: exactly 3, bound one-to-one to `sprout`, `tree`, `forest`.

The `seedling-fixture` Pack MUST use the same structures as
`autonomous-fleet`: ProgressSnapshot, Pack Manifest, level thresholds, scene,
layer, population, scale/camera/density presets, upgrade lifecycle,
idle/daily/reaction, keepsakes, asset fallback, and locale fallback.
Seedling-specific Engine branches are forbidden.

## 12. Contracts

### CTR-PET-001 — Progress Source boundary

The Engine MUST consume progress only through `ProgressSnapshotV1` inputs from a registered Progress Source. It MUST NOT generate progress internally, and V1 MUST register only `MockProgressSource`.

### CTR-PET-002 — Entire-snapshot rejection of illegal input

The Engine MUST apply a snapshot only when every required field of `ProgressSnapshotV1` is valid (`schemaVersion` exactly 1; `sourceId`/`subjectId` present and well-formed; `progressPoints` and `revision` non-negative safe integers; `observedAt` a valid `TIMESTAMP`). Any violation — wrong `schemaVersion`, missing fields, negative, fractional, non-finite, or unsafe numbers — MUST reject the entire snapshot with no clamping, rounding, or partial application. The last applied valid snapshot MUST remain effective; derived level, progress, and rendering MUST NOT change; no Upgrade Receipt MAY be issued; a diagnosable error MUST be emitted. With no prior valid snapshot the Pet MUST enter the explicit `waiting-for-valid-progress` state. The Engine MUST derive level and within-level progress purely and MUST NOT persist an authoritative snapshot or a derived level.

### CTR-PET-003 — Strict PetPackManifestV1 validation against the frozen schema

The Engine MUST validate every Pack completely against the field-level schema of §9 — `additionalProperties: false` at every nesting level, ID/version patterns, unique stable IDs, existing cross-references, first threshold 0 and strictly increasing thresholds, whitelisted presets only, dimension/byte/budget bounds, `zh-CN` completeness — before activation, and MUST reject any violation atomically.

### CTR-PET-004 — Local assets and capability isolation

Packs MUST reference only local assets inside the Pack root in WebP or PNG format with paths matching the frozen pattern. The validator MUST reject absolute paths, `..`, query strings, hashes, URL schemes, and any function, React component, CSS, or script/callback content. Packs MUST hold no network, model, Host transport, tool, or filesystem capability.

### CTR-PET-005 — Single active Pack with shared progress

The Engine MUST keep exactly one active Pack. Switching Packs MUST NOT change, reset, copy, or fork `progressPoints`.

### CTR-PET-006 — Atomic registration, switching, and invalid Pack fallback

Pack registration and switching MUST be atomic: an invalid Pack MUST be rejected without partial activation, a failed switch MUST keep the last valid Pack active, an invalid startup Pack MUST fall back to the bundled `autonomous-fleet` Pack, and progress MUST remain unchanged in every failure path.

### CTR-PET-007 — Generic Scene / Layer / Population RenderPlan

The Engine MUST render every Pack through one generic Scene/Layer/Population model producing a `SceneRenderPlan` per §9.17, with no Pack-specific renderer branches. The plan MUST be a pure function of `(packId, packVersion, sceneId, populationId, index)`; repeated renders of the same inputs MUST produce byte-identical plans; runtime randomness in layout or rendering MUST NOT occur.

### CTR-PET-008 — DOM caps and deterministic allocation

The Engine MUST cap rendered nodes at 32 per population and 64 per Pet scene renderer. The cap counts all scene nodes produced by the generic scene renderer — background, subject, decoration, overlay, population representatives, fallback visuals, and in-scene text nodes; Host shell chrome outside the scene renderer, DOM attributes themselves, and non-node alt attributes do not count. Allocation MUST be deterministic: (1) non-population nodes are generated first in scene declaration order; (2) the remaining budget goes to populations; (3) each population, in declaration order, receives `min(logicalCount, renderLimit, 32, remainingBudget)` representatives, where `renderLimit = floor(32 × densityMultiplier)`; (4) once the budget is exhausted, later populations receive 0 representatives while their logical count and aggregate semantics are retained.

### CTR-PET-009 — No domain semantics in the Engine

Engine production code MUST NOT contain vehicle, plant, or other Pet-domain rules or vocabulary, including `driver`, `passenger`, `protectionVehicle`, `vehicle`, `fleet`, `safetyOfficer`, and `remoteGuardian`.

### CTR-PET-010 — autonomous-fleet content freeze

The `autonomous-fleet` Pack MUST implement the frozen 12-level narrative, the frozen `MOCK_PROGRESS_POINTS` thresholds, the frozen per-level scene/preset/population assignments of §11.1, and the Pack-owned 100-points-per-km display conversion. The thresholds MUST NOT be presented as real Token billing rules.

### CTR-PET-011 — seedling-fixture runs on the same Engine

The `seedling-fixture` Pack MUST validate and render through the same validator, derivation, and renderer as `autonomous-fleet` with the frozen levels, thresholds, story, per-level assignments of §11.2, and keepsakes. Adding this Pack MUST NOT modify Engine source files or the Engine schema.

### CTR-PET-012 — Receipt structure and deterministic identity

The Engine MUST emit `UpgradeReceipt` records with the frozen fields of §9.14. `receiptId` MUST be derived deterministically as exactly `"{sourceId}|{subjectId}|{packId}|{packVersion}|{toLevelId}"`. Receipts MUST be issued only for forward `progressPoints` growth crossing a threshold within the same `(sourceId, subjectId)` under an unchanged Pack identity. The Presentation Journal MUST be owned by the Engine storage adapter, scoped to the local device, and keyed once-per-`receiptId`.

### CTR-PET-013 — At-most-once via atomic claim/consume

The journal MUST implement the atomic `claim(key) -> won | lost` operation (§9.15), exclusive and visible across same-device, same-origin tabs. The Engine MUST consume a receipt's journal key before presenting its celebration; only the claim winner MAY present; concurrent losers and already-claimed keys MUST NOT present. A page refresh, remount, or duplicate snapshot MUST NOT repeat a celebration. A crash or storage-write failure after a successful claim MAY skip that celebration and MUST NOT duplicate it. Final-level presentation MUST NOT depend on celebration success. On cold start with no journal, the first valid snapshot MUST establish an already-presented baseline with no historical replay. Subject reset uses a new journal namespace.

### CTR-PET-014 — Multi-level merge, 3 beats, 3 seconds

A multi-level upgrade MUST render the final level immediately and then present exactly one merged ceremony of at most 3 beats within at most 3 seconds.

### CTR-PET-015 — Reduced motion, focus, and skippability

Reduced-motion mode MUST be supported and MUST map motion to the frozen reduced-motion semantics of §10: scene and upgrade transitions render as `instant`; reveals fade via `brief-dissolve` only; celebrations render as a static completion marker with no displacement, scaling, or particle motion. All level, progress, milestone, and aggregate information MUST remain complete; static structural differences MUST be preserved exactly; every ceremony MUST keep or restore a clear focus target and remain skippable.

### CTR-PET-016 — Idle, daily greeting, Host activity, and click feedback

The Engine MUST provide for every Pet: light idle motion; one non-modal greeting on the first open of each device-local day, delivered at most once per `(sourceId, subjectId, localDay)` key (`CTR-PET-028`), with the variant changing only on next mount, visibility regain, or interaction after the local day changes and no midnight forced transition; short feedback after Host activity completion per `HostActivityEventV1` (`CTR-PET-024`); and click or tap feedback.

### CTR-PET-017 — Asset failure degradation

When a Pack asset fails to load, the Pet MUST still present the current level, within-level progress, milestone copy, keepsake copy, aggregate population counts, and accessibility semantics (including alt text), degrading visually without losing information.

### CTR-PET-018 — Pack version immutability, no migration

`(packId, packVersion)` MUST be immutable. V1 MUST NOT include a runtime Pack installer or Pack migration script. On Pack version change, the current derived level MUST initialize as already presented without replaying historical upgrades.

### CTR-PET-019 — Localization and controlled presets

The Engine MUST support `zh-CN` (default) and `en`: every localized text MUST carry `zh-CN` (its absence fails Pack validation); `en` keys MAY be absent with deterministic fallback to `zh-CN`; a localized text with neither language cannot pass validation. The Engine MUST accept only whitelisted theme/animation/placement presets; unknown presets MUST be validation failures.

### CTR-PET-020 — Prototype shell uses MockProgressSource only

The prototype shell MUST demonstrate both bundled Packs using only `MockProgressSource`, with no network, model, or Host transport usage.

### CTR-PET-021 — Real Token and DeepSeek Harness adapters deferred

V1 MUST NOT implement real Token accounting or any DeepSeek Harness adapter. Both require a separate accepted Progress Source Spec.

### CTR-PET-022 — L7–L12 non-textual scale transitions

L7 through L12 MUST each satisfy the frozen scale-transition mapping of §11.1 and the mechanical structural-difference criteria of §10.1: adjacent levels L_k → L_{k+1} (k ≥ 7) differ in at least two non-text dimensions. L10, L11, and L12 MUST NOT differ from their predecessors by numbers and titles only. L12 MUST use `cameraPreset=terminal`, MUST render the dedicated `terminal-horizon` scene with its `terminal-overlay` layer, and reduced motion MUST preserve these static structural differences.

### CTR-PET-023 — Milestone keepsakes

The Engine MUST support `KeepsakeDefinition` per §9.13. Each bundled Pack MUST declare exactly one keepsake for every non-initial milestone (`autonomous-fleet`: 11, L2–L12; `seedling-fixture`: 3). Keepsake unlock MUST trigger only on forward threshold crossing within the same `(sourceId, subjectId)`; retention MUST be managed by the Engine storage adapter keyed at least by `(sourceId, subjectId, packId, packVersion, keepsakeId)`. Pack switch MUST NOT delete existing keepsakes; a new `subjectId` MUST establish a new keepsake namespace; Pack version change MUST NOT replay upgrades and MUST key new-version keepsakes under the new version domain. On asset failure the keepsake copy and accessibility semantics MUST remain present. Keepsakes MUST NOT introduce currency, rarity, draw, task, or penalty mechanics.

### CTR-PET-024 — HostActivityEventV1 contract

The Engine MUST accept `HostActivityEventV1` per §9.4 — strict JSON with `schemaVersion` 1, stable `eventId`, `activityId`, `status` in `completed | failed | cancelled`, and `occurredAt` — delivered only through the local in-process injection interface of the Engine React adapter, which is not a network, model, or Host transport capability. Presentation MUST be: `completed` → short success feedback; `failed` and `cancelled` → distinguishable, non-punitive feedback. The same `eventId` MUST produce feedback at most once (first wins; later duplicates ignored with a diagnostic). Host activity events MUST NOT change `progressPoints`, MUST NOT issue Upgrade Receipts, and MUST NOT call models.

### CTR-PET-025 — activePackId lifecycle and pack-unavailable terminal state

The Engine MUST persist `activePackId` through its storage adapter on the local device; first startup defaults to `autonomous-fleet`; `activePackId` is a device preference and MUST NOT change on subject reset. The bundled registry MUST be a build-time static manifest; all bundled Packs MUST be fully validated before use; runtime installation, download, or dynamic execution MUST NOT exist. Switch failure keeps the last valid Pack; an invalid startup Pack falls back to `autonomous-fleet`. If `autonomous-fleet` itself is invalid, the Engine MUST NOT run an unverified Pack and MUST enter the explicit `pack-unavailable` state: keep the last valid progress and displayable copy, or show diagnostics and a waiting state when no last valid state exists; no crash, no fallback loop, no change to `progressPoints`, and no Receipt issuance.

### CTR-PET-026 — Snapshot ordering and source failure

Per `(sourceId, subjectId)` the Engine MUST maintain the applied runtime state and: ignore snapshots with `revision` ≤ the applied revision; ignore snapshots with `progressPoints` < the applied `progressPoints`; ignore same-`revision` duplicates or conflicts with a recorded diagnostic. Stale or regressing snapshots MUST NOT change level, progress, or rendering and MUST NOT issue Receipts. On Progress Source error or temporary absence, the Engine MUST keep the last valid output, or remain in `waiting-for-valid-progress` when none exists; it MUST NOT clear the UI or fabricate progress. This runtime record is neither authoritative ProgressSnapshot persistence nor derived-level persistence.

### CTR-PET-027 — Source, subject, and reset key domain

V1 MUST register exactly one Progress Source, `MockProgressSource`. A `sourceId` change within a session is a configuration error and MUST follow the entire-snapshot rejection path of `CTR-PET-002`. A new `subjectId` starts a new growth journey: old-subject data MUST NOT be deleted proactively but MUST be unreachable for the new subject. All once-semantics state MUST be rooted at `(sourceId, subjectId)`, with Receipt, Journal, greeting, and keepsake state keyed under that root plus their pack/version/level/day dimensions. `activePackId` is a device preference and survives subject reset. Reset MUST NOT copy or modify the new snapshot's `progressPoints` and MUST NOT cause a Pack switch. The new subject's first valid snapshot establishes the baseline with the current derived level initialized as already presented and no historical replay.

### CTR-PET-028 — Daily greeting once-per-key

The daily greeting MUST be keyed by `greetingKey = (sourceId, subjectId, localDay)` using the same atomic once-per-key claim semantics as the journal (`CTR-PET-013`): at most one greeting per local day across multiple tabs and mounts on the same device.

### CTR-PET-029 — Silent Pack switch and version change

A Pack switch and a Pack version change MUST render the new derivation immediately and silently: no Upgrade Receipt in either direction regardless of whether the derived level rises or falls, no ceremony, no change to `progressPoints`, and the current derived level initialized as already presented. Round-tripping between Packs at fixed progress MUST NOT produce any Receipt or celebration. Receipts are issued only for forward progress crossing a threshold within the same `(sourceId, subjectId)`.

### CTR-PET-030 — Preset semantics, structural criteria, and accessibility

Every whitelisted preset MUST carry the minimal observable RenderPlan semantics of §10; a preset list without those semantics fails this Contract. Scale transitions MUST satisfy the mechanical structural-difference criteria of §10.1, verified by RenderPlan structure diff, never by human visual judgment alone. Population accessibility MUST follow §10.2: representatives `ariaHidden` with no alt text, exactly one deterministic `aggregate-label` node per population carrying the real logical count and localized object name, and a subject accessible name. Reduced motion MUST preserve all static structural differences.

## 13. Acceptance

### ACC-PET-001 — Snapshot-only progress

- Contracts: `CTR-PET-001`
- Method: attempt to mutate progress through any Engine API other than a registered Progress Source; enumerate registered sources
- Environment: Engine V1 test harness
- Required evidence: API audit and source-registration test transcript
- Expected result: no internal progress mutation path exists; V1 registers only `MockProgressSource`
- Failure condition: any non-snapshot progress mutation or non-mock registered source

### ACC-PET-002 — Entire-snapshot rejection

- Contracts: `CTR-PET-002`
- Method: feed valid snapshots through each threshold boundary (before, at, one past) and the final cap; feed illegal snapshots with `schemaVersion` ≠ 1, missing fields, negative, fractional, non-finite, and unsafe numbers; inspect applied state, derived output, receipts, and persisted keys after each
- Environment: Engine V1 unit tests with a controllable storage adapter
- Required evidence: boundary/capping transcripts on valid input; rejection transcripts on illegal input; waiting-state transcript from cold start
- Expected result: valid snapshots derive exactly at boundaries and cap at the final level; every illegal snapshot is rejected entire — applied state, derived output, and rendering unchanged, no receipt issued, diagnosable error emitted; cold start without prior valid snapshot shows `waiting-for-valid-progress`; no authoritative snapshot or derived level is persisted
- Failure condition: any clamping, rounding, or partial application of illegal input; any derived-state change on rejection; boundary misderivation; persisted derived level

### ACC-PET-003 — Manifest validation rejects invalid Packs

- Contracts: `CTR-PET-003`
- Method: run both bundled Packs and a corpus of invalid Packs (unknown keys at each nesting level, malformed IDs/versions, duplicate IDs, missing cross-references, non-zero first threshold, non-increasing thresholds, missing `zh-CN` copy, unknown presets, over-budget assets, out-of-range dimensions) through the validator
- Environment: Engine V1 validator tests
- Required evidence: validation test transcript covering accept and reject sets, including the nesting level of each rejection
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

### ACC-PET-007 — One deterministic renderer for all Packs

- Contracts: `CTR-PET-007`
- Method: render scenes from both bundled Packs through the RenderPlan pipeline; render the same scene twice and compare serialized plans byte-for-byte; diff renderer call graphs per Pack
- Environment: Engine V1 rendering tests
- Required evidence: RenderPlan fixtures, byte-identity transcript, call-graph comparison
- Expected result: both Packs produce `SceneRenderPlan` output consumed by one generic renderer with no Pack-conditional branches; identical inputs produce byte-identical plans; no runtime randomness
- Failure condition: any Pack-specific renderer branch, nondeterministic plan, or differing bytes across repeated renders

### ACC-PET-008 — DOM caps with deterministic allocation

- Contracts: `CTR-PET-008`
- Method: render scenes with several populations whose representative totals exceed 64 (through logical counts of 1,000,000); count mounted nodes by kind; recompute the expected allocation by the frozen algorithm and compare
- Environment: Engine V1 rendering tests
- Required evidence: node-count measurements per population and per scene, allocation transcripts, byte-identical repeat renders
- Expected result: cap accounting includes background, subject, decoration, population representatives, fallback visuals, and in-scene text nodes; per-population ≤ 32; per Pet scene renderer ≤ 64; allocation follows declaration order and the frozen `min(logicalCount, renderLimit, 32, remainingBudget)` rule; exhausted budgets yield 0 representatives while logical counts and aggregate semantics remain; Host chrome and attributes are not counted
- Failure condition: any cap breach, misordered allocation, or lost aggregate semantics for zero-representative populations

### ACC-PET-009 — Engine vocabulary audit

- Contracts: `CTR-PET-009`
- Method: search Engine production code for `driver`, `passenger`, `protectionVehicle`, `vehicle`, `fleet`, `safetyOfficer`, `remoteGuardian`, and equivalent domain rules
- Environment: Engine V1 source tree
- Required evidence: search transcript over `src/engine/` and `src/react/`
- Expected result: zero domain-rule matches
- Failure condition: any domain rule or vocabulary hit in Engine production code

### ACC-PET-010 — Fleet Pack content matches the freeze

- Contracts: `CTR-PET-010`
- Method: compare the Pack's level table, narrative copy, thresholds, per-level scene/preset/population assignments, and km conversion against §11.1; search product copy for token-billing claims
- Environment: `autonomous-fleet` Pack data
- Required evidence: table diff and copy audit
- Expected result: all 12 rows, thresholds, narratives, scene/preset assignments, and the 100-points-per-km conversion match; no real Token billing claim exists
- Failure condition: any frozen value differs or thresholds are described as billing rules

### ACC-PET-011 — Seedling conformance without Engine edits

- Contracts: `CTR-PET-011`
- Method: add the `seedling-fixture` Pack and verify it passes the same validator, derivation, and renderer; diff Engine source and schema before/after
- Environment: Engine V1 with both Packs
- Required evidence: conformance transcript and changed-path diff
- Expected result: seedling validates, derives, and renders through the unchanged Engine; the diff shows no Engine source or schema change
- Failure condition: any Seedling-specific Engine branch or Engine edit

### ACC-PET-012 — Receipt structure and identity

- Contracts: `CTR-PET-012`
- Method: issue receipts across level transitions and multiple Packs; reconstruct each `receiptId` from its coordinates and compare; inspect journal contents for duplicates
- Environment: Engine V1 journal tests
- Required evidence: receipt records and journal state transcripts
- Expected result: every receipt carries the frozen §9.14 fields; `receiptId` equals the exact five-coordinate string; unique identity per key; journal lives in the Engine storage adapter, local device only; receipts appear only for same-subject forward crossings
- Failure condition: wrong receipt shape, nondeterministic or mismatched `receiptId`, duplicate receipts, Host-owned ceremony state, or a receipt issued outside forward same-subject progress

### ACC-PET-013 — Atomic once-semantics

- Contracts: `CTR-PET-013`
- Method: upgrade, then refresh, remount, and replay duplicate snapshots; race two same-origin tabs on the same receipt; fail the storage write during claim; crash after claim and re-open; cold start with cleared storage; reset the subject
- Environment: Engine V1 presentation tests with a simulated multi-tab storage adapter
- Required evidence: ceremony-count transcripts for refresh, remount, duplicate snapshot, dual-tab race, consume storage failure, post-crash recovery, cold start, and subject reset
- Expected result: exactly one tab presents per receipt; no replay path repeats a celebration; storage-failure and post-crash paths may skip exactly that celebration and never replay it; final level renders regardless; cold start establishes an already-presented baseline; subject reset uses a new namespace
- Failure condition: any repeated celebration, a skipped celebration later replayed, final level blocked by ceremony failure, or cross-namespace leakage

### ACC-PET-014 — One bounded merged ceremony

- Contracts: `CTR-PET-014`
- Method: jump progress across multiple level boundaries at once and measure rendered level, ceremony count, beats, and duration
- Environment: Engine V1 presentation tests
- Required evidence: timing and beat measurements
- Expected result: final level renders immediately; exactly one merged ceremony of at most 3 beats within 3 seconds
- Failure condition: per-level ceremonies, more than 3 beats, or more than 3 seconds

### ACC-PET-015 — Reduced motion completeness and skippability

- Contracts: `CTR-PET-015`
- Method: enable reduced motion and inspect ceremony styles for displacement, scaling, and particles; verify information parity and focus; attempt to skip each ceremony; diff RenderPlan structure with reduced motion on and off
- Environment: Engine V1 presentation tests, reduced motion on and off
- Required evidence: style audit, information parity diff, structural diff, skip-interaction transcript
- Expected result: transitions render `instant`; only `brief-dissolve` fades appear; no transform or particle motion; information complete; focus maintained or restored; every ceremony skippable; static structural differences identical to full motion
- Failure condition: any transform/particle motion under reduced motion, lost information, lost focus, an unskippable ceremony, or altered static structure

### ACC-PET-016 — Baseline interactions

- Contracts: `CTR-PET-016`
- Method: for each bundled Pet, verify idle motion, first-open daily greeting per device-local day (variant changing only on next mount/visibility/interaction after day change), Host activity completion feedback, and click feedback
- Environment: Engine V1 interaction tests with a controllable clock
- Required evidence: interaction transcripts across day boundaries
- Expected result: all baseline behaviors present; no midnight forced transition; greeting non-modal and once per local day
- Failure condition: any missing baseline behavior, repeated greeting, or forced midnight transition

### ACC-PET-017 — Asset failure degradation

- Contracts: `CTR-PET-017`
- Method: corrupt or remove Pack assets at runtime and inspect the rendered Pet and its accessibility tree
- Environment: Engine V1 rendering tests with failing asset loads
- Required evidence: degraded-render transcript and accessibility tree
- Expected result: current level, within-level progress, milestone copy, keepsake copy, aggregate counts, and alt text remain present and correct
- Failure condition: any loss of level, progress, milestone, keepsake, aggregate, or accessibility semantics

### ACC-PET-018 — Immutable Pack versions

- Contracts: `CTR-PET-018`
- Method: attempt to reinstall or mutate an existing `(packId, packVersion)`; change Pack version and observe first presentation; search for installer and migration code
- Environment: Engine V1 Pack lifecycle tests
- Required evidence: lifecycle transcript and code search
- Expected result: versions are immutable; no installer or migration script exists; a version change initializes the current derived level as already presented with no replay
- Failure condition: any version mutation, installer/migration presence, or historical upgrade replay

### ACC-PET-019 — Locale fallback and preset control

- Contracts: `CTR-PET-019`
- Method: request `zh-CN`, `en`, and an unsupported locale with partial key coverage; submit Packs with unknown presets and with localized text missing `zh-CN`
- Environment: Engine V1 localization and validator tests
- Required evidence: fallback output transcripts and rejection transcript
- Expected result: `en`-missing keys fall back deterministically to `zh-CN` with no crashes; localized text without `zh-CN` fails validation; unknown presets rejected
- Failure condition: missing-key crash, nondeterministic fallback, or acceptance of an unknown preset or `zh-CN`-less text

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

### ACC-PET-022 — Scale transition distinctness (mechanical)

- Contracts: `CTR-PET-022`
- Method: build the RenderPlan for L1–L12; verify every preset reference is whitelisted; run the §10.1 structural-difference diff for L7→L8, L8→L9, L9→L10, L10→L11, L11→L12; verify L12 uses `cameraPreset=terminal` and the `terminal-horizon` scene with its terminal overlay; repeat under reduced motion
- Environment: Engine V1 rendering tests with `autonomous-fleet`
- Required evidence: per-level RenderPlan structural diffs and preset whitelist checks, full-motion and reduced-motion
- Expected result: all preset references valid; each adjacent high-level pair differs in ≥ 2 non-text dimensions; L12 presents the dedicated terminal scene; reduced motion preserves all static differences
- Failure condition: any high level differing only numerically, an unwhitelisted preset reference, a missing L12 terminal composition, or structural loss under reduced motion

### ACC-PET-023 — Keepsake lifecycle

- Contracts: `CTR-PET-023`
- Method: for both bundled Packs, cross each non-initial threshold forward and verify unlock; switch Packs and verify retention; reset the subject and verify the new namespace; change Pack version and verify new-domain keying without replay; fail keepsake assets and verify copy remains; inspect the keepsake schema surface for currency/rarity/task fields
- Environment: Engine V1 keepsake tests with a controllable storage adapter
- Required evidence: unlock, retention, namespace, version, asset-failure, and schema-surface transcripts
- Expected result: `autonomous-fleet` unlocks 11 keepsakes (L2–L12) and `seedling-fixture` 3, only on same-subject forward crossings; switching preserves keepsakes; new subject starts empty; version change keys under the new version without replay; asset failure keeps copy and accessibility semantics; no currency/rarity/draw/task/penalty field can exist
- Failure condition: unlock without forward crossing, keepsake loss on switch, cross-subject leakage, replay on version change, lost copy on asset failure, or any compaction mechanic

### ACC-PET-024 — Host activity events

- Contracts: `CTR-PET-024`
- Method: inject `HostActivityEventV1` records for all three statuses; resend duplicates by `eventId`; submit malformed events; audit for network, model, and Host transport usage and for progress/receipt side effects
- Environment: Engine V1 React adapter tests
- Required evidence: feedback transcripts per status, duplicate transcript, rejection transcript, side-effect audit
- Expected result: `completed` shows short success feedback; `failed` and `cancelled` show distinguishable non-punitive feedback; each `eventId` feeds back exactly once; malformed events are rejected; no progressPoints change, no receipt, no model call
- Failure condition: missing or indistinguishable status feedback, repeated feedback for one `eventId`, any progress/receipt/model side effect

### ACC-PET-025 — activePackId lifecycle and default-Pack failure

- Contracts: `CTR-PET-025`
- Method: verify first-startup default and persistence of `activePackId` across sessions and across subject reset; attempt runtime installation paths; corrupt the startup Pack; then corrupt `autonomous-fleet` itself and observe the terminal path
- Environment: Engine V1 Pack lifecycle tests with a fault-injecting registry
- Required evidence: persistence, reset-persistence, rejection, fallback, and `pack-unavailable` transcripts
- Expected result: default is `autonomous-fleet`; preference survives reset; no runtime installer exists; invalid startup falls back to `autonomous-fleet`; when the default is also invalid the Engine enters `pack-unavailable` — no unverified Pack runs, last valid progress and copy retained or diagnostics/waiting shown, no crash, no fallback loop, progress unchanged, no receipts
- Failure condition: unverified Pack execution, crash or fallback loop, progress change, receipt issuance, or preference loss on reset

### ACC-PET-026 — Ordering and source failure

- Contracts: `CTR-PET-026`
- Method: deliver duplicate, stale (`revision` ≤ applied), regressing (`progressPoints` < applied), and same-`revision` conflicting snapshots; fail the Progress Source; run with no snapshot at all
- Environment: Engine V1 ingestion tests
- Required evidence: transcripts for duplicate, stale, regression, conflict, source error, and no-snapshot cases
- Expected result: all listed inputs are ignored (conflicts with a diagnostic); level, progress, and rendering unchanged; no receipts; source error and no-snapshot keep the last valid output or the waiting state without clearing the UI or fabricating progress
- Failure condition: any derived-state change from ignored inputs, receipt issuance, UI clearing, or fabricated progress

### ACC-PET-027 — Source, subject, and reset key domain

- Contracts: `CTR-PET-027`
- Method: change `sourceId` mid-session; reset the subject mid-journey; inspect once-semantics roots for receipts, journal, greetings, and keepsakes; verify `activePackId` before and after reset
- Environment: Engine V1 lifecycle tests
- Required evidence: rejection, namespace, and preference transcripts
- Expected result: mid-session `sourceId` change follows the entire-rejection path; new subject starts a fresh namespace with the first valid snapshot as already-presented baseline and no replay; old-subject data is unreachable but not deleted; `activePackId` survives reset; reset causes no Pack switch and does not copy or modify progress
- Failure condition: accepted source switch, cross-subject state leakage, historical replay, preference loss, or progress copying

### ACC-PET-028 — Daily greeting once-per-key

- Contracts: `CTR-PET-028`
- Method: open the Pet twice in one device-local day across two same-origin tabs and multiple mounts; race the greeting claim; roll to the next local day
- Environment: Engine V1 interaction tests with a controllable clock and multi-tab storage adapter
- Required evidence: greeting-count transcripts per day and per tab, race transcript, day-roll transcript
- Expected result: exactly one greeting per `(sourceId, subjectId, localDay)`; races resolve to one winner; the next local day greets again
- Failure condition: repeated greeting within a day, lost race yielding zero or multiple greetings

### ACC-PET-029 — Silent switch and version change

- Contracts: `CTR-PET-029`
- Method: hold `progressPoints` fixed; round-trip `autonomous-fleet` → `seedling-fixture` → `autonomous-fleet`; change the Pack version up and down; inspect receipts, ceremonies, rendered level, and stored progress
- Environment: Engine V1 Pack lifecycle tests
- Required evidence: round-trip and version-change transcripts with receipt/ceremony counts
- Expected result: immediate silent re-derivation in every direction; zero receipts and zero ceremonies; `progressPoints` unchanged; derived level initialized as already presented
- Failure condition: any receipt or ceremony caused by switching or version change, delayed rendering, or progress mutation

### ACC-PET-030 — Preset semantics and accessibility tree

- Contracts: `CTR-PET-030`
- Method: for every preset family, verify the §10 observable semantic in the RenderPlan (`subjectScalePermille`, `cameraZoomPermille`, representative limits and required classes, milestone node placement, transition/reveal/celebration node behavior, reduced-motion mapping, placement coordinates recomputed from the formulas); build the deterministic accessibility tree for populated scenes and verify §10.2
- Environment: Engine V1 rendering tests across both bundled Packs
- Required evidence: per-preset semantic verification transcript, recomputed placement coordinates, accessibility tree dumps
- Expected result: every preset's RenderPlan observable matches §10 exactly; representatives are `ariaHidden` with no alt text; exactly one aggregate node per population carries the real logical count and localized name; the subject carries an accessible name; no preset is a name-only entry
- Failure condition: any preset without its observable semantic, an announced representative, a missing or wrong-count aggregate node, a missing subject name, or placement coordinates deviating from the frozen formulas

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
| `CTR-PET-023` | `ACC-PET-023` | YES |
| `CTR-PET-024` | `ACC-PET-024` | YES |
| `CTR-PET-025` | `ACC-PET-025` | YES |
| `CTR-PET-026` | `ACC-PET-026` | YES |
| `CTR-PET-027` | `ACC-PET-027` | YES |
| `CTR-PET-028` | `ACC-PET-028` | YES |
| `CTR-PET-029` | `ACC-PET-029` | YES |
| `CTR-PET-030` | `ACC-PET-030` | YES |

Every Contract maps to one Acceptance item, and every Acceptance item maps back to one Contract.

## 14. Alternatives and disposition

| Alternative | Disposition | Reason | Evidence/claims | Reopen condition |
|---|---|---|---|---|
| Adopt the DeepSeek Harness prototype as the engine | Rejected | Welded domain semantics and shell | `OBS-PET-001`, investigation record | Never under this Spec |
| Persist derived level | Rejected | Second truth source diverges from snapshots | `DEC-PET-001` | A future accepted Spec changes the persistence model |
| Clamp or patch illegal snapshots | Rejected | Silent repair manufactures progress the source never reported | `DEC-PET-012` | Never under this Spec |
| Best-effort Pack validation | Rejected | Declarative data permits total validation | `DEC-PET-002` | Never without new accepted authority |
| Render one node per entity | Rejected | Unbounded DOM at fleet scale | `CLM-PET-004` | Never for V1 scale targets |
| Host-owned ceremony state | Rejected | Breaks at-most-once under refresh | `CLM-PET-003` | A cross-device sync Spec revisits presentation consistency |
| Per-level ceremonies on multi-level upgrade | Rejected | Exceeds attention budget | `DEC-PET-005` | Future accepted presentation Spec |
| Receipts or ceremonies on Pack switch / version change | Rejected | Rewards navigation, not progress; switch round-trips could farm ceremonies | `DEC-PET-013` | Never under this Spec |
| Pack-provided CSS/animation code | Rejected | Breaks data-only Packs | `DEC-PET-006` | Never under the Product Direction trust model |
| Name-only preset whitelist | Rejected | Scale transitions and accessibility become unjudgeable mechanically | `DEC-PET-014` | Never under this Spec |
| Keepsakes as currency/gacha content | Rejected | Contradicts the non-coercive product form | `CTR-PET-023` | Never under the Product Direction |
| Runtime Pack installer or migration | Rejected for V1 | Bundled distribution makes both unnecessary | `DEC-PET-008` | A future accepted distribution Spec |
| Separate npm packages per layer in V1 | Deferred | One package minimizes V1 tooling; direction stays frozen | `DEC-PET-010` | Extraction need demonstrated after V1 |
| Real Token Progress Source in V1 | Deferred | Requires its own accepted Spec | `DEC-PET-009` | Accepted future Progress Source Spec |

## 15. Migration, compatibility, and rollback

```text
MIGRATION = forward-only
HISTORICAL_REWRITE = none
PRODUCT_COMPATIBILITY = no product code exists; this amendment changes authority text only
ROLLBACK = revert the complete docs-only amendment commit
```

This amendment (`AMENDMENT_R1`) resolves review blockers B01–B13 against the
original candidate `b2e77155b8e4b77f25447a6d422765ba95bae004`. It clarifies
proposed Contracts, adds new stable IDs (`CTR-PET-023`–`CTR-PET-030`,
`CTR-DIR-011` and their Acceptances and Decisions), and changes no frozen
product value: DOM caps remain 32/64, ceremonies remain 3 beats / 3 seconds,
the 12-level fleet table, thresholds, and seedling freeze are unchanged.
Implementation authorized by these Contracts begins only after both this Spec
and `VEHICLE_PET_PRODUCT_DIRECTION_V1` are accepted and present on
`mayf3/vehicle-pet:main`. Rollback removes the amendment by reverting its full
commit; no partial supersession exists.

## 16. Open questions

```text
OPEN_OWNER_DECISIONS = NONE
NORMATIVE_TBD = NONE
UNRESOLVED_AUTHORITY_CONFLICT = NONE
PARTIAL_SUPERSESSION = NONE
READY_TO_MARK_ACCEPTED = PENDING_INDEPENDENT_AUDIT
```

`READY_TO_MARK_ACCEPTED = PENDING_INDEPENDENT_AUDIT`: this Spec is a
candidate. Acceptance requires an independent audit of the exact Base/Head
returning `ACCEPT` with zero blockers, after which `mayf3` accepts under the
standing Goal 陪伴 delegation
(`OWNER_SPEC_ACCEPTANCE_POLICY = AUTO_APPROVE_IF_ALL_TRUE`). At the atomic
acceptance transition: `status: accepted`, `CONFIGURABLE_PET_ENGINE_V1`
flips to `status: superseded` with `superseded_by: CONFIGURABLE_PET_ENGINE_V2`,
and the Spec index (docs/specs/README.md) gains the V2 entry.


## 17. Acceptance record

```text
SPEC_LIFECYCLE = proposed (pending independent audit)
ACCEPTED_BY = PENDING
INDEPENDENT_AUDIT_RESULT = PENDING
REVIEWED_BASE_COMMIT = PENDING
REVIEWED_PROPOSED_HEAD = PENDING
OWNER_ACCEPTANCE_DECISION = PENDING (preauthorized AUTO_APPROVE_IF_ALL_TRUE under Goal 陪伴 delegation)
SEMANTIC_DELTA_VS_V1 = §11.1 autonomous-fleet narrative + per-level subject sprite binding revised; DEC-PET-031 added; all other V1 Contracts, Acceptances, Decisions, and frozen values carried forward verbatim
OPEN_OWNER_DECISIONS = NONE
NORMATIVE_TBD = NONE
```

