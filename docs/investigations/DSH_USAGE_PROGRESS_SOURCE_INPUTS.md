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
