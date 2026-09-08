# Goal 发布 — OPERATIONAL_PREFLIGHT record

```text
SPEC_GOVERNANCE_MODE = PREFLIGHT
TARGET_REPOSITORY = mayf3/vehicle-pet
REVIEW_TARGET_HEAD = NOT_APPLICABLE
BASE_HEAD = b64e2d0dbadaa9ee1b7eb9814703568021adc58a
CURRENT_BASE_HEAD = b64e2d0dbadaa9ee1b7eb9814703568021adc58a
ROUTE_STAGE = IMPLEMENTATION
AUTHORITY_ACCEPTED_IN_BASE = NOT_APPLICABLE
GOAL_OR_TARGET = repository-local fixed-ref production release helper (default
  read-only, exact-40-hex target only, preflight/dry-run/apply/rollback/verify,
  stale-local-main-safe, evidence-branch-safe) + Controlled Runbook +
  deterministic tests + disposable DSH end-to-end proof
CURRENT_GAP = every production apply round so far temporarily re-derived the
  whole upgrade procedure (REAL_DSH_HOME, web profile pin, lockfile, plugin
  membership, service identity/PID/port, served client, progress/ledger/
  preferences, other plugins, rollback ref) from that round's context, with
  real observed risks: stale-local-main evidence base (be653ba),
  production-ref != repository-main, unrelated floating-dependency drift,
  unassumed service management, per-round one-off scripts
OBSERVATIONS = see Fresh facts below (all read-only, 2026-09-08)
WORKING_GUESS = NOT_APPLICABLE
AUTHORITY_ACTION = REUSE
PRIMARY_AUTHORITY = Owner Goal dispatch GOAL_NAME=发布 (OWNER_DISPATCH_UNIT=GOAL) —
  valid Execution Mandate: attributable issuer (mayf3), target bound
  (mayf3/vehicle-pet → the current DSH web profile only), scope/effects bound
  (§4-§18 incl. PRODUCTION_APPLY_ALLOWED=NO for this Goal), DONE_WHEN bound
  (§22), anti-churn EXPANSION boundary (§23)
RELATED_AUTHORITIES = VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2 (grammar);
  VEHICLE_PET_PRODUCT_DIRECTION_V1, CONFIGURABLE_PET_ENGINE_V3,
  DSH_PET_OVERLAY_ADAPTER_V3, VEHICLE_PET_PROGRESS_SOURCE_V2,
  DSH_USAGE_PROGRESS_SOURCE_V2 — all REUSE-unchanged and untouched by this
  operational tooling
IMPLEMENTATION_AUTHORITY = not_applicable
ATOMIC_SPEC_IMPLEMENTATION_PERMITTED = NOT_APPLICABLE
PLAN_LEVEL = BRIEF
ASSURANCE_LEVEL = CONTROLLED
EXECUTION_MANDATE = VALID
MUTATION_AUTHORIZATION = VALID
ISOLATED_WRITE_SURFACE = YES
CONTROLLED_RUNBOOK_REQUIRED = YES
SPEC_GAP_DEPENDENCY = NONE
EVIDENCE_REVIEWABILITY = PASS
LIVE_AUTHORITY_GAP = NONE
OWNER_DECISION_REQUIRED = NO
EMERGENCY_STATE = NONE
EMERGENCY_ACTION = NONE
INCIDENT_REFERENCE = NOT_APPLICABLE
BASE_IMPACT = NONE
IMPLEMENTATION_ALLOWED = YES
MERGE_READY = NOT_APPLICABLE
OPERATION_ALLOWED = NOT_APPLICABLE
EVIDENCE_NEEDED = disposable E2E CASE_1..6 executed results; real-production
  read-only dry-run receipt (a81809c→a81809c, NO_OP, ZERO_MUTATION=YES);
  deterministic test run; independent code audit; independent operational
  audit; docs-only evidence commit based on fresh origin/main
DONE_WHEN = Goal dispatch §22 (all gates PASS, REAL_PRODUCTION_MUTATED=NO,
  independent audits ACCEPT, SHIP_BLOCKERS=0, merged)
EXPANSION_TRIGGER = any step toward central deploy service, daemon, scheduler,
  cross-repository support, release dashboard/UI, GitHub enforcement, or a
  generic framework (§18/§23) — NOT triggered by this route
NEXT_REAL_ACTION = implement in the isolated worktree
NEXT_ACTION = CONTINUE
```

Route justification (governance route table): `REUSE + CONTROLLED` →
"valid mandate + exact runbook + receipt + independent post-state
verification; no new Spec solely for risk". No Product Contract changes:
the helper encodes the already Owner-proven fixed-ref upgrade path as
operational tooling and must not alter Engine/Overlay/Token-Economy/Progress
behavior. CONTROLLED is required by consequence: the tool can execute
production mutation in future rounds (production activation class).

## Fresh facts (read-only observations, 2026-09-08, pre-worktree)

- REMOTE_MAIN: `git fetch origin` clean; `origin/main` =
  `b64e2d0dbadaa9ee1b7eb9814703568021adc58a` ==
  EXPECTED_REPOSITORY_MAIN_AT_DISPATCH. Owner local checkout
  `~/workspace/project/vehicle-pet` clean, HEAD == origin/main. (Dispatch §1
  invariant holds: production ref is NOT main — main carries the evidence
  archival commit only.)
- PRODUCTION_REF (fresh read of `~/.dsh/profiles/web/package.json`):
  `@mayf3/vehicle-pet` =
  `git+https://github.com/mayf3/vehicle-pet.git#a81809c3fbcc2b5b4b97917463bf75f862aeaee9`
  == EXPECTED_CURRENT_PRODUCTION_REF.
- SERVICE: leaf PID 81538 listening 127.0.0.1:3080 (the 灵动 post-apply
  leaf); HTTP 200 on `/`. Identity (from 灵动 APPLY record + live listener):
  `pnpm dsh web --trusted-host macbook-pro.tail84dd3d.ts.net` from
  `/Users/yanfenma/workspace/github/deepseek-harness`, default home `~/.dsh`,
  profile `web`.
- INSTALLED_RUNTIME: `~/.dsh/profiles/web/node_modules/@mayf3/vehicle-pet/lib/client.js`
  sha256 `43c9cf64…` byte-equal to the served
  `/plugins/@mayf3/vehicle-pet/client.js` (verified live) — the web app
  serves the installed package file directly, so served==installed is
  hash-provable. V3 markers present (smallSurfaceHeightPx ×1,
  data-menu-open ×2, vp-subject-boost ×2).
- LOCKFILE: profile `pnpm-lock.yaml` records the ref in 3 places (importers
  specifier+version, packages key, snapshots key); other floating plugins
  (deepseek-pet 35132a4, dsh-better-sidebar a5c52b3) unchanged since 灵动
  apply.
- MECHANISM (DSH source, read-only):
  `dsh plugin --profile web install` = `pnpm install` in the profile dir +
  `dsh.profile.bundles` reconcile (apps/cli/src/plugin.ts). DSH home
  resolution: `$DSH_HOME` else `~/.dsh` (packages/util/home-paths). The
  codeload tarball content == the git tree; the installed package therefore
  contains the TARGET_REF source tree, so installed-content identity is
  provable locally via `git archive <ref>` comparison without codeload auth.
- DISPOSABLE E2E prerequisites: pinned harness worktree
  `deepseek-harness-wt-vehicle-pet-overlay-f77b5a2f` present, installed and
  built (node_modules + apps/web/dist ✓); disposable-home launcher pattern
  exists (tests/dsh/e2e/launch-dsh-web.mjs); Owner Brave CDP 9222 reachable
  (Chrome/152) for state probes.
- REAL_PRODUCTION_MUTATION this Goal = FORBIDDEN (§16): the only real-
  production run is the read-only dry run a81809c→a81809c.

## Decisions recorded for implementation

- Tool location: `scripts/release/` (covered by existing `pnpm lint` scope);
  tests `tests/release/` as a new vitest `release` project; disposable E2E
  driver `scripts/release/e2e/run-disposable-e2e.mjs` (+ package script
  `verify:release`).
- CLI: `vehicle-pet-release <TARGET_40HEX>` (default preflight/plan,
  read-only), `--apply`, `rollback --receipt <dir>`, `evidence …`; exact
  40-hex only; receipts written to an operator-provided/default receipt
  directory outside git-tracked paths.
- Git truth: fetch-by-SHA from `origin` of the vehicle-pet repository
  (overridable `--vehicle-pet-repo` for hermetic tests); never
  reset/stash/checkout/pull any existing checkout; fresh detached worktree
  only for `git archive` content extraction.
- Runtime proof chain: lock resolution == TARGET_REF ∧ installed tree ==
  `git archive <ref>` (all tracked files except build output `lib/`) ∧
  served client.js sha256 == installed lib/client.js sha256.
- Drift gates: pre-install spec/lock consistency for non-vehicle-pet deps
  (stop before any install) + post-install lock diff classification
  (UNRELATED_DEPENDENCY_DRIFT → auto-revert bytes, reinstall preimage lock,
  STOP_BEFORE_RESTART); membership array byte-equality gate.
- Restart: fresh discovery only (listener + cmdline + env DSH_HOME match);
  TERM the recorded tree, relaunch recorded argv/cwd/allowlisted-env,
  detached; WEB_PORT before==after, health 200.
- State probe: read-only CDP (`--cdp-url`, default 9222) exact bytes of
  `vehicle-pet/overlay-preferences/v1`, `vehicle-pet/usage-ledger/v1`,
  `deepseek-pet:scale`, plus pet-engine IndexedDB summary; missing probe →
  apply postflight fails loud unless explicitly waived.
