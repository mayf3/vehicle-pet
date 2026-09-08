# GOAL 灵动 — Conformance Record R1

```text
RECORD_KIND = conformance_record
GOAL_NAME = 灵动 (NEW_GOAL, OWNER_DISPATCH_UNIT = GOAL)
CONFORMANCE_RESULT = VERIFIED (at the exact bound tuple below)
BOUND_AUTHORITY_REVISIONS = DSH_PET_OVERLAY_ADAPTER_V3 (accepted, PR #23 merge bf3ce2cb2ff5d3b3ed6f928f1837cd730016a1b4) · CONFIGURABLE_PET_ENGINE_V3 (accepted, untouched) · VEHICLE_PET_PROGRESS_SOURCE_V2 (accepted, untouched) · DSH_USAGE_PROGRESS_SOURCE_V2 (accepted at 0696625, docs-only succession on this branch) · VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2 (accepted)
BOUND_IMPLEMENTATION_HEAD = ce347f4 (branch lingdong/resident-v3; implementation commit c350bca + audit-fix commit ce347f4)
BASE_HEAD = bf3ce2cb2ff5d3b3ed6f928f1837cd730016a1b4
ENVIRONMENT = disposable DSH homes under /tmp (recreated per run; production ~/.dsh never touched); pinned Harness worktree deepseek-harness-wt-vehicle-pet-overlay-f77b5a2f; ports 3081/3085/3087/3091; mock LLM 8901/8902; Playwright Chromium; macOS arm64
EVALUATED_AT = 2026-09-08 (Goal 灵动 rounds R1)
IMPLEMENTATION_STATE = COMPLETE (PANEL_OPEN/compact panel deleted; SMALL/LARGE; resident progress absent; 10 expression variants; speech system; secondary affordance)
VERIFICATION_STATE = COMPLETE (all gates executed at the bound head; independent audits ACCEPT)
```

## 1. Gates (executed at ce347f4)

```text
PNPM_VERIFY = PASS (typecheck 3 tsconfigs, lint clean, unit 157, prototype e2e 12, build, contracts 18, assets:check, assets:expression-check byte-identical)
PNPM_VERIFY_DSH = PASS (assets:dsh-check, build:dsh, check:dsh-bundle/package/lifecycle, test:dsh 111→113, test:dsh:e2e 36/36)
E2E_COEXISTENCE = PASS (1/1: real deepseek-pet installed from github:keleus/deepseek-pet into a disposable home; both surfaces one viewport; zero overlap; zero console errors)
GIT_DIFF_CHECK = PASS
ISOLATED_FIXED_REF_ACCEPTANCE = PASS (evidence below collected from the disposable isolated DSH at the bound head)
```

## 2. Evidence index (docs/evidence/lingdong/)

| Item | Files | Result |
|---|---|---|
| E1 SMALL real-DSH | visible-small.png | 112px shell, quiet corner, no gauge |
| E2 LARGE + whale same frame | coexistence-both-pets.png | same-magnitude presence, zero overlap |
| E3 size persistence | e2e SIZE_PERSISTENCE (overlay.spec.ts) | menu toggle survives reload, stored |
| E4 resident bar absent | NO_RESIDENT_PROGRESS_BAR (e2e+dom) | absent in visible/menu/dialog/collapsed; journey keeps its gauge |
| E5 normal click no panel | NO_NORMAL_CLICK_PANEL + PET_CLICK_REACTION (e2e+dom) | no surface ever; variant changes |
| E6 secondary settings | menu-open.png + SECONDARY_SETTINGS_ACCESSIBLE | exactly 4 groups, 216px, trigger-only, no progression content |
| E7 ≥8 expression contact sheet | contact-sheet-112/56.png, masters-256.png | 10 variants, visual review R2 ACCEPT |
| E8 session-state mapping | e2e session lifecycle + EXPRESSION_VARIANTS | idle/working/needs-input/completed/failed, cancelled→cancelled variant |
| E9 bubble per state | speech-bubble.png + SPEECH_BUBBLE_LIFECYCLE | catalog lines, replace-not-stack, 4s dismiss |
| E10 bubble occlusion/focus | SPEECH_NO_COMPOSER_OCCLUSION, SPEECH_NO_FOCUS_STEAL | composer/send clear; focus never stolen |
| E11 reduced motion | reduced-motion-visible-v3.png + REDUCED_MOTION_STATIC_PARITY | variants statically readable; speech unaffected |
| E12 L1–L12/usage regression | COMPACT_ALL_LEVEL_PIXEL_MATRIX, usage-source-live.spec | progression + usage seam unchanged |

## 3. Independent audits (all at the bound coordinates)

```text
INDEPENDENT_SPEC_AUDIT (DSH_PET_OVERLAY_ADAPTER_V3) = ACCEPT, 0 blockers (Base cce0e9d, Head b62befc) + final-head delta recheck ACCEPT (acceptance commit 8607f4f; merged PR #23)
INDEPENDENT_SPEC_AUDIT (DSH_USAGE_PROGRESS_SOURCE_V2, F4) = ACCEPT, 0 blockers, Owner seven focus points 1-7 PASS (Base bf3ce2c, Head 3566eac) + acceptance recheck REJECT(B01 documentary) → closure 0696625 → recheck ACCEPT (merged in this PR)
INDEPENDENT_VISUAL_REVIEW (expression variants) = R1 REJECT (white-face-plate contrast; 7 revision requests) → centralized fixes → R2 ACCEPT, 0 revision requests
INDEPENDENT_CODE_AUDIT = R1 REJECT (B1: CTR-OVERLAY-019(3)/(4) unenforced; F1-F6) → centralized fixes → RE-AUDIT ACCEPT, 0 blockers at ce347f4
INDEPENDENT_EXPERIENCE_AUDIT = ACCEPT, 0 blockers; ANNOYANCE_RISK = LOW (all seven cadence gates live-verified); Owner eight questions answered, live interaction on a disposable coexistence DSH
SHIP_BLOCKERS = 0
```

## 4. Owner eight-question record (experience audit, condensed)

1. 更像宠物（点击=反应，永不弹面板；视觉仍有卡片感，LARGE boost 已改善）
2. LARGE 存在感提升（boost 后主体放大 ~1.6×；同框协调，零重叠）
3. SMALL 足够不打扰（112px 实测）
4. 明显更干净（常驻面/菜单零进度元素）
5. 无设置面板感（点击=表情+节流台词；菜单独立 hover 入口）
6. speech 自然不烦（实测台词短、有角色感、4s 消失、30s 节流生效）
7. 表情真实增加（10 masters + 运行时轮换实测；LARGE boost 后可读性提升）
8. 与鲸鱼娘基本协调（上下错开、零重叠；菜单打开时本插件层序提升保持可读）

## 5. Carried follow-ups (non-blocking, recorded)

```text
F2-RESIDUAL = bubble right-edge overflow remains structurally possible with LARGE parked hard-right (clamp degenerates to 146px; longest current copy ≤ ~14px overflow worst case; e2e geometry assertion green) — viewport-relative or measured-width clamping in a later craft round
N1 = boost + far-off-center subject box could clip art while the (shell-clamped) hitbox covers the clipped region — unreachable for the bundled centered subjects (SCENE_GEOMETRY_TEST)
N2 = subjectBoostFor exercised via dom/e2e; dedicated unit case MAY be added
OVERLAY_V3_S3_POINTER = V3 §3 USAGE_SOURCE_PARENT names the superseded V1; resolves via backlink to V2 (recorded in usage V2 §14 CARRY_FORWARD_NOTES)
WHALE_Z_TOP_MODE = if the whale is set to 页面置顶 (z 999999) its surface legally paints above every local layer; unchanged from V2-era behavior
EXPERIENCE_CRAFT_NOTES = greeting pill uses the engine notification skin (visual mismatch with catalog bubble, engine-owned); collapsed launcher is a neutral 36px dot; stray mark near needs-input badge observed once (origin host toast, unfixed)
```

## 6. Production boundary

```text
PRODUCTION_APPLY_ALLOWED = NO (Goal boundary)
GOAL_STATUS = READY_FOR_PRODUCTION_APPLY
PRODUCTION_UPDATE_PLAN = dsh plugin --profile web update to the merged main ref (or remove + add), restart the Web profile; preferences migrate compatibly (absent size → LARGE; position/collapsed/reduced-motion carried)
ROLLBACK_REF = dsh plugin --profile web add github:mayf3/vehicle-pet#cce0e9d; restart Web profile
```
