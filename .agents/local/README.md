# Repository-local governance

This file is owned by `mayf3/vehicle-pet` and is not overwritten by governance updates.

## Repository identity and adoption class

```text
CONSUMER_REPOSITORY = mayf3/vehicle-pet
DESIGNATED_AUTHORITY_BRANCH = mayf3/vehicle-pet:main
GOVERNANCE_ADOPTION_CLASS = STABLE_RELEASE_GOVERNANCE_V1
CLAIM_UPSTREAM_STABLE_RELEASE = YES
UPSTREAM_ADOPTED_RELEASE = agent-development-governance v1.0.3 (source commit 0d61433339ef563f82307b70120d9fcee168cdab)
LOCAL_ADOPTION_MAY_BECOME_ACCEPTED = YES
LOCAL_ADOPTION_LIFECYCLE = accepted
ADOPTION_AUTHORITY = VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2 (supersedes VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1)
AUTHORITY_ACTIVATION_RULE = the accepted governance is active only when its accepted revision is reachable from mayf3/vehicle-pet:main or from an implementation base derived from that designated authority branch
ACTIVATION_STATUS_SOURCE = derived from Git branch and base coordinates; not hard-coded in this file
GOVERNANCE_LOCK = .agents/governance.lock.json
```

The vendored distribution is the upstream stable Governance V1 release, and its lock state is `accepted` (the predecessor draft-pilot adoption remains in history as `superseded`). On a feature branch before the accepted revision enters `mayf3/vehicle-pet:main`, it remains an accepted candidate. After that revision enters `main`, it is active local authority there, and an implementation base derived from a `main` revision containing that active authority is also governed by it. This file therefore does not hard-code an activation `YES` or `NO` that changes at merge time.

## Authority precedence

```text
PRODUCT_DIRECTION_AUTHORITY = docs/specs/VEHICLE_PET_PRODUCT_DIRECTION_V1.md (accepted)
ARCHITECTURE_AND_INVARIANT_AUTHORITY = docs/specs/CONFIGURABLE_PET_ENGINE_V4.md and docs/specs/DSH_PET_OVERLAY_ADAPTER_V3.md (accepted, implementation authority)
CURRENT_PRODUCT_IMPLEMENTATION = PRESENT (web app and DSH bundle plugin)
CURRENT_GOVERNING_PRODUCT_SPECS = VEHICLE_PET_PRODUCT_DIRECTION_V1, CONFIGURABLE_PET_ENGINE_V4, DSH_PET_OVERLAY_ADAPTER_V3, VEHICLE_PET_PROGRESS_SOURCE_V2, DSH_USAGE_PROGRESS_SOURCE_V2, VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2
GOVERNING_SPEC_LOCATION = docs/specs/
```

When accepted authorities exist, local Product Direction takes precedence over local Architecture/invariants, which take precedence over accepted governing Specs, then code, tests, runtime, and operational records.

For `autonomous-fleet` L1–L5, use the operational driver/safety-operator/escort table in active `CONFIGURABLE_PET_ENGINE_V4` §11.1. Equipment-based level narratives in superseded V2/V3 are rejected historical material and MUST NOT be used for level mapping. L6–L12 retain their existing accepted meaning. This lookup rule records the Owner correction of 2026-09-08; artwork decoration is not level authority.

The central governance repository supplies a constrained grammar and protocol distribution. It is not `vehicle-pet` product, architecture, Product Spec, code, or acceptance authority. A DeepSeek Harness prototype may be retained only as investigation evidence; it is not authority in this repository.

## Acceptance and authorization actors

```text
SPEC_ACCEPTANCE_ACTOR = mayf3
MECHANICAL_EXEMPTION_REVIEWER = mayf3, or an independent Reviewer explicitly designated by mayf3
EMERGENCY_AUTHORIZATION_ACTOR = mayf3
```

The independent Reviewer role means an Agent that did not participate in authoring, execution, or the acceptance transition in the same round and that reviews the exact Base and exact Head.

## Governing and persistence locations

```text
INVESTIGATION_PERSISTENCE = docs/investigations/
CONFORMANCE_PERSISTENCE = docs/conformance/ and the corresponding future implementation PR
ENFORCEMENT_LEVEL = MANUAL_POLICY_PLUS_DETERMINISTIC_INTEGRITY
DISTRIBUTION_INTEGRITY_CHECK = AVAILABLE (.agents/tools/verify_governance.py, validate_spec_transition.py, validate_governance_route.py)
BRANCH_PROTECTION_CHANGE_IN_THIS_ADOPTION = NO
REQUIRED_CHECK_CHANGE_IN_THIS_ADOPTION = NO
```

Repository enforcement observed at `2026-09-07T15:19:30Z`:

- repository visibility: private;
- default branch: `main`;
- `main` protected: no;
- required checks: none;
- pull-request/review requirement: none enforced by branch protection;
- no ruleset is claimed active.

These are observations, not settings changes. This adoption does not modify GitHub enforcement. Integrity verification is deterministic and local (the vendored tools above); semantic review remains a manual independent-review policy.

## Local extensions

Governance applies forward-only. It does not bulk-rewrite history. No non-mechanical product implementation may begin until an accepted, implementation-authorizing governing Spec covers that work. Deliberate governance changes require explicit repository-local updates and review; rollback is by reverting the complete adoption or update commit.
