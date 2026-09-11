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
| F. masters consumed by build | `master-l1..l12.png`, `companion-alpha.png` | NO for L1–L7 and companion (corrected); L8/L9 see residue note | NO (scale text cleared on L6–L12) | no (build inputs) | corrected in place by the debrand pipeline; provenance updated |
| G. public README / docs screenshots | `docs/evidence/**`, `docs/conformance/**`, `docs/investigations/character-v4/**` | YES — HISTORICAL | YES — HISTORICAL | no | historical evidence, kept intact per DEC-027; `HISTORICAL_REFERENCE != CURRENT_PRODUCT_IDENTITY`; regenerated review sheets (`character-v4/*.png`) are now brand-neutral |
| H. bundle-inlined assets | `lib/client.js` data URLs | NO (PUBLIC_BRAND_BUNDLE_CHECK) | NO | YES | gate-enforced at every build |

## Residue note (honest classification, post fix-round)

- `master-l7.png` (10-car array): all 10 per-car door wordmarks removed by hand-cataloged boxes (gridded 2x/4x tile cataloging; faces and art verified intact after each pass). CLEAN.
- `master-l8.png` (100-car array): wordmark glyphs measure ≈6–7px at the native 1024px master; the L8 journey sprite ships at a 480px canvas (further ≈0.53x downscale), so marks are ≤4px and not resolvable as text at any shipped size. The marks are nevertheless present in the master (build input); one cluster met safe-fill criteria and was removed; the remainder is flagged for the Owner-designated offline art route (which can also re-express the array's scale semantics per CTR-042). NOT silently claimed clean.
- `master-l9.png` small background cars: same measured sub-legibility class as L8 (city-scale decoration, glyph height ≤6px at native); flagged identically.
- Operator/driver figures keep a generic shield icon (a symbol, not a brand mark).
- Companion pose-9 chest mark (missed by the first pass, caught by independent visual audit) was removed in the fix round; all 10 poses re-verified at zoom.

## Verification hooks

- `PUBLIC_BRAND_RUNTIME_CHECK` (contracts): no third-party brand in runtime source.
- `PUBLIC_BRAND_BUNDLE_CHECK` (`check-dsh-bundle.mjs`): none in the shipped bundle.
- `CURRENT_SHIPPING_ASSET_INVENTORY_CHECK` (contracts): provenance records present for every wired pet.
- Review sheets regenerated: `docs/investigations/character-v4/level-contact-sheet.png`, `expression-sheet.png`, `small-large-sheet.png` (brand-neutral captions).
