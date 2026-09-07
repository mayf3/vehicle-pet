---
spec_id: VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2
status: accepted
spec_kind: invariant
authority_level: governing_spec
implementation_authority: none
scope:
  - mayf3/vehicle-pet
governed_by: []
external_authorities:
  - repository: mayf3/agent-development-governance
    authority_id: AGENT_DEVELOPMENT_GOVERNANCE_V1
    revision: 0d61433339ef563f82307b70120d9fcee168cdab
    relation: constrained_by
supersedes:
  - VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1
superseded_by: null
owners:
  - mayf3
---

# VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2

## 1. Goal

Upgrade `mayf3/vehicle-pet` from the accepted draft pilot adoption of Development
Grammar V0 (`0.1.0-draft.1`) to an exact vendored adoption of the stable
Governance V1 distribution (`v1.0.3`), so that future non-mechanical work routes
through Goal → Current Gap → Authority/Plan/Assurance → implementation →
Evidence → independent review → DONE_WHEN/STOP, while preserving all local
product authority, keeping governance cost low, and rewriting no product
history. This is a governance upgrade, not an initial adoption.

## 2. Scope and non-goals

In scope:

- exact vendoring of the 25 files bound by the `v1.0.3` distribution manifest and their lock;
- a truthful originally `proposed` successor snapshot followed by the atomic accepted successor lifecycle;
- whole-authority supersession of `VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1` with preserved predecessor history;
- local authority, actor, evidence-persistence, update, and rollback rules for the V1 era;
- forward-only governance for future non-mechanical work, including Grammar V1 routing discipline;
- truthful documentation of manual policy plus deterministic integrity checks.

Out of scope:

- product behavior, assets, panel, token economy, DSH, progress, or user-data changes;
- production deployment, service restarts, profile changes, or user data mutation;
- GitHub App, merge broker, central Spec database, WORM evidence platform, or automated semantic reviewer;
- implementing the upstream Operational Layer (its Spec is accepted upstream but its implementation is upstream `not_started`);
- GitHub enforcement, branch protection, required checks, or any repository-settings change;
- bulk migration, re-formatting, re-review, or retroactive semantic change of any historical authority, Spec, observation, claim, or evidence;
- downstream ownership of Vehicle Pet product decisions by the upstream governance repository.

## 3. Authority and dependencies

```text
SOURCE_REPOSITORY = mayf3/agent-development-governance
SOURCE_RELEASE_TAG = v1.0.3 (annotated)
SOURCE_TAG_OBJECT = 008214f673d11dd345fa1d4416036d1c0f25314a
SOURCE_COMMIT = 0d61433339ef563f82307b70120d9fcee168cdab
DISTRIBUTION_VERSION = 1.0.3
MANIFEST_SHA256 = f4aa7779623e670a384195ccc40e509fb5600ddfb97363f8b907386fffbceca2
DISTRIBUTED_FILE_COUNT = 25
CONSUMER_BASE_COMMIT = c3d1d4e7f5697a0dd53f8d4a9d6996e7bdde2cac
PREDECESSOR_AUTHORITY = VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1
LOCAL_ACCEPTANCE_ACTOR = mayf3
OWNER_ACCEPTANCE = PREAUTHORIZED (conditions in DEC-UPG-005)
```

The external repository `mayf3/agent-development-governance` supplies development grammar, governance protocol, templates, and validation tools at the exact revision in frontmatter. It remains a `constrained_by` dependency: it is not authority for this repository's Product Direction, Architecture, Product Specs, code, runtime, operations, or acceptance.

## 4. Current State

### STATE-UPG-001 — Draft pilot adoption is the accepted active governance

- Subject: repository governance surface
- As of commit: `c3d1d4e7f5697a0dd53f8d4a9d6996e7bdde2cac` (`origin/main`)
- Environment: designated authority branch and vendored files
- Observed at: `2026-09-07T15:12:00Z`
- Projection: `.agents/governance.lock.json` pins `development-governance-v0` `0.1.0-draft.1` at source `46f78c3f00d768d99a4c8c2da975b124bce042f9` with `adoption.status = accepted`; the adopted grammar is Development Grammar V0; enforcement is manual policy; local Product Direction and product Specs exist and are untouched by this upgrade
- Basis: `OBS-UPG-004`

### STATE-UPG-002 — Proposed successor exists but is not active until accepted Head merge

- Subject: this Spec and the `v1.0.3` vendored snapshot
- Environment: adoption branch `governance/upgrade-v1-r1`
- Projection: lock and this Spec are `proposed`; the predecessor remains `accepted` with `superseded_by = null`; neither this Spec nor the vendored V1 grammar is active authority
- Activation condition: the exact accepted successor Head is merged into `mayf3/vehicle-pet:main`
- Implementation authority: `none`
- Basis: `OBS-UPG-003`, `OBS-UPG-005`

## 5. Observations

### OBS-UPG-001 — Upstream tag identity is exact and the source checkout is clean

- Subject: governance distribution source
- Source revision: `0d61433339ef563f82307b70120d9fcee168cdab` (tag `v1.0.3`)
- Environment: local clone of `mayf3/agent-development-governance` and a detached checkout at the tag commit
- Observed at: `2026-09-07T15:10:00Z`
- Method: after `git fetch origin --tags --force`: `git cat-file -t refs/tags/v1.0.3`, `git rev-parse` of the tag and of `refs/tags/v1.0.3^{commit}`, `git show <tag>^{commit}:VERSION`, manifest inspection, and porcelain status of the detached checkout
- Result: tag type `tag` (annotated); tag object `008214f673d11dd345fa1d4416036d1c0f25314a`; source commit `0d61433339ef563f82307b70120d9fcee168cdab`; `VERSION` = `1.0.3`; manifest `$schema`/`distribution`/`version` valid with 25 entries; distributed paths clean; no `main`, `latest`, or floating branch is used as adoption identity
- Provenance: Git command output in the execution transcript

### OBS-UPG-002 — Vendor dry-run is bounded and writes nothing

- Subject: proposed consumer update
- Source revision: `0d61433339ef563f82307b70120d9fcee168cdab`
- Environment: clean consumer worktree at `c3d1d4e7f5697a0dd53f8d4a9d6996e7bdde2cac` (branch `governance/upgrade-v1-r1`)
- Observed at: `2026-09-07T15:17:43Z`
- Method: run `tools/vendor.py` from the detached source checkout with exact target, source commit, and preparer, without `--apply`; inspect the plan; then run with `--apply` and inspect `git status`
- Result: dry-run plan of 26 operations (17 replace, 8 create, 1 lock replace), 0 deletes, 0 conflicts, no files written; all planned paths are governance-owned (`.agents/**` and `.agents/governance.lock.json`); local extensions (`AGENTS.md`, `.agents/local/README.md`, `docs/specs/README.md`) are not in the plan; after apply, 21 changed paths appear in Git because 5 replaced files were already byte-identical
- Provenance: complete dry-run output, apply output, and post-apply Git status

### OBS-UPG-003 — Lock and vendored verifier bind the new bytes

- Subject: `.agents/governance.lock.json` and the vendored distribution
- Source revision: `0d61433339ef563f82307b70120d9fcee168cdab`
- Environment: proposed consumer worktree
- Observed at: `2026-09-07T15:19:00Z`
- Method: inspect the lock and run `.agents/tools/verify_governance.py --target .` (without `--require-accepted`)
- Result: lock pins version `1.0.3`, source commit `0d61433339ef563f82307b70120d9fcee168cdab`, manifest SHA-256 `f4aa7779623e670a384195ccc40e509fb5600ddfb97363f8b907386fffbceca2`, 25 files, `adoption.status = proposed` with `accepted_by = null` and `accepted_at = null`; verifier reports `vendored governance bytes match governance.lock.json` and exits 0
- Provenance: lock file and verifier output

### OBS-UPG-004 — Consumer base, predecessor lock, and enforcement inventory

- Subject: consumer authority map and enforcement state
- Source revision: `c3d1d4e7f5697a0dd53f8d4a9d6996e7bdde2cac`
- Environment: repository files and live GitHub settings
- Observed at: `2026-09-07T15:19:30Z`
- Method: `git fetch origin`; compare lock and Specs at `origin/main`; read-only GitHub API queries for repository visibility and `main` protection
- Result: `origin/main` at `c3d1d4e7f5697a0dd53f8d4a9d6996e7bdde2cac`; predecessor lock `0.1.0-draft.1` accepted with 17 files; existing local product authorities include `VEHICLE_PET_PRODUCT_DIRECTION_V1`, `CONFIGURABLE_PET_ENGINE_V3`, `DSH_PET_OVERLAY_ADAPTER_V2`, `VEHICLE_PET_PROGRESS_SOURCE_V2`, and `DSH_USAGE_PROGRESS_SOURCE_V1`; repository private, default branch `main`, `main` not protected; no branch protection, required checks, or settings change made by this adoption
- Provenance: Git output, lock diff, and GitHub API query output

### OBS-UPG-005 — Whole-authority transition validates in both lifecycle states

- Subject: governing-Spec frontmatter transition graph for this upgrade
- Environment: proposed consumer worktree using the vendored `v1.0.3` validator
- Observed at: `2026-09-07T15:30:00Z`
- Method: extract all governing-Spec frontmatter from `docs/specs/*.md` at the base; build preparation and acceptance candidate states; run `.agents/tools/validate_spec_transition.py --base <base.json> --candidate <candidate.json>`
- Result: preparation state (predecessor `accepted`, successor `proposed` declaring `supersedes`, no predecessor backlink) and acceptance state (successor `accepted`, predecessor `superseded` with atomic backlink to the successor) both validate with zero errors; product-spec records unchanged
- Provenance: base/candidate JSON fixtures and validator output recorded in the adoption PR

## 6. Claims and assumptions

### CLM-UPG-001 — Exact vendoring preserves revision identity across the upgrade

- Support state: SUPPORTED
- Supported by evidence: `EVD-UPG-001`
- Contradicted by evidence: NONE
- Uncertainty: integrity verification proves pinned bytes and metadata, not local semantic acceptance

### CLM-UPG-002 — The upgrade is forward-only compatible with existing product authorities

- Support state: SUPPORTED
- Supported by evidence: `EVD-UPG-002`
- Contradicted by evidence: NONE
- Uncertainty: Grammar V1 may demand stricter routing on future work; that is the intended adoption target, not a defect

### CLM-UPG-003 — The successor lifecycle stays truthful in both states

- Support state: SUPPORTED
- Supported by evidence: `EVD-UPG-003`
- Contradicted by evidence: NONE
- Uncertainty: the accepted successor activates only at exact-Head merge into the designated authority branch

## 7. Evidence relations

### EVD-UPG-001 — Source identity, dry-run, lock, and verifier support the exact upgrade

- Source observations: `OBS-UPG-001`, `OBS-UPG-002`, `OBS-UPG-003`
- Target: `CLM-UPG-001`
- Relation: SUPPORTS
- Bound coordinates: source `0d61433339ef563f82307b70120d9fcee168cdab`, consumer base `c3d1d4e7f5697a0dd53f8d4a9d6996e7bdde2cac`, observed `2026-09-07T15:17:43Z` through `2026-09-07T15:19:00Z`
- Strength/sufficiency: sufficient for exact-tag, exact-byte, exact-count, manifest, lock, and bounded-plan identity
- Limitations: does not mark the proposal accepted
- Provenance: tag identity output, dry-run plan, apply output, lock, and verifier output

### EVD-UPG-002 — Local inventory supports forward-only compatibility

- Source observations: `OBS-UPG-004`
- Target: `CLM-UPG-002`, `STATE-UPG-001`
- Relation: SUPPORTS
- Bound coordinates: consumer base `c3d1d4e7f5697a0dd53f8d4a9d6996e7bdde2cac`, settings observed `2026-09-07T15:19:30Z`
- Strength/sufficiency: sufficient for the bounded repository and current local authority inventory
- Limitations: future repository changes require reevaluation
- Provenance: authority map, lock diff, and settings evidence

### EVD-UPG-003 — Validated transitions support the truthful lifecycle

- Source observations: `OBS-UPG-005`
- Target: `CLM-UPG-003`, `STATE-UPG-002`
- Relation: SUPPORTS
- Bound coordinates: base `c3d1d4e7f5697a0dd53f8d4a9d6996e7bdde2cac`, vendored validator at `0d61433339ef563f82307b70120d9fcee168cdab`
- Strength/sufficiency: sufficient for whole-authority lifecycle closure in preparation and acceptance states
- Limitations: the validator checks lifecycle graph consistency, not semantic content
- Provenance: base/candidate fixtures and validator output in the adoption PR

## 8. Decisions

### DEC-UPG-001 — Upgrade to the exact stable release

- Decision owner: `mayf3`
- Decision: upgrade the repository adoption to the exact annotated `v1.0.3` release, pinned at source commit `0d61433339ef563f82307b70120d9fcee168cdab`.
- Rejected alternatives: staying on the draft pilot, floating `main`/`latest`, and adopting intermediate tags.
- Reason: the draft pilot predates Governance V1; the stable release is the upstream identity the Goal selects; exact identity keeps review and rollback deterministic.
- Owner input remaining: NONE (Owner selected this release in the Goal dispatch)

### DEC-UPG-002 — Preserve repository-local product authority

- Decision owner: `mayf3`
- Decision: Product Direction, Architecture, governing Product Specs, implementation authorization, and acceptance remain local; upstream governance never owns Vehicle Pet product decisions.
- Rejected alternative: treating `agent-development-governance` as product authority.
- Reason: repository ownership and explicit cross-repository authority boundaries.
- Owner input remaining: NONE

### DEC-UPG-003 — Forward-only upgrade without historical migration

- Decision owner: `mayf3`
- Decision: apply Grammar V1 forward-only; do not bulk-rewrite, re-format, re-review, or retroactively re-semantify any historical Spec, record, or evidence; keep both V0 protocol documents as vendored historical reference.
- Rejected alternative: a history-wide migration to the new templates.
- Reason: cost control and accepted-semantics immutability.
- Owner input remaining: NONE

### DEC-UPG-004 — Whole-authority successor lifecycle

- Decision owner: `mayf3`
- Decision: replace the predecessor adoption through whole-authority supersession — proposed successor declares `supersedes` while the predecessor remains `accepted` and unbacklinked; at acceptance the successor becomes `accepted` and the predecessor becomes `superseded` with an atomic backlink, in one final accepted Head; the predecessor's history and ID meaning are preserved.
- Rejected alternatives: editing the predecessor in place, reusing its ID with new meaning, and early predecessor retirement.
- Reason: accepted meaning is immutable; partial supersession is forbidden.
- Owner input remaining: NONE

### DEC-UPG-005 — Owner preauthorization of acceptance and merge

- Decision owner: `mayf3`
- Decision: the Owner preauthorizes the authorized local acceptance action and the merge of the exact accepted Head for this Goal when all of the following hold: exact `v1.0.3` identity PASS; independent audit ACCEPT with zero blockers; Product Authority bytes unchanged; no production, permission, or Secret involvement; no scope expansion.
- Rejected alternative: per-stage Owner re-approval.
- Reason: `OWNER_DISPATCH_UNIT = GOAL`; the Goal manages its lifecycle and the Owner retains the business-level gate.
- Owner input remaining: NONE (granted in the Goal dispatch; recorded here for persistence)

## 9. Contracts

### CTR-UPG-001 — Exact revision and bytes

The repository MUST vendor exactly the 25 manifest-bound files of distribution version `1.0.3` from source commit `0d61433339ef563f82307b70120d9fcee168cdab`, with the lock binding the manifest SHA-256 `f4aa7779623e670a384195ccc40e509fb5600ddfb97363f8b907386fffbceca2`. Floating references MUST NOT activate governance.

### CTR-UPG-002 — Truthful proposed state

The prepared lock and this Spec MUST remain `proposed` with null acceptance metadata until the authorized acceptance transition; the transition MUST record the actual `accepted_at` time and the accepting actor `mayf3`.

### CTR-UPG-003 — Stable-release adoption and local authority boundary

This adoption MUST identify the distribution as upstream stable Governance V1 `v1.0.3`, MUST preserve all product, architecture, Spec, implementation, and acceptance authority in `mayf3/vehicle-pet`, and MUST NOT let the upstream repository own product decisions.

### CTR-UPG-004 — Whole-authority successor lifecycle

The successor lifecycle MUST be atomic and truthful: while this Spec is `proposed`, `VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1` MUST remain `accepted` with `superseded_by = null`; at acceptance the predecessor MUST become `superseded` with `superseded_by = VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2` in the same accepted Head. Predecessor history and ID semantics MUST be preserved.

### CTR-UPG-005 — Forward-only, no bulk rewrite, no historical mutation

Grammar V1 MUST apply forward-only to future non-mechanical work. This upgrade MUST NOT bulk-rewrite history, re-format historical Specs, retroactively change accepted semantics, or re-review historical authorities. Vendored historical V0 protocol documents MUST remain unchanged in meaning.

### CTR-UPG-006 — Honest enforcement representation

The repository MUST describe enforcement as manual policy plus deterministic integrity checks (`verify_governance.py`, `validate_spec_transition.py`, `validate_governance_route.py`) and MUST NOT claim branch protection, required checks, semantic CI review, or any GitHub enforcement that is not active. This adoption MUST NOT change GitHub settings.

### CTR-UPG-007 — Product implementation gate unchanged

No non-mechanical product implementation MAY begin except per the routing rules accepted with this adoption: an active accepted Product Authority owns the obligation, and an accepted Spec with `implementation_authority: contracts` covers the work. This adoption itself MUST NOT authorize any product implementation.

### CTR-UPG-008 — V1 routing discipline for future work

Future non-mechanical work SHOULD route through Goal → Current Gap → Authority/Plan/Assurance routing → implementation → Evidence → independent review → DONE_WHEN/STOP, with authority action, plan level, and assurance level judged independently, `AFFECTED_CONTRACT_REVIEW` as the default review surface, and blockers requiring a legal source, concrete counterexample, impact, and minimal closure.

### CTR-UPG-009 — Evidence persistence locations

Investigations MUST persist under `docs/investigations/`; conformance MUST persist under `docs/conformance/` and corresponding PRs; governance routing and audit records for durable changes MUST persist in the adoption PR record.

### CTR-UPG-010 — Independent review boundary

Acceptance readiness MUST be reviewed against the exact Base and exact Head by an independent reviewer that did not participate in authoring, execution, or the acceptance transition of this round; any semantic change after the reviewed commit invalidates the review.

## 10. Acceptance

### ACC-UPG-001 — Exact source and vendored bytes

- Contracts: `CTR-UPG-001`
- Method: compare annotated tag object, source commit, `VERSION`, manifest digest/count, lock, and all locked file sizes and SHA-256 digests
- Environment: exact source checkout and proposed consumer worktree
- Required evidence: `OBS-UPG-001`, `OBS-UPG-002`, `OBS-UPG-003`, lock, manifest, and diff
- Expected result: all 25 file identities match the exact source commit; no floating reference activates governance
- Failure condition: any tag, commit, count, size, digest, or path mismatch

### ACC-UPG-002 — Truthful lifecycle states

- Contracts: `CTR-UPG-002`, `CTR-UPG-004`
- Method: inspect the proposed snapshot, the transition-validator fixtures and output for preparation and acceptance states, the independent audit record, the Owner preauthorization, and the accepted diff
- Environment: proposed Head followed by the accepted Head
- Required evidence: proposed Spec and lock, `OBS-UPG-005`, `EVD-UPG-003`, audit record, accepted Spec and lock, and exact parent relation
- Expected result: proposed metadata remains null until the authorized transition; the accepted Head flips successor to `accepted` and predecessor to `superseded` atomically with a correct backlink; `accepted_by = mayf3`; the candidate activates only at exact-Head merge
- Failure condition: premature predecessor retirement, premature backlink, fabricated acceptance metadata, or non-atomic lifecycle change

### ACC-UPG-003 — Stable-release and local authority boundary

- Contracts: `CTR-UPG-003`
- Method: review this Spec and `.agents/local/README.md` against the upstream release identity and the local authority inventory
- Environment: exact adoption candidate
- Required evidence: `OBS-UPG-004`, upstream release notes, authority map, and reviewer finding
- Expected result: stable-release claim is exact; external governance owns no product decision; product authority bytes unchanged
- Failure condition: wrong identity claimed or product authority delegated upstream

### ACC-UPG-004 — Forward-only behavior and unchanged history

- Contracts: `CTR-UPG-005`
- Method: inspect the adoption diff paths and confirm all pre-existing Spec and record files are byte-identical except this successor and the predecessor lifecycle fields
- Environment: consumer base through candidate Head
- Required evidence: changed-path list and per-file diff review
- Expected result: only governance-owned and adoption-authority paths change; no historical Spec is re-formatted or re-semantified
- Failure condition: bulk migration or retroactive semantic change

### ACC-UPG-005 — Enforcement claims match reality

- Contracts: `CTR-UPG-006`
- Method: compare local claims with vendored tool availability and live GitHub settings observations
- Environment: repository files and read-only GitHub API output
- Required evidence: `OBS-UPG-004` and verifier/validator outputs
- Expected result: manual policy plus deterministic integrity checks is the claimed and actual state; no settings change occurs
- Failure condition: an inactive gate is claimed active or settings are modified

### ACC-UPG-006 — Product implementation remains unauthorized by this adoption

- Contracts: `CTR-UPG-007`
- Method: inspect `implementation_authority`, changed paths, and the routing rules
- Environment: adoption candidate
- Required evidence: frontmatter and diff
- Expected result: `implementation_authority: none`; no product implementation is included or authorized
- Failure condition: product code changes ride along or implementation is claimed

### ACC-UPG-007 — Evidence persistence exists

- Contracts: `CTR-UPG-009`
- Method: inspect the PR record for observations, fixtures, validator outputs, and the audit record
- Environment: adoption PR
- Required evidence: persisted PR description and comments
- Expected result: governance routing and audit evidence survive outside chat
- Failure condition: load-bearing evidence exists only in chat

### ACC-UPG-008 — Independent exact-coordinate review

- Contracts: `CTR-UPG-010`
- Method: an eligible independent reviewer audits the exact Base and exact Head against the Goal checklist (exact upstream identity; vendor byte integrity; predecessor/successor lifecycle; no premature supersession; local Product Authority untouched; no semantic mutation of existing Specs; forward-only migration; correct Goal/Authority/Plan/Assurance route; no smuggled Operational Layer)
- Environment: clean committed candidate
- Required evidence: independent review record with exact commit coordinates and disposition
- Expected result: `ACCEPT` with zero blockers before the acceptance transition
- Failure condition: author self-certification, reviewed-coordinate drift, or unresolved blockers

### Contract coverage

| Contract | Acceptance | Covered |
|---|---|---|
| `CTR-UPG-001` | `ACC-UPG-001` | YES |
| `CTR-UPG-002` | `ACC-UPG-002` | YES |
| `CTR-UPG-003` | `ACC-UPG-003` | YES |
| `CTR-UPG-004` | `ACC-UPG-002` | YES |
| `CTR-UPG-005` | `ACC-UPG-004` | YES |
| `CTR-UPG-006` | `ACC-UPG-005` | YES |
| `CTR-UPG-007` | `ACC-UPG-006` | YES |
| `CTR-UPG-008` | `ACC-UPG-005` | YES |
| `CTR-UPG-009` | `ACC-UPG-007` | YES |
| `CTR-UPG-010` | `ACC-UPG-008` | YES |

Every Contract maps to at least one Acceptance item, and every Acceptance item maps back to its Contracts.

## 11. Alternatives and disposition

| Alternative | Disposition | Reason | Evidence/claims | Reopen condition |
|---|---|---|---|---|
| Stay on the draft pilot | Rejected | Governance V1 routing (Authority/Plan/Assurance separation, affected-contract review, blocker discipline) is the Goal's target; the draft cannot provide it | `DEC-UPG-001` | Only a future Owner Goal |
| Adopt an intermediate tag (`v1.0.0`–`v1.0.2`) | Rejected | `v1.0.3` is the current stable release and fixes the multi-generation transition validator; adopting older tags would require a further upgrade immediately | `OBS-UPG-001` | A future release changes identity requirements |
| Track a floating branch | Rejected | Mutable identity defeats exact review | `CTR-UPG-001` | Never for active governance |
| Rewrite historical Specs into V1 templates | Rejected | Forward-only policy; accepted semantics are immutable | `DEC-UPG-003` | A future explicit Owner Goal |
| Implement the upstream Operational Layer alongside | Rejected | Upstream implementation is `not_started`; smuggling it in would be scope expansion | Goal dispatch §7 | Upstream implementation exists and an Owner Goal selects it |
| GitHub enforcement for governance integrity | Deferred | Manual policy plus deterministic tools is sufficient today; settings changes are out of scope | `CTR-UPG-006` | Demonstrated friction that manual policy cannot cover |

## 12. Migration, compatibility, and rollback

```text
MIGRATION = forward-only
HISTORICAL_REWRITE = none
GOVERNANCE_UPDATE = one explicit docs-only adoption/update PR
ROLLBACK = revert the complete update commit(s)

SUCCESSOR_PREPARATION =
  VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1 remains accepted with superseded_by = null
  this Spec is proposed and declares supersedes = [VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1]

SUCCESSOR_ACCEPTANCE =
  this Spec becomes accepted
  VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1 becomes superseded
  predecessor.superseded_by = VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2
  both lifecycle directions change atomically in the final accepted Head

ACTIVATION = the accepted successor is active only when its exact accepted Head
is reachable from mayf3/vehicle-pet:main or an implementation base derived from it
```

## 13. Open questions

```text
OPEN_OWNER_DECISIONS = NONE (Owner preauthorization recorded in DEC-UPG-005)
NORMATIVE_TBD = NONE
UNRESOLVED_AUTHORITY_CONFLICT = NONE
PARTIAL_SUPERSESSION = NONE
READY_TO_MARK_ACCEPTED = NO
```
