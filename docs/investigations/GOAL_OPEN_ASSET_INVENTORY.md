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
| F. masters consumed by build | `master-l1..l12.png`, `companion-alpha.png` | NO (all wordmarks removed; L8/L9 via surroundedness letter-fill + face protection — see residue note) | NO (scale text cleared on L6–L12) | no (build inputs) | corrected in place by the debrand pipeline; provenance updated |
| G. public README / docs screenshots | `docs/evidence/**`, `docs/conformance/**`, `docs/investigations/character-v4/**` | YES — HISTORICAL | YES — HISTORICAL | no | historical evidence, kept intact per DEC-027; `HISTORICAL_REFERENCE != CURRENT_PRODUCT_IDENTITY`; regenerated review sheets (`character-v4/*.png`) are now brand-neutral |
| H. bundle-inlined assets | `lib/client.js` data URLs | NO (PUBLIC_BRAND_BUNDLE_CHECK) | NO | YES | gate-enforced at every build |

## Residue note (fix round 2 — dense arrays closed)

- `master-l7.png` (10-car array): all 10 per-car door wordmarks removed by hand-cataloged boxes. CLEAN.
- `master-l8.png` (100-car array) and `master-l9.png` (city background cars): wordmarks removed via a deterministic **surroundedness letter-fill** — a text-colored pixel is filled only when ≥5 of 8 compass rays at 4px hit light background (letters on doors qualify; car outlines, eye interiors, and wheels do not), followed by **eye-pair protection** (eye blobs are detected as filled dark ellipse pairs; each face zone — eyes + mouth — is restored verbatim from the pre-fill master). Wordmarks are no longer legible anywhere on either master; faces and expressions are preserved. Minor interpolation smudges remain at occlusion boundaries (documented cosmetic artifacts, sub-pixel at shipped scale); a handful of glyph fragments inside protected face zones survive but are not readable. Downstream sprites, maps, and the bundle were regenerated from the cleaned masters and re-locked by the determinism gates.
- Operator/driver figures keep a generic shield icon (a symbol, not a brand mark).
- Companion pose-9 chest mark (missed by the first pass, caught by independent visual audit) was removed in the first fix round; all 10 poses re-verified at zoom.

## Verification hooks

- `PUBLIC_BRAND_RUNTIME_CHECK` (contracts): no third-party brand in runtime source.
- `PUBLIC_BRAND_BUNDLE_CHECK` (`check-dsh-bundle.mjs`): none in the shipped bundle.
- `CURRENT_SHIPPING_ASSET_INVENTORY_CHECK` (contracts): provenance records present for every wired pet.
- Review sheets regenerated: `docs/investigations/character-v4/level-contact-sheet.png`, `expression-sheet.png`, `small-large-sheet.png` (brand-neutral captions).
