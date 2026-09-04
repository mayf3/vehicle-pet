# DSH_USAGE_PROGRESS_SOURCE_INPUTS（调查记录）

- 日期：2026-09-03
- 调查对象：mayf3/deepseek-harness fork master @ 419ee11c9bd5d01b206c8660762525d151bc4b4b
- 方法：只读结构调查；仅记录类型、字段、数量、标识和生命周期；未读取、未复制任何 Prompt/Completion 正文或凭据。
- Goal：陪伴 (R1)，LANE_PROGRESS_SOURCE PREFLIGHT。

## 1. 结构化 usage 记录存在性

- `TokenUsage`（packages/llm/llm/src/types.ts:135-141）：`inputTokens`、`outputTokens`、`cacheReadTokens?`、`cacheWriteTokens?`、`reasoningTokens?`。无 request id / model / 时间戳字段。
- adapter 流式发出 `{ type: 'usage' }` chunk（llm types.ts:318），terminal finish 之前。
- `assistant/message` 事件携带 `usage?: TokenUsage`（core/session types.ts:275-283），与 turn/step 标识同行持久化；无独立 usage 记录。

## 2. 投影与去重身份

- token-meter 注册 `tokenUsageProjectionDefinition`（token-meter/src/usage-projection.ts:103-140）：按 `(turn, step)` 替换语义累计 `TokenUsageProjection { uncachedInputTokens, outputTokens, cacheReadTokens, cacheWriteTokens }`，fold 天然幂等。
- `SessionProjectionMap.tokenUsage`（token-meter/src/projection.ts:69-71）。
- 客户端：投影值经 apiproxy `session/projection` 帧（higher-seq-wins）进入 `ProjectionValueStore`；`SessionSummary.projectionValues?`（dsh-client-runtime sessions/service.d.ts:59-60）携带每会话投影值。
- 稳定身份：`(sessionId, turn, step)` 与事件/投影 `seq`；无 provider request id。对去重足够。

## 3. 插件可得性（是否需要改 Core）

- `shell.overlay` slot 为 `scope: 'root'`，标准套件不含 session 级 `useProjection`。
- 但 vehicle-pet client entry 已注入 `ctx.sessions`（src/dsh/client/index.ts:22,32），而 `SessionListState` 行上的 `projectionValues` 即为结构化计数只读路径。
- 结论：**不需要修改 DSH Core**。前置条件为部署装载 token-meter 插件（构造时注册投影，token-meter/src/index.ts:85-91）；未装载时投影键 reads absent，pet 需 capability-absent 降级。

## 4. 隐私边界

- 原始日志中 usage 与正文同文件/同行存储——pet 禁止读原始日志/事件流。
- 投影路径为 counts-only：fold 只读 usage 计数字段；`projectionValues`/投影帧只含数字。
- pet 只允许消费 `tokenUsage`（如需也可 `sessionStats`）投影键，禁止订阅原始 session/event 流。

## 5. Authority 判定

- AUTHORITY_ACTION = **NEW**（DSH_PET_USAGE_PROGRESS_SOURCE_V1）：真实 usage → progressPoints 是新 Decision（进度经济），超出严格 additive AMEND 边界（新增独立义务与进度语义）。
- 实现在该 spec accepted 前不动代码。
- Token 经济参数（input/output/cached/reasoning 是否计入、权重、token→progressPoints 比例、历史补算）为不可由事实推出的 Owner Decision。

## 6. Measured 7-day counts-only baseline (2026-09-04, calibration for Owner packet)

- Source: local DSH home session logs (~/.dsh/sessions, 1,640 session logs, zstd JSONL).
- Method: counts-only script; read ONLY `assistant/message` events' numeric
  `usage{inputTokens, outputTokens, cacheReadTokens}` + top-level `time` (epoch ms)
  + identity `(workspace, sessionId, turn, step)`, dedup keep-last per identity.
  Message content (`data.message`) was never read, decoded, or emitted.
- counted = uncachedInputTokens + outputTokens (cache/reasoning excluded per
  Owner default direction; observed usage rows carried cacheReadTokens=0 and no
  reasoning/cacheWrite fields).

```text
window_days            = 2026-08-26 .. 2026-09-02 (8 calendar days, 7 active)
counted_total_7d       = 90,306,345
active_days            = 7 of 8 (2026-09-01 = 0)
median_counted_active  = 9,808,994
mean_counted_active    ≈ 12,901,000
heaviest_day           = 32,805,557 (2026-08-29)
lightest_active_day    = 241,724   (2026-09-02)
previous_7d_total      = 134,212,939 (rate is stable at ~10–19M/day)
grand_total_all_days   = 280,786,199 (backfill risk: ≈ 280,787 pts at 1/1k)
daily events (messages with usage), last 7 active days: 457 / 5454 / 1065 / 6915 / 3910 / 2333 / 47
```

Fleet ladder thresholds (points): L2 10k, L3 30k, L5 100k, L12 2.5M — confirming
the Owner's arithmetic that points_per_1k=1 + full backfill would land a fresh
install mid-ladder (≈L6/L7) and make L2 cost 10M counted tokens.

## 7. 18-day observed-series simulation (2026-09-04, R1_CONT_2 calibration)

Full observed window 2026-08-14..09-02 (18 active days, total 280,786,199
counted): median 13,028,844/day, mean 15,599,233/day, min 241,724, p25
5,791,707, max 47,479,532. Simulation applies each observed day's counted
tokens as points from a fresh install (no backfill); "crossing days" = days
where at least one level threshold is crossed.

```text
                 crossings/  crossing-  fresh-install (observed pace)   median-day ETA
OPTION (pp1k)    active-day  days/18    L2    L3    L5     L12          L2 / L3 / L5 / L12
A  (1.0)         0.28        5/18       1d    3d    7d     >18d         0.8d/2.3d/7.7d/192d
B  (0.4)         0.22        4/18       2d    6d    15d    >18d         1.9d/5.8d/19.2d/480d
C  (0.15)        0.11        2/18       6d    13d    >18d  >18d         5.1d/15.4d/51.2d/1279d
A+cap10k         0.22        4/18       1d    4d    13d    >18d         same as A (cap binds only on heavy days)
B+cap4k          0.11        2/18       3d    10d    >18d  >18d         same as B

light persona 250k counted/day: A -> L2 40d, L5 400d, L12 ~27y; B/C worse
heavy persona 30M counted/day:   A -> L2 0.3d, L3 1d (multi-jump days); B -> L2 0.8d, L3 2.5d
within-level bar (resident micro progress): median day under A moves the
current-level bar by ~130% of one L1 span (>=1 full bar/day), under B ~65%/day,
under C ~20%/day — i.e. the resident bar gives daily-visible growth under A/B,
subtle under C, independent of threshold crossings.
```

Reading: at this user's real distribution the fixed ladder crosses are rare
(<=0.28/active-day even under A); daily perceivable growth is carried mainly by
the resident within-level bar, while threshold crossings provide the rarer
"stage-up" moments. Milestone ceremony frequency therefore matters most under A.

## 8. Final calibration decision (2026-09-04, R1_CONT_3 — delegated autonomous decision)

Per Owner delegation (`OWNER_DELEGATED_DECISION_AUTHORITY = YES`, Goal 陪伴
R1_CONT_3), the A/B/C options above were calibration material only. The Goal
Orchestrator selected the unique final policy that meets all frozen
calibration targets; it is ratified in
`docs/specs/DSH_USAGE_PROGRESS_SOURCE_V1.md` §3.5/§3.6.

```text
FINAL_TOKEN_ECONOMY_POLICY = daily diminishing returns, log2 form
FINAL_COUNTED_CLASSES       = uncachedInputTokens + outputTokens
FINAL_PROGRESS_FUNCTION     = dailyTargetPoints(T) = min(12000, 1350 x log2(1 + T / 1000000)); per-day applied increment = floor(target(dayTokens)) - alreadyApplied(day)
FINAL_DAILY_CAP             = 12000
FINAL_HISTORICAL_BACKFILL   = NO
FINAL_CEREMONY_POLICY       = engine default (per-threshold, never repeated, merged multi-level, short/skippable/degradable); micro progress has no ceremony
```

Verification against the measured distribution (full-day targets, floor):

```text
persona (counted/day)      daily pts   L2 / L5 / L12
median  13,028,844         5,143       day 2 / day 20 (~3.3 wk) / day 487 (~18.3 mo)
light        250,000         434       day 23 / — / —   (L1 bar +4.34%/day)
heavy     30,000,000       6,688       day 2 / day 15 / day 374
heavy     47,479,532       7,559       day 2 / day 14 / day 331
p25        5,791,707       3,731      day 3
min       241,724   421 (floor) -> floor-int day gains never zero on active days
zero            0               0     (NO_USAGE_NO_PROGRESS)
1e9 (pathological)      12,000 cap   => install-day max 1 crossing (cap < L3 30,000)
```

Rejected alternatives and why:

- linear A (1.0/1k): heavy 30M day = 30,000 pts → install-day crosses L2+L3
  (multi-jump) and violates the ≤1-crossing target;
- linear B/C: light persona earns 100/40 pts per day → L2 at 100+ days and
  near-invisible micro progress, violating light-user targets;
- log2 with large scale (S=4M): light day only ~190–210 pts → L1 bar <2.1%/day,
  weaker early attachment for the same median outcomes;
- selected S=1M/C=1350/cap=12000: the only evaluated family meeting every
  frozen target simultaneously; cap makes the install-day invariant
  unconditional rather than distribution-dependent.
