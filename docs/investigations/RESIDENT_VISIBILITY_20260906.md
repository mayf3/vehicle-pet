# 真实共存环境中的常驻车辆消失

## 坐标与范围

- Base / production: aa0a014dfc7767f1ff25c73c4775fdd687d56734
- Runtime: http://127.0.0.1:3080/，web Profile，2026-09-06
- Goal: 陪伴；Owner 报告鲸鱼娘点击和分组加载后车辆消失，并明确不希望点击车辆后出现完整系统面板。
- 本轮只在隔离 worktree 修复既有可见性义务；真实生产不热补丁，不修改 DSH Core、deepseek-pet、usage 或存储。

## Observations

OBS-VIS-001：进入已有普通会话后，车辆节点存在，112×112，初始 viewport 坐标 (1152,416)，root=VISIBLE。

OBS-VIS-002：正常点击/双击鲸鱼娘后，车辆仍存在但坐标变为 (1152,337)。宿主 frame 高720、scrollHeight799、scrollTop79；overlayLayer 和 vpo-root 的 viewport top 均为 -79。绝对定位的车辆随 overflow:hidden 的宿主内部滚动发生位移。

OBS-VIS-003：车辆中心的 elementsFromPoint 首项是 dsh-live2d-bubble。Vehicle Pet 根层 z-index=1，鲸鱼娘兄弟容器 z-index=60。正常车辆点击未打开面板；未使用 force 或 DOM click。

OBS-VIS-004：新会话/onboarding 时 Vehicle Pet DOM 为0；选择已有非空会话后恢复。这符合当前 CTR-OVERLAY-011，不把它和已复现的遮挡混为同一个原因。尚未单独证明分组加载事件本身清除了车辆节点。

CLM-VIS-001（SUPPORTED）：至少存在宿主滚动耦合与兄弟层遮挡两种真实可见性缺陷；依据 OBS-VIS-001..003。

## PREFLIGHT：可见性修复

SPEC_GOVERNANCE_MODE = PREFLIGHT
PREFLIGHT_MODE = REUSE
CHANGE_CLASS = NON_MECHANICAL
PRIMARY_GOVERNING_SPEC = DSH_PET_OVERLAY_ADAPTER_V1
RELATED_ACCEPTED_AUTHORITIES = CONFIGURABLE_PET_ENGINE_V2, DSH_USAGE_PROGRESS_SOURCE_V1, VEHICLE_PET_PRODUCT_DIRECTION_V1, repository governance
BASE_COMMIT = aa0a014dfc7767f1ff25c73c4775fdd687d56734
SPEC_PRESENT_IN_BASE = YES
SPEC_STATUS_IN_BASE = accepted
IMPLEMENTATION_AUTHORITY = contracts
IMPLEMENTATION_ALLOWED = YES (only viewport visibility and actual pointer reachability)

CTR-OVERLAY-003 requires the complete active surface to remain in the viewport; CTR-OVERLAY-004 requires recoverable visible states; CTR-OVERLAY-008 preserves click-through and no foreign DOM scrape/network path; CTR-OVERLAY-012 requires scoped disposal. A viewport-fixed root and a local layer above the observed peer restore these existing obligations. No host style, peer plugin, persistent preference, or source semantic is changed. This repair does not promise arbitrary collision avoidance for every other plugin.

EVD-VIS-001: OBS-VIS-001..003 VIOLATES the viewport/usability requirements of CTR-OVERLAY-003/004 at aa0a014 in this real coexistence environment. The existing happy-path acceptance was insufficient for this interaction sequence.

## 点击面板：尚未实现的产品差异

当前 accepted CTR-OVERLAY-004 明确要求点击车辆 toggles panel；CTR-OVERLAY-005 明确规定八项内容（含换伙伴、动效设置、完整旅程入口）。Owner 当前明确不希望这种完整控件面板。

方向：单击车辆只提供短暂轻反馈和一行当前状态/成长信息；常驻微进度继续可见；收起保留恢复入口；设置和完整旅程不在普通点击中展开。具体设置入口属于后续精简交互规格，不能把“所有参数堆在点击面板”继续叫作轻量陪伴。

该部分改变现有 accepted Contract，分类 SUPERSEDE，须先完成 docs-only successor 的独立审查和接受，再在包含 accepted successor 的 base 实现。不得在本次可见性修复中静默删改旧 Contract 或混入未授权交互。

## 验证边界

新增无模型、无生产会话数据的浏览器 layout fixture，复现720px宿主/799px溢出、79px内部滚动和z60同级气泡。测试必须在旧 CSS 失败，在修复后通过；同时检查 Composer 和同级气泡非重叠区域仍可点击。真实生产验收与新的发布授权尚未完成，不把隔离测试当作已修好生产。

## 追加现场事实与验证结果

OBS-VIS-005：键盘激活同一车辆按钮可打开 PANEL_OPEN（未作为鼠标可达验收）。实际面板320×415.28125，top=-63，含换伙伴、动效设置、完整旅程等；大面板顶部也被宿主滚动裁掉。证据见 docs/evidence/resident-visibility/panel-observation.json。

修复：仅将 Vehicle Pet 自己的根层改为 viewport-fixed，并提高其在当前 host overlay 内的局部层级；保持空白处 pointer-events:none，所有状态和存储逻辑不改。

结果：新增浏览器 layout 2项在旧CSS均失败（y416→337、气泡截获点击），修改后2项通过；现有 overlay DOM 23项通过；focused oxlint通过。工具链最初误用x64 Node，改用已有ARM Node后验证成功，未重装/变更共享依赖。

不是最终共存完结证明：固定层仍不能解决任意自定义位置造成的双向重叠；尚需真实共存回归，且精简点击交互未实现。未发布、未部署候选。此前生产验收的可见性/共存结论已被此新证据推翻。
