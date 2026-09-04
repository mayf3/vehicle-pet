---
spec_id: DSH_USAGE_PROGRESS_SOURCE_V1
status: proposed
spec_kind: implementation
authority_level: governing_spec
implementation_authority: contracts
scope:
  - dsh-usage-progress-source
  - counts-only-token-economy
  - usage-ledger-persistence
governed_by:
  - VEHICLE_PET_PRODUCT_DIRECTION_V1
  - CONFIGURABLE_PET_ENGINE_V1
  - DSH_PET_OVERLAY_ADAPTER_V1
  - VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1
  - VEHICLE_PET_PROGRESS_SOURCE_V2
external_authorities:
  - repository: mayf3/deepseek-harness
    authority_id: DEEPSEEK_HARNESS_PINNED_INTEROP_V1
    revision: 419ee11c9bd5d01b206c8660762525d151bc4b4b
    relation: interoperates_with
supersedes: []
superseded_by: null
owners:
  - mayf3
---

# DSH_USAGE_PROGRESS_SOURCE_V1

## 1. Goal

Authorize, as the source-specific implementation authority reserved by
`VEHICLE_PET_PROGRESS_SOURCE_V2` §2/§6 (`CTR-SRC-002`), exactly one real
external Progress Source for the Vehicle Pet: `DshUsageProgressSource`, which
converts counts-only DeepSeek Harness `tokenUsage` projection growth into
`ProgressSnapshotV1` `progressPoints` under the Owner-ratified calibration of
§4. The Engine, the `ProgressSnapshotV1` seam, Packs, presentation, and
`MockProgressSource` remain unchanged.

```text
GOAL = One calibrated, replay-safe, counts-only usage-to-progress source registered in the DSH overlay, silently degrading everywhere else.
SUCCESS_OUTCOME = Real DSH usage drives pet growth without backfill, multi-level jumps, compulsion mechanics, message-content access, or DSH Core modification.
DELIVERY_FORM = IMPLEMENTATION_AUTHORIZING_AUTHORITY
OWNING_REPOSITORY = mayf3/vehicle-pet
```

## 2. Authority relation

- This Spec is the "source-specific Spec" required by `VEHICLE_PET_PROGRESS_SOURCE_V2`
  (`CTR-SRC-002`) and by the accepted Product Direction's reopen condition
  ("separate accepted Progress Source Spec", `DEC-DIR-002`, `CTR-DIR-009`).
  `DSH_PET_OVERLAY_ADAPTER_V1` `CTR-OVERLAY-013` states the same reopen
  condition ("Real token integration requires a separate accepted governing
  Spec"); acceptance of this exact revision, together with
  `VEHICLE_PET_PROGRESS_SOURCE_V2`, is the act that opens it — strictly and
  only to the extent authorized here. No other `CTR-OVERLAY-*` or
  `CTR-PET-*` obligation is amended, and the overlay adapter Spec text is not
  rewritten.
- Calibration parameters are Owner decisions that cannot be derived from
  facts (`DSH_USAGE_PROGRESS_SOURCE_INPUTS.md` §5). They are ratified in this
  Spec under the Owner's explicit delegation of Goal 陪伴 (R1_CONT_3,
  `OWNER_DELEGATED_DECISION_AUTHORITY = YES`): the Goal Orchestrator selects
  the unique values inside the directive's frozen calibration targets, and
  the Owner preauthorized acceptance of the resulting authority
  (`OWNER_SPEC_ACCEPTANCE_POLICY = AUTO_APPROVE_IF_ALL_TRUE`).

## 3. Candidate semantics (frozen here, implemented once accepted)

### 3.1 Identity

```text
SOURCE_ID = dsh-usage
SUBJECT_ID = companion
```

One stable identity pair for the whole installation. A `subjectId` change is a
new growth journey under `CONFIGURABLE_PET_ENGINE_V1`; none is authorized by
this Spec.

### 3.2 Counted inputs

For every session row in a structured session-list snapshot, the source reads
the row's `projectionValues.tokenUsage` projection value — a finished whole
value delivered by the host under higher-seq-wins — and takes exactly:

```text
counted(session) = n(uncachedInputTokens) + n(outputTokens)
n(v) = v  when v is a safe non-negative integer, else 0
```

`cacheReadTokens`, `cacheWriteTokens`, and `reasoningTokens` are excluded
(provider support varies; the fuel must be stable and fair, not a billing
mirror). Absent, malformed, or truncated projections read as "no new counts",
never as an error and never as a negative delta.

### 3.3 Growth attribution (no backfill)

The source keeps `lastSeen(sessionId) = highest counted value already
attributed`. Per observation:

```text
delta(session) = max(0, counted(session) - lastSeen(sessionId))
```

The first observation of a session seeds `lastSeen` at its current total and
attributes nothing: a fresh install starts the pet at 0 points regardless of
historical usage (`HISTORICAL_BACKFILL = NO`, `INSTALL_DAY_MULTI_LEVEL_JUMP
= NO`). Sessions are anonymous stable ids; no per-session metadata beyond
`lastSeen` is retained.

### 3.4 Local day and daily ledger

Deltas observed while the device-local date is `D` are added to
`dailyTokens(D)`. `D` is the `YYYY-MM-DD` string of the observation moment in
the device-local timezone (`CONFIGURABLE_PET_ENGINE_V1` `DAILY_TIMEZONE`).
Tokens consumed while no DSH Web client was open are attributed on their next
observation — deterministically, never double-counted, never backdated.

### 3.5 Progress function (Owner-ratified calibration)

```text
DAILY_TARGET_POINTS(T) = min(12000, 1350 x log2(1 + T / 1000000))
gain(D) = floor(DAILY_TARGET_POINTS(dailyTokens(D))) - appliedPoints(D)
```

- `T` = `dailyTokens(D)`, the day's counted token total.
- Constants: `TOKEN_SCALE = 1,000,000`, `DAILY_COEFFICIENT = 1350`,
  `DAILY_CAP = 12,000`. They are normative only in this section; the
  implementation must not carry other values and must not introduce
  configuration surfaces for them.
- On every positive `gain`, the source emits one snapshot with
  `progressPoints = cumulativePoints + gain` and a strictly increasing
  `revision`; `gain <= 0` emits nothing. `cumulativePoints` is the sum of all
  applied `gain`s and therefore never regresses.
- Rationale (verification in `DSH_USAGE_PROGRESS_SOURCE_INPUTS.md` §8): the
  log form gives every active day visible growth while naturally diminishing
  extreme days; the cap is a safety invariant that bounds any single day below
  the L3 threshold (30,000 points), so no local day can ever cross two
  thresholds.

### 3.6 Calibration targets and measured verification

Input distribution (18 observed active days, counts-only):
median 13,028,844; light 250,000; heavy 30,000,000–47,479,532 counted
tokens/day.

| Frozen target | Selected-policy outcome | Result |
|---|---|---|
| MEDIAN_USER_L2 = 2–3 active days | 10,000 pts at 5,144/day → day 2 | MET |
| MEDIAN_USER_L5 = 3–6 weeks | 100,000 pts → 20 active days ≈ 3.3 calendar weeks at observed 7/8 cadence | MET |
| MEDIAN_USER_L12 = 12–24 months | 2,500,000 pts → 487 active days ≈ 18.3 calendar months | MET |
| LIGHT_USER_DAILY_VISIBLE_PROGRESS | 435 pts/day ≈ 4.3% of the L1 micro-progress bar per day | MET |
| LIGHT_USER_L2 < 100 days | 23 active days | MET |
| HEAVY_USER ≤ 1 level crossing per local day | heavy days earn 6,688–7,559 pts (< L2 span 10,000 at ladder top span) — at most one threshold per day across the whole ladder | MET |
| INSTALL_DAY_MULTI_LEVEL_JUMP = NO | cap 12,000 < L3 threshold 30,000 — even 1e9 counted tokens cross at most L2 | MET (invariant) |
| NO_USAGE_NO_PROGRESS = YES | delta 0 → gain 0 → no snapshot | MET |

### 3.7 Ceremony and presentation

Unchanged engine semantics: receipts and ceremonies remain exactly the
Engine's per-threshold-crossing, never-repeated, merged, short, skippable,
degradable behavior; within-level micro progress remains the resident
within-level bar. This Spec adds no ceremony, sound, or notification.

### 3.8 Persistence

One versioned browser-local record (`vehicle-pet/usage-ledger/v1`,
same-origin `localStorage`) holds the ledger: `cumulativePoints`, `revision`,
`byDay` (`dailyTokens`/`appliedPoints`), and `lastSeen`. The record is
tolerantly normalized (malformed, wrong-version, unavailable, or quota-failed
storage falls back to an in-memory ledger; the pet keeps growing for the
session, and a later reload re-baselines at current totals — losing device
progress but never regressing mid-session). Pruning: `byDay` entries older
than 90 local days are dropped at the first observation of a new day
(applied points are already baked into `cumulativePoints`); `lastSeen`
entries for sessions absent from a day's first list snapshot are dropped.
Cross-tab behavior is convergence by pure function: every tab computes the
same target from the same daily totals, engines ignore stale/regressing
snapshots, and the stored ledger converges to the same cumulative points.

### 3.9 Failure, absence, and degradation

- `tokenUsage` capability absent (token-meter unit not loaded): no deltas, no
  progress, no resident-surface error — the pet keeps its last valid state.
- Host projection truncation/regression (restart re-seed): `max(0, ·)` never
  re-attributes or double-counts.
- Storage unavailable: memory-only ledger for the session; silent.
- Source removal or disposal: last applied valid snapshot stays effective.

## 4. Non-goals

- No Engine, schema, validation, Pack, Panel, Full Journey, asset, or
  overlay-state changes beyond registering the authorized source.
- No cache/reasoning token classes, no per-model or per-workspace weighting,
  no backfill, no decay, no streak, no absence penalty, no goals/quests.
- No reading of raw session logs, event streams, Prompt/Completion text,
  message bodies, tool payloads, or credentials.

## 5. Contracts

### CTR-USG-001 — Exactly one real source; Mock retained

The DSH overlay client registers exactly one real Progress Source,
`DshUsageProgressSource` (sourceId `dsh-usage`). `MockProgressSource` remains
the registered source of the prototype shell, unit/contract tests, and the
E2E progress fixture; production DSH runs never register the mock.

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
message bodies, tool payloads, credentials, titles, or free text of any kind,
and MUST NOT subscribe to raw session or event streams.

### CTR-USG-004 — Frozen counted classes

Only `uncachedInputTokens + outputTokens` are counted. Cache read/write and
reasoning classes are excluded even when present.

### CTR-USG-005 — Frozen progress function

`DAILY_TARGET_POINTS(T) = min(12000, 1350 x log2(1 + T / 1000000))` with
floor-to-integer application per §3.5 is the only points mapping. No
configuration, environment, pack, or user preference may alter the constants
or the form.

### CTR-USG-006 — Delta attribution and no backfill

Only non-negative per-session growth after first observation is attributed;
first observations seed silently; install-day progress starts at zero.

### CTR-USG-007 — Local-day boundary

Attribution uses the device-local `YYYY-MM-DD` day of observation; no other
timezone or UTC day boundary is used for points.

### CTR-USG-008 — Monotone emission

A snapshot is emitted only for `gain > 0`; `progressPoints` never regresses;
`revision` strictly increases across emissions from this source.

### CTR-USG-009 — Persistence and replay safety

The ledger persists in one versioned browser-local record keyed for this
source; reload re-emits the persisted cumulative total; a lost or malformed
ledger degrades to memory and re-baselines at current totals without
regressing a live session or replaying ceremonies (receipt once-semantics
remain Engine-owned).

### CTR-USG-010 — Silent degradation

Capability absence, projection truncation, storage failure, and source
disposal apply no progress, raise no resident-surface error, and leave the
last applied valid snapshot effective.

### CTR-USG-011 — Bounded ledger

`byDay` retention is bounded (90 local days) and `lastSeen` is pruned for
sessions absent at a day boundary; the stored record stays small and bounded
for the life of the installation.

### CTR-USG-012 — Non-coercive

The source adds no streak, decay, absence penalty, reminder, notification, or
interaction demand; growth stops when usage stops and never reverses.

### CTR-USG-013 — Lifecycle and disposal

The source and any storage listeners it owns are created and disposed with
the overlay plugin fiber (stop, HMR, reload, update, uninstall leave no live
resource); the source owns no timers and no network surface.

## 6. Acceptance

### ACC-USG-001 — Source inventory

- Contracts: `CTR-USG-001`
- Method: static inventory of `ProgressSource` implementations and
  registration sites in the repository and the built DSH bundle.
- Expected result: production DSH registers exactly `DshUsageProgressSource`;
  `MockProgressSource` remains the prototype/test/E2E source; no third source
  exists.
- Failure condition: any additional production source, or the mock registered
  in a production DSH run.

### ACC-USG-002 — Seam audit

- Contracts: `CTR-USG-002`, `CTR-USG-008`
- Method: unit tests drive the source and assert every emitted object
  validates as `ProgressSnapshotV1` under the Engine's validator; emission
  occurs only on positive gain; points and revisions are monotone.
- Failure condition: any non-snapshot delivery, internal Engine generation,
  or regressing emission.

### ACC-USG-003 — Privacy audit

- Contracts: `CTR-USG-003`
- Method: static audit of the source's imports and reads (only
  `projectionValues` numeric fields and session ids); no test or fixture
  requires message content.
- Failure condition: any read of message bodies, free text, or credentials.

### ACC-USG-004 — Calibration vectors

- Contracts: `CTR-USG-005`
- Method: unit tests assert exact function values for the frozen vectors
  (0; 250k; 13,028,844; 30M; 47,479,532; 1e9 → 0; 435; 5,144; 6,688; 7,559;
  12,000) and the cap invariant `DAILY_CAP < L3 threshold`.
- Failure condition: any vector mismatch or configuration surface for the
  constants.

### ACC-USG-005 — Attribution semantics

- Contracts: `CTR-USG-006`, `CTR-USG-007`
- Method: unit tests cover first-observation seeding, growth deltas, day
  rollover, projection regression guard, and multi-session aggregation.
- Failure condition: backfilled history, double attribution, or wrong-day
  attribution.

### ACC-USG-006 — Persistence semantics

- Contracts: `CTR-USG-009`, `CTR-USG-011`
- Method: unit tests cover reload convergence, tolerant normalization,
  memory fallback, and 90-day pruning bounds.
- Failure condition: replayed or lost progress on a normal reload, or
  unbounded growth of the stored record.

### ACC-USG-007 — Degradation audit

- Contracts: `CTR-USG-010`, `CTR-USG-012`
- Method: runtime/unit audit with `tokenUsage` absent, with a regressed
  projection, and with storage unavailable; verify zero progress, zero
  resident noise, last state retained.
- Failure condition: error surfaces, fabricated progress, or state loss on
  degradation paths.

### ACC-USG-008 — Isolated DSH integration

- Contracts: `CTR-USG-001`, `CTR-USG-002`, `CTR-USG-013`
- Method: pinned-revision isolated DSH home (`dsh plugin add`, disposable
  profile) with the token-meter unit loaded; drive real structured usage and
  verify the resident pet's level/micro progress moves through the real
  snapshot seam; verify stop/uninstall disposes the source.
- Failure condition: growth without the snapshot seam, DSH Core modification,
  or a live source after uninstall.

## 7. Migration, compatibility, and rollback

```text
MIGRATION = forward-only; first deployment starts every pet at 0 points (no backfill).
COMPATIBILITY = pinned to mayf3/deepseek-harness@419ee11c9bd5d01b206c8660762525d151bc4b4b interop surface (SessionSummary.projectionValues.tokenUsage; token-meter projection unit).
ROLLBACK = dsh plugin --profile web remove <installed-package> and restart the Web profile; repository rollback is revert of the implementation commit; deleting the ledger record re-baselines growth at current totals (device-local loss, never a mid-session regression).
DATA_MIGRATION = NONE; the ledger is a disposable device-local cache; Engine storage remains canonical.
```

## 8. Owner acceptance gate

This Spec is `proposed`. Acceptance of this exact revision authorizes the
implementation of §3 under Contracts §5 — nothing else. Acceptance is
preauthorized by the Owner
(`OWNER_SPEC_ACCEPTANCE_POLICY = AUTO_APPROVE_IF_ALL_TRUE`, Goal 陪伴
R1_CONT_3) and executes only after an independent Spec audit of the exact
Base/Head returns `ACCEPT` with zero blockers.

## 9. Open questions

```text
OPEN_OWNER_DECISIONS = NONE
NORMATIVE_TBD = NONE
UNRESOLVED_AUTHORITY_CONFLICT = NONE
PARTIAL_SUPERSESSION = NONE
READY_TO_MARK_ACCEPTED = PENDING_INDEPENDENT_AUDIT
```
