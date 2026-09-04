# Progress Source R1 Spec Review (REVIEW mode, independent)

```text
SPEC_GOVERNANCE_MODE = REVIEW
SPEC_REVIEW = REVISE
READY_TO_MARK_ACCEPTED = NO
REVIEWED_BASE_COMMIT = 3fac52fecd63e6351e77f6d3ae2f6e9c0ba74901
REVIEWED_SPEC_COMMIT = 0331b33e63f0d6f526d44915567b727dbae301e4
REVIEWER_ID = independent-reviewer-agent-r2
AUTHOR_ID = goal-orchestrator-r1-cont
AUTHOR_INDEPENDENCE = PASS
AUTHORITY_REVIEW = FAIL
PRIMITIVE_BOUNDARY_REVIEW = PASS
CONTRACT_REVIEW = PASS
ACCEPTANCE_COVERAGE_REVIEW = PASS
IMMUTABILITY_REVIEW = PASS
BLOCKERS = 1
ACCEPTANCE_ACTOR_REQUIRED = mayf3
```

Review recommendation is not acceptance. `SPEC_REVIEW = REVISE` is caused by exactly
one blocker (B1), which is a single-cell metadata fix in the Spec index; every other
review dimension passes. Once B1 is closed at the final accepted head and the
final-head recheck confirms no other semantic delta, this reviewer's assessment is
that the two Specs are safe to accept (see Final-head binding).

## Coordinates and scope

```text
REPOSITORY = mayf3/vehicle-pet
REVIEWED_BASE_COMMIT = 3fac52fecd63e6351e77f6d3ae2f6e9c0ba74901 (merge-base with origin/main; equals origin/main tip at review time; matches the base claimed by both Specs' Current State)
REVIEWED_SPEC_COMMIT = 0331b33e63f0d6f526d44915567b727dbae301e4 (branch companion/usage-authority, local and origin)
REVIEWED_AT = 2026-09-04
SPEC_PATHS =
  docs/specs/VEHICLE_PET_PROGRESS_SOURCE_V2.md  (blob 3813f1d at the reviewed commit)
  docs/specs/DSH_USAGE_PROGRESS_SOURCE_V1.md    (blob 53a6919 at the reviewed commit)
  docs/specs/README.md (Spec index rows added for both Specs; blob 4f5155e at the reviewed commit)
```

Authorities read at the reviewed commit: `AGENTS.md`, `.agents/README.md`,
`.agents/local/README.md`, `.agents/skills/spec-governance/SKILL.md` +
`modes/REVIEW.md`, `VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1`,
`VEHICLE_PET_PRODUCT_DIRECTION_V1`, `CONFIGURABLE_PET_ENGINE_V1`,
`DSH_PET_OVERLAY_ADAPTER_V1`. Supporting records read:
`docs/investigations/DSH_USAGE_PROGRESS_SOURCE_INPUTS.md`,
`.agents/local/GOAL_COMPANION_R1.md`. Code skimmed only to verify Current State
claims: `src/dsh/client/OverlayProgressSource.ts`,
`src/prototype/MockProgressSource.ts`, `tests/contracts/architecture.test.ts`.

Worktree-state observation (process fact, see N2): the review worktree
`vehicle-pet-wt-companion-r1` was moved by a concurrent actor during this review.
All file content analyzed below was verified by blob hash to be the exact
`0331b33` tree of the reviewed paths. After the reviewed commit, the concurrent
actor first published `b3fb1ea` on branch `companion/usage-source` (the two docs
fixes plus two premature `src/dsh/**` implementation files), then rewrote history
to `e7984b2` on branch `companion/usage-authority`, which contains the two docs
fixes only and withdraws the implementation files. At review close the branch
delta from the reviewed commit is docs-only (2 files, 2 lines).

## Central authority questions

### 1) Do the two Specs legally lift the V1-only-MockProgressSource limit (CTR-DIR-003, CTR-PET-001/020/027) without rewriting accepted text or partial supersession? — YES

- Both Specs declare `supersedes: []` and neither edits any accepted file. No
  accepted Contract ID is reused; `CTR-SRC-*` and `CTR-USG-*` are new namespaces.
- The V1 registration limits are milestone-scoped by their own accepted text
  ("V1's only Progress Source MUST be `MockProgressSource`",
  "V1 MUST register only `MockProgressSource`"), and every parent authority
  explicitly reserved the successor path in accepted text: `DEC-DIR-002`
  ("real Token integration is a separate future Progress Source Spec and
  implementation"), `DEC-DIR-006` and `CTR-DIR-009` (deferred integrations
  "MUST be established by its own accepted Spec"), `CTR-PET-021` ("Both require a
  separate accepted Progress Source Spec"), `DEC-PET-009`, and the Product
  Direction alternatives-table reopen condition "Separate accepted Progress Source
  Spec". `VEHICLE_PET_PROGRESS_SOURCE_V2` is exactly that separate accepted
  Progress Source Spec at milestone level (`implementation_authority: none`,
  authorizing no code), and `DSH_USAGE_PROGRESS_SOURCE_V1` is exactly the
  per-source implementation authority its `CTR-SRC-002` requires.
- This is refinement through the parents' own pre-authorized conditional exit, not
  an override: the V1 Contracts remain true for V1, V1 conformance records remain
  valid as bound `(spec revision, implementation commit)` tuples
  (`DEC-SRC-001`, V2 §12 `HISTORICAL_REWRITE = none`), and no per-Contract
  supersession is inferred from prose (`PARTIAL_SUPERSESSION = NONE` in both).
- Internal consistency holds: prototype/test keep `MockProgressSource`
  (`CTR-SRC-005`, `CTR-USG-001`) consistent with `CTR-PET-020`; the production
  overlay source is exactly one (`CTR-USG-001`) consistent with `DEC-DIR-003`
  single shared journey; all progression flows only through `ProgressSnapshotV1`
  (`CTR-SRC-001`, `CTR-USG-002`) consistent with `CTR-PET-001`.

### 2) Is CTR-OVERLAY-013's reopen condition satisfied by exactly these Specs? — YES, accepted together

`CTR-OVERLAY-013` ends with its own reopen sentence: "Real token integration
requires a separate accepted governing Spec and is not authorized by this
Contract", and `DSH_PET_OVERLAY_ADAPTER_V1` ALT-OVERLAY-003 records the reopen
condition as "a separate accepted token/progress governing Spec". Reading the
Contract whole, its prohibition list is the deferral default whose exit it itself
defines; the final clause disclaims authorization by that Contract rather than
establishing an eternal ban (otherwise the reopen sentence would be meaningless).

- `VEHICLE_PET_PROGRESS_SOURCE_V2` (milestone authority) accepted together with
  `DSH_USAGE_PROGRESS_SOURCE_V1` (the concrete source authority, which states in
  §3 that acceptance of this exact revision together with V2 "is the act that
  opens it — strictly and only to the extent authorized here") is exactly the
  reserved reopen. No accepted text is rewritten; no Contract is partially
  superseded.
- The reopen is narrow and the surviving prohibitions stay binding and are
  independently re-imposed: no model calls and no remote progress API
  (`CTR-USG-013`: no network surface; `CTR-OVERLAY-008` unchanged), no
  turns/tools/tasks-as-points (`CTR-OVERLAY-007` unchanged; `DEC-SRC-003` and
  `DEC-USG-001` rejected-alternative), no DOM/text scraping
  (`CTR-OVERLAY-008`; `CTR-USG-003` is strictly stronger than `CTR-SRC-003`),
  counts-only privacy preserved across both Specs (`CTR-SRC-003` ⊆ `CTR-USG-003`).
- Consequence to record at acceptance/compliance time (N5): the overlay Spec's
  `ACC-OVERLAY-009`/`ACC-OVERLAY-018` static gates, re-run verbatim against a
  post-USG implementation, would classify the authorized usage source as a
  violation; they must be evaluated at their pinned pre-reopen coordinates, with
  the reopen recorded, while USG's own `ACC-USG-001..008` govern the new surface.

### 3) Owner delegation and acceptance actor

`.agents/local/README.md` fixes `SPEC_ACCEPTANCE_ACTOR = mayf3`.
`GOAL_COMPANION_R1.md` corroborates the R1_CONT_3 delegation
(`OWNER_DELEGATED_DECISION_AUTHORITY = YES`,
`OWNER_SPEC_ACCEPTANCE_POLICY = AUTO_APPROVE_IF_ALL_TRUE`,
decision `PREAUTHORIZED_ACCEPT`) and records the same final policy constants as
`DEC-USG-005` (`min(12000, 1350 x log2(1 + T / 1000000))`, counted =
uncachedInput + output, no backfill). Calibration parameters are Owner decisions
that cannot be derived from facts (investigation §5) and are ratified in
`DEC-USG-001..008` with explicit decision/rejected-alternative/reason — the
delegation's decision structure is used correctly. Note: the preauthorization
condition "independent spec audit = ACCEPT, 0 blockers" cannot fire while this
audit reports 1 blocker at the reviewed commit; see B1.

## Review passes

- Authority: FAIL — one metadata conflict (B1). Parent chain, repository ownership,
  external refs (`mayf3/deepseek-harness` pinned with repository + authority_id +
  exact revision + relation), reopen-condition usage, acceptance actor, and the
  no-partial-supersession structure are all otherwise correct.
- Primitive types: PASS — States carry subject/as-of/observed-at/projection/basis;
  Observations stay separate from interpretation (OBS-USG-004 records the negative
  result that motivates DEC-USG-004 without smuggling the decision in); Claims
  carry support states (`CLM-USG-003` correctly INFERRED); EVD relations carry
  source, target, polarity, coordinates, strength, limitations. Field-coordinate
  gaps are noted (N6), not type-coercion defects.
- Scope and decisions: PASS — no material product choice is left to
  implementation: source identity (`dsh-usage`, `companion`), counted classes and
  normalization, the frozen function and constants, attribution and local-day
  boundary, ledger key/shape/retention/pruning/merge-guard, emission and
  degradation semantics, lifecycle/disposal, and non-coercion are all frozen;
  non-goals are explicit and match the delegation's boundaries (no shop/quests/
  streak/audio/multi-pet/remote-pack; no second source; no calibration config
  surface).
- Contracts: PASS — identity (CTR-USG-001), negative paths (CTR-USG-004/006/010),
  trust/privacy boundary (CTR-USG-003), persistence/merge transaction semantics
  (CTR-USG-009), replay/idempotency (CTR-USG-008/009 against Engine CTR-PET-026
  ordering), lifecycle (CTR-USG-013), compatibility/rollback (USG §12), and audit
  surfaces (ACC-USG-001..008) are all present; multi-tab conflict is bounded by
  the merge-guard plus Engine-side ordering.
- Acceptance coverage: PASS — every Contract maps to at least one Acceptance item
  and every Acceptance item maps back (both coverage tables verified; see tables
  below); methods produce executed evidence at named environments; failure
  conditions reject wrong or bypassed implementations (e.g., ACC-USG-004 exact
  vector assertions; ACC-USG-001 failure on mock-in-production).
- Immutability: PASS — no accepted Spec is superseded or edited; no stable ID is
  reused with changed meaning; changes are strictly additive new authorities.
  (The name "PROGRESS_SOURCE_V2" has no `*_V1` file predecessor — the V1
  registration rule lives in the parent Specs — but `supersedes: []` is accurate
  and no unrecorded supersession is implied.)

## Findings

### BLOCKER 1 (B1) — Spec index misstates VEHICLE_PET_PROGRESS_SOURCE_V2 implementation authority

- File/section: `docs/specs/README.md`, "Repository Spec index" row for
  `VEHICLE_PET_PROGRESS_SOURCE_V2`, at the reviewed commit `0331b33`
  (blob `4f5155e`): the row reads `| proposed | no | implementation | contracts | ... |`.
- Exact reason: the index records `implementation_authority = contracts` for V2,
  contradicting V2's own frontmatter (`implementation_authority: none`) and
  `DEC-SRC-002` ("this Spec authorizes no code by itself") / `CTR-SRC-002` (every
  real source requires its own accepted source-specific Spec). The index is the
  repository's authority inventory and named evidence for the deferral gates
  (`ACC-DIR-009`, `ACC-PET-021`) and the `CTR-ADOPT-007` implementation gate; as
  written, an implementer could rely on the index to claim V2 alone authorizes
  implementing a real Progress Source. That is an authority-metadata conflict
  within the reviewed tree and must be fixed before acceptance.
- Remediation: change the row's implementation-authority cell to `none` (USG's row
  `contracts` is correct and matches its frontmatter). A post-review commit on
  branch `companion/usage-authority` (`e7984b2`, "sync V2 index row to
  implementation_authority none (B05)") performs exactly this edit (first
  published as `b3fb1ea` on `companion/usage-source` before the history rewrite);
  if the acceptance head is `e7984b2`, the final-head recheck is confined to that
  cell plus the N1 sentence edit and passes (see Final-head binding).

### NOTE 1 (N1) — DEC-USG-005 rejected-alternative figure is arithmetically wrong at the reviewed commit

- File/section: `DSH_USAGE_PROGRESS_SOURCE_V1.md` §8 `DEC-USG-005`, rejected
  alternative, at `0331b33`: "larger scale (e.g. 4,000,000) which halves light-day
  feedback (~200 pts)".
- Exact reason: at scale 4,000,000 with the frozen coefficient 1,350, a 250,000-token
  light day yields `1350 x log2(1.0625) = 118.07` → 118 pts — a ~73% cut, not a
  halving; ~215 pts occurs only if the coefficient is simultaneously re-matched
  (≈2,461) to preserve the 5,143 median. The investigation §8 carries the same
  defect ("light day only ~190–210 pts"). Non-normative (rejected alternative;
  the chosen constants and all Contracts are unaffected) but misleading for future
  calibration authorities. The `b3fb1ea` rewording ("well under half (~120-220 pts
  depending on coefficient matching)") is accurate and sufficient.

### NOTE 2 (N2) — Branch advanced during review; premature implementation files appeared and were withdrawn

- File/section: process observation; commits after the reviewed commit on the
  review worktree (`b3fb1ea` on `companion/usage-source`, superseded during review
  by `e7984b2` on `companion/usage-authority`).
- Exact reason: (a) under final-head binding, any semantic change after
  `REVIEWED_SPEC_COMMIT` requires the final accepted head to be independently
  re-checked; the observed post-review delta is confined to the B1 index-cell fix
  and the N1 sentence fix (docs-only). (b) Two implementation files
  (`src/dsh/client/UsageProgressSource.ts`, `src/dsh/client/usage-economy.ts`)
  briefly existed on `companion/usage-source` while
  `DSH_USAGE_PROGRESS_SOURCE_V1` was still `proposed`, and they broke the pinned
  source inventory in `tests/contracts/architecture.test.ts` ("registers exactly
  one Progress Source"); they were withdrawn in the rewrite to `e7984b2`.
  `CTR-ADOPT-007` requires an accepted implementation-authorizing Spec in the
  implementation base before non-mechanical implementation — the implementation
  round must not re-land those files before USG's acceptance, and must include the
  spec-authorized contract-test inventory update (USG §2 in scope). No content of
  the reviewed Specs is affected.

### NOTE 3 (N3) — The two Specs must be accepted atomically in one head

- File/section: `DSH_USAGE_PROGRESS_SOURCE_V1.md` §3 ("acceptance of this exact
  revision, together with `VEHICLE_PET_PROGRESS_SOURCE_V2`"); V2 frontmatter
  `status: proposed`.
- Exact reason: USG lists V2 in `governed_by`; a child accepted while its parent
  authority is still `proposed` would break parent precedence. Unlike the V1
  precedent (`PARENT_CHILD_ACCEPTED_ATOMICALLY = YES` in the V1 acceptance
  records), the atomicity is implied but not frozen in either Spec. The acceptance
  actor should accept both in the same head and record it (this matches the
  delegation context, which treats the two as one act).

### NOTE 4 (N4) — External interop pin moved relative to the accepted overlay Spec; review obligation recorded but evidence deferred

- File/section: both Specs' frontmatter (`mayf5/deepseek-harness` pinned at
  `419ee11c9bd5d01b206c8660762525d151bc4b4b`) vs
  `DSH_PET_OVERLAY_ADAPTER_V1` §12/§14 pin `f77b5a2fcebc2d9138f6608a60636f2294868d42`;
  USG §12 COMPATIBILITY.
- Exact reason: the overlay authority states "future Harness pins require
  compatibility review"; USG records the pin move "as part of that review
  obligation" rather than evidencing the review. Acceptable as a docs-only
  record, but the compatibility evidence (React major, slot/session seams) must
  be produced at implementation (ACC-USG-008 exercises the isolated DSH home at
  the new pin; ACC-OVERLAY-010 remains the React gate). Two active Specs will
  carry different pins of the same external authority ID; the difference should
  be mentioned in the overlay Spec's next lifecycle record.

### NOTE 5 (N5) — Post-reopen conformance runs of overlay ACC-OVERLAY-009/018 must be scoped

- File/section: `DSH_PET_OVERLAY_ADAPTER_V1` §10 `ACC-OVERLAY-009`/`ACC-OVERLAY-018`
  vs `DSH_USAGE_PROGRESS_SOURCE_V1.md` §3.
- Exact reason: re-run verbatim against a post-USG implementation, the overlay
  static gates ("no real-token ... adapter exists") would report DRIFTED although
  the reopen was exercised exactly as reserved. Historical conformance records
  stay valid as bound tuples; new evaluations after USG implementation must
  record the reopen and evaluate the usage source under USG's own acceptance
  items instead. Recording this in the acceptance record avoids a false DRIFTED
  aggregate later.

### NOTE 6 (N6) — Observation/State coordinates are thinner than the grammar's template

- File/section: `VEHICLE_PET_PROGRESS_SOURCE_V2.md` §4–§5 (`STATE-SRC-001/002`,
  `OBS-SRC-001..003`), `DSH_USAGE_PROGRESS_SOURCE_V1.md` §4–§5
  (`STATE-USG-001/002`, `OBS-USG-001..004`).
- Exact reason: several Observations omit explicit Subject / Repository / Commit /
  Environment / Observed-at fields (coordinates are recoverable from the Method
  text and the cited investigation; `Observed at` is date-only); `STATE-SRC-001`
  omits an Environment line; `OBS-SRC-003`'s "light 250k" is the round calibration
  persona, while the measured lightest active day is 241,724 (USG's `OBS-USG-003`
  states both correctly). Non-blocking precision/format gaps; falsifiability is
  preserved through the cited investigation record.

### NOTE 7 (N7) — Stale section pointer for the ratified calibration in supporting records

- File/section: `docs/investigations/DSH_USAGE_PROGRESS_SOURCE_INPUTS.md` §8 and
  `.agents/local/GOAL_COMPANION_R1.md` ("Owner-ratified calibration §3.5/§3.6";
  investigation §5 also uses the tentative name `DSH_PET_USAGE_PROGRESS_SOURCE_V1`).
- Exact reason: `DSH_USAGE_PROGRESS_SOURCE_V1.md` has no §3.5/§3.6; the calibration
  lives in §8 `DEC-USG-004`/`DEC-USG-005` and §9 `CTR-USG-005`. Supporting-record
  pointer drift only; the Spec itself is internally consistent.

## Verification arithmetic (independently recomputed, float64 then floor)

Function: `DAILY_TARGET_POINTS(T) = min(12000, 1350 x log2(1 + T / 1_000_000))`.

| Check | Claim (spec) | Recomputed | Verdict |
|---|---|---|---|
| Vector T = 0 | 0 | 0.000000 → 0 | OK |
| Vector T = 250,000 | 434 | 434.602928 → 434 | OK |
| Vector T = 13,028,844 (median) | 5,143 | 5143.937708 → 5,143 | OK |
| Vector T = 30,000,000 (heavy) | 6,688 | 6688.165019 → 6,688 | OK |
| Vector T = 47,479,532 (heavy max) | 7,559 | 7559.060220 → 7,559 | OK |
| Vector T = 1,000,000,000 | 12,000 (cap) | 13451.86 → capped 12,000 (cap binds from T ≈ 473.0M) | OK |
| MEDIAN_USER_L2 = 2–3 active days | day 2 | ceil(10000/5143) = 2 (day 1: 5,143 < 10,000; day 2: 10,286 ≥ 10,000) | OK |
| MEDIAN_USER_L5 = 3–6 weeks | 20 active days ≈ 3.3 wk | ceil(100000/5143) = 20 (19d = 97,717 < 100,000); 20 × 8/7 = 22.86 d = 3.27 wk | OK |
| MEDIAN_USER_L12 = 12–24 months | 487 active days ≈ 18.3 mo | ceil(2500000/5143) = 487 (486d = 2,499,498 < 2,500,000); 487 × 8/7 = 556.6 d = 18.29 mo | OK |
| LIGHT_USER_DAILY_VISIBLE_PROGRESS | ≈ 4.3% of L1 bar/day | 434/10,000 = 4.34% | OK |
| LIGHT_USER_L2 < 100 days | 24 active days | ceil(10000/434) = 24 (23d = 9,982 < 10,000) | OK |
| HEAVY_USER ≤ 1 crossing/day | 6,688–7,559; cap 12,000 < 20,001 | heavy vectors OK; fleet ladder min grant for two crossings from best position = 30,000 − 9,999 = 20,001 (all other positions larger; seedling ladder 50,001); 12,000 < 20,001 | OK |
| INSTALL_DAY_MULTI_LEVEL_JUMP = NO | cap 12,000 < L3 30,000; at most L2 | 12,000 < 30,000; 12,000 ≥ 10,000 ⇒ exactly ≤ 1 crossing (L2) even at 1e9 tokens | OK |
| NO_USAGE_NO_PROGRESS | delta 0 → no snapshot | gain = floor(target(0)) − applied = 0 ⇒ no emission (CTR-USG-008) | OK |
| Investigation §8 cross-check | 5,143/434/6,688/7,559/12,000; p25 5,791,707 → 3,731; min 241,724 → 421 | all match; heavy L5/L12 day 15/374 and day 14/331 also match | OK |
| DEC-USG-005 rejected-alt figure | "halves (~200 pts)" | 118 (frozen coef) / ≈215 (median-matched coef 2,460.9) | WRONG → N1 |

Tools: `python3` (`math.log2`, float64 then floor), `git` (blob hashes, merge-base,
diffs). All other quantitative statements in both Specs match the investigation
record and independent recomputation.

## Final-head binding

```text
FINAL_ACCEPTED_HEAD = PENDING (acceptance actor: mayf3, under the R1_CONT_3 delegation)
CANDIDATE_FINAL_HEAD_OBSERVED = e7984b206e9f7bb825952cb276d4a22c0f2e0664 (branch companion/usage-authority)
SEMANTIC_DELTA_AFTER_REVIEW = the observed candidate head differs from REVIEWED_SPEC_COMMIT by exactly two lines: the B1 index-cell fix (README V2 row → implementation_authority none) and the N1 sentence fix (DEC-USG-005 rejected-alternative figure)
FINAL_HEAD_RECHECK = PASS for exactly e7984b206e9f7bb825952cb276d4a22c0f2e0664 (delta independently diffed and examined during this review; both edits are semantically safe and change no chosen value, Contract, vector, or lifecycle field)
```

The B1 fix aligns the index with V2's frontmatter and `DEC-SRC-002`; the N1 fix
corrects a rejected-alternative figure without touching any chosen constant. Any
head other than the reviewed commit plus exactly these two edits requires a new
review. With `e7984b2` (or an equivalent B1-closing head rechecked as above) as
the accepted head, this reviewer's recommendation becomes ACCEPT with 0 blockers,
and the delegation's `AUTO_APPROVE_IF_ALL_TRUE` precondition
"independent spec audit = ACCEPT, 0 blockers" can be evaluated against that
final head rather than against `0331b33`.
