---
spec_id: DSH_PET_USAGE_PROGRESS_SOURCE_V1
status: proposed
spec_kind: implementation
authority_level: governing_spec
implementation_authority: contracts
scope:
  - dsh-usage-progress-source
  - token-usage-projection-consumption
  - progress-points-accumulation
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

# DSH_PET_USAGE_PROGRESS_SOURCE_V1

## 1. Goal

Authorize, after independent review and Owner acceptance of this exact proposed
revision, a real DeepSeek Harness usage progress source that drives Vehicle Pet
`progressPoints` from structured, deduplicated token-usage projections without
reading Prompt text, Completion text, message bodies, or credentials.

```text
GOAL = Real structured DSH usage drives Vehicle Pet progressPoints.
SUCCESS_OUTCOME = Accurate, deduplicated, restart-safe, tab-safe accumulation of token-usage counts into Engine progressPoints through an accepted counts-only path.
DELIVERY_FORM = DSH_BUNDLE_PLUGIN_EXTENSION
OWNING_REPOSITORY = mayf3/vehicle-pet
```

## 2. Scope and non-goals

### In scope

- Consumption of the host-computed `tokenUsage` session projection by the
  existing vehicle-pet client entry.
- Accumulation of per-session usage deltas into Engine `progressPoints` under
  stable `(sessionId, projection seq)` identity.
- Capability-absent and privacy fail-closed behavior.

### Out of scope

- Any DSH Core modification, any new DSH plugin, or any new projection domain.
- Reading raw session logs, `session/event` streams, message bodies, prompts,
  completions, or credentials.
- Displaying token numbers in the resident pet surface (progress is expressed
  through the existing Engine stage/level semantics only).
- Panel or Full Journey redesign (both remain secondary, low-frequency).

## 3. Authority and dependencies

- Governing Engine progression authority stays CONFIGURABLE_PET_ENGINE_V1:
  `progressPoints` remain the sole progression input; this spec only authorizes
  an external Progress Source that feeds them.
- The overlay adapter authority stays DSH_PET_OVERLAY_ADAPTER_V1: session
  mapping remains transient and visual-only (CTR-OVERLAY-007); this spec adds a
  separate, auditable usage consumption path and does not amend any existing
  `CTR-OVERLAY-*` ID.
- Prior investigation: `docs/investigations/DSH_USAGE_PROGRESS_SOURCE_INPUTS.md`.

## 4. Current State

### STATE-USAGE-001 — progressPoints use a zero placeholder source

`createOverlayProgressSource` backs the overlay with a zero-point source
(src/dsh/client/OverlayProgressSource.ts); real DSH usage never reaches the
Engine. Owner feedback requires that the resident car visibly grows through
real use.

### STATE-USAGE-002 — The pinned DSH exposes a counts-only projection seam

The pinned fork master (419ee11) ships token-meter with a
`tokenUsage: TokenUsageProjection` key in `SessionProjectionMap`, folded
per `(turn, step)` with replace semantics, delivered to the client as
whole values under higher-seq-wins, and mirrored on session rows as
`projectionValues` readable from the already-injected `ctx.sessions` service.

## 5. Decisions

### DEC-USAGE-001 — Consume only the host-computed tokenUsage projection

The pet reads finished projection values by key; it never folds raw events,
never reads logs, and never subscribes to raw session/event streams.

### DEC-USAGE-002 — Accumulate under stable identity with idempotent replay

The source persists, per session, the last applied projection identity
`(sessionId, seq)` and the consumed usage basis; a projection frame whose seq
is not newer than the applied one is ignored, so replays, restarts, and
multi-tab adoption cannot double-apply.

### DEC-USAGE-003 — Owner-gated token economy parameters

The mapping from counted token classes to progressPoints is an Owner decision
that cannot be derived from facts. The initial parameter set below is part of
the acceptance decision; changing any parameter later is a revision of this
spec, not a runtime setting.

```text
counted_classes      = uncachedInputTokens, outputTokens
                       (cacheReadTokens/cacheWriteTokens/reasoningTokens excluded from points;
                        reasoningTokens remain visible in Engine-neutral diagnostics only)
points_per_1k_tokens = 1
historical_backfill  = sessions already present at install time ARE backfilled once, bounded by the persisted identity ledger (no double count)
cap_policy           = none beyond Engine level-table saturation
```

### DEC-USAGE-004 — Fail closed on capability absence

When the `tokenUsage` key reads absent (token-meter not mounted, host unit
unmounted, no current session), the source applies nothing and the pet keeps
its existing stored progress; it never fabricates points.

## 6. Contracts

### CTR-USAGE-001 — Counts-only structural consumption

The usage path processes only numeric projection fields and identity tuples.
It MUST NOT read, retain, transmit, or log Prompt text, Completion text,
message bodies, tool payloads, or credentials.

### CTR-USAGE-002 — Idempotent, restart-safe accumulation

Applying the same projection value any number of times, in any process, in any
tab, changes progressPoints exactly once per underlying usage increment.
Accumulation state is persisted through the existing Engine-owned storage
adapter and survives restarts.

### CTR-USAGE-003 — Engine remains the only progression owner

The source converts accepted parameters into a progress delta and feeds the
Engine progress source seam; it never mutates Engine state directly, never
issues receipts for host activity, and preserves CTR-PET-024 (host activity
never grants progression) — usage-driven points flow through the Progress
Source, not through HostActivityEventV1.

### CTR-USAGE-004 — Capability-absent and degraded modes are silent

Absent projection capability yields no error surface, no resident-surface
noise, and no points; the resident pet experience is otherwise unchanged.

### CTR-USAGE-005 — No DSH Core modification

The implementation is confined to the vehicle-pet bundle plugin and its
already-declared injections (`slots`, `sessions`, `locale`).

## 7. Acceptance

### ACC-USAGE-001 — Real usage drives growth

In an isolated DSH with token-meter mounted, driving a session that produces
usage moves the resident pet's stage-internal progress without opening the
panel, by exactly the accepted parameter mapping.

### ACC-USAGE-002 — Replay and restart do not double count

Replaying the projection stream, restarting the client, and syncing a second
tab each leave total progressPoints unchanged relative to a single application.

### ACC-USAGE-003 — Privacy conformance

Code audit confirms the usage path touches only numeric fields and identity
tuples (CTR-USAGE-001); no test or fixture requires message content.

### ACC-USAGE-004 — Capability absence degrades silently

With token-meter absent, the pet renders and behaves identically to today,
with zero points applied and no new error or diagnostic surface.

## 8. Owner acceptance gate

This spec is `proposed`. Implementation MUST NOT begin before the exact
accepted revision of this spec is reachable from `mayf3/vehicle-pet:main`.
Acceptance simultaneously ratifies DEC-USAGE-003's parameter block; any Owner
edit to that block re-enters review as a new exact revision.
