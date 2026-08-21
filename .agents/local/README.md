# Repository-local governance

This file is owned by `mayf3/vehicle-pet` and is not overwritten by governance updates.

## Repository identity and adoption class

```text
CONSUMER_REPOSITORY = mayf3/vehicle-pet
DESIGNATED_AUTHORITY_BRANCH = mayf3/vehicle-pet:main
GOVERNANCE_ADOPTION_CLASS = PILOT_OF_DRAFT_DISTRIBUTION
CLAIM_UPSTREAM_STABLE_RELEASE = NO
LOCAL_ADOPTION_MAY_BECOME_ACCEPTED = YES
GOVERNANCE_LOCK = .agents/governance.lock.json
```

The vendored distribution is a draft pilot. Its current lock state is `proposed`; that state is not active local authority and does not claim upstream stability.

## Authority precedence

```text
PRODUCT_DIRECTION_AUTHORITY = NONE_YET
FUTURE_PRODUCT_DIRECTION_LOCATION = docs/specs/VEHICLE_PET_PRODUCT_DIRECTION_V1.md
ARCHITECTURE_AUTHORITY = NONE_YET
CURRENT_PRODUCT_IMPLEMENTATION = NONE
CURRENT_GOVERNING_PRODUCT_SPECS = NONE
GOVERNING_SPEC_LOCATION = docs/specs/
```

When accepted authorities exist, local Product Direction takes precedence over local Architecture/invariants, which take precedence over accepted governing Specs, then code, tests, runtime, and operational records.

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
ENFORCEMENT_LEVEL = MANUAL_POLICY
BRANCH_PROTECTION_CHANGE_IN_THIS_ADOPTION = NO
REQUIRED_CHECK_CHANGE_IN_THIS_ADOPTION = NO
```

Repository enforcement observed at `2026-08-21T12:55:14Z`:

- repository visibility: private;
- default branch: `main`;
- `main` protected: no;
- required checks: none;
- active rulesets: unavailable on the repository's current GitHub plan; the API returned HTTP 403 and no ruleset is claimed active;
- pull-request/review requirement: none enforced by branch protection;
- Actions workflows: 0;
- branches: 1;
- commits: 1.

These are observations, not settings changes. This adoption does not modify GitHub enforcement.

## Local extensions

Governance applies forward-only. It does not bulk-rewrite history. No non-mechanical product implementation may begin until an accepted, implementation-authorizing governing Spec covers that work. Deliberate governance changes require explicit repository-local updates and review; rollback is by reverting the complete adoption or update commit.
