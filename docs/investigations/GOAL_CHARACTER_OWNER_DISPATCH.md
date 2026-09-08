# Goal 角色 — Owner dispatch

Attributable input: current Owner task, 2026-09-08. Documentation, isolated implementation and merge through required gates are authorized by this dispatch. Production application is forbidden. Character-sheet Owner/visual review precedes derivative art.

```text
GOAL_NAME = 角色

GOAL_MODE = NEW_GOAL

OWNER_DISPATCH_UNIT = GOAL


BUSINESS_GOAL =

让 Vehicle Pet 支持“角色选择”。

当前已有的蓝白 Vehicle Pet 继续保留，
同时新增至少一个原创的“人形陪伴角色”。

新角色希望有类似 deepseek-pet / 鲸鱼娘那种：

- 比较大的常驻存在感；
- 可爱、亲近；
- 表情丰富；
- 会随着工作状态变化表情；
- 会说短句；
- 适合作为长期桌面陪伴角色；

但只参考这种“陪伴体验”和完成度，

不得直接复制：

- 鲸鱼娘角色造型；
- 脸；
- 发型；
- 服装；
- 精确配色；
- 图片；
- Live2D；
- 动作数据；
- 代码；
- 文案；
- 品牌元素。


核心目标：

ONE_PROGRESS_SYSTEM
MULTIPLE_CHARACTER_PRESENTATIONS


============================================================
1. 产品模型
============================================================

用户至少可以选择：

CHARACTER_1 =
现有 Vehicle Pet 蓝白无人车角色

CHARACTER_2 =
新增原创人形陪伴角色


角色选择应该是：

PERSISTED_PREFERENCE = YES


切换角色：

- 不重置 progress；
- 不重置 level；
- 不重置 usage ledger；
- 不重置 Token Economy；
- 不改变 L1–L12 threshold；
- 不产生新的成长旅程。


也就是说：

同一个 progress / level
→ 根据当前选中的角色
→ 展示对应角色在这个 level 的视觉。


不要做：

每个角色一套独立经验值。


============================================================
2. 先读现有 L1–L12 的真实含义
============================================================

不要根据本 Prompt 猜等级语义。

开始时 fresh-read 当前 active：

- Vehicle Pet Product Direction；
- CONFIGURABLE_PET_ENGINE active authority；
- 当前 autonomous-fleet Pack；
- manifest；
- L1–L12 level configuration；
- 当前所有 level title / meaning / population / visual semantics。


输出：

CURRENT_LEVEL_SEMANTICS


然后把新角色的 12 个等级形象
机械映射到这些已经接受的等级含义。


不得为了人形角色
重新定义 L1–L12 产品语义。


============================================================
3. 新角色的等级设计原则
============================================================

不是：

L1 一个随机女孩
L2 另一个随机女孩
……
L12 又换了一个人。


必须明显是：

SAME_CHARACTER
SAME_IDENTITY
EVOLVING_WITH_LEVEL


可以随着等级提高逐步增加：

- 装备；
- 衣服细节；
- 配饰；
- 发光元素；
- 控制终端；
- 小型无人车伙伴；
- 城市 / 网络 / 全球规模的背景符号；
- 指挥/调度元素。


但人物本身：

脸
发型
主色
比例
画风

必须高度一致。


Owner 希望一眼能看出来：

“还是同一个伙伴，只是成长了。”


============================================================
4. 新角色视觉方向
============================================================

角色类型：

原创 Q 版 / 半 Q 版女性 AI 陪伴角色。


气质：

聪明
友好
轻盈
有一点未来感
但不是赛博朋克重装甲


建议视觉关键词：

- 白 / 浅蓝 / 青色为主；
- 可以有少量深蓝；
- 柔和发光；
- 圆润；
- 清爽；
- 大眼但不要幼儿化；
- 比工程助手更像长期陪伴角色；
- 与 Vehicle Pet Art V2 在同一个视觉世界里。


不要：

- Pony.ai；
- DeepSeek Logo；
- 品牌字样；
- 水印；
- 文字；
- 厚重机甲；
- 复杂 HUD；
- 大面积霓虹；
- 直接仿鲸鱼娘。


============================================================
5. 贴图 / expression system
============================================================

新角色要做成适合现有 resident pet 系统使用的贴图资产。

不要一开始上 Live2D。

优先：

STATIC_BASE
+
EXPRESSION / POSE VARIANTS
+
LIGHT CSS MOTION


至少覆盖当前已有状态：

idle
working
needs-input
completed
failed
cancelled


并增加陪伴型变体，例如：

happy
curious
sleepy
proud


目标：

EXPRESSION_VARIANTS >= 10


每个状态肉眼明显不同。


例如：

IDLE =
放松站姿 / 坐姿

WORKING =
认真看屏幕 / 操作小终端

NEEDS_INPUT =
歪头 / 问号 / 看向用户

COMPLETED =
开心 / 比赞 / 小庆祝

FAILED =
轻微沮丧但不要悲惨

CANCELLED =
松一口气 / 摆手

CURIOUS =
探头

SLEEPY =
打哈欠 / 半闭眼

PROUD =
开心叉腰 / 星星


不要：

只是换嘴巴 2px。


============================================================
6. 12 个 level 与视觉成长映射
============================================================

Agent 必须根据 CURRENT_LEVEL_SEMANTICS
自行设计 12 级映射。

总体原则：

低等级：
“个人伙伴 / 小规模”

中等级：
“开始调度 / 管理多个无人车 / 城市能力”

高等级：
“多城市 / 多区域 / 全球规模”


但最终具体设计
必须以当前 active Pack 的真实 L1–L12 meaning 为准。


可以通过：

角色装备
+
身边的小型 vehicle units
+
象征性的环境元素

表达等级。


不要通过：

12 张完全不同角色

表达等级。


============================================================
7. 资产生产
============================================================

如果需要生成新角色贴图：

可以使用当前允许的 ChatGPT image-generation browser route。

CHATGPT_BROWSER_ROUTE =
CODEX_SIDEBAR_BROWSER


图像生成只用于：

ART_PRODUCTION


不得用于：

build
test
runtime


每一轮必须：

先 character sheet
→ Owner/visual review
→ 再派生 level masters
→ expression variants


不要：

12 个等级分别独立随机生成。


先锁定：

CHARACTER_BIBLE


然后所有图基于同一角色 identity 派生。


============================================================
8. Character Bible
============================================================

至少产出：

character-sheet.png

包含：

- 正面；
- 3/4；
- 基础站姿；
- 主色；
- 发型；
- 脸；
- 服装；
- 关键配饰。


expression-sheet.png

包含至少：

10 个 expression / pose。


level-contact-sheet.png

包含：

L1–L12 同框预览。


small-preview-contact-sheet.png

至少验证：

SMALL
LARGE

两种 resident 尺寸。


============================================================
9. 角色选择 UI
============================================================

不要恢复旧 Panel。


在当前 secondary settings 里
增加一个低干扰：

CHARACTER


选择项。


例如：

角色
  车宠
  新人形伙伴


具体 UI 自主设计，
但保持 secondary。


不要做：

Character Store
角色商城
角色抽卡
金币
解锁付费体系。


V1 只做：

2 个角色。


============================================================
10. Pack / architecture
============================================================

优先判断现有 declarative Pet Pack
是否已经足够表达多角色。


理想模型：

ENGINE =
REUSE

PROGRESS_SOURCE =
REUSE

TOKEN_ECONOMY =
REUSE


不同角色尽量通过：

CHARACTER_PACK / VISUAL_PACK

声明式表达。


不要在 Overlay 写：

if character === girl
  renderGirlSpecialCase()


更不要复制一整套 Engine。


目标：

same engine
same progression
different presentation pack


============================================================
11. 角色切换
============================================================

角色切换必须：

即时生效。


例如当前：

L7
Vehicle Pet


切到人形角色：

仍然是：

L7
同样 progressPoints


只是：

显示人形角色的 L7 形象。


切回来：

仍是原来的 L7。


必须：

CHARACTER_SWITCH_PROGRESS_PRESERVED =
YES


============================================================
12. Speech
============================================================

当前 speech system 继续复用。


新角色可以有：

自己的 curated speech catalog


但使用：

同一套 trigger / cooldown / anti-annoyance engine。


不要建立第二套 speech scheduler。


可以允许：

character-specific tone


例如车宠稍微偏：

“跑一趟”
“出发啦”

新人形角色稍微偏：

“我来看看。”
“交给我吧。”
“这里需要你一下。”


仍然：

短
自然
克制


============================================================
13. SMALL / LARGE
============================================================

两个角色都支持：

SMALL
LARGE


新人形角色 LARGE：

视觉存在感可以参考鲸鱼娘当前真实 bbox。


但不要复制精确 px，
根据新角色透明 bbox 决定。


SMALL：

不能缩成看不清脸的一粒。


============================================================
14. 与鲸鱼娘共存
============================================================

现实里可能同时有：

Vehicle Pet / 新人形角色
+
deepseek-pet 鲸鱼娘


所以必须验证：

NO_OVERLAP
NO_COMPOSER_OCCLUSION
NO_SEND_OCCLUSION


新人形角色不能因为“也像人物”
就和鲸鱼娘视觉上完全重叠。


可以通过：

位置
朝向
比例
轮廓
主色

形成明确区分。


============================================================
15. Governance
============================================================

当前 Governance V1 已采用。


这是新的产品 capability：

CHARACTER_SELECTION


因此先做：

AUTHORITY_PREFLIGHT


机械判断：

是否需要 Overlay authority successor
以及是否需要 Pack / manifest authority amendment/successor。


不要直接先写代码。


但：

不要因此发明庞大的角色平台 Spec。


V1 只需要授权：

- exactly two selectable characters；
- shared progression；
- persisted character choice；
- declarative visual mapping；
- character-specific art/speech。


============================================================
16. Scope
============================================================

IN_SCOPE =

- 角色选择；
- 一个新人形角色；
- L1–L12 对应贴图；
- expression；
- speech catalog；
- SMALL/LARGE；
- declarative mapping；
- settings selector；
- persistence。


OUT_OF_SCOPE =

- 多于两个角色；
- 商店；
- 解锁；
- 付费；
- 抽卡；
- Live2D；
- TTS；
- 语音；
- AI 实时生成角色；
- 用户上传 avatar；
- 捏脸；
- 动态换装；
- 多 progress journey。


============================================================
17. 视觉审计
============================================================

INDEPENDENT_VISUAL_REVIEW =
REQUIRED


必须回答：

1. 新人形角色是不是原创，而不是鲸鱼娘 clone？
2. 是否和 Vehicle Pet 属于同一视觉世界？
3. L1–L12 是否明显是同一个角色成长？
4. 不看文字能否看出低 / 中 / 高等级规模差异？
5. SMALL 是否还能看清表情？
6. LARGE 是否具有陪伴感？
7. 10 个 expression 是否肉眼可辨？
8. 和鲸鱼娘同框是否能明显区分？


如果 REJECT：

BLOCKER_UNION
→ 一次集中修复
→ one re-audit


============================================================
18. Testing
============================================================

至少新增：

CHARACTER_SELECTOR
CHARACTER_PERSISTENCE
CHARACTER_SWITCH_NO_PROGRESS_RESET
CHARACTER_L1_L12_MAPPING
CHARACTER_SMALL_LARGE
CHARACTER_EXPRESSION_MAPPING
CHARACTER_SPEECH_CATALOG
CHARACTER_REDUCED_MOTION
CHARACTER_WHALE_COEXISTENCE


以及现有：

pnpm verify
pnpm verify:dsh
assets:check
git diff --check


============================================================
19. Production boundary
============================================================

PRODUCTION_APPLY_ALLOWED =
NO


先做到：

authority accepted
+
implementation merged
+
isolated DSH preview
+
visual audit ACCEPT
+
code audit ACCEPT


然后停：

READY_FOR_PRODUCTION_APPLY


Owner 再决定是否上线。


============================================================
20. Done
============================================================

DONE_WHEN =

CHARACTER_COUNT =
2

VEHICLE_PET_PRESERVED =
YES

NEW_HUMANOID_CHARACTER =
PASS

NEW_CHARACTER_ORIGINALITY =
PASS

CHARACTER_SELECTOR =
PASS

CHARACTER_PREFERENCE_PERSISTED =
PASS

SHARED_PROGRESS =
PASS

LEVEL_RESET_ON_SWITCH =
NO

L1_L12_NEW_CHARACTER_MAPPING =
PASS

SAME_CHARACTER_ACROSS_LEVELS =
YES

EXPRESSION_VARIANTS >= 10

SMALL =
PASS

LARGE =
PASS

SPEECH =
PASS

REDUCED_MOTION =
PASS

WHALE_COEXISTENCE =
PASS

COMPOSER_OCCLUSION =
NO

INDEPENDENT_VISUAL_REVIEW =
ACCEPT

INDEPENDENT_CODE_AUDIT =
ACCEPT

SHIP_BLOCKERS =
0

MERGED =
YES

ISOLATED_DSH_ACCEPTANCE =
PASS

GOAL_STATUS =
READY_FOR_PRODUCTION_APPLY


然后：

STOP WORK ON THIS GOAL
```
