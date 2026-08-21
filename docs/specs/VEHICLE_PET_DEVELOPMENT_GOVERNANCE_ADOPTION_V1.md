---
spec_id: VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1
status: accepted
spec_kind: invariant
authority_level: governing_spec
implementation_authority: none
scope:
  - mayf3/vehicle-pet
governed_by: []
external_authorities:
  - repository: mayf3/agent-development-governance
    authority_id: AGENT_DEVELOPMENT_GOVERNANCE_BOOTSTRAP_V0
    revision: 46f78c3f00d768d99a4c8c2da975b124bce042f9
    relation: constrained_by
supersedes: []
superseded_by: null
owners:
  - mayf3
---

# VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1

## 1. Goal

Adopt an exact, reviewed pilot of the shared Development Grammar and Spec-governance distribution for `mayf3/vehicle-pet` as an accepted candidate awaiting merge, while preserving all product, architecture, Spec, implementation, and acceptance authority locally. This feature-branch candidate is not active repository authority unless and until its exact accepted Head is merged into `mayf3/vehicle-pet:main`.

## 2. Scope and non-goals

In scope:

- exact vendoring of 17 distributed files and their lock;
- a truthful originally `proposed` snapshot followed by an authorized `accepted` candidate state;
- local authority, actor, evidence-persistence, update, and rollback rules;
- forward-only governance for future non-mechanical work;
- truthful documentation of current manual enforcement.

Out of scope:

- product direction, architecture, product implementation, code, or assets;
- declaring this draft distribution an upstream stable release;
- claiming acceptance during original preparation, before exact-coordinate independent audit and Owner authorization;
- bulk history rewriting or retroactive migration;
- branch protection, required-check, ruleset, workflow, or other GitHub-setting changes;
- treating any external prototype as repository authority.

## 3. Authority and dependencies

```text
CONSUMER_BASE_COMMIT = 3f09c07d69c804851283edd3404b57e6bf0d8d90
SOURCE_GOVERNANCE_COMMIT = 46f78c3f00d768d99a4c8c2da975b124bce042f9
DISTRIBUTION_VERSION = 0.1.0-draft.1
MANIFEST_SHA256 = 58b5b28bb801538fe62be0ac98a7bc539ff34ec24fa368c48996dd40d8653ba0
DISTRIBUTED_FILE_COUNT = 17
REMOTE_REPOSITORY = mayf3/vehicle-pet
REMOTE_VISIBILITY = private
LOCAL_ACCEPTANCE_ACTOR = mayf3
```

The external repository `mayf3/agent-development-governance` is a `constrained_by` dependency at the exact revision in frontmatter. It supplies grammar and protocol bytes only. It is not authority for this repository's Product Direction, Architecture, Product Specs, code, or acceptance.

Local authority is currently uninitialized: Product Direction is `NONE_YET`, Architecture is `NONE_YET`, current product implementation is `NONE`, and accepted governing Product Specs are `NONE`. The intended first product authority is `docs/specs/VEHICLE_PET_PRODUCT_DIRECTION_V1.md`.

## 4. Current State

### STATE-ADOPT-001 — Empty seed repository and manual policy

- Subject: `mayf3/vehicle-pet` before governance adoption
- As of commit: `3f09c07d69c804851283edd3404b57e6bf0d8d90`
- Environment: local `main`, `origin/main`, seed tree, and live GitHub repository settings
- Observed at: `2026-08-21T12:55:14Z`
- Projection: local and remote `main` equal the parentless empty-tree seed; no Product Direction, Architecture, product implementation, or governing Product Spec exists; enforcement is manual
- Basis: `OBS-ADOPT-004` and direct Git/GitHub observations

### STATE-ADOPT-002 — Accepted candidate exists but is not active until merge

- Subject: exact accepted Governance Adoption candidate derived from reviewed Head `0850a3605d647516cd3cb1775bc96340846937d7`
- Environment: local feature branch `agent/accept-development-governance-v0-r1`
- Accepted at: `2026-08-21T15:35:25Z`
- Projection: lifecycle metadata and this Spec are `accepted`, but the candidate is not active repository authority on the designated authority branch
- Activation condition: the exact accepted candidate Head is merged into `mayf3/vehicle-pet:main`
- Implementation authority: `none`
- Basis: `OBS-ADOPT-005` and `EVD-ADOPT-004`

## 5. Observations

### OBS-ADOPT-001 — Source checkout is clean and exact

- Subject: governance distribution source
- Source revision: `46f78c3f00d768d99a4c8c2da975b124bce042f9`
- Environment: detached local source worktree
- Observed at: `2026-08-21T12:37:42Z`
- Method: `git rev-parse HEAD`, porcelain status, manifest digest, and per-entry size/SHA-256 verification
- Result: clean exact source; version `0.1.0-draft.1`; 17 entries; manifest SHA-256 `58b5b28bb801538fe62be0ac98a7bc539ff34ec24fa368c48996dd40d8653ba0`; every entry matched
- Provenance: source checkout, `distribution/manifest.json`, and execution transcript

### OBS-ADOPT-002 — Vendor dry-run is bounded and writes nothing

- Subject: proposed consumer adoption
- Source revision: `46f78c3f00d768d99a4c8c2da975b124bce042f9`
- Environment: clean consumer worktree at `3f09c07d69c804851283edd3404b57e6bf0d8d90`
- Observed at: `2026-08-21T12:37:42Z`
- Method: run the default `tools/vendor.py` invocation with the exact target, source commit, and preparer, without `--apply`; then inspect porcelain status
- Result: 21 creates, 0 updates, 0 deletes, no conflicts, no files written, and a clean worktree; planned paths were only `AGENTS.md`, `.agents/**`, and `docs/specs/README.md`
- Provenance: complete dry-run output and post-run Git status

### OBS-ADOPT-003 — Lock and verifier bind the vendored bytes

- Subject: `.agents/governance.lock.json` and vendored distribution
- Source revision: `46f78c3f00d768d99a4c8c2da975b124bce042f9`
- Environment: proposed consumer worktree
- Observed at: `2026-08-21T12:55:14Z`
- Method: inspect the lock, compare all 17 locked files, and run `.agents/tools/verify_governance.py` without `--require-accepted`
- Result: source identity, manifest identity, sizes, and digests match; adoption remains `proposed` with `accepted_by = null` and `accepted_at = null`
- Provenance: lock, vendored files, verifier output, and final validation transcript

### OBS-ADOPT-004 — Local authority and enforcement inventory

- Subject: consumer authority map
- Source revision: `3f09c07d69c804851283edd3404b57e6bf0d8d90`
- Environment: repository files and live GitHub settings
- Observed at: `2026-08-21T12:55:14Z`
- Method: inspect the seed tree and read-only repository, branch, workflow, protection, and rule APIs
- Result: private repository; default branch `main`; `main` is not protected; no required checks or enforced PR/review requirement; 0 Actions workflows; 1 branch; 1 commit; ruleset APIs return HTTP 403 because the feature is unavailable on the current plan, so no active ruleset is claimed
- Provenance: Git/GitHub query output and `.agents/local/README.md`

### OBS-ADOPT-005 — Independent audit ACCEPT and Owner acceptance authorize the exact transition

- Subject: Governance Adoption lifecycle transition for PR `mayf3/vehicle-pet#1`
- Reviewed coordinates: Base `3f09c07d69c804851283edd3404b57e6bf0d8d90`; proposed Head `0850a3605d647516cd3cb1775bc96340846937d7`
- Independent audit role: independent local governance audit Agent, distinct from this acceptance-transition executor
- Audit publication account: GitHub user `mayf3`; publishing account identity is not asserted to be the independent Agent identity
- Audit record: comment `5371644271`, <https://github.com/mayf3/vehicle-pet/pull/1#issuecomment-5371644271>
- Audit result: `ACCEPT`; blockers `0`; ready for Owner acceptance decision `YES`; the comment itself recorded Owner acceptance `NO`
- Owner decision: `mayf3` explicitly authorized acceptance of those exact coordinates and authorized actual execution-time `accepted_at`; push, ready transition, and merge remain unauthorized
- Transition result: lock and Spec changed from truthful `proposed` state to `accepted` candidate at `2026-08-21T15:35:25Z`
- Activation result: not active on `main`; activation requires merge of the exact accepted candidate Head
- Provenance: persisted audit comment, Owner authorization supplied to this execution, lock metadata, and local acceptance diff

## 6. Claims and assumptions

### CLM-ADOPT-001 — Exact vendoring preserves revision identity

- Support state: SUPPORTED
- Supported by evidence: `EVD-ADOPT-001`
- Contradicted by evidence: NONE
- Uncertainty: integrity verification proves pinned bytes and metadata, not local semantic acceptance

### CLM-ADOPT-002 — Forward-only adoption is compatible with the empty seed

- Support state: SUPPORTED
- Supported by evidence: `EVD-ADOPT-002`
- Contradicted by evidence: NONE
- Uncertainty: future authorities and implementation require their own accepted Specs and reviews

### CLM-ADOPT-003 — Enforcement is presently manual

- Support state: SUPPORTED
- Supported by evidence: `EVD-ADOPT-003`
- Contradicted by evidence: NONE
- Uncertainty: live GitHub settings may change after the observation timestamp

## 7. Evidence relations

### EVD-ADOPT-001 — Source, dry-run, lock, and verifier support exact adoption

- Source observations: `OBS-ADOPT-001`, `OBS-ADOPT-002`, `OBS-ADOPT-003`
- Target: `CLM-ADOPT-001`
- Relation: SUPPORTS
- Bound coordinates: source `46f78c3f00d768d99a4c8c2da975b124bce042f9`, consumer base `3f09c07d69c804851283edd3404b57e6bf0d8d90`, observed `2026-08-21T12:37:42Z` through `2026-08-21T12:55:14Z`
- Strength/sufficiency: sufficient for exact-byte, exact-count, manifest, lock, and bounded-plan identity
- Limitations: does not mark the proposal accepted
- Provenance: manifest, lock, command output, planned file set, diff, and verifier output

### EVD-ADOPT-002 — Empty local authority inventory supports forward-only compatibility

- Source observations: `OBS-ADOPT-004`
- Target: `CLM-ADOPT-002`, `STATE-ADOPT-001`
- Relation: SUPPORTS
- Bound coordinates: consumer base `3f09c07d69c804851283edd3404b57e6bf0d8d90`, settings observed `2026-08-21T12:55:14Z`
- Strength/sufficiency: sufficient for this bounded empty seed and current local authority inventory
- Limitations: later repository changes require reevaluation
- Provenance: seed tree, commit metadata, authority map, and settings evidence

### EVD-ADOPT-003 — Live settings support the manual-policy claim

- Source observations: `OBS-ADOPT-004`
- Target: `CLM-ADOPT-003`
- Relation: SUPPORTS
- Bound coordinates: `mayf3/vehicle-pet:main`, observed `2026-08-21T12:55:14Z`
- Strength/sufficiency: sufficient to distinguish current manual policy from unimplemented automated enforcement
- Limitations: ruleset detail is plan-unavailable and no ruleset is claimed active
- Provenance: read-only GitHub API output

### EVD-ADOPT-004 — Exact audit and Owner authorization satisfy the lifecycle transition

- Source observations: `OBS-ADOPT-003`, `OBS-ADOPT-005`
- Target: `CTR-ADOPT-002`, `ACC-ADOPT-002`, `STATE-ADOPT-002`
- Relation: SATISFIES
- Bound coordinates: Base `3f09c07d69c804851283edd3404b57e6bf0d8d90`, reviewed proposed Head `0850a3605d647516cd3cb1775bc96340846937d7`, audit comment `5371644271`
- Strength/sufficiency: sufficient for the authorized `proposed` to `accepted` candidate lifecycle transition and no broader semantic change
- Limitations: does not authorize push, Draft-to-ready transition, merge, product direction, architecture, Product Specs, or implementation; accepted candidate remains inactive until exact-Head merge into `main`
- Provenance: independent audit record, Owner authorization, acceptance lock metadata, and this Spec

## 8. Decisions

### DEC-ADOPT-001 — Propose exact draft vendoring

- Decision owner: `mayf3`
- Decision: prepare a pilot proposal pinned to the exact source commit and manifest; do not claim an upstream stable release.
- Rejected alternatives: floating references, implicit remote authority, package indirection, and uninitialized submodules.
- Reason: local bytes, visible diffs, exact identity, and explicit update control.
- Owner input remaining: NONE

### DEC-ADOPT-002 — Preserve repository-local authority

- Decision owner: `mayf3`
- Decision: Product Direction, Architecture, governing Product Specs, implementation authorization, and acceptance remain local; the central governance repository cannot supply them.
- Rejected alternative: treating external governance or a DeepSeek Harness prototype as product authority.
- Reason: repository ownership and explicit cross-repository authority boundaries.
- Owner input remaining: NONE

### DEC-ADOPT-003 — Apply forward-only manual policy

- Decision owner: `mayf3`
- Decision: governance is forward-only, makes no bulk history rewrite, and remains manual policy in this adoption.
- Rejected alternative: retroactive normalization or claims of nonexistent enforcement.
- Reason: truthful scope and compatibility with the empty seed.
- Owner input remaining: NONE

### DEC-ADOPT-004 — Require explicit updates and complete-commit rollback

- Decision owner: `mayf3`
- Decision: each governance change is a separate explicit local update; rollback reverts the complete adoption or update commit.
- Rejected alternative: partial byte replacement or partial supersession.
- Reason: atomic provenance and reviewability.
- Owner input remaining: NONE

## 9. Contracts

### CTR-ADOPT-001 — Exact revision and bytes

The repository MUST vendor exactly the 17 manifest-bound files from source commit `46f78c3f00d768d99a4c8c2da975b124bce042f9`. Floating references MUST NOT activate governance.

### CTR-ADOPT-002 — Truthful proposed state

The prepared lock and this Spec MUST remain `proposed`; `accepted_by` and `accepted_at` MUST remain null until an explicit authorized acceptance transition by `mayf3`.

### CTR-ADOPT-003 — Draft pilot and local authority

This adoption MUST be described as a pilot of draft distribution `0.1.0-draft.1`, MUST NOT claim an upstream stable release, and MUST preserve all product, architecture, Spec, implementation, and acceptance authority in `mayf3/vehicle-pet`.

### CTR-ADOPT-004 — Forward-only, no bulk rewrite

Governance MUST apply forward-only to future non-mechanical work and MUST NOT bulk-rewrite repository history or retroactively convert historical evidence.

### CTR-ADOPT-005 — Explicit updates and atomic rollback

An upstream change MUST NOT alter local governance without a separate explicit repository commit. Rollback MUST revert the complete adoption or update commit; partial supersession is forbidden.

### CTR-ADOPT-006 — Honest manual enforcement

Governance claims MUST describe actual enforcement. This adoption MUST remain `MANUAL_POLICY` and MUST NOT claim branch protection, required checks, rulesets, PR/review gates, or workflows that are not active.

### CTR-ADOPT-007 — Product implementation authorization gate

No non-mechanical product implementation MAY begin until local governance is accepted and an accepted governing Spec with `implementation_authority: contracts` covers the requested work. The first intended product authority is `VEHICLE_PET_PRODUCT_DIRECTION_V1`.

### CTR-ADOPT-008 — Persistent evidence locations

Investigations MUST persist under `docs/investigations/`. Conformance MUST persist under `docs/conformance/` and in the corresponding future implementation PR.

### CTR-ADOPT-009 — Independent review boundary

Acceptance readiness MUST be reviewed against the exact Base and exact Head by an independent Agent that did not participate in authoring, execution, or the acceptance transition in this round.

## 10. Acceptance

### ACC-ADOPT-001 — Exact source and vendored bytes

- Contracts: `CTR-ADOPT-001`
- Method: compare clean source HEAD, lock source commit, manifest digest/count, and all locked file sizes and SHA-256 digests
- Environment: exact source checkout and proposed consumer worktree
- Required evidence: `OBS-ADOPT-001`, `OBS-ADOPT-002`, `OBS-ADOPT-003`, lock, manifest, and diff
- Expected result: all 17 file identities match and no floating reference activates governance
- Failure condition: any source, count, size, digest, or path mismatch

### ACC-ADOPT-002 — Truthful lifecycle state

- Contracts: `CTR-ADOPT-002`
- Method: inspect the reviewed proposed snapshot, Spec frontmatter, lock adoption metadata, exact-coordinate independent audit, Owner authorization, and acceptance diff
- Environment: reviewed proposed Head followed by the local accepted-candidate Head
- Required evidence: proposed Spec and lock at `0850a3605d647516cd3cb1775bc96340846937d7`, `OBS-ADOPT-005`, `EVD-ADOPT-004`, audit comment `5371644271`, accepted Spec and lock, and exact parent relation
- Expected result: the reviewed snapshot truthfully remains `proposed` with null acceptance metadata; after authorization, both candidate states are `accepted`, `accepted_by = mayf3`, `accepted_at` is the actual execution time, implementation authority remains `none`, and authority remains inactive until exact-Head merge into `main`
- Failure condition: preparation claims acceptance, acceptance metadata is fabricated, coordinates drift, or the local accepted candidate is described as active before merge

### ACC-ADOPT-003 — Draft and local authority boundary

- Contracts: `CTR-ADOPT-003`
- Method: review the Spec and `.agents/local/README.md` against source version and local authority inventory
- Environment: exact adoption candidate
- Required evidence: source `VERSION`, authority map, and reviewer finding
- Expected result: draft pilot is explicit and external governance is not product or acceptance authority
- Failure condition: stability or external product authority is claimed

### ACC-ADOPT-004 — Forward-only behavior

- Contracts: `CTR-ADOPT-004`
- Method: inspect commit history and adoption diff
- Environment: seed base through candidate Head
- Required evidence: parent history and changed-path list
- Expected result: one forward commit adds governance without rewriting prior history
- Failure condition: rewritten history or retroactive bulk conversion

### ACC-ADOPT-005 — Update and rollback boundary

- Contracts: `CTR-ADOPT-005`
- Method: verify upstream movement alone leaves the consumer unchanged and a full commit revert restores the prior tree
- Environment: consumer pinned to the adoption commit
- Required evidence: before/after tree identities, explicit update diff, and full-revert diff
- Expected result: only explicit local commits change governance and rollback is atomic
- Failure condition: implicit update or partial rollback/supersession

### ACC-ADOPT-006 — Enforcement claims match reality

- Contracts: `CTR-ADOPT-006`
- Method: compare local claims with branch, protection, check, ruleset, review, and workflow observations
- Environment: repository files and live GitHub settings
- Required evidence: `OBS-ADOPT-004` and read-only query output
- Expected result: manual and automated enforcement are truthfully distinguished
- Failure condition: any inactive gate is claimed active

### ACC-ADOPT-007 — Implementation remains blocked

- Contracts: `CTR-ADOPT-007`
- Method: inspect adoption state, governing Spec index, and changed paths before non-mechanical work
- Environment: implementation base commit
- Required evidence: accepted local governance plus an accepted implementation-authorizing Spec
- Expected result: product work does not start while either authority is absent
- Failure condition: product implementation begins from this non-authorizing accepted candidate or before both required active authorities exist

### ACC-ADOPT-008 — Evidence persistence exists

- Contracts: `CTR-ADOPT-008`
- Method: inspect persistent location documentation and future records
- Environment: adoption candidate and corresponding future implementation PRs
- Required evidence: `docs/investigations/README.md`, `docs/conformance/README.md`, and future records
- Expected result: investigations and conformance remain reviewable at stable locations
- Failure condition: required evidence exists only ephemerally

### ACC-ADOPT-009 — Independent exact-coordinate review

- Contracts: `CTR-ADOPT-009`
- Method: an eligible independent Agent reviews exact Base, exact Head, scope, contracts, acceptance coverage, and verifier results
- Environment: clean committed candidate
- Required evidence: independent review record with exact commit coordinates
- Expected result: reviewer independence and exact coordinates are explicit before acceptance readiness
- Failure condition: same-round participant self-certifies independence or reviews mutable coordinates

### Contract coverage

| Contract | Acceptance | Covered |
|---|---|---|
| `CTR-ADOPT-001` | `ACC-ADOPT-001` | YES |
| `CTR-ADOPT-002` | `ACC-ADOPT-002` | YES |
| `CTR-ADOPT-003` | `ACC-ADOPT-003` | YES |
| `CTR-ADOPT-004` | `ACC-ADOPT-004` | YES |
| `CTR-ADOPT-005` | `ACC-ADOPT-005` | YES |
| `CTR-ADOPT-006` | `ACC-ADOPT-006` | YES |
| `CTR-ADOPT-007` | `ACC-ADOPT-007` | YES |
| `CTR-ADOPT-008` | `ACC-ADOPT-008` | YES |
| `CTR-ADOPT-009` | `ACC-ADOPT-009` | YES |

Every Contract maps to one Acceptance item, and every Acceptance item maps back to one Contract.

## 11. Alternatives and disposition

| Alternative | Disposition | Reason | Evidence/claims | Reopen condition |
|---|---|---|---|---|
| Track a floating source branch | Rejected | Mutable identity defeats exact review | `CLM-ADOPT-001` | Never for active governance |
| Use a package dependency | Rejected for V1 | Hides local governance bytes and diff | `EVD-ADOPT-001` | A later accepted Spec establishes equivalent provenance |
| Use a submodule | Rejected for V1 | Adds initialization and availability failure modes | `OBS-ADOPT-002` | A later accepted migration demonstrates better reliability |
| Copy files without a lock | Rejected | Loses source and digest binding | `OBS-ADOPT-003` | Never without an equivalent accepted integrity mechanism |
| Treat external prototypes as authority | Rejected | Investigation evidence is not local product authority | `DEC-ADOPT-002` | Only a future local accepted Spec can incorporate evidence normatively |
| Enable enforcement in this adoption | Deferred | This change is docs/governance only and records reality | `CLM-ADOPT-003` | Separate authorized settings change |

## 12. Migration, compatibility, and rollback

```text
MIGRATION = forward-only
HISTORICAL_REWRITE = none
GOVERNANCE_UPDATE = separate explicit repository commit
ROLLBACK = revert the complete adoption or update commit
PRODUCT_COMPATIBILITY = no product code exists and no product behavior changes
```

The candidate adds only approved governance and documentation paths. Upstream changes have no effect until separately vendored and committed. Rollback removes the complete local snapshot by reverting its full commit; individual governed files must not be selectively reverted as a substitute for an explicit governance decision.

## 13. Open questions

```text
OPEN_OWNER_DECISIONS = NONE
NORMATIVE_TBD = NONE
UNRESOLVED_AUTHORITY_CONFLICT = NONE
PARTIAL_SUPERSESSION = NONE
READY_TO_MARK_ACCEPTED = YES
```

Independent review and the authorized acceptance transition are complete process facts, not unresolved normative decisions. This accepted candidate grants no product implementation authority and is not active repository authority until its exact Head is merged into `mayf3/vehicle-pet:main`.
