# GOAL 首宠 Conformance Record R1

```text
GOAL = 首宠 (NEW_GOAL, Owner dispatch 2026-09-12)
GOAL_STATUS = READY_FOR_OWNER_PUBLICATION_DECISION
CONFORMANCE_RESULT = VERIFIED (for the exact bound tuple below)
BOUND_AUTHORITY = DSH_PET_OVERLAY_ADAPTER_V8 (accepted, reachable from main),
                  CONFIGURABLE_PET_ENGINE_V4 (accepted),
                  VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2 (accepted)
BOUND_IMPLEMENTATION = 16d453d62f5dc480e8dece54cbfdf8c0c2a8faa1 (origin/main;
                  surface PR #48, branch firstpet/preview-and-host-route, HEADs
                  46fbb12 + 402f423)
BOUND_ENVIRONMENT = macOS arm64 (darwin 25.6.0), node 26.7.0, pnpm
                  (packageManager pins 10.28.1 / 11.7.0), Google Chrome
                  (Playwright channel), disposable DSH homes under /tmp
ROUTE = AUTHORITY_ACTION=REUSE · PLAN_LEVEL=BRIEF · ASSURANCE_LEVEL=DURABLE
        (Brief: .agents/local/GOAL_FIRSTPET_R1.md)
```

## Scope closed

- **P1-A (PREVIEW_P1 = CLOSED)** — `?petPreview=1` violated CTR-OVERLAY-038
  ("tooling MUST provide validate, local preview, deterministic build"):
  the prototype preview branch rendered `PetPreviewView` without any
  `PetEngineProvider`; the first user-selectable pet (`vehicle`) uses the
  `engine-scene` recipe, so `PetSceneRenderer`'s `usePetEngine()` threw and
  React unmounted the whole tree (silent blank page). Fix mounts the same
  real provider as the shell, `PetPreviewView` drives `switchPack(pet.packId)`
  (the CTR-OVERLAY-041 menu path) so both recipes render the selected pet's
  own journey, and `PreviewErrorBoundary` keeps failures readable. Prototype
  `?pack=` deep link generalized to the directory-scan registry.
- **P1-B (SUPPORTED_HOST_PATH = DOCUMENTED_AND_REPRODUCIBLE)** — public
  install docs previously named no host binary. Decision (Owner-delegated,
  Option B): the only supported host is the pinned Harness Web source
  checkout `mayf3/deepseek-harness@f77b5a2fcebc2d9138f6608a60636f2294868d42`
  run through its own `pnpm dsh`. README, `docs/creator/GETTING_STARTED.md`
  (now six steps incl. disposable-DSH install), `docs/public/SUPPORTED_ENVIRONMENTS.md`
  and the Creator Kit template README document the route, disposable
  `DSH_HOME` usage, the unsupported global npm `dsh` CLI, and the
  version-mismatch symptom (koffi / `Cannot find package
  '@mayf3/vehicle-pet'`) — HOST_VERSION_MISMATCH = FAILS_EARLY_OR_CLEARLY.
  No DSH Core change, no harness upstream change.

## Evidence (EVD-*)

| id | Observation | Coordinates |
|---|---|---|
| EVD-FP-1 | Fresh reproduce of the preview crash at BASE: `ROOT_CHILDREN=0` + `usePetEngine must be used inside <PetEngineProvider>` (Playwright probe, headless Chrome) | base 7f9c4f4, worktree run 2026-09-12 16:0x |
| EVD-FP-2 | `pnpm verify` PASS (typecheck, lint, unit/dom, e2e incl. 5 new `tests/e2e/pet-preview.spec.ts` cases, build, contracts, asset determinism) | HEAD 46fbb12, log in session exec_fed8e868 (16:10:58–16:11:38) |
| EVD-FP-3 | `pnpm verify:dsh` PASS 46/46 with `DSH_REFERENCE_WORKTREE` pointed at a **fresh public clone** of the pinned harness checkout (`blackbox-creator/deepseek-harness`, HEAD f77b5a2f…), disposable `DSH_HOME` — the documented route is the exercised coordinate | HEAD 46fbb12, 16:11:38–16:27:37 |
| EVD-FP-4 | Independent REVIEW (agent outside authoring; exact Base/Head; affected contracts CTR-OVERLAY-038/041, ACC-OVERLAY-135, engine neutrality, docs-vs-pinned-host factual check): `REVIEW_RESULT = ACCEPT`, `BLOCKERS = 0`, 2 FOLLOW_UP + 1 TOOLING_DEBT (both FOLLOW_UPs closed in 402f423 before merge) | 46fbb12/402f423 vs 7f9c4f4 |
| EVD-FP-5 | Round-2 independent BLACK-BOX CREATOR ACCEPTANCE by a fresh session with zero project context: fresh clone of merged main 16d453d, public materials only, created **`ember-fox`** (original deterministic Pillow art, 10 poses, 4-stage own journey): `BLACK_BOX_CREATOR_PASS = YES` — VALIDATE PASS, NEGATIVE_VALIDATOR_CASES 3/3, REAL_PREVIEW PASS (real resident renderer, expression/level/size), BUILD PASS, SUPPORTED_DISPOSABLE_DSH_INSTALL PASS (own fresh harness clone @f77b5a2f, `DSH_HOME=/tmp/ember-fox-dsh-home`), PET_SELECT PASS, RELOAD_PERSISTENCE PASS, BASIC_INTERACTIONS PASS (click / double-click menu / long-press petting with own speech line / drag), UNINSTALL PASS, `CORE_MANUAL_EDITS = 0`, TOTAL_TIME 2898 s. Evidence: `/Users/yanfenma/workspace/project/blackbox-acceptance2/` (customer report in session transcript; screenshots/scripts in `workdir/`) | merged candidate 16d453d |
| EVD-FP-6 | Boundary compliance: creator-side tracked-file diff = data dirs + tool-generated wiring/lib only; no `src/engine/**`, scheduler/persistence core, schema, or build-script edits in PR #48; Owner `~/.dsh` and the live 3080 instance never touched | PR #48 diff + acceptance report |

## Recorded follow-ups (non-blocking, Owner visibility)

From EVD-FP-5 friction findings (creatable improvements, not contract
violations on this round's criteria):

1. **FOLLOW_UP (P1)** pose-canvas placement convention (visible top/mid
   band of the 320×540 canvas) is undocumented; bottom-anchored art can
   validate yet render invisible. Candidate closure: document the convention
   in `PET_DEFINITION_REFERENCE.md` + make `pet:validate`/preview warn when a
   pose's alpha bounds fall outside the resident-visible slice.
2. **FOLLOW_UP (P1)** SMALL (112 px) stage in `?petPreview=1` shows nothing
   for pose-sprite pets (preview-page sizing artifact to confirm against the
   resident overlay, which e2e verifies at 112 px).
3. **FOLLOW_UP (P2)** resident-mount precondition (a session must exist
   before the pet appears) undocumented — cost ~10 min acceptance time.
4. **FOLLOW_UP (P2)** which speech categories surface where (ambient bubble
   vs framework toast) undocumented; framework toast copy can mask the pet's
   own `failed` line.
5. **FOLLOW_UP (P3)** `ambientPool`/`stateReactions` vocabulary not publicly
   enumerated; validator message path formatting; Node 26 outside the
   documented engine range but functioned.

## Boundaries held

No production apply, no npm publish/tag/GitHub Release/announcement; no DSH
Core or harness upstream modification; Owner `~/.dsh` and the running 3080
instance untouched; `LIVE_STATE` unchanged; `EXPANSION_TRIGGER` not fired.
Per the Goal dispatch: **STOP at READY_FOR_OWNER_PUBLICATION_DECISION.**
