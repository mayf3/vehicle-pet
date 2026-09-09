---
spec_id: DSH_PET_OVERLAY_ADAPTER_V5
status: accepted
spec_kind: implementation
authority_level: governing_spec
implementation_authority: contracts
scope:
  - dsh-bundle-plugin
  - shell-overlay
  - resident-pet-surface
  - session-visual-reactions
  - pet-speech-presentation
governed_by:
  - VEHICLE_PET_PRODUCT_DIRECTION_V1
  - CONFIGURABLE_PET_ENGINE_V4
  - VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2
external_authorities:
  - repository: mayf3/deepseek-harness
    authority_id: DEEPSEEK_HARNESS_PINNED_INTEROP_V1
    revision: f77b5a2fcebc2d9138f6608a60636f2294868d42
    relation: interoperates_with
supersedes:
  - DSH_PET_OVERLAY_ADAPTER_V4
superseded_by: null
owners:
  - mayf3
---

# DSH_PET_OVERLAY_ADAPTER_V5

## 1. Goal

This V5 wholly supersedes `DSH_PET_OVERLAY_ADAPTER_V4`. It retains its two mutually exclusive branded characters, twelve operational grades, ten expressions, shared Engine/growth/prefs, structured reactions, no-model boundary and full disposal. The Owner's five-point refinement changes only resident transparency, always-static motion, double-click settings, continuous randomized catalog speech and a read-only active-session footer. Current normative values and replacement contracts below apply; retained historical observations are not V5 execution evidence.

```text
GOAL = MORE_PET / LESS_UI: the resident pet behaves like a long-term companion, not a plugin button.
SUCCESS_OUTCOME = SMALL and LARGE resident modes with pet-click reactions, no resident progress bar, no daily panel, >=10 expression variants, and a restrained original speech bubble system, verified in an isolated fixed-ref DSH acceptance.
DELIVERY_FORM = DSH_BUNDLE_PLUGIN (unchanged)
OWNING_REPOSITORY = mayf3/vehicle-pet (unchanged)
RUNTIME = Harness Web profile (unchanged)
SURFACE = shell.overlay (unchanged)
BOUNDARY = READY_FOR_PRODUCTION_APPLY; production profile application is a separate Owner gate outside this Spec's rounds.
```

This proposal is docs-only. It creates no plugin files and grants no authority
until an independent reviewer audits the exact proposed Head and `mayf3`
accepts it.

## 2. Scope and non-goals

### In scope

- the resident two-size presentation (SMALL / LARGE) with persisted size
  preference and a bounded scale relation between the modes; the V2 fixed
  112 px size, the `PANEL_OPEN` state, the 264 px compact panel, the
  resident micro progress sliver, and the V2 "bottom-right at 112 px"
  first-launch anchor are each replaced by the declared V3 equivalents
  (§8 sizing/placement, §8.1 state machine, §8.2 secondary affordance,
  CTR-OVERLAY-016);
- removal of the resident within-level micro progress presentation;
- removal of the compact panel and of `PANEL_OPEN` from the persisted
  interaction machine; pet-first click reactions instead;
- one secondary settings affordance (small, low-distraction, non-modal)
  owning Character, size, Reduced Motion, Full Journey entry, and collapse;
- a static-plus-small-motion expression layer with at least 10 visible
  variants over the existing level visuals, produced by the repository
  deterministic asset pipeline;
- a text speech bubble: presentation, positioning, lifecycle, content
  boundary, catalog floor, and cadence;
- continued install/update/restart/HMR/uninstall lifecycle, preferences,
  drag/keyboard movement, onboarding hiding, and disposal contracts carried
  from V2;
- continued standalone prototype use for development, showcase, and E2E.

### Out of scope

- changes to `mayf3/deepseek-harness`, DSH Core, apps/web, shipped bundles, or
  user profiles; production profile mutation of any kind;
- an iframe, external Vite app, second React root, second React runtime, or a
  separately running frontend;
- any change to Engine progression, `ProgressSnapshotV1`, usage source seams,
  token economy, keepsakes, Upgrade Receipts, Pack manifests, or Pack trust;
- speech audio, text-to-speech, speech input, Live2D or any runtime model
  animation, multi-pet, shops, currencies, mini-games;
- re-deriving the existing vehicle Art V2 identity or regenerating its L1–L12 art; original companion art is in scope;
- copying the deepseek-pet / whale character, art, Live2D model, animation
  data, copy strings, brand, or precise likeness (interaction principles
  only, per V2 §3 and the Goal census boundary);
- reading prompt bodies, completion bodies, user message content, reasoning
  text, credentials, or clipboard for any purpose including speech selection.

## 3. Authority and dependencies

```text
PRIMARY_PARENT_AUTHORITY = VEHICLE_PET_PRODUCT_DIRECTION_V1
ENGINE_PARENT_AUTHORITY = CONFIGURABLE_PET_ENGINE_V4
PROGRESS_SOURCE_PARENT = VEHICLE_PET_PROGRESS_SOURCE_V2
USAGE_SOURCE_PARENT = DSH_USAGE_PROGRESS_SOURCE_V2
GOVERNANCE_PARENT = VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2
IMPLEMENTATION_AUTHORITY = contracts
EXTERNAL_AUTHORITIES = mayf3/deepseek-harness@f77b5a2fcebc2d9138f6608a60636f2294868d42 interoperates_with (carried forward unchanged from V2)
AUTHORITY_CONFLICT = NONE
```

`VEHICLE_PET_PRODUCT_DIRECTION_V1` remains product authority. The experience
baseline of `CTR-DIR-007` (including within-level progress state, the daily
greeting, short Host-activity feedback, and click feedback) remains fully
satisfied: V3 changes where and how the resident surface presents these, not
whether the pet provides them — within-level progress stays available through
the retained Full Journey surface, and the daily greeting plus completion
feedback are delivered through the speech bubble presentation defined here.
`CONFIGURABLE_PET_ENGINE_V4` remains the only authority for progression,
Packs, keepsakes, receipts, journal, and ceremony; this Spec reinterprets no
Engine Contract. `VEHICLE_PET_PROGRESS_SOURCE_V2` and
`DSH_USAGE_PROGRESS_SOURCE_V2` own the counts-only usage seam; V3 changes no
 seam behavior and removes only a resident presentation of its derived view
model.

The frontmatter ID `DEEPSEEK_HARNESS_PINNED_INTEROP_V1` keeps its V2 meaning:
a stable coordinate handle for the source-level interoperability dependency at
the exact Harness revision; it does not claim that the upstream repository
publishes a Spec or authority with that name. The whale reference inputs for
this round are recorded, with OBSERVED/INFERRED separation, in
`docs/investigations/GOAL_LINGDONG_PREFLIGHT.md`; the whale repositories and
the installed deepseek-pet plugin remain evidence only and are not external
authorities. Their character, art, Live2D model, code, copy, motion data,
brand, and precise likeness MUST NOT be copied.

## 4. Current State

### STATE-OVERLAY-101 — The V2 adapter is implemented, accepted, and running in production

- Subject: `mayf3/vehicle-pet` DSH adapter and the production web profile.
- As of commit: `cce0e9d24907e7c17e42fd2b310a68a98860d5cf`.
- Environment: production DSH web profile (`~/.dsh/profiles/web`) with
  `@mayf3/vehicle-pet` pinned at that commit, observed through a separate
  controlled browser at `http://127.0.0.1:3080`.
- Observed at: `2026-09-08` (Goal 灵动 census).
- Projection: the V2 contract set is live — 112 px resident pet, click
  toggles the 264 px compact panel, resident micro progress sliver rendered,
  five-state static expression layer, deepseek-pet coexisting on the same
  overlay corner.
- Basis: `OBS-OVERLAY-101`, `OBS-OVERLAY-102`.

### STATE-OVERLAY-102 — The Owner gap is quantified against the installed whale reference

- Subject: visual presence and interaction of the resident Vehicle Pet versus
  the installed deepseek-pet.
- Environment: same census runtime, viewport 1280x720 (dpr 1).
- Observed at: `2026-09-08`.
- Projection: Vehicle Pet visible sprite ≈ 54x37 px inside a 112 px button
  versus whale character 228x244 px (≈ 1:10 visible-area ratio); the daily
  click opens an information panel; a detached 75x4 px progress sliver floats
  under the car; five static expressions exist with no speech.
- Basis: `OBS-OVERLAY-102`, `OBS-OVERLAY-103`.

## 5. Observations

### OBS-OVERLAY-101 — Production runs the V2 contract set at the dispatch commit

- Subject: production web profile bundle list and plugin pin.
- Source: `~/.dsh/profiles/web/package.json` and live UI at
  `http://127.0.0.1:3080`.
- Observed at: `2026-09-08`.
- Method: read-only profile manifest inspection and controlled-browser page
  load; `data-vehicle-pet` root attributes and `.vpo-progress` DOM measured.
- Result: `deepseek-pet` and `@mayf3/vehicle-pet#cce0e9d` are both installed
  bundle rows; the resident pet renders 112x112 at a 16 px right viewport
  margin with a 75x4 px within-level sliver and `VISIBLE` state; a normal
  click path to `PANEL_OPEN` exists in the implemented surface
  (`VehiclePetOverlay.tsx` click handler) and is reported by the Owner as the
  daily behavior.
- Provenance: `docs/investigations/GOAL_LINGDONG_PREFLIGHT.md` §2.

### OBS-OVERLAY-102 — Whale reference size, size-adjustment, and settings principles

- Subject: installed deepseek-pet presentation and interaction geometry.
- Environment: production DSH, separate controlled browser, 1280x720.
- Observed at: `2026-09-08`.
- Method: read-only DOM measurement, triggered interactions (tap, minimize,
  double-click restore), and bundle-string/CSS inspection of the installed
  plugin.
- Result: character 228x244 px on a 260x244 stage inside a 306 px root;
  **no two-size modes** — size is one continuous wheel-driven scale persisted
  to browser-local storage; quick actions are hover/focus-revealed and contain
  only minimize (60x28 px); real settings live in a host settings-page
  section; minimize collapses to a 58x68 px docked strip restored by
  double-click.
- Provenance: census §1 W1–W3, W6.

### OBS-OVERLAY-103 — Whale speech and click reaction principles

- Subject: installed deepseek-pet speech bubble and tap behavior.
- Environment: as above.
- Observed at: `2026-09-08`.
- Method: triggered taps and greeting observation; bundle inspection of the
  show/clear timers and line pools.
- Result: one `role="status"` bubble above the character, two-line structure
  (main + small secondary), auto-cleared on a 3.6 s timer, single bubble at a
  time; character tap picks a random line from the current state's pool with
  drag-suppression; while working, a periodic rotation re-shows state lines on
  a multi-second cadence; the plugin additionally regex-matches message and
  reasoning text (content awareness) which this repository forbids.
- Provenance: census §1 W4, W5, W8, W10.

### OBS-OVERLAY-104 — Coexistence geometry

- Subject: overlap relations among the whale, the Vehicle Pet, and the
  composer at the census viewport.
- Observed at: `2026-09-08`.
- Method: DOM rectangles and screenshots in the controlled browser.
- Result: the whale root (956..1262 x 334..706) covers the Vehicle Pet button
  region (1152..1264 x 416..528); pointer events in the overlap go to the
  whale; the whale tolerates partial overlap with the composer's right edge by
  design.
- Provenance: census §1 W11, §2.

## 6. Claims and evidence relations

### CLM-OVERLAY-101 — The liveness gap is closable without copying the whale

- Support state: SUPPORTED.
- Supported by evidence: `EVD-OVERLAY-101`, `EVD-OVERLAY-102`.
- Contradicted by evidence: none known.
- Uncertainty: concrete LARGE px and sprite-bbox hitboxes must be proven by
  the implementation gates against the real V2 sprite transparent bboxes.

### CLM-OVERLAY-102 — Structured-state speech can clear the catalog and cadence floors

- Support state: SUPPORTED.
- Supported by evidence: `EVD-OVERLAY-102` (cadence mechanisms exist and are
  measurable), plus the existing edge-deduplicated session adapter and
  deterministic expression pipeline.
- Contradicted by evidence: none known.
- Uncertainty: annoyance risk is a semantic judgment resolved by the
  independent experience audit against the `CTR-OVERLAY-019` cadence bounds.

### EVD-OVERLAY-101 — Quantified gap and whale magnitude band support the two-size liveness claim

- Source observations: `OBS-OVERLAY-101`, `OBS-OVERLAY-102`, `OBS-OVERLAY-104`.
- Target: `CLM-OVERLAY-101`.
- Relation: SUPPORTS.
- Bound coordinates: production web profile at `cce0e9d24907e7c17e42fd2b310a68a98860d5cf`, census viewport 1280x720, observed 2026-09-08.
- Strength/sufficiency: direct DOM measurements and triggered interactions.
- Limitations: single viewport; other sizes covered by clamping contracts and
  implementation evidence.
- Provenance: census §1–§2.

### EVD-OVERLAY-102 — Observed bubble lifecycle and cadence mechanics are bounded and testable

- Source observations: `OBS-OVERLAY-103`.
- Target: `CLM-OVERLAY-102`.
- Relation: SUPPORTS.
- Bound coordinates: as above.
- Strength/sufficiency: show/clear timers, single-bubble layout, and line
  pools directly inspected; our own bounds are stricter and content-blind.
- Limitations: whale content-awareness explicitly not ported.
- Provenance: census §1 W4–W5, W8, W10.

## 7. Decisions

### DEC-OVERLAY-001 — Deliver as one external DSH bundle plugin

Carried forward unchanged from V2: `DSH_BUNDLE_PLUGIN` in
`mayf3/vehicle-pet`; no DSH Core change. Rejected alternatives unchanged.

### DEC-OVERLAY-002 — Two-size pet-first resident surface; panel removed from the daily loop

- Decision owner: `mayf3` (Goal 灵动 frozen direction).
- Decision: the persisted interaction machine is exactly `VISIBLE` and
  `COLLAPSED`, defaulting to `VISIBLE`, with no full hide. `PANEL_OPEN` is
  deleted. The resident surface has two sizes, `SMALL` and `LARGE`, selected
  by a persisted browser-local preference; absence of an explicit choice
  resolves to `LARGE`. A normal left click / keyboard activation on the
  visible pet is a **pet reaction** (static expression variant change,
  and a throttled occasional spoken line), never a settings or information
  surface.
- Rejected alternatives: keeping `PANEL_OPEN` behind a modifier, reskinning
  the 264 px panel as a differently-sized panel, making the pet click open
  the journey dialog.
- Reason: the Owner rejects the daily engineering-panel interaction; a
  desktop pet's click should feel like the pet, and the whale reference
  confirms a panel-free daily loop is viable on this host.
- Owner decision remaining: NONE.

### DEC-OVERLAY-003 — Reuse Engine, React product surface, and both bundled Packs

Carried forward unchanged from V2, including the DSH user-surface Pack
boundary (`autonomous-fleet` only; `seedling-fixture` stays bundled and
internal to conformance).

### DEC-OVERLAY-004 — Session reactions are structured and visual-only

Carried forward unchanged from V2 in meaning; the transient presentation
columns of the §8.3 mapping are restyled to the V3 expression variants and
speech bubble while the mapping inputs, precedence, and edge deduplication
are unchanged.

### DEC-OVERLAY-005 — Browser-local overlay preferences, including size

- Decision owner: `mayf3` (Goal 灵动 frozen direction).
- Decision: the one versioned tolerant browser-local preference record
  continues to own normalized position, collapsed state, and the inert legacy
  Reduced Motion field, and additionally owns the `SMALL`/`LARGE` size
  choice and a bundled character ID. Missing or unknown character IDs resolve to vehicle. The preference evolves compatibly: a record without an explicit
  size choice — including every pre-V3 record — resolves to `LARGE`. The
  choice survives reload, new sessions, and DSH restarts because it is
  browser-local and versioned. Active Pack remains Engine `activePackId`.
- Rejected alternatives: server/profile mutation, a second preference
  store, defaulting to `SMALL`.
- Reason: Owner feedback is that the current single size is too small; the
  default must move presence up without forcing a settings visit.
- Owner decision remaining: NONE.

### DEC-OVERLAY-006 — One product Pack on the DSH user surface

Carried forward unchanged from V2.

### DEC-OVERLAY-007 — Static multi-expression session presentation, extended

- Decision owner: `mayf3` (Goal 灵动 frozen direction).
- Decision: the static per-state expression layer is extended from five
  masters to **at least ten visible variants** while keeping the five
  structured session states as the mandatory mapping core. The variant set
  MUST cover daily, happy, curious, resting, working, waiting-for-user,
  completed, and soft-failure semantics. Vehicle variants are reusable overlay recipes over the current `LEVEL_BASE_VISUAL`; companion variants are original full-body pose sprites with declarative on-body grade marks. Only the selected character is rendered. Vehicle Art V2 is preserved. Selection among same-state variants (for example idle calm /
  happy / curious / sleepy) is deterministic-enough: a pure, unit-testable
  selection over structured context (state, engine events, bounded idle
  bucket, click count, recent-variant history) with no immediate repetition.
  Asset rules are unchanged: bundled, transparent, WebP primary with PNG
  fallback, deterministic pipeline, recorded provenance and exact bytes.
- Rejected alternatives: regenerating per-level full sprite matrices, CSS
  filter-only reactions, runtime or build-time model calls, replacing the
  Art V2 base.
- Reason: reaches companion-grade expressiveness within the existing
  pipeline and the Art boundary.
- Owner decision remaining: NONE.

### DEC-OVERLAY-008 — Double-click secondary settings

- Decision owner: mayf3, five-point feedback of 2026-09-09.
- Decision: the resident pet opens its non-modal settings on double-click, with Shift+Enter or ContextMenu as the equivalent keyboard path. Single click remains an expression reaction; dragging never opens settings. Remove the ellipsis trigger and the Reduced Motion setting. Settings contain exactly Character, Size, Full Journey and Collapse. Outside press and Escape close it.
- Reason: Owner prefers the whale's direct gesture and permanently static presentation.
- Owner decision remaining: NONE.

### DEC-OVERLAY-009 — Original, structured-state speech bubble

- Decision owner: `mayf3` (Goal 灵动 frozen direction).
- Decision: one text speech bubble system, UI-only. Lines come from a
  curated original catalog of for each of the two characters, at least 30 lines per supported locale
  (`zh-CN`, `en`), distributed across idle, working, needs-input,
  completed, failed/cancelled, and level-up/milestone. Triggers are only:
  structured session state edges, Engine progress/level/keepsake events,
  direct user interaction, and a bounded recurring timer. The bubble never
  speaks prompt, completion, message, or reasoning content, never calls a
  model, and never consumes tokens. Presentation: non-modal, single
  instance, auto-dismiss within a fixed bounded window, positioned above or
  beside the pet within viewport bounds, never occluding the composer, the
  send control, or the deepseek-pet surface, never taking focus, and
  rendered in both sizes. Catalog copy is original; whale strings are
  forbidden; copy tone is short, companionable, non-report-like (no status
  codes, percentages, or token counts).
- Rejected alternatives: audio/TTS, model-generated lines, content-derived
  reactions, permanent tooltip labels.
- Reason: speech is the largest single liveness win and stays inside the
  repository's structured-data and no-model boundaries.
- Owner decision remaining: NONE.

### DEC-OVERLAY-010 — Growth visibility moves off the resident sliver, systems unchanged

- Decision owner: `mayf3` (Goal 灵动 frozen direction).
- Decision: the resident within-level micro progress presentation is removed
  from both sizes. `progressPoints`, derived level, the usage ledger, token
  economy, level-up, keepsakes, and the Full Journey dialog are unchanged and
  remain reachable; the Full Journey entry lives in the secondary
  affordance (`DEC-OVERLAY-008`).
- Rejected alternatives: keeping the sliver in LARGE only, moving the sliver
  into the bubble as percentages, gating the journey behind the host
  settings page.
- Reason: growth should be an underlying mechanism, not a permanently mounted
  gauge; the census shows the detached sliver reads as UI debris at small
  sizes.
- Owner decision remaining: NONE.

## 8. Frozen product and adapter model

```text
DELIVERY_FORM = DSH_BUNDLE_PLUGIN
REPOSITORY = mayf3/vehicle-pet
DEEPSEEK_HARNESS_CORE_CHANGE = NO
SURFACE = shell.overlay
RUNTIME = Harness Web profile
IFRAME = NO
EXTERNAL_VITE_RUNTIME = NO
SECOND_REACT_OR_REACTDOM = NO
INTERACTION_STATES = VISIBLE, COLLAPSED
DEFAULT_STATE = VISIBLE
PANEL_OPEN = REMOVED
FULL_HIDE = NO
SIZE_MODES = SMALL, LARGE
DEFAULT_SIZE_WHEN_NO_EXPLICIT_CHOICE = LARGE
SMALL_SURFACE_HEIGHT_PX = 112 (unchanged nominal; minor sprite-bbox-fit adjustment within 104..120 permitted)
LARGE_SURFACE_HEIGHT_PX = 216 nominal (band 1.6x..2.2x SMALL; implementation MAY record 190..240 final from the measured sprite bbox)
RESIDENT_PROGRESS_BAR = ABSENT (both sizes)
COLLAPSED_LAUNCHER_SIZE_PX = 36
SECONDARY_AFFORDANCE = double-click or Shift+Enter/ContextMenu, non-modal, exactly 4 items, fixed narrow width <=224px, no progression content
SIZE_PERSISTENCE = browser-local versioned preference; absent choice resolves LARGE
DRAG = YES
KEYBOARD_MOVE = YES
POSITION_PERSISTENCE = viewport-relative browser local preference
COLLAPSED_PERSISTENCE = browser local preference
REDUCED_MOTION_PERSISTENCE = browser local preference (semantics unchanged)
ACTIVE_PACK_PERSISTENCE = existing Engine activePackId
EXPRESSION_STATE_CORE = IDLE, WORKING, NEEDS_INPUT, COMPLETED, FAILED_OR_CANCELLED (unchanged mapping duty)
EXPRESSION_VARIANT_COUNT_MIN = 10 (statically distinguishable, level identity preserved)
EXPRESSION_ARCHITECTURE = vehicle preserved level base + expression recipes; companion pose sprite + declarative grade insignia; no motion for either
EXPRESSION_ASSETS = BUNDLED_WEBP_PRIMARY_PNG_FALLBACK_DETERMINISTIC
SPEECH_BUBBLE = YES (text only)
SPEECH_CATALOG_MIN_LINES_PER_LOCALE = 30 across >=6 categories
SPEECH_AUTO_DISMISS_S = 4 (bounded 3..6)
SPEECH_MAX_CONCURRENT = 1
SPEECH_FOCUS_STEAL = NO
SPEECH_COMPOSER_OCCLUSION = NO
SPEECH_WHALE_OCCLUSION = NO
SPEECH_CONTENT_SOURCES = SESSION_STATE, PROGRESS_EVENT, LEVEL_EVENT, USER_INTERACTION, BOUNDED_IDLE_TIMER
SPEECH_RECURRING_INTERVAL_S = randomized 20..40, first sampled at mount, ongoing in idle/working/needs-input; no per-period cap
SPEECH_LOAD_QUIET_S = 15
SPEECH_TYPING_SUPPRESSION_S = 5 (payload-ignored input recency)
SPEECH_WORKING_ROTATION_S = same recurring schedule, unlimited periods; 5-second input-recency suppression
SPEECH_CLICK_LINE_THROTTLE_S = 30
SPEECH_REPEAT_GUARD = no identical line twice in a row within a category; per-category recent-history exclusion
CLICK_REACTION = static expression + throttled line; double-click opens settings
ONBOARDING_VISIBILITY = hidden
SESSION_EFFECT = visual reaction only
REAL_TOKEN_INTEGRATION = NO
TOKEN_TO_PROGRESS = NO
MODEL_CALLS = NO
REMOTE_PACK = NO
AUDIO = NO
TTS = NO
MULTI_PET = NO
DSH_USER_SELECTABLE_PRODUCT_PACKS = autonomous-fleet
SEEDLING_FIXTURE_DSH_USER_VISIBLE = NO
SEEDLING_FIXTURE_BUNDLED_FOR_CONFORMANCE = YES
ART_V2_LEVEL_BASE = PRESERVED (no L1-L12 regeneration)
```

### 8.1 State transitions

- `VISIBLE`: render the current pet at the preferred size, always-static presentation,
  static expression variant, speech bubble when active, daily greeting and
  short Host-activity feedback through the bubble presentation, and the
  secondary affordance on double-click or Shift+Enter/ContextMenu. It MUST NOT render an information
  panel, a progress gauge, or a monitoring dashboard. A bounded active-session title footer is required by CTR-025. A normal click is a pet
  reaction (`DEC-OVERLAY-002`); it never opens any surface.
- `COLLAPSED`: render only the 36 px keyboard-accessible launcher; not full
  hide; activation restores `VISIBLE`.
- Escape closes the secondary affordance or the journey dialog; it never
  removes the pet.
- Dragging moves the overlay without triggering the click reaction. Keyboard
  arrow movement stays available on the focused pet/launcher with the V2
  step semantics.

### 8.2 Secondary affordance and full-journey boundaries

The secondary affordance contains exactly:

1. Character: vehicle / companion choice;
2. Size: SMALL / LARGE choice;
3. “View full journey” action;
4. Collapse action.

No fifth item is permitted; Escape and outside press close the affordance. The affordance MUST NOT contain progression
numbers, within-level progress, next thresholds, stage or level names, Pack
names, keepsakes, or any engineering/system readout — those remain in the
Full Journey dialog, which keeps its V2 accessible in-Harness Overlay/Dialog
form and reuses the existing React product surface.

### 8.3 Structured session mapping

Inputs, precedence (`NEEDS_INPUT` over `RUNNING` over an active short terminal
reaction over `IDLE`), and edge deduplication are unchanged from V2. The
presentation column is restyled:

| Adapter state | Structured meaning | V3 presentation |
|---|---|---|
| `DSH_RUNNING` | current selected session running | working variant (static layer + no motion); on start edge, at most one working line; while running, rotation per `CTR-OVERLAY-019` bounds |
| `DSH_NEEDS_INPUT` | structured pending interaction | needs-input variant (static layer + no motion); one needs-input line per pending edge |
| `DSH_TURN_COMPLETED` | terminal success edge | one short completed reaction: completed variant (proud after a level/milestone event, happy otherwise) + one completed line + the existing `HostActivityEventV1` dispatch |
| `DSH_TURN_FAILED` | terminal failure edge | one short failed reaction: soft-failed variant + one failed line + existing dispatch |
| `DSH_TURN_CANCELLED` | terminal cancellation edge | one short cancelled reaction: relaxed-cancelled variant + one failed/cancelled-category line + existing dispatch |
| `DSH_IDLE` | none of the above | idle variant pool (calm default; happy/curious/sleepy by bounded context) with restrained ambient lines per `CTR-OVERLAY-019` |

No mapping mutates `progressPoints`, derived level, keepsakes, Upgrade
Receipts, presentation journal identity, or Pack content. Terminal identity
edge deduplication is unchanged.

### 8.4 Authorized next-round file and package surface

The implementation round is authorized to modify at least:

```text
src/dsh/client/VehiclePetOverlay.tsx        (state machine, click reaction, sizes)
src/dsh/client/VehiclePetPanel.tsx          (DELETE: panel removal)
src/dsh/client/VehiclePetSecondaryMenu.tsx  (NEW: secondary affordance)
src/dsh/client/VehiclePetSpeech.tsx         (NEW: bubble presentation + scheduler)
src/dsh/client/speech-catalog.ts            (NEW: curated lines, zh-CN + en)
src/dsh/client/speech-rules.ts              (NEW: pure cadence/selection rules)
src/dsh/client/expressions.ts               (variant set + selection)
src/dsh/client/ExpressionLayer.tsx
src/dsh/client/expression-assets.generated.ts (regenerated by the asset pipeline)
src/dsh/client/preferences.ts               (size choice + compatible migration)
src/dsh/client/styles.ts
scripts/generate-expression-assets.mjs      (variant recipes)
tests/**                                    (unit + E2E contracts)
```

The panel deletion and these additions are the authorized surface; incidental
touching of `src/dsh/index.ts`, locales, and build configuration remains
within scope when required. Only `src/dsh/**` may import DSH contracts;
`src/engine/**`, `src/react/**`, and `src/packs/**` MUST remain
DSH-independent.

### 8.5 React compatibility

Carried forward unchanged from V2 §8.5: host-provided React identity only, no
second React/ReactDOM runtime, no `createRoot` in the adapter, bundle gate
proves absence of bundled React runtime.

## 9. Contracts

### CTR-OVERLAY-001 — External bundle plugin, never Core patch

Unchanged from V2: one DSH bundle/client plugin with `dsh.bundle`,
`dsh.client`, `./client`, and exported `./cordis.patch.yml`; no modification,
vendored patch, or uncommitted change to `mayf3/deepseek-harness`; no
build that depends on editing apps/web, DSH bundle rows, or a user profile.

### CTR-OVERLAY-002 — Exactly one additive `shell.overlay` entry

Unchanged from V2: stable id `vehicle-pet`, disposal with its Cordis fiber,
at most one DOM entry across load, navigation, reconnect, reload, HMR,
update, and reinstall; no `root` registration, no shipped-id replacement, no
second React root, no duplicates.

### CTR-OVERLAY-003 — Placement, movement, clamping, and honest hitboxes at both sizes

First valid launch MUST place the visible pet, at the effective preferred
size, within a safe viewport margin such that the complete active surface:
does not overlap the composer or send control; does not overlap the
default bottom-right footprint of a co-installed deepseek-pet overlay; and
lies fully inside the viewport. The LARGE default placement MUST reserve
bottom space sufficient to clear that coexistence footprint (a fixed
constant derived from the recorded census geometry; no DOM reading of any
other plugin is permitted). Pointer drag and keyboard movement clamp the
complete active surface into the viewport and persist normalized x/y ratios,
not absolute pixels; refresh and resize restore/clamp the relative position.
A drag MUST NOT trigger the click reaction. At both sizes, pointer/focus
targets MUST follow the sprite's visible bounding box: the transparent
margin of the square sprite canvas MUST NOT create pointer or focus area
beyond a small recorded tolerance around the visible art. Off-screen loss,
absolute-only persistence, or a LARGE transparent hitbox approximating the
bounding square fails.

### CTR-OVERLAY-004 — Two recoverable states; the pet click is a pet reaction

The persisted interaction state machine MUST implement exactly `VISIBLE` and
`COLLAPSED`, defaulting to `VISIBLE`, with no full-hide state and no
`PANEL_OPEN` state. `PANEL_OPEN` MUST NOT exist in the persisted machine, in
the DOM as a daily surface, or as any reskinned equivalent panel opened by a
normal pet click. Collapse always leaves the 36 px launcher; launcher
activation restores `VISIBLE`. Except while structured onboarding suppression
required by `CTR-OVERLAY-011` is active, any path that leaves no visible
recovery affordance violates this Contract; suppression and restore
semantics (exact same-mount restoration, persisted `COLLAPSED` across
reload) are unchanged from V2. Escape closes the secondary affordance or the
journey dialog, never the pet.

### CTR-OVERLAY-005 — Double-click settings and full journey

Settings MUST open on a double-click of the visible pet or Shift+Enter/ContextMenu while it is focused. Single click MUST remain a pet reaction, not open settings; drag release and its following synthetic click/double-click MUST not open settings. There MUST be no ellipsis/toolbar trigger. The pet's accessible description MUST explain double-click and the keyboard equivalent. The menu MUST remain non-modal, at most 224px wide, and contain exactly Character, Size, Full Journey and Collapse, with no motion control. Outside press and Escape close it; Escape restores pet focus without changing position/progression. Full Journey retains its accessible in-Harness dialog, with no external page or iframe.

### CTR-OVERLAY-006 — One Engine and the two existing Packs

Unchanged from V2: one active Engine authority instance, React layer, and the
bundled `autonomous-fleet` and `seedling-fixture` Packs; Pack switching via
Engine `activePackId` preserving `progressPoints`, identity, receipts,
keepsakes, and journal; the DSH surface offers only the product Pack; legacy
non-product stored Pack state resolves without data loss; the standalone
prototype keeps both Packs; no forked Engine, Pack copy, or second ledger.

### CTR-OVERLAY-007 — Session mapping is transient and visual-only

The adapter MUST implement the complete §8.3 mapping with V2's inputs,
precedence, and terminal edge deduplication. Running and needs-input remain
live visual states; completed, failed, and cancelled create one short,
edge-deduplicated reaction composed of the static expression variant, the
existing `HostActivityEventV1` dispatch, and at most one speech line.
Reload, resubscription, list refresh, or HMR MUST NOT replay a terminal
reaction. No mapped event may mutate growth, derived level, keepsakes,
receipts, Pack, or presentation journal; a turn/tool/task is never growth.

### CTR-OVERLAY-008 — No iframe, Vite runtime, scrape, network path, or content reading

Unchanged from V2 (no iframe, no separately served Vite app, no
`localhost:5199`, no network request for any pet path, bundled asset loads
only, structured injected DSH contracts only), and strengthened for V3: the
adapter MUST NOT read prompt bodies, completion bodies, message or reasoning
text, credentials, or clipboard content; MUST NOT regex-match, tokenize, or
hash any host conversation text for speech selection, expression selection,
or any other purpose; and MUST NOT read another plugin's DOM (including the
deepseek-pet surface) for geometry, state, or presence. Only host-projected title/displayTitle and running/pending metadata may additionally be read for the bounded footer in CTR-025. Titles MUST NOT enter speech selection, persistence, logs or analytics. Global input-activity
recency for `CTR-OVERLAY-019` MUST ignore event payload and target identity.

### CTR-OVERLAY-009 — Host React identity only

Unchanged from V2: pinned Harness Web React major, host-provided identity, no
second React/ReactDOM runtime, no `createRoot` in the adapter, bundle and
packed-artifact gates.

### CTR-OVERLAY-010 — Tolerant, multi-tab-consistent preferences including size

One versioned browser-local preference record MUST own normalized position,
`collapsed`, the inert legacy Reduced Motion field, and the `SMALL`/`LARGE` size
choice and the character ID (`vehicle` or `companion`). Missing or unknown character IDs resolve to `vehicle`, independently of other valid fields. Missing, malformed, wrong-version, out-of-range, quota-failed, or
unavailable storage MUST fall back safely without blocking the pet. A record
lacking an explicit size choice MUST resolve to `LARGE` (this migrates every
pre-V3 record without rewriting it). Relevant same-origin `storage` events
MUST update another tab without write loops; newer local input remains
coherent. Active Pack MUST NOT be duplicated into this record. Every storage
listener MUST dispose on plugin stop. An explicit size choice MUST survive
reload, new sessions, and DSH restarts.

### CTR-OVERLAY-011 — Hidden during structured onboarding, visible on common pages

Unchanged from V2: no active surface, pointer, or focus space while the
pinned structured session-list condition identifies onboarding; reappearance
with exact same-mount state restoration; availability on ordinary
conversation, settings, and workspace pages; DOM/class/text detection of
onboarding fails.

### CTR-OVERLAY-012 — Restart lifecycle, complete disposal, and idempotence

Unchanged from V2, extended to the new surfaces: the documented local path
`dsh plugin --profile web add <local>`; stop, HMR replacement, update, and
uninstall MUST dispose all overlay DOM, dialog portal DOM, secondary
affordance DOM, speech bubble DOM and its timers, styles, storage/media/
resize/keyboard/pointer listeners, input-recency listeners, idle timers,
observers, session subscriptions, slot registrations, and event
subscriptions. Reinstall or repeated activation MUST never double-register
id `vehicle-pet`.

### CTR-OVERLAY-013 — Token/progress adapter remains deferred

Unchanged from V2: no real token usage reads, no token/turn/tool/task to
`progressPoints` conversion, no model calls, no invented DSH Progress Source,
no remote progress API; display of the Engine's existing current snapshot
only.

### CTR-OVERLAY-014 — At least ten statically distinct expression variants over preserved level identity

The resident surface MUST present at least ten expression variants that are
visibly different in still screenshots at the SMALL size for the bundled
level visuals, including when all motion is suppressed. The five structured
session states of §8.3 MUST remain distinguishable and keep their mapping
duty; the variant set MUST additionally cover, at minimum, the semantics:
daily idle, happy, curious, resting/sleepy, working, waiting-for-user,
completed (at least two completed-family variants, e.g. happy and proud),
and soft failure/cancelled (at least two failed/cancelled-family variants,
e.g. soft and relaxed). Vehicle variants are overlay recipes over the current `LEVEL_BASE_VISUAL`; companion variants use original full-body poses with grade marks; the level visual MUST stay recognizable, expression art MUST NOT
replace or obscure level-critical identity, and the same character identity
is kept across variants. Art V2 level base art MUST NOT be regenerated.
Variant selection MUST be a pure, unit-testable function over structured
context (session state, Engine progress/level/keepsake events, bounded idle
bucket, interaction count, recent-variant history) without immediate
repetition of the same variant within the same state. Assets are bundled
plugin presentation assets: transparent, WebP primary with PNG fallback,
produced by the repository deterministic asset pipeline with recorded
provenance and exact output bytes; no network request, no model call, no
runtime image generation. Expression presentation MUST NOT change
progression and MUST NOT add pointer or focus targets beyond the pet surface
and its contracted affordances.

### CTR-OVERLAY-015 — Static presentation always

The DSH adapter MUST always request reduced motion from the Engine and suppress all overlay/scene/shell animation and transition, irrespective of OS or legacy saved preference. Expression poses still change statically with state, clicks and cadence; text still appears and auto-dismisses. Remove the motion setting. Existing reducedMotion fields MAY be retained inertly for rollback compatibility, but MUST NOT reactivate motion or cause preference rewrites on mount. The Engine and prototype retain their existing reduced-motion interfaces; only this adapter selects the permanently static mode.

### CTR-OVERLAY-016 — Resident progress presentation is absent; growth systems preserved

Neither resident size MAY render a within-level progress bar, sliver, gauge,
percentage text, token totals or within-level numeric readouts on or under the
pet. The sole persistent grade exception is the exact grade, localized operational description and clothing insignia required by CTR-023, plus the active-session footer in CTR-025; it adds no gauge or within-level progress readout. The usage progress source, `progressPoints`, derived level, usage
ledger, token economy, level-up, keepsakes, and Upgrade Receipts continue to
function unchanged, and within-level progress remains visible inside the
Full Journey dialog. A session-state reaction, bubble line, or ceremony
moment MAY reference growth qualitatively but MUST NOT render a persistent
gauge.

### CTR-OVERLAY-017 — Speech bubble surface, positioning, and lifecycle

The speech bubble MUST be a single non-modal text surface: at most one
instance at any time, in both sizes; never focusable, never taking focus,
announced via a polite live region; auto-dismissed within the bounded window
(§8: target 4 s, hard bounds 3–6 s) with its timer disposed on plugin stop;
positioned fully inside the viewport, above or beside the pet according to
available space; never overlapping the composer, the send control, or the
deepseek-pet surface while those are in their default regions; never
blocking pointer input beyond its own bounds; never rendered during
onboarding suppression; and never persisting across reload as an open
surface. A new line replaces the current bubble content and resets the
dismiss timer rather than stacking.

### CTR-OVERLAY-018 — Speech content boundary and catalog floor

Speech lines come exclusively from a bundled, versioned, curated catalog:
for each of the two characters, at least 30 lines per supported locale (`zh-CN` and `en`), distributed with
at least 5 lines in each of: idle, working, needs-input, completed,
failed/cancelled, and level-up/milestone. All copy is original to this
repository; deepseek-pet strings and translations of them are forbidden;
copy MUST be short, companionable, and MUST NOT contain status codes,
percentages, token counts, or engineering log phrasing. Selection MUST be a
pure, unit-testable function of (category, structured trigger context,
recent-selection history, injected bounded random sample); it MUST NOT select the
identical line twice in a row within the same category; runtime selection
MUST NOT call a model or read any content forbidden by `CTR-OVERLAY-008`.

### CTR-OVERLAY-019 — Continuous randomized, bounded speech

Use the one existing scheduler across both character choices. After a 15-second initial quiet period, visible resident pets MUST continue attempting a context-appropriate original catalog line every independently sampled 20–40 seconds, without a per-running-period cap. The first recurring deadline is sampled at mount; after an emitted or suppressed recurring attempt, sample the next deadline, so typing or a hidden page never creates a catch-up burst. Pause recurring speech while document.hidden or collapsed/onboarding; no catch-up on return. Recent keyboard/pointer input within 5 seconds suppresses a recurring attempt; event-driven needs-input/terminal/milestone feedback retains deduplication and may preempt. Recurring text uses working for running, needs-input while pending, neutral idle after terminal expiry. Select randomly from eligible catalog entries excluding the previous line in the same category; randomness is an injected numeric input to pure testable selection/cadence rules, never derived from conversation content. Click lines retain a 30-second throttle. One bubble, 4-second target auto-dismiss (3–6 seconds), no forced speech on character switch, no reset of existing cooldown/deadline/history, and complete timer/listener cleanup remain mandatory. No model call, audio, focus stealing, flashing, or penalty for absence.

### CTR-OVERLAY-020 — Size modes, bounded relation, and toggle

The resident surface MUST implement exactly two sizes: `SMALL` at the 112 px
nominal class (adjustment band 104–120 px) and `LARGE` at the 216 px nominal
class, with the realized LARGE height inside the 1.6×–2.2× band relative to
the realized SMALL height and any nominal adjustment recorded with the
measured sprite bbox in the implementation conformance record. The size
choice is persisted per `CTR-OVERLAY-010` with default `LARGE` when absent,
switchable only through the secondary affordance (or an explicitly
authorized equivalent user action), effective immediately on choice, and
stable across reload and restart. Both sizes satisfy `CTR-OVERLAY-003`
placement and hitbox rules and `CTR-OVERLAY-016` progress absence.

### CTR-OVERLAY-021 — Single click reaction, double-click settings

Single click/Enter/Space produces a static expression reaction and at most the throttled line; no motion. Double-click or Shift+Enter/ContextMenu opens only the bounded settings menu per CTR-005. A double-click sequence MUST NOT emit two lines or repeated reactions, and dragging MUST cause neither reaction nor menu. Keyboard arrows retain movement. Both modes must work at SMALL/LARGE and after reload.

## 10. Acceptance

Each item requires executed evidence bound to the exact implementation
commit, packed artifact, isolated DSH home/profile/port, pinned Harness
revision, browser, and command. Source-only inspection is insufficient where
runtime behavior is required. Production profile evidence is not required and
production mutation is forbidden; the acceptance environment is the isolated
fixed-ref DSH.

### ACC-OVERLAY-101 — Package and Core boundary gate

- Contracts: `CTR-OVERLAY-001`.
- Method and evidence: V2 `ACC-OVERLAY-001` unchanged (diff, packed file
  list, manifest, exports, patch row, clean DSH/profile status), executed at
  the V5 implementation commit.
- Expected result: one external package ships all required surfaces; DSH
  checkout and production profile are unchanged by source implementation.
- Failure condition: missing declaration/export, Core/profile source edit, or
  hidden manual patch.

### ACC-OVERLAY-102 — Unique overlay lifecycle probe

- Contracts: `CTR-OVERLAY-002`, `CTR-OVERLAY-012`.
- Method and evidence: V2 `ACC-OVERLAY-002` unchanged (install, restart,
  navigate, reconnect, refresh, HMR, update, uninstall, reinstall; count
  id/marker and slot registrations), plus assertion that speech timers and
  input-recency listeners are absent after stop.
- Expected result: exactly one entry installed, zero after uninstall, no
  scheduler residue.
- Failure condition: zero/multiple entries, wrong slot, residue after
  removal, or surviving bubble timers/listeners.

### ACC-OVERLAY-103 — Placement, drag, refresh, resize, keyboard, and honest hitboxes at both sizes

- Contracts: `CTR-OVERLAY-003`, `CTR-OVERLAY-020`.
- Method: clear preferences; launch SMALL and LARGE at a recorded viewport;
  capture bounding boxes and visible-sprite boxes; drag, refresh, resize,
  move with keyboard; drag over the composer region; measure pointer-target
  geometry versus visible sprite bbox; verify the LARGE default placement
  clears the recorded coexistence footprint.
- Required evidence: screenshots or bounding boxes before/after each action,
  keyboard/pointer event trace, normalized preference values across
  refresh/resize, hitbox-to-visible-bbox measurement, and the recorded
  default-placement constants.
- Expected result: defaults honor composer/send clearance and coexistence
  clearance at both sizes; movement, clamping, relative restoration, drag
  suppression, and hitbox honesty all hold.
- Failure condition: composer/send overlap at default, coexistence-footprint
  overlap at default, off-screen surface, absolute-only persistence, or
  pointer area extending beyond the recorded tolerance around visible art.

### ACC-OVERLAY-104 — Two-state machine and no-panel proof

- Contracts: `CTR-OVERLAY-004`, `CTR-OVERLAY-005`, `CTR-OVERLAY-021`.
- Method: activate pet (click and keyboard), Escape, collapse, refresh,
  activate launcher; inspect `data-vehicle-pet` state values; static scan the
  client artifact for `PANEL_OPEN` and panel-component residue; attempt every
  affordance path with the panel removed.
- Required evidence: ordered state-transition trace, computed 36 px launcher
  bounds, persisted collapsed record, focus/activation assertions, static
  scan report, and screenshots proving no panel appears after normal clicks.
- Expected result: exactly `VISIBLE`/`COLLAPSED` exist; normal clicks never
  produce a panel-shaped surface; collapse/restore semantics match V2.
- Failure condition: any panel-shaped daily surface, a third persisted state,
  wrong sizes, or a missing recovery launcher.

### ACC-OVERLAY-105 — Secondary affordance and journey boundary

- Contracts: `CTR-OVERLAY-005`, `CTR-OVERLAY-013`, `CTR-OVERLAY-020`.
- Method: open the affordance by hover, focus, and keyboard path; enumerate
  items and roles; verify size toggle, Reduced Motion system/on/off
  semantics, journey entry, and collapse; open and close the journey dialog;
  verify progression snapshots before/after.
- Required evidence: semantic query results, item inventory versus the §8.2
  bound, affordance width measurement, dialog provenance, and unchanged
  pre/post progression snapshots.
- Expected result: exactly the contracted items, no progression content in
  the affordance, journey accessible in-Harness, close without mutation.
- Failure condition: item overflow, progression data in the affordance,
  external navigation, or close mutating progress.

### ACC-OVERLAY-106 — Engine/Pack reuse and shared-progress switch

- Contracts: `CTR-OVERLAY-006`.
- Method and evidence: V2 `ACC-OVERLAY-006` unchanged (seeded snapshot,
  both-direction switch, reload, owned-fact equality, dependency graph,
  boundary scan), executed at the V5 implementation commit.
- Expected result: identical owned Engine facts across switches; DSH overlay
  renders only the product Pack; DSH imports only under `src/dsh/**`.
- Failure condition: points reset/change, forked Pack/Engine, duplicate
  preference, or DSH dependency outside the adapter.

### ACC-OVERLAY-107 — Complete session visual-reaction matrix

- Contracts: `CTR-OVERLAY-007`, `CTR-OVERLAY-014`, `CTR-OVERLAY-017`.
- Method: drive structured fixtures through running, needs-input, completed,
  failed, cancelled, and idle, including duplicate terminal delivery and
  resubscription; record the expression variant, bubble line category, and
  `HostActivityEventV1` dispatch per edge.
- Required evidence: input fixture/event trace, rendered reaction timeline,
  variant and line assertions per state, terminal de-duplication keys.
- Expected result: correct variant + at most one line per edge; duplicates do
  not replay; idle shows variant-pool behavior without violating cadence.
- Failure condition: missing/wrong reaction, permanent terminal state,
  duplicate reaction, or scrape-derived state.

### ACC-OVERLAY-108 — Session reactions cannot grow the pet

- Contracts: `CTR-OVERLAY-007`, `CTR-OVERLAY-013`.
- Method and evidence: V2 `ACC-OVERLAY-008` unchanged (exact before/after
  Engine snapshots across the full session matrix).
- Expected result: all growth and durable product records are
  byte/semantic-equivalent.
- Failure condition: any progress or product-ledger mutation.

### ACC-OVERLAY-109 — Forbidden runtime/path/network/content gate

- Contracts: `CTR-OVERLAY-005`, `CTR-OVERLAY-007`, `CTR-OVERLAY-008`,
  `CTR-OVERLAY-013`, `CTR-OVERLAY-018`.
- Method: static scan and browser network interception while exercising every
  state and the full speech matrix; scan for content-reading code paths
  (message/reasoning access, regex over host text, clipboard/credential
  access), other-plugin DOM reads, and panel residue.
- Required evidence: source/artifact scan report, intercepted request log
  classified by owner, DOM inventory, and negative test results for content
  reading.
- Expected result: no forbidden element, URL, server dependency, observer,
  network request, content read, or other-plugin DOM read.
- Failure condition: any forbidden path, including any speech-selection
  dependency on host conversation content.

### ACC-OVERLAY-110 — React singleton bundle gate

- Contracts: `CTR-OVERLAY-009`.
- Method and evidence: V2 `ACC-OVERLAY-010` unchanged, executed at the V3
  implementation commit.
- Expected result: React/ReactDOM external/shared, no `createRoot` in the
  adapter, one host React identity, correct rendering on the pinned major.
- Failure condition: bundled runtime, second root, major mismatch, or hook
  failure.

### ACC-OVERLAY-111 — Preference tolerance, size migration, and multi-tab propagation

- Contracts: `CTR-OVERLAY-003`, `CTR-OVERLAY-010`, `CTR-OVERLAY-020`.
- Method: storage case matrix (missing/corrupt/wrong-version/out-of-range/
  unavailable/quota-failed); pre-V3 record without a size field; explicit
  SMALL and LARGE choices across reload and restart; two-tab storage events;
  write-loop count; listener disposal.
- Required evidence: case matrix with normalized outputs, size-migration
  traces (absent → LARGE; explicit → preserved), two-tab state timeline, and
  post-disposal listener count.
- Expected result: safe defaults; absent size resolves LARGE; explicit size
  survives reload/restart; coherent second-tab update without loops.
- Failure condition: crash/blank pet, lost size choice, loop, stale second
  tab, Pack duplication, or leaked listener.

### ACC-OVERLAY-112 — Structured onboarding visibility

- Contracts: `CTR-OVERLAY-011`.
- Method and evidence: V2 `ACC-OVERLAY-012` method over the V2/V3 state sets
  (`VISIBLE`, affordance open, `COLLAPSED`), plus assertion that no speech
  bubble is rendered during suppression.
- Expected result: no pet DOM/focus target or bubble during onboarding; exact
  restoration on end; persisted `COLLAPSED` across reload; availability on
  common pages.
- Failure condition: pet or bubble during onboarding, reset instead of exact
  restoration, or scrape dependency.

### ACC-OVERLAY-113 — Add/update/restart/remove acceptance

- Contracts: `CTR-OVERLAY-001`, `CTR-OVERLAY-012`.
- Method and evidence: V2 `ACC-OVERLAY-013` unchanged (documented local add,
  fixed-ref remote candidate, update, restart, remove, reinstall; no
  `pnpm dev`).
- Expected result: unique entry after add/update/reinstall; complete
  disappearance after remove.
- Failure condition: watcher/dev-server requirement, stale removed surface,
  or duplicate.

### ACC-OVERLAY-114 — Complete disposal inventory

- Contracts: `CTR-OVERLAY-002`, `CTR-OVERLAY-010`, `CTR-OVERLAY-012`,
  `CTR-OVERLAY-017`, `CTR-OVERLAY-019`.
- Method: V2 `ACC-OVERLAY-014` instrumented inventory extended with speech
  bubble DOM, dismiss timers, ambient/rotation timers, and input-recency
  listeners across activation → stop/uninstall.
- Expected result: all plugin-owned live resources return to baseline;
  persisted preference bytes may remain.
- Failure condition: any owned DOM, listener, timer, observer, registration,
  or subscription remains active.

### ACC-OVERLAY-115 — No duplicate across page/session/HMR matrix

- Contracts: `CTR-OVERLAY-002`, `CTR-OVERLAY-012`.
- Method and evidence: V2 `ACC-OVERLAY-015` unchanged (navigation, session
  changes, reconnect, reload, HMR; instance/subscription/reaction counts).
- Expected result: always exactly one installed entry; at most one reaction
  per terminal edge.
- Failure condition: transient or durable double
  instance/subscription/reaction.

### ACC-OVERLAY-116 — Standalone prototype regression gate

- Contracts: `CTR-OVERLAY-006`, `CTR-OVERLAY-009`.
- Method and evidence: repository `pnpm verify` (including `pnpm
  assets:check`) after implementation, plus `git diff --check`.
- Expected result: standalone workflow green; no tracked changes.
- Failure condition: any pre-existing verify stage fails or the standalone
  surface is removed.

### ACC-OVERLAY-117 — Expression variant contact sheet and static parity

- Contracts: `CTR-OVERLAY-014`, `CTR-OVERLAY-015`, `CTR-OVERLAY-020`.
- Method: drive every implemented variant (at least ten) at representative
  levels in SMALL and LARGE; capture stills with motion on and reduced motion
  on; assemble contact sheets; assert distinct rendered assets per variant;
  run the variant-selection unit matrix (no immediate repeats, correct
  category coverage); compare Engine snapshots before/after.
- Required evidence: SMALL and LARGE contact sheets, reduced-motion variants,
  per-variant asset assertions, selection-matrix results, and exact
  before/after Engine snapshots.
- Expected result: ≥10 statically distinct variants in both sizes including
  under reduced motion; level identity recognizable; selection rules hold;
  progression byte-equivalent.
- Failure condition: fewer than 10 distinguishable variants, level identity
  obscured, selection rule violation, added pointer/focus targets, or growth
  mutation.

### ACC-OVERLAY-118 — Resident progress absence

- Contracts: `CTR-OVERLAY-008`, `CTR-OVERLAY-016`.
- Method: DOM query inventory for progress-class elements and gauge-shaped
  nodes at both sizes across states; static scan for resident progress
  rendering paths; journey dialog check that within-level progress remains
  available there; usage-source regression run.
- Required evidence: DOM inventory report, static scan, journey screenshot,
  and usage/progression regression transcript.
- Expected result: no resident gauge, token total or within-level progress readout in either size; the CTR-023 descriptive grade label and insignia remain visible; journey
  progress intact; usage source behavior unchanged.
- Failure condition: any resident gauge/sliver/percentage, or journey/usage
  regression.

### ACC-OVERLAY-119 — Speech bubble lifecycle, positioning, and focus gate

- Contracts: `CTR-OVERLAY-015`, `CTR-OVERLAY-017`, `CTR-OVERLAY-018`,
  `CTR-OVERLAY-019`.
- Method: trigger every category in a real isolated DSH; measure bubble
  geometry versus composer/send and coexistence regions; verify single
  instance, replacement-not-stacking, auto-dismiss within bounds, timer
  reset on replacement; attempt focus moves during bubble display; verify
  polite live-region semantics; run the cadence unit matrix (quiet period,
  ambient interval, typing suppression, repeat guard, click throttle) and a
  reduced-motion speech legibility check.
- Required evidence: per-category screenshots (idle, working, needs-input,
  completed, failed/cancelled, plus level-up), geometry measurements, focus
  trace, cadence unit results, and dismissal timing log.
- Expected result: all categories render; bubble never occludes composer,
  send, or the coexistence region; never steals focus; auto-dismisses within
  bounds; cadence rules hold; text readable under reduced motion.
- Failure condition: stacked bubbles, focus steal, composer/coexistence
  occlusion, cadence violation, unreadable reduced-motion speech, or a
  missing category.

### ACC-OVERLAY-120 — Size modes, persistence, and coexistence magnitude

- Contracts: `CTR-OVERLAY-003`, `CTR-OVERLAY-010`, `CTR-OVERLAY-016`,
  `CTR-OVERLAY-020`.
- Method: in the isolated fixed-ref DSH with deepseek-pet co-installed:
  switch SMALL/LARGE via the affordance; reload; restart the profile;
  re-verify; capture SMALL and LARGE screenshots with the whale visible;
  measure realized surface heights and the LARGE/SMALL band; verify default
  LARGE on cleared preferences; verify composer/send clearance.
- Required evidence: E1 (SMALL real-DSH screenshot), E2 (LARGE + whale
  same-frame screenshot showing same-magnitude presence), E3 (persistence
  across reload/restart trace), band computation, and preference records.
- Expected result: two sizes with the contracted band; persistence holds;
  default LARGE; LARGE presence comparable to the whale without covering it
  or the composer.
- Failure condition: wrong default, lost choice, band violation, LARGE
  covering the whale/composer/send, or a giant transparent hitbox.

### ACC-OVERLAY-121 — Pet click reaction and settings-feel exclusion

- Contracts: `CTR-OVERLAY-004`, `CTR-OVERLAY-019`, `CTR-OVERLAY-021`.
- Method: click and keyboard-activate the pet repeatedly in SMALL and LARGE;
  record expression variant changes, motion (and its reduced-motion
  degradation), and line throttle behavior; drag then release without
  reaction; attempt to open any surface by clicking; run the experience
  audit's settings-feel judgment.
- Required evidence: reaction timeline, throttle log, drag-suppression
  trace, and screenshots proving no surface opens on click.
- Expected result: bounded pet reaction only; no panel/menu/dialog/navigation
  on normal clicks; drag silent.
- Failure condition: any surface opening on click, missing reaction,
  throttle violation, or an audit judgment of settings-button feel.

### 10.1 Contract-to-Acceptance coverage

| Contract | Acceptance | Evidence class | Covered |
|---|---|---|---|
| `CTR-OVERLAY-001` | `ACC-OVERLAY-101`, `ACC-OVERLAY-113` | artifact/static/runtime | YES |
| `CTR-OVERLAY-002` | `ACC-OVERLAY-102`, `ACC-OVERLAY-114`, `ACC-OVERLAY-115` | runtime/instrumented | YES |
| `CTR-OVERLAY-003` | `ACC-OVERLAY-103`, `ACC-OVERLAY-111`, `ACC-OVERLAY-120` | browser/runtime | YES |
| `CTR-OVERLAY-004` | `ACC-OVERLAY-104`, `ACC-OVERLAY-121` | browser/static | YES |
| `CTR-OVERLAY-005` | `ACC-OVERLAY-104`, `ACC-OVERLAY-105`, `ACC-OVERLAY-109` | browser/static | YES |
| `CTR-OVERLAY-006` | `ACC-OVERLAY-106`, `ACC-OVERLAY-116` | state/static/regression | YES |
| `CTR-OVERLAY-007` | `ACC-OVERLAY-107`, `ACC-OVERLAY-108`, `ACC-OVERLAY-109` | fixture/runtime/state | YES |
| `CTR-OVERLAY-008` | `ACC-OVERLAY-109`, `ACC-OVERLAY-118` | browser/static | YES |
| `CTR-OVERLAY-009` | `ACC-OVERLAY-110`, `ACC-OVERLAY-116` | artifact/runtime/regression | YES |
| `CTR-OVERLAY-010` | `ACC-OVERLAY-111`, `ACC-OVERLAY-114`, `ACC-OVERLAY-120` | unit/browser/instrumented | YES |
| `CTR-OVERLAY-011` | `ACC-OVERLAY-112` | structured-fixture/browser | YES |
| `CTR-OVERLAY-012` | `ACC-OVERLAY-102`, `ACC-OVERLAY-113`, `ACC-OVERLAY-114`, `ACC-OVERLAY-115` | CLI/runtime/instrumented | YES |
| `CTR-OVERLAY-013` | `ACC-OVERLAY-105`, `ACC-OVERLAY-108`, `ACC-OVERLAY-109` | state/network/static | YES |
| `CTR-OVERLAY-014` | `ACC-OVERLAY-107`, `ACC-OVERLAY-117` | fixture/browser/static | YES |
| `CTR-OVERLAY-015` | `ACC-OVERLAY-117`, `ACC-OVERLAY-119` | fixture/browser/static | YES |
| `CTR-OVERLAY-016` | `ACC-OVERLAY-118`, `ACC-OVERLAY-120` | browser/static/runtime | YES |
| `CTR-OVERLAY-017` | `ACC-OVERLAY-107`, `ACC-OVERLAY-114`, `ACC-OVERLAY-119` | fixture/browser/instrumented | YES |
| `CTR-OVERLAY-018` | `ACC-OVERLAY-109`, `ACC-OVERLAY-119` | static/unit/browser | YES |
| `CTR-OVERLAY-019` | `ACC-OVERLAY-114`, `ACC-OVERLAY-119`, `ACC-OVERLAY-121` | unit/instrumented/browser | YES |
| `CTR-OVERLAY-020` | `ACC-OVERLAY-103`, `ACC-OVERLAY-105`, `ACC-OVERLAY-111`, `ACC-OVERLAY-117`, `ACC-OVERLAY-120` | browser/unit/runtime | YES |
| `CTR-OVERLAY-021` | `ACC-OVERLAY-104`, `ACC-OVERLAY-121` | browser/runtime | YES |

### 10.2 Acceptance-to-Contract coverage

| Acceptance | Contracts covered |
|---|---|
| `ACC-OVERLAY-101` | `CTR-OVERLAY-001` |
| `ACC-OVERLAY-102` | `CTR-OVERLAY-002`, `CTR-OVERLAY-012` |
| `ACC-OVERLAY-103` | `CTR-OVERLAY-003`, `CTR-OVERLAY-020` |
| `ACC-OVERLAY-104` | `CTR-OVERLAY-004`, `CTR-OVERLAY-005`, `CTR-OVERLAY-021` |
| `ACC-OVERLAY-105` | `CTR-OVERLAY-005`, `CTR-OVERLAY-013`, `CTR-OVERLAY-020` |
| `ACC-OVERLAY-106` | `CTR-OVERLAY-006` |
| `ACC-OVERLAY-107` | `CTR-OVERLAY-007`, `CTR-OVERLAY-014`, `CTR-OVERLAY-017` |
| `ACC-OVERLAY-108` | `CTR-OVERLAY-007`, `CTR-OVERLAY-013` |
| `ACC-OVERLAY-109` | `CTR-OVERLAY-005`, `CTR-OVERLAY-007`, `CTR-OVERLAY-008`, `CTR-OVERLAY-013`, `CTR-OVERLAY-018` |
| `ACC-OVERLAY-110` | `CTR-OVERLAY-009` |
| `ACC-OVERLAY-111` | `CTR-OVERLAY-003`, `CTR-OVERLAY-010`, `CTR-OVERLAY-020` |
| `ACC-OVERLAY-112` | `CTR-OVERLAY-011` |
| `ACC-OVERLAY-113` | `CTR-OVERLAY-001`, `CTR-OVERLAY-012` |
| `ACC-OVERLAY-114` | `CTR-OVERLAY-002`, `CTR-OVERLAY-010`, `CTR-OVERLAY-012`, `CTR-OVERLAY-017`, `CTR-OVERLAY-019` |
| `ACC-OVERLAY-115` | `CTR-OVERLAY-002`, `CTR-OVERLAY-012` |
| `ACC-OVERLAY-116` | `CTR-OVERLAY-006`, `CTR-OVERLAY-009` |
| `ACC-OVERLAY-117` | `CTR-OVERLAY-014`, `CTR-OVERLAY-015`, `CTR-OVERLAY-020` |
| `ACC-OVERLAY-118` | `CTR-OVERLAY-008`, `CTR-OVERLAY-016` |
| `ACC-OVERLAY-119` | `CTR-OVERLAY-015`, `CTR-OVERLAY-017`, `CTR-OVERLAY-018`, `CTR-OVERLAY-019` |
| `ACC-OVERLAY-120` | `CTR-OVERLAY-003`, `CTR-OVERLAY-010`, `CTR-OVERLAY-016`, `CTR-OVERLAY-020` |
| `ACC-OVERLAY-121` | `CTR-OVERLAY-004`, `CTR-OVERLAY-019`, `CTR-OVERLAY-021` |

## 11. Alternatives and disposition

### ALT-OVERLAY-101 — Keep the panel, opt-in only

- Disposition: rejected.
- Reason: the Owner explicitly rejects the daily panel interaction; an
  opt-in panel still centers an engineering surface in the product loop.
- Evidence/claims: Goal GAP_1; `OBS-OVERLAY-101`.
- What would reopen: an accepted authority change restoring a daily panel.

### ALT-OVERLAY-102 — Continuous wheel scale like the reference

- Disposition: rejected.
- Reason: two explicit persisted modes are testable, communicate the
  trade-off (compact vs presence) clearly, and avoid a continuous scale
  drifting into composer-occluding or viewport-breaking sizes; the Goal
  freezes SMALL/LARGE.
- Evidence/claims: `OBS-OVERLAY-102` (reference mechanism, principle only).
- What would reopen: an accepted authority change demanding continuous scale.

### ALT-OVERLAY-103 — Content-aware speech

- Disposition: rejected.
- Reason: reading conversation/reasoning text violates this repository's
  structured-data boundary and the Goal's explicit prohibitions, even though
  the installed reference does it.
- Evidence/claims: `OBS-OVERLAY-103`; V2 `CTR-OVERLAY-008` lineage.
- What would reopen: NONE under this authority.

### ALT-OVERLAY-104 — Regenerate level sprites with baked expressions

- Disposition: rejected.
- Reason: violates the Art V2 boundary and multiplies assets 12×N;
  overlay recipes reach ≥10 variants deterministically.
- Evidence/claims: Goal §8/§19; V2 `DEC-OVERLAY-007` rationale.
- What would reopen: an accepted authority change to the Art boundary.

### ALT-OVERLAY-105 — Move all settings to the host settings page

- Disposition: rejected as the sole entry (adopted only as a complement if a
  future round adds a host section).
- Reason: size and collapse need an in-context, near-the-pet entry to feel
  like pet care rather than configuration; the whale keeps a hover-revealed
  on-pet action for exactly this reason.
- Evidence/claims: `OBS-OVERLAY-102`.
- What would reopen: an accepted authority change after real-usage evidence.

## 12. Migration, compatibility, and rollback

```text
MIGRATION = forward-only: the V5 client replaces the V4 client through the normal plugin update path; preferences evolve compatibly (absent size resolves LARGE; absent/unknown character resolves vehicle; all other fields carried).
COMPATIBILITY = pinned to mayf3/deepseek-harness@f77b5a2fcebc2d9138f6608a60636f2294868d42 and its Harness Web React major (carried from V2); future Harness pins require compatibility review.
ROLLBACK = dsh plugin --profile web update to the prior ref, or remove + reinstall the prior ref; restart Web profile; repository rollback is revert of the V5 implementation commit.
EMERGENCY_CONTAINMENT = stop/remove the bundle and restart the Web profile; no DSH Core rollback involved.
DATA_MIGRATION = NONE destructive: the versioned browser-local preference record gains a size field with LARGE-on-absence; Engine storage remains canonical and untouched.
PRODUCTION_APPLICATION = OUT OF SCOPE for this Spec's rounds; the Goal stops at READY_FOR_PRODUCTION_APPLY and the production profile is applied only by a separate Owner gate.
```

Installation acceptance targets are unchanged from V2 (local add, remote
candidate from a fixed ref, restart after add/update/remove, no
`pnpm dev`).

## 12.1 Character presentation decisions

### DEC-OVERLAY-012 — Exactly two presentations of one journey

Owner mayf3 approved the wearable prototype and directed integration on 2026-09-09, including descriptive labels. The presentation choices are existing blue-white vehicle and the approved original half-chibi female AI companion. Both show Pony.ai. Exactly one is visible: vehicle mode retains its required driver, safety operator, escort and remote supervisor; companion mode contains no actual vehicle, escort or second person. Symbols embroidered on clothing are not additional subjects. No new Pack, Engine, ledger, thresholds, receipts or journey is created. Declarative bundled character definitions own visual mappings and speech catalogs; generic rendering consumes those definitions. No girl-specific Engine branch or second scheduler is permitted.

### DEC-OVERLAY-013 — Grade and expression are independent presentation axes

One locked companion identity persists across all twelve levels. Each of its ten or more static expressions composes with each level's on-body insignia. The numeric grade can remain, but the label below the subject MUST include a meaningful localized operational description. For example L2 is “有人驾驶，无保护车” / “Driver aboard, no escort”. A bare L number is insufficient. The exact grade remains accessible and visually legible at SMALL. Insignia are symbolic; their fine detail need not be readable at SMALL if their silhouette and descriptive label remain recognizable.

Level meanings are exclusively Engine V4 §11.1: L1 driver + escort; L2 driver without escort; L3 copilot safety operator + escort; L4 copilot safety operator without escort; L5 unoccupied car with one-to-one remote supervision. L6–L12 preserve one remote operator supervising 3/10/100/1,000/10,000/100,000/1,000,000 cars and the existing fleet/city/multi-city/region/global progression. L1 and L3 wear a shield border, L2 and L4 a circular border, L5 a flat-bottom terminal card, L6 three nodes, L7 ten nodes, L8 a representative dense array, L9 city, L10 multiple cities, L11 regions, L12 globe. These are presentation data, never a new progression authority. Equipment-based L1–L5 narratives are forbidden.

### DEC-OVERLAY-014 — Shared cadence, stable preferences and failure behavior

Character selection updates immediately and persists in the existing tolerant preference record. Selection does not remount Engine or speech scheduling, reset cooldowns, create a milestone, alter progress or receipts, or revive a terminal event. Each character has an original bilingual catalog under the same timing and content boundaries. Failed/cancelled lines must be semantically appropriate to the actual state (either neutral for both or filtered by state). On asset failure use the same character's bundled PNG fallback; if that also fails display its accessible description, not a second pet or silent switch to another identity. Unknown stored IDs resolve to vehicle without mutating progress. Rollback to V3 may ignore the additional preference field and must preserve all growth data.

## 12.2 Additional contracts

### CTR-OVERLAY-022 — Declarative exclusive character selection

The secondary selector MUST offer exactly `vehicle` and `companion`, localized and keyboard operable, with selected state exposed. A selection MUST immediately replace the visible pet, persist across reload/session/restart and synchronize via the existing storage event path without write loops. Engine instance, active Pack, progress, level, token totals, keepsakes and receipts MUST remain identical. Character mappings MUST be bundled declarative data consumed by generic presentation infrastructure; Engine source/schema and counts-only source MUST NOT gain character semantics. Exactly one resident pet subject MUST exist while the resident is visible, including switches, errors and reduced motion; collapsed and onboarding-suppressed states MUST contain zero resident pet subjects. At most one speech bubble may exist, with zero during quiet or suppressed states. The existing Full Journey dialog is a separately scoped Engine view, not a second resident pet; its preserved scene and focus lifecycle do not authorize a second floating pet. Vehicle mode preserves actual operational configuration; companion mode contains only the companion.

### CTR-OVERLAY-023 — Branded identity, descriptive grades and wearables

Both characters MUST visibly show Pony.ai. Companion identity MUST remain the approved gray-teal bob, teal eyes, square mint clip, ivory jacket, cyan shirt, blue-gray shorts and white boots across L1–L12 and all expressions. Every level MUST have a declarative clothing-attached insignia with pose-aware placement, and both characters MUST show a localized descriptive grade label (not only L1/L2). Level mapping and values MUST conform to DEC-OVERLAY-013 and Engine V4; decorative art MUST NOT invent level meanings. Label and insignia MUST neither obscure the face/brand nor overlap the composer/send button/whale in default placements. SMALL and LARGE MUST remain within the sizing bands; label geometry and bubble placement MUST be included in viewport clamping and hit-area checks. No additional focus target is created by label or insignia.

### CTR-OVERLAY-024 — Expression assets and speech share the existing state machine

Each character MUST have at least ten statically distinguishable expressions, including all six session states with failed/cancelled distinct, and idle/happy/curious/sleepy/proud semantics. All 12×10 companion grade/expression combinations MUST render without switching identity or detaching insignia from the body. Original transparent raster art MUST be bundled WebP with PNG fallback and deterministic conversion/provenance; flat SVG clothing insignia may be bundled vector assets. Art production is offline through the Owner-designated ChatGPT sidebar browser; no runtime/build model calls. Both catalogs MUST meet CTR-018 independently and use the same CTR-019 scheduler, preserved across switches. No forced speech on selection, no cooldown reset, immediate repetition, terminal replay, or failed wording on a cancelled state. Asset error fallback MUST obey DEC-014.

## 12.3 Acceptance for new contracts

### ACC-OVERLAY-122 — Character persistence and unchanged journey

- Contracts: `CTR-OVERLAY-022`, `CTR-OVERLAY-010`, `CTR-OVERLAY-006`
- Method: with real stored growth, toggle both directions, reload, change session, restart isolated DSH; deliver same-origin storage event; try missing/invalid ID and quota failure. Compare Engine/ledger/receipt snapshots and count visible subjects.
- Environment: unit/DOM tests and isolated pinned DSH, SMALL/LARGE and reduced motion.
- Required evidence: exact revision tests, before/after persistent snapshots, runtime selector screenshots and keyboard traversal.
- Expected result: immediate one-subject swap, preference survival, fallback vehicle only for unknown ID, no growth mutation or duplicate scheduler.
- Failure condition: reset/forked growth, more than two choices, duplicate subjects, unusable keyboard control, storage loop or lost valid preference fields.

### ACC-OVERLAY-123 — Twelve readable levels

- Contracts: `CTR-OVERLAY-023`, `CTR-OVERLAY-020`
- Method: inspect 12-level contact sheets for both characters and representative SMALL/LARGE screenshots; verify semantic mapping against Engine V4, descriptive labels, brand and pose-specific clothing attachments. Inspect default DSH positions with whale and composer/send visible.
- Environment: deterministic asset checks, independent visual review and isolated pinned DSH.
- Required evidence: character bible, expression sheet, level sheet, size comparison, asset hashes, mapping tests and screenshots.
- Expected result: approved identity, correct grade meaning, description beyond L number, readable exact grade and visible insignia silhouette; no obstructed UI.
- Failure condition: equipment-based L1–L5, incorrect occupancy/escort, bare grade, mixed vehicle+companion, identity drift, clipped label or body mark.

### ACC-OVERLAY-124 — Expression/catalog/scheduler matrix

- Contracts: `CTR-OVERLAY-024`, `CTR-OVERLAY-014`, `CTR-OVERLAY-018`, `CTR-OVERLAY-019`
- Method: drive 120 combinations; test all six states and idle variants, each catalog count/localization and failure/cancellation wording; switch at cooldown/terminal edges; force WebP then PNG failures. Validate real alpha channel and output reproduction.
- Environment: unit/DOM, assets checks, independent visual review and isolated pinned DSH.
- Required evidence: matrix results, captured SMALL reduced-motion variants, deterministic asset manifest, timing tests and failure screenshots.
- Expected result: ten distinct poses, correct on-body mapping, alpha transparent background, catalog floors per character, unchanged scheduler and same-identity fallback; no runtime generation.
- Failure condition: opaque image rectangles, wrong pose/grade, switch resets cadence, duplicate bubble/terminal replay, inappropriate cancellation copy or asset failure changes character.

Coverage extension: CTR-022 → ACC-122; CTR-023 → ACC-123; CTR-024 → ACC-124. Existing CTR-001–021 and their acceptance mappings remain binding, evaluated with both characters wherever presentation or preferences are affected. Historical pre-V4 observation and acceptance records do not establish V5 implementation conformance.

## 12.4 Execution and delivery boundary

The Owner dispatch in `docs/investigations/GOAL_CHARACTER_OWNER_DISPATCH.md`, updated by the approved wearable preview and 2026-09-09 integration request, authorizes documentation, independent review, acceptance and merge, then implementation from that accepted base. The four sheets and original art provenance are required delivery evidence. Run pnpm verify, pnpm verify:dsh, relevant asset checks, isolated pinned DSH lifecycle/coexistence checks, independent code audit and independent visual review. Merge only after required checks. Stop at READY_FOR_PRODUCTION_APPLY; this task does not authorize production profile mutation or deployment. No spec acceptance alone establishes runtime readiness.

## 13. Owner-directed interaction refinement

This whole-authority V5 succeeds V4. Historical observations and conformance results copied above remain historical evidence, not proof of this version. The original shared Engine, two mutually exclusive characters, operational levels, growth preservation, bundled art and no-production-apply boundary remain intact. No new art generation is required.

### DEC-OVERLAY-015 — Quiet visuals, ongoing speech and active-session context

Owner: mayf3, 2026-09-09 feedback. Remove the car's blue presentation backdrop, make motion permanently off, replace the ellipsis menu trigger with double-click, continue randomized catalog speech, and show active sessions below the character. Current-session visual reaction semantics remain unchanged; the footer is a separate read-only projection across the public session list, not an alternate growth source or session controller.

### CTR-OVERLAY-025 — Bounded read-only active-session footer

Below the grade description, show a compact read-only footer from the injected `ctx.sessions.list` snapshot. Active means `running === true` or an explicit nonempty pendingInteraction; pending takes precedence. Use only listed rows (ids when supplied), no hidden addressed rows, no additional session bindings. Show one sanitized title at a time and a total active count when greater than one; cycle every 6 seconds with a hard visual maximum of two short lines. Order deterministically with current active session first, then session ID. A completion/removal MUST disappear on the next list update, and title changes update immediately. Empty list shows localized "暂无活跃会话" / "No active sessions". Missing title uses localized "未命名会话" / "Untitled session", never a raw ID or path. Only title/displayTitle metadata is authorized: normalize control characters, bound input to 80 visible characters, render plain React text, ellipsize within available width; no HTML, body/log reads, copying into speech, navigation, persistence, analytics or extra network. The footer has no focus/pointer targets and never steals focus or writes growth. Its timers/subscriptions dispose on unmount/stop; no history survives reload.

The complete active surface includes this footer (maximum 36px below the grade within the existing 112/216 square by reserving figure space, or an explicitly measured extension up to 36px with matching drag/viewport/composer/whale safe bounds). It MUST fit both sizes and narrow viewports without covering input/send/whale default footprints. No session list dashboard or expandable monitor is introduced.

### CTR-OVERLAY-026 — Transparent resident vehicle presentation

The resident car scene MUST have a transparent background with no pale-blue gradient, tile or backdrop. Preserve the original car, escort and remote-operator asset alpha and operational meanings; do not repaint/regenerate them. Scene hitbox and focus must still follow visible art. Full Journey may retain its existing scene backdrop. The companion remains transparent.

### ACC-OVERLAY-125 — Five-point interaction acceptance

- Contracts: CTR-003/005/008/010/015/017/018/019/021/025/026, with CTR-022/023/024 preserved.
- Method: test transparent car styling, permanently static mode with legacy on/off/absent preferences and both OS settings; double-click/Shift+Enter/ContextMenu/outside/Escape and drag suppression; fake-clock randomized recurring speech beyond three running periods, bounds, hidden/input suppression, switch continuity, anti-repeat and disposal; listed running/pending/idle/removed/missing-title/hostile-title sessions and title updates; read-only footer lifecycle and count/rotation. Drive production component and real pinned-Harness session metadata, including background activity and narrow viewport geometry.
- Environment: deterministic unit/DOM, existing asset checks, isolated pinned DSH and independent code/visual review.
- Required evidence: fixed refs, executed tests, screenshots of transparent car and companion, double-click menu, recurring speech and active-session footer; no production apply.
- Expected result: all five Owner changes work without data loss, extra model calls, duplicate scheduler, hidden interaction area or input/send/whale obstruction caused by the new surface.
- Failure condition: blue car tile, motion returns, ellipsis/motion setting remains, normal click opens settings, drag opens menu, speech stops after a fixed number of lines, title/body leakage or unbounded/interactive footer.

V5 acceptance reconciliation: prior ACC-104/105/110/114/119 and related V4 acceptance wording about menu triggers, reduced-motion settings or sparse cadence is evaluated under the explicit replacement CTR-005/010/015/019/021 and ACC-125 above. Unchanged acceptance obligations remain binding. This is a whole-authority successor; V4 is superseded atomically only on acceptance/merge. Documentation and isolated implementation/merge are authorized by the existing Owner dispatch plus this five-point request; production activation remains forbidden.

## 14. Authorization gate

```text
SPEC_GOVERNANCE_MODE = AUTHOR
AUTHORITY_ACTION = SUPERSEDE
SPEC_ID = DSH_PET_OVERLAY_ADAPTER_V5
STATUS = accepted
IMPLEMENTATION_AUTHORITY = contracts
PLAN_LEVEL = EXEC_PLAN
ASSURANCE_LEVEL = DURABLE
DOCS_FIRST_REQUIRED = YES
OPEN_OWNER_DECISIONS = NONE
NORMATIVE_TBD = NONE
PARTIAL_SUPERSESSION = NONE
CONTRACT_COUNT = 26
CONTRACTS_WITH_ACCEPTANCE = 26
INDEPENDENT_REVIEW = ACCEPT at cb3da221374dbe1b3aacbb7e80370bda89a377d8
PRODUCTION_APPLY_ALLOWED = NO
AUTHORING_READY_FOR_REVIEW = YES
NEXT_ACTION = IMPLEMENTATION_FROM_ACCEPTED_MAIN_BASE
```

Acceptance: mayf3 Owner dispatch, recorded by author after independent authority_preflight_review ACCEPT at cb3da221374dbe1b3aacbb7e80370bda89a377d8. Activation requires merge into main; production application remains forbidden.
