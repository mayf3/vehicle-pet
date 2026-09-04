---
spec_id: VEHICLE_PET_PROGRESS_SOURCE_V2
status: proposed
spec_kind: implementation
authority_level: governing_spec
implementation_authority: contracts
scope:
  - progress-source-registration
  - post-v1-external-progress-sources
  - token-usage-consumption-boundary
governed_by:
  - VEHICLE_PET_PRODUCT_DIRECTION_V1
  - CONFIGURABLE_PET_ENGINE_V1
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

## 2. Successor relation to the accepted authorities (SUPERSEDE clarification)

This Spec is the Owner-directed minimal successor for exactly one normative
limitation: the registration restriction `V1's only Progress Source MUST be
MockProgressSource` (`CTR-DIR-003`, `CTR-PET-001`).

- The V1 obligations remain factually true and their accepted conformance
  records stay valid: V1 registered only `MockProgressSource`, and V1 artifacts
  are not reopened.
- Per the governance protocols, a successor replaces a whole authority and
  partial supersession MUST NOT be simulated in prose. Wholly superseding
  `VEHICLE_PET_PRODUCT_DIRECTION_V1` or `CONFIGURABLE_PET_ENGINE_V1` would
  rewrite every unrelated accepted Contract, which this successor explicitly
  refuses. The accepted Product Direction resolves this itself: it defines the
  reopen condition for real Token integration as "a separate accepted Progress
  Source Spec". This Spec IS that separate authority, scoped to the successor
  milestone; acceptance of this exact revision is the act that lifts the
  registration limit for that milestone.
- Nothing in this Spec authorizes any code change by itself. A concrete real
  source additionally requires its own accepted implementation authorization
  carrying Owner-ratified calibration parameters before any registration.

## 3. What changes and what remains

### Remaining in force (unchanged)

- `CTR-PET-001`'s timeless core: the Engine consumes progress only through
  valid `ProgressSnapshotV1` inputs from a registered Progress Source; the
  Engine MUST NOT generate progress internally; entire-snapshot rejection
  (`CTR-PET-002`) applies to every source.
- `CTR-DIR-003`'s model-call prohibition: the pet system MUST NOT call models
  and MUST NOT create or trigger Token consumption.
- `CTR-PET-024`: host activity events never grant progression or receipts.
- `MockProgressSource` remains the registered source for the prototype, tests,
  and any milestone where no real source is authorized.
- No DSH Core modification; no reading of Prompt text, Completion text,
  message bodies, or credentials by any Progress Source path.

### Changed for the successor milestone

- Real external Progress Sources MAY be registered, but only when all of the
  following hold:
  1. an accepted, implementation-authorizing Spec covers that exact source;
  2. the source feeds the Engine exclusively through `ProgressSnapshotV1`;
  3. the source's counted inputs, dedup identity, persistence, and privacy
     boundary are contracts in that source-specific Spec;
  4. the source's calibration (counted token classes, weights, conversion to
     `progressPoints`, backfill policy) is ratified by the Owner in that Spec —
     uncalibrated defaults are prohibited;
  5. failure, absence, or capability degradation of the source is silent and
     grants nothing.

## 4. Candidate source class (no implementation authorized here)

Structured, counts-only DSH token-usage projections — read as finished whole
values under the host's higher-seq-wins projection delivery, keyed by stable
`(sessionId, turn, step)` identity, never derived from raw session logs — are
the candidate source class for the follow-on implementation authorization.
Prior structural investigation: `docs/investigations/DSH_USAGE_PROGRESS_SOURCE_INPUTS.md`.
The proposed source-specific implementation authority for this class is
`DSH_USAGE_PROGRESS_SOURCE_V1`; it carries the Owner-ratified calibration and
authorizes no code while `proposed`.

## 5. Non-goals

- No Panel, Full Journey, Pack, overlay-state, or asset changes.
- No Engine schema or validation changes.
- No adoption of any specific token-economy parameter in this authority.

## 6. Contracts

### CTR-SRC-001 — Snapshot-seam exclusivity

Every real external Progress Source MUST deliver progression exclusively as
`ProgressSnapshotV1` snapshots accepted by the Engine's existing validation.
No other Engine input, internal derivation, or host-activity path MAY produce
`progressPoints`.

### CTR-SRC-002 — Per-source implementation authority

Registration of a real external Progress Source before V2's successor
milestone is authorized only by an accepted source-specific Spec that binds
the source's counted inputs, dedup identity, persistence semantics, privacy
boundary, and Owner-ratified calibration. Absent such a Spec, the only
registered source remains `MockProgressSource`.

### CTR-SRC-003 — Counts-only structural boundary

A usage-derived source MUST process only numeric counts and stable identity
tuples and MUST NOT read, retain, transmit, or log Prompt text, Completion
text, message bodies, tool payloads, or credentials.

### CTR-SRC-004 — Silent degradation

An absent, failing, or degraded real source MUST apply no progress, emit no
resident-surface error or noise, and leave the last applied valid snapshot
effective.

### CTR-SRC-005 — Mock retention

`MockProgressSource` MUST remain available and registered for the prototype
and test environments regardless of any real source's authorization.

## 7. Acceptance

### ACC-SRC-001 — Boundary inventory

Static audit: with no source-specific implementation Spec accepted, the
registered source inventory is exactly `MockProgressSource`; after a
source-specific Spec is accepted, every registered real source traces to one.

### ACC-SRC-002 — Snapshot-seam audit

For any registered real source, progress mutation paths all pass through
`ProgressSnapshotV1` validation; no internal generation or host-activity grant
path exists.

### ACC-SRC-003 — Privacy audit

Code audit confirms every usage-derived path touches only numeric counts and
identity tuples; no test or fixture requires message content.

### ACC-SRC-004 — Degradation audit

Removing or degrading the real source at runtime applies no progress and no
new resident-surface error; the pet keeps its last valid state.

## 8. Owner acceptance gate

This Spec is `proposed`. Acceptance of this exact revision changes repository
authority only — no code. A follow-on source-specific implementation Spec
(carrying the Owner-ratified calibration from the measured usage baseline)
will be proposed separately and remains subject to its own review and
acceptance.
