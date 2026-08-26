# DSH Pet Overlay Adapter V1 — Author Conformance Record

```text
SPEC_GOVERNANCE_MODE = COMPLIANCE
REPOSITORY = mayf3/vehicle-pet
IMPLEMENTATION_BASE_COMMIT = 5b9c6fa6395a08db66362fe42ee94c29187f8588
IMPLEMENTATION_COMMIT = ff37d34b7f32c3c0caee5e60bae437e9df4801d0
PRIMARY_GOVERNING_SPEC = DSH_PET_OVERLAY_ADAPTER_V1
GOVERNING_SPEC_ACCEPTED_HEAD = 73e667266f62e9de0aa100431e8eb64dcc679e47
PINNED_DSH_COMMIT = f77b5a2fcebc2d9138f6608a60636f2294868d42
ENVIRONMENT = macOS arm64; Node.js 26.7.0; pnpm 10.28.1; Chrome (Playwright channel)
DISPOSABLE_DSH_HOME = /tmp/vehicle-pet-overlay-dsh-home-r1
REMOTE_INSTALL_DSH_HOME = /tmp/vehicle-pet-overlay-dsh-home-remote-r1
EVALUATED_AT = 2026-08-24
IMPLEMENTATION_STATE = COMPLETE
VERIFICATION_STATE = SUFFICIENT (author-run local and pinned-Harness evidence)
CONFORMANCE = VERIFIED (author evaluation; independent audits not run)
CONTRACTS_TOTAL = 13
CONTRACTS_VERIFIED = 13
ACCEPTANCE_TOTAL = 18
ACCEPTANCE_VERIFIED = 18
AUTHOR_CONFORMANCE_EVIDENCE = PASS
INDEPENDENT_OVERLAY_AUDIT = NOT_RUN
INDEPENDENT_OVERLAY_EXPERIENCE_AUDIT = NOT_RUN
READY_TO_MERGE = NO
```

This record binds author evidence to implementation commit `ff37d34b7f32c3c0caee5e60bae437e9df4801d0`. The documentation commit containing this record does not change evaluated product behavior. “VERIFIED” below is an author conformance conclusion, not an independent audit.

## Executed observations

| Observation | Command / environment | Result | Bounded evidence / limitation |
|---|---|---|---|
| `OBS-OVERLAY-001` | `verify_governance.py --target . --require-accepted` | PASS | Accepted governance and active adapter authority at the implementation base. |
| `OBS-OVERLAY-002` | `pnpm install --frozen-lockfile` | PASS | Lockfile unchanged; pnpm reported ignored dependency build scripts, but committed/pre-existing binaries executed successfully. |
| `OBS-OVERLAY-003` | `pnpm verify` | PASS | 152 unit/DOM tests, 12 standalone browser tests, production build, 18 architecture contracts, 54 deterministic assets. |
| `OBS-OVERLAY-004` | `pnpm verify:dsh` | PASS | Typecheck/lint/contracts; deterministic DSH build; package/bundle/lifecycle gates; 38 DSH unit/DOM tests; 16 pinned-Harness browser tests. |
| `OBS-OVERLAY-005` | `pnpm check:dsh-bundle` | PASS | 2,195,905-byte client, 54 inlined assets, host React external, no ReactDOM/root/glob/network signatures, reproducible rebuild. |
| `OBS-OVERLAY-006` | `pnpm check:dsh-package` | PASS | 131-file, 1,677,973-byte packed artifact allowlist. |
| `OBS-OVERLAY-007` | `pnpm check:dsh-lifecycle` | PASS | Local add, update, remove, reinstall in `/tmp/vehicle-pet-overlay-dsh-home-lifecycle-r1`; exactly one profile bundle membership after add/update/reinstall and zero after remove. |
| `OBS-OVERLAY-008` | `pnpm test:dsh:e2e` | PASS, 16/16 | Real Chrome against pinned Harness Web; disposable home; production plugin; structured running/input/completed/failed/cancelled, reload seeding, session switching, UI and network assertions. |
| `OBS-OVERLAY-009` | `dsh plugin --profile web add github:mayf3/vehicle-pet#ff37d34…` | PASS | Exact pushed implementation commit installed into a second clean disposable home; no allowBuilds interaction was requested. Browser behavior is bounded by the identical artifact exercised in `OBS-OVERLAY-008`. |
| `OBS-OVERLAY-010` | `git status` / `git diff --check` on both worktrees | PASS | Pinned DSH worktree clean; no DSH Core or accepted Spec change. |

Evidence image: [`DSH_PET_OVERLAY_ADAPTER_V1_HARNESS.webp`](DSH_PET_OVERLAY_ADAPTER_V1_HARNESS.webp), a six-frame contact sheet from the pinned-Harness run: VISIBLE, PANEL_OPEN, COLLAPSED, full journey, Working, and Needs input. It contains only Vehicle Pet assets.

## Contract matrix

| Contract | Implementation | Executed evidence | Result / limitation |
|---|---|---|---|
| `CTR-OVERLAY-001` | `package.json`, `cordis.patch.yml`, `src/dsh/index.ts`, build/package scripts | `OBS-004..006,009` | VERIFIED; external bundle/client package, no Core edit. |
| `CTR-OVERLAY-002` | `src/dsh/client/index.ts` | `OBS-004,008` | VERIFIED; one additive `shell.overlay` registration, stable `vehicle-pet` id. |
| `CTR-OVERLAY-003` | `useOverlayDrag.ts`, preferences | `OBS-004,008` | VERIFIED; threshold, pointer capture, normalized persistence, keyboard movement, resize clamp. |
| `CTR-OVERLAY-004` | `VehiclePetOverlay.tsx`, `VehiclePetPanel.tsx` | `OBS-004,008` | VERIFIED; VISIBLE/PANEL_OPEN/COLLAPSED only; 112/320/36 geometry. |
| `CTR-OVERLAY-005` | `VehiclePetDialog.tsx` | `OBS-004,008` | VERIFIED; same subtree/Engine, modal semantics, focus trap/restore, no iframe/root. |
| `CTR-OVERLAY-006` | one `PetEngineProvider`, `OverlayProgressSource.ts` | `OBS-003,004,008` | VERIFIED; one zero-point placeholder source; shared Pack/progress/storage authority. |
| `CTR-OVERLAY-007` | `session-state-adapter.ts`, terminal dispatcher | `OBS-004,008` | VERIFIED; typed structured states, priority, deterministic edge handling, visual-only dispatch. |
| `CTR-OVERLAY-008` | generated asset map and bundle gate | `OBS-004,005` | VERIFIED; both Pack manifests and all 54 assets match; no runtime glob/dev server/network. |
| `CTR-OVERLAY-009` | DSH esbuild configuration and scans | `OBS-004,005,008` | VERIFIED; host React 18, no second runtime/root or invalid-hook-call. |
| `CTR-OVERLAY-010` | `preferences.ts` | `OBS-004,008` | VERIFIED; versioned ratios/collapse/reduced-motion, corrupt/throwing storage fallback, cross-tab synchronization. |
| `CTR-OVERLAY-011` | typed `useSessions` onboarding projection | `OBS-004,008` | VERIFIED; zero DOM/focus/pointer footprint and same-mount restoration; no route/DOM guessing. |
| `CTR-OVERLAY-012` | Fiber effects, React cleanup, CLI lifecycle gate | `OBS-004,007,008` | VERIFIED; reload does not duplicate; remove drops bundle membership; local runtime add is one overlay. Explicit dev-watcher HMR was not used; reload/restart path was exercised. |
| `CTR-OVERLAY-013` | progress source boundary and tests | `OBS-003,004,008` | VERIFIED; all session reactions leave progress, keepsakes, receipts and active Pack unchanged. |

## Acceptance matrix

| Acceptance | Evidence | Result |
|---|---|---|
| `ACC-OVERLAY-001` | package/exports/patch/build/package gates | VERIFIED |
| `ACC-OVERLAY-002` | one `shell.overlay` DOM root and lifecycle membership checks | VERIFIED |
| `ACC-OVERLAY-003` | default bottom-right, 112px browser assertion | VERIFIED |
| `ACC-OVERLAY-004` | click toggle and authorized 320px panel assertions | VERIFIED |
| `ACC-OVERLAY-005` | 36px launcher collapse/restore assertions | VERIFIED |
| `ACC-OVERLAY-006` | drag, refresh ratios, resize clamp, arrow/Shift movement | VERIFIED |
| `ACC-OVERLAY-007` | six structured session states and priority unit/browser matrix | VERIFIED |
| `ACC-OVERLAY-008` | terminal identity, cold/loading seeding, >256 turns, duplicate/reload/switch tests | VERIFIED |
| `ACC-OVERLAY-009` | session reactions retain progress 0 and do not change growth authorities | VERIFIED |
| `ACC-OVERLAY-010` | React singleton/createRoot/runtime scans and Chrome console assertion | VERIFIED |
| `ACC-OVERLAY-011` | preference corruption/quota/getter/removal/multi-tab tests | VERIFIED |
| `ACC-OVERLAY-012` | typed onboarding hide/restore tests | VERIFIED |
| `ACC-OVERLAY-013` | local add/update/remove/reinstall plus real pinned local install | VERIFIED |
| `ACC-OVERLAY-014` | exact Git commit install in second disposable home | VERIFIED |
| `ACC-OVERLAY-015` | reload/repeated navigation singleton and lifecycle removal checks | VERIFIED |
| `ACC-OVERLAY-016` | in-Harness journey dialog, accessibility and focus restore | VERIFIED |
| `ACC-OVERLAY-017` | no external browser requests, iframe, localhost:5199 or second frame | VERIFIED |
| `ACC-OVERLAY-018` | standalone `pnpm verify` including 12 browser cases | VERIFIED |

## Boundary confirmations

```text
ACCEPTED_SPEC_FILES_CHANGED = NO
DSH_TRACKED_FILES_CHANGED = NO
USER_DSH_PROFILE_CHANGED = NO
REAL_TOKEN_INTEGRATION_CREATED = NO
DSH_TOKEN_TO_PROGRESS_CREATED = NO
DEEPSEEK_HARNESS_CORE_CHANGED = NO
SECOND_REACT_RUNTIME = NO
EXTERNAL_PET_NETWORK_CALLS = 0
PNPM_DEV_RUNNING = NO
PORT_5199_LISTENING = NO
```

## Remaining independent work

Independent overlay code/contract audit and independent experience audit are intentionally not claimed. Owner merge readiness remains `NO` until those separate audits pass and the Owner decides to merge.

## Independent Overlay Audit R1 amendment record

```text
INDEPENDENT_OVERLAY_AUDIT_R1_RESULT =
REQUEST_CHANGES

INDEPENDENT_OVERLAY_AUDIT_R1_HEAD =
751d9927065300e45775bcfc521cf24108380888

INDEPENDENT_OVERLAY_AUDIT_R1_BLOCKERS =
4

R1_AMENDMENT_IMPLEMENTATION_HEAD =
ea6b95a0fd722ed7a79b66d0f6e9d0def04a77fd

R1_B1_SECOND_SESSION_LIFECYCLE_CLOSED =
YES

R1_B2_INDEXEDDB_DISPOSAL_CLOSED =
YES

R1_B3_HMR_RESOURCE_INVENTORY_CLOSED =
YES

R1_B4_ONBOARDING_MATRIX_CLOSED =
YES

BLOCKERS_CLAIMED_CLOSED =
4

INDEXEDDB_OPEN_CONNECTIONS_AFTER_DISPOSE =
0

CLIENT_HMR_GENERATION_TEST =
PASS

RESOURCE_DISPOSED =
RESOURCE_BASELINE

TARGETED_SECOND_SESSION_REPEAT =
5/5 PASS

PINNED_DSH_E2E =
16/16 PASS

PNPM_VERIFY =
PASS

PNPM_VERIFY_DSH =
PASS

DISPOSABLE_DSH_HOME =
/tmp/vehicle-pet-overlay-dsh-home-amend-r1

PINNED_DSH_COMMIT =
f77b5a2fcebc2d9138f6608a60636f2294868d42

INDEPENDENT_OVERLAY_AUDIT_AFTER_AMENDMENT =
NOT_RUN

READY_FOR_OVERLAY_REAUDIT =
YES

READY_TO_MERGE =
NO
```

| R1 blocker | Fix path | Regression evidence | Contract / Acceptance | Executed result |
|---|---|---|---|---|
| B1 — second Session lifecycle | `tests/dsh/e2e/overlay.spec.ts`, `tests/dsh/e2e/global-setup.ts`, `tests/dsh/e2e/mock-supervisor.mjs`, structured binding handshake in `src/dsh/client/session-state-adapter.ts` and `VehiclePetOverlay.tsx` | `structured session lifecycle drives the pet --repeat-each=5`; typed list/current, editable composer, adapter generation rebind, running, completed, new recorder, and no old terminal replay | `CTR-OVERLAY-007`, `CTR-OVERLAY-013`; `ACC-OVERLAY-007`, `ACC-OVERLAY-008`, `ACC-OVERLAY-015` | PASS, 5/5 against disposable pinned Harness |
| B2 — IndexedDB disposal | owned asynchronous acquisition/disposal in `src/dsh/client/VehiclePetOverlay.tsx` | `tests/dsh/unit/owned-storage-lifecycle.test.ts`: resolve before/after cleanup, repeated mount/unmount, HMR replacement, initialization failure, external fallback ownership | `CTR-OVERLAY-010`, `CTR-OVERLAY-012`; `ACC-OVERLAY-014`, `ACC-OVERLAY-015` | PASS, 6/6; open connections after dispose = 0 |
| B3 — HMR and resource inventory | build generation marker plus actual pinned client-watcher replacement; complete fake-fiber inventory | `tests/dsh/e2e/overlay.spec.ts` case 27 and `tests/dsh/dom/hmr-resource-lifecycle.test.tsx` | `CTR-OVERLAY-002`, `CTR-OVERLAY-012`; `ACC-OVERLAY-002`, `ACC-OVERLAY-014`, `ACC-OVERLAY-015` | PASS; at most one slot entry; generation 1 disposed before generation 2; final inventory equals baseline |
| B4 — onboarding matrix | typed `SessionListState` remains the sole suppression input | `tests/dsh/dom/overlay.test.tsx`: VISIBLE, PANEL_OPEN, COLLAPSED, COLLAPSED reload, ordinary conversation/settings/workspace/non-ready no-current, and DOM/copy/class/path invariance | `CTR-OVERLAY-011`; `ACC-OVERLAY-012` | PASS, complete matrix |

The R1 amendment evidence is author-executed blocker-closure evidence bound to implementation commit `ea6b95a0fd722ed7a79b66d0f6e9d0def04a77fd`. It does not convert the independent audit result to PASS or ACCEPT; an independent R2 re-audit on the final amendment Head remains required.

## Independent Overlay Audit R2 and experience amendment record

```text
INDEPENDENT_OVERLAY_AUDIT_R2_RESULT =
ACCEPT

INDEPENDENT_OVERLAY_AUDIT_R2_HEAD =
de974d4a8be3f742535e9177d67e84cf5fee8dc4

INDEPENDENT_OVERLAY_EXPERIENCE_AUDIT_R2_RESULT =
REVISE

INDEPENDENT_OVERLAY_EXPERIENCE_AUDIT_R2_HEAD =
de974d4a8be3f742535e9177d67e84cf5fee8dc4

INDEPENDENT_OVERLAY_EXPERIENCE_AUDIT_R2_BLOCKERS =
2

R2_X1_SCENE_GEOMETRY_CLOSED =
YES

R2_X2_WORKSPACE_SAFE_DEFAULT_CLOSED =
YES

R2_P1_LOCALE_LIVE_SYNC_FIXED =
YES

EXPERIENCE_BLOCKERS_CLAIMED_CLOSED =
2

R2_TARGETED_SECOND_SESSION_REPEAT =
5/5 PASS

R2_PINNED_DSH_E2E =
21/21 PASS

R2_PNPM_VERIFY =
PASS

R2_PNPM_VERIFY_DSH =
PASS

R2_GOVERNANCE_VERIFY =
PASS

R2_DISPOSABLE_DSH_HOME =
/tmp/vehicle-pet-overlay-amend-r2

INDEPENDENT_OVERLAY_AUDIT_AFTER_AMENDMENT_R2 =
NOT_RUN

INDEPENDENT_OVERLAY_EXPERIENCE_AUDIT_AFTER_AMENDMENT_R2 =
NOT_RUN

READY_FOR_OVERLAY_REAUDIT_R3 =
YES

READY_FOR_OVERLAY_EXPERIENCE_REAUDIT_R3 =
YES

READY_TO_MERGE =
NO
```

| R2 finding | Amendment | Mechanical / browser evidence | Claimed result |
|---|---|---|---|
| X1 — compact and Full Journey geometry | Static `translate(-50%, -50%)` is always retained; reduced motion removes animation but not layout; frame layers fill the scene; the generic compact viewport applies one Pack-neutral legibility floor. | `SCENE_COMPACT_GEOMETRY_TEST`, `SCENE_FULL_JOURNEY_GEOMETRY_TEST`, `REDUCED_MOTION_STATIC_GEOMETRY_TEST`; Fleet and Seedling pinned-Harness screenshots. | CLOSED |
| X2 — default Composer overlap | Pinned `layout` service inspection found panel actions but no typed safe-area geometry. Uncustomized records use deterministic `SAFE_BOTTOM_RIGHT` with a 176px bottom work-entry inset; first drag/keyboard move sets `positionCustomized`; legacy non-corner ratios migrate as customized. Production reads no Harness DOM, copy, class, observer, or route. | `DEFAULT_COMPOSER_OVERLAP_TEST`, `MOBILE_COMPOSER_OVERLAP_TEST`, `USER_CUSTOM_POSITION_PRESERVATION_TEST`; desktop and 390px bounding-box overlap = 0. | CLOSED |
| P1 — live locale propagation | Harness locale remains the only authority and synchronizes into the same mounted Engine through `setLocale`; the embedded provider does not write `<html lang>`. | `HARNESS_LOCALE_LIVE_SYNC_TEST` covers `zh-CN → en → zh-CN` across overlay chrome, Pack, stage, next target, keepsake, and Full Journey without remount or progress loss. | FIXED |

The R2 amendment does not change the accepted Specs or the R1 B1–B4 semantics. Independent code and experience re-audits after this amendment remain separate work; this author record does not convert either post-amendment result from `NOT_RUN`.

## Final R3 blocker-resolution amendment record

```text
R3_AMENDMENT_IMPLEMENTATION_HEAD =
7c59bb0184f04e199923f676ded345b1df692623

R3_G1_COMPACT_ALL_LEVEL_GEOMETRY_CLOSED =
YES

R3_G2_REAL_HARNESS_LIFECYCLE_EVIDENCE_CLOSED =
YES

R3_G3_SETTINGS_WORKSPACE_ACTION_OVERLAP_CLOSED =
YES

COMPACT_SUBJECT_INTERSECTION_RATIO_MIN =
0.90

COMPACT_MILESTONE_SUBJECT_OVERLAP_RATIO =
0

COMPACT_BLACK_PIXEL_RATIO_MAX =
0.05

REDUCED_MOTION_COMPACT_BBOX_DELTA_MAX_PX =
2

FULL_JOURNEY_GEOMETRY =
PASS

REAL_IDB_DELETE_BLOCKED_AFTER_DISPOSE =
NO

REAL_IDB_DELETE_SUCCESS_AFTER_DISPOSE =
YES

REAL_IDB_OPEN_CONNECTIONS_AFTER_DISPOSE =
0

REAL_HARNESS_ACTIVATION_DISPOSAL_CYCLES =
5 PER TEST; 5/5 REPEATED RUNS PASS

MAX_VEHICLE_PET_INSTANCES =
1

OLD_GENERATION_CALLBACKS_AFTER_REPLACE =
0

TERMINAL_REPLAY_AFTER_REPLACE =
0

RESOURCE_DISPOSED =
RESOURCE_BASELINE

SETTINGS_PRIMARY_ACTION_OVERLAP_PX2 =
0

WORKSPACE_PRIMARY_ACTION_OVERLAP_PX2 =
0

UNIFIED_SAFE_INSET_CHANGED =
NO (MEASUREMENT PASSED)

R3_PNPM_VERIFY =
PASS (157 UNIT/DOM + 12 STANDALONE BROWSER + 18 CONTRACT TESTS)

R3_PNPM_VERIFY_DSH =
PASS (18 CONTRACT + 53 DSH UNIT/DOM + 23 PINNED-HARNESS BROWSER TESTS)

R3_GOVERNANCE_VERIFY =
PASS

HISTORICAL_R1_R2_R3_AUDIT_DECISIONS_PRESERVED =
YES

ACCEPTED_SPEC_FILES_CHANGED =
NO

DSH_TRACKED_FILES_CHANGED =
NO

READY_FOR_R4_CODE_AUDIT =
YES

READY_FOR_R4_EXPERIENCE_AUDIT =
YES

READY_TO_MERGE =
NO
```

| R3 gate | Amendment | Real / mechanical evidence | Claimed result |
|---|---|---|---|
| G1 — 112px compact focus | `PetSceneRenderer` now has Pack-neutral `standalone`, `full-journey`, and `compact-overlay` presentation modes. Compact renders only the subject over a generic light surface; milestone, aggregate, Pack world layers, and interaction copy are absent while stage information remains available through accessibility and the Panel. Full Journey remains plan-complete. | `COMPACT_ALL_LEVEL_PIXEL_MATRIX_TEST`, `COMPACT_MILESTONE_SUBJECT_OVERLAP_TEST`, `COMPACT_BLACK_VOID_TEST`, `REDUCED_MOTION_COMPACT_GEOMETRY_TEST`, and `SCENE_FULL_JOURNEY_GEOMETRY_TEST`; Fleet L1–L12 plus Seedling seed/sprout/tree/forest in normal compact, reduced compact, and Full Journey. | CLOSED |
| G2 — real IndexedDB and HMR inventory | Pinned-Harness browser instrumentation tracks plugin slot/DOM/portal/style/subscriptions/global listeners/timers/observers/pointer capture/IndexedDB. A test-only esbuild fixture drives the all-level matrix without adding progress mutation to production. Real client-watcher replacement alternates active and disabled generations and verifies complete disposal before reactivation. | `REAL_HARNESS_INDEXEDDB_DISPOSAL_TEST` and `REAL_HARNESS_HMR_RESOURCE_INVENTORY_TEST`; delete succeeds unblocked with zero connections after every disposal; five cycles per test and `--repeat-each=5`; `RESOURCE_DISPOSED = RESOURCE_BASELINE`, one instance maximum, no old callbacks or terminal replay. | CLOSED |
| G3 — Settings and Workspace actions | Existing unified safe default is unchanged because real geometry measurements passed. | `SETTINGS_PRIMARY_ACTION_OVERLAP_TEST` and `WORKSPACE_PRIMARY_ACTION_OVERLAP_TEST` measure both the Pet and open Panel against real accessible primary controls; overlap is zero. Existing desktop/mobile Composer tests remain green. | CLOSED |

Evidence image: [`dsh-pet-overlay-v1-r3-final.webp`](../evidence/dsh-pet-overlay-v1-r3-final.webp), a 48-frame matrix containing every required Fleet and Seedling level in normal compact, reduced compact, and Full Journey modes from the pinned Harness run.

This R3 amendment is author-executed blocker-closure evidence bound to implementation commit `7c59bb0184f04e199923f676ded345b1df692623`. It does not rewrite any historical independent audit decision. Fresh independent R4 code and experience audits must run on the final documentation Head before any merge decision; the PR remains Open, Draft, unmerged, and `READY_TO_MERGE = NO`.
