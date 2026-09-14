# Mind Elixir Core — project memory

Curated, long-lived notes. Daily logs live beside this file.

## Environment (this machine)

- **`pnpm` IS installed — it is just not on the tool shell's PATH.** It lives inside nvm's
  Node: `~/.nvm/versions/node/v24.20.0/bin/pnpm`. `~/.zshrc` adds nvm to PATH and is only
  read by **interactive** shells, so prefix the bin dir from the Bash tool:
  `PATH=/Users/darksouls/.nvm/versions/node/v24.20.0/bin:$PATH pnpm …`.
- `package.json` has no `packageManager` field, so corepack is never required. The old
  `/tmp/wb-shim/pnpm` forwarding shim is **obsolete and has been deleted** — do not recreate it.
- Playwright browsers must match the installed `@playwright/test` (1.62.x → chromium
  headless shell 1234): `node_modules/.bin/playwright install chromium-headless-shell`.
  Older cached builds only produce "Executable doesn't exist".
- `playwright.config.ts` boots its web server via `pnpm dev --port 23334`; let it do that
  (Playwright does not reuse a hand-started server reliably). To drive a plain script
  instead, start that server yourself via the Bash tool with `run_in_background: true`.
- Test command: `PATH=/Users/darksouls/.nvm/versions/node/v24.20.0/bin:$PATH node_modules/.bin/playwright test <specs> --reporter=line`.
  The Bash tool's managed Node 22 runs the same toolchain fine.

## Codegen / formatting

- `src/index.ts` carries a `// #region GENERATED members` block. After changing mixed-in
  methods (`src/methods.ts`, `src/interact.ts`, …) or the `Options` type, run
  `node gen-members.js` **then** `node_modules/.bin/biome format --write src/index.ts`
  (raw codegen emits double quotes and trailing `;` inside object types). Any new type used
  in a signature must be imported in `src/index.ts`; the guards at the bottom fail `tsc` otherwise.
- `biome check src` has pre-existing format debt — format only the lines you touched
  (compare with a formatted copy in the same directory instead of running `--write`).

## Focus mode (invariants)

- In focus mode `mei.nodeData` IS the focus root (and `fillParent` leaves its `parent`
  `undefined`), while `getData()` / `collectData` keep reporting `nodeDataBackup` — the whole
  diagram. So `mei.refresh(snapshot)` inside focus breaks the `nodeData` ⊂ `nodeDataBackup`
  aliasing that `cancelFocus` relies on; `operationHistory.restore` re-anchors it explicitly
  (refresh the full snapshot, then re-point `nodeData` at the focus root found inside it).
- Focus is a history boundary: `focusNode` / `cancelFocus` call `clearHistory()`, so stack
  entries only ever belong to the current focus view. `clearHistory` must run AFTER
  `cancelFocus`'s `refresh()`, otherwise the re-baseline snapshot is the focus subtree.

## Outliner renderer (invariants — read before touching render paths)

`render()` is a **keyed reconciliation**, not a rebuild: each rendered node owns a
persistent `ItemView` in `views: Map<id, ItemView>`. `syncItem` walks the visible tree,
`patchItemView` writes only what differs, `unmountUnseen` releases anything the walk
missed — so a fold genuinely frees its DOM. A node whose data is unchanged keeps its
element, listeners, focus and hover state.

- **Ordering is load-bearing**: each container goes right after the previously placed
  sibling (`expected = cursor.nextSibling`), giving one `insertBefore` per moved node.
  Stale containers land after the correct ones and are swept by `unmountUnseen`.
- **No per-node listeners.** All interaction is delegated on `this.el` (`handleClick`
  router + drag handlers); `createItemView` is deliberately listener-free (8 → 0/node).
- **No creation-time closures for live state.** Menu entries carry `data-action`; click
  and drag handlers read `view.item / level / parentId / siblingCount`, refreshed on every
  sync. The old closures went stale as soon as a node moved.
- **Topic cache** (`view.topicText` / `topicDirty`): never write topic HTML while
  `editingId === item.id`; the dirty flag restores rendered markup after editing. This is
  also why opening a menu no longer re-runs markdown/KaTeX over every node.
- **`focusItem` places the caret explicitly** — a reused element is already focused so no
  `focusin` fires, and the old rebuild always left the caret at the end.
- **The `…` menu is derived state** (exists iff `openMenuId` names the node).
  `setOpenMenu` touches only the two nodes involved; the button group is revealed by the
  `.menu-open` class on the wrapper, never by `:hover` (that coupling caused the flicker).
- 17 DOM elements/node is unchanged: `.outline-item-front` is a 1rem flex spacer anchoring
  the absolutely-positioned dot — dropping it shifts every topic.

- **Bound-mode sync has TWO channels and they must NOT share a coalescing window**
  (fixed 2026-09-13, was a lost-update bug):
  - history-stack push → `requestSync` → renders **synchronously** (one push = one new
    change; `applyBoundOperation` / `deleteItem` focus a node right after the map call and
    need the fresh DOM, so this cannot be deferred).
  - map `expandNode` event → `scheduleSync` → **deferred to a microtask** (`syncDirty` +
    `syncQueued`). `interact.ts:447` fires `expandNode` *before* the `operation` that
    pushes history, and a **silent** expand (`nodeOperation.ts:45/255`) fires it with no
    entry of its own — the caller's operation is its announcement. So deferring is always
    safe and folds still cost exactly **one** render.
  - Anything that renders on its own (`zoomTo`) or tears down (`destroy`) must clear
    `syncDirty`, or the queued microtask repopulates an already-swept container.
  - Counts are asserted by `skills/mind-elixir-perf-probe/scripts/probe-sync-counts.mjs`
    (fold=1, two ops in one block=2, silent expand=0 sync + 1 microtask, undo/redo=1).

### Measured baseline (2026-09-13, Chromium headless, 20-run avg, driven via `window.o`)

| nodes | old full render | idle render | topic edit | fold | menu toggle |
|---|---|---|---|---|---|
| 341 | 6.33 ms | 0.065 ms | 0.120 ms | 0.060 ms | 0.025 ms |
| 1,365 | 20.86 ms | 0.310 ms | 0.240 ms | 0.215 ms | 0.015 ms |
| 5,461 | 94.39 ms | 1.035 ms | 1.070 ms | 0.970 ms | 0.015 ms |

Cost is now the O(n) diff walk (~0.0022 ms/node), not DOM writes. The `…` menu and
outliner drag & drop have **no suite coverage** — re-run the functional probe after
touching either. Tooling + pitfalls: `mind-elixir-perf-probe` skill.

## Map renderer — linkDiv, fixed 2026-09-13 (was the bottleneck)

Two-step fix. Measured via CDP `Performance.getMetrics` (`LayoutCount` delta) around `m.linkDiv()`.
**Original → final** (same script, same environment):

| nodes | `linkDiv()` | `setNodeTopic` (1 node!) | `refresh()` | forced reflows |
|---|---|---|---|---|
| 341 | 2.4 → **0.8** ms | 3.2 → **0.8** ms | 9.9 → 7.2 ms | 341 → **1** |
| 1,365 | 16.8 → **2.3** ms | 16.0 → **2.5** ms | 35.4 → 30.0 ms | 1,365 → **2** |
| 5,461 | 124.2 → **9.6** ms | 116.0 → **10.5** ms | 210.5 → 101.6 ms | 5,461 → **1** |

Browser time in layout: 56.92 → **0.07 ms**. Step 1 = two-phase read/write (124.2 → 19.8);
step 2 = merge sublinks into one `<path>` (19.8 → 9.6).

### Where the remaining 9.6 ms goes (profiled, don't guess)
At 5,492 nodes: geometry reads **7.2 ms** (35%) · creating paths **in the live document**
**6.2 ms** (30%) · `borderColor` writes 1.1 ms · path strings 1.1 ms · svg teardown 0 ms.
- **Trap**: the same "create paths" work measures 2.0 ms in a *detached* svg but **6.2 ms**
  attached — style resolution dominates. Always benchmark in a live container.
- **Not worth it**: reusing path elements and only updating `d` saves just 2.5 ms (12%), and
  would need an element pool plus invalidation logic. Skip.
- No single hotspot remains; going faster needs a different renderer (canvas) — a rewrite.

Browser time in layout: 56.92 → **0.77 ms** (74×). Scaling is now ~linear (nodes ×16, time ×18);
previously it was ×52 (superlinear — every forced reflow costs more as the DOM grows).

### Invariants when touching `linkDiv`
- **Three phases, and the order is load-bearing**: Phase 0 swaps in fresh empty
  `<svg class="subLines">` per main node → Phase 1 reads ALL geometry with zero writes →
  Phase 2 writes everything via `DocumentFragment`.
- **Why Phase 0 must stay**: `createWrapper` (`utils/dom.ts:117-132`) only appends
  `.me-children` when the node has children AND is expanded. The old code appended the
  sublink `<svg>` immediately before `traverseChildren`, so a childless main wrapper had
  that empty svg at `children[1]` and the walk read `children.length === 0` and returned —
  an **implicit contract, not intentional**. Deferring the append makes `children[1]`
  `undefined` → `Cannot read properties of undefined (reading 'children')` → 58 tests fail.
- **Why splitting reads/writes is safe**: `.lines` / `.subLines` are `position: absolute`
  (`index.css:268-278`), so attaching or filling them never reflows the node tree;
  Phase 1 therefore measures exactly what the interleaved version measured. Proven by
  149/149 (incl. screenshot snapshots).
- `containerHeight/Width` is a loop invariant — keep it hoisted.

### Still open on the map side
- `linkDiv(mainNode)` is **not** a real partial update: the main branch still runs for every
  main node, only sublink traversal is skipped.
- No id→node index anywhere (`index.ts:329` has `// this.parentMap = {}` commented out), so
  `getObjById` (`utils/index.ts:11`) and `tidyArrow` (`arrow.ts:676`) are full-tree DFS.
- `exampleData/largeMap.ts` is only ~320 nodes — it cannot reproduce any of this.

Full findings (perf + bugs, with verified line numbers): `.workbuddy/bug-and-perf-scan.md`.

### Measuring it again
Start vite on 23334 with the Bash tool `run_in_background: true` (`nohup … &` dies when the
shell exits). The Playwright script must live in the **project root** — ESM ignores
`NODE_PATH` and cannot resolve `@playwright/test` from `/tmp`.

## 编辑提交与 DOM 拆卸（2026-09-14，最终决定：**不修**）

- **内联编辑只在 `blur` 时提交**（`editTopic` 改主题、`editSvgText` 改摘要/箭头标签），而
  `layout()` 用 `nodes.innerHTML = ''` 拆 DOM。**移除聚焦元素是否派发 `blur` 是引擎相关的**：
  纯 DOM 探针实测 **Chromium 派发 1 次**（**同步**，在 `innerHTML=''` 赋值**执行过程中**，
  派发时元素仍 `isConnected` 且 `innerText` 换行完好），**Firefox 派发 0 次**。
- **但缺陷是「可达但没人走到」**，所以 B8 决定**不修**（曾实现过 `commitPendingEdit` + `InlineEditor.commitEdit`，
  已整体回退）。理由：`layout()` 唯一上游是 `refresh()`，能在编辑中触达它的入口**全是程序化/宿主驱动** ——
  `refresh(data)`、`initLeft/Right/Side/Down`、`changeTheme`/`changeCompact`、`undo`/`redo`、`focusNode`/`cancelFocus`。
  鼠标点击会先失焦提交。宿主若确需在编辑中重渲染，自行承担；调用前 `el.blur()` 是可靠手段。
- `Ctrl+Z` 为什么不可达：两处内联编辑的 keydown **首行无条件** `e.stopPropagation()`
  （`dom.ts:245`、`svg.ts:198`），而 undo/redo 监听挂在 `mei.container`
  （`operationHistory.ts:207`，冒泡阶段）→ 事件到不了。
- **判断"路径是否可达"必须实测，且要带阳性对照**：探针同时验证「编辑中按 `Ctrl+Z` → `undo`/`refresh`
  调用 0 次」与「光标在容器上按 `Ctrl+Z` → 1 次」，否则探针自身坏了也会"通过"（本仓踩过）。
- **机制区分，别混**：`el.blur()` **显式调用**在所有引擎都会派发 blur；引擎分歧只出现在
  "元素被移出文档导致的**隐式** blur"。所以别把"依赖移除触发 blur"当兜底，也别把显式 `blur()` 当不可靠。
- outliner 对"编辑中 `Ctrl+Z`"是**显式处理**的（`Outliner.ts:1279-1295`）：先 `execCommand('undo')` 回退输入，
  无效则 `active.blur()` **提交**再 `stack.undo()`。那里**可达**（它用 `document.activeElement` 判断，
  没走 `stopPropagation`），所以必须有。**别照搬到地图侧 —— 先确认可达性。**
- `#input-box` 是主题框与 SVG 标签框**共用**的 id，且都挂在 `this.nodes` 下。
- `Bus.removeListener` 使用**倒序**遍历删除（正序会跳过滑入该位的项）。`destroy()` 不需要提交编辑
  （随后就把 `nodeData` 置 `undefined`）。
- **summary 的方法没有 async 包装**：`beforeHook` 只包装 `nodeOperation` 的导出
  （`methods.ts:47-52`），`summary` 是 `...summary` 原样展开。所以 `calcRange` 曾经的 `throw`
  是**同步**抛出（不是 unhandled rejection）。现改为返回 `null` 表示「无可摘要区间」
  （0 选中 / 根节点 / 跨主节点选区），`createSummary` 据此 no-op。
- `createSummary` 的 `if (!this.currentNodes)` 对空数组恒不生效（初始化是 `[]` 不是 null）。
  上下文菜单 `contextMenu.ts:206-210` 在 `createSummary()` 之后才 `unselectNodes` —— 抛异常会让
  **选区永远清不掉**。

## Testing notes

- 跑套件前先确认基线：全量 **161 个测试**（chromium 单 project），正常约 15–20 秒。
- **新增回归测试必须证明它会失败**：`cp` 备份 → `git checkout -- <file>`（或摘掉守卫行）→ 跑 → 恢复备份。
  若"未修复时也通过"，很可能**改动根本没被执行**（例如只注掉了调用点却以为在验证实现）——
  用一个必抛的探针确认代码路径确实跑到了。
- **纯引擎问题不需要应用页面**：`page.goto('about:blank')` + `page.evaluate` 跑原生 DOM 探针，
  可隔离构建/加载干扰，也适合跨引擎对照。别把单引擎结论写成"浏览器普遍行为"。
- Firefox 探针：需 `MOZ_DISABLE_CONTENT_SANDBOX=1 MOZ_DISABLE_RDD_SANDBOX=1 MOZ_DISABLE_GMP_SANDBOX=1
  MOZ_DISABLE_GPU_SANDBOX=1`（否则 `sandbox_init() failed: Operation not permitted`）；
  且 Firefox **加载不了本仓 Vite 的 ESM**（响应缺 MIME 头）→ 只能做引擎级验证，应用级用例跑不通。
  做法：临时取消 `playwright.config.ts` 里 firefox project 的注释，跑完**记得还原**。
  `window.MindElixir` 来自 test.html 的 `type="module"` 脚本，Firefox 里需要 `waitForFunction` 等就绪。
- `HistoryStack.undo()` keeps undone entries for redo, so assert undo depth with
  `historyStack.currentIndex`, never `getEntries().length`.
- In bound-outliner specs `page.getByText(...)` matches both views — scope locators with
  `page.locator('#map')` / `page.locator('#outline')`.
- Screenshot failures of ~1 pixel (e.g. `multiple-instance.spec.ts`) are rendering
  environment drift, not regressions; do not update snapshots without asking.

## CHANGELOG 约定

`## Unreleased` 段要**随手记**，不要攒着。宿主可见的行为变更必须进
Breaking / Features / Bug Fixes / Behavior Changes / Refactors 之一 —— 例如
`refresh(data)` 会退出 focus 并 fire `refresh`、plaintext 导出转义变化、`destroy()` 释放面扩大，
都属"用户能感知"，漏记就是漏记（2026-09-14 一次性补了整轮）。

## Plaintext 转换器

- 主题**可以含换行**（编辑时 Shift+Enter 保留，`utils/dom.ts:234-236`），而换行正是 plaintext 的
  记录分隔符。raw 写出会让后半段落到缩进 0 被判为顶层节点 → 触发「多顶层节点合成 root」→ 整棵树多一层。
- 现用对称转义：导出 `escapeTopic`（`\`→`\\`、换行→`\n`），解析 `unescapeTopic` 还原。往返无损。
- 想在浏览器里直接试转换器：Playwright 里 `await import('/src/utils/plaintextConverter.ts')`
  （vite dev 直接提供转译后的 ESM）。

## destroy / refresh 的隐式依赖（改前先看）

- `restore()`（`operationHistory.ts:95`）撤销时**也**调 `mei.refresh(snapshot)`。
  所以在 `refresh` 里无条件 `clearHistory()` 会每次 undo 清空历史栈；无条件重置 focus 又会
  破坏 restore 的「refresh 后重新锚定焦点」。现已改为：`refresh(data)` 重置 focus、
  `restore` 显式补 `isFocusMode = true`；历史基线走 `refresh` 事件且用 `restoring` 标志抑制
  （`getData()` 是完整 JSON 深拷贝，不抑制等于每次 undo 多一轮全树克隆）。
- `destroy(this: Partial<MindElixir>)` —— Partial 让 `panHelper` 这类非可选字段也能安全置空。
- `helper1/helper2` 的 pointer 监听器只在 `hideLinkController`（`arrow.ts:553`）里拆，
  destroy 必须自己调 `?.destroy?.()`。

## Playwright 排错（踩过两次）

- `playwright test --reporter=line | tail -40` 会**截掉失败计数行**，只看到末尾的 "91 passed"
  会误判为全过（实际 91 passed + 58 failed）。用 `--list` 取总数核对，或重定向到文件再 grep `failed`。
- `test-results/` 堆积 >50 个文件时，Playwright 启动前的清理会被 safe-delete shim 拦下，
  **整个套件无法启动**。解决：`mv test-results /tmp/xxx` 移走，不要删除。
