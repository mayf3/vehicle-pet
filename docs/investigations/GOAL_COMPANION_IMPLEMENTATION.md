# Goal 常伴 — Implementation Record

```text
RECORDED_AT = 2026-09-07
IMPLEMENTATION_BASE = 47881e8d85423a7c80631cd38775bfb9f72a6cc0 (main after V2 authority merge)
WORKTREE = vehicle-pet-wt-companion-impl-47881e8d-20260907 (branch companion/companion-impl)
GOVERNING_AUTHORITY = DSH_PET_OVERLAY_ADAPTER_V2 (accepted; e84586a reachable from main)
REUSE_AUTHORITIES = CONFIGURABLE_PET_ENGINE_V3, DSH_USAGE_PROGRESS_SOURCE_V1, VEHICLE_PET_PROGRESS_SOURCE_V2, VEHICLE_PET_PRODUCT_DIRECTION_V1
```

## What was implemented

1. **Seedling fixture leaves the DSH daily user surface (CTR-OVERLAY-006; ACC-019)**
   - The compact panel no longer renders a Pack switch; no DSH surface renders a
     Pack option. `seedling-fixture` remains bundled in `dshPackBundles` (second-Pack
     engine conformance intact, unit-asserted) and stays fully selectable in the
     standalone prototype.
   - `resolveDshProductPackId` (engine-bundles.ts) resolves stored non-product
     `activePackId` to `autonomous-fleet` on the DSH surface via the ordinary
     Engine `switchPack` mechanism — repoints display only; no stored progression,
     keepsakes, or receipts are deleted or rewritten.

2. **Compact panel simplified (CTR-OVERLAY-005; ACC-005/017)**
   - 320px/eight-item → 264px/five-item: stage+level, progress+next threshold,
     View full journey, one `More settings` disclosure holding the Reduced Motion
     control (system/on/off semantics unchanged, CTR-015), Collapse. Header keeps
     title + close. Pack name, keepsake row, and Pack switch are removed from the
     compact layer (still in the full-journey dialog / standalone).

3. **Static five-state expression system (DEC-007, CTR-014/015; ACC-020)**
   - Architecture: LEVEL_BASE_VISUAL (unchanged pack sprites) + per-state
     expression overlay layer (plugin presentation) + per-level face anchor
     table + existing motion/glow presentation.
   - Five transparent masters (idle/working/needs-input/completed/failed; failed
     covers cancelled) drawn by a fixed inline SVG recipe → sharp → PNG + lossless
     WebP (`scripts/generate-expression-assets.mjs`), byte-compared by
     `assets:expression-check`; PROVENANCE.json records route, anchors, and exact
     SHA-256 per artifact; `expression-assets.generated.ts` inlines them into the
     plugin bundle (no network, no model call, no runtime generation).
   - `ExpressionLayer` renders inside the subject box through a new optional
     presentation-only `subjectOverlay` prop on `PetSceneRenderer` (engine schema
     and Pack data untouched; prototype unaffected). Anchors mirror the generator
     constants (480x480 canvas percentages per level).
   - Motion coupling: the overlay carries the same keyframes/timing as its
     subject asset (idle float + state poses), gated by the scene's effective
     reduced-motion flag; with motion suppressed the static layer alone
     distinguishes all five states (CTR-015).

## Art route decision (GOAL §5)

The authorized ChatGPT image route was probed first (2026-09-07): chatgpt.com is
reachable but has no authenticated session in the sanctioned browser surface, and
the route is brief-only (no repository images may be sent), which cannot satisfy
face-anchored registration for overlay patches. Per GOAL §18 local bounded
execution continued: masters are deterministic SVG-recipe renders (the same
established pipeline style as `generate-pack-assets.mjs`). Independent visual
evaluation (agent outside the generation process) returned **ACCEPT** with
SAME_CHARACTER_IDENTITY / STATIC_EXPRESSION_READABILITY /
112PX_EXPRESSION_READABILITY / LEVEL_IDENTITY_PRESERVED = PASS and
COPY_OR_BRAND_RISK = NONE (one revision round used to strengthen whoosh/sweat/
blush legibility before review).

## Evidence map (executed, this branch)

- `pnpm verify` — green (typecheck, lint, unit+dom, prototype e2e, build,
  contracts, assets:check, assets:expression-check).
- `pnpm verify:dsh` — green (adds assets:dsh-check, build:dsh, bundle/package/
  lifecycle checks, dsh unit+dom 88/88, full DSH e2e suite).
- ACC-019: DOM + E2E assert zero pack options and no seedling copy on any DSH
  surface; unit asserts both packs still bundled with product default and the
  legacy-pack resolution; behavior re-verified at fixed-ref acceptance with a
  seeded legacy `activePackId`.
- ACC-020: E2E `EXPRESSION_STATIC_DISTINCTION_TEST` walks the real structured
  session matrix (idle → needs-input → failed → working → cancelled → completed)
  asserting the distinct rendered expression asset per state at the real 112px
  surface, with 112px screenshots per state; unit asserts anchor coverage for
  every level, five-state mapping (cancelled→failed), bundled webp+png, and
  provenance-hash equality.
- ACC-008/CTR-007: DOM test re-asserts session reactions (now with the
  expression layer active) never touch `progressPoints`; e2e session matrix
  unchanged in its no-growth assertions.

## Invariants

L1–L12 visuals and thresholds: untouched (no pack asset or manifest change;
`assets:check` byte-identical). Token economy / usage source: untouched.
DSH Core: untouched (plugin-only diff). Reduced motion: preserved and extended
(static carrier). DeepSeek-pet coexistence: untouched surfaces outside the
overlay plugin.
