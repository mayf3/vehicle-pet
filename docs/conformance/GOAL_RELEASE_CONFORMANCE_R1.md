# Conformance Record R1 — Goal 发布 (vehicle-pet release tooling)

```text
PRODUCT_AUTHORITY_BOUND = VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2 @ b64e2d0 (grammar);
  no Product Contract touched — operational tooling + assurance artifact
RELATED_AUTHORITIES = VEHICLE_PET_PRODUCT_DIRECTION_V1, CONFIGURABLE_PET_ENGINE_V3,
  DSH_PET_OVERLAY_ADAPTER_V3, VEHICLE_PET_PROGRESS_SOURCE_V2,
  DSH_USAGE_PROGRESS_SOURCE_V2 — all REUSE, unchanged, untouched
BASE_HEAD = b64e2d0dbadaa9ee1b7eb9814703568021adc58a (fresh origin/main at dispatch)
IMPLEMENTATION_HEAD = 40e357e9e760479e145421a34c103610e29ace55 (audit R1 candidate)
FINAL_HEAD = see git log of release/helper-v1 (BLOCKER_UNION + close-outs)
ENVIRONMENT = macOS (darwin 25.6.0 arm64), node v26.7.0, pnpm 10.28.1;
  real production DSH (~/.dsh, profile web, port 3080) READ-ONLY;
  disposable E2E: pinned harness worktree f77b5a2f + throwaway DSH home +
  port 3088 + throwaway CDP browser
EVALUATION_TIME = 2026-09-08 22:00 – 2026-09-09 01:40 (local)
CONFORMANCE_RESULT = VERIFIED (for the exact bound tuple above)
```

## Route

```text
AUTHORITY_ACTION = REUSE (PREFLIGHT_DECIDE_MINIMALLY, Owner-confirmed expectation)
PLAN_LEVEL = BRIEF (Owner Goal dispatch = the Brief; persisted as
  docs/investigations/GOAL_RELEASE_PREFLIGHT.md + GOAL_RELEASE_ROUTE_R1.json)
ASSURANCE_LEVEL = CONTROLLED (REUSE+CONTROLLED route: valid mandate + exact
  runbook + receipt + independent post-state verification; no new Spec)
EXECUTION_MANDATE = Owner Goal dispatch GOAL_NAME=发布 (OWNER_DISPATCH_UNIT=GOAL)
CONTROLLED_RUNBOOK = docs/runbooks/VEHICLE_PET_PRODUCTION_RELEASE_R1.md (v1.0.1)
```

## Executed evidence (all observations on disk, paths relative to repo root)

| Gate | Result | Evidence |
|---|---|---|
| DEFAULT_DRY_RUN (read-only plan) | PASS | unit `tests/release/` (NO_MUTATION_ON_DRY_RUN cases); E2E CASE_1 plan assertions (profile bytes/PID/served hash untouched) |
| EXACT_REF_ONLY | PASS | `tests/release/refs.test.ts`; E2E CASE_5: main/latest/8-hex/39-hex/41-hex/non-hex/unreachable-40hex/local-only-commit all exit 2 |
| NO_OP_SAME_REF | PASS | E2E CASE_2: plan+apply NO_OP_ALREADY_AT_TARGET, ZERO_MUTATION=YES, bytes/PID unchanged; real-production dry run |
| UNRELATED_LOCK_DRIFT_REJECTED | PASS | pre-install consistency gate + post-install classifier (unit-tested); E2E CASE_3: UNRELATED_DEPENDENCY_DRIFT phase PRE_INSTALL, pin/served/service untouched |
| CONTROLLED_RESTART | PASS | E2E CASE_1 apply: port 3088→3088, health PASS, fresh discovery + recorded-tree-only TERM/relaunch |
| RUNTIME_PROOF | PASS | three layers at target: lock resolution == a81809c3fb…, installed tree == files-projection of `git archive` (151 files), served client == installed (6,857,461 bytes) |
| STATE_PRESERVATION | PASS | E2E CASE_1 postflight: position/reducedMotion byte-equal, usage ledger 7→7 points non-regressing, engine IndexedDB preserved, scale unchanged |
| ROLLBACK_E2E | PASS | E2E CASE_4: rollback via CASE_1 receipt → pin restored cce0e9d24…, served bytes hash-identical to pre-upgrade build, RUNTIME_PROOF PASS |
| STALE_LOCAL_MAIN_SAFE | PASS | fixture tests + E2E CASE_6: REMOTE_BARE_FETCH_BY_SHA from origin, stale clone main + WIP untouched |
| EVIDENCE_PERSISTENCE_SAFE | PASS | `createEvidenceBranch` cuts docs-only branch from fresh origin/main; fixture test asserts base==fresh origin/main, diff-only docs/evidence, local checkout untouched |
| REAL_PRODUCTION_READ_ONLY_DRY_RUN | PASS | a81809c3fb… → a81809c3fb…: NO_OP_ALREADY_AT_TARGET, all 8 verdicts PASS (gitTruth REMOTE_BARE_FETCH_BY_SHA), ZERO_MUTATION=YES; post-run zero-change (pin unchanged, leaf PID 81538, port 3080, health 200) — receipt at docs/evidence/release/DRY_RUN_RECEIPT_2026-09-08.json |
| REAL_PRODUCTION_MUTATED | NO | above |

## Verification runs (executed results)

- `pnpm typecheck` 0 errors; `pnpm lint` 0 findings; `pnpm test:release`
  43/43 PASS (36 baseline + 7 re-audit regression tests).
- Disposable E2E `node scripts/release/e2e/run-disposable-e2e.mjs` —
  ALL CASES PASS (CASE_1..6, 51 checks), log at
  `docs/evidence/release/DISPOSABLE_E2E_2026-09-08.log`.
- Official real-production dry run re-executed with tool v1.0.1 (receiptId
  `2026-09-08T17-28-49-933Z-plan-a81809c3-39bffd`), verdicts all PASS.

## Independent reviews (exact Base/Head)

- Independent CODE audit R1 (Base b64e2d0, Head 40e357e): REJECT — 2
  blockers (B1 git-truth local-object shortcut fake PASS, executed and
  reproduced by the auditor; B2 state-compare unanchored origin fake PASS)
  + 9 findings. Re-audit R2 (Base b64e2d0, Head 649c6c1): **ACCEPT, 0
  blockers** — original counterexamples replayed against the fix
  (local-only commit now REJECTED; foreign-origin capture now
  UNAVAILABLE).
- Independent OPERATIONAL audit R1 (same coordinates): ACCEPT — 0
  blockers, 9 findings (env truncation, dead-port recovery documentation,
  supervisor residual, verify-state gap, IDB/membership wording, exit-code
  semantics, evidence housekeeping, receipt wording, plan-mode wording).
  Re-audit R2: **ACCEPT, 0 blockers** — 7/9 dispositions fully confirmed,
  4 sentence-level close-outs (runbook §1 mechanism sentence, §4
  allowlist phrasing, evidence-log gitignore negation, tool version bump)
  applied before merge.
- BLOCKER_UNION = one concentrated fix round (commit "fix(release): audit
  R1 BLOCKER_UNION …"), one re-audit per reviewer, both ACCEPT.

## Deviations and residuals (documented, non-blocking)

- Disposable E2E pet-mount is diagnostic-only: the pinned f77b5a2 harness
  gates plugin activation behind full onboarding; acceptance relies on the
  three-layer RUNTIME_PROOF (recorded in the E2E log as warnings).
- Known residual limitations are documented in the runbook (§6 exit-70 /
  IN_PROGRESS semantics, §7 dead-port manual recovery + supervisor
  KeepAlive boundary, §8 evidence worktree housekeeping) and in the audit
  records (ps-env heuristic for values containing `KEY=` shapes — fails
  closed).
- EXPANSION_TRIGGER: not fired (no platform/daemon/scheduler/multi-repo
  surface; package name, spec shape, served path, storage keys all
  hard-coded to the single proven path).
