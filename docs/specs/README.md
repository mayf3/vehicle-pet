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

[Vehicle Pet Development Governance Adoption V1](VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1.md), [Vehicle Pet Product Direction V1](VEHICLE_PET_PRODUCT_DIRECTION_V1.md), and [Configurable Pet Engine V1](CONFIGURABLE_PET_ENGINE_V1.md) have lifecycle status `accepted` and are present on the designated authority branch at base `25b56b3b8540031e9d6e320d22872d86a136c7ad`. The Configurable Pet Engine V1 implementation and conformance record are also present on that base.

[DSH Pet Overlay Adapter V1](DSH_PET_OVERLAY_ADAPTER_V1.md) is a docs-only `proposed` implementation Spec. It is reviewable candidate material, grants no current implementation permission, and awaits independent audit of its exact proposed Head followed by Owner acceptance.

Current repository state:

```text
PRODUCT_DIRECTION = ACCEPTED_ACTIVE
ENGINE_ARCHITECTURE = ACCEPTED_ACTIVE
CONFIGURABLE_PET_ENGINE_V1_IMPLEMENTATION = PRESENT_AT_25b56b3b8540031e9d6e320d22872d86a136c7ad
DSH_PET_OVERLAY_ADAPTER_V1 = PROPOSED
DSH_OVERLAY_IMPLEMENTATION_AUTHORIZED = NO
NEXT_AUTHORITY_ACTION = independent 接入 audit of exact proposed Head, then Owner acceptance
```

`DSH_OVERLAY_IMPLEMENTATION_AUTHORIZED = NO` because a proposed Spec is not active authority. No DSH adapter implementation may begin until the exact reviewed revision of `DSH_PET_OVERLAY_ADAPTER_V1` is accepted by the authorized Owner and present on an implementation base derived from `main`.

## Repository Spec index

| Spec ID | Status | Active authority | Kind | Implementation authority | Scope | Supersedes |
|---|---|---|---|---|---|---|
| `VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1` | accepted | yes on designated branch/base | invariant | none | `mayf3/vehicle-pet` | none |
| `VEHICLE_PET_PRODUCT_DIRECTION_V1` | accepted | yes on designated branch/base | invariant | none | `mayf3/vehicle-pet` | none |
| `CONFIGURABLE_PET_ENGINE_V1` | accepted | yes on designated branch/base | implementation | contracts | `pet-engine`, `bundled-pet-packs`, `prototype-shell` | none |
| `DSH_PET_OVERLAY_ADAPTER_V1` | proposed | no; awaits exact-Head independent audit and Owner acceptance | implementation | contracts | `dsh-bundle-plugin`, `shell-overlay`, `compact-pet-surface`, `session-visual-reactions` | none |

`CONFIGURABLE_PET_ENGINE_V1` and `DSH_PET_OVERLAY_ADAPTER_V1` are governed by `VEHICLE_PET_PRODUCT_DIRECTION_V1`; the adapter Spec is additionally governed by the accepted Engine Spec and Governance Adoption Spec.
