# Configurable Pet Engine V1 — Contract Conformance Record

```text
SPEC_GOVERNANCE_MODE = COMPLIANCE
REPOSITORY = mayf3/vehicle-pet
IMPLEMENTATION_BASE_COMMIT = e4f87c19b6a40ebd152c4709ebf073289cb889a7
GOVERNING_SPEC = CONFIGURABLE_PET_ENGINE_V1
GOVERNING_SPEC_ACCEPTED_HEAD = 6b28e0b4a243384dd84198d74cce9c5f9e2b1dba
CORE_AND_FLEET_COMMIT = b8d8e5b5e2ccb3a16128a135718eec91fc5ba0d6
SEEDLING_CONFORMANCE_COMMIT = ed96e1ec7a77e7a54f797dd02b70057faf678d34
AMENDMENT_R1 = 868bd0a414f4f15410924dc091ba9d2c8c613ee5
ENVIRONMENT = macOS arm64, Node.js 22, pnpm 10.28.1, local Chrome
EVALUATED_AT = 2026-08-22T07:44:52Z
IMPLEMENTATION_STATE = COMPLETE
VERIFICATION_STATE = SUFFICIENT (author-run local evidence)
CONFORMANCE = VERIFIED (author evaluation; not an independent audit)
PRODUCT_DIRECTION_CONTRACTS = 11
ENGINE_CONTRACTS = 30
CONTRACTS_TOTAL = 41
CONTRACTS_VERIFIED = 41
CONTRACTS_DRIFTED = 0
CONTRACTS_UNKNOWN = 0
CONTRACTS_NOT_APPLICABLE = 0
AUTHOR_CONFORMANCE_EVIDENCE = PASS
INDEPENDENT_ENGINE_AUDIT = REQUEST_CHANGES (R1 reviewed 2512398cfcb47ea450354a8675473620fdac8318)
INDEPENDENT_EXPERIENCE_AUDIT = REVISE (R1 reviewed 2512398cfcb47ea450354a8675473620fdac8318)
```

This record evaluates the amended product code at `868bd0a414f4f15410924dc091ba9d2c8c613ee5`. The documentation commit containing this record does not alter evaluated product behavior. `VERIFIED` below means the author linked an executed local Observation to the pinned Contract; it does **not** claim independent review.

## Executed observations

| Observation | Command / method | Result | Bounded provenance and limitation |
|---|---|---|---|
| `OBS-IMP-001` | `pnpm typecheck` | PASS | TypeScript production, tests, and tool configs; local environment only. |
| `OBS-IMP-002` | `pnpm lint` | PASS, 0 warnings/errors | `src`, `tests`, `scripts`; static lint is not runtime proof. |
| `OBS-IMP-003` | `pnpm test` | PASS, 24 files / 152 tests | Unit/DOM integration with fake IndexedDB; simulated same-origin concurrency and mounted renderer measurements. |
| `OBS-IMP-004` | `pnpm test:e2e` | PASS, 12 browser scenarios | Local Chrome, local Vite resources only; includes clean product route, Fleet L1–L4 visual distinction, and live locale/lang synchronization. |
| `OBS-IMP-005` | `pnpm build` | PASS | Vite production build including both Packs. |
| `OBS-IMP-006` | `pnpm check:contracts` | PASS, 14 checks | Mechanical dependency, vocabulary, and forbidden-capability checks. |
| `OBS-IMP-007` | `pnpm assets:check` | PASS, 54 assets | Re-generated 36 fleet and 18 seedling assets and compared bytes/pixels/metadata. |
| `OBS-IMP-008` | `verify_governance.py --target . --require-accepted` | PASS | Vendored governance accepted and byte-matched lock at the implementation base. |
| `OBS-IMP-009` | changed-path diff for Commit 2 | PASS, `src/engine/**` and `src/react/**` changes = 0 | Proves the second Pack was added without Engine/React/schema edits. |
| `OBS-IMP-010` | browser showcase capture | PASS | Author-generated visual board; not an independent experience audit. |

## Product Direction contract matrix

| Contract | Implementation path | Test / mechanical evidence | Result and Evidence | Limitation / independent audit |
|---|---|---|---|---|
| `CTR-DIR-001` | `src/engine/**`, assembly in `src/packs/bundledRegistry.ts` | `architecture.test.ts`, `seedling-conformance.test.ts` | VERIFIED; `EVD-IMP-DIR-001` SATISFIES from `OBS-IMP-003,006,009` | Independent engine audit required. |
| `CTR-DIR-002` | strict manifest + bundle seam | Commit-2 changed-path diff | VERIFIED; `EVD-IMP-DIR-002` from `OBS-IMP-009` | One conformance Pack proves V1 seam, not future Packs. |
| `CTR-DIR-003` | `ProgressSource`, `MockProgressSource` | source-registration/static forbidden-capability checks | VERIFIED; `EVD-IMP-DIR-003` from `OBS-IMP-003,006` | Static/runtime local audit only. |
| `CTR-DIR-004` | `src/packs/autonomous-fleet/**` | `fleet-freeze.test.ts`, vocabulary check | VERIFIED; `EVD-IMP-DIR-004` from `OBS-IMP-003,006` | Pack narrative correctness awaits independent review. |
| `CTR-DIR-005` | `PetEngine.setActivePack` | `engine-pack-lifecycle.test.ts`, E2E Pack switch | VERIFIED; `EVD-IMP-DIR-005` from `OBS-IMP-003,004` | Local device scope. |
| `CTR-DIR-006` | schema/state/UI omit compulsion mechanics | forbidden vocabulary/capability inventory | VERIFIED; `EVD-IMP-DIR-006` from `OBS-IMP-006` | Human UX interpretation awaits experience audit. |
| `CTR-DIR-007` | generic React components, journal, events, keepsakes | presentation tests + E2E interaction/fallback/reduced motion | VERIFIED; `EVD-IMP-DIR-007` from `OBS-IMP-003,004,010` | Visual quality not independently audited. |
| `CTR-DIR-008` | static `bundledRegistry.ts`; no installer | architecture checks | VERIFIED; `EVD-IMP-DIR-008` from `OBS-IMP-006` | Build-time inventory only. |
| `CTR-DIR-009` | no real Token/DSH/sync modules | forbidden-capability checks | VERIFIED; `EVD-IMP-DIR-009` from `OBS-IMP-006` | Negative static evidence. |
| `CTR-DIR-010` | implementation began from merged accepted base | git/base and governance coordinates | VERIFIED; `EVD-IMP-DIR-010` from `OBS-IMP-008` | Historical activation verified at fixed Base. |
| `CTR-DIR-011` | concrete limits live in child Spec implementation | governance verification + schema/preset tests | VERIFIED; `EVD-IMP-DIR-011` from `OBS-IMP-003,008` | Parent text itself remains authority evidence. |

## Engine contract matrix

| Contract | Implementation path | Test / mechanical evidence | Result and Evidence | Limitation / independent audit |
|---|---|---|---|---|
| `CTR-PET-001` | `src/engine/types/core.ts`, `src/prototype/MockProgressSource.ts` | `engine-ingestion.test.ts`, architecture source inventory | VERIFIED; `EVD-IMP-PET-001` from `OBS-IMP-003,006` | Only mock source exercised, as required. |
| `CTR-PET-002` | `validation/validate-snapshot.ts`, `progress/derive.ts`, `engine.ts` | snapshot/derive/ingestion boundary corpus | VERIFIED; `EVD-IMP-PET-002` from `OBS-IMP-003` | In-memory runtime ordering only. |
| `CTR-PET-003` | strict JSON Schema + `validation/validate-pack.ts` | `validate-pack.test.ts` invalid corpus, both bundled Packs | VERIFIED; `EVD-IMP-PET-003` from `OBS-IMP-003` | File existence supplied by bundle resolver. |
| `CTR-PET-004` | asset path schema and executable-content rejection | validator corpus + static capability check | VERIFIED; `EVD-IMP-PET-004` from `OBS-IMP-003,006` | Negative static/runtime evidence. |
| `CTR-PET-005` | `packs/registry.ts`, `engine.setActivePack` | lifecycle unit + Pack-switch E2E | VERIFIED; `EVD-IMP-PET-005` from `OBS-IMP-003,004` | Local preference scope. |
| `CTR-PET-006` | atomic registry creation and fallback paths | `engine-pack-lifecycle.test.ts` | VERIFIED; `EVD-IMP-PET-006` from `OBS-IMP-003` | Fault injection is in-process. |
| `CTR-PET-007` | `rendering/render-plan.ts`, one `PetSceneRenderer` | fleet + seedling deterministic plan tests | VERIFIED; `EVD-IMP-PET-007` from `OBS-IMP-003,009` | Byte identity within one JS runtime. |
| `CTR-PET-008` | caps/allocation in `render-plan.ts` | multi-population budget tests | VERIFIED; `EVD-IMP-PET-008` from `OBS-IMP-003` | DOM count asserted from plan and browser surface. |
| `CTR-PET-009` | domain-neutral `src/engine` and `src/react` | zero-match mechanical vocabulary audit | VERIFIED; `EVD-IMP-PET-009` from `OBS-IMP-006` | Enumerated frozen vocabulary. |
| `CTR-PET-010` | `src/packs/autonomous-fleet/manifest.json` | `fleet-freeze.test.ts`, asset check | VERIFIED; `EVD-IMP-PET-010` from `OBS-IMP-003,007` | Narrative review author-run. |
| `CTR-PET-011` | `src/packs/seedling-fixture/**` | same-validator/derive/render tests + zero Engine diff | VERIFIED; `EVD-IMP-PET-011` from `OBS-IMP-003,009` | Conformance fixture, not second production Pack. |
| `CTR-PET-012` | `presentation/receipts.ts`, storage keys | receipt identity and crossing tests | VERIFIED; `EVD-IMP-PET-012` from `OBS-IMP-003` | Local storage adapter scope. |
| `CTR-PET-013` | memory + IndexedDB atomic claim adapters | dual-connection race/remount/failure tests | VERIFIED; `EVD-IMP-PET-013` from `OBS-IMP-003` | fake-indexeddb supplements browser E2E; independent race audit pending. |
| `CTR-PET-014` | `presentation/ceremony.ts`, `UpgradeCeremony.tsx` | huge jump unit + merged ceremony E2E | VERIFIED; `EVD-IMP-PET-014` from `OBS-IMP-003,004` | Browser timer scheduling is local Chrome. |
| `CTR-PET-015` | reduced-motion presets and React ceremony | preset tests + reduced-motion E2E | VERIFIED; `EVD-IMP-PET-015` from `OBS-IMP-003,004` | Assistive-technology audit not run. |
| `CTR-PET-016` | DailyGreeting, Host feedback, subject interaction | presentation tests + Host/click browser scenarios | VERIFIED; `EVD-IMP-PET-016` from `OBS-IMP-003,004` | Idle aesthetics await experience audit. |
| `CTR-PET-017` | `AssetFallback.tsx`, renderer fallback chain | asset-failure E2E + plan accessibility tests | VERIFIED; `EVD-IMP-PET-017` from `OBS-IMP-003,004` | Synthetic fault injection. |
| `CTR-PET-018` | immutable static Pack registry; version-domain baseline | version lifecycle tests + installer absence check | VERIFIED; `EVD-IMP-PET-018` from `OBS-IMP-003,006` | No runtime distribution exists by design. |
| `CTR-PET-019` | localization resolver + whitelist schema | locale fallback and unknown-preset tests | VERIFIED; `EVD-IMP-PET-019` from `OBS-IMP-003` | Two locales only, as frozen. |
| `CTR-PET-020` | `src/prototype/**` | both-Pack browser E2E + transport route guard | VERIFIED; `EVD-IMP-PET-020` from `OBS-IMP-004,006` | Local Vite asset requests allowed. |
| `CTR-PET-021` | deferred integrations absent | forbidden import/call inventory | VERIFIED; `EVD-IMP-PET-021` from `OBS-IMP-006` | Negative static evidence. |
| `CTR-PET-022` | frozen fleet scenes/presets and structural fingerprints | structural-difference tests + showcase | VERIFIED; `EVD-IMP-PET-022` from `OBS-IMP-003,010` | Visual quality awaits independent experience audit. |
| `CTR-PET-023` | keepsake manifest/storage/unlock flow | 11/3 counts, crossing/switch/reset/version/failure tests | VERIFIED; `EVD-IMP-PET-023` from `OBS-IMP-003,004` | Local-device retention only. |
| `CTR-PET-024` | strict Host dispatcher + React injection boundary | malformed/duplicate/three-status unit and E2E | VERIFIED; `EVD-IMP-PET-024` from `OBS-IMP-003,004` | In-process injection only. |
| `CTR-PET-025` | static registry, persisted active Pack, terminal state | lifecycle unit + prototype demo entry | VERIFIED; `EVD-IMP-PET-025` from `OBS-IMP-003,004,006` | Fault-injected invalid default. |
| `CTR-PET-026` | `appliedBySubject` runtime record | stale/duplicate/regression/source-error tests | VERIFIED; `EVD-IMP-PET-026` from `OBS-IMP-003` | Session-local ordering record. |
| `CTR-PET-027` | source/subject key domains and reset | source mismatch and namespace tests | VERIFIED; `EVD-IMP-PET-027` from `OBS-IMP-003` | Old data intentionally retained. |
| `CTR-PET-028` | atomic greeting claim | multi-adapter/day-roll tests | VERIFIED; `EVD-IMP-PET-028` from `OBS-IMP-003` | Device-local timezone simulated. |
| `CTR-PET-029` | silent `setActivePack` and baseline | round-trip/version tests + Pack-switch E2E | VERIFIED; `EVD-IMP-PET-029` from `OBS-IMP-003,004` | Build-time version fixture. |
| `CTR-PET-030` | `rendering/presets.ts`, plan accessibility semantics | per-preset formulas, aggregate and subject-name tests | VERIFIED; `EVD-IMP-PET-030` from `OBS-IMP-003` | Screen-reader manual audit not run. |

## Visual evidence

[`CONFIGURABLE_PET_ENGINE_V1_SHOWCASE.webp`](CONFIGURABLE_PET_ENGINE_V1_SHOWCASE.webp) contains twelve states:

- autonomous-fleet: L1, L2, L3, L4, L7, L10, L11, L12, including the four frozen road-test states side-by-side;
- seedling-fixture: seed, sprout, tree, forest.

The image is an author-generated observation (`OBS-IMP-010`), not an independent experience audit.

## Amendment R1 — independent audit blocker closure

```text
AMENDMENT_R1 = 868bd0a414f4f15410924dc091ba9d2c8c613ee5
BLOCKERS_ADDRESSED = E01,E02,E03,E04,E05,E06,E07,E08,E09,E10,X01,X02,X03
NEW_TESTS = 32
PNPM_VERIFY = PASS (152 unit/DOM tests; 12 E2E scenarios; 14 contract checks; 54 deterministic assets)
GOVERNANCE_REQUIRE_ACCEPTED = PASS
GIT_DIFF_CHECK = PASS
SPEC_DRIFT = NO
```

| Blocker | Corrective implementation | Independent, fail-capable regression evidence | R1 result |
|---|---|---|---|
| `E01` | Flat renderer nodes and final mounted-DOM budgeting; explicit per-population metadata. | `e01-renderer-dom-budget.test.tsx` mounts Fleet L8–L12 and seedling forest, counts root plus descendants and every real population group. | CLOSED: every scene ≤64 elements; every population ≤32 representatives. |
| `E02` | Storage adapters atomically claim the complete deterministic receipt batch. | `engine-r1-regressions.test.ts` races two simulated tabs for an exact L3→L8 batch. | CLOSED: one batch winner and at most one merged ceremony. |
| `E03` | Reduced scene and ceremony paths suppress animation, transform, translate, scale, transitions, pseudo-particles, and camera movement. | `e03-reduced-motion.test.tsx` inspects mounted renderer and actual `UpgradeCeremony` computed styles. | CLOSED. |
| `E04` | Greeting attempt key is `(sourceId, subjectId, localDay)`; visibility and every interaction remain eligible recheck events. | `greeting-lifecycle.test.tsx` covers midnight-before-interaction, same-day subject reset, visibility regain, and shared-storage tabs. | CLOSED. |
| `E05` | Registry deep-copies and recursively freezes manifests and registered wrappers. | `pack-registry-immutability.test.ts` mutates both caller input and exposed registered values. | CLOSED. |
| `E06` | Renderer consumes camera, subject scale, placement, scene transition, upgrade transition/reveal/celebration, and reduced-motion presets. | `e06-renderer-preset-semantics.test.tsx`, `render-plan-subject-swap.test.ts`, and preset unit corpus. | CLOSED; no dead whitelisted preset path. |
| `E07` | Invalid default Pack gates startup before any persisted alternate can be selected. | `engine-r1-regressions.test.ts` persists a valid alternate while corrupting the default, then checks terminal state, retained progress, and zero receipts. | CLOSED: explicit `pack-unavailable`. |
| `E08` | `boundSourceId` is session-wide, independent of subject lookup. | `engine-r1-regressions.test.ts` changes source and subject simultaneously. | CLOSED: whole snapshot rejected with no progress/receipt change. |
| `E09` | Subject reset increments the presentation epoch and clears the old pending domain. | Deferred batch race in `engine-r1-regressions.test.ts`. | CLOSED: old subject ceremony cannot reach the new subject UI. |
| `E10` | Pack switch/version identity isolates pending and in-flight presentation state. | Deferred switch race and version-domain baseline tests in `engine-r1-regressions.test.ts`. | CLOSED: zero old-Pack ceremony leakage. |
| `X01` | `/` is the product Pet surface; developer controls/diagnostics require `?dev=1`; showcase requires `?showcase=1`. | `experience-blockers.spec.ts` asserts the default route omits prototype, source, fault, raw diagnostic, storage, and debug copy. | CLOSED. |
| `X02` | Frozen L1–L5 `sceneId=road-test` remains unchanged; explicit Pack assets are selected by the existing `subject-swap` plus keepsake asset seam. | `fleet-frozen-states.test.ts`, subject-swap tests, and screenshot-pixel distinction for L1–L4 in `experience-blockers.spec.ts`. | CLOSED without Engine domain branches or Spec drift. |
| `X03` | Product title/greeting/Host feedback colors meet AA mechanics; provider synchronizes `<html lang>` immediately. | Actual component contrast tests plus `x03-locale-lang.spec.ts` zh-CN↔en browser assertions. | CLOSED. |

These are author-run amendment observations addressing the reported independent-audit failures. They prepare a new exact Head for independent re-audit; they do not convert the prior `REQUEST_CHANGES` / `REVISE` decisions into independent acceptance.

## Explicit negative capability result

```text
REAL_TOKEN_INTEGRATION_CREATED = NO
DEEPSEEK_HARNESS_ADAPTER_CREATED = NO
REMOTE_PACK_SUPPORT_CREATED = NO
AUDIO_CREATED = NO
MULTI_PET_CREATED = NO
EXTERNAL_NETWORK_CALLS = 0
PACK_EXECUTABLE_CODE = NO
RUNTIME_PACK_INSTALLER = NO
```

## Audit handoff

```text
AUTHOR_CONFORMANCE_EVIDENCE = PASS
INDEPENDENT_ENGINE_AUDIT = REQUEST_CHANGES (R1 reviewed 2512398cfcb47ea450354a8675473620fdac8318)
INDEPENDENT_EXPERIENCE_AUDIT = REVISE (R1 reviewed 2512398cfcb47ea450354a8675473620fdac8318)
READY_FOR_INDEPENDENT_ENGINE_AUDIT = YES
READY_FOR_INDEPENDENT_EXPERIENCE_AUDIT = YES
```
