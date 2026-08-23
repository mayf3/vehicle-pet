# DSH Pet Overlay Reference Inputs

Investigation Records are evidence, not governing authority, and grant no implementation permission.

## Identity

```text
INVESTIGATION_ID = INV-2026-DSH-PET-OVERLAY-001
REPOSITORY = mayf3/vehicle-pet
SUBJECT = DeepSeek Harness bundle/client-plugin integration inputs for Vehicle Pet
OPENED_AT = 2026-08-23T12:33:13Z
CLOSED_AT = 2026-08-23T12:33:13Z
OWNER = mayf3
DISPOSITION = adopted
```

## Goal and authority context

This investigation asks how the completed Configurable Pet Engine V1 can appear as a
bottom-right surface inside Harness Web without changing DeepSeek Harness Core. It
records exact external source coordinates, package and slot mechanics, React
compatibility facts, lifecycle facts, and the boundary between reusable Vehicle Pet
code and a new adapter.

```text
RELATED_AUTHORITIES = VEHICLE_PET_PRODUCT_DIRECTION_V1; CONFIGURABLE_PET_ENGINE_V1; VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V1
AUTHORITY_CHANGE_PROPOSED = YES: DSH_PET_OVERLAY_ADAPTER_V1
VEHICLE_PET_BASE = 25b56b3b8540031e9d6e320d22872d86a136c7ad
EXTERNAL_EVIDENCE_IS_PRODUCT_AUTHORITY = NO
```

The three external repositories below are pinned evidence. Their code, characters,
art, copy, progression semantics, and product choices are not Vehicle Pet authority.
The pinned DSH repository publishes no governance `authority_id` for this aggregate
plugin seam; `DEEPSEEK_HARNESS_PINNED_INTEROP_V1` in the proposed Spec is therefore a
local stable coordinate handle for the exact source interoperability dependency, not
a claim that an upstream Spec with that name exists. In particular, no whale
character, whale artwork, or whale-specific semantics may be copied.

## Exact reference coordinates and paths read

| Repository | Branch requested | Exact commit read | Role |
|---|---|---|---|
| `mayf3/deepseek-harness` | `master` | `f77b5a2fcebc2d9138f6608a60636f2294868d42` | External interoperability contract and host implementation evidence |
| `vlln/whale-girl` | `main` | `e22e1fd918746e610f7bfb1713cef1e57a56f37c` | Evidence of one bundle/plugin and pet lifecycle approach |
| `Er1c0v0/dsh-whale-pet` | `main` | `2e10c80abecfb66e599dac82609295659c3657de` | Evidence of a typed React/slot implementation approach |
| `mayf3/vehicle-pet` | `main` | `25b56b3b8540031e9d6e320d22872d86a136c7ad` | Local product and implementation authority base |

The external repositories were cloned into disposable `/tmp` paths. No file under
`/Users/yanfenma/workspace/github/deepseek-harness` and no DSH profile was modified.

### DeepSeek Harness paths read

- `apps/cli/reference/README.md`
- `docs/architecture.md`
- `docs/cookbook/adding-a-package.md`
- `docs/cookbook/adding-a-settings-card.md`
- `packages/client/AGENTS.md`
- `packages/client/modules/src/client/index.ts`
- `packages/client/runtime/package.json`
- `packages/client/runtime/src/client/index.ts`
- `packages/client/runtime/src/client/sessions/conversation.ts`
- `packages/client/ui-layout/package.json`
- `packages/client/ui-settings-general/src/client/SettingsRoot.tsx`
- `packages/client/ui-slots/package.json`
- `packages/extensions/cordis-client-runner/src/client/slot-catalog.ts`
- `packages/bundle/base/package.json`
- `packages/bundle/base/cordis.patch.yml`

### `vlln/whale-girl` paths read

- `package.json`
- `cordis.patch.yml`
- `lib/index.mjs`
- `lib/client/index.mjs`
- `lib/client/logic.mjs`
- `lib/src/pet-state.mjs`
- `lib/src/persistence.mjs`
- `lib/src/sessions.mjs`
- `decisions/implemented/simplification/2026-08-12-migrate-to-bundle-format.md`
- `decisions/implemented/simplification/2026-08-13-standard-bundle-layout.md`

### `Er1c0v0/dsh-whale-pet` paths read

- `package.json`
- `cordis.patch.yml`
- `build.mjs`
- `src/index.ts`
- `src/client/index.ts`
- `src/client/WhalePet.tsx`
- `src/client/PetPanel.tsx`
- `src/client/preferences.ts`
- `src/client/runtime-source.ts`
- `src/client/usePetDrag.ts`
- `src/client/styles.ts`
- `scripts/check-bundle.mjs`
- `scripts/check-pack.mjs`
- `scripts/smoke-harness.mjs`

### Vehicle Pet paths read

- `package.json`
- `src/engine/**`
- `src/react/**`
- `src/packs/autonomous-fleet/**`
- `src/packs/seedling-fixture/**`
- `src/prototype/**`
- `docs/specs/VEHICLE_PET_PRODUCT_DIRECTION_V1.md`
- `docs/specs/CONFIGURABLE_PET_ENGINE_V1.md`
- `docs/conformance/CONFIGURABLE_PET_ENGINE_V1_CONFORMANCE.md`

## Observations

### OBS-OVERLAY-001 — DSH bundle membership is package-manifest plus patch based

- Coordinates: `mayf3/deepseek-harness@f77b5a2fcebc2d9138f6608a60636f2294868d42`.
- Method: read CLI profile reference, architecture, base bundle manifest, and bundle patch.
- Result: an external package declares `dsh.bundle.patch` in `package.json`, exports
  and ships `cordis.patch.yml`, and contributes an inserted Loader row. A client half
  is exported as `./client` and declared by `dsh.client` with `platform: web`.
- Provenance: paths listed above, especially `apps/cli/reference/README.md:41-63`.

### OBS-OVERLAY-002 — Browser plugins are loaded without rebuilding DSH Core

- Coordinates: same DSH commit.
- Method: read client-module bootstrap and settings-card cookbook.
- Result: enabled Loader rows whose packages declare `dsh.client` have their built
  `./client` artifact served through the client module system. A mounted external
  package can therefore add UI without an apps/web source change or a second app.
- Provenance: `packages/client/modules/src/client/index.ts` and
  `docs/cookbook/adding-a-settings-card.md:78-100`.

### OBS-OVERLAY-003 — `shell.overlay` is the additive root-scoped floating seat

- Coordinates: same DSH commit.
- Method: read the generated slot catalog and layout source coordinate it cites.
- Result: `shell.overlay` is a root-scoped list slot above all columns and outside
  their scroll containers. The owner layer is click-through; each entry must opt
  into pointer events. A fresh required `id` adds an entry; reusing an existing id
  replaces that cell. Entries may provide `order` and `label`. Global standard props
  include `useSessions` and `useWorkspaces`. Registration must use
  `ctx.slots.inject('shell.overlay', () => ctx.slots.register(...))` because apply
  order is unconstrained.
- Provenance: `packages/extensions/cordis-client-runner/src/client/slot-catalog.ts:1519-1557`
  and `packages/client/AGENTS.md:132-141`.

### OBS-OVERLAY-004 — DSH exposes structured session state to root-scoped entries

- Coordinates: same DSH commit.
- Method: read client runtime exports, `ConversationSnapshot`, global slot props, and
  onboarding coordinator.
- Result: structured snapshots expose session list/current selection, `running`,
  `pending`, `runningCalls`, turn timing/end structures, typed conversation nodes,
  open/error state, and `lastAgentError`. Root-scoped entries receive `useSessions`;
  a selected binding can supply its conversation snapshot. The onboarding
  coordinator derives onboarding activity from `SessionListState` (`phase ===
  'ready'` and no current session or a blank current session), so no DOM text or CSS
  scrape is needed.
- Provenance: `packages/client/runtime/src/client/index.ts`,
  `packages/client/runtime/src/client/sessions/conversation.ts:433-478`, and
  `packages/client/ui-settings-general/src/client/SettingsRoot.tsx:121-169`.

### OBS-OVERLAY-005 — The pinned Harness Web host is React 18

- Coordinates: same DSH commit.
- Method: inspect client package manifests and browser shell package manifests.
- Result: DSH client UI packages and Web declare React `^18.2.0`, with React types
  `~18.3.1`; `apps/web` and relevant renderer packages declare ReactDOM `^18.2.0`.
  The module-table baseline supplies React to dynamic browser packages, and DSH
  client rules say baseline externals are implicit and must not be bundled again.
- Provenance: `packages/client/AGENTS.md:57-81`,
  `packages/client/ui-layout/package.json`, `packages/client/runtime/package.json`,
  and `apps/web/package.json`.

### OBS-OVERLAY-006 — Install/update/remove changes bundle membership at restart

- Coordinates: same DSH commit.
- Method: read CLI plugin-management reference.
- Result: `dsh plugin --profile <name> add|update|remove ...` delegates to pnpm and
  reconciles `dsh.profile.bundles`. The running profile retains its bundle set until
  restart after add, update, or remove. Client-plugin HMR exists for rebuilt client
  bundles during development, but production installation does not require a Vite
  server or watcher.
- Provenance: `apps/cli/reference/README.md:41-81`.

### OBS-OVERLAY-007 — `dsh-whale-pet` uses the modern typed React slot path

- Coordinates: `Er1c0v0/dsh-whale-pet@2e10c80abecfb66e599dac82609295659c3657de`.
- Method: inspect manifest, patch, client entry, preferences, drag hook, and session adapter.
- Result: it ships Host and `./client` exports, declares `dsh.bundle` and a
  `dsh.client.inject` package graph for runtime/slots/layout/locale, inserts one
  Loader row, and exports runtime `inject = ['slots', 'sessions', 'locale']`. It uses
  host React, registers one `shell.overlay` id, consumes structured sessions,
  registers/disposes locale dictionaries, sources, and styles, supports pointer and
  keyboard movement, and stores viewport-relative coordinates plus collapsed state
  with damaged-storage fallback.
- Provenance: paths listed above.

### OBS-OVERLAY-008 — `whale-girl` demonstrates lifecycle breadth but uses a different architecture

- Coordinates: `vlln/whale-girl@e22e1fd918746e610f7bfb1713cef1e57a56f37c`.
- Method: inspect package, patch, Host/client files, position behavior, and disposal.
- Result: it is also a bundle with Host and client halves, but owns a Host-side
  accumulation ledger, HTTP/SSE endpoints, direct DOM construction, absolute-pixel
  position storage, DOM observation for onboarding/dialogs, and a larger behavior
  system. It explicitly cleans timers, observers, listeners, DOM, and style on
  disposal.
- Provenance: `lib/index.mjs` and `lib/client/index.mjs`.

### OBS-OVERLAY-009 — The two whale references agree on packaging, not product semantics

- Coordinates: both whale commits above.
- Method: compare package manifests, patch rows, client mounting, session adapters,
  persistence, drag, and cleanup.
- Result: both use a `dsh.bundle` patch, `dsh.client`, Host/client exports, one
  inserted row, an in-GUI floating pet, persistent position, session-driven visual
  changes, and reversible cleanup. They differ materially in typed React slot use,
  Host APIs, direct DOM use, persistence model, size/interaction model, and whether
  progression is Host-owned. Those differences are evidence of alternatives, not
  a Vehicle Pet choice.
- Provenance: all whale paths listed above.

### OBS-OVERLAY-010 — Vehicle Pet is currently a standalone Vite prototype

- Coordinates: `mayf3/vehicle-pet@25b56b3b8540031e9d6e320d22872d86a136c7ad`.
- Method: inspect manifest, source tree, and conformance record.
- Result: the package is private, starts through Vite, carries React/ReactDOM 19 as
  ordinary dependencies, and has no `dsh.bundle`, `dsh.client`, `./client` export,
  `cordis.patch.yml`, or `src/dsh/**`. It is a standalone prototype, not yet a DSH
  plugin.
- Provenance: local `package.json` and repository tree.

### OBS-OVERLAY-011 — Engine, React product surface, and both Packs are reusable

- Coordinates: same Vehicle Pet commit.
- Method: inspect public Engine and React exports, bundled registries, tests, and
  accepted conformance record.
- Result: `src/engine/**` is DSH-independent; `src/react/**` exposes provider, scene,
  progress, keepsake, ceremony, greeting, host feedback, and Pack switching; both
  `autonomous-fleet` and `seedling-fixture` are bundled. `HostActivityEventV1`
  accepts `completed|failed|cancelled`, and its dispatcher explicitly does not
  change `progressPoints` or issue receipts.
- Provenance: `src/engine/types/core.ts`, `src/engine/events/host-activity.ts`,
  `src/react/index.ts`, and `src/packs/bundledRegistry.ts`.

### OBS-OVERLAY-012 — A new DSH-only adapter is required

- Coordinates: same Vehicle Pet and DSH commits.
- Method: compare current product exports with pinned DSH package/slot contracts.
- Result: no existing file translates structured Harness session state, registers
  `shell.overlay`, supplies DSH-compatible preferences, or creates DSH package
  metadata. A new adapter boundary is therefore required; Engine and Packs need no
  DSH dependency.
- Provenance: `OBS-OVERLAY-001`–`OBS-OVERLAY-011`.

## Claims and evidence relations

### CLM-OVERLAY-001 — An external DSH bundle is sufficient

- Support state: SUPPORTED.
- Supported by: `OBS-OVERLAY-001`, `OBS-OVERLAY-002`, `OBS-OVERLAY-003`,
  `OBS-OVERLAY-006`, `OBS-OVERLAY-007`, `OBS-OVERLAY-008`.
- Uncertainty: exact package versions and type names can change after the pinned DSH commit.

### CLM-OVERLAY-002 — Reusing the current React 19 production dependency would risk duplicate/incompatible React

- Support state: SUPPORTED.
- Supported by: `OBS-OVERLAY-005`, `OBS-OVERLAY-010`.
- Uncertainty: the standalone dependency arrangement may remain for prototype-only
  development, but the emitted DSH client artifact must use the host identity.

### CLM-OVERLAY-003 — Session reactions can remain visual-only

- Support state: SUPPORTED.
- Supported by: `OBS-OVERLAY-004`, `OBS-OVERLAY-011`.
- Uncertainty: the next implementation must bind exact pinned DSH structured fields
  to each terminal status and prove no Engine progress mutation.

### EVD-OVERLAY-001

- Source observations: `OBS-OVERLAY-001`–`OBS-OVERLAY-009`.
- Target: `CLM-OVERLAY-001`.
- Relation: SUPPORTS.
- Bound coordinates: exact external commits in the coordinate table.
- Strength/sufficiency: source and lifecycle inspection across host plus two working references.
- Limitations: no Vehicle Pet adapter was implemented or installed in this docs-only round.

### EVD-OVERLAY-002

- Source observations: `OBS-OVERLAY-005`, `OBS-OVERLAY-010`.
- Target: `CLM-OVERLAY-002`.
- Relation: SUPPORTS.
- Bound coordinates: pinned DSH and Vehicle Pet commits.
- Strength/sufficiency: direct manifest and module-baseline evidence.
- Limitations: no emitted Vehicle Pet client bundle exists yet to inspect.

### EVD-OVERLAY-003

- Source observations: `OBS-OVERLAY-004`, `OBS-OVERLAY-011`.
- Target: `CLM-OVERLAY-003`.
- Relation: SUPPORTS.
- Bound coordinates: pinned DSH structured session contract and local Engine contract.
- Strength/sufficiency: direct type and behavior inspection.
- Limitations: exact adapter edge-detection behavior remains implementation work.

## Alternatives considered

### ALT-OVERLAY-001 — Modify DeepSeek Harness Core

- Benefits: direct access to shell internals.
- Costs/risks: violates repository boundary, couples release trains, and is unnecessary.
- Disposition: rejected.

### ALT-OVERLAY-002 — Embed the standalone Vite app or an iframe

- Benefits: minimal initial refactor.
- Costs/risks: second application/root, port dependency, duplicate React, broken
  profile lifecycle, and a non-native experience.
- Disposition: rejected.

### ALT-OVERLAY-003 — Copy either whale implementation

- Benefits: existing examples.
- Costs/risks: wrong product semantics and assets, incompatible progression ownership,
  and external evidence promoted into authority.
- Disposition: rejected.

### ALT-OVERLAY-004 — Add a narrow `src/dsh/**` adapter and bundle metadata

- Benefits: reuses accepted Engine/React/Packs, confines DSH coupling, and preserves
  the standalone prototype.
- Costs/risks: requires a React compatibility build and exact lifecycle tests.
- Disposition: adopted into proposed Spec `DSH_PET_OVERLAY_ADAPTER_V1`.

## Disposition

```text
DISPOSITION = adopted
REASON = The pinned DSH bundle/client and shell.overlay contracts support a native adapter without Core changes.
IMPLEMENTATION_ALLOWED = NO; proposed Spec DSH_PET_OVERLAY_ADAPTER_V1 requires independent audit and Owner acceptance first.
EXTERNAL_EVIDENCE_EQUALS_AUTHORITY = NO
```

## What would reopen the question

- the accepted adapter Spec pins a different Harness commit or Harness changes the
  bundle/client/slot contract;
- Harness Web changes React major version;
- parent Vehicle Pet authority changes its passive, Engine-owned progression model;
- `shell.overlay` ceases to be an additive root-scoped list slot.
