---
spec_id: DSH_PET_OVERLAY_ADAPTER_V1
status: superseded
spec_kind: implementation
authority_level: governing_spec
implementation_authority: contracts
scope:
  - dsh-bundle-plugin
  - shell-overlay
  - compact-pet-surface
  - session-visual-reactions
governed_by:
  - VEHICLE_PET_PRODUCT_DIRECTION_V1
  - CONFIGURABLE_PET_ENGINE_V2
  - VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1
external_authorities:
  - repository: mayf3/deepseek-harness
    authority_id: DEEPSEEK_HARNESS_PINNED_INTEROP_V1
    revision: f77b5a2fcebc2d9138f6608a60636f2294868d42
    relation: interoperates_with
supersedes: []
superseded_by: DSH_PET_OVERLAY_ADAPTER_V2
owners:
  - mayf3
---

# DSH_PET_OVERLAY_ADAPTER_V1

## 1. Goal

Authorize, after independent review and Owner acceptance of this exact proposed
revision, a narrow DeepSeek Harness adapter that runs Vehicle Pet as a native
bottom-right Harness Web plugin while preserving Configurable Pet Engine V1 as the
only owner of progression, Packs, keepsakes, receipts, and product rendering.

```text
GOAL = Deliver Vehicle Pet inside Harness Web as a DSH bundle plugin.
SUCCESS_OUTCOME = A single native shell.overlay pet reuses the existing Engine, React product layer, and two bundled Packs without changing DSH Core or running a second app.
DELIVERY_FORM = DSH_BUNDLE_PLUGIN
OWNING_REPOSITORY = mayf3/vehicle-pet
RUNTIME = Harness Web profile
SURFACE = shell.overlay
```

This proposal is docs-only. It creates no plugin files and grants no authority until
an independent reviewer audits the exact proposed Head and `mayf3` accepts it.

## 2. Scope and non-goals

### In scope

- package and build contracts for one externally installable DSH bundle/client plugin;
- one root-scoped `shell.overlay` Vehicle Pet entry;
- compact pet, compact panel, and in-Harness full-journey dialog states;
- pointer and keyboard movement plus local browser preferences;
- structured current-session state translated into visual-only reactions;
- install, update, restart, HMR/reload, uninstall, and reinstallation lifecycle;
- compatibility with the pinned Harness Web React major;
- continued standalone prototype use for development, showcase, and E2E.

### Out of scope

- changes to `mayf3/deepseek-harness`, DSH Core, apps/web, shipped bundles, or user profiles;
- an iframe, external Vite app, port `5199`, second React root, second React runtime,
  or a separately running frontend;
- real token accounting, token-to-progress conversion, model calls, remote Packs,
  audio, multi-pet, marketplace, or network-backed pet behavior;
- treating a turn, tool call, task, or session event as growth points;
- changing `ProgressSnapshotV1`, Engine level derivation, keepsake identity, Upgrade
  Receipts, Pack manifests, or Pack trust policy;
- implementation in this proposal round.

## 3. Authority and dependencies

```text
PRIMARY_PARENT_AUTHORITY = VEHICLE_PET_PRODUCT_DIRECTION_V1
ENGINE_PARENT_AUTHORITY = CONFIGURABLE_PET_ENGINE_V1
GOVERNANCE_PARENT = VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1
IMPLEMENTATION_AUTHORITY = contracts
EXTERNAL_AUTHORITIES = mayf3/deepseek-harness@f77b5a2fcebc2d9138f6608a60636f2294868d42 interoperates_with
AUTHORITY_CONFLICT = NONE
```

`VEHICLE_PET_PRODUCT_DIRECTION_V1` remains product authority.
`CONFIGURABLE_PET_ENGINE_V1` remains authority for the Engine, bundled Packs,
progression, presentation journal, keepsakes, and receipts. This Spec adds only a
Harness delivery adapter and compact host experience. It does not reinterpret any
Engine Contract.

The frontmatter ID `DEEPSEEK_HARNESS_PINNED_INTEROP_V1` is this Spec's stable
coordinate handle for the source-level interoperability dependency at the exact
Harness revision; it does not claim that the upstream repository publishes a Spec
or authority with that name. The pin constrains only package/client/slot
compatibility used by this adapter. The investigation record
`docs/investigations/DSH_PET_OVERLAY_REFERENCE_INPUTS.md` records the exact source
paths and evidence behind that coordinate. The two whale repositories are evidence
only and are not external authorities. Their characters, art, copy, progression,
and semantics MUST NOT be copied.

## 4. Current State

### STATE-OVERLAY-001 — Vehicle Pet is implemented but only as a standalone prototype

- Subject: `mayf3/vehicle-pet` product tree.
- As of commit: `25b56b3b8540031e9d6e320d22872d86a136c7ad`.
- Environment: clean `origin/main`-derived worktree.
- Observed at: `2026-08-23T12:33:13Z`.
- Projection: Configurable Pet Engine V1, its React layer, two bundled Packs, tests,
  and Vite prototype exist; no DSH bundle/client adapter exists.
- Basis: `OBS-OVERLAY-001`, `OBS-OVERLAY-002`, and investigation
  `OBS-OVERLAY-010`–`OBS-OVERLAY-012`.

### STATE-OVERLAY-002 — The pinned Harness supports an external root overlay plugin

- Subject: DSH Web bundle/client plugin and slot system.
- As of commit: `mayf3/deepseek-harness@f77b5a2fcebc2d9138f6608a60636f2294868d42`.
- Environment: read-only disposable clone of `master`.
- Observed at: `2026-08-23T12:33:13Z`.
- Projection: an external package can contribute one built client row and register
  additively into `shell.overlay` without a DSH Core change.
- Basis: `OBS-OVERLAY-003`, `CLM-OVERLAY-001`, `EVD-OVERLAY-001`.

## 5. Observations

### OBS-OVERLAY-001 — Local reusable layers exist

- Subject: Engine, React product layer, and bundled Pack registry.
- Repository/source: `mayf3/vehicle-pet`.
- Commit/artifact: `25b56b3b8540031e9d6e320d22872d86a136c7ad`.
- Environment: source inspection.
- Observed at: `2026-08-23T12:33:13Z`.
- Method: inspect `src/engine/**`, `src/react/**`, and `src/packs/**`.
- Result: all three reusable layers exist; Engine and Pack code have no DSH dependency.
- Provenance: investigation `OBS-OVERLAY-011`.

### OBS-OVERLAY-002 — No DSH adapter files or package declarations exist

- Subject: Vehicle Pet DSH delivery surface.
- Repository/source: `mayf3/vehicle-pet`.
- Commit/artifact: `25b56b3b8540031e9d6e320d22872d86a136c7ad`.
- Environment: source and manifest inspection.
- Observed at: `2026-08-23T12:33:13Z`.
- Method: inspect tree and `package.json`.
- Result: no `src/dsh/**`, `cordis.patch.yml`, `dsh.bundle`, `dsh.client`, or
  `./client` export exists.
- Provenance: investigation `OBS-OVERLAY-010`, `OBS-OVERLAY-012`.

### OBS-OVERLAY-003 — Pinned DSH has the required external plugin seams

- Subject: DSH package loader, client module system, and `shell.overlay`.
- Repository/source: `mayf3/deepseek-harness`.
- Commit/artifact: `f77b5a2fcebc2d9138f6608a60636f2294868d42`.
- Environment: read-only disposable clone.
- Observed at: `2026-08-23T12:33:13Z`.
- Method: inspect bundle manifest contract, client exports, client module loader,
  slot catalog, session injection, and CLI lifecycle reference.
- Result: the required seams exist and support additive external UI.
- Provenance: investigation `OBS-OVERLAY-001`–`OBS-OVERLAY-006`.

### OBS-OVERLAY-004 — React majors currently differ

- Subject: Vehicle Pet standalone React and pinned Harness Web React.
- Repository/source: both repositories at commits above.
- Environment: manifest inspection.
- Observed at: `2026-08-23T12:33:13Z`.
- Method: compare package manifests and DSH client module rules.
- Result: Vehicle Pet standalone declares React/ReactDOM 19; pinned Harness Web
  declares React/ReactDOM 18 and supplies React as a baseline shared module.
- Provenance: investigation `OBS-OVERLAY-005`, `OBS-OVERLAY-010`.

## 6. Claims and evidence relations

### CLM-OVERLAY-001 — A repository-local adapter is sufficient

- Support state: SUPPORTED.
- Supported by evidence: `EVD-OVERLAY-001`.
- Contradicted by evidence: none known.
- Uncertainty: exact package version ranges and build machinery must be proven by the implementation gates.

### CLM-OVERLAY-002 — Session state can be mapped without progression coupling

- Support state: SUPPORTED.
- Supported by evidence: `EVD-OVERLAY-002`.
- Contradicted by evidence: none known.
- Uncertainty: terminal edge de-duplication must be proven against the pinned runtime.

### EVD-OVERLAY-001 — Local reusable layers plus external plugin seams support the adapter

- Source observations: `OBS-OVERLAY-001`, `OBS-OVERLAY-002`, `OBS-OVERLAY-003`.
- Target: `CLM-OVERLAY-001` and `STATE-OVERLAY-002`.
- Relation: SUPPORTS.
- Bound coordinates: Vehicle Pet base and DSH external revision above.
- Strength/sufficiency: direct source/manifest/slot/lifecycle inspection.
- Limitations: no adapter artifact exists in this docs-only round.
- Provenance: investigation record.

### EVD-OVERLAY-002 — Structured DSH session state and visual-only Engine events separate concerns

- Source observations: investigation `OBS-OVERLAY-004`, `OBS-OVERLAY-011`.
- Target: `CLM-OVERLAY-002`.
- Relation: SUPPORTS.
- Bound coordinates: exact Vehicle Pet and DSH commits above.
- Strength/sufficiency: typed snapshot fields and Engine dispatcher behavior are directly inspected.
- Limitations: executed integration evidence is deferred to the authorized implementation.
- Provenance: investigation record.

## 7. Decisions

### DEC-OVERLAY-001 — Deliver as one external DSH bundle plugin

- Decision owner: `mayf3`.
- Decision: `DSH_BUNDLE_PLUGIN` in `mayf3/vehicle-pet`; no DSH Core change.
- Rejected alternatives: Core patch, iframe, external Vite app, second React root.
- Reason: native lifecycle and lowest coupling.
- Owner decision remaining: NONE.

### DEC-OVERLAY-002 — Use a compact three-state root overlay

- Decision owner: `mayf3`.
- Decision: `VISIBLE`, `PANEL_OPEN`, and `COLLAPSED`; default `VISIBLE`; no full
  hide in V1. The visible pet is 112 px, collapsed launcher 36 px, compact panel
  width 320 px, default bottom-right.
- Rejected alternatives: permanently expanded dashboard, full hide, sidebar replacement.
- Reason: pet-first, passive, recoverable interaction.
- Owner decision remaining: NONE.

### DEC-OVERLAY-003 — Reuse Engine, React product surface, and both bundled Packs

- Decision owner: `mayf3`.
- Decision: adapt existing layers; retain standalone prototype for development,
  showcase, and E2E.
- Rejected alternatives: forked mini-engine or DSH-specific Pack copies.
- Reason: preserve one progression and product implementation.
- Owner decision remaining: NONE.

### DEC-OVERLAY-004 — Session reactions are structured and visual-only

- Decision owner: `mayf3`.
- Decision: map typed Harness session state to transient pet presentation and
  existing `HostActivityEventV1` feedback; never to growth.
- Rejected alternatives: DOM/text scraping and one-turn-one-point accounting.
- Reason: session activity is not product progression.
- Owner decision remaining: NONE.

### DEC-OVERLAY-005 — Browser-local overlay preferences

- Decision owner: `mayf3`.
- Decision: viewport-relative position, collapsed state, and reduced-motion choice
  are local browser preferences; active Pack remains Engine `activePackId`.
- Rejected alternatives: server/profile mutation and a second Pack preference.
- Reason: presentation preferences are local while Engine state stays canonical.
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
DEFAULT_STATE = VISIBLE
VISIBLE_PET_SIZE_PX = 112
COLLAPSED_LAUNCHER_SIZE_PX = 36
COMPACT_PANEL_WIDTH_PX = 320
FULL_HIDE_IN_V1 = NO
DRAG = YES
KEYBOARD_MOVE = YES
POSITION_PERSISTENCE = viewport-relative browser local preference
COLLAPSED_PERSISTENCE = browser local preference
REDUCED_MOTION_PERSISTENCE = browser local preference
ACTIVE_PACK_PERSISTENCE = existing Engine activePackId
ONBOARDING_VISIBILITY = hidden
SESSION_EFFECT = visual reaction only
REAL_TOKEN_INTEGRATION = NO
TOKEN_TO_PROGRESS = NO
MODEL_CALLS = NO
REMOTE_PACK = NO
AUDIO = NO
MULTI_PET = NO
```

### 8.1 State transitions

- `VISIBLE`: render only the current pet at 112 px, light idle movement, temporary
  session state, and necessary upgrade/greeting/host feedback. It MUST NOT render a
  full monitoring dashboard by default. Clicking the pet toggles `PANEL_OPEN`.
- `PANEL_OPEN`: keep the pet and show one 320 px compact panel. Clicking the pet
  closes it back to `VISIBLE`; Escape also closes it.
- `COLLAPSED`: render only a 36 px keyboard-accessible launcher. It is not full
  hide. Clicking or activating the launcher restores `VISIBLE`.
- Dragging moves the overlay without toggling the panel. Keyboard arrow movement is
  available on the focused pet/launcher; a larger modified step MAY be provided.

### 8.2 Compact and full-journey boundaries

The compact panel contains only:

1. active Pack name;
2. current stage/level;
3. progress plus next threshold;
4. most recent keepsake, if any;
5. `autonomous-fleet` / `seedling-fixture` Pack switch;
6. Reduced Motion control;
7. Collapse action;
8. “View full journey” action.

“View full journey” opens a larger Overlay/Dialog inside Harness and reuses the
existing React product surface for scene, milestones, progress, keepsakes,
greetings, and upgrade presentation. It MUST NOT open `localhost:5199`, an iframe,
a separately running Vite app, or a development control console.

### 8.3 Structured session mapping

The adapter consumes pinned, typed DSH client/session contracts only. DOM queries,
text matching, transcript scraping, CSS-class scraping, and MutationObserver-based
state inference are forbidden.

| Adapter state | Structured DSH meaning | Vehicle Pet presentation |
|---|---|---|
| `DSH_RUNNING` | current selected session is running | working/focus visual state while true |
| `DSH_NEEDS_INPUT` | current selected session has a structured pending interaction | waiting visual state while pending |
| `DSH_TURN_COMPLETED` | structured terminal edge reports successful turn completion | one short `completed` `HostActivityEventV1` feedback |
| `DSH_TURN_FAILED` | structured terminal/error edge reports failure | one short `failed` `HostActivityEventV1` feedback |
| `DSH_TURN_CANCELLED` | structured terminal edge reports cancellation | one short `cancelled` `HostActivityEventV1` feedback |
| `DSH_IDLE` | none of the above applies | normal idle presentation |

Precedence is `NEEDS_INPUT` over `RUNNING` over a currently active short terminal
reaction over `IDLE`. A terminal structured identity is edge-deduplicated, so reload,
resubscription, list refresh, or HMR cannot replay it as a new reaction.

None of these mappings may change `progressPoints`, derived level, keepsakes,
Upgrade Receipts, presentation journal identity, or Pack content. A turn, tool call,
or task does not directly count as growth points.

### 8.4 Authorized next-round file and package surface

The next implementation round is authorized to create at least:

```text
cordis.patch.yml
src/dsh/index.ts
src/dsh/client/index.ts
src/dsh/client/VehiclePetOverlay.tsx
src/dsh/client/VehiclePetPanel.tsx
src/dsh/client/VehiclePetDialog.tsx
src/dsh/client/preferences.ts
src/dsh/client/session-state-adapter.ts
src/dsh/client/styles.ts
```

It may update `package.json` and necessary build configuration to add:

- Host `main`/root export and `./client` export;
- exported `./cordis.patch.yml`;
- `dsh.bundle` and `dsh.client` declarations;
- pinned-compatible Harness peer/dev dependencies;
- build, client-bundle, bundle-check, and pack-check gates.

This list authorizes implementation scope; it does not require unnecessary Host
business logic. Only `src/dsh/**` may import DSH contracts. `src/engine/**`,
`src/react/**`, and `src/packs/**` MUST remain DSH-independent.

### 8.5 React compatibility

The DSH client artifact uses the host-provided React identity and MUST contain no
second React or ReactDOM runtime. It must be compatible with the React major used by
Harness Web at the pinned external revision (React 18). React and ReactDOM are
external/shared for the client bundle. The standalone prototype may keep its own
React development dependencies and Vite workflow, but package/build separation must
prevent those runtimes from entering the DSH client artifact. A bundle gate must
prove absence of bundled duplicate React/ReactDOM runtime code.

## 9. Contracts

### CTR-OVERLAY-001 — External bundle plugin, never Core patch

The implementation MUST ship from `mayf3/vehicle-pet` as one DSH bundle/client
plugin with `dsh.bundle`, `dsh.client`, `./client`, and exported
`./cordis.patch.yml`. It MUST NOT modify, vendor-patch, or require an uncommitted
change to `mayf3/deepseek-harness`. A build that only works after editing apps/web,
DSH bundle rows, or a user profile violates this Contract.

### CTR-OVERLAY-002 — Exactly one additive `shell.overlay` entry

The client MUST register through the pinned slot API into the `shell.overlay` list
with stable id `vehicle-pet`, and MUST dispose that registration with its Cordis
fiber. At most one DOM entry for that id may exist across initial load, page/session
navigation, reconnect, reload, client HMR, update, and reinstall. Registering at
`root`, replacing a shipped id, creating a separate React root, or leaving duplicate
entries is a failure.

### CTR-OVERLAY-003 — Bottom-right placement and accessible movement

First valid launch MUST place the 112 px `VISIBLE` pet at bottom-right within a safe
viewport margin. Pointer drag and keyboard movement MUST clamp the complete active
surface into the viewport and persist normalized x/y ratios, not absolute pixels.
Refresh and viewport resize MUST restore/clamp the corresponding relative position.
A drag MUST NOT also toggle the panel. Missing keyboard movement, off-screen loss,
or absolute-coordinate-only persistence is a failure.

### CTR-OVERLAY-004 — Three recoverable states and no full hide

The persisted interaction state machine MUST implement exactly `VISIBLE`,
`PANEL_OPEN`, and `COLLAPSED`, defaulting to `VISIBLE`. The visible pet is 112 px;
the collapsed launcher is 36 px. Click/keyboard activation on the visible pet
toggles the panel; collapse always leaves a launcher; launcher activation restores
`VISIBLE`. Except while structured onboarding suppression required by
`CTR-OVERLAY-011` is active, any V1 path that leaves no visible recovery affordance
violates this Contract. Onboarding suppression is an ephemeral host-visibility gate,
not a fourth persisted overlay state; when it ends in the same mount, the exact
pre-suppression interaction state is restored, and across reload the persisted
`COLLAPSED` preference retains its ordinary meaning.

### CTR-OVERLAY-005 — Compact panel and full dialog have distinct boundaries

The 320 px compact panel MUST contain only the eight items in §8.2. The full journey
MUST open in an accessible Harness-contained Overlay/Dialog and reuse the existing
React product surface. It MUST close without changing progression. Rendering the
full dashboard by default, putting a development console in the compact panel, or
opening an external page/iframe fails.

### CTR-OVERLAY-006 — One Engine and the two existing Packs

The adapter MUST instantiate/reuse Configurable Pet Engine V1, its React layer, and
exactly the bundled `autonomous-fleet` and `seedling-fixture` Packs. Pack switching
MUST use Engine `activePackId` and preserve the same `progressPoints`, source/subject
identity, receipts, keepsakes, and journal semantics. No DSH-specific forked Engine,
Pack copy, Pack code, or second progress ledger is allowed.

### CTR-OVERLAY-007 — Session mapping is transient and visual-only

The adapter MUST implement the complete structured mapping in §8.3. Running and
needs-input are live visual states; completed, failed, and cancelled create one
short, edge-deduplicated existing `HostActivityEventV1` reaction. Idle is normal
idle. No mapped event may mutate growth, derived level, keepsakes, receipts, Pack,
or presentation journal. Treating a turn/tool/task as points is a failure.

### CTR-OVERLAY-008 — No iframe, Vite runtime, scrape, or pet network path

Production plugin operation MUST require no iframe, no separately served Vite app,
no `localhost:5199`, no DOM/text/CSS scrape, and no network request initiated for pet
assets, Packs, state, progression, session reaction, model inference, or telemetry.
Bundled asset loads delivered by the plugin module are allowed; HTTP/fetch/XHR/SSE/
WebSocket pet data paths are not. The adapter MUST use structured injected DSH
contracts.

### CTR-OVERLAY-009 — Host React identity only

The client MUST run on the pinned Harness Web React major and use the host-provided
React identity. The emitted client artifact and packed plugin MUST NOT contain a
second React or ReactDOM runtime or invoke a second `createRoot`. React major
incompatibility, invalid-hook behavior, duplicate runtime signatures, or bundled
React/ReactDOM fails the build and Acceptance.

### CTR-OVERLAY-010 — Local preferences are tolerant and multi-tab consistent

One versioned browser-local preference record MUST own normalized position,
`collapsed`, and explicit reduced-motion choice. Missing, malformed, wrong-version,
out-of-range, quota-failed, or unavailable storage MUST fall back safely without
blocking the pet. Relevant same-origin `storage` events MUST update another tab
without write loops; newer local user input remains coherent. Active Pack MUST NOT
be duplicated into this record. Every storage listener MUST dispose on plugin stop.

### CTR-OVERLAY-011 — Hidden during structured onboarding, visible on common pages

When the pinned structured session-list condition identifies onboarding (ready plus
no current session or a blank current session), Vehicle Pet MUST render no active
surface and take no pointer/focus space. It MUST reappear when onboarding ends. It
MUST remain available on ordinary conversation, settings, and workspace pages,
subject only to its own three states. DOM/class/text detection of onboarding fails.

### CTR-OVERLAY-012 — Restart lifecycle, complete disposal, and idempotence

The documented local path MUST be `dsh plugin --profile web add <local>`; the
candidate remote path is `github:mayf3/vehicle-pet#<ref>`. Add/update/remove changes
require restarting the Web profile, after which add/update shows one entry and remove
shows none. Production operation MUST require no `pnpm dev`. Stop, HMR replacement,
update, and uninstall MUST dispose all overlay DOM, dialog portal DOM, styles,
storage/media/resize/keyboard/pointer listeners, timers, observers, session
subscriptions, slot registrations, and event subscriptions. Reinstall or repeated
activation MUST never double-register id `vehicle-pet`.

### CTR-OVERLAY-013 — Token/progress adapter remains deferred

This adapter MUST NOT read real token usage, convert tokens/turns/tools/tasks to
`progressPoints`, call a model, invent a DSH Progress Source, or add a remote progress
API. It may display the Engine's existing current snapshot only. Real token
integration requires a separate accepted governing Spec and is not authorized by
this Contract.

## 10. Acceptance

Each item requires executed evidence bound to the exact implementation commit,
packed artifact, pinned Harness revision/profile, browser, and command. Source-only
inspection is insufficient where runtime behavior is required.

### ACC-OVERLAY-001 — Package and Core boundary gate

- Contracts: `CTR-OVERLAY-001`.
- Method: inspect git diff, packed file list, `package.json`, exports, DSH declarations, and patch row.
- Environment: clean implementation worktree and packed package, compared with the pinned DSH checkout and an untouched Web profile.
- Required evidence: implementation/base hashes, complete changed-path list, package manifest excerpt, packed-file manifest, patch row, and clean DSH/profile status.
- Expected result: one external package declares/ships all required surfaces; DSH checkout and profile are unchanged by source implementation.
- Failure condition: missing declaration/export, Core/profile source edit, or hidden manual patch.

### ACC-OVERLAY-002 — Unique overlay lifecycle probe

- Contracts: `CTR-OVERLAY-002`, `CTR-OVERLAY-012`.
- Method: install local package, restart Web profile, navigate pages/sessions,
  reconnect, refresh, exercise client HMR/reload, update, uninstall, and reinstall;
  count stable id/marker and slot registrations.
- Environment: pinned Harness Web profile in a disposable DSH home, production build for restart paths, and client watcher only for the explicit HMR subcase.
- Required evidence: command transcript, restart boundaries, DOM/slot counts for every step, HMR generation log, and post-uninstall/reinstall counts.
- Expected result: exactly one `vehicle-pet` entry whenever installed and zero after uninstall.
- Failure condition: zero after valid install, more than one, wrong slot, or residue after removal.

### ACC-OVERLAY-003 — Default placement, drag, refresh, resize, and keyboard

- Contracts: `CTR-OVERLAY-003`.
- Method: clear preference, launch at two viewport sizes, drag, refresh, resize, and
  move with keyboard; inspect normalized persisted value.
- Environment: pinned Harness Web in a real browser at two recorded viewport dimensions with clean and preseeded local storage.
- Required evidence: screenshots or bounding boxes before/after each action, keyboard/pointer event trace, and captured normalized preference values across refresh/resize.
- Expected result: default bottom-right, 112 px visible surface, pointer and keyboard
  movement, relative restoration, viewport clamping, and no click toggle after drag.
- Failure condition: wrong default, off-screen surface, absolute-only value, lost
  position, inaccessible movement, or drag opens panel.

### ACC-OVERLAY-004 — Three-state transition probe

- Contracts: `CTR-OVERLAY-004`.
- Method: activate pet, Escape, collapse, refresh, activate launcher, and inspect sizes.
- Environment: pinned Harness Web browser with onboarding inactive and clean local preferences.
- Required evidence: ordered state-transition trace, computed 112/36 px bounds, persisted collapsed record, and focus/activation assertions.
- Expected result: `VISIBLE ↔ PANEL_OPEN`, collapse to persistent 36 px launcher,
  launcher restores 112 px `VISIBLE`, and no full-hide state exists.
- Failure condition: wrong size/default/transition or no recovery launcher.

### ACC-OVERLAY-005 — Compact/full boundary and accessibility

- Contracts: `CTR-OVERLAY-005`.
- Method: inspect default, compact panel, and full dialog with role/name/focus/close tests.
- Environment: pinned Harness Web browser with each bundled Pack and representative Engine states.
- Required evidence: semantic query results, accessible role/name/focus trace, compact-field inventory, dialog component provenance, and unchanged pre/post progression snapshots.
- Expected result: default is pet-only, compact panel has exactly the authorized
  product data/actions, and full journey is an in-Harness accessible dialog reusing
  existing product components.
- Failure condition: default monitoring dashboard, compact scope expansion,
  external navigation, missing dialog semantics, or close mutates progress.

### ACC-OVERLAY-006 — Engine/Pack reuse and shared-progress switch

- Contracts: `CTR-OVERLAY-006`.
- Method: seed one Engine snapshot, switch both directions, reload, inspect
  `activePackId`, points, receipts, keepsakes, registry, and dependency graph.
- Environment: adapter integration test plus pinned Harness Web using deterministic Engine storage and both bundled Packs.
- Required evidence: before/after serialized owned Engine facts, rendered Pack IDs, storage-key inventory, import graph, and DSH-dependency boundary scan.
- Expected result: both existing Packs render; `progressPoints` and identity remain
  unchanged; only existing Engine storage owns Pack selection; only `src/dsh/**`
  imports DSH contracts.
- Failure condition: points reset/change, forked Pack/Engine, duplicate preference,
  lost product records, or DSH dependency outside adapter.

### ACC-OVERLAY-007 — Complete session visual-reaction matrix

- Contracts: `CTR-OVERLAY-007`.
- Method: drive structured fixtures/runtime through running, needs-input, completed,
  failed, cancelled, and idle, including duplicate terminal delivery and resubscribe.
- Environment: typed adapter unit fixtures and pinned Harness Web session runtime with recorded structured event identities.
- Required evidence: input fixture/event trace, rendered reaction timeline and duration, terminal de-duplication keys, and subscription/rebind log.
- Expected result: working/focus, waiting, one short distinguishable terminal
  reaction for each status, and idle; duplicates do not replay.
- Failure condition: missing/wrong reaction, permanent terminal state, duplicate
  reaction, or scrape-derived state.

### ACC-OVERLAY-008 — Session reactions cannot grow the pet

- Contracts: `CTR-OVERLAY-007`, `CTR-OVERLAY-013`.
- Method: snapshot `progressPoints`, derived level, keepsakes, receipts, and journal;
  run the full session matrix and many tool/task/turn events; compare exact state.
- Environment: deterministic Engine/storage integration fixture connected to the structured session adapter.
- Required evidence: exact before/after Engine snapshots, durable-storage dump or semantic inventory, event counts, and equality assertions for every protected fact.
- Expected result: all growth and durable product records are byte/semantic-equivalent.
- Failure condition: any progress or product-ledger mutation.

### ACC-OVERLAY-009 — Forbidden runtime/path network gate

- Contracts: `CTR-OVERLAY-005`, `CTR-OVERLAY-008`, `CTR-OVERLAY-013`.
- Method: static scan and browser network interception while exercising every state.
- Environment: production-built plugin in pinned Harness Web with browser request interception and no Vite process listening.
- Required evidence: source/artifact scan report, process/port check, complete intercepted request log classified by owner, and DOM inventory for iframe/dev surfaces.
- Expected result: no iframe; no `localhost:5199`; no external Vite/dev console; no
  fetch/XHR/SSE/WebSocket pet path; no model or real-token request; no DOM/text scrape.
- Failure condition: any forbidden element, URL, server dependency, observer/scrape,
  network request, or token/model behavior.

### ACC-OVERLAY-010 — React singleton bundle gate

- Contracts: `CTR-OVERLAY-009`.
- Method: inspect emitted bundle/metafile/packed artifact for React/ReactDOM runtime
  signatures and shared-module externalization; run the plugin in pinned Harness.
- Environment: clean production client build and packed artifact loaded by Harness Web at the pinned React major.
- Required evidence: bundle metafile/external list, runtime module identity assertion, React/ReactDOM signature scan, `createRoot` scan, and browser console/test result.
- Expected result: React/ReactDOM are external/shared, no `createRoot` in adapter,
  one host React identity, no invalid-hook error, and correct rendering on React 18.
- Failure condition: bundled runtime, second root, major mismatch, or hook failure.

### ACC-OVERLAY-011 — Preference tolerance and multi-tab propagation

- Contracts: `CTR-OVERLAY-003`, `CTR-OVERLAY-004`, `CTR-OVERLAY-010`.
- Method: test missing/corrupt/wrong-version/out-of-range/unavailable/quota-failed
  storage, two-tab storage events, write-loop count, refresh, and listener disposal.
- Environment: preference unit tests plus two same-origin pinned Harness Web tabs with instrumented Storage and lifecycle disposal.
- Required evidence: case matrix, normalized outputs, storage-event/write counts, two-tab state timeline, activePackId key check, and post-disposal listener count.
- Expected result: safe defaults, clamped ratios, persisted collapsed/reduced-motion,
  coherent second-tab update without loops, and no active listener after stop.
- Failure condition: crash/blank pet, invalid position, loop, stale second tab, Pack
  duplication, or leaked listener.

### ACC-OVERLAY-012 — Structured onboarding visibility

- Contracts: `CTR-OVERLAY-011`.
- Method: from each pre-suppression state (`VISIBLE`, `PANEL_OPEN`, `COLLAPSED`),
  drive structured session-list fixtures into and out of onboarding, then traverse
  ordinary conversation/settings/workspace routes without relying on DOM marker
  text/classes; repeat the collapsed case across reload.
- Environment: pinned Harness Web with typed SessionListState fixtures covering blank/no-current onboarding and ordinary routes.
- Required evidence: structured input snapshots, pre/suppressed/restored state trace for all three states, collapsed reload trace, route timeline, pet DOM and focus-target counts, and a mutation of unrelated DOM text/classes proving invariance.
- Expected result: no pet DOM/focus target during onboarding; the exact same-mount
  pre-suppression state returns when onboarding ends, persisted `COLLAPSED` returns
  after reload, and one appropriate pet/launcher surface remains available on common
  pages; behavior is invariant to unrelated DOM text/classes.
- Failure condition: pet during onboarding, reset to `VISIBLE` instead of exact
  restoration, lost collapsed preference after reload, absent surface on common
  pages, or scrape dependency.

### ACC-OVERLAY-013 — Add/update/restart/remove acceptance

- Contracts: `CTR-OVERLAY-001`, `CTR-OVERLAY-012`.
- Method: run documented local add, remote candidate install from a fixed ref, update,
  restart, remove, restart, and reinstall without `pnpm dev`.
- Environment: disposable pinned Harness Web profile and DSH home, production-built local package, and immutable remote candidate ref.
- Required evidence: complete CLI transcript with package/ref hashes, profile bundle manifest after each operation, process restart log, dev-process absence check, and DOM counts.
- Expected result: unique entry after add/update/reinstall and complete disappearance
  after remove; bundle membership follows restart boundary.
- Failure condition: watcher/dev-server requirement, stale removed surface, or duplicate.

### ACC-OVERLAY-014 — Complete disposal inventory

- Contracts: `CTR-OVERLAY-002`, `CTR-OVERLAY-010`, `CTR-OVERLAY-012`.
- Method: instrument DOM/style/portal counts, event listeners, timers, observers,
  slot registration, storage/media/resize subscriptions, and session/event
  subscriptions before activation, after activation, and after stop/uninstall.
- Environment: pinned Harness Web lifecycle harness with instrumentation installed before plugin activation.
- Required evidence: categorized baseline/active/disposed resource inventories, disposer trace, and post-stop/post-uninstall equality assertions.
- Expected result: all plugin-owned live resources return to baseline after disposal.
  Persisted preference bytes may remain, but no listener or subscription remains.
- Failure condition: any owned DOM, style, listener, timer, observer, registration,
  or subscription remains active.

### ACC-OVERLAY-015 — No duplicate across page/session/HMR matrix

- Contracts: `CTR-OVERLAY-002`, `CTR-OVERLAY-012`.
- Method: loop page navigation, current-session changes, reconnect, reload, and HMR
  replacement while counting entry instances and reaction subscriptions.
- Environment: pinned Harness Web browser with instrumented slot/session services; production reload and explicit client-watcher HMR are separate subcases.
- Required evidence: iteration count, per-step instance/subscription counts, HMR generations, terminal event IDs, and reaction-count trace.
- Expected result: count is always one installed/zero stopped and each structured
  terminal edge produces at most one reaction.
- Failure condition: transient or durable double instance/subscription/reaction.

### ACC-OVERLAY-016 — Standalone prototype regression gate

- Contracts: `CTR-OVERLAY-006`, `CTR-OVERLAY-009`.
- Method: run the repository's pre-existing `pnpm verify` after adapter implementation.
- Environment: clean implementation worktree with frozen-lockfile dependencies and the repository's declared browser/toolchain versions.
- Required evidence: complete command transcript and exit code, test/build summaries, and clean tracked status after the command.
- Expected result: standalone development/showcase/E2E workflow remains green and
  produces no tracked changes.
- Failure condition: any pre-existing verify stage fails or the standalone surface is removed.

### ACC-OVERLAY-017 — Exact size/content mechanical assertions

- Contracts: `CTR-OVERLAY-003`, `CTR-OVERLAY-004`, `CTR-OVERLAY-005`.
- Method: computed-layout and semantic-query assertions at default state, open panel,
  and collapsed state.
- Environment: pinned Harness Web browser at a recorded standard viewport with onboarding inactive.
- Required evidence: computed bounding boxes, semantic element inventory for each state, and exact allowed compact-item comparison.
- Expected result: 112 px pet, 320 px compact panel, 36 px launcher, authorized
  compact fields/actions only, and pet-only default.
- Failure condition: numeric or content-boundary mismatch.

### ACC-OVERLAY-018 — Deferred-token and no-growth static architecture gate

- Contracts: `CTR-OVERLAY-006`, `CTR-OVERLAY-007`, `CTR-OVERLAY-008`, `CTR-OVERLAY-013`.
- Method: dependency/import scan plus tests that forbid DSH imports outside
  `src/dsh/**`, token/model/network adapters, and adapter calls to progress ingestion
  from session events.
- Environment: clean source tree, built client/Host artifacts, and packed package at the implementation commit.
- Required evidence: source and artifact dependency graphs, forbidden-symbol/path scan, capability inventory, and negative tests for session-to-progress calls.
- Expected result: DSH coupling is isolated; no real-token/model/network/progress
  adapter exists; session adapter can only dispatch visual state/HostActivityEvent.
- Failure condition: forbidden import, source, conversion, call, or capability.

### 10.1 Contract-to-Acceptance coverage

| Contract | Acceptance | Evidence class | Covered |
|---|---|---|---|
| `CTR-OVERLAY-001` | `ACC-OVERLAY-001`, `ACC-OVERLAY-013` | artifact/static/runtime | YES |
| `CTR-OVERLAY-002` | `ACC-OVERLAY-002`, `ACC-OVERLAY-014`, `ACC-OVERLAY-015` | runtime/instrumented | YES |
| `CTR-OVERLAY-003` | `ACC-OVERLAY-003`, `ACC-OVERLAY-011`, `ACC-OVERLAY-017` | browser/runtime | YES |
| `CTR-OVERLAY-004` | `ACC-OVERLAY-004`, `ACC-OVERLAY-011`, `ACC-OVERLAY-017` | browser/runtime | YES |
| `CTR-OVERLAY-005` | `ACC-OVERLAY-005`, `ACC-OVERLAY-009`, `ACC-OVERLAY-017` | browser/static | YES |
| `CTR-OVERLAY-006` | `ACC-OVERLAY-006`, `ACC-OVERLAY-016`, `ACC-OVERLAY-018` | state/static/regression | YES |
| `CTR-OVERLAY-007` | `ACC-OVERLAY-007`, `ACC-OVERLAY-008`, `ACC-OVERLAY-018` | fixture/runtime/state | YES |
| `CTR-OVERLAY-008` | `ACC-OVERLAY-009`, `ACC-OVERLAY-018` | browser/static | YES |
| `CTR-OVERLAY-009` | `ACC-OVERLAY-010`, `ACC-OVERLAY-016` | artifact/runtime/regression | YES |
| `CTR-OVERLAY-010` | `ACC-OVERLAY-011`, `ACC-OVERLAY-014` | unit/browser/instrumented | YES |
| `CTR-OVERLAY-011` | `ACC-OVERLAY-012` | structured-fixture/browser | YES |
| `CTR-OVERLAY-012` | `ACC-OVERLAY-002`, `ACC-OVERLAY-013`, `ACC-OVERLAY-014`, `ACC-OVERLAY-015` | CLI/runtime/instrumented | YES |
| `CTR-OVERLAY-013` | `ACC-OVERLAY-008`, `ACC-OVERLAY-009`, `ACC-OVERLAY-018` | state/network/static | YES |

### 10.2 Acceptance-to-Contract coverage

| Acceptance | Contracts covered |
|---|---|
| `ACC-OVERLAY-001` | `CTR-OVERLAY-001` |
| `ACC-OVERLAY-002` | `CTR-OVERLAY-002`, `CTR-OVERLAY-012` |
| `ACC-OVERLAY-003` | `CTR-OVERLAY-003` |
| `ACC-OVERLAY-004` | `CTR-OVERLAY-004` |
| `ACC-OVERLAY-005` | `CTR-OVERLAY-005` |
| `ACC-OVERLAY-006` | `CTR-OVERLAY-006` |
| `ACC-OVERLAY-007` | `CTR-OVERLAY-007` |
| `ACC-OVERLAY-008` | `CTR-OVERLAY-007`, `CTR-OVERLAY-013` |
| `ACC-OVERLAY-009` | `CTR-OVERLAY-005`, `CTR-OVERLAY-008`, `CTR-OVERLAY-013` |
| `ACC-OVERLAY-010` | `CTR-OVERLAY-009` |
| `ACC-OVERLAY-011` | `CTR-OVERLAY-003`, `CTR-OVERLAY-004`, `CTR-OVERLAY-010` |
| `ACC-OVERLAY-012` | `CTR-OVERLAY-011` |
| `ACC-OVERLAY-013` | `CTR-OVERLAY-001`, `CTR-OVERLAY-012` |
| `ACC-OVERLAY-014` | `CTR-OVERLAY-002`, `CTR-OVERLAY-010`, `CTR-OVERLAY-012` |
| `ACC-OVERLAY-015` | `CTR-OVERLAY-002`, `CTR-OVERLAY-012` |
| `ACC-OVERLAY-016` | `CTR-OVERLAY-006`, `CTR-OVERLAY-009` |
| `ACC-OVERLAY-017` | `CTR-OVERLAY-003`, `CTR-OVERLAY-004`, `CTR-OVERLAY-005` |
| `ACC-OVERLAY-018` | `CTR-OVERLAY-006`, `CTR-OVERLAY-007`, `CTR-OVERLAY-008`, `CTR-OVERLAY-013` |

## 11. Alternatives and disposition

### ALT-OVERLAY-001 — Change DSH Core

- Disposition: rejected.
- Reason: unnecessary and outside repository ownership.
- Evidence/Claims considered: `CLM-OVERLAY-001`.
- What would reopen: pinned Harness removes all external additive overlay seams.

### ALT-OVERLAY-002 — Iframe or external Vite application

- Disposition: rejected.
- Reason: violates native lifecycle, React singleton, and no-server requirements.
- Evidence/Claims considered: `OBS-OVERLAY-003`, `OBS-OVERLAY-004`.
- What would reopen: NONE for V1.

### ALT-OVERLAY-003 — Make session work a Progress Source

- Disposition: rejected.
- Reason: parent authority says real progression requires a separate Progress Source
  Spec; activity feedback already has a visual-only contract.
- Evidence/Claims considered: `CLM-OVERLAY-002`.
- What would reopen: a separate accepted token/progress governing Spec.

## 12. Migration, compatibility, and rollback

```text
MIGRATION = Add external bundle/client package surfaces while retaining the standalone prototype and all existing Engine storage.
COMPATIBILITY = Pinned to mayf3/deepseek-harness@f77b5a2fcebc2d9138f6608a60636f2294868d42 and its Harness Web React major; future Harness pins require compatibility review.
ROLLBACK = dsh plugin --profile web remove <installed-package>; restart Web profile; repository rollback is revert of the adapter implementation commit.
EMERGENCY_CONTAINMENT = stop/remove the bundle and restart the Web profile; no DSH Core rollback is involved.
DATA_MIGRATION = NONE; overlay preferences are versioned browser-local data with safe fallback, and Engine storage remains canonical.
```

Installation acceptance targets:

```text
LOCAL = dsh plugin --profile web add <local>
REMOTE_CANDIDATE = dsh plugin --profile web add github:mayf3/vehicle-pet#<ref>
RESTART_AFTER_ADD_UPDATE_REMOVE = REQUIRED
PNPM_DEV_REQUIRED_FOR_PRODUCTION = NO
```

## 13. Authorization gate and open questions

```text
SPEC_GOVERNANCE_MODE = AUTHOR
SPEC_ID = DSH_PET_OVERLAY_ADAPTER_V1
SPEC_KIND = implementation
STATUS = accepted
AUTHORITY_LEVEL = governing_spec
IMPLEMENTATION_AUTHORITY = contracts
PRIMARY_PARENT_AUTHORITY = VEHICLE_PET_PRODUCT_DIRECTION_V1
EXTERNAL_AUTHORITIES = mayf3/deepseek-harness@f77b5a2fcebc2d9138f6608a60636f2294868d42
OPEN_OWNER_DECISIONS = NONE
NORMATIVE_TBD = NONE
UNRESOLVED_AUTHORITY_CONFLICT = NONE
PARTIAL_SUPERSESSION = NONE
CONTRACT_COUNT = 13
CONTRACTS_WITH_ACCEPTANCE = 13
ACCEPTANCE_COUNT = 18
REAL_TOKEN_INTEGRATION_AUTHORIZED = NO
DSH_TOKEN_TO_PROGRESS_AUTHORIZED = NO
DEEPSEEK_HARNESS_CORE_CHANGE_AUTHORIZED = NO
REMOTE_PACK_AUTHORIZED = NO
AUDIO_AUTHORIZED = NO
MULTI_PET_AUTHORIZED = NO
AUTHORING_READY_FOR_REVIEW = YES
READY_TO_MARK_ACCEPTED = YES
READY_TO_MARK_ACCEPTED_REASON = exact proposed Head passed the independent review (ACCEPT, zero blockers) and Owner mayf3 accepted those exact coordinates with execution-time ACCEPTED_AT
```

`READY_TO_MARK_ACCEPTED = YES`: the exact proposed Head
`bdd9c8a32bcb3309d7e44a359cce9a9e48c82d1c` passed the independent review (`ACCEPT`,
zero blockers) and `mayf3` explicitly authorized acceptance of those exact
coordinates with actual execution-time `ACCEPTED_AT`. Independent review, Owner
acceptance, and the authorized acceptance transition are complete process facts,
not unresolved normative decisions. See §14 for the acceptance record.

## 14. Acceptance record

```text
SPEC_LIFECYCLE = proposed → accepted candidate
DSH_OVERLAY_ADAPTER_SPEC_ACCEPTANCE_RECORD_V1 = YES
ACCEPTED_BY = mayf3
ACCEPTANCE_ACTOR = mayf3
ACCEPTED_AT = 2026-08-23T14:04:21Z
OWNER_ACCEPTANCE_DECISION = ACCEPT
INDEPENDENT_REVIEW_RESULT = ACCEPT
REVIEWED_BASE_COMMIT = 25b56b3b8540031e9d6e320d22872d86a136c7ad
REVIEWED_PROPOSED_HEAD = bdd9c8a32bcb3309d7e44a359cce9a9e48c82d1c
ACCEPTANCE_COMMIT_PARENT = bdd9c8a32bcb3309d7e44a359cce9a9e48c82d1c
SEMANTIC_DELTA_AFTER_REVIEW = NONE (lifecycle transition only: proposed → accepted candidate)
BLOCKERS = 0
CONTRACT_COUNT = 13
CONTRACTS_WITH_ACCEPTANCE = 13
ACCEPTANCE_COUNT = 18
OPEN_OWNER_DECISIONS = NONE
NORMATIVE_TBD = NONE
MERGE_AUTHORIZED = NO
OVERLAY_IMPLEMENTATION_AUTHORIZED_BEFORE_MERGE = NO
REAL_TOKEN_INTEGRATION_AUTHORIZED = NO
DSH_TOKEN_TO_PROGRESS_AUTHORIZED = NO
DEEPSEEK_HARNESS_CORE_CHANGE_AUTHORIZED = NO
REMOTE_PACK_AUTHORIZED = NO
AUDIO_AUTHORIZED = NO
MULTI_PET_AUTHORIZED = NO
```

Binding facts:

- The independent review bound the reviewed Base
  `25b56b3b8540031e9d6e320d22872d86a136c7ad` and the reviewed proposed Head
  `bdd9c8a32bcb3309d7e44a359cce9a9e48c82d1c` and returned `ACCEPT` with zero
  blockers.
- This acceptance commit's parent is exactly
  `bdd9c8a32bcb3309d7e44a359cce9a9e48c82d1c`; the only semantic change from the
  reviewed Head is the lifecycle transition `proposed → accepted candidate`
  recorded here and in the matching section of `docs/specs/README.md`.
- Goal, Scope, Current State, Observations, Claims/evidence, Decisions
  `DEC-OVERLAY-001`–`DEC-OVERLAY-005`, Contracts `CTR-OVERLAY-001`–`CTR-OVERLAY-013`,
  Acceptance items `ACC-OVERLAY-001`–`ACC-OVERLAY-018` and both coverage tables,
  the frozen model of §8 including the exact DSH pin
  `f77b5a2fcebc2d9138f6608a60636f2294868d42`, the overlay state machine and sizes,
  the structured session mapping, local preferences semantics, the React
  singleton boundary, install/update/uninstall rules, onboarding suppression, the
  real-token deferral, Alternatives §11, and Migration/rollback §12 are unchanged.
- This Spec is now an `accepted candidate`: `status: accepted` with
  `implementation_authority: contracts` unchanged. On this branch it is an
  accepted candidate, not yet active repository authority.
- Activation is a reachability rule, not a recorded value: this Spec becomes
  active repository authority only when the exact accepted revision is reachable
  from `mayf3/vehicle-pet:main` or an implementation base derived from it. This
  record deliberately hardcodes no `ACTIVE_ON_MAIN` value that would go stale
  after merge.
- DSH overlay implementation MUST NOT begin until the exact accepted revision of
  this Spec is reachable from `mayf3/vehicle-pet:main` or an implementation base
  derived from it.
- Merge authorization is a separate Owner decision; PR #4 remains open, draft,
  and unmerged at `ACCEPTED_AT`. No merge has occurred.
