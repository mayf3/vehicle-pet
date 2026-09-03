# GOAL_STATE = 陪伴 (GOAL_R1)

- GOAL_STATUS = ACTIVE
- CURRENT_PHASE = PREFLIGHT
- GOAL_TERMINAL_BOUNDARY = READY_FOR_PRODUCTION_APPLY
- WORKTREE = /Users/yanfenma/workspace/project/vehicle-pet-wt-companion-r1
- BRANCH = companion/r1 (base = origin/main de5c6b585a55b79b6b129a459809c0ba25e0034d)
- DSH_FORK_MASTER_AT_VERIFY = 419ee11c9bd5d01b206c8660762525d151bc4b4b (mayf3/deepseek-harness fork)
- FRESH_VERIFIED_AT = 2026-09-03

## Lanes

- LANE_COMPANION_SURFACE = ACTIVE（目标 READY_FOR_INTEGRATION）
- LANE_VISUAL_ASSETS = ACTIVE_UNTIL_OWNER_ART_GATE（本地无图像生成 → 出 ART_REQUEST_PACKET 后转 OWNER_GATE）
- LANE_PROGRESS_SOURCE = ACTIVE（真实 Token integration 未获 authority，先调查 DSH usage seam，再判 AMEND|NEW）
- LANE_INTEGRATION = BLOCKED_BY_DEPENDENCY（等前三 Lane READY）

## Authority

- VEHICLE_PET_PRODUCT_DIRECTION_V1
- CONFIGURABLE_PET_ENGINE_V1
- DSH_PET_OVERLAY_ADAPTER_V1
- governance adoption（.agents/local/README.md，accepted）

## Boundaries

- 不修改用户真实 DSH 服务 / Profile；仅独立 DSH_HOME + 独立端口。
- 不读取 Prompt/Completion/正文/凭据；usage 只处理结构化计数与稳定身份。
- 未获 accepted authority 前不实现真实 Token → progressPoints。
- 不扩建 Panel；不以程序化占位 SVG 充当正式美术。
- 达到 READY_FOR_PRODUCTION_APPLY 即停，等 Owner 决定安装。
