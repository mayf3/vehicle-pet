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
