# Goal 常伴 — Product Preflight Record

```text
GOAL_NAME = 常伴
RECORDED_AT = 2026-09-07
REPOSITORY = mayf3/vehicle-pet
BASE_COMMIT = 6350ce8fd165d3e0c7bcea3b6d4af8b4914aedb9 (origin/main, fresh-verified, == EXPECTED_BASE_AT_DISPATCH)
WORKTREE = vehicle-pet-wt-companion-6350ce8f-20260907 (branch companion/constant-companion)
SPEC_GOVERNANCE_MODE = PREFLIGHT
PREFLIGHT_MODE = SUPERSEDE
CHANGE_CLASS = NON_MECHANICAL
MECHANICAL_EXEMPTION_REVIEW = NOT_APPLICABLE
GOVERNANCE_ADOPTION_STATUS = accepted (active on designated branch at base)
PRIMARY_GOVERNING_SPEC = DSH_PET_OVERLAY_ADAPTER_V1 → superseded by DSH_PET_OVERLAY_ADAPTER_V2 (planned)
RELATED_ACCEPTED_AUTHORITIES = CONFIGURABLE_PET_ENGINE_V3, DSH_USAGE_PROGRESS_SOURCE_V1, VEHICLE_PET_PROGRESS_SOURCE_V2, VEHICLE_PET_PRODUCT_DIRECTION_V1, VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1
GOVERNING_SPEC_REVISION = blob at BASE_COMMIT
SPEC_PRESENT_IN_BASE = YES
SPEC_STATUS_IN_BASE = accepted
IMPLEMENTATION_AUTHORITY = contracts
AUTHORITY_CONFLICT = CTR-OVERLAY-005 / §8.2 eight-item panel freeze and §8 COMPACT_PANEL_WIDTH_PX / DEC-OVERLAY-002 vs Owner-frozen panel simplification; resolved by whole-authority supersession (V0 partial supersession forbidden)
IMPLEMENTATION_ALLOWED = NO until DSH_PET_OVERLAY_ADAPTER_V2 is accepted and present in the implementation base
NEXT_ACTION = AUTHOR V2 (docs-only) → independent spec review → accept → implement against pinned V2
```

## GOAL §6 preflight questions — answers

1. **Is seedling-fixture mandated as a user-visible Pack?**
   NO. `CTR-PET-011` / `ACC-PET-011` (Engine V3) obligate only same-Engine
   conformance ("runs on the same Engine", "without Engine edits").
   `CTR-OVERLAY-006` obligates the adapter to bundle exactly the two bundled
   Packs and to switch via Engine `activePackId` — a bundling/switching-mechanism
   obligation, not a user-visibility obligation. `VEHICLE_PET_PRODUCT_DIRECTION_V1`
   §2 already classifies the V1 lineup as `autonomous-fleet` (first production
   Pack) and `seedling-fixture` (**conformance** Pack). Hiding seedling from the
   DSH daily user surface therefore does not contradict any accepted Contract's
   normative meaning; the V2 wording makes the boundary explicit.
2. **Are the Panel's eight items frozen?** YES — `CTR-OVERLAY-005` freezes the
   compact panel to exactly the §8.2 eight items. Simplification requires V2.
3. **Are Panel size/content frozen by the Overlay Spec?** YES — §8
   `COMPACT_PANEL_WIDTH_PX = 320` and `DEC-OVERLAY-002`. V2 updates both.
4. **Can expression assets be expressed by the current declarative Pack schema?**
   They do not need to be. The Engine/Pack boundary stays untouched
   (REUSE for CONFIGURABLE_PET_ENGINE_V3); expressions ride the existing
   adapter presentation seam (styles/state attributes) with bundled plugin
   assets, which `CTR-OVERLAY-008` explicitly allows ("Bundled asset loads
   delivered by the plugin module are allowed").
5. **Do transient session-state semantics allow real multi-expression?**
   YES — §8.3 / `CTR-OVERLAY-007` require a transient, visual-only, structured
   mapping and freeze its non-growth semantics, but do not freeze the
   presentation form to CSS filters. Static per-state expression layers remain
   transient visual presentation and mutate nothing.

## Code census (Observations at BASE_COMMIT)

- DSH seedling exposure is exactly one surface: `VehiclePetPanel.tsx` maps
  `snapshot.availablePacks` (engine `registry.list()`) into user-visible pack
  switch buttons. The full-journey dialog does not render `PackSelector`;
  the standalone prototype (dev surface) does.
- Session states reach the pet button as `data-live` (`idle | running |
  needs-input | terminal`) and `data-terminal` (`completed | failed |
  cancelled`); `styles.ts` keys CSS motion on them. This is the expression
  wiring seam.
- Assets: pack assets are generated deterministically (`scripts/generate-pack-assets.mjs`,
  inline SVG recipes + sharp → PNG + lossless WebP, manifest-driven,
  byte-compared by `assets:check`); DSH bundle inlines bytes as data URLs via
  generated `asset-bundles.generated.ts` (`assets:dsh-check`). Expression
  assets will follow the same deterministic pattern as plugin-owned assets
  with a per-level anchor table.
- Resident surface already shows within-level micro progress without the panel
  (`WithinLevelMicroProgress`), supporting DEFAULT_SURFACE = pet-first.

## Planned authority mutation (bounded)

One docs-only whole-authority supersession:
`DSH_PET_OVERLAY_ADAPTER_V1` → `DSH_PET_OVERLAY_ADAPTER_V2`, covering:

- §8 frozen model: compact panel width 320 → 264; add DSH user-visible product
  Pack set = `autonomous-fleet` only; seedling-fixture stays bundled for
  Engine conformance and MUST NOT appear as a user-selectable option in DSH
  daily UI; expression presentation added as adapter visual-reaction obligation.
- §8.2 compact panel items: 8 → 5 (stage/level; progress plus next threshold;
  "View full journey" entry; low-disturbance "more" disclosure containing the
  Reduced Motion control; Collapse). Header close stays panel chrome.
- `CTR-OVERLAY-005`, `CTR-OVERLAY-006` (user-surface sentence), §8.3
  presentation column, `CTR-OVERLAY-007` (presentation may include static
  per-state expression art; semantics unchanged), plus new expression-system
  Contract(s) and matching Acceptance rows (contact-sheet distinction, 112px
  readability, reduced-motion static distinction, no session→progress coupling).

Everything else in V1 is copied verbatim. Engine V3, usage progress source
authority, Token Economy, L1–L12 visuals: untouched (REUSE).
