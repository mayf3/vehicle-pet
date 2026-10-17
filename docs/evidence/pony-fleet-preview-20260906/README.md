# Pony.ai 十二级小车视觉候选

用户确认方向：蓝白 SUV、单个车顶中央激光雷达、纯文字 `Pony.ai`、无马头标识。L1–L12 分别改造，L12 两辆迷你跟班。最终悬浮显示不允许背景板、渐变遮罩、背景图片或轮廓外光晕。

这是独立素材预览，不是已发布插件。来源参考：原等级素材基线 `aa0a014dfc7767f1ff25c73c4775fdd687d56734`，用户确认的蓝白车型图 `exec-0dffbb6b-53d4-46e8-80a0-21be8725ee59.png`。采用内置 image_gen 分别生成每级，再按用户授权做本地透明背景提取。未替换运行中的 packVersion 2.0.0 资产。

现有 CONFIGURABLE_PET_ENGINE_V2 的 §11.1 冻结黄色饰条等叙事与既有等级资产；CTR-PET-019 要求 packId/packVersion 不可变。发布时需协调 successor 权威与新素材包版本，不能覆盖同版本冻结素材。本目录仅交付用户要求的视觉候选，无运行时行为改动。

宿主背景的独立观察：上述基线 `src/dsh/client/styles.ts` 中 compact-overlay 的 `.vp-scene` 设置了 radial-gradient。最终接入需同时去掉该底色并检查场景背景层，不可仅替换图片后宣称遮罩已消失。

打开 index.html 可查看所有等级、深浅页面以及小尺寸效果。页面没有为每辆车设置背景、阴影或滤镜。PNG 和 lossless WebP 均应保有真实 alpha，检测记录在 quality.json；原始生成提示词及文件对应关系在 prompts.json。
