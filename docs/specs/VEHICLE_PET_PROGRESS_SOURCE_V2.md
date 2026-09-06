---
spec_id: VEHICLE_PET_PROGRESS_SOURCE_V2
status: accepted
spec_kind: implementation
authority_level: governing_spec
implementation_authority: none
scope:
  - progress-source-registration
  - post-v1-external-progress-sources
  - token-usage-consumption-boundary
governed_by:
  - VEHICLE_PET_PRODUCT_DIRECTION_V1
  - CONFIGURABLE_PET_ENGINE_V2
  - DSH_PET_OVERLAY_ADAPTER_V1
  - VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1
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

# VEHICLE_PET_PROGRESS_SOURCE_V2

## 1. Goal

Authorize, after independent review and Owner acceptance of this exact proposed
revision, the successor milestone of the Progress Source boundary: real
external Progress Sources MAY register for the Vehicle Pet after V1, under the
seam and isolation conditions the accepted Product Direction itself reserved
for this step (`FUTURE_TOKEN_INTEGRATION = separate Progress Source Spec and
implementation`, `DEC-DIR-002`, and the "Separate accepted Progress Source
Spec" reopen conditions), while the Engine's snapshot-only progression model
stays unchanged.

```text
GOAL = Lift the V1-only-Mock registration limit for the successor milestone without rewriting any unrelated accepted Contract.
SUCCESS_OUTCOME = One accepted authority under which a concrete real Progress Source (e.g. DSH structured token-usage counts) can be individually authorized, implemented through ProgressSnapshotV1, and audited, while MockProgressSource remains the prototype/test source.
DELIVERY_FORM = DOCS_ONLY_AUTHORITY
OWNING_REPOSITORY = mayf3/vehicle-pet
```

## 2. Scope and non-goals

In scope:

- the successor registration rule that replaces, for this milestone only, the
  V1-only-`MockProgressSource` limit (`CTR-DIR-003`, `CTR-PET-001`);
- the per-source authorization pattern (`CTR-SRC-002`) that binds every real
  source to its own accepted source-specific Spec;
- the timeless boundary obligations every real source inherits (snapshot-seam
  exclusivity, counts-only privacy, silent degradation, Mock retention).

Out of scope:

- any concrete source, counted token class, points mapping, or calibration
  value — those are owned solely by a source-specific implementation Spec
  (`DSH_USAGE_PROGRESS_SOURCE_V1`);
- Engine internals, schema, validation, or level derivation;
- Panel, Full Journey, Pack, overlay-state, or asset changes;
- code changes of any kind by this Spec alone.

## 3. Authority and dependencies

This Spec is governed by `VEHICLE_PET_PRODUCT_DIRECTION_V1`,
`CONFIGURABLE_PET_ENGINE_V1`, `DSH_PET_OVERLAY_ADAPTER_V1`, and
`VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1`. The pinned
`mayf3/deepseek-harness` revision is interop context only, not implementation
input. It is the minimal successor for exactly one normative limitation; it
supersedes no authority and rewrites no accepted text.

## 4. Current State

### STATE-SRC-001 — No real Progress Source is registered

- Subject: `mayf3/vehicle-pet` registered Progress Source inventory
- As of commit: `3fac52f` (origin/main)
- Observed at: `2026-09-04T00:00:00Z`
- Projection: the prototype shell and the DSH overlay register only the
  `MockProgressSource`-derived placeholder; no real external source exists;
  conformance records for V1 remain valid
- Basis: `OBS-SRC-001`

### STATE-SRC-002 — The counts-only usage seam exists in the pinned Harness

- Subject: DSH client `SessionSummary.projectionValues.tokenUsage`
- As of commit: `mayf3/deepseek-harness` `419ee11c9bd5d01b206c8660762525d151bc4b4b`
- Observed at: `2026-09-03`
- Projection: structured, counts-only usage projections are deliverable to a
  plugin client without DSH Core modification; capability absence is
  observable as key absence
- Basis: `OBS-SRC-002`

## 5. Observations

### OBS-SRC-001 — V1 registers only the mock source

- Method: static inventory at base `3fac52f` (`tests/contracts/architecture.test.ts`, `src/dsh/client/OverlayProgressSource.ts`, `src/prototype/MockProgressSource.ts`)
- Result: the only `ProgressSource` implementations are the prototype mock and the overlay placeholder that reuses it; no network/model/transport surface exists in either
- Provenance: repository tree at the exact base commit

### OBS-SRC-002 — Structured counts-only usage projections are client-readable

- Method: read-only structural investigation of the pinned Harness (`packages/client/runtime` session service typings, `packages/llm/token-meter` projection definitions)
- Result: `projectionValues` are finished whole values delivered under higher-seq-wins; the `tokenUsage` fold is idempotent per `(turn, step)`; the vehicle-pet client already holds the injected `sessions` service; no Core change is required
- Provenance: `docs/investigations/DSH_USAGE_PROGRESS_SOURCE_INPUTS.md` §1–§3

### OBS-SRC-003 — Real usage distribution was measured counts-only

- Method: counts-only script over local DSH session logs (numeric usage fields + identity only; message content never read)
- Result: 18 active days, median 13.0M counted tokens/day, light 250k, heavy 30.0–47.5M, historical total ≈280.8M
- Provenance: `docs/investigations/DSH_USAGE_PROGRESS_SOURCE_INPUTS.md` §6–§7

## 6. Claims and assumptions

### CLM-SRC-001 — The successor lift is safe under the existing seam

- Support state: SUPPORTED
- Supported by evidence: `EVD-SRC-001`, `EVD-SRC-002`
- Contradicted by evidence: NONE
- Uncertainty: concrete safety for one concrete source is proven only by that source's own Spec and audits

### CLM-SRC-002 — Real usage growth can drive the pet without reading message content

- Support state: SUPPORTED
- Supported by evidence: `EVD-SRC-002`, `EVD-SRC-003`
- Contradicted by evidence: NONE
- Uncertainty: none known for the projection path itself

## 7. Evidence relations

### EVD-SRC-001 — V1 inventory supports the clean-lift Claim

- Source observations: `OBS-SRC-001`
- Target: `CLM-SRC-001`
- Relation: SUPPORTS
- Bound coordinates: base `3fac52f`
- Strength/sufficiency: exact static inventory; sufficient for the registration claim
- Limitations: runtime registration paths in the pinned Harness are audited per implementation
- Provenance: repository tree at base

### EVD-SRC-002 — Projection structure supports the counts-only Claim

- Source observations: `OBS-SRC-002`
- Target: `CLM-SRC-001`, `CLM-SRC-002`
- Relation: SUPPORTS
- Bound coordinates: `mayf3/deepseek-harness` `419ee11c9bd5d01b206c8660762525d151bc4b4b`
- Strength/sufficiency: structural typing plus fold semantics; sufficient
- Limitations: deployment must load the token-meter unit; absence is handled as degradation
- Provenance: investigation §1–§4

### EVD-SRC-003 — Measured distribution supports calibration being ratable

- Source observations: `OBS-SRC-003`
- Target: `CLM-SRC-002`
- Relation: SUPPORTS
- Bound coordinates: local DSH session logs, window 2026-08-14..2026-09-02
- Strength/sufficiency: sufficient for parameter selection; not a billing record
- Limitations: one user's real distribution; counts only
- Provenance: investigation §6–§8

## 8. Decisions

### DEC-SRC-001 — Successor milestone, not a V1 rewrite

- Decision owner: `mayf3` (ratified under Goal 陪伴 R1_CONT_3 delegation)
- Decision: the registration limit is lifted for the successor milestone by this dedicated authority; V1 facts, contracts, and conformance records stand unreopened; no accepted text is rewritten.
- Rejected alternative: amending `CTR-DIR-003`/`CTR-PET-001` in place, or wholly superseding the parent Specs.
- Reason: keeps V1 history true and avoids rewriting unrelated accepted Contracts.
- Owner input remaining: NONE

### DEC-SRC-002 — Per-source implementation authority

- Decision owner: `mayf3` (ratified under Goal 陪伴 R1_CONT_3 delegation)
- Decision: each real source requires its own accepted, implementation-authorizing Spec carrying Owner-ratified calibration; uncalibrated defaults are prohibited; this Spec authorizes no code by itself (`implementation_authority: none`).
- Rejected alternative: authorizing the concrete usage source in this Spec.
- Reason: separation keeps the milestone boundary reviewable and the source-specific parameters (the calibration) in exactly one authority.
- Owner input remaining: NONE

### DEC-SRC-003 — The first successor source is counts-only DSH usage

- Decision owner: `mayf3` (ratified under Goal 陪伴 R1_CONT_3 delegation)
- Decision: the candidate class for the follow-on source-specific authority is structured counts-only `tokenUsage` projections; the source-specific Spec is `DSH_USAGE_PROGRESS_SOURCE_V1`.
- Rejected alternative: deriving progress from raw session logs, turns, or host activity events.
- Reason: counts-only projections are structured, idempotent, privacy-safe, and require no Core change.
- Owner input remaining: NONE

## 9. Contracts

### CTR-SRC-001 — Snapshot-seam exclusivity

Every real external Progress Source MUST deliver progression exclusively as
`ProgressSnapshotV1` snapshots accepted by the Engine's existing validation.
No other Engine input, internal derivation, or host-activity path MAY produce
`progressPoints`.

### CTR-SRC-002 — Per-source implementation authority

Registration of a real external Progress Source within the successor
milestone is authorized only by an accepted source-specific Spec that binds
the source's counted inputs, dedup identity, persistence semantics, privacy
boundary, and Owner-ratified calibration. Absent such a Spec, the only
registered source remains `MockProgressSource`.

### CTR-SRC-003 — Counts-only structural boundary

A usage-derived source MUST process only numeric counts and stable identity
tuples and MUST NOT read, retain, transmit, or log Prompt text, Completion
text, message bodies, tool payloads, session titles, or credentials.

### CTR-SRC-004 — Silent degradation

An absent, failing, or degraded real source MUST apply no progress, emit no
resident-surface error or noise, and leave the last applied valid snapshot
effective.

### CTR-SRC-005 — Mock retention

`MockProgressSource` MUST remain available and registered for the prototype
and test environments regardless of any real source's authorization.

## 10. Acceptance

### ACC-SRC-001 — Boundary inventory

- Contracts: `CTR-SRC-002`, `CTR-SRC-005`
- Method: static audit of registered source inventory in the repository and the built DSH bundle.
- Environment: repository tree and built plugin at the reviewed revision.
- Required evidence: source inventory output.
- Expected result: with no source-specific implementation Spec accepted, the inventory is exactly the mock/placeholder; after one is accepted, every registered real source traces to exactly one accepted source-specific Spec.
- Failure condition: any registered real source without its own accepted authority, or any second unregistered source path.

### ACC-SRC-002 — Snapshot-seam audit

- Contracts: `CTR-SRC-001`
- Method: static and runtime audit of progress mutation paths for every registered real source.
- Environment: Engine ingestion seam and source implementation at the reviewed revision.
- Required evidence: audit output and unit/runtime traces through `ProgressSnapshotV1` validation.
- Expected result: all progress mutation paths pass through `ProgressSnapshotV1` validation; no internal generation or host-activity grant path exists.
- Failure condition: any progress path bypassing the snapshot seam.

### ACC-SRC-003 — Privacy audit

- Contracts: `CTR-SRC-003`
- Method: static audit of every usage-derived path's reads, stores, and logs.
- Environment: source implementation at the reviewed revision.
- Required evidence: audit output; test/fixture inventory showing no message content requirement.
- Expected result: only numeric counts and identity tuples are touched.
- Failure condition: any read, retention, transmission, or log of prohibited content.

### ACC-SRC-004 — Degradation audit

- Contracts: `CTR-SRC-004`
- Method: runtime/unit exercise of source absence, failure, and degradation paths.
- Environment: running overlay with the real source removed or degraded.
- Required evidence: audit transcript.
- Expected result: no progress applied, no new resident-surface error; the pet keeps its last valid state.
- Failure condition: error surfaces, fabricated progress, or state loss on degradation.

### Contract coverage

| Contract | Acceptance | Covered |
|---|---|---|
| `CTR-SRC-001` | `ACC-SRC-002` | YES |
| `CTR-SRC-002` | `ACC-SRC-001` | YES |
| `CTR-SRC-003` | `ACC-SRC-003` | YES |
| `CTR-SRC-004` | `ACC-SRC-004` | YES |
| `CTR-SRC-005` | `ACC-SRC-001` | YES |

Every Contract maps to at least one Acceptance item, and every Acceptance item maps back to at least one Contract.

## 11. Alternatives and disposition

| Alternative | Disposition | Reason | Evidence/claims | Reopen condition |
|---|---|---|---|---|
| Amend `CTR-DIR-003`/`CTR-PET-001` in place | Rejected | Rewrites accepted V1 text and re-opens conformance | `OBS-SRC-001` | Never under this Spec |
| Wholly supersede the parent Specs | Rejected | Would rewrite every unrelated accepted Contract | `DEC-SRC-001` | A future accepted supersession Spec |
| Authorize the concrete source here | Rejected | Mixes milestone boundary with ratable calibration parameters | `DEC-SRC-002` | None; done by `DSH_USAGE_PROGRESS_SOURCE_V1` |
| Derive progress from turns/host activity | Rejected | Not a usage measure; conflicts with `CTR-PET-024` | `DEC-SRC-003` | A future accepted authority |

## 12. Migration, compatibility, and rollback

```text
MIGRATION = forward-only; docs-only authority change.
HISTORICAL_REWRITE = none; V1 facts and conformance records stand.
PRODUCT_COMPATIBILITY = no code change by this Spec; concrete sources carry their own compatibility sections.
ROLLBACK = revert the complete docs-only commit proposing/accepting this Spec.
DATA_MIGRATION = NONE.
```

## 13. Open questions

```text
OPEN_OWNER_DECISIONS = NONE
NORMATIVE_TBD = NONE
UNRESOLVED_AUTHORITY_CONFLICT = NONE
PARTIAL_SUPERSESSION = NONE
READY_TO_MARK_ACCEPTED = YES
```

`READY_TO_MARK_ACCEPTED = YES`: the independent audit of the exact Base
`3fac52f` and Head `e7984b2` returned `ACCEPT` with zero blockers, and Owner
`mayf3` preauthorized acceptance
(`OWNER_SPEC_ACCEPTANCE_POLICY = AUTO_APPROVE_IF_ALL_TRUE`) under the explicit
delegation of Goal 陪伴 (R1_CONT_3, `OWNER_DELEGATED_DECISION_AUTHORITY =
YES`). See §14 for the acceptance record.

## 14. Acceptance record

```text
SPEC_LIFECYCLE = proposed → accepted candidate
SPEC_ACCEPTANCE_RECORD_V1 = YES
ACCEPTED_BY = mayf3
ACCEPTANCE_ACTOR = mayf3 (executed by the Goal Orchestrator under explicit Owner delegation)
ACCEPTED_AT = 2026-09-04T14:40:19Z
OWNER_ACCEPTANCE_DECISION = PREAUTHORIZED_ACCEPT
ACCEPTANCE_EXECUTED_UNDER_EXPLICIT_OWNER_DELEGATION = YES
INDEPENDENT_AUDIT_RESULT = ACCEPT
REVIEWED_BASE_COMMIT = 3fac52f
REVIEWED_PROPOSED_HEAD = e7984b206e9f7bb825952cb276d4a22c0f2e0664
ACCEPTANCE_COMMIT_PARENT = e7984b206e9f7bb825952cb276d4a22c0f2e0664
SEMANTIC_DELTA_AFTER_REVIEW = NONE (lifecycle transition only: proposed → accepted candidate)
BLOCKERS_CLOSED = B01, B02, B03, B04, B05 (audit rounds at 7ff9a58 and 0331b33; all closed and re-verified at e7984b2)
BLOCKERS_REMAINING = 0
OPEN_OWNER_DECISIONS = NONE
NORMATIVE_TBD = NONE
ACCEPTANCE_ORDER = FIRST (this Spec is accepted in the same atomic commit as, and logically before, its child DSH_USAGE_PROGRESS_SOURCE_V1, so the child never rests on an unaccepted parent)
```

Binding facts:

- The independent audit bound the reviewed Base `3fac52f` and the reviewed
  Head `e7984b206e9f7bb825952cb276d4a22c0f2e0664` and returned `ACCEPT` with
  zero blockers; all earlier blockers are closed and re-verified at that Head.
- This acceptance commit's parent is exactly the reviewed Head; the only
  semantic change is the lifecycle transition `proposed → accepted candidate`
  recorded here and in the matching sections of `DSH_USAGE_PROGRESS_SOURCE_V1`
  and `docs/specs/README.md`.
- This Spec is now an `accepted candidate`: `status: accepted` with
  `implementation_authority: none` unchanged. It is not yet active repository
  authority because this exact accepted Head is not yet reachable from
  `mayf3/vehicle-pet:main`.
- No code is authorized by this Spec alone; the concrete source
  `DshUsageProgressSource` is authorized only by the atomically accepted
  `DSH_USAGE_PROGRESS_SOURCE_V1` (`implementation_authority: contracts`)
  whose implementation remains blocked until both accepted Heads are
  reachable from `mayf3/vehicle-pet:main` or a main-derived implementation
  base.
