# GOAL_STATE = 陪伴 (GOAL_R1)

- GOAL_STATUS = ACTIVE
- CURRENT_PHASE = INTEGRATION
- GOAL_TERMINAL_BOUNDARY = READY_FOR_PRODUCTION_APPLY
- WORKTREE = /Users/yanfenma/workspace/project/vehicle-pet-wt-companion-r1
- BRANCH = companion/r1 (base = origin/main de5c6b585a55b79b6b129a459809c0ba25e0034d)
- MERGED = PR #6 → main 272af9b92183519c21961aec421dcca9b65adc1f (2026-09-03)
- DSH_FORK_MASTER_AT_VERIFY = 419ee11c9bd5d01b206c8660762525d151bc4b4b (mayf3/deepseek-harness fork)
- FRESH_VERIFIED_AT = 2026-09-03

## Lanes

- LANE_COMPANION_SURFACE = READY_FOR_INTEGRATION → merged (常驻微进度条; audit ACCEPT 0 blocker)
- LANE_VISUAL_ASSETS = OWNER_GATE（ART_REQUEST_PACKET_COMPANION_R1.md 待 Owner 出图 4 张母图 l1–l4）
- LANE_PROGRESS_SOURCE = PROPOSED（DSH_PET_USAGE_PROGRESS_SOURCE_V1 proposed; NEW authority; Owner gate = DEC-USAGE-003 参数 + spec acceptance; 实现未开始）
- LANE_INTEGRATION = 隔离预览运行中 (port 3092, /tmp/vehicle-pet-companion-dsh-home-r1)

## Isolated preview (evidence)

- INSTALL/RUN/REINSTALL/UNINSTALL proven via `dsh plugin --profile web add/remove/list` (fork worktree deepseek-harness-wt-vehicle-pet-preview-f77b5a2f-20260828)
- Browser-verified: pet resident at L1 112px, micro bar rendered, click→panel→Escape three-state intact, tokenUsage projection live in deployment (session stats Input/Output tok)
- 用户真实 DSH 服务与 Profile 未被修改

## FOLLOW_UP_DEBT (audit, non-blocker)

- tests: span<=0 / capped / viewModel-null 早退分支、percent clamp、collapsed 守卫用例补齐
- VehiclePetOverlay.tsx: WithinLevelMicroProgress 注释 §8.1 归类措辞修正；内联类型改为 import PetViewModel；Math.round→floor
- README/docs：常驻微条能力说明

## Authority

- VEHICLE_PET_PRODUCT_DIRECTION_V1
- CONFIGURABLE_PET_ENGINE_V1
- DSH_PET_OVERLAY_ADAPTER_V1
- DSH_PET_USAGE_PROGRESS_SOURCE_V1 (proposed)
- governance adoption（.agents/local/README.md，accepted）

## Boundaries

- 不修改用户真实 DSH 服务 / Profile；仅独立 DSH_HOME + 独立端口。
- 不读取 Prompt/Completion/正文/凭据；usage 只处理结构化计数与稳定身份。
- 未获 accepted authority 前不实现真实 Token → progressPoints。
- 不扩建 Panel；不以程序化占位 SVG 充当正式美术。
- 达到 READY_FOR_PRODUCTION_APPLY 即停，等 Owner 决定安装。

