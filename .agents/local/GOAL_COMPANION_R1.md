# GOAL_STATE = 陪伴 (GOAL_R1)

- GOAL_STATUS = ACTIVE
- CURRENT_PHASE = INTEGRATION
- GOAL_TERMINAL_BOUNDARY = READY_FOR_PRODUCTION_APPLY
- WORKTREE = /Users/yanfenma/workspace/project/vehicle-pet-wt-companion-r1
- BRANCH = companion/r1 (base = origin/main de5c6b585a55b79b6b129a459809c0ba25e0034d)
- MERGED = PR #6 reverted on main (a7fb676, Owner-directed semantic split); PR #8 (surface, head be60220, audit ACCEPT 0 blocker) merged → main 8035eda (2026-09-04)
- DSH_FORK_MASTER_AT_VERIFY = 419ee11c9bd5d01b206c8660762525d151bc4b4b (mayf3/deepseek-harness fork)
- FRESH_VERIFIED_AT = 2026-09-03

## Lanes

- LANE_COMPANION_SURFACE = READY_FOR_INTEGRATION → merged via PR #8 (微进度条 + effective reduced-motion gate; audit ACCEPT 0 blocker, head-bound)
- LANE_VISUAL_ASSETS = OWNER_GATE（ART_REQUEST_PACKET_COMPANION_R1.md 待 Owner 出图 4 张母图 l1–l4）
- LANE_PROGRESS_SOURCE = DRAFT（ withdrawn V1 draft; successor VEHICLE_PET_PROGRESS_SOURCE_V2 Draft PR #9; SUPERSEDE route realized as the direction's own 'separate Progress Source Spec' path; token economy deferred to Owner packet, 7-day counts-only baseline measured 2026-09-04）
- LANE_INTEGRATION = 隔离预览运行中 (port 3092, /tmp/vehicle-pet-companion-dsh-home-r1)

## Isolated preview (evidence)

- INSTALL/RUN/REINSTALL/UNINSTALL proven via `dsh plugin --profile web add/remove/list` (fork worktree deepseek-harness-wt-vehicle-pet-preview-f77b5a2f-20260828)
- Browser-verified: pet resident at L1 112px, micro bar rendered, click→panel→Escape three-state intact, tokenUsage projection live in deployment (session stats Input/Output tok)
- 用户真实 DSH 服务与 Profile 未被修改

## FOLLOW_UP_DEBT (audit, non-blocker)

- PR#8 audit: reducedMotion 有效偏好表达式与 Engine gate 重复（可改单源 viewModel.reducedMotion）；OS 偏好变化无 listener（既有模式）；capped/span<=0 边界无直接单测、宽度值未断言
- PR#6 audit (prior round): §8.1 注释归类措辞；内联类型改 import PetViewModel；Math.round→floor
- README/docs：常驻微条能力说明
- collapsed/重度日 behavior：可选 daily_cap 未采纳（Owner 默认 NO），重度日可能单日跳 2–3 级，如需可后续以 amendment 引入

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


## Isolated preview operations (restart one-liners, disposable env only)

```bash
# web (serves until killed; survives launcher exit):
cd /Users/yanfenma/workspace/project/vehicle-pet-wt-companion-r1
DSH_REFERENCE_WORKTREE=/Users/yanfenma/workspace/github/deepseek-harness-wt-vehicle-pet-preview-f77b5a2f-20260828 \
DISPOSABLE_DSH_HOME=/tmp/vehicle-pet-companion-dsh-home-r1 \
VEHICLE_PET_PLUGIN_ROOT=/Users/yanfenma/workspace/project/vehicle-pet-wt-companion-r1 \
VEHICLE_PET_DSH_WEB_PORT=3092 node tests/dsh/e2e/launch-dsh-web.mjs
# mock LLM (session-hosted background task; dies with the session — rerun as needed):
DSH_REFERENCE_WORKTREE=/Users/yanfenma/workspace/github/deepseek-harness-wt-vehicle-pet-preview-f77b5a2f-20260828 \
VEHICLE_PET_MOCK_LLM_PORT=8901 node tests/dsh/e2e/mock-supervisor.mjs
```
