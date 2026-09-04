# GOAL_STATE = 陪伴 (GOAL_R1)

- GOAL_STATUS = ACTIVE
- CURRENT_PHASE = INTEGRATION
- GOAL_TERMINAL_BOUNDARY = READY_FOR_PRODUCTION_APPLY
- WORKTREE = /Users/yanfenma/workspace/project/vehicle-pet-wt-companion-r1
- BRANCH = companion/usage-authority (base = origin/main 3fac52f, merged)
- MERGED = PR #8 (surface) + PR #10 (goal state) on main; PR #9 (successor authority, Draft) carried on this branch
- DELEGATION = R1_CONT_3 Owner directive: OWNER_DELEGATED_DECISION_AUTHORITY = YES；全部中间产品决策由 Goal Orchestrator 自主完成；仅 PRODUCTION_APPLY 保留 Owner Gate
- DSH_FORK_MASTER_AT_VERIFY = 419ee11c9bd5d01b206c8660762525d151bc4b4b (mayf3/deepseek-harness fork)
- FRESH_VERIFIED_AT = 2026-09-04

## Lanes

- LANE_COMPANION_SURFACE = READY_FOR_INTEGRATION → merged via PR #8（微进度条 + effective reduced-motion gate；audit ACCEPT 0 blocker）
- LANE_VISUAL_ASSETS = ACTIVE（自主路线：ART_REQUEST_PACKET 经授权 CHATGPT_BROWSER_ROUTE 生成 ≥3 套候选 → 独立视觉 Agent 盲评 → 自主选定；连续三轮不可行才 BLOCKED_IMAGE_CAPABILITY）
- LANE_PROGRESS_SOURCE = ACTIVE（FINAL_TOKEN_ECONOMY_POLICY 已自主确定：daily log2 递减 min(12000, 1350×log2(1+T/1M))，counted = uncachedInput+output，无补算；successor VEHICLE_PET_PROGRESS_SOURCE_V2 + DSH_USAGE_PROGRESS_SOURCE_V1 提案中，独立审计后按 OWNER_SPEC_ACCEPTANCE_POLICY=PREAUTHORIZED_ACCEPT 接受）
- LANE_INTEGRATION = BLOCKED_BY_DEPENDENCY（等 Progress Source 实现与资产接入后联合集成）

## Isolated preview (evidence)

- INSTALL/RUN/REINSTALL/UNINSTALL proven via `dsh plugin --profile web add/remove/list` (fork worktree deepseek-harness-wt-vehicle-pet-preview-f77b5a2f-20260828)
- Browser-verified: pet resident at L1 112px, micro bar rendered, click→panel→Escape three-state intact, tokenUsage projection live in deployment (session stats Input/Output tok)
- 用户真实 DSH 服务与 Profile 未被修改

## FOLLOW_UP_DEBT (audit, non-blocker)

- PR#8 audit: reducedMotion 有效偏好表达式与 Engine gate 重复；OS 偏好变化无 listener（既有模式）；capped/span<=0 边界无直接单测、宽度值未断言
- README/docs：常驻微条能力说明
- daily_cap 已在 R1_CONT_3 自主采纳（12000），重度日 ≤1 次越级

## Authority

- VEHICLE_PET_PRODUCT_DIRECTION_V1
- CONFIGURABLE_PET_ENGINE_V1
- DSH_PET_OVERLAY_ADAPTER_V1
- VEHICLE_PET_PROGRESS_SOURCE_V2 (proposed → 独立审计后接受)
- DSH_USAGE_PROGRESS_SOURCE_V1 (proposed → 独立审计后接受；Owner-ratified calibration §3.5/§3.6)
- governance adoption（.agents/local/README.md，accepted）

## Boundaries

- 不修改用户真实 DSH 服务 / Profile；仅独立 DSH_HOME + 独立端口。
- 不读取 Prompt/Completion/正文/凭据；usage 只处理结构化计数与稳定身份。
- 不修改 DSH Core。
- 不扩建 Panel；不以程序化占位 SVG 充当正式美术。
- 达到 READY_FOR_PRODUCTION_APPLY 即停，PRODUCTION_APPLY（真实 Profile 安装/服务重启）为唯一 Owner Gate。
