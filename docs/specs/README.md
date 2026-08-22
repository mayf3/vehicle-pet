# Governing Specs

Governing Specs live at stable paths:

```text
docs/specs/<SPEC_ID>.md
```

Syntax and lifecycle are governed by `.agents/protocol/SPEC_FORMAT_V0.md` and `.agents/protocol/SPEC_GOVERNANCE_V0.md`.

## Lifecycle

```text
proposed -> accepted -> superseded
```

- `proposed` is reviewable candidate material, not active authority and not implementation authorization.
- `accepted` means the authorized local acceptance actor accepted the Spec at an exact commit. It is active repository authority when that accepted revision is present through the designated authority branch or an implementation base derived from it; otherwise it remains an accepted candidate.
- `superseded` means a later accepted Spec fully replaced it through explicit metadata; partial supersession is not allowed.

Implementation progress, verification coverage, runtime state, and conformance are separate from lifecycle. Lifecycle status `accepted` does not by itself mean `implementation_authority: contracts`.

Before non-mechanical implementation, governance adoption must be accepted, the governing implementation base must contain an accepted Spec with `implementation_authority: contracts`, and the requested work must be within an active Contract's scope.

## Current authority inventory

[Vehicle Pet Development Governance Adoption V1](VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1.md) has lifecycle status `accepted`. Its active-authority status is derived from designated-branch or implementation-base membership under the rule above, and it grants no implementation authority.

Current repository state:

```text
PRODUCT_DIRECTION = NONE_YET
ARCHITECTURE = NONE_YET
PRODUCT_IMPLEMENTATION = NONE
ACCEPTED_GOVERNING_PRODUCT_SPECS = NONE
NEXT_PRODUCT_AUTHORITY = VEHICLE_PET_PRODUCT_DIRECTION_V1
```

The future first product authority is reserved for `docs/specs/VEHICLE_PET_PRODUCT_DIRECTION_V1.md`; it does not exist and is not active yet.

## Repository Spec index

| Spec ID | Status | Active authority | Kind | Implementation authority | Scope | Supersedes |
|---|---|---|---|---|---|---|
| `VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1` | accepted | derived from designated-branch/base membership | invariant | none | `mayf3/vehicle-pet` | none |
