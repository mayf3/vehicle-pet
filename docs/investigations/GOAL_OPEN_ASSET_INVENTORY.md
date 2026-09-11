# GOAL_OPEN_ASSET_INVENTORY — current shipping art inventory (V8 CTR-042)

OBSERVED_AT = 2026-09-11 @ open/impl-v8 worktree (post debrand apply, pre-audit).
METHOD = deterministic debrand pipeline (`scripts/debrand-shipping-masters.mjs`, manifest-driven, horizontally-interpolated text-pixel fill; replaced masters regenerate all downstream sprites through the normal deterministic pipelines), grid/zoom visual cataloging of every master, cluster detection for wordmark boxes, final density + visual sweeps.

## Classification

| Class | Assets | Visible brand | Visible baked numeral | Ships to runtime | Notes |
|---|---|---|---|---|---|
| A. runtime vehicle sprites (L1–L12, from masters) | `src/packs/autonomous-fleet/assets/autonomous-fleet/sprite-*` | NO (corrected) | NO (never had; scale text lived only on masters) | YES | regenerated from corrected masters; `assets:check` byte-locked |
| B. runtime companion poses (10) | `src/dsh/client/assets/companion/pose-*` | NO (corrected) | NO | YES | regenerated from corrected `companion-alpha.png`; PROVENANCE.json updated with new source sha |
| C. insignia SVG (12) | `src/dsh/client/assets/insignia/l*.svg` | NO | NO (titles are accessibility metadata only) | YES | unchanged; symbolic per V8 CTR-040 |
| D. expression layers (10) | `src/dsh/client/assets/expressions/*` | NO | NO | YES | generic facial features, unchanged |
| E. orb fixture assets | `src/packs/orb-fixture/assets/**`, `src/dsh/client/pets/orb/assets/**` | NO | NO | YES | born clean from the deterministic local pipeline |
| F. masters consumed by build | `master-l1..l12.png`, `companion-alpha.png` | PARTIAL — see residue note | NO (scale text cleared on L6–L12) | no (build inputs) | corrected in place by the debrand pipeline; provenance updated |
| G. public README / docs screenshots | `docs/evidence/**`, `docs/conformance/**`, `docs/investigations/character-v4/**` | YES — HISTORICAL | YES — HISTORICAL | no | historical evidence, kept intact per DEC-027; `HISTORICAL_REFERENCE != CURRENT_PRODUCT_IDENTITY`; regenerated review sheets (`character-v4/*.png`) are now brand-neutral |
| H. bundle-inlined assets | `lib/client.js` data URLs | NO (PUBLIC_BRAND_BUNDLE_CHECK) | NO | YES | gate-enforced at every build |

## Residue note (honest classification)

- `master-l7.png` (10-car array) and `master-l8.png` (100-car array): the per-car door wordmark recurs at very small scale. At every shipped render size the marks are sub-legible (a few pixels); at 1:1 master zoom they remain technically legible. Filling them would risk damaging the surrounding approved art; they are classified as SUB-LEGIBLE RESIDUE in class F and flagged for optional regeneration through the Owner-designated offline art route (which can also re-express the L6–L12 scale semantics per CTR-042). Runtime identity is unaffected (class A ships clean).
- `master-l9.png` small background cars: same sub-legible class.
- Operator/driver figures keep a generic shield icon (a symbol, not a brand mark).

## Verification hooks

- `PUBLIC_BRAND_RUNTIME_CHECK` (contracts): no third-party brand in runtime source.
- `PUBLIC_BRAND_BUNDLE_CHECK` (`check-dsh-bundle.mjs`): none in the shipped bundle.
- `CURRENT_SHIPPING_ASSET_INVENTORY_CHECK` (contracts): provenance records present for every wired pet.
- Review sheets regenerated: `docs/investigations/character-v4/level-contact-sheet.png`, `expression-sheet.png`, `small-large-sheet.png` (brand-neutral captions).
