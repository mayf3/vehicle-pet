---
spec_id: DSH_USAGE_PROGRESS_SOURCE_V2
status: accepted
spec_kind: implementation
authority_level: governing_spec
implementation_authority: contracts
scope:
  - dsh-usage-progress-source
  - counts-only-token-economy
  - usage-ledger-persistence
governed_by:
  - VEHICLE_PET_PRODUCT_DIRECTION_V1
  - CONFIGURABLE_PET_ENGINE_V3
  - DSH_PET_OVERLAY_ADAPTER_V3
  - VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2
  - VEHICLE_PET_PROGRESS_SOURCE_V2
external_authorities:
  - repository: mayf3/deepseek-harness
    authority_id: DEEPSEEK_HARNESS_PINNED_INTEROP_V1
    revision: 419ee11c9bd5d01b206c8660762525d151bc4b4b
    relation: interoperates_with
supersedes:
  - DSH_USAGE_PROGRESS_SOURCE_V1
superseded_by: null
owners:
  - mayf3
---

# DSH_USAGE_PROGRESS_SOURCE_V2

## 1. Goal

This V2 supersedes `DSH_USAGE_PROGRESS_SOURCE_V1` and performs one narrow,
honest semantic decoupling required by the accepted `DSH_PET_OVERLAY_ADAPTER_V3`
(`RESIDENT_PROGRESS_BAR = ABSENT`, `CTR-OVERLAY-016`): the resident
presentation requirement is **removed from this source's authority**.

```text
RESIDENT_PRESENTATION_REQUIREMENT = REMOVED_FROM_USAGE_SOURCE_AUTHORITY
USAGE_PROGRESS_SEMANTICS = UNCHANGED
TOKEN_ECONOMY = UNCHANGED
DAILY_TARGET_FUNCTION = UNCHANGED (1350 coefficient, 1,000,000 scale, 12,000 cap)
LEDGER = UNCHANGED
ATTRIBUTION = UNCHANGED
BACKFILL_POLICY = UNCHANGED (no-backfill)
SOURCE_IDENTITY = UNCHANGED (sourceId dsh-usage, subjectId companion)
COUNTED_CLASSES = UNCHANGED
RETENTION_AND_DEGRADATION = UNCHANGED
```

Concretely: `DshUsageProgressSource` only produces `progressPoints`; it no
longer states or assumes that any resident surface displays a progress bar;
receipts, ceremonies, and every other Engine-owned progression behavior remain
owned by their existing authorities; resident visualization — including the
lawful choice to render no resident progress bar — belongs to the Overlay
authority (`DSH_PET_OVERLAY_ADAPTER_V3`); Full Journey, level derivation, and
every other growth observability is unaffected. V1's `DEC-USG-008` carried a
real normative coupling to the then-existing resident micro progress bar; that
coupling is revised here, not cosmetically annotated. Every `CTR-USG`
Contract's normative text never required a resident bar and is carried
forward unchanged; the Decisions, historical states, calibration table
wording, and acceptance methods that did reference it are revised to the
decoupled semantics.

Authorize, as the source-specific implementation authority reserved by
`VEHICLE_PET_PROGRESS_SOURCE_V2` (`CTR-SRC-002`), exactly one real external
Progress Source for the Vehicle Pet: `DshUsageProgressSource`, which converts
counts-only DeepSeek Harness `tokenUsage` projection growth into
`ProgressSnapshotV1` `progressPoints` under the Owner-ratified calibration of
`DEC-USG-005`. The Engine, the `ProgressSnapshotV1` seam, Packs, and
`MockProgressSource` remain unchanged; resident presentation is not this
authority's concern (see the decoupling above).

```text
GOAL = One calibrated, replay-safe, counts-only usage-to-progress source registered in the DSH overlay, silently degrading everywhere else.
SUCCESS_OUTCOME = Real DSH usage drives pet growth without backfill, multi-level jumps, compulsion mechanics, message-content access, or DSH Core modification.
DELIVERY_FORM = IMPLEMENTATION_AUTHORIZING_AUTHORITY
OWNING_REPOSITORY = mayf3/vehicle-pet
```

## 2. Scope and non-goals

In scope:

- the identity, counted inputs, attribution semantics, progress function,
  persistence, degradation, and lifecycle of the single authorized source;
- the registration change in the DSH overlay client required to run it;
- the contract-test inventory update that reflects the new source inventory.

Out of scope:

- Engine, schema, validation, Pack, Panel, Full Journey, asset, or
  overlay-state changes beyond registering the authorized source;
- cache/reasoning token classes, per-model or per-workspace weighting,
  backfill, decay, streak, absence penalty, goals, or quests;
- reading raw session logs, event streams, Prompt/Completion text, message
  bodies, tool payloads, session titles, or credentials;
- any second Progress Source or any configuration surface for calibration.

## 3. Authority and dependencies

This Spec is governed by `VEHICLE_PET_PRODUCT_DIRECTION_V1`,
`CONFIGURABLE_PET_ENGINE_V3`, `DSH_PET_OVERLAY_ADAPTER_V3`,
`VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2`, and the successor milestone
authority `VEHICLE_PET_PROGRESS_SOURCE_V2`. These are exactly the V1
governed-by authorities resolved to their currently active revisions
(`CONFIGURABLE_PET_ENGINE_V2` → `CONFIGURABLE_PET_ENGINE_V3`,
`DSH_PET_OVERLAY_ADAPTER_V1` → `DSH_PET_OVERLAY_ADAPTER_V3`,
`VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1` →
`VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2`); the resolution changes no
authority boundary and no obligation.

`CTR-OVERLAY-013` (of the accepted `DSH_PET_OVERLAY_ADAPTER_V1`) states its
own reopen condition ("Real token integration requires a separate accepted
governing Spec"); the acceptance of the `DSH_USAGE_PROGRESS_SOURCE_V1`
revision, together with `VEHICLE_PET_PROGRESS_SOURCE_V2`, was the act that
opened it — strictly and only to the extent authorized by the Contracts
carried forward here. No other `CTR-OVERLAY-*` or `CTR-PET-*` obligation is
amended and no accepted text is rewritten. `DSH_PET_OVERLAY_ADAPTER_V3`
reconfirmed the same seam without changing it: "`VEHICLE_PET_PROGRESS_SOURCE_V2`
and `DSH_USAGE_PROGRESS_SOURCE_V1` own the counts-only usage seam; V3 changes
no seam behavior and removes only a resident presentation of its derived view
model" (V3 §3).

Calibration parameters are Owner decisions that cannot be derived from facts
(`OBS-USG-003`). They are ratified in `DEC-USG-001..008` under the Owner's
explicit delegation (Goal 陪伴 R1_CONT_3,
`OWNER_DELEGATED_DECISION_AUTHORITY = YES`): the Goal Orchestrator selects
the unique values inside the directive's frozen calibration targets, and the
Owner preauthorized acceptance
(`OWNER_SPEC_ACCEPTANCE_POLICY = AUTO_APPROVE_IF_ALL_TRUE`; decision value
`OWNER_ACCEPTANCE_DECISION = PREAUTHORIZED_ACCEPT`).

## 4. Current State

### STATE-USG-001 — Production DSH runs a zero-progress placeholder

- Subject: DSH overlay Progress Source
- As of commit: `3fac52f` (origin/main)
- Observed at: `2026-09-04T00:00:00Z`
- Projection: the overlay registers a zero-points placeholder reusing
  `MockProgressSource`; no real usage drives `progressPoints`; the resident
  micro progress bar renders a constant 0 (presentation superseded by
  `DSH_PET_OVERLAY_ADAPTER_V3`: the resident bar is removed; the seam
  statement itself is unchanged)
- Basis: `OBS-USG-001`

### STATE-USG-002 — The counts-only seam is live in the deployment

- Subject: pinned-Harness `SessionSummary.projectionValues.tokenUsage`
- As of revision: `mayf3/deepseek-harness` `419ee11c9bd5d01b206c8660762525d151bc4b4b`
- Observed at: `2026-09-03`
- Projection: counts-only usage values reach the plugin client without Core
  modification; capability absence is observable as key absence
- Basis: `OBS-USG-002`

## 5. Observations

### OBS-USG-001 — The overlay's only progress path is the mock placeholder

- Method: static inventory at base `3fac52f`
- Result: `src/dsh/client/OverlayProgressSource.ts` reuses the prototype mock at 0 points; the contract test pins that exact inventory
- Provenance: repository tree at the exact base commit

### OBS-USG-002 — Structured counts-only projections are client-readable

- Method: read-only structural investigation of the pinned Harness
- Result: `projectionValues` are finished whole values under higher-seq-wins; the `tokenUsage` fold is idempotent per `(turn, step)` carrying `uncachedInputTokens`, `outputTokens`, `cacheReadTokens`, `cacheWriteTokens`; the client already holds the injected `sessions` service; no Core change is required
- Provenance: `docs/investigations/DSH_USAGE_PROGRESS_SOURCE_INPUTS.md` §1–§3

### OBS-USG-003 — Real usage distribution was measured counts-only

- Method: counts-only script over local DSH session logs (numeric usage fields + identity only; message content never read, decoded, or emitted)
- Result: 18 active days; median 13,028,844 counted tokens/day; light 250,000; heavy 30,000,000–47,479,532; p25 5,791,707; min 241,724; historical total ≈280.8M
- Provenance: `docs/investigations/DSH_USAGE_PROGRESS_SOURCE_INPUTS.md` §6–§8

### OBS-USG-004 — Linear mappings cannot meet the frozen targets

- Method: 18-day observed-series simulation of fixed linear rates against the frozen ladder
- Result: linear rates meeting the light-user floor violate heavy-day/install-day crossing limits and vice versa; only diminishing-returns forms met all targets simultaneously
- Provenance: `docs/investigations/DSH_USAGE_PROGRESS_SOURCE_INPUTS.md` §7–§8

## 6. Claims and assumptions

### CLM-USG-001 — Observed projection growth is a stable, fair growth fuel

- Support state: SUPPORTED
- Supported by evidence: `EVD-USG-001`, `EVD-USG-002`
- Contradicted by evidence: NONE
- Uncertainty: future provider changes to usage reporting are outside local control; degradation is silent by contract either way

### CLM-USG-002 — The selected log2 calibration meets every frozen target

- Support state: SUPPORTED
- Supported by evidence: `EVD-USG-003`
- Contradicted by evidence: NONE
- Uncertainty: ETAs for L12 are long-horizon projections from an 18-day distribution

### CLM-USG-003 — Cache/reasoning classes must be excluded for stability

- Support state: INFERRED
- Supported by evidence: `EVD-USG-002` (provider support varies across deployments; the fold's buckets are provider-dependent)
- Contradicted by evidence: NONE
- Uncertainty: acceptable; exclusion is conservative and stable

## 7. Evidence relations

### EVD-USG-001 — V1 inventory supports the registration Claim

- Source observations: `OBS-USG-001`
- Target: `CLM-USG-001`
- Relation: SUPPORTS
- Bound coordinates: base `3fac52f`
- Strength/sufficiency: exact static inventory
- Limitations: none known
- Provenance: repository tree at base

### EVD-USG-002 — Projection structure supports the counts-only Claim

- Source observations: `OBS-USG-002`
- Target: `CLM-USG-001`, `CLM-USG-003`
- Relation: SUPPORTS
- Bound coordinates: `mayf3/deepseek-harness` `419ee11c9bd5d01b206c8660762525d151bc4b4b`
- Strength/sufficiency: structural typing plus idempotent fold semantics
- Limitations: deployment must load the token-meter unit
- Provenance: investigation §1–§4

### EVD-USG-003 — Simulation supports the calibration Claim

- Source observations: `OBS-USG-003`, `OBS-USG-004`
- Target: `CLM-USG-002`
- Relation: SUPPORTS
- Bound coordinates: measured window 2026-08-14..2026-09-02
- Strength/sufficiency: all frozen targets verified numerically for the selected constants
- Limitations: single-user distribution; not a billing record
- Provenance: investigation §8 verification block

## 8. Decisions

### DEC-USG-001 — Exactly one real source with a fixed identity

- Decision owner: `mayf3` (ratified under Goal 陪伴 R1_CONT_3 delegation)
- Decision: the DSH overlay registers exactly one real source, `DshUsageProgressSource`, identity `(dsh-usage, companion)`; the prototype, unit/contract tests, and the E2E progress fixture keep `MockProgressSource`; production DSH runs never register the mock.
- Rejected alternative: per-workspace or per-session sources/subjects (a `subjectId` change is a new journey and none is authorized).
- Reason: one pet, one shared growth narrative (`DEC-DIR-003`).
- Owner input remaining: NONE

### DEC-USG-002 — Counted classes are uncached input + output only

- Decision owner: `mayf3` (ratified under Goal 陪伴 R1_CONT_3 delegation)
- Decision: `counted(session) = n(uncachedInputTokens) + n(outputTokens)` with `n(v) = v` for safe non-negative integers, else 0; `cacheReadTokens`, `cacheWriteTokens`, and `reasoningTokens` are excluded even when present.
- Rejected alternative: including cache or reasoning classes.
- Reason: provider support varies; the fuel must be stable and fair, not a billing mirror (`CLM-USG-003`).
- Owner input remaining: NONE

### DEC-USG-003 — No historical backfill

- Decision owner: `mayf3` (ratified under Goal 陪伴 R1_CONT_3 delegation)
- Decision: first observation of a session seeds `lastSeen(sessionId)` at its current total and attributes nothing; a fresh install starts the pet at 0 points regardless of history.
- Rejected alternative: backfilling measured history (would place a new install mid-ladder and break "grow together from L1").
- Reason: `HISTORICAL_BACKFILL = NO`; install-day multi-level jump is prohibited.
- Owner input remaining: NONE

### DEC-USG-004 — Daily diminishing returns, log2 form

- Decision owner: `mayf3` (ratified under Goal 陪伴 R1_CONT_3 delegation)
- Decision: growth uses a per-day diminishing-returns curve rather than a fixed linear rate.
- Rejected alternative: any fixed linear rate (`OBS-USG-004`: linear forms cannot meet the light-user floor and the heavy-day crossing ceiling simultaneously).
- Reason: the log curve gives every active day visible growth while naturally compressing extreme days.
- Owner input remaining: NONE

### DEC-USG-005 — Frozen constants: scale 1,000,000; coefficient 1,350; cap 12,000

- Decision owner: `mayf3` (ratified under Goal 陪伴 R1_CONT_3 delegation)
- Decision: `DAILY_TARGET_POINTS(T) = min(12000, 1350 x log2(1 + T / 1000000))`; per-day applied increment is `floor(target(dayTokens)) - appliedPoints(day)`; no configuration surface may alter these constants. Verification against the frozen targets (exact floored values):

| Frozen target | Selected-policy outcome | Result |
|---|---|---|
| MEDIAN_USER_L2 = 2–3 active days | 10,000 pts at 5,143/day → day 2 | MET |
| MEDIAN_USER_L5 = 3–6 weeks | 100,000 pts → 20 active days ≈ 3.3 calendar weeks at observed 7/8 cadence | MET |
| MEDIAN_USER_L12 = 12–24 months | 2,500,000 pts → 487 active days ≈ 18.3 calendar months | MET |
| LIGHT_USER_DAILY_VISIBLE_PROGRESS | 434 pts/day ≈ 4.3% of the L1 within-level span per day | MET |
| LIGHT_USER_L2 < 100 days | 24 active days | MET |
| HEAVY_USER ≤ 1 level crossing per local day | heavy days earn 6,688–7,559 pts; cap 12,000 < 20,001 (minimum two-threshold distance) bounds every day below two crossings anywhere on the ladder | MET |
| INSTALL_DAY_MULTI_LEVEL_JUMP = NO | cap 12,000 < L3 threshold 30,000 — even 1e9 counted tokens cross at most L2 | MET (invariant) |
| NO_USAGE_NO_PROGRESS = YES | delta 0 → gain 0 → no snapshot | MET |

  Exact function vectors: T = 0 → 0; 250,000 → 434; 13,028,844 → 5,143; 30,000,000 → 6,688; 47,479,532 → 7,559; 1,000,000,000 → 12,000.
- Rejected alternative: larger scale (e.g. 4,000,000) which cuts light-day feedback to well under half (~120-220 pts depending on coefficient matching) for no median benefit; smaller caps that make the install-day invariant distribution-dependent.
- Reason: the only evaluated family meeting every frozen target simultaneously; the cap makes the install-day invariant unconditional.
- Owner input remaining: NONE

### DEC-USG-006 — Attribution observes growth, by device-local day

- Decision owner: `mayf3` (ratified under Goal 陪伴 R1_CONT_3 delegation)
- Decision: per observation, `delta(session) = max(0, counted - lastSeen)`; deltas observed while the device-local date is `D` add to `dailyTokens(D)`; usage accumulated while no client was open is attributed at next observation, never backdated.
- Rejected alternative: reconstructing per-day history from raw logs (prohibited path; also a backfill).
- Reason: deterministic, replay-safe, counts-only.
- Owner input remaining: NONE

### DEC-USG-007 — One versioned browser-local ledger with bounded retention

- Decision owner: `mayf3` (ratified under Goal 陪伴 R1_CONT_3 delegation)
- Decision: one versioned `localStorage` record (`vehicle-pet/usage-ledger/v1`) holds `cumulativePoints`, `revision`, `byDay` (`dailyTokens`/`appliedPoints`), and `lastSeen`; malformed/unavailable storage falls back to memory; `byDay` is pruned after 90 local days and `lastSeen` entries for sessions absent at a day's first snapshot are dropped.
- Rejected alternative: extending the Engine storage adapter (frozen surface) or IndexedDB (async lifecycle for no gain at this size).
- Reason: matches the established overlay-preferences pattern; the ledger is a disposable device-local cache.
- Owner input remaining: NONE

### DEC-USG-008 — The source produces points only; resident visualization is Overlay authority

- Decision owner: `mayf3` (V2 revision under Goal 灵动; V1 text ratified under Goal 陪伴 R1_CONT_3 delegation)
- Decision (V2, revising V1): `DshUsageProgressSource` produces `progressPoints` through the snapshot seam and nothing else. This source requires and assumes NO resident presentation of progress: whether any resident surface renders a progress bar is owned solely by the Overlay authority (`DSH_PET_OVERLAY_ADAPTER_V3`, which renders no resident bar and presents within-level progress in the retained Full Journey dialog). Receipts and ceremonies remain Engine-owned progression behavior under their existing authorities. This source adds no ceremony, sound, or notification.
- Superseded V1 text: "receipts, ceremonies, and micro progress remain the Engine's existing behavior" — the "micro progress" clause was a normative coupling to the resident bar presentation that `DSH_PET_OVERLAY_ADAPTER_V3` removed; that clause is decoupled from this source authority. The receipts/ceremonies ownership clause and the source-side prohibition are carried forward unchanged.
- Rejected alternatives: keeping the resident-bar coupling in this source's authority (would contradict accepted Overlay V3); moving Overlay UI obligations into this source (out of scope).
- Reason: presentation ownership must have exactly one home; with `CTR-OVERLAY-016` accepted, that home is the Overlay authority, and this source stays presentation-blind by construction.
- Owner input remaining: NONE

## 9. Contracts

### CTR-USG-001 — Exactly one real source; Mock retained

The DSH overlay client registers exactly one real Progress Source,
`DshUsageProgressSource` (sourceId `dsh-usage`, subjectId `companion`).
`MockProgressSource` remains the registered source of the prototype shell,
unit/contract tests, and the E2E progress fixture; production DSH runs never
register the mock.

### CTR-USG-002 — Snapshot-seam exclusivity

All progression from the usage source reaches the Engine exclusively as
`ProgressSnapshotV1` snapshots (`schemaVersion` 1, `sourceId` `dsh-usage`,
`subjectId` `companion`, safe non-negative integer `progressPoints` and
`revision`, ISO-8601 `observedAt`) through the existing subscription and
validation seam. The Engine derives everything else; the source never sends
levels, dates, or presentation facts.

### CTR-USG-003 — Counts-only structural boundary

The source processes only numeric projection counts and stable session ids.
It MUST NOT read, retain, transmit, or log Prompt text, Completion text,
message bodies, tool payloads, credentials, session titles, or free text of
any kind, and MUST NOT subscribe to raw session or event streams.

### CTR-USG-004 — Frozen counted classes

Exactly `uncachedInputTokens + outputTokens` are counted, normalized by
`n(v) = v` for safe non-negative integers, else 0. Absent, malformed, or
truncated projections read as "no new counts" — never as an error and never
as a negative delta. Cache read/write and reasoning classes are excluded even
when present.

### CTR-USG-005 — Frozen progress function

`DAILY_TARGET_POINTS(T) = min(12000, 1350 x log2(1 + T / 1000000))` with
floor-to-integer application is the only points mapping; the per-day applied
increment is `floor(target(dayTokens)) - appliedPoints(day)`. The constants
(`TOKEN_SCALE = 1,000,000`, `DAILY_COEFFICIENT = 1,350`, `DAILY_CAP = 12,000`)
are normative only here; no configuration, environment, pack, or user
preference may alter them.

### CTR-USG-006 — Delta attribution and no backfill

Only non-negative per-session growth after first observation is attributed
(`delta = max(0, counted - lastSeen)`); first observations seed `lastSeen`
silently; install-day progress starts at zero; projection truncation or
regression never re-attributes or double-counts.

### CTR-USG-007 — Local-day boundary

Attribution uses the device-local `YYYY-MM-DD` day of observation; deltas
join `dailyTokens(D)` for that day; no other timezone or UTC boundary is used
for points.

### CTR-USG-008 — Monotone emission

A snapshot is emitted only when `floor(target(dayTokens)) - appliedPoints(day)
> 0`; `progressPoints` never regresses; `revision` strictly increases across
emissions from this source. No usage produces no snapshot and no error.

### CTR-USG-009 — Persistence, merge-guard, and replay safety

The ledger persists in one versioned browser-local record. Before each write
the source re-reads the stored record and merges field-wise maxima
(`cumulativePoints`, `revision`, per-session `lastSeen`, per-day
`dailyTokens`/`appliedPoints`); it never overwrites a strictly greater stored
value, so a stale tab cannot regress a newer record. A reload re-emits the
persisted cumulative total. A lost or malformed ledger degrades to memory and
re-baselines at current totals: mid-session, the Engine's own ordering rules
keep the last applied valid snapshot (a re-baseline cannot regress a live
session); the reset takes effect at the next mount. Receipt once-semantics
remain Engine-owned, so no ceremony replays.

### CTR-USG-010 — Silent degradation

Capability absence (including a missing `tokenUsage` key), projection
truncation, storage failure, and source disposal apply no progress, raise no
resident-surface error, and leave the last applied valid snapshot effective.

### CTR-USG-011 — Bounded ledger

`byDay` retention is bounded at 90 local days, pruned at the first
observation of a new day (applied points remain baked into
`cumulativePoints`); `lastSeen` is pruned for sessions absent from that
day's first list snapshot; the stored record stays small and bounded for the
life of the installation.

### CTR-USG-012 — Non-coercive

The source adds no streak, decay, absence penalty, reminder, notification, or
interaction demand; growth stops when usage stops and never reverses.

### CTR-USG-013 — Lifecycle and disposal

The source and any storage or list listeners it owns are created and disposed
with the overlay plugin fiber (stop, HMR, reload, update, and uninstall leave
no live resource); the source owns no timers and no network surface.

## 10. Acceptance

### ACC-USG-001 — Source inventory

- Contracts: `CTR-USG-001`
- Method: static inventory of `ProgressSource` implementations and registration sites in the repository and the built DSH bundle.
- Environment: repository tree and built plugin at the reviewed revision.
- Required evidence: inventory output (contract test + bundle scan).
- Expected result: production DSH registers exactly `DshUsageProgressSource`; `MockProgressSource` remains the prototype/test/E2E source; no third source exists.
- Failure condition: any additional production source, or the mock registered in a production DSH run.

### ACC-USG-002 — Seam and emission audit

- Contracts: `CTR-USG-002`, `CTR-USG-008`
- Method: unit tests drive the source and assert every emitted object validates as `ProgressSnapshotV1` under the Engine's validator; emission occurs only on positive gain; points and revisions are monotone.
- Environment: unit project at the reviewed revision.
- Required evidence: test run transcript.
- Failure condition: any non-snapshot delivery, internal Engine generation, or regressing emission.

### ACC-USG-003 — Privacy audit

- Contracts: `CTR-USG-003`
- Method: static audit of the source's imports and reads (only `projectionValues` numeric fields and session ids); no test or fixture requires message content.
- Environment: repository tree at the reviewed revision.
- Required evidence: audit output.
- Failure condition: any read of message bodies, free text, titles, or credentials.

### ACC-USG-004 — Calibration vectors and counted classes

- Contracts: `CTR-USG-004`, `CTR-USG-005`
- Method: unit tests assert the counted-class normalization (cache/reasoning excluded; malformed reads as 0) and the exact function vectors 0; 434; 5,143; 6,688; 7,559; 12,000 for T = 0; 250,000; 13,028,844; 30,000,000; 47,479,532; 1,000,000,000, plus the cap invariant `DAILY_CAP < L3 threshold (30,000)`.
- Environment: unit project at the reviewed revision.
- Required evidence: test run transcript with exact assertions.
- Failure condition: any vector mismatch, counted-class inclusion, or configuration surface for the constants.

### ACC-USG-005 — Attribution semantics

- Contracts: `CTR-USG-006`, `CTR-USG-007`
- Method: unit tests cover first-observation seeding, growth deltas, day rollover, projection regression guard, and multi-session aggregation.
- Environment: unit project at the reviewed revision.
- Required evidence: test run transcript.
- Failure condition: backfilled history, double attribution, or wrong-day attribution.

### ACC-USG-006 — Persistence semantics

- Contracts: `CTR-USG-009`, `CTR-USG-011`
- Method: unit tests cover reload convergence, merge-guard against stale writes, tolerant normalization, memory fallback, and 90-day pruning bounds.
- Environment: unit project at the reviewed revision.
- Required evidence: test run transcript.
- Failure condition: replayed or lost progress on a normal reload, a stale tab regressing the stored record, or unbounded growth of the stored record.

### ACC-USG-007 — Degradation audit

- Contracts: `CTR-USG-010`, `CTR-USG-012`
- Method: unit/runtime audit with `tokenUsage` absent, with a regressed projection, and with storage unavailable; verify zero progress, zero resident noise, last state retained.
- Environment: unit project and isolated overlay at the reviewed revision.
- Required evidence: audit transcript.
- Failure condition: error surfaces, fabricated progress, or state loss on degradation paths.

### ACC-USG-008 — Isolated DSH integration and lifecycle

- Contracts: `CTR-USG-001`, `CTR-USG-002`, `CTR-USG-013`
- Method: pinned-revision isolated DSH home (`dsh plugin add`, disposable profile) with the token-meter unit loaded; drive real structured usage and verify the resident pet's derived level moves through the real snapshot seam (level observable in the retained Full Journey dialog surface and in the persisted engine storage), presentation per `DSH_PET_OVERLAY_ADAPTER_V3`; verify stop/uninstall disposes the source.
- Environment: disposable DSH home; the user's real profile and service are never touched.
- Required evidence: install/run/uninstall transcript and browser verification.
- Failure condition: growth without the snapshot seam, DSH Core modification, or a live source after uninstall.

### ACC-USG-009 — Presentation-neutral seam evidence

- Contracts: `CTR-USG-002`
- Method: negative assertion bound to the `ACC-USG-008` isolated-DSH integration audit: the usage seam's correctness evidence MUST NOT depend on any resident presentation element (`DSH_PET_OVERLAY_ADAPTER_V3` `CTR-OVERLAY-016` removed the resident bar); every seam observation is read from persisted engine storage or the journey surface. Re-verify the `ACC-USG-008` evidence path with the resident bar absent and confirm no evidence step references or requires it.
- Environment: disposable DSH home at the reviewed revision, with the V3 resident presentation (no resident progress bar) as in `ACC-USG-008`.
- Required evidence: evidence transcript annotated with the source of each seam observation (persisted engine storage or the Full Journey dialog surface) and showing zero resident-presentation dependencies.
- Expected result: seam correctness is fully observable without any resident presentation element; the V3 presentation removal has no effect on this evidence path.
- Failure condition: any seam-evidence step that depends on a resident presentation element (for example a resident progress bar), or that cannot be executed after the V3 presentation removal.

### Contract coverage

| Contract | Acceptance | Covered |
|---|---|---|
| `CTR-USG-001` | `ACC-USG-001`, `ACC-USG-008` | YES |
| `CTR-USG-002` | `ACC-USG-002`, `ACC-USG-008`, `ACC-USG-009` | YES |
| `CTR-USG-003` | `ACC-USG-003` | YES |
| `CTR-USG-004` | `ACC-USG-004` | YES |
| `CTR-USG-005` | `ACC-USG-004` | YES |
| `CTR-USG-006` | `ACC-USG-005` | YES |
| `CTR-USG-007` | `ACC-USG-005` | YES |
| `CTR-USG-008` | `ACC-USG-002` | YES |
| `CTR-USG-009` | `ACC-USG-006` | YES |
| `CTR-USG-010` | `ACC-USG-007` | YES |
| `CTR-USG-011` | `ACC-USG-006` | YES |
| `CTR-USG-012` | `ACC-USG-007` | YES |
| `CTR-USG-013` | `ACC-USG-008` | YES |

### Acceptance coverage

| Acceptance | Contracts | Covered |
|---|---|---|
| `ACC-USG-001` | `CTR-USG-001` | YES |
| `ACC-USG-002` | `CTR-USG-002`, `CTR-USG-008` | YES |
| `ACC-USG-003` | `CTR-USG-003` | YES |
| `ACC-USG-004` | `CTR-USG-004`, `CTR-USG-005` | YES |
| `ACC-USG-005` | `CTR-USG-006`, `CTR-USG-007` | YES |
| `ACC-USG-006` | `CTR-USG-009`, `CTR-USG-011` | YES |
| `ACC-USG-007` | `CTR-USG-010`, `CTR-USG-012` | YES |
| `ACC-USG-008` | `CTR-USG-001`, `CTR-USG-002`, `CTR-USG-013` | YES |
| `ACC-USG-009` | `CTR-USG-002` | YES |

Every Contract maps to at least one Acceptance item, and every Acceptance item maps back to at least one Contract.

## 11. Alternatives and disposition

| Alternative | Disposition | Reason | Evidence/claims | Reopen condition |
|---|---|---|---|---|
| Fixed linear rate (any) | Rejected | Cannot meet light-user floor and heavy-day crossing ceiling simultaneously | `OBS-USG-004` | A future accepted calibration authority |
| Log2 with larger scale (4,000,000) | Rejected | Halves light-day feedback (~200 pts) for equal median outcomes | `DEC-USG-005` | Future calibration authority |
| Historical backfill | Rejected | Places a fresh install mid-ladder; breaks grow-from-L1 | `DEC-USG-003` | Never under this Spec |
| Cache/reasoning classes counted | Rejected | Provider support varies; unstable fuel | `CLM-USG-003` | Future accepted calibration authority |
| Engine storage adapter for the ledger | Rejected | Frozen Engine surface; schema change out of scope | `DEC-USG-007` | A future accepted Engine amendment |
| Per-workspace sources | Rejected | Multiplies progress semantics; one pet is the product form | `DEC-USG-001` | A future accepted multi-source authority |

## 12. Migration, compatibility, and rollback

```text
MIGRATION = forward-only; first deployment starts every pet at 0 points (no backfill).
COMPATIBILITY = pinned to mayf3/deepseek-harness@419ee11c9bd5d01b206c8660762525d151bc4b4b interop surface (SessionSummary.projectionValues.tokenUsage; token-meter projection unit). The accepted DSH_PET_OVERLAY_ADAPTER_V1 §12 records that future Harness pins require compatibility review; this interop pin move is recorded here as part of that review obligation.
ROLLBACK = dsh plugin --profile web remove <installed-package> and restart the Web profile; repository rollback is revert of the implementation commit; deleting the ledger record re-baselines growth at current totals at the next mount (device-local loss, never a mid-session regression).
DATA_MIGRATION = NONE; the ledger is a disposable device-local cache; Engine storage remains canonical.
THIS_ROUND = docs-only authority succession: this V2 is proposed docs-first; the authorized acceptance commit atomically flips DSH_USAGE_PROGRESS_SOURCE_V1 to status superseded with superseded_by: DSH_USAGE_PROGRESS_SOURCE_V2 and updates the docs/specs/README.md index rows; no code changes in either commit.
```

## 13. Authorization gate and open questions

```text
SPEC_GOVERNANCE_MODE = AUTHOR
SPEC_ID = DSH_USAGE_PROGRESS_SOURCE_V2
SPEC_KIND = implementation
STATUS = accepted
AUTHORITY_LEVEL = governing_spec
IMPLEMENTATION_AUTHORITY = contracts
PRIMARY_PARENT_AUTHORITY = VEHICLE_PET_PROGRESS_SOURCE_V2
GOVERNANCE_PARENT = VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2
PRESENTATION_CONTEXT = DSH_PET_OVERLAY_ADAPTER_V3 (resident presentation only; it does not govern this seam)
EXTERNAL_AUTHORITIES = mayf3/deepseek-harness@419ee11c9bd5d01b206c8660762525d151bc4b4b interoperates_with (carried from V1 unchanged)
SUPERSEDES = DSH_USAGE_PROGRESS_SOURCE_V1
SUPERSESSION_MODE = WHOLE_AUTHORITY_ATOMIC
OPEN_OWNER_DECISIONS = NONE
NORMATIVE_TBD = NONE
UNRESOLVED_AUTHORITY_CONFLICT = NONE
PARTIAL_SUPERSESSION = NONE
CONTRACT_COUNT = 13
CONTRACTS_WITH_ACCEPTANCE = 13
ACCEPTANCE_COUNT = 9
CONTRACT_MEANING_DELTA_VS_V1 = NONE (all 13 CTR-USG Contracts carried byte-identically)
FROZEN_SEMANTICS_VS_V1 = USAGE_PROGRESS_SEMANTICS, TOKEN_ECONOMY, DAILY_TARGET_FUNCTION (1350 / 1,000,000 / 12,000), LEDGER schema and retention, ATTRIBUTION, BACKFILL_POLICY (no-backfill), SOURCE_IDENTITY (dsh-usage / companion), COUNTED_CLASSES, DEGRADATION — all UNCHANGED
DECLARED_DELTAS_VS_V1 = frontmatter identity/lifecycle/supersession metadata plus active-authority governed_by resolution; §1 narrow semantic decoupling (RESIDENT_PRESENTATION_REQUIREMENT = REMOVED_FROM_USAGE_SOURCE_AUTHORITY); DEC-USG-008 revised from "micro progress remains the Engine's existing behavior" to the presentation-blind source-only Decision; STATE-USG-001 historical record annotated (not rewritten); ACC-USG-008 presentation-neutral seam-evidence wording; DEC-USG-005 calibration-table visualization reference (math unchanged); additive ACC-USG-009 (seam evidence MUST NOT depend on any resident presentation element) and symmetric coverage tables; §3 narrative additions (CTR-OVERLAY-013 restated past-tense + verbatim V3 §3 quote, non-normative) and §13/§14 gate restructure itemized; §12 docs-only round note
AUTHORING_READY_FOR_REVIEW = YES
INDEPENDENT_REVIEW_RESULT = ACCEPT (zero blockers; three documentary findings)
READY_TO_MARK_ACCEPTED = YES
READY_TO_MARK_ACCEPTED_REASON = the exact proposed Head 3566eac passed the independent review against Base bf3ce2c with the Owner-mandated seven focus points all PASS; the authorized acceptance transition applies lifecycle fields plus the documentary DECLARED_DELTAS itemization only
READY_TO_MARK_ACCEPTED = PENDING (requires an independent review of the exact proposed Head; see §14)
NEXT_ACTION = REVIEW
```

## 14. Acceptance record

```text
SPEC_LIFECYCLE = proposed → accepted candidate
DSH_USAGE_PROGRESS_SOURCE_ACCEPTANCE_RECORD_V2 = YES
ACCEPTED_BY = mayf3
ACCEPTANCE_ACTOR = mayf3 (Goal 灵动 Owner RESUME_GOAL direction: "Usage V2 acceptance" within the same Goal; dependent authority closure, not NEW_GOAL)
ACCEPTED_AT = 2026-09-08T01:29:15Z
OWNER_ACCEPTANCE_DECISION = ACCEPT
INDEPENDENT_REVIEW_RESULT = ACCEPT (zero blockers; Owner seven focus points 1-7 all PASS)
REVIEWED_BASE_COMMIT = bf3ce2cb2ff5d3b3ed6f928f1837cd730016a1b4
REVIEWED_PROPOSED_HEAD = 3566eac
ACCEPTANCE_COMMIT_PARENT = 3566eac
SEMANTIC_DELTA_AFTER_REVIEW = NONE (lifecycle transition + documentary DECLARED_DELTAS itemization only)
BLOCKERS = 0
FROZEN_SEMANTICS_VS_V1 = USAGE_PROGRESS_SEMANTICS, TOKEN_ECONOMY, DAILY_TARGET_FUNCTION, LEDGER, ATTRIBUTION, BACKFILL_POLICY, SOURCE_IDENTITY, COUNTED_CLASSES, DEGRADATION — UNCHANGED
RESIDENT_PRESENTATION_REQUIREMENT = REMOVED_FROM_USAGE_SOURCE_AUTHORITY
SUPERSEDES = DSH_USAGE_PROGRESS_SOURCE_V1
SUPERSESSION_ATOMIC_IN_ACCEPTANCE_COMMIT = YES
CARRY_FORWARD_NOTES = (1) after acceptance, DSH_PET_OVERLAY_ADAPTER_V3 §3 USAGE_SOURCE_PARENT still names V1; references resolve through the supersession backlink to V2's identical carried seam semantics — a later docs round MAY reconcile the pointer; (2) EVD-USG-001 heading retains the accurate historical "V1 inventory" label
```

Binding facts:

- The independent review bound Base `bf3ce2cb2ff5d3b3ed6f928f1837cd730016a1b4`
  and proposed Head `3566eac` and returned `ACCEPT` with zero blockers; the
  Owner-mandated seven focus points (token economy zero change; usage source
  semantics zero change; only the resident presentation coupling removed; no
  Overlay UI obligation moved into the source; atomic successor lifecycle; no
  premature predecessor supersession; complete closure) each PASS.
- This acceptance commit's parent is exactly `3566eac`; content changes are
  lifecycle fields (this record, §13 status, frontmatter flip) plus the
  documentary DECLARED_DELTAS itemization, the atomic flip of
  `DSH_USAGE_PROGRESS_SOURCE_V1` to `status: superseded` with
  `superseded_by: DSH_USAGE_PROGRESS_SOURCE_V2`, and the
  `docs/specs/README.md` index rows — no Goal, Decision, Contract, or
  Acceptance meaning changed after review.
- `DshUsageProgressSource` implementation, registered since Goal 陪伴, is
  conformant under the identical carried Contracts; no code round is required
  by this succession.
- Activation is a reachability rule: active when the exact accepted revision
  is reachable from `mayf3/vehicle-pet:main` or an implementation base derived
  from it.
