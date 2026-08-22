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

[Vehicle Pet Product Direction V1](VEHICLE_PET_PRODUCT_DIRECTION_V1.md) and [Configurable Pet Engine V1](CONFIGURABLE_PET_ENGINE_V1.md) were co-reviewed as a parent/child pair on `agent/propose-vehicle-pet-product-and-engine-v1` and are `accepted` candidates at an exact accepted Head on that branch. They were accepted atomically in the same commit; neither is active repository authority and neither authorizes implementation until that exact accepted Head is merged into `main`.

Current repository state:

```text
PRODUCT_DIRECTION = ACCEPTED_CANDIDATE (VEHICLE_PET_PRODUCT_DIRECTION_V1 accepted at exact reviewed Head a4b4d2452e1933d3d753f8715f76e94fb3e4d639 + acceptance commit, not yet merged into main)
ARCHITECTURE = ACCEPTED_CANDIDATE (CONFIGURABLE_PET_ENGINE_V1 accepted at the same exact Head, not yet merged into main)
PRODUCT_IMPLEMENTATION = NONE
ACCEPTED_GOVERNING_PRODUCT_SPECS = 2 accepted candidates not yet on main
NEXT_PRODUCT_AUTHORITY = merge the exact accepted Head into main (separate Owner decision)
PRODUCT_IMPLEMENTATION_AUTHORIZED = NO
```

`PRODUCT_IMPLEMENTATION_AUTHORIZED = NO` because the two Specs, while accepted,
are not yet present on `main`: product implementation stays blocked until the
exact accepted Head of both Specs is merged into `main`.

The first product authority is reserved for `docs/specs/VEHICLE_PET_PRODUCT_DIRECTION_V1.md`; the accepted candidate exists but is not active authority until merged.

## Repository Spec index

| Spec ID | Status | Active authority | Kind | Implementation authority | Scope | Supersedes |
|---|---|---|---|---|---|---|
| `VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1` | accepted | derived from designated-branch/base membership | invariant | none | `mayf3/vehicle-pet` | none |
| `VEHICLE_PET_PRODUCT_DIRECTION_V1` | accepted | none (accepted candidate on PR branch, exact Head not yet merged into main) | invariant | none | `mayf3/vehicle-pet` | none |
| `CONFIGURABLE_PET_ENGINE_V1` | accepted | none (accepted candidate on PR branch, exact Head not yet merged into main) | implementation | contracts | `pet-engine`, `bundled-pet-packs`, `prototype-shell` | none |

`CONFIGURABLE_PET_ENGINE_V1` is governed by `VEHICLE_PET_PRODUCT_DIRECTION_V1`.
