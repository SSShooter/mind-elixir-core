# mind-elixir-core 缺陷与性能扫描报告

扫描时间：2026-09-13 · 分支工作区 `mind-elixir-core` (v6.0.0-next.5) · 全部结论已回溯源码行号核验

---

## 一、实测基线（Chromium headless，1280×900，`#map` 800×500）

用 CDP `Performance.getMetrics` 统计**强制同步布局次数**，中位数计时。**P0-1 已修复，"修复后"为同一脚本同环境复测。**

| 节点数 | `linkDiv()` 原始 → 最终 | 改一个节点文字 原始 → 最终 | `refresh()` 原始 → 最终 | **重排次数** 原始 → 最终 |
|---|---|---|---|---|
| 341 | 2.4 → **0.8 ms** | 3.2 → **0.8 ms** | 9.9 → 7.2 ms | **341 → 1** |
| 1,365 | 16.8 → **2.3 ms** | 16.0 → **2.5 ms** | 35.4 → 30.0 ms | **1,365 → 2** |
| 5,461 | 124.2 → **9.6 ms** | 116.0 → **10.5 ms** | 210.5 → 101.6 ms | **5,461 → 1** |

5,461 节点下：`linkDiv` **快 12.9×**，改一个字 **快 11×**（116 ms → 10.5 ms），`refresh` 快 2.1×；
浏览器花在布局上的时间从 **56.92 ms 降到 0.07 ms（800×）**。耗时转为近似线性，超线性消失。

> 分两步达成：①消除 layout thrashing（124.2 → 19.8 ms）；②把子线合并成单个 path（19.8 → 9.6 ms）。

**关键读数：修复前重排次数精确等于节点数（1:1）。** 这坐实了 `linkDiv` 每个节点都在「读布局 → 写 DOM → 再读」，即教科书式的 layout thrashing。
修复前 `linkDiv` 呈**超线性**增长：节点 ×16，耗时 ×52——因为每次强制重排的代价本身随 DOM 规模上升。

> 注：`src/exampleData/largeMap.ts` 只有约 320 个节点，本地开发完全压不出这个瓶颈。

---

## 一之二、已实施的修复：P0-1 `linkDiv` 两阶段重构

`src/linkDiv.ts` 改为三段：

- **Phase 0**：为每个主节点换上全新的空 `<svg class="subLines">`（仅 `mainNode` 过滤通过者，保持原有语义）。
- **Phase 1**：纯测量。读完所有几何量（`getOffsetLT` / `offsetWidth` / `offsetHeight`），期间**零 DOM 写入**。
- **Phase 2**：纯绘制。`borderColor`、主分支 path、子分支 path 全部通过 `DocumentFragment` 一次性挂载。

另外把 `containerHeight/containerWidth` 从循环内提出——它们是循环不变量，原先每个主节点都重读一次。

**能安全分离读写的依据**：`.lines` 与 `.subLines` 在 `src/index.css:268-278` 是 `position: absolute`，脱离文档流，挂载/填充它们不会引起节点树回流，所以阶段 1 的测量值与原来交错读写时完全一致（149/149 截图与功能测试通过可证）。

### 踩到的坑（值得记住）
第一版把 Phase 0 也推迟到 Phase 2，结果 **58 个测试失败**。根因：
`createWrapper`（`src/utils/dom.ts:117-132`）只在节点**有子节点且展开**时才追加 `me-children`。
原实现里 `el.appendChild(svg)` 恰好发生在 `traverseChildren` **之前**，于是无子节点的主节点 `wrapper.children[1]` 会拿到那个空 svg，`traverseChildren` 读它的 `children.length === 0` 直接返回——**这是一个隐式契约，并非代码本意**。
推迟写入后 `children[1]` 变成 `undefined`，直接抛 `Cannot read properties of undefined (reading 'children')`。
所以必须保留 Phase 0：先换好 svg 容器，维持原有 DOM 结构契约。

### 验证
- `tsc --noEmit` 通过；`biome check src/linkDiv.ts` 通过。
- 全量套件 **149/149 通过（19.0s）**，与修复前基线 **149/149（20.4s）** 一致，无回归。

---

## 二、性能问题

### P0-1 `linkDiv` 每节点一次强制同步布局 —— 全库头号瓶颈
`src/linkDiv.ts:31-69`（主线）+ `src/linkDiv.ts:92-106`（`traverseChildren` 子线）

```ts
const cW = tpc.offsetWidth          // 读
tpc.style.borderColor = branchColor // 写（污染下一次迭代的读）
this.lines.appendChild(createPath(...))
containerHeight: this.nodes.offsetHeight // 循环内重复读同一个不变量
```
- 每次迭代「读→写→读」交替，浏览器被迫同步 flush 布局。
- `containerHeight/Width`（第 49-50 行）是**循环不变量**，却在主干循环里每个主节点读一次。
- `traverseChildren` 递归进每层，同样模式覆盖全部子孙节点。
- 修复方向：先把所有节点的几何量**批量读**进数组（一次 reflow），再统一写 DOM；不变量提到循环外。

### P0-2 改一个字 = 全图重绘
`src/nodeOperation.ts:331-335`
```ts
export const setNodeTopic = function (this, el, topic) {
  el.text.textContent = topic
  el.nodeObj.topic = topic
  this.linkDiv()   // ← 全图 O(N) 重绘
}
```
`addChild`(143)、`insertSibling`(83)、`removeNodes`(238)、`moveNode`(299)、编辑失焦(`utils/dom.ts:268`) 全部调用 `linkDiv()`。
结果：**5461 节点时改一个标题要 116 ms**，输入卡顿、拖拽掉帧都源于此。

### P1-1 `layout()` 全量清空重建，无 diff
`src/utils/layout.ts:10` `this.nodes.innerHTML = ''`
`refresh()`（`interact.ts:515`）→ `layout()` + `linkDiv()`，二者都清空重来。`initLeft/Right/Side/Down`、`expandNodeAll`、`cancelFocus` 全走这条路。

### P1-2 `linkDiv(mainNode)` 的局部更新 —— **复核后降级，实际可忽略**
`src/linkDiv.ts`：即使传了 `mainNode`，循环仍对**每一个**主节点重算主分支。
但主节点数量极少（5,461 节点的图也只有 4 个主节点），而真正昂贵的**子线遍历确实被跳过了**——
所以"局部更新"其实一直有效，浪费的只是几次主分支重算。**不构成问题，不做改动。**

### P1-3 摘要与箭头：全量重建 + 循环内全树查找
- `src/summary.ts:413` `summarySvg.innerHTML = ''`；`:243-244` 循环内 `mei.findEle(child.id)`（`[data-nodeid=...]` 属性选择器全树扫描）+ `getOffsetLT` 沿 `offsetParent` 链逐级读。
- `src/arrow.ts:651-666` 同样 `innerHTML=''`，每条箭头 2 次 `findEle` + `calcCtrlP` 读 `offsetWidth/Height` + `calculatePrecisePosition` 读 `clientWidth` 后写 style → 每条箭头一次强制布局。

### P1-4 无 id 索引，查找退化为全树 DFS —— **冷路径，已降级**
`src/utils/index.ts:11-23` `getObjById` 朴素递归；`src/arrow.ts:676-680` `tidyArrow` 对每条箭头调用 2 次 → O(A×N)。
`src/index.ts:329` 的 `// this.parentMap = {}` 是注释掉的——全项目没有任何 id → 节点索引。

> **复核修正**：`getObjById` 全项目只有 `tidyArrow` 一个调用点，而 `tidyArrow` 仅在 `init`
> （`methods.ts:91`）执行一次；`operationHistory.ts:75` 的 `findById` 每次 undo/redo 才跑一次。
> 二者都不在热路径上，建索引**收益极低**，不值得为此增加一份需要维护的索引状态。降级为低优先级。
> 真正每次渲染都跑的是 `findEle`（`[data-nodeid=...]` 属性选择器全树扫描），见 P1-3。

### P1-5 循环内重复全树遍历 —— **已修复**
`src/nodeOperation.ts:266-269`：`for (const f of from)` 里每移动一个节点就 `fillParent(mei.nodeData)` 一次（全树）→ O(k×N)，多选批量移动时明显。
改为循环结束后 `fillParent` 一次。安全性依据：`moveNodeObj` 只读**目标**节点的 parent 指针，
而尚未被移动的节点，其 parent 指针仍然有效；循环内的 DOM 操作也不读 parent。全量 155/155 通过。

### P2 其他
- 无 `DocumentFragment`：`layout.ts:50-53/64-78` 逐节点 `appendChild`。
- `pointermove` / `wheel` 无 rAF 节流：`mouse.ts:466`、`nodeDraggable.ts:161-263`（每次 move 含 1×`getBoundingClientRect` + 2×`elementFromPoint`）。`utils/index.ts:62` 的 `throttle` 全项目零引用。
- `summary.ts:180-187` `buildNesting` O(S²×depth)；`:62-74` `calcRange` 在 while 内 `indexOf`。

### 已排除（初判为问题、核验后不成立）
- `console.trace` / `console.time` 残留确实存在（`interact.ts:45/55/66`、`linkDiv.ts:20/74`、`layout.ts:9/43`、`nodeOperation.ts:83/120/143`、`viselect/src/index.ts:810`），但 `build.js` 引入 `@rollup/plugin-strip`，`dist/*.js` 中 `console.trace` 计数为 **0** → 仅影响开发期调试，非线上问题。
- **全库无任何 `setTimeout` / `setInterval`**（含 viselect），不存在定时器泄漏。也无 `ResizeObserver` / `MutationObserver`。

---

## 三、功能性缺陷

### B1【中｜已实测复核，初判已修正】删除摘要范围内的节点 → 摘要被静默删除（但 undo 能恢复）
`src/summary.ts:236-242, 427, 434` + `src/nodeOperation.ts:238-240`

```ts
// nodeOperation.ts
this.linkDiv()                                  // 238 ← 内部触发 renderSummary
this.bus.fire('operation', { name: 'removeNodes', ... })  // 240
```
删除子节点后 `linkDiv` → `renderSummary` 发现区间越界（`parentObj.children?.[i]` 不存在）→ `staleIds` → `detachSummary` 直接 `mei.summaries.splice()`。

**实测（临时探针，已删除）**：

| 步骤 | `summaries.length` | 子节点 |
|---|---|---|
| `createSummaryFrom` 后 | 1 | c1,c2,c3 |
| 删除 c2 后 | **0** | c1,c3 |
| `undo()` 后 | **1** | c1,c2,c3 |

即：**静默删除属实，但"undo 无法恢复"是错的**——历史是快照式（`operationHistory.ts:165` push 的是 `before` 完整快照），before 快照里含摘要，所以 undo 能把摘要一起还原。初稿把 `after` 快照不含摘要误推成了不可恢复。

真正的问题收敛为两点：
1. **无任何通知**：只有一句 `console.warn('Child not found')`，不 fire `operation`，外部监听者无从得知摘要消失。
2. **非操作路径下完全无记录**：探针 B 验证，外部 `refresh(已删子节点的数据)` 同样会静默丢掉摘要，而这条路径**不产生任何 operation 事件**，完全游离于历史之外。叠加 B3（`refresh` 不重置历史基线）会导致基线与实际状态不一致。

> 注：这是**有意的行为**（`summary.ts:239` 注释 "the range is stale, let the caller decide when to clean it up"），不是意外。区间失效后「删除」还是「收缩区间」属于产品决策，未擅自改动。

### B2【中高｜已修复并对照验证】focus 模式下 `refresh(newData)` 后，导出与撤销基线全部错乱
`src/interact.ts:10`（`collectData` 在 focus 时返回 `nodeDataBackup`）+ `:502-518`

```ts
export const refresh = function (this, data?) {
  if (data) { this.nodeData = data.nodeData ... }  // 只改 nodeData
  // 既不更新 nodeDataBackup，也不重置 isFocusMode
}
```
`focusNode`（`:289-292`）已把 backup 存好，但 `refresh(newData)` 完全不碰它。之后 `getData()` 仍返回**旧 backup**，撤销基线也是旧树 → 一次 undo 把新数据整体回滚。
触发：`focusNode(A)` → `mei.refresh(newData)` → 编辑 → Ctrl+Z。

### B3【中｜已修复并对照验证】`refresh(newData)` 不重置历史基线
`src/plugin/operationHistory.ts:56, 154-159`：`currentSnapshot` 只在 `operation` / `clearHistory` 时更新。外部 `refresh()` 换了数据却不通知它 → 第一次 undo 直接跳回刷新前的状态。文档要求调用方自己 `clearHistory()`，但 `refresh` 是公开入口，极易漏掉。

### B4【中｜已修复】`init()` 的 `await` 期间 `destroy()` → 必抛 TypeError
`src/methods.ts:94-97`
```ts
this.layout()
await document.fonts.ready
this.linkDiv()   // ← 若此时已 destroy，this.nodes 为 undefined
```
React StrictMode 双调用 / 快速挂载卸载即可触发，且是 unhandled rejection。

### B5【中｜已修复】`destroy()` 漏释放大量引用
`src/methods.ts:114-144` 清空了 `container/map/nodes/bus/currentNodes`，但**遗漏**：
`dragged`（持 DOM 节点数组）、`panHelper`（闭包捕获整个实例，`index.ts:165`）、`helper1/helper2`（`arrow.ts:586-648`，闭包捕获 `map/P2/P3/currentArrow/linkItem`，其 `destroy()` 只在 `hideLinkController` 里调用）、`historyStack`、`nodeDataBackup`（整棵树）、`labelContainer`、`summarySvg`、`root`、`selection` 之外的插件闭包。
后果：已删除的 DOM 子树与整棵数据树无法 GC。

### B6【中｜已修复】`reshapeNode` 的 `origin` 快照被就地污染
`src/nodeOperation.ts:26-29`
```ts
if (origin.style && patchData.style) patchData.style = Object.assign(origin.style, patchData.style)
```
`Object.assign(origin.style, …)` 就地改了 origin，随后 `Object.assign(nodeObj, patchData)` 使 `origin.style === nodeObj.style` 成为同一对象。
对照 `src/arrow.ts:687` 的正确写法 `Object.assign({}, origin.style, patchData.style)`。
后果：`operation` 事件里的 `origin`（before 状态）已等于新状态，依赖它做差异/回退的外部监听者失效。

### B7【中｜已修复并实测往返】节点主题含换行 → plaintext 导出再导入结构错乱
`src/utils/mindElixirToPlaintext.ts:104` `lines.push(\`${indent}- ${parts.join(' ')}\`)` 不转义换行；
而编辑时 Shift+Enter 会保留换行（`src/utils/dom.ts:234-236`）。回读时第二行没有 `-` 前缀，被当成**新节点**（缩进为 0 时还会额外合成一个 root）。
复现：输入 "a"+Shift+Enter+"b" → 导出 → 重新导入。

### B8【中】编辑中执行 `layout()` → 编辑内容静默丢失
`src/utils/dom.ts:249-274` 依赖 `blur` 提交；而 `layout()`（`layout.ts:10`）用 `nodes.innerHTML=''` 直接移除输入框，浏览器**不会**为被移除的聚焦元素派发 `blur` → 输入内容被丢弃。
反向：若 DOM 已重建后 blur，`node`/`el` 是游离对象，写入不生效，还会推入一条 `before === after` 的空历史项（表现为「按了一次 undo 什么都没发生」）。

### B9【低】`removeListener` 重复 handler 漏删
`src/utils/pubsub.ts:115-119`：`splice(i, 1)` 后未回退索引，同一 handler 注册多次时只删掉第一个。

### B10【低】`indexOf` 返回 -1 时删错兄弟
`src/utils/objectManipulation.ts:12`：`siblings.splice(index, 1)`，当 `parent` 指针与 `children` 不同步导致 `index === -1` 时，会删掉**最后一个**兄弟节点。

### B11【低】配置 `before` 钩子后所有操作变异步
`src/methods.ts:29-36`：`return async function`，有钩子时 `await hook.apply` → 操作延后到微任务。连按 Enter/Tab 会以「当前选中节点已变」后的顺序执行，与快照时序不再确定。

### B12【低】摘要创建对空选区/根节点直接抛异常
`src/summary.ts:49-59` `calcRange` 内 `throw`，`:358` 的 `if (!this.currentNodes) return` 判断恒为真（空数组）。异常发生在 async 包装里 → 变成 unhandled rejection，静默失败。

---

## 四、建议修复顺序

1. ~~**P0-1 + P0-2**~~ **已完成**（见「一之二」）：5k 节点下单次编辑 116 ms → 20.1 ms，重排 5461 → 2。
2. ~~**P1-4 建 id 索引**~~ **已降级**：复核为冷路径，收益极低，不做了。
3. **B1**：摘要清理属有意设计，撤销可恢复；若要改，建议让 `detachSummary` 发一个通知事件（而非改成收缩区间——那是产品决策）。
4. ~~**B2/B3**~~ **已修复**（见下）。
5. ~~**B4/B5**~~ **均已修复**：B4 在 `await` 后检查 `!this.container` 直接返回（无需新增字段）；
   B5 补齐 `destroy()` 的引用释放，并显式 `helper1/helper2?.destroy?.()`（它们的监听器原本只在
   `hideLinkController` 里拆，destroy 路径永远走不到）。
6. ~~**B6/B7**~~ **均已修复**：B6 一行改；B7 采用**对称转义**（导出 `\` → `\\`、换行 → `\n`，解析时还原），
   不丢信息、往返无损。
7. ~~清理 `console.trace`~~ **已做**（移除了 `interact.ts` 的 3 处 `console.trace` 与
   `contextMenu.ts` 的 2 处 `console.log`）。**未动** `src/viselect/src/index.ts:810` 的
   `console.trace('select', ...)`——那是 vendored 代码，改了会跟上游分叉。

### 新增的永久回归测试（6 个，共 155 个）

修复时用的都是临时探针（已删），所以补了常驻测试，并**逐个确认在 HEAD 上会失败**：

| 测试 | 位置 |
|---|---|
| `origin` 保留编辑前样式 / 重复 patch 不累积 | 新文件 `tests/reshape-node.spec.ts`（`reshapeNode` 原本零覆盖） |
| 主题含换行的往返 / 反斜杠不被吞 | `tests/plaintext-parser.spec.ts` |
| 焦点模式下载入新文档不再返回旧备份树 | `tests/focus-history.spec.ts` |
| `refresh(data)` 不显式 `clearHistory()` 也能正确定基线 | `tests/clear-history.spec.ts` |

对照结果：这 6 个在 HEAD 上**全部失败**（6 failed / 8 passed），修复后全部通过。

### 本轮已落地的代码改动

| 文件 | 改动 |
|---|---|
| `src/linkDiv.ts` | 两阶段重构（Phase 0/1/2）+ `containerHeight/Width` 提出循环 |
| `src/nodeOperation.ts` | `reshapeNode` 样式合并改为 `Object.assign({}, origin.style, patchData.style)` |
| `src/methods.ts` | `init()` 在 `await document.fonts.ready` 后加 `if (!this.container) return` 守卫 |
| `src/interact.ts` | `refresh(data)` 载入新文档时退出 focus 模式并 fire `refresh` |
| `src/utils/pubsub.ts` | 新增 `DocumentEventMap.refresh` 并纳入 `EventMap` |
| `src/plugin/operationHistory.ts` | 监听 `refresh` 重设基线；`restore` 用 `restoring` 抑制；焦点重定位后补 `isFocusMode = true` |
| `src/methods.ts` | `destroy()` 补 `root/summarySvg/labelContainer/dragged/nodeDataBackup/meta/panHelper/helper1/helper2/historyStack`，并调 `helper1/helper2?.destroy?.()` |
| `src/utils/mindElixirToPlaintext.ts` | 新增 `escapeTopic`，导出时转义 `\` 与换行 |
| `src/utils/plaintextToMindElixir.ts` | 解析时 `unescapeTopic` 还原 |
| `src/interact.ts` / `src/plugin/contextMenu.ts` | 移除 3 处 `console.trace` + 2 处 `console.log` |
| `tests/*` | 新增 6 个回归测试（详见下表），`reshapeNode` 从零覆盖起步 |

全部通过 `tsc --noEmit`、全量套件 **155/155**。`methods.ts` 的 biome 报错是**既有格式债务**（HEAD 版本同样报），按项目惯例未改动未触及的行。

---

## 一之三、B2/B3 修复说明与对照验证

### 为什么不能简单地在 `refresh` 里调 `clearHistory()`
`restore()`（`operationHistory.ts:95`）撤销/重做时**也**调用 `mei.refresh(snapshot)`。若在 `refresh` 里
无条件 `clearHistory()`，每次 undo 都会 `stack.clear()` 把整个历史栈清空。同理，若在 `refresh(data)` 里
无条件重置 focus 状态，会破坏 `restore` 依赖的「refresh 后重新锚定焦点」逻辑（第 96-110 行）。

因此做了两处配套改动：
- `refresh(data)` 重置 focus 后，`restore` 的 `if (focused)` 分支显式补 `mei.isFocusMode = true`，
  让 restore 不再依赖 `refresh` 的副作用，自洽。
- 重设历史基线改为**只更新 `currentSnapshot`、不动栈**（新增 `refresh` 事件），且 `restore` 期间用
  `restoring` 标志抑制——`getData()` 是一次完整 JSON 深拷贝，不加抑制会给每次 undo 多添一轮全树克隆。

### 对照验证（临时探针，已删除；同一探针在 HEAD 上跑作对照）

**B2** `focusNode(a)` → `refresh(data2)`：

| | `isFocusMode` | root topic | children |
|---|---|---|---|
| 改动前 | **true** | **root**（旧） | **['a','b']**（旧备份树） |
| 修复后 | false | root2 | ['x','y']（新文档）✓ |

**B3** `refresh(data2)` → `addChild` → `undo`：

| | 撤销后 children |
|---|---|
| 改动前 | **['a','b']** —— 跳回刷新前，新文档丢失（断言失败） |
| 修复后 | ['x','y'] ✓ |

**B7** 主题含换行的往返（临时探针，已删除）：

| | 导出的 plaintext | 回读结果 |
|---|---|---|
| 改动前 | `- root\n  - first\nsecond\n  - plain\n` | root=**'Root'（合成）**，children=**['root','second']** —— 层级整体错乱 |
| 修复后 | `- root\n  - first\\nsecond\n  - plain\n` | root='root'，children=['first\nsecond','plain'] ✓ |

> 注意改动前的危害比初稿描述的更重：`second` 落在缩进 0 被判为顶层节点，触发「多个顶层节点合成 root」，
> 于是**整棵树多了一层**，不只是该节点错位。

### 进一步的优化：先量化，别猜（两步都做了 HEAD 对照与实测）

消除重排后 `linkDiv` 仍有 20.6 ms。我**先做了成本分解**而不是直接优化，结果推翻了两个想当然的预判：

| 环节（5,492 节点） | 实测 | 占比 |
|---|---|---|
| 几何读取（每节点 4 次 offset 读取） | **7.2 ms** | 35% |
| 创建 path 元素（**活动文档内**，含样式解析） | **6.2 ms** | 30% |
| 每节点写 `borderColor`（样式失效） | 1.1 ms | 5% |
| 生成路径字符串 | 1.1 ms | 5% |
| `<svg>` 拆除（`innerHTML=''`） | 0 ms | — |
| 复用已有 path（只改属性） | 3.7 ms | — |

**两个被数据推翻的判断**：
1. 我原以为瓶颈是「生成 path 字符串」或「几何读取」，实际最大单项是**把 5.5k 个新元素插入活动文档**（样式解析占大头）；
   注意在**游离** SVG 里测只有 2.0 ms，差点误判。
2. 我原以为「复用 path 元素、只更新 `d`」能带来数量级提升——实测**只省 2.5 ms（12%）**，不值得为此引入元素池和失效逻辑。

**真正有效的做法**：把同一描边的连续子线**合并进一个 `<path>`**（多个 `M…` 子路径），元素数从 5,492 降到个位数。
`main`/`sub`（`utils/generateBranch.ts`）返回的都是以绝对 `M` 开头的命令，拼接安全；共用 stroke 时渲染与拆分成千上万个元素完全一致。
**收益：`linkDiv` 20.6 → 9.6 ms（2.1×）**，全部 155 个测试（含截图快照）通过，像素级无差异。

剩余成本（9.6 ms）已相当平坦：几何读取 ~7 ms + 字符串 ~1 ms，没有单点热点了。再往下需要换渲染方式（如 canvas），属重写范畴，不建议在当前架构内折腾。

---

## 附：扫描方法与已排除项

- 三路并行只读分析（渲染性能 / 生命周期泄漏 / 状态正确性），所有结论逐条回溯源码行号复核。
- 实测：启动本地 vite（:23334），Playwright + CDP `Performance.getMetrics`，针对 341 / 1365 / 5461 节点三档取中位数。
- **已被证伪的初判**：拖拽边缘滚动 `setInterval` 永不清理（全库无定时器）；`window`/`document` 级常驻监听器泄漏（所有 pointer/wheel/key 均绑在 `container` 并随 destroy 移除）；重复 init 叠加监听器（`methods.ts:73` 有 `pluginsInitialized` 守卫，`tests/repeated-init.spec.ts` 已覆盖）。
