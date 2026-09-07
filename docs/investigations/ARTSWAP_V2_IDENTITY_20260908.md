# Investigation Record — Goal 换图 art-bytes replacement (V2 identity)

```text
RECORD_ID = INV-ARTSWAP-V2-20260908
REPOSITORY = mayf3/vehicle-pet
BASE_COMMIT = c3d1d4e7f5697a0dd53f8d4a9d6996e7bdde2cac (origin/main, fresh-verified 2026-09-07)
WORKTREE = vehicle-pet-wt-artswap-v2-c3d1d4e-20260907 (branch artswap/v2-identity)
DATE = 2026-09-08
```

## Requested change

Replace the user-visible base vehicle art bytes (all 12 levels + fleet unit car)
with the Owner-confirmed Vehicle Pet Art V2 identity, per the Goal 换图 dispatch
and its 2026-09-07 RESUME correction (`RESUME_FROM = ART_PRODUCTION`).
Progression semantics, thresholds, fleet-size truth, scenes, keepsakes, usage,
Token Economy, Panel structure, and DSH Core are unchanged.

## Authority classification (PREFLIGHT_DECIDE_MINIMALLY)

```text
AUTHORITY_ACTION = REUSE
PRIMARY_GOVERNING_SPEC = CONFIGURABLE_PET_ENGINE_V3 (accepted, active on base)
RELATED = DSH_PET_OVERLAY_ADAPTER_V2 (accepted, active on base)
IMPLEMENTATION_ALLOWED = YES
```

Rationale: DEC-PET-031/DEC-PET-032 freeze the *semantic* identity (unmanned
cabins; L1–L5 subject + mini escort; L6–L12 supervision-count typeset + scale
outline + remote operator; asset IDs; budgets; manifest schema) — not the
concrete paint style bytes. The Goal explicitly forbids creating a V4 for an
art-bytes swap. All frozen semantics are preserved byte-for-byte in the new
masters; only the visual identity changes, which is precisely the Goal's
business outcome. The stale L3 color word (黄色饰条) in the manifest summary is
corrected to 青色饰条 for art/copy consistency under the same principle DEC-PET-
031 used when it revised copy to match art.

## Input recovery history

- The handoff package (`~/Downloads/vehicle-pet-art-v2/`, `vp-art.zip`) contains
  only the reference mockup; the planned masters were never produced (Owner
  correction 2026-09-07 confirms: masters were a plan, not inputs).
- AUTHORITATIVE_VISUAL_REFERENCE = reference-concept.png
  SHA256 4f3ccc8f48d7170fe2dccfb150657c772fec3700b1ce702e8eaae9a91928c3dd
  (1672×941; byte-identical copy verified inside vp-art.zip).
- First search round (2026-09-07) reported BLOCKED under NEW_IMAGE_GENERATION=NO;
  the Owner correction lifted that constraint via the ART_PRODUCTION phase with
  the reference as the sole visual basis and the ChatGPT browser route
  (CHATGPT_BROWSER_ROUTE = CODEX_SIDEBAR_BROWSER class surface).

## Production route (bounded)

- chatgpt.com via Owner Brave (CDP 9222, authenticated Pro account), image
  generations only; the authoritative reference attached/pasted per thread.
- Frozen semantics fed as prompt constraints; outputs collected by file id and
  hash-frozen under docs/evidence/artswap-v2-20260908/src-generations/.
- Deterministic post-process: docs/evidence/artswap-v2-20260908/build_v2.py
  (white-to-alpha border flood fill, despeckle, fixed cell cuts, count label
  typeset with local fonts — same composition contract as the superseded round).

## Result

- masters/master-v2-l1-l5-family.png (cells L1–L5, cuts [0,440,848,1258,1727,2172])
- masters/master-v2-l6..l12.png (count labels: 3 辆 / 10 辆 / 100 辆 / 1,000 辆 /
  1 万辆 / 10 万辆 / 100 万辆 — identical strings to the accepted superseded round)
- sprite-unit-car recipe restyled to the V2 identity (was generic blue SVG car)
- five expression state overlays recolored for the dark navy face display;
  12-level face anchors re-measured from the shipped sprites
- L3 manifest summary color word corrected (黄→青)

## Constraints honored

- NEW_IMAGE_GENERATION lifted only inside Goal 换图 ART_PRODUCTION; no model at
  build or runtime (pipeline and expression generators remain deterministic).
- No Pony.ai marks, no white/yellow superseded style, no brand logos, no text
  baked into art (count labels are locally typeset, as accepted in V3).
- Old master bytes remain recoverable via git history; PROVENANCE-v2-identity.json
  documents the new chain and supersedes the old provenance for current files.

## Correction (2026-09-08, Owner review)

Deployed result reviewed by the Owner in the real client: "这不是我做的效果".
Owner direction: the material is the final images referenced by the absolute
paths inside `superseded-round-prompts.json` (pony-v1-scale-v2 round), i.e. the
blue-white SUV set the Owner produced — not the Astra-mockup-derived identity
this round shipped.

Implemented correction:
- L6–L12: restored the accepted c3d1d4e masters (built from those exact exec
  images with the local count-label typesetting).
- L1–L5: Owner `l1.png`–`l5.png` (1024×1024 RGBA, same directory) committed as
  `master-l1.png`–`master-l5.png`; pipeline now derives every level from its
  own per-level master (family-cut path removed).
- Expressions restored to the accepted NAVY-recipe overlays (light car face);
  L1–L5 anchors re-measured for the SUV face ([8,43,28] [12,42,32] [9,42,28]
  [12,44,32] [10,53,30]); L6–L12 anchors restored to accepted values.
- unit-car recipe and the L3 manifest color word restored to the accepted
  c3d1d4e state.
- The Astra-reference round remains fully documented above and in git
  (2049fd8) as superseded history; its provenance record is marked
  SUPERSEDED_BY_OWNER_MATERIAL_20260908.
