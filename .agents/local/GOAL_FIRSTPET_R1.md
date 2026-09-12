# GOAL_STATE = 首宠 (GOAL_R1)

- GOAL_STATUS = IN_PROGRESS
- GOAL_TERMINAL_BOUNDARY = READY_FOR_OWNER_PUBLICATION_DECISION（STOP；无 production apply / npm publish / tag / release / 公告）
- WORKTREE = /Users/yanfenma/workspace/project/vehicle-pet-wt-firstpet
- BRANCH = firstpet/preview-and-host-route (base = origin/main 7f9c4f4bb9ff5384ee6d76e9557b171707a9a689)
- OWNER_DISPATCH = GOAL「首宠」(NEW_GOAL, 2026-09-12)：修复外部 Creator preview（P1-A）并定义唯一公开 supported DSH Host 路径（P1-B），完成后以全新无历史上下文会话执行独立二次 BLACK_BOX_CREATOR_ACCEPTANCE
- DELEGATION = Owner directive 在本 Goal 内委托中间产品决策（候选 host route A/B/C 的调查与选择、最小修复形态、测试布置）；OWNER 终局 Gate = publication decision
- FRESH_VERIFIED_AT = 2026-09-12 (origin/main = 7f9c4f4；crash 于 worktree 内 fresh reproduce：ROOT_CHILDREN=0 + "usePetEngine must be used inside <PetEngineProvider>")

## PREFLIGHT

```text
GOAL_OR_TARGET = 外部 Creator 仅凭公开材料从 fresh clone 完成首宠并 BLACK_BOX_CREATOR_PASS=YES
CURRENT_GAP = P1-A: ?petPreview=1 违反 CTR-OVERLAY-038 "tooling MUST provide validate, local preview,
              deterministic build"（App.tsx petPreview 分支无 PetEngineProvider；首个 userSelectable 宠物
              vehicle 为 engine-scene recipe → PetSceneRenderer usePetEngine 抛错 → 整树卸载黑屏）。
              P1-B: 公开文档给出的 dsh 安装路径未定义 host binary 坐标；全局 npm dsh@0.1.0-rc.6 无法
              boot（koffi native 缺失 + loader 从 CLI 树解析插件），"plugin add 成功后 web 内部崩"。
AUTHORITY_ACTION = REUSE
PRIMARY_AUTHORITY = DSH_PET_OVERLAY_ADAPTER_V8 §17（CTR-OVERLAY-038、CTR-OVERLAY-041、ACC-OVERLAY-135、
              EXTERNAL_AUTHORITIES = mayf3/deepseek-harness@f77b5a2fcebc2d9138f6608a60636f2294868d42）；
              CONFIGURABLE_PET_ENGINE_V4；.agents/local/README.md governance（accepted）
PLAN_LEVEL = BRIEF
ASSURANCE_LEVEL = DURABLE（公开 docs + 预览面 + e2e；需独立 affected-Contract review）
EVIDENCE_NEEDED = fresh reproduce 记录；修复后 ?petPreview=1 fresh page load 渲染 vehicle/companion/orb/
              creator-fixture 的浏览器回归；pnpm verify + pnpm verify:dsh；独立 Reviewer 对 affected
              contracts 的 exact-Head review；独立二次黑盒验收报告
DONE_WHEN = BLACK_BOX_CREATOR_PASS = YES；PREVIEW_P1 = CLOSED；SUPPORTED_HOST_PATH =
            DOCUMENTED_AND_REPRODUCIBLE；HOST_VERSION_MISMATCH = FAILS_EARLY_OR_CLEARLY；
            CORE_MANUAL_EDIT_COUNT = 0；PUBLIC_DOCS_ONLY_ACCEPTANCE = PASS；SHIP_BLOCKERS = 0
EXPANSION_TRIGGER = 需要修改 DSH Core / harness 上游、发现 Engine progression 语义必须改动、
              或 host route 结论为 C（STOP_AT_OWNER_GATE）时停止扩权并回报 Owner
```

## Route decisions (Owner-delegated)

1. **P1-A = REUSE 修复，不做平行 renderer。** `App.tsx` petPreview 分支包真实 `PetEngineProvider`
   （复用 Shell 同一 bundles/defaultPackId/storage/source）；`PetPreviewView` 用 context 的
   `switchPack(pet.packId)` 跟随宠物选择（与 CTR-OVERLAY-041 菜单切包同一路径），engine-scene 与
   pose-sprite 两种 recipe 走既有 `CharacterVisual` recipes。pet/expression/level/size 选择器保留。
2. **页面级错误可见。** prototype 增加 PreviewErrorBoundary：preview 子树渲染异常显示可读错误面板
   （含错误信息与 creator 指向：pet:validate 字段级输出 + 文档），不再无提示黑屏。
3. **prototype `?pack=` allowlist 泛化**：从硬编码 union 改为按 bundledPackBundles 解析
   （creator pack 在 prototype 可被 deep-link；仍拒绝未捆绑 packId）。
4. **P1-B 结论 = Option B（调查证据）**：supported host coordinate = pinned 源码 checkout
   `mayf3/deepseek-harness@f77b5a2`，以其仓库内 `pnpm dsh` 运行；公开仓库可 `git clone` 获取该 ref，
   fresh clone + `pnpm install && pnpm build` + disposable `DSH_HOME` + `pnpm dsh plugin --profile web
   add <checkout>` + `pnpm dsh web --no-open` 已在本机以全新公开 clone 实测 boot（HTTP 200，
   /tmp/freshpet-host-smoke-home，2026-09-12）。全局 npm `dsh` CLI（0.1.0-rc.6）未验证/不支持：
   README 与 SUPPORTED_ENVIRONMENTS 必须明确该症状（koffi/loader 报错）与处理（改用 pinned 源码路径）。
5. **公开 Creator 文档**只依赖 README / docs/creator / docs/public：prerequisites、repo root 命令、
   happy path（copy→author→validate→preview→build→install）、`?petPreview=1` 为正式 preview 入口、
   host 版本不匹配症状。

## Lanes

- LANE_PREVIEW_FIX = P1-A 实现 + `tests/e2e/pet-preview.spec.ts`（fresh page load；vehicle/companion/orb
  + creator fixture（spec 内安装 examples/minimal-pet → wiring 生成 → 清理恢复））
- LANE_HOST_ROUTE = P1-B 文档 + verify:dsh 以 fresh clone harness worktree 运行
  （DSH_REFERENCE_WORKTREE=/Users/yanfenma/workspace/project/blackbox-creator/deepseek-harness@f77b5a2）
- LANE_ACCEPTANCE = merge 后由全新无项目历史上下文 Agent 执行独立二次黑盒验收（新 PET_ID，全链路）

## Boundaries

- 不修改 DSH Core / harness 上游；不使用 Owner ~/.dsh 或运行中的 3080 实例作为证据；
  不偷用未公开的本地 harness worktree（e2e 一律指 fresh 公开 clone）。
- 不改 Engine progression/token 语义；不改 schema；不做 npm publish/tag/release/公告。
- Creator 视角 CORE_MANUAL_EDIT_COUNT = 0 不变。
