# CONFORMANCE RECORD — Goal「生命感」/ DSH_PET_OVERLAY_ADAPTER_V7 implementation

```text
RECORD_ID = GOAL_LIFELIKE_CONFORMANCE_R1
GOAL_NAME = 生命感
GOAL_MODE = NEW_GOAL → RESUME_GOAL (consolidated fix round)
SPEC_ID = DSH_PET_OVERLAY_ADAPTER_V7 (status: accepted, supersedes V6, PR#36, origin/main=67b8fcf)
BASE_HEAD = 67b8fcf (implementation base derived from the designated authority branch)
FIRST_IMPLEMENTATION_HEAD = 549d48f (first review candidate: verify:dsh 38/41 e2e + standalone verify green)
FIXED_HEAD = 0c1e7a0 (post BLOCKER_UNION=ONE consolidated fix round; FINAL_HEAD for this record)
ENVIRONMENT = macOS (darwin 25.6.0 arm64), isolated disposable DSH home /tmp/vehicle-pet-overlay-dsh-home-r1 (rebuilt per run), pinned harness f77b5a2fcebc2d9138f6608a60636f2294868d42, Playwright chromium, pnpm 10.28.1
EVALUATED_AT = 2026-09-11
IMPLEMENTATION_STATE = PRESENT (19 commits 67b8fcf..0c1e7a0)
VERIFICATION_STATE = EXECUTED (both gates green on 0c1e7a0)
CONFORMANCE_RESULT = CONFORMING (pending re-audit verdicts recorded below; ship-blocker count 0 after fix round)
```

## 1. FIRST_REVIEW_FINDINGS(诚实记录,非最终状态)

First review candidate (549d48f) carried the complete V7 lifelike implementation and
passed standalone `pnpm verify` + `pnpm test:dsh` (166/166) but its first full
`verify:dsh` e2e segment returned 38/41. Independent audits returned:

- INDEPENDENT_CODE_AUDIT (first round, exact Head 549d48f): **ACCEPT, 0 blockers**;
  5 non-blocking FOLLOW_UPs (gaze disable event-lazy; welcome not taking the
  DailyGreeting slot; late-night once-guard; dblclick→menu missing
  noteInteraction; native-dblclick chain bypass = pre-V7 parity).
- INDEPENDENT_EXPERIENCE_AUDIT (first round): **ANNOYANCE_RISK = LOW** with 6
  documented gaps (CTR-031 rest-window return missing; CTR-032 drag-start
  variant missing; petting silent; no real-browser V7 e2e; welcome/greeting
  seam; idle-pool repetition inherited).

## 2. BLOCKER_UNION = ONE(Owner dispatch + auditor findings 合并)

1. CTR-031 gaze rest-window return-to-neutral (Owner-mandated SHIP_BLOCKER) +
   audit FOLLOW_UP-1 (disable flip lazily applied).
2. CTR-032 drag-start surprised/curious variant (Owner-mandated SHIP_BLOCKER).
3. F4 real-browser V7 e2e coverage (authority check: ACC-127..129 Methods
   require "browser run in the isolated pinned DSH" → SHIP_BLOCKER).
4. F5 welcome/DailyGreeting double-greeting seam (authority check: CTR-035
   "the first-open-of-day greeting slot is considered taken" → SHIP_BLOCKER).
5. Code-audit FOLLOW_UP-3 (late-night once-guard) + FOLLOW_UP-4 (dblclick
   noteInteraction) — same-file micro-closures folded into the round.
6. Investigation factual correction (Owner dispatch §7).

PETTING_SPEECH_CLASSIFICATION = FOLLOW_UP_DEBT (CTR-030 "at most one throttled
short petting line" is a ceiling, not a mandate; catalog lines remain bundled
for a future round). IDLE_COPY_CLASSIFICATION = FOLLOW_UP_DEBT (accepted V3
inheritance, per Owner dispatch; lever is CTR-019/AMEND, not this Goal).
BROWSER_E2E_CLASSIFICATION = SHIP_BLOCKER (fixed in this round).

## 3. FIX_ROUND(1/1)执行记录

| Fix | Commit(s) | Evidence |
|---|---|---|
| Escape closes menu from any focus rest (document capture keydown, dialog first) | 176616b | inventory pin 11→12; e2e LIFELIKE_MENU_ESCAPE_ANY_FOCUS |
| Late-night ritual day-key alignment (00:00–05:00 → previous evening, check+record+seed) | 18804d6 | CROSSTAB write storm 3267→0; ritual fires once per ritual day |
| Pure preferences updater + once-per-commit persistence | 21379dc | CROSSTAB writes bounded; render-phase write amplification eliminated |
| Remount-resilient double-click chain + clears on resets/non-click transitions | 587bf81, aa25583 | MENU_OPEN reopen eliminated; menu-close chain dies with the menu |
| Outside-press one-shot dblclick suppressor + origin-aware close | a125313..448f90e | HARNESS_LOCALE/MENU_OPEN green |
| CTR-031 gaze rest window (1200ms) + immediate disable flips | (fix round) | e2e LIFELIKE_CURSOR_GAZE_RESET (engage/rest/reduced-motion) |
| CTR-032 drag-start held surprised/curious variant + drop settle | (fix round) | e2e LIFELIKE_DRAG_DOES_NOT_CLICK (lift→settle→persistence→no click) |
| F4 real-browser V7 e2e: 5 LIFELIKE_* cases | (fix round) | long-press vs click / dblclick synthesis / drag no-click / gaze reset / menu-gesture coexistence — all green |
| F5 welcome takes the greeting slot (session-scoped DailyGreeting suppression) | (fix round) | welcome pending/claimed ⇒ pill suppressed, single greeting |
| Date containment for DOM suites (jsdom date-sensitive OOM/hang, pre-existing) | 8a04a90..8ff340c | test:dsh 166/166 stable |
| Investigation factual correction | 0c1e7a0 | menu-failure attribution corrected to in-scope proven causes; jsdom date hang retained as KNOWN_LIMITATION |

## 4. 门禁执行记录(FIXED_HEAD=0c1e7a0)

- `pnpm verify:dsh` **EXIT=0**(typecheck/lint/contracts/assets:dsh/expression/build:dsh/
  bundle/package/lifecycle/test:dsh 166/166/test:dsh:e2e **41/41**/character-check)
- `pnpm verify`(standalone)**EXIT=0**(typecheck/lint/test/e2e/build/contracts/
  assets:check/expression-check/character-check)
- `git diff --check` clean

## 5. RE_AUDIT_RESULT

- **CODE_RE_AUDIT = ACCEPT**(原 auditor resumed,exact fixed Head 0c1e7a0,worktree clean,
  diff 549d48f..0c1e7a0 仅触及 VehiclePetOverlay.tsx/playful-reactions.tsx/
  use-cursor-gaze.ts/overlay.spec.ts——无 scope creep):
  FOLLOW_UP-1..4 全部 CONFIRMED FIXED(逐项 file:line);FOLLOW_UP-5 维持 non-blocking
  (pre-V7 parity);纯 updater 重构确认保持 CTR-010 语义(adopt 不写、tolerance 不变、
  同 tick 经 ref 链式);5 个 LIFELIKE_* browser 用例确认存在且(按审计范围)采信
  41/41 的执行报告。Bonus:drag-start held idle-curious lift 闭合了首轮已认知的
  CTR-032 pending gap。
- 新增非阻断 FOLLOW_UP(F-1):`suppressDailyGreetingToday` useMemo 依赖不含日期,
  跨本地午夜的长会话中 memo 陈旧——失败方向为静默(不会双问候),任意偏好写入
  自愈;记 FOLLOW_UP_DEBT,不阻塞。
- EXPERIENCE_DELTA_RECHECK(原 auditor,bounded:gaze/drag/welcome/petting):
  见下方补记。
- ANNOYANCE_RISK = LOW(首轮判定;delta recheck 未推翻)。

## 6. SHIP_BLOCKERS = 0(after fix round;pre-fix union recorded in §2)

## 7. 边界与 FOLLOW_UP_DEBT(不阻塞 ship)

- PETTING_SPEECH(catalog 已备,runtime 接线挂起;CTR-030 为上限条款)。
- IDLE 台词池重复(V3 继承;杠杆在 CTR-019/AMEND)。
- jsdom 日期敏感 OOM/hang:KNOWN_LIMITATION,containment 生效(tests-only Date pin),
  见 docs/investigations/ENGINE_DATE_ROLLOVER_HANG.md(factual correction 0c1e7a0)。
- 静态诊断残留:tests/dsh/e2e/overlay.spec.ts 的 CROSSTAB write-value 捕获
  (仅非零时打印),属测试诊断输出。

## 8. PRODUCTION_APPLY_ALLOWED = NO

生产 profile 未被本 Goal 任何一轮触碰;后续上线必须复用 Goal「发布」的
fixed-ref release helper + Controlled Runbook。
