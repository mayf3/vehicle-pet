# ENGINE_DATE_ROLLOVER_HANG — 日期翻转触发的表现层死循环(调查记录)

```text
SPEC_GOVERNANCE_MODE = PREFLIGHT/INVESTIGATION (非权威)
DISCOVERED_AT = 2026-09-11 凌晨(Goal 生命感 verify:dsh 复验期间)
AFFECTS = 共享 engine/react 表现层(基线 67b8fcf 即复现;精确循环点未定位)
V7_RELATION = 与 DSH_PET_OVERLAY_ADAPTER_V7 实现无关(见 §2 排除证据)
STATUS = OPEN — 修复需引擎 authority round(超 V7 文件面 src/dsh/**+tests/**)
CONTAINMENT_IN_PLACE = tests/dsh/dom/setup.ts 钉 Date(仅测试面,8a04a90..8ff340c)
```

## 1. 现象

> **FACTUAL CORRECTION (2026-09-11, post-fix-round)**:本记录初版把同期的菜单类
> e2e 失败一并归于本现象,**该归因是错误的**。菜单类失败的已证实根因
> (全部已在实现分支修复并验证):(a) 宿主页面交互后 activeElement 落于 body,
> Escape 键盘链失效 → 修复 = 菜单打开期 document 级捕获 keydown;(b) late-night
> ritual 的 due-check 与标记写入使用了不一致的日键 → 修复 = 统一 ritual-day key;
> (c) `commitPreferences` 的 updater 内含 save 副作用,React 渲染期重放
> updater 放大为写风暴 → 修复 = 纯 updater + once-per-commit 持久化;
> (d) dblclick 中途重挂载丢失手势链 → 修复 = 模块级链记忆。
> **仍然成立且未完全解释的只剩 §1.1 的 jsdom 日期敏感 OOM/hang 一项**
> (containment 生效,不影响 shipped runtime)→ 分类 KNOWN_LIMITATION/FOLLOW_UP_DEBT。

### 1.1 jsdom 日期敏感 OOM/hang(仍然成立的部分)

设备本地日期 ≥ 2026-09-11 时:

1. **jsdom 套件**:`tests/dsh/dom/overlay.test.tsx` 在 journey dialog 渲染路径进入同步死循环
   (饿死计时器 → 单测超时失效 → 无输出 → 4GB 堆 OOM;CPU 100% 单核)。
2. **真实 DSH 页面**(Chromium,pinned harness f77b5a2f):页面被微任务风暴饿死——
   `buildClientGeneration` 重建 bundle 后 `data-client-generation` 永不更新(HMR 替换后新代码
   无法获得执行权)、菜单开合状态机停止响应、journey dialog 相关 e2e 全部 300s 超时。
3. 2026-09-10 23:22 前同一机器、同一提交家族全部绿;跨午夜(09-10→09-11)后开始,之后
   任意时刻复现 → **日期因果,非负载/竞速单因**(并发自动化加剧但非必要条件)。

## 2. V7 排除证据(实现工作树 587bf81..8ff340c 与基线对照)

| 实验 | 基线 worktree(/tmp/vp-bisect-80db99f,67b8fcf,零 V7 代码) | 结论 |
|---|---|---|
| overlay.test.tsx,未钉 Date | 挂(6-7 测后卡死,EXIT=124) | 基线即复现 → 非 V7 引入 |
| setup.ts 钉 `Date`=2026-09-10T23:00 | **27/27 通过(~600ms)** | 日期因果实锤 |
| 实现树 587bf81+钉 | 27/27 通过 | V7 实现本身在钉住后无恙 |
| 日期值扫描(09-11 00:30/09:00/15:00/09-12) | 0-1 测后挂 | 任何 ≥09-11 日期皆触发 |

## 3. 复现配方

```bash
cd /tmp/vp-bisect-80db99f   # git worktree add /tmp/vp-bisect-80db99f 67b8fcf && pnpm install && pnpm build:dsh
timeout 200 pnpm vitest run --project dsh-dom tests/dsh/dom/overlay.test.tsx --test-timeout=8000
# → 卡死(EXIT=124)
# 修复对照:在 tests/dsh/dom/setup.ts 顶部将 globalThis.Date 钉到 2026-09-10T23:00 → 27/27 过
```

真实页面复现:任一渲染 journey dialog / 触发每日 greeting 声明的 e2e
(`FULL_JOURNEY_*_CONTRAST`、`NO_RESIDENT_PROGRESS_BAR` 等),在日期 ≥ 09-11 的机器上 300s 超时。

## 4. 已排查并排除的候选

- `Engine.settled()`(`src/engine/engine.ts:476` while ops)——仅测试显式调用,overlay 运行时不走。
- `PetEngineProvider.tryGreeting` 单发声明——greetedKeyRef 早退,无重入环。
- Goal 生命感 V7 新增面(gesture-rules 链记忆/ambient timer/gaze 监听/petting 计时器)——
  基线不含这些文件仍复现。
- node 26 实验性 localStorage 缺省——`--localstorage-file` 显式提供后依旧挂。
- vitest worker IPC/并发污染——安静时段(无自动化触发、无交互会话)单文件仍复现。

## 5. 已知线索(给定位者)

- 死循环为**同步/微任务级**(计时器饿死),非 I/O 等待;栈采样显示
  `uv__run_timers → MicrotaskQueue::RunMicrotasks → async fn` 自旋。
- 触发面收敛于 journey dialog 渲染 + 每日 greeting/day-claim 相关状态(首次在 dialog 打开时显现;
  钉住日期即消失)。嫌疑集中在 `PetEngineProvider` 的 greeting/ceremony 状态机与
  `computeLocalDay` 的跨日组合(09-10 的已声明 day 与 09-11 的 now 共存时的某条路径)。
- 定位建议:`--pool=threads` 让 worker 并入主进程后 `--cpu-prof` 取带符号 JS 帧
  (注意 `--cpu-prof*` 不能经 execArgv 传给 worker,需 NODE_OPTIONS 且避免 vitest 转发);
  或按日扫描(09-10/09-11/09-12 × setSystemTime)差分 `claimDailyGreeting`/ceremony 路径。
- 修复候选方向(供 authority round 评估):greeting/ceremony 跨日声明路径的去重与终结保证;
  或表现层对当日已声明状态的幂等短路。

## 6. 边界与后续

- 本记录为 Investigation,不创建 Product Contract,不授权任何实现。
- 修复授权路径:engine/react 属 `CONFIGURABLE_PET_ENGINE_V4`/独立表现层权威所有,
  需 Owner 发起对应 authority round(AMEND)或专项 dispatch。
- 测试面 containment(tests/dsh/dom/setup.ts 的 Date pin + `VP_PINNED_DATE` 覆盖)已使
  `pnpm test:dsh` 166/166 稳定(2026-09-11 两次复验);standalone `pnpm verify` 全绿(8ff340c)。
