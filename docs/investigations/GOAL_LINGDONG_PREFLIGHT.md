# GOAL 灵动 — PRODUCT_PREFLIGHT record and whale UX census

```text
GOAL_NAME = 灵动
GOAL_MODE = NEW_GOAL
RECORD_KIND = investigation (non-authoritative) + PREFLIGHT decision record
TARGET_REPOSITORY = mayf3/vehicle-pet
BASE_VERIFIED = origin/main cce0e9d24907e7c17e42fd2b310a68a98860d5cf (fresh-fetched 2026-09-08, matches EXPECTED_CURRENT_MAIN_AT_DISPATCH)
PRODUCTION_APPLY_ALLOWED = NO
OBSERVED_AT = 2026-09-08 (morning, UTC+8; ~2026-09-07T24:00Z–2026-09-08T00:00Z window)
CENSUS_ENVIRONMENT = production DSH web profile, http://127.0.0.1:3080, separate controlled browser (fresh profile, user browser untouched); deepseek-pet 0.1.0 installed and active in profile bundles; @mayf3/vehicle-pet pinned #cce0e9d in the same profile
VIEWPORT = 1280x720, dpr 1
```

Part 1 is the Owner-mandated read-only UX census of the installed deepseek-pet
(“鲸鱼娘”). Part 2 records the same-runtime measurements of the current Vehicle
Pet. Part 3 is the PREFLIGHT routing decision. Interaction principles only are
consumed; no Live2D model, image, code, copy, motion data, brand, or precise
likeness is copied (DSH_PET_OVERLAY_ADAPTER_V2 §3 binding fact).

## 1. WHALE_UX_OBSERVATIONS

Evidence tags: `OBSERVED` = measured/triggered in the running production UI, or
read directly from the installed production bundle
`~/.dsh/profiles/web/node_modules/deepseek-pet/lib/client.js` (v0.1.0, minified).
`INFERRED` = interpretation. No production file, profile, or server state was
mutated; all interactions happened in a separate browser profile.

### W1 — Actual displayed size [OBSERVED]

- Character button `.dsh-live2d-character`: **228x244 px** at (995, 375).
- Stage `.dsh-live2d-stage`: 260x244 px; root `aside[data-dsh-live2d-root]`:
  306x331 px (bubble hidden) / 306x372 px (bubble open).
- A blurred ellipse ground shadow sits under the character (CSS `:before`).

### W2 — Size modes [OBSERVED]

- No SMALL/LARGE two-mode switch exists. Size is one **continuous scale**
  adjusted by **mouse wheel over the character** (`onWheel` handler →
  `--pet-scale` CSS variable, persisted to localStorage key
  `deepseek-pet:scale`). Collapsed mode forces `--pet-scale: 1 !important`.
- Interaction principle: size adjustment is a **direct gesture on the
  character, persisted silently, no settings UI required**.

### W3 — Settings entry [OBSERVED]

- The pet itself exposes only a hover-revealed quick-action row
  (`nav.dsh-live2d-tools`, default `opacity: 0; pointer-events: none`, shown on
  stage hover / focus-within) containing exactly one action: **最小化 Pet**
  (60x28 px pill, `−` glyph + text).
- Real settings live in the **host 设置 page as a registered settings.section
  “桌宠设置”** (“控制 DeepSeek 桌宠在网页里的展示位置。修改立即生效，无需刷新。”):
  展示模式 (`默认` = follow app layering; `页面置顶` = `position: fixed;
  z-index: 999999` above page content and dialogs), 动作图片 grouping note,
  and 恢复默认. Persisted at localStorage `deepseek-pet:display-mode`
  (+ a CustomEvent `deepseek-pet:display-mode-changed` for live apply).
- Interaction principle: **daily surface carries at most one low-disturbance
  action; everything else is a low-frequency host settings section**.

### W4 — Speech bubble mechanics [OBSERVED]

- `.dsh-live2d-bubble`, `role="status" aria-live="polite"`; measured 244x51 px
  (CSS width 260, max-height 108), border-radius `16px 16px 5px 16px` (tail
  corner bottom-right toward the character), positioned in normal column flow
  directly above the stage with `margin-bottom: -15px` (slight overlap).
- Structure: one main `span` (~12px font) + one `small` secondary line.
- **Auto-dismiss: shown text is cleared by `setTimeout(..., 3600)` — 3.6 s.**
  Every new show resets the timer. Single bubble at all times.
- While streaming, `data-stream="true"` adds a step-end caret animation.
- Content priority (bundle): tapped reaction line > periodic rotation (a 12 s
  tick; every second tick ≈ 24 s cadence while working shows a rotating
  status line + detail) > the state's default label + detail.

### W5 — Character click behavior [OBSERVED]

- Click on the character (after drag-suppression flag) picks a **random line
  from the current state's line pool** and shows it via the W4 bubble for
  3.6 s. No panel, no menu, no navigation opens. Observed tap reactions
  included “别戳哦～” and the greeting pair “早上好，今天又是新的一天” /
  “一起把今天的任务做好吧”.
- Drag uses pointer capture with a just-dragged flag so a drag never counts as
  a click.

### W6 — Minimize / restore [OBSERVED]

- 最小化 pill → `data-collapsed="true"`: root becomes a **58x68 px** docked
  strip (stage scaled to 0.28), visually a ~36 px chibi head resting at the
  composer's right corner; bubble/tools/sessions hidden.
- Restore = **double-click** the launcher (aria-label flips to “双击展开
  DeepSeek 状态助手”); verified working. Not full hide.
- Quirk: restored position differed from pre-minimize position (x 956 → 780)
  — position persistence is loose across the collapse boundary [OBSERVED].

### W7 — Position and persistence keys [OBSERVED]

- localStorage keys: `deepseek-pet:position` (drag, saved on pointerup),
  `:scale` (wheel), `:display-mode`, `:enabled-reactions` (reaction categories
  can be toggled off; + changed CustomEvent), `:last-activity` (ms timestamp
  gating ambient chatter — activity resets it).
- Resize listener re-clamps; drag offset applied via `--pet-drag-x/y`.

### W8 — Speech line inventory (tone reference only) [OBSERVED]

- Working rotation (~19 lines): 正在敲字 / 整理回复 / 组织答案 / 梳理疑问 /
  逐项排查 / 验证线索 / 深度思考 / 消化上下文 / 继续推演 / 分析中 / 梳理上下文 /
  验证思路 / 正在敲终端 / 正在读文件 / 正在写代码 / 正在修改代码 / 正在查找资料 /
  正在阅读网页 / 正在运行工具.
- Task states: 等待选择任务 / 暂无活动任务 / 正在载入任务 / 同步会话状态… /
  任务遇到错误 / 工具调用搞砸了 / 等你确认工具调用 / 请在任务中确认，我会在这里等你 /
  等待你的回答 / 请在任务中回答问题 / 请在任务中完成交互.
- Structured counters: `队列中还有 N 项`, `N 个任务同时执行`, `N 个疑问线索`.
- These strings are the whale's copy; Vehicle Pet MUST NOT reuse them
  (Goal §3 no-copy list). They establish only the tone/shape envelope:
  short, warm, state-anchored, concrete.

### W9 — Sprite/action switching [OBSERVED]

- Rendering is a **sprite stack, not skeletal animation at the DOM level**:
  `.dsh-live2d-sprites img[data-active]` per action group; a 12 s interval
  indexer rotates the active action (“切换顺序只由该动作的累计时长决定” per the
  settings text); frame images switch with `steps(1)` (instant), transitions
  only on opacity. (The plugin ships a Live2D runtime for model rendering —
  class names say `live2d` — but the visible behavior layer is grouped
  sprite/frame switching.)

### W10 — Content awareness boundary [OBSERVED — negative reference]

- The bundle regex-matches **message and reasoning text** (e.g. mistake
  patterns “做错/写错/wrong answer”, question-mark counting in reasoning) to
  pick reactions. The whale is content-aware.
- Vehicle Pet is contractually forbidden from this (CTR-OVERLAY-008 lineage):
  structured session state only. This census item is a boundary marker, not a
  feature to port.

### W11 — Composer and neighbor relations [OBSERVED]

- At 1280x720 the whale's visible sprite overlaps the blank-state composer's
  right edge (model-selector/send zone) and partially overlaps a real
  conversation composer's right margin; it tolerates composer-edge overlap by
  design. The 活跃会话 pill (聚焦 action) docks below the pet.
- Overlap with Vehicle Pet: whale `aside` (956..1262 x 334..706) fully covers
  the Vehicle Pet button (1152..1264 x 416..528) region; pointer events in the
  overlap go to the whale (Vehicle Pet click was intercepted during census).

### W12 — Background/scene presentation [OBSERVED, mechanism INFERRED]

- During the census, a character click coincided with a full-page illustrated
  background (cherry-blossom scene) appearing and persisting for the browser
  session. Mechanism not traced; client-local presentation. Noted as an
  example of “pet presence can extend beyond its bbox” — not a feature to
  copy under this Goal (out of scope; anti-churn).

### W13 — Responsive behavior [OBSERVED, from bundle CSS]

- `@media (max-width: 760px)`: widths shrink (root 286px, tools/panels
  narrower). `@media (hover: none)`: quick actions always partially visible
  (opacity .72) for touch.

### W14 — Conversation panel [INFERRED]

- `.dsh-live2d-conversation` CSS (306px, max-height 230, scrollable) exists in
  the bundle but no render site was found; treated as legacy/unused. Do not
  infer a panel-based interaction from it.

## 2. Vehicle Pet current-state measurements (same runtime) [OBSERVED]

- Pet button 112x112 at (1152, 416), 16 px right viewport margin
  (OVERLAY_GEOMETRY.visibleSizePx = 112).
- **Visible car sprite bbox ≈ 54x37 px** at (1183, 455)–(1237, 492) for the
  census level's wide car art — the 480x480 sprite canvas carries large
  transparent margins. Visible-area ratio vs whale character ≈ **1:10**;
  this is the Owner's “像一个小图标” complaint quantified.
- Resident micro progress bar: `.vpo-progress` 75x4 px at (1171, 517) — a
  detached grey sliver under the car (GAP_2).
- Click currently opens the 264 px compact panel
  (`VehiclePetOverlay.tsx` click handler → `PANEL_OPEN`) (GAP_1).
- Blank/new-session selection hides the pet entirely (CTR-OVERLAY-011
  onboarding gate) — confirmed live.
- Expression layer: 5 static state masters (expressions.ts), face-anchor
  table per level; census screenshot caught the failed-state expression on a
  failed session (This run failed transcript) — small but present.

## 3. PREFLIGHT decision record

```text
SPEC_GOVERNANCE_MODE = PREFLIGHT
TARGET_REPOSITORY = mayf3/vehicle-pet
REVIEW_TARGET_HEAD = NOT_APPLICABLE (no candidate yet)
BASE_HEAD = cce0e9d24907e7c17e42fd2b310a68a98860d5cf
CURRENT_BASE_HEAD = cce0e9d24907e7c17e42fd2b310a68a98860d5cf
ROUTE_STAGE = AUTHORITY_AUTHORING
AUTHORITY_ACCEPTED_IN_BASE = YES for the parent authorities listed below (all accepted and reachable from main); the proposed successor V3 itself is NOT accepted in base, which is the route-record field referent (see GOAL_LINGDONG_ROUTE_R1.json)
GOAL_OR_TARGET = Resident Vehicle Pet becomes a two-size (SMALL/LARGE) pet-first
  companion: no resident progress bar, no daily panel on normal click, >=8
  expression variants, >=30 curated speech lines with a non-modal auto-dismiss
  bubble; growth/usage/token systems untouched; stop at READY_FOR_PRODUCTION_APPLY.
CURRENT_GAP = GAP_1 daily click opens 264px panel; GAP_2 resident micro progress
  bar; GAP_3 single 112px size with ~1:10 visible-area ratio vs whale;
  GAP_4 5-state expressions only, no speech, low liveness.
OBSERVATIONS = this record §1–§2 (qualified, coordinates bound)
WORKING_GUESS = NONE (routing-relevant interpretations are all OBSERVED)
AUTHORITY_ACTION = SUPERSEDE
PRIMARY_AUTHORITY = DSH_PET_OVERLAY_ADAPTER_V3 (proposed successor of DSH_PET_OVERLAY_ADAPTER_V2)
RELATED_AUTHORITIES = VEHICLE_PET_PRODUCT_DIRECTION_V1, CONFIGURABLE_PET_ENGINE_V3,
  VEHICLE_PET_PROGRESS_SOURCE_V2, DSH_USAGE_PROGRESS_SOURCE_V1,
  VEHICLE_PET_DEVELOPMENT_GOVERNANCE_ADOPTION_V2
IMPLEMENTATION_AUTHORITY = contracts (V3 to carry implementation_authority: contracts like V2)
ATOMIC_SPEC_IMPLEMENTATION_PERMITTED = NO (SUPERSEDE is docs-first; implementation is a later REUSE task)
PLAN_LEVEL = BRIEF
ASSURANCE_LEVEL = DURABLE
EXECUTION_MANDATE = VALID (this Goal dispatch: attributable Owner issuance, target/scope/effects/DONE_WHEN bound)
MUTATION_AUTHORIZATION = VALID (goal-scoped; production apply explicitly excluded)
ISOLATED_WRITE_SURFACE = REQUIRED (worktree/branch per PR; isolated DSH_HOME for acceptance)
CONTROLLED_RUNBOOK_REQUIRED = NO (no production mutation in this Goal)
SPEC_GAP_DEPENDENCY = NONE (authority path exists: SUPERSEDE authored this round)
EVIDENCE_REVIEWABILITY = PASS (census reproducible against the same production profile; screenshots + DOM/bundle coordinates recorded)
LIVE_AUTHORITY_GAP = NONE
OWNER_DECISION_REQUIRED = NO (Goal preauthorizes the frozen direction, acceptance, and merge per its DONE_WHEN)
EMERGENCY_STATE = NONE
BASE_IMPACT = BOUNDED (dsh client surface + assets + tests; engine/progress/token untouched)
IMPLEMENTATION_ALLOWED = NO until V3 accepted revision is reachable from main
MERGE_READY = NOT_APPLICABLE (this round)
OPERATION_ALLOWED = NOT_APPLICABLE
EVIDENCE_NEEDED = Goal §20 E1–E12
DONE_WHEN = Goal §24 DONE_WHEN block
EXPANSION_TRIGGER = any production-profile mutation need, whale-clone drift
  (Live2D/content-awareness/skin), engine or token-economy change, or a second
  new surface beyond SMALL/LARGE + bubble + secondary settings
NEXT_REAL_ACTION = AUTHOR mode: author DSH_PET_OVERLAY_ADAPTER_V3 (whole-authority
  successor, docs-only), independent audit, Owner-preauthorized acceptance, merge
NEXT_ACTION = CONTINUE
```

Routing rationale (mechanical, from the observed texts):

- `DSH_PET_OVERLAY_ADAPTER_V2` **freezes** the 112 px single size
  (DEC-OVERLAY-002, §8 `VISIBLE_PET_SIZE_PX = 112`, ACC-OVERLAY-017 exact-size
  assertions), the VISIBLE/PANEL_OPEN/COLLAPSED click-toggles-panel machine
  (CTR-OVERLAY-004, §8.1), the 264 px compact panel as the daily settings
  surface (CTR-OVERLAY-005, §8.2), and the resident micro progress as part of
  the VISIBLE presentation (§8.1 “temporary session state” + within-level
  sliver; §1 motivation names “within-level micro progress” as daily value).
  Goal 灵动 reverses each of these → accepted meaning is deleted/replaced →
  **SUPERSEDE** (whole-authority successor V3, docs-first, atomic backlinks).
- `CONFIGURABLE_PET_ENGINE_V3` owns progression, packs, journal, keepsakes,
  receipts, ceremony; Goal touches none → **REUSE**.
- `VEHICLE_PET_PROGRESS_SOURCE_V2` / `DSH_USAGE_PROGRESS_SOURCE_V1` own the
  counts-only usage seam; the micro-bar removal changes presentation only, not
  the source seam → **REUSE**.
- Token economy: unchanged → **REUSE**.
- `VEHICLE_PET_PRODUCT_DIRECTION_V1` CTR-DIR-007 requires pets to provide
  “within-level progress state” among the experience baseline; V3 keeps the
  obligation satisfied through the retained low-frequency journey/settings
  surface while removing the always-on resident sliver, and carries the
  pet-first direction forward. No Product Direction amendment is required
  because V3 does not weaken the Engine-neutral, passive, non-coercive model;
  the presentation ownership being superseded is the overlay adapter's.
- Expression expansion (5 → ≥8) and speech bubble are **new Contracts inside
  the same adapter authority** (they govern the same surface, same ownership,
  same Decision identity) — carried by the V3 successor rather than a separate
  NEW authority.

## 4. Sizing inputs for V3 (from §1–§2)

```text
WHALE_VISIBLE_BBOX = 228x244 px character (stage 260x244; aside 306x372)
VEHICLE_SMALL_VISIBLE_BBOX = 112x112 button; visible car ≈ 54x37 px (level-dependent)
SMALL_MODE = keep the compact-companion scale (112 px reference; minor sprite-bbox
  optimization permitted by Goal §6)
LARGE_MODE = target ≈ 1.8x SMALL height (≈ 200 px surface), same visual-magnitude
  band as the whale character at common viewports without copying its px values;
  final px fixed during implementation from the real V2 sprite transparent bbox
CONSTRAINTS = LARGE must not occlude Composer/Send, must not cover deepseek-pet,
  must stay in viewport, and must not create a giant transparent hitbox
  (hit-testing follows the sprite's visible bbox, not the bounding square)
```
