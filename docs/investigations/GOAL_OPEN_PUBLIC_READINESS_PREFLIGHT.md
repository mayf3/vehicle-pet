# GOAL_OPEN_PUBLIC_READINESS_PREFLIGHT — Goal「开放」PUBLIC_READINESS_PREFLIGHT record

```text
GOAL_NAME = 开放
GOAL_MODE = NEW_GOAL
CURRENT_PHASE = PUBLIC_READINESS_PREFLIGHT (complete at this record's commit)
PREFLIGHT_MODE = spec-governance PREFLIGHT (this record is an Investigation; it is not Product Authority)
TERMINAL_TARGET = READY_FOR_PUBLIC_PREVIEW
```

## 0. Coordinates

```text
FRESH_READ_BASE = mayf3/vehicle-pet origin/main ece4d4d (Merge PR#39, evidence/release-2026-09-11T00-15-40-115Z)
EXPECTED_STARTING_MAIN = ece4d4d561a42f2c272a637e2b2697bb616fe9c0 (exact match; no base movement)
GOAL_WORKTREE = $HOME/workspace/project/vehicle-pet-open-20260911 (branch open/preflight-20260911, fresh from ece4d4d)
OBSERVED_AT = 2026-09-11
METHOD = git fetch + rev-parse; frontmatter census of docs/specs/*.md; targeted reads of OVERLAY_V7/ENGINE_V4/PD_V1 contract text; grep census of src/scripts/docs; visual inspection of shipping masters, both character contact sheets, and insignia SVG sources; bounded secret/.env scan; no mutation of any other checkout
```

## 1. Active authority inventory (fresh, at ece4d4d)

| Authority | Status | Kind | Implementation authority | Notes |
|---|---|---|---|---|
| `VEHICLE_PET_PRODUCT_DIRECTION_V1` | accepted | invariant | none | Generic, domain-neutral engine; "standard pets are replaced by declarative, first-party, bundled Pet Packs" (§1 Goal). No brand mandate. No two-character mandate. |
| `CONFIGURABLE_PET_ENGINE_V4` | accepted | implementation | contracts | Supersedes V3. Generic PackRegistry (bundle input → validate → immutable register). Scene-based manifest grammar. |
| `DSH_PET_OVERLAY_ADAPTER_V7` | accepted | implementation | contracts | Supersedes V6. Adds Goal「生命感」lifelike layer. Contains the load-bearing brand/grade/two-character contracts (§3 below). |
| `VEHICLE_PET_PROGRESS_SOURCE_V2` | accepted | — | — | Not inspected in depth this round; no observed conflict with Owner direction. |
| `DSH_USAGE_PROGRESS_SOURCE_V2` | accepted | implementation | contracts | Supersedes V1. Token usage economy. Owner direction preserves it unchanged. |
| `VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2` | accepted | invariant | none | Governance adoption, upstream v1.0.3. |

STALE_INDEX_OBSERVATION: `docs/specs/README.md` "Current authority inventory" still describes the V1 era (OVERLAY_V1 as accepted candidate); `.agents/local/README.md` still lists `CONFIGURABLE_PET_ENGINE_V3` / `DSH_PET_OVERLAY_ADAPTER_V2` as the architecture authorities. Both are older than V4/V7. Classified FOLLOW_UP_DEBT (doc currentness), not authority: the authoritative lifecycle state is the frontmatter of each spec file, which is correct.

## 2. Fresh verify of IMPORTED_HISTORY findings (dispatch §1.A)

| # | Imported claim | Verdict | Coordinates (all at ece4d4d) |
|---|---|---|---|
| 1 | both definitions `brand: 'Pony.ai'` | OBSERVED = YES | `src/dsh/client/characters.ts:6-7` |
| 2 | grade caption `Pony.ai · Lx` | OBSERVED = YES | `src/dsh/client/VehiclePetOverlay.tsx:895` — `<span className="vpo-gradeBrand">Pony.ai · {grade.grade}</span>` |
| 3 | total-failure fallback `Pony.ai` | OBSERVED = YES | `src/dsh/client/CharacterVisual.tsx:43` |
| 4 | active authority REQUIRES Pony.ai | OBSERVED = YES | `DSH_PET_OVERLAY_ADAPTER_V7` CTR-OVERLAY-023 (line 1219): "Both characters MUST visibly show Pony.ai"; DEC-OVERLAY-012 context (line 1199) re-states it. This is active accepted Contract semantics, not a bug. |
| 5 | `CharacterId = 'vehicle' \| 'companion'` | OBSERVED = YES | `src/dsh/client/types.ts:24` |
| 6 | character-specific TS maps | OBSERVED = YES | `characters.ts` (CHARACTER_DEFINITIONS, BEHAVIOR_PROFILES), `expressions.ts`, `speech-catalog.ts` + `character-speech.json` + `character-levels.json` (all in `src/dsh/client/`), `VehiclePetSecondaryMenu.tsx:79` fixed two-button menu, `preferences.ts:61` unknown characterId coerces to `'vehicle'` |
| 7 | fixed companion asset pipeline | OBSERVED = YES | `scripts/generate-character-assets.mjs`: fixed source `assets/character-source/companion-alpha.png` pinned 1536×1024, fixed 10-rect crop table, fixed anchors, fixed 320×540 output, fixed `insignia l1..l12` imports |
| 8 | bundledRegistry static imports + hard default | OBSERVED = YES | `src/packs/bundledRegistry.ts` (autonomous-fleet, seedling-fixture, `defaultPackId`); additionally `src/dsh/client/engine-bundles.ts` `resolveDshProductPackId()` returns the product Pack for ANY input, so the DSH surface can never present another Pack |
| 9 | Engine PackRegistry is a good generic seam | OBSERVED = SUPPORTED | `src/engine/packs/registry.ts`, `validate-pack.ts`; `seedling-fixture` proves a second declarative Pack validates and registers. REUSE, do not overturn. |
| 10 | README stale | OBSERVED = YES | `README.md` still titled "Configurable Pet Engine V1", claims "no real Token integration", and ends "independent overlay code/contract and experience audits have not yet run; the Draft PR is not ready to merge" — all false at ece4d4d |
| 11 | package.json private, no license | OBSERVED = YES | `package.json`: `"private": true`, `"version": "0.1.0"`, no `license` field |
| 12 | no root LICENSE | OBSERVED = YES | no `LICENSE*`/`NOTICE*` file anywhere outside node_modules |
| 13 | production evidence contains personal env data | OBSERVED = YES | `/Users/yanfenma/...` absolute paths and tailscale hostname (`macbook-pro.tail84dd3d.ts.net`) occur in historical evidence/investigations/test launchers/provenance (~17 files). Bounded secret scan found NO credentials: no `.env` files, no key material, no bearer tokens; hits were code identifiers (`TOKEN_SCALE`) and governance prose. Repository is already public (dispatch COMPLETED_MILESTONES), so this is exposure classification, not a containment problem. |
| 14 | L6–L12 scale expression may be baked in masters | OBSERVED = YES (stronger than imported) | Visual inspection: `master-l12.png` carries large baked text "1 人监管 / 100 万辆"; the L6–L12 evolution contact sheet (`docs/evidence/evolution-l6l12/contact-sheet-l1-l12.png`) shows the same pattern for 3/10/100/1,000/1万/10万/100万辆. Current 12 vehicle masters are all the post-artswap blue-white SUV lineage (master-l1.png inspected directly; older yellow-car art survives only in historical evidence). |
| 15 | insignia SVGs may have no visible number | OBSERVED = YES | All 12 `src/dsh/client/assets/insignia/*.svg` inspected at source: geometric symbols only; `L*n` strings occur solely inside `<title>` accessibility metadata. Do NOT mechanically strip `L` strings. |

Additional fresh observations not in the import list:

- A16. Companion master `assets/character-source/companion-alpha.png`: all 10 poses carry a baked "Pony.ai" jacket print (visual inspection). Combined with #14: **both current character lines have third-party brand text baked into the shipping masters**; renderer-level fallbacks (#2/#3) are therefore not the only surface.
- A17. Companion renderer captions "Pony.ai · Lx" on contact sheets are renderer text layers (`vpo-gradeBrand`), not baked art — fixing #2/#3 plus regenerating masters covers the whole current user-facing brand surface.
- A18. Engine manifest grammar is scene-only (`src/engine/types/manifest.ts`, `validate-pack.ts`: scenes/layers/populations). The pose-sprite recipe exists only as DSH-adapter code+assets. A third pet whose visual is not a pack scene cannot be expressed declaratively today at any layer.
- A19. `scripts/render-character-sheets.mjs`, `render-character-runtime.mjs`, `generate-pack-assets.mjs` each contain one Pony.ai occurrence (render references to the brand fields/assets, downstream of #1/#14).
- A20. Provenance JSONs mentioning Pony.ai (`src/packs/autonomous-fleet/assets/masters/PROVENANCE*.json`) are factual provenance records of the Owner-designated art route — HISTORICAL_REFERENCE, keep, classify as such in the asset policy.

## 3. Load-bearing conflict map (Owner direction × active authority)

| Owner direction (dispatch) | Active Contract | Conflict |
|---|---|---|
| Default product identity must not be Pony.ai | CTR-OVERLAY-023 "Both characters MUST visibly show Pony.ai" + baked masters (#14/A16) | DIRECT — spec + art + code |
| Third pet via config/assets/copy only, 0 core TS edits | DEC-OVERLAY-012 "Exactly two presentations of one journey"; V7 line 1601 selection "MUST NOT add … a third character"; hard-coded CharacterId/menus/preferences (#6) | DIRECT — spec + architecture |
| `VISIBLE_LEVEL_NUMBER_IS_MANDATORY = NO`, body insignia not mandatory | CTR-OVERLAY-023 "Every level MUST have a declarative clothing-attached insignia … both characters MUST show a localized descriptive grade label"; DEC-OVERLAY-012 companion section "The exact grade remains accessible and visually legible at SMALL" | DIRECT — spec + presentation policy |
| Keep token economy / progress / thresholds / existing pets | ENGINE_V4, USAGE_PROGRESS_SOURCE_V2, PROGRESS_SOURCE_V2 | NO CONFLICT — preserve |
| Generic configurable framework as product identity | PD_V1 §1 (declarative packs are already the stated direction); ENGINE_V4 registry | NO CONFLICT — REUSE |

Conclusion: the conflict is concentrated in ONE authority (`DSH_PET_OVERLAY_ADAPTER_V7`). No accepted authority forbids the Owner's new direction; V7 simply predates it and actively mandates the opposite on brand/count/grade presentation.

## 4. INFERRED (working guesses that affect routing — flagged as such)

- I1. A single whole-authority successor `DSH_PET_OVERLAY_ADAPTER_V8` can carry the three semantics changes (brand-neutral identity, N-presentation declarative character registry, decoupled grade presentation) while preserving everything else in V7 (sizes, coexistence, speech rules, lifelike layer, privacy, footer). V7's changed Decisions are bounded and identifiable (DEC-OVERLAY-012, CTR-OVERLAY-023, plus the no-third-character clause), but because accepted *meaning* is deleted/reversed, the route is SUPERSEDE (whole-authority successor with atomic backlinks), not AMEND.
- I2. ENGINE_V4 can be REUSED: the creator promise can be satisfied with an adapter-owned declarative character/presentation format layered over the existing engine Pack format (which already owns levels/scenes/assets/keepsakes), without touching engine Contracts. Contingency: if implementation proves a third pet is impossible without engine Contract change (e.g. validation rejects required presentation fields), that is a new RE_PREFLIGHT against ENGINE_V4, not a silent engine patch.
- I3. Art production (brand-neutral masters for both characters, and de-baked scale labels or their redesign into population/silhouette expression) is required and is the schedule-critical path; the sanctioned route is the Owner-designated ChatGPT sidebar browser with provenance records, as used by prior art goals.
- I4. `resolveDshProductPackId`'s any-input→product-Pack behavior and the two-button character menu are adapter Contracts (CTR-OVERLAY-006 lineage), so changing them is inside the V8 successor's scope, not a code-only change.

## 5. OWNER_DIRECTION (imported from dispatch; not re-derived)

PUBLIC_PREVIEW_IDENTITY (generic configurable pet framework, default examples brand-safe), CREATOR_PROMISE (config + textures + copy + license metadata only, CORE_SOURCE_EDITS_FOR_NEW_PET = 0), grade presentation decoupling with level data/thresholds/token economy/existing progress preserved, V1_CREATOR_ROUTE (build-time bundled packs only; no marketplace/remote code), documentation set, LICENSE_SELECTION = OWNER_DECISION_REQUIRED with STOP_AT = OWNER_LICENSE_DECISION_GATE, PRODUCTION_APPLY_ALLOWED = NO, publication actions out of scope. See dispatch §2–§13, §22.

## 6. LEGAL_DECISION_REQUIRED

1. Final code license (MIT / Apache-2.0 / other) — Owner decision; not chosen by this Goal.
2. Asset license and code/asset split licensing — Owner decision.
3. Third-party pet contribution license metadata contract — design now, decide binding default at Owner gate.
4. This Goal's public hygiene/art audit is IP_HYGIENE / RELEASE_READINESS review, NOT a legal opinion.

## 7. FOLLOW_UP_DEBT (non-blocking, classified)

- FT1. `docs/specs/README.md` index and `.agents/local/README.md` authority list are stale (§1). Mechanical currentness fix may ride along with a later docs round in this Goal.
- FT2. Historical evidence/investigations contain personal env metadata, already public. New evidence must use sanitized forms (`$HOME`, `<DSH_HOME>`, `<TAILSCALE_HOST>`). Whether to rewrite exposed history = Owner decision, default NO.
- FT3. Full package-tarball projection, source-map, bundle-size, clean-room and disposable-DSH checks belong to the implementation/verification phases, not this preflight.
- FT4. Old goal worktrees proliferate in the primary checkout's worktree list; no action in this Goal (dispatch forbids touching them).

## 8. SPEC_GOVERNANCE PREFLIGHT route

```text
SPEC_GOVERNANCE_MODE = PREFLIGHT
TARGET_REPOSITORY = mayf3/vehicle-pet
REVIEW_TARGET_HEAD = ece4d4d561a42f2c272a637e2b2697bb616fe9c0 (preflight record lands on open/preflight-20260911)
BASE_HEAD = ece4d4d561a42f2c272a637e2b2697bb616fe9c0
CURRENT_BASE_HEAD = ece4d4d561a42f2c272a637e2b2697bb616fe9c0
ROUTE_STAGE = AUTHORITY_AUTHORING
AUTHORITY_ACCEPTED_IN_BASE = YES (all six active authorities above)
GOAL_OR_TARGET = READY_FOR_PUBLIC_PREVIEW: brand-safe, third-party-creatable, documented, license-gated public preview without production apply
CURRENT_GAP = active OVERLAY_V7 mandates Pony.ai identity, exactly two presentations, and mandatory grade insignia/labels; no declarative creator path for a third pet; shipping masters carry baked third-party brand; public docs/package/license hygiene unfinished
OBSERVATIONS = §1–§3 tables (fresh at ece4d4d, method in §0)
WORKING_GUESS = I1/I2 (single V8 successor suffices; engine reused with RE_PREFLIGHT contingency)
AUTHORITY_ACTION = SUPERSEDE (DSH_PET_OVERLAY_ADAPTER_V7 -> V8); REUSE for VEHICLE_PET_PRODUCT_DIRECTION_V1, CONFIGURABLE_PET_ENGINE_V4, VEHICLE_PET_PROGRESS_SOURCE_V2, DSH_USAGE_PROGRESS_SOURCE_V2, VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2
PRIMARY_AUTHORITY = DSH_PET_OVERLAY_ADAPTER_V8 (proposed successor)
RELATED_AUTHORITIES = DSH_PET_OVERLAY_ADAPTER_V7@ece4d4d (superseded target), CONFIGURABLE_PET_ENGINE_V4@ece4d4d (reused), VEHICLE_PET_PRODUCT_DIRECTION_V1@ece4d4d (reused)
IMPLEMENTATION_AUTHORITY = contracts (V7/V8 lineage)
ATOMIC_SPEC_IMPLEMENTATION_PERMITTED = NO (SUPERSEDE is docs-first; implementation is a separate REUSE task after V8 is accepted in main-derived base)
PLAN_LEVEL = EXEC_PLAN (multi-phase: art, registry/genericity, creator kit, docs, hygiene, audits)
ASSURANCE_LEVEL = DURABLE (public-facing durable surface; no production/identity/secret operation in Goal scope)
EXECUTION_MANDATE = VALID (Goal dispatch §0–§27 with Owner pre-authorization §16)
MUTATION_AUTHORIZATION = VALID (this branch/worktree; investigation + docs-first authority work only)
ISOLATED_WRITE_SURFACE = YES (vehicle-pet-open-20260911, branch open/preflight-20260911, from ece4d4d)
CONTROLLED_RUNBOOK_REQUIRED = NO (no controlled operation inside Goal scope; production apply forbidden by dispatch §22)
SPEC_GAP_DEPENDENCY = LOAD_BEARING (brand/count/grade semantics block implementation)
EVIDENCE_REVIEWABILITY = PASS (grep coordinates, spec line numbers, and inspected assets are all in-repo at exact revision)
LIVE_AUTHORITY_GAP = DETECTED (V7 semantics vs Owner direction; closed by V8 successor, not by code)
OWNER_DECISION_REQUIRED = YES (final license selection only; pre-authorized Spec acceptance per dispatch §16 applies to everything inside Goal bounds)
EMERGENCY_STATE = NONE
EMERGENCY_ACTION = NONE
INCIDENT_REFERENCE = NOT_APPLICABLE
BASE_IMPACT = NONE
IMPLEMENTATION_ALLOWED = NO (until DSH_PET_OVERLAY_ADAPTER_V8 accepted and reachable from main-derived base)
MERGE_READY = NO (this record only; V8 candidate next)
OPERATION_ALLOWED = NOT_APPLICABLE
EVIDENCE_NEEDED = V8 independent Spec review ACCEPT at exact proposed Head with zero blockers; then per-phase deterministic verification and the four independent audits listed in dispatch §19
DONE_WHEN = dispatch §23 DONE_WHEN block
EXPANSION_TRIGGER = any engine Contract change requirement; any production/publication action; any Owner gate item in dispatch §24/§27 OWNER_GATE_REASONS
NEXT_REAL_ACTION = AUTHOR mode: draft DSH_PET_OVERLAY_ADAPTER_V8 whole-authority successor candidate (docs-first), then independent REVIEW, then pre-authorized acceptance + merge, then implementation as a fresh REUSE task
NEXT_ACTION = CONTINUE (AUTHOR)
```

Route-table cross-check: SUPERSEDE × any → docs-first whole-authority successor, no same-stage implementation. AUTHORITY_AUTHORING stage permits this record plus the V8 candidate on this branch; implementation and operation remain forbidden until V8 is accepted in the relevant base.
