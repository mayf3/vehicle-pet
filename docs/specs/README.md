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

All Specs below are `accepted` and active on `mayf3/vehicle-pet:main` (the designated authority branch) unless their row says otherwise. Current generation:

```text
PRODUCT_DIRECTION = VEHICLE_PET_PRODUCT_DIRECTION_V1 (accepted, active)
ENGINE_ARCHITECTURE = CONFIGURABLE_PET_ENGINE_V4 (accepted, active, implementation_authority: contracts)
DSH_OVERLAY_ADAPTER = DSH_PET_OVERLAY_ADAPTER_V8 (accepted, active, implementation_authority: contracts)
PROGRESS_SOURCE = VEHICLE_PET_PROGRESS_SOURCE_V2 (accepted, active)
USAGE_SOURCE = DSH_USAGE_PROGRESS_SOURCE_V2 (accepted, active, implementation_authority: contracts)
GOVERNANCE = VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2 (accepted, active; upstream agent-development-governance v1.0.3)
```

Activation rule: an accepted Spec is active repository authority when its accepted revision is reachable from `mayf3/vehicle-pet:main` or an implementation base derived from it. Historical note: the DSH adapter chain V1→V7 and the Engine chain V1→V4 are superseded in the index below; the V8 acceptance round (PR #40) also repaired the missing V6 backlink left by the V7 acceptance round.

| `VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1` | superseded | no (superseded by `VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2`) | invariant | none | `mayf3/vehicle-pet` | none |
| `VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2` | accepted | yes once the exact accepted revision is reachable from `mayf3/vehicle-pet:main` (accepted candidate on its adoption branch until merge) | invariant | none | `mayf3/vehicle-pet` | `VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1` |
| `VEHICLE_PET_PRODUCT_DIRECTION_V1` | accepted | yes on designated branch/base | invariant | none | `mayf3/vehicle-pet` | none |
| `CONFIGURABLE_PET_ENGINE_V1` | superseded | no (superseded by `CONFIGURABLE_PET_ENGINE_V2`) | implementation | contracts | `pet-engine`, `bundled-pet-packs`, `prototype-shell` | `CONFIGURABLE_PET_ENGINE_V2` |
| `CONFIGURABLE_PET_ENGINE_V2` | superseded | no (superseded by `CONFIGURABLE_PET_ENGINE_V3`) | implementation | contracts | `pet-engine`, `bundled-pet-packs`, `prototype-shell` | `CONFIGURABLE_PET_ENGINE_V1` |
| `CONFIGURABLE_PET_ENGINE_V3` | superseded | no (superseded by CONFIGURABLE_PET_ENGINE_V4) | implementation | contracts | `pet-engine`, `bundled-pet-packs`, `prototype-shell` | `CONFIGURABLE_PET_ENGINE_V2` |
| `CONFIGURABLE_PET_ENGINE_V4` | accepted | active when reachable from main | implementation | contracts | engine and bundled packs; corrected L1-L5 | CONFIGURABLE_PET_ENGINE_V3 |
| `DSH_PET_OVERLAY_ADAPTER_V1` | superseded | no (superseded by `DSH_PET_OVERLAY_ADAPTER_V2`) | implementation | contracts | `dsh-bundle-plugin`, `shell-overlay`, `compact-pet-surface`, `session-visual-reactions` | `DSH_PET_OVERLAY_ADAPTER_V2` |
| `DSH_PET_OVERLAY_ADAPTER_V2` | superseded | no (superseded by `DSH_PET_OVERLAY_ADAPTER_V3`) | implementation | contracts | `dsh-bundle-plugin`, `shell-overlay`, `compact-pet-surface`, `session-visual-reactions` | `DSH_PET_OVERLAY_ADAPTER_V1` |
| `DSH_PET_OVERLAY_ADAPTER_V3` | superseded | no (superseded by DSH_PET_OVERLAY_ADAPTER_V4) | implementation | contracts | `dsh-bundle-plugin`, `shell-overlay`, `resident-pet-surface`, `session-visual-reactions`, `pet-speech-presentation` | `DSH_PET_OVERLAY_ADAPTER_V2` |
| `DSH_PET_OVERLAY_ADAPTER_V4` | superseded | no (superseded by DSH_PET_OVERLAY_ADAPTER_V5) | implementation | contracts | exclusive characters, descriptive grade labels, wearable insignia, shared speech/prefs; whole V3 carry-forward | DSH_PET_OVERLAY_ADAPTER_V3 |
| `DSH_PET_OVERLAY_ADAPTER_V5` | superseded | no (superseded by DSH_PET_OVERLAY_ADAPTER_V6) | implementation | contracts | transparent resident, static motion, double-click menu, recurring speech, active-session footer | DSH_PET_OVERLAY_ADAPTER_V4 |
| `DSH_PET_OVERLAY_ADAPTER_V6` | superseded | no (superseded by DSH_PET_OVERLAY_ADAPTER_V7) | implementation | contracts | alpha-anchored vehicle caption, quiet baseline with eight bounded playful reactions | DSH_PET_OVERLAY_ADAPTER_V5 |
| `DSH_PET_OVERLAY_ADAPTER_V7` | superseded | no (superseded by DSH_PET_OVERLAY_ADAPTER_V8) | implementation | contracts | lifelike interaction layer: gesture arbitration, petting, cursor awareness, drag body reaction, ambient behavior, daypart weighting, welcome-back/rituals, character behavior profiles; whole V6 carry-forward | DSH_PET_OVERLAY_ADAPTER_V6 |
| `DSH_PET_OVERLAY_ADAPTER_V8` | accepted | active when reachable from main (PR #40) | implementation | contracts | Goal「开放」public-preview layer: brand-neutral identity, declarative pet presentations over declarative journeys, decoupled grade presentation, open pet preference with fail-soft; whole V7 carry-forward | DSH_PET_OVERLAY_ADAPTER_V7 |
| `VEHICLE_PET_PROGRESS_SOURCE_V2` | accepted | yes on main | implementation | none | `progress-source-registration`, `post-v1-external-progress-sources`, `token-usage-consumption-boundary` | none |
| `DSH_USAGE_PROGRESS_SOURCE_V1` | superseded | no (superseded by `DSH_USAGE_PROGRESS_SOURCE_V2`) | implementation | contracts | `dsh-usage-progress-source`, `counts-only-token-economy`, `usage-ledger-persistence` | none |
| `DSH_USAGE_PROGRESS_SOURCE_V2` | accepted | yes on main | implementation | contracts | `dsh-usage-progress-source`, `counts-only-token-economy`, `usage-ledger-persistence` | `DSH_USAGE_PROGRESS_SOURCE_V1` |

`CONFIGURABLE_PET_ENGINE_V1` and `DSH_PET_OVERLAY_ADAPTER_V1` are governed by `VEHICLE_PET_PRODUCT_DIRECTION_V1`; the adapter Spec is additionally governed by the accepted Engine Spec and Governance Adoption Spec.


Current Engine authority is CONFIGURABLE_PET_ENGINE_V4 after acceptance reaches main. L1–L5 operational occupancy/escort semantics supersede the erroneous V2/V3 decorative narrative. L6–L12 unchanged.
