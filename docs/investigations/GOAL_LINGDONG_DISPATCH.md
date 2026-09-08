# GOAL 灵动 — Owner dispatch record

```text
RECORD_KIND = investigation (verbatim Owner mandate persistence, non-authoritative)
PERSISTED_AT = 2026-09-08
PROVENANCE = Owner Goal dispatch received in the execution session for mayf3/vehicle-pet at origin/main cce0e9d24907e7c17e42fd2b310a68a98860d5cf
PURPOSE = makes the attributable Execution Mandate reviewable (R1 audit FINDING 7); the normative product direction is independently restated in DSH_PET_OVERLAY_ADAPTER_V3
```

The dispatch below is the verbatim Owner Goal text, preserved without
interpretation. Section numbering is the Owner's.

---

GOAL_NAME = 灵动

GOAL_MODE = NEW_GOAL

OWNER_DISPATCH_UNIT = GOAL

BUSINESS_GOAL =

把当前 Vehicle Pet 从：

“透明悬浮的一张车图 + 底部进度条 + 点击弹出信息 Panel”

改成真正类似桌面宠物的长期陪伴体验：

- 车本身就是主要 UI；
- 有 SMALL / LARGE 两种常驻尺寸；
- LARGE 模式有接近 deepseek-pet / 鲸鱼娘的视觉存在感；
- 不再显示常驻进度条；
- 正常点击不再弹出当前 264px 信息 Panel；
- 有更多静态表情、姿态和轻量动作；
- 会根据当前状态偶尔说简短的话；
- 设置入口借鉴鲸鱼娘的低干扰交互方式；
- 不复制鲸鱼娘的角色、美术、文案或品牌；
- 不修改当前 Vehicle Pet Art V2 角色身份。

核心目标：

MORE_PET
LESS_UI

GOAL_TERMINAL_BOUNDARY =
READY_FOR_PRODUCTION_APPLY

PRODUCTION_APPLY_ALLOWED =
NO

先完成 fixed-ref 隔离真实 DSH 验收，
给 Owner 看 SMALL / LARGE / 气泡 / 状态实际效果，
不要直接修改真实生产。

CURRENT_PHASE =
PRODUCT_PREFLIGHT

PHASE_LOCK =
ON

# 1. 当前基线

REPOSITORY =
mayf3/vehicle-pet

EXPECTED_CURRENT_MAIN_AT_DISPATCH =
cce0e9d24907e7c17e42fd2b310a68a98860d5cf

开始时 fresh-verify origin/main。

当前已经完成，全部视为 IMPORTED_HISTORY：

- Governance V1 v1.0.3；
- Vehicle Pet Art V2；
- L1–L12；
- L6–L12 规模进化；
- transparent resident pet；
- simplified Panel；
- seedling 用户不可见；
- 五状态 expression layer；
- counts-only usage progress；
- Token Economy；
- progress ledger；
- Reduced Motion；
- drag / position persistence；
- deepseek-pet 共存。

不要重做这些能力。

# 2. 当前真实 Gap

CURRENT_GAP =

GAP_1_PANEL =

当前普通点击 Pet 仍会进入 PANEL_OPEN，
弹出 Vehicle Pet compact panel。

Owner 不喜欢这个交互。

日常桌面宠物不应该：

点击角色
→ 弹工程信息面板。

GAP_2_PROGRESS_BAR =

当前常驻 Pet 下方仍有 micro progress bar。

Owner 不喜欢。

成长应该是底层机制，
不是一直挂在角色脚下的仪表条。

GAP_3_SIZE =

当前 Vehicle Pet 的常驻体量明显小于 deepseek-pet / 鲸鱼娘。

Owner 希望像鲸鱼娘一样：

有 SMALL
和
LARGE

两个明确版本。

GAP_4_LIVENESS =

当前虽然已有：

idle
working
needs-input
completed
failed/cancelled

五状态 expression，

但仍然“不够像活着的宠物”。

Owner希望：

- 更多表情；
- 更多细微姿态；
- 会偶尔说短句；
- 状态变化有角色反应。

# 3. 先研究鲸鱼娘，但只研究交互原则

REFERENCE_PRODUCT =
当前真实 DSH 中已安装运行的 deepseek-pet / 鲸鱼娘

开始 PRODUCT_PREFLIGHT 时，
对当前生产 deepseek-pet 做一次严格只读 UX census。

只研究和本 Goal 有关的：

1. 它实际显示尺寸；
2. 是否存在大小两档以及切换方式；
3. 用户如何进入设置；
4. 设置是否用 Panel / popover / context affordance；
5. speech bubble 如何出现、消失和定位；
6. 角色点击行为；
7. 拖动行为；
8. 大小 preference 如何保存；
9. bubble 与角色 bbox 的关系；
10. 如何避免挡住 Composer；
11. 如何处理其它页面 / 空白会话；
12. Reduced Motion / 动画相关行为（若存在）。

必须保存：

WHALE_UX_OBSERVATIONS

区分：

OBSERVED
和
INFERRED。

不得复制：

- Live2D model；
- 图片；
- 代码；
- 文案；
- 角色动作数据；
- 品牌；
- 精确造型。

目标是：

REFERENCE_INTERACTION_PRINCIPLES
而不是
COPY_IMPLEMENTATION。

# 4. Owner 冻结产品方向

RESIDENT_BACKGROUND =
TRANSPARENT

不得恢复任何：

card
gradient
surface tint
rounded backdrop

RESIDENT_PROGRESS_BAR =
NONE

常驻 SMALL / LARGE 两个模式都：

不得显示微进度条。

底层：

progressPoints
level
Token economy

全部继续存在。

完整成长进度可以继续在：

Full Journey
或其它低频入口

中查看。

# 5. Panel 方向

NORMAL_PET_CLICK_OPENS_PANEL =
NO

当前：

Pet click → PANEL_OPEN

这个日常交互要取消。

Owner 不要当前这种：

264px compact information panel。

PANEL_DAILY_SURFACE =
NO

低频设置能力仍然必须存在，例如：

- LARGE / SMALL；
- Reduced Motion；
- Collapse / hide-to-launcher；
- Full Journey。

但它们应参考鲸鱼娘的低干扰设置入口，
例如小型 context popover / setting affordance / secondary action。

具体交互由 Agent 在研究真实鲸鱼娘之后自主确定。

禁止：

把现在 264px Panel
重新换皮成另一个 260px Panel。

目标是：

SETTINGS_IS_SECONDARY
PET_IS_PRIMARY

# 6. SMALL / LARGE 双尺寸

SIZE_MODES =

SMALL
LARGE

SMALL =

用于：

- 不想挡内容时；
- 长时间工作；
- 较低视觉占用。

以当前 resident 112px 视觉为参考，
允许根据 V2 sprite 实际透明 bbox
做小幅优化。

不要求机械保持 112px，
但视觉体量应属于 compact companion。

LARGE =

明显更大。

目标：

在 Owner 当前屏幕中，
Vehicle Pet 的视觉存在感与鲸鱼娘处于同一量级，

而不是当前截图中
“鲸鱼娘是主要角色，Vehicle Pet 像一个小图标”。

不得简单照搬鲸鱼的 px。

Agent 应 fresh-measure：

WHALE_VISIBLE_BBOX
VEHICLE_SMALL_VISIBLE_BBOX

然后选择 LARGE，
使视觉面积 / 高度处于合理的同量级。

建议约束：

LARGE_HEIGHT ≈ 1.6–2.2 × SMALL_HEIGHT

但实际数值根据真实透明 sprite bbox 与宿主布局决定。

LARGE 不得：

- 遮挡 Composer；
- 遮挡 Send；
- 覆盖 deepseek-pet；
- 超出 viewport；
- 创建巨大透明 hitbox。

# 7. 尺寸交互

SIZE_PREFERENCE_PERSISTED =
YES

用户选过 SMALL / LARGE 后：

- reload 保持；
- 新 session 保持；
- DSH restart 后保持。

默认：

已有明确 preference
→ 保留。

没有 preference
→ LARGE。

理由：

Owner 当前明确反馈现状“车辆有点小”。

Size toggle 不得要求打开复杂 Panel。

最终 size-toggle 入口
参考鲸鱼娘真实设置交互后自主确定。

# 8. More expressions

当前五状态不得删除：

IDLE
WORKING
NEEDS_INPUT
COMPLETED
FAILED_OR_CANCELLED

在此基础上增加“陪伴型 sub-expression”。

目标至少形成：

8 个以上肉眼可辨的 expression / mood variant。

推荐语义池：

IDLE_NEUTRAL
IDLE_HAPPY
IDLE_CURIOUS
IDLE_SLEEPY

WORKING_FOCUSED

NEEDS_INPUT_QUESTION

COMPLETED_HAPPY
COMPLETED_PROUD

FAILED_SOFT
CANCELLED_RELAXED

不强制使用这些精确名字，
但必须覆盖：

- 日常；
- 开心；
- 好奇；
- 休息；
- 工作；
- 等用户；
- 完成；
- 轻微失败。

不能：

12 levels × N expressions
全部重新生成完整 sprite。

优先继续沿用当前：

LEVEL_BASE_VISUAL
+
EXPRESSION_LAYER
+
SMALL_MOTION

只增加：

eyes
mouth
brow
cheek
symbol
small pose accents

等可复用表达。

不得重新设计 Art V2 车本体。

# 9. Speech / “会说话”

SPEECH_BUBBLE =
YES

这是 UI 气泡文字，
不是语音合成。

不得调用模型。

不得读取：

- Prompt body；
- Completion body；
- 用户消息正文；
- credential；
- clipboard。

只能根据已有结构化状态触发。

允许的触发来源：

SESSION_STATE
PROGRESS_EVENT
LEVEL_EVENT
USER_INTERACTION
BOUNDED_IDLE_TIMER

speech bubble：

- 非 modal；
- 不抢 focus；
- 不阻塞 Composer；
- 自动消失；
- 同时最多一个；
- LARGE / SMALL 都可用；
- 根据空间自动在 Pet 上方或侧方定位；
- 不能盖鲸鱼娘。

# 10. 文案语气

COPY_STYLE =

短
自然
像陪伴
不工程化
不汇报日志
不卖萌过度

不要出现：

“任务状态：Running”
“Token +135”
“Progress 24.3%”
“系统检测到……”

可以类似：

idle:
“我在这儿。”
“今天也一起跑吧。”
“发会儿呆也不错。”

working:
“我去跑一趟。”
“正在忙～”
“交给我一会儿。”

needs-input:
“到你啦。”
“这里要你看看。”
“我等你一下。”

completed:
“搞定。”
“跑完啦！”
“这次很顺。”

failed:
“这次没跑通。”
“换条路再来。”
“没事，我们再试。”

这些只是 TONE REFERENCE，
不是必须逐字采用。

要求至少：

30 条以上 curated short lines

分布于：

idle
working
needs-input
completed
failed/cancelled
level-up / milestone

运行时随机选择必须：

deterministic-enough / testable
+
避免连续重复。

# 11. Ambient speech 防骚扰

Event-driven speech 优先。

纯 idle 主动说话必须克制。

最低规则：

- 页面刚加载不立刻连续冒泡；
- 同一状态不连续重复同一句；
- bubble 关闭后存在 cooldown；
- 同一时刻只有一个 bubble；
- 用户正在输入时不得频繁冒泡；
- Reduced Motion 不影响文字可理解性。

Agent 自主决定具体 timing，
但体验审计必须明确判断：

ANNOYANCE_RISK =
LOW

不要做：

每几十秒说一句。

# 12. Pet 点击行为

普通左键点击不再弹 Panel。

优先考虑类似桌面宠物：

CLICK =
一次轻量 reaction

例如：

- 换一个 idle expression；
- 轻微 bounce；
- 偶尔说一句；
- LARGE / SMALL 的显式按钮或 secondary gesture。

具体 interaction
必须参考真实 deepseek-pet 后决定。

但必须满足：

PET_CLICK_FEELS_LIKE_PET =
YES

PET_CLICK_FEELS_LIKE_SETTINGS_BUTTON =
NO

# 13. Full Journey

成长体系不能消失。

Full Journey 仍然允许存在，
但不应该成为 Pet 单击后的默认面板。

必须有一个：

LOW_FREQUENCY_JOURNEY_ENTRY

入口可位于：

secondary settings affordance。

不得重新做大型新 UI。

# 14. Collapse

COLLAPSED capability 保留。

但可以研究鲸鱼娘的方式，
使其更像：

最小化 / 隐藏宠物

而不是“Panel 上一个按钮”。

必须继续有恢复路径。

不得：

FULL_HIDE_WITH_NO_RESTORE

# 15. Progress

IMPORTANT：

REMOVE_RESIDENT_PROGRESS_BAR =
YES

但：

REMOVE_PROGRESS_SYSTEM =
NO

以下保持：

progressPoints
derived level
usage ledger
token economy
level-up
keepsakes
journey

只改变日常 resident presentation。

# 16. Authority Routing

当前仓库已经采用 Governance V1。

AUTHORITY_ACTION =
PREFLIGHT_DECIDE_MINIMALLY

预期：

DSH_PET_OVERLAY_ADAPTER_V2

很可能明确冻结：

- PANEL_OPEN；
- compact panel；
- resident micro progress；
- VISIBLE / PANEL_OPEN / COLLAPSED lifecycle。

因此：

AUTHORITY_ACTION =
SUPERSEDE_EXPECTED

大概率需要：

DSH_PET_OVERLAY_ADAPTER_V3

但是 Agent 必须 fresh-read active authority 后机械决定。

CONFIGURABLE_PET_ENGINE_V3 =
REUSE_EXPECTED

DSH_USAGE_PROGRESS_SOURCE =
REUSE_EXPECTED

TOKEN_ECONOMY =
REUSE

不要因为 UI 改变
顺手动 Engine authority。

# 17. Plan / Assurance

PLAN_LEVEL =
BRIEF

除非 preflight 证明 surface 扩大。

ASSURANCE_LEVEL =
DURABLE

原因：

这是长期用户交互 Contract，
但不是生产数据迁移或高风险系统变更。

如果最终需要生产 mutation，
另走 Owner production gate。

# 18. Implementation principles

优先复用：

现有 Vehicle Pet Overlay
expression system
preferences
drag
asset pipeline

不得：

- 引入第二套 React；
- 修改 DSH Core；
- iframe；
- dev server runtime dependency；
- external pet network；
- runtime model call；
- Live2D；
- copy deepseek-pet implementation。

不要把 Vehicle Pet 改造成鲸鱼娘 clone。

# 19. Art boundary

BASE_ART =
KEEP_CURRENT_ART_V2

不重新生成 L1–L12 基础车图。

新增 expression 时：

优先 deterministic vector / overlay recipes
和当前 expression pipeline。

如果确实需要新增视觉资产，
仍必须：

transparent
deterministic
provenance
no logo
no watermark。

# 20. Evidence

EVIDENCE_NEEDED =

E1 =
SMALL 模式真实 DSH 截图。

E2 =
LARGE 模式真实 DSH 截图，
与鲸鱼娘同时出现，
可以看出两者视觉存在感处于同量级。

E3 =
SMALL / LARGE 切换后 reload 仍保持。

E4 =
resident progress bar 完全不存在。

E5 =
正常 Pet click 不出现旧 Panel。

E6 =
低频 settings 仍可访问：

- size；
- Reduced Motion；
- Full Journey；
- collapse。

E7 =
至少 8 种 expression 静态 contact sheet。

E8 =
至少：

idle
working
needs-input
completed
failed

真实 session-state mapping PASS。

E9 =
speech bubble 在：

idle
working
needs-input
completed
failed

至少各有真实 UI evidence。

E10 =
bubble：

- 不挡 Composer；
- 不挡 Send；
- 不与 deepseek-pet 重叠；
- 可自动消失；
- 不抢 focus。

E11 =
Reduced Motion 下：

expression 静态可辨；
speech 正常；
没有必须依靠动画才能理解的状态。

E12 =
L1–L12 progression / usage progress 无回归。

# 21. Testing

至少保持：

pnpm assets:check
pnpm verify
pnpm verify:dsh
git diff --check

Governance：

route validator
transition validator（若 authority supersede）

新增 E2E / DOM contract：

SIZE_MODE_SMALL
SIZE_MODE_LARGE
SIZE_PERSISTENCE
NO_RESIDENT_PROGRESS_BAR
NO_NORMAL_CLICK_PANEL
SECONDARY_SETTINGS_ACCESSIBLE
SPEECH_BUBBLE_LIFECYCLE
SPEECH_NO_FOCUS_STEAL
SPEECH_NO_COMPOSER_OCCLUSION
EXPRESSION_VARIANTS
REDUCED_MOTION_STATIC_PARITY
DEEPSEEK_PET_COEXISTENCE

# 22. Independent audits

若 authority change：

INDEPENDENT_SPEC_AUDIT =
REQUIRED

始终：

INDEPENDENT_CODE_AUDIT =
REQUIRED

INDEPENDENT_EXPERIENCE_AUDIT =
REQUIRED

体验审计必须直接回答：

1. 它现在更像宠物，还是仍像一个插件按钮？
2. LARGE 是否足够有存在感？
3. SMALL 是否足够不打扰？
4. 没有进度条后是否更干净？
5. 点击 Pet 是否仍有“弹设置面板”的感觉？
6. speech 是否自然，还是烦人？
7. 表情是否明显增加？
8. 和鲸鱼娘同时存在是否协调而非抢位？

BLOCKER_UNION =
一次

集中修复一次
→
one re-audit

# 23. Production boundary

PRODUCTION_APPLY_ALLOWED =
NO

本 Goal 停在：

READY_FOR_PRODUCTION_APPLY

最终 fixed-ref 必须先在：

独立 DSH_HOME
独立 profile
独立 port

验收。

不要直接修改：

~/.dsh production web profile。

# 24. Done

DONE_WHEN =

RESIDENT_BACKGROUND =
TRANSPARENT

RESIDENT_PROGRESS_BAR =
ABSENT

NORMAL_CLICK_PANEL =
ABSENT

SMALL_MODE =
PASS

LARGE_MODE =
PASS

SIZE_PERSISTENCE =
PASS

SECONDARY_SETTINGS =
PASS

EXPRESSION_VARIANT_COUNT >= 8

SPEECH_LINE_COUNT >= 30

SPEECH_BUBBLE =
PASS

SESSION_STATE_REACTIONS =
PASS

REDUCED_MOTION =
PASS

DEEPSEEK_PET_COEXISTENCE =
PASS

COMPOSER_NOT_OCCLUDED =
PASS

L1_L12 =
PRESERVED

USAGE_PROGRESS =
PRESERVED

TOKEN_ECONOMY =
UNCHANGED

ALL_GATES =
PASS

INDEPENDENT_AUDITS =
ACCEPT

SHIP_BLOCKERS =
0

MERGED =
YES

ISOLATED_FIXED_REF_ACCEPTANCE =
PASS

GOAL_STATUS =
READY_FOR_PRODUCTION_APPLY

然后：

STOP WORK ON THIS GOAL

# 25. Anti-churn

本 Goal 只解决：

“让 Vehicle Pet 更像真正会陪伴的桌面宠物”。

不得：

- 再换 Art V2 基础角色；
- 重做 L1–L12；
- 改 Token Economy；
- 改 usage source；
- 改 seedling；
- 重新做复杂 Panel；
- 做音频；
- 做 TTS；
- 做语音输入；
- 做商店；
- 做金币；
- 做小游戏；
- 做多宠物；
- 做 Live2D；
- 修改 DSH Core。

# 26. Reporting

只在状态变化时：

GOAL_STATUS =
CURRENT_PHASE =
AUTHORITY_ACTION =
WHALE_REFERENCE_OBSERVED =
RESIDENT_PROGRESS_BAR =
PANEL_MODEL =
SIZE_MODEL =
EXPRESSION_COUNT =
SPEECH_SYSTEM =
BLOCKERS =
NEXT =
OWNER_ACTION_REQUIRED =
