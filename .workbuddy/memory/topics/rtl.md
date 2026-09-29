# RTL / 阿拉伯语文本方向

**状态**：支持，2026-09-29 落地。开关是 `Options.rtl: boolean`（默认 false）。

## 一条轴，别和 `direction` 混
- `Options.direction`（`0|1|2|3`）= **布局方向**（LHS / RHS / SIDE / DOWN）。
- `Options.rtl` = **文本 bidi 方向**（阿拉伯语 / 希伯来语 / 波斯语 / 乌尔都语）。两者正交：
  开 RTL **不会**把分支镜像到另一边。

机制：`rtl: true` → 容器 class 变成 `map-container rtl`（`src/index.ts` 构造器里那一处 ternary，
全库唯一写 `container.className` 的地方）→ `src/index.css` 末尾 `&.rtl { ... }` 是**全部**覆盖。
上面所有规则原样不动，所以 LTR 图零影响。`src/index.css:55` 那处 `.lhs { direction: rtl }`
仍是布局技巧（同规则里 `:62` 就把 `.me-tpc` 重置回 `ltr`），与这个选项无关。

## 覆盖了什么
`.me-tpc` / `#input-box` / `.svg-label` / `.mind-elixir-ghost` / `.context-menu .menu-list li` /
`.tips` → `direction: rtl`；菜单快捷键 `span:last-child { float: left }` + `.key { direction: ltr }`；
`.hyper-link` / `.icons` 的 `margin-left` 翻到 `margin-right`；
**`.tags { direction: rtl }` + `.tags span { margin: 4px 0 0 4px }`**（2026-09-29 补，见坑 3）。

## 三个坑
1. **`#input-box` 必须单列一条**：它不是 `.me-tpc` 的后代（`dom.ts:202` append 到 `this.nodes`），
   且基础规则是 id 选择器；只有写成 `.map-container.rtl #input-box` 才压得住。
   另：`dom.ts` 把 tpc 样式搬进 input-box 时只抄 color / font-size / padding / margin / border，
   **不抄 `direction` / `text-align`** —— 以后碰文本方向都绕不过这里。
2. **优先级**：`.lhs .me-tpc { direction: ltr }` 是 (0,2,0)，必须 `.map-container.rtl .me-tpc`
   (0,3,0) 才赢，否则左分支节点还是 LTR。`tests/rtl.spec.ts` 的 `lhs` 那条就是钉这个。
3. **`.tags` 要翻，`.icons` 不要翻**（2026-09-29 修正了之前的判断）。判据是「这块东西是不是文字」：
   **标签是文字** —— 不仅内容被读，**顺序也被读**，所以 `.tags` 必须 `direction: rtl`；否则
   `.tags` 是块级 div（占满内容宽），标签从**左缘**起排，而节点的文字在 RTL 下靠右 ——
   实测同一节点里两者能差 110px（文字在右、标签贴左）。同时 chip 自身也是一个段落：
   `مرحبا!` 在 `ltr` 下 `!` 落在词**右**侧（错），翻成 rtl 后落到词**左**侧。
   **图标不是文字**（一组符号没有阅读顺序），`.icons` 保留基础表的 `direction: ltr`，只翻它的**外距**。
   ⚠️ 翻 `.tags` 时**必须**一起镜像 chip 间距：基础表 `margin: 4px 4px 0 0` 在 RTL 流下会把那 4px
   留在**行首（右）**一侧，行不再贴边；改 `margin: 4px 0 0 4px` 后贴边恢复。这两条规则各自被
   `tests/rtl.spec.ts` 的两条断言钉住（去掉任一条只有对应那条红）。
   菜单的 `float: left` 要打在 `span:last-child` 上而不能打 `.key`：没有快捷键时第二个 span
   没有 class、但仍然是 last-child。

## 判别式（复用它，别只看 computed style）
主题取 `مرحبا!`——**尾部 ASCII 中立字符**的落位是唯一廉价判别：
- RTL 段落 → `!` 在词的**左**侧（`last.left < first.left`）
- LTR 段落 → `!` 在词的**右**侧

量法：TreeWalker 取 tpc 内首个文本节点，`Range.setStart(n,i)/setEnd(n,i+1)` 逐字符
`getBoundingClientRect()`。多行改用**边缘对齐**：LTR 两行左边缘相同，RTL 两行右边缘相同。
每个 rtl 断言都要配一份**默认图上的同款断言**（否则「一切都返回 rtl」的探针也能过）。

**尾部字符必须是「中立」类（`!` `?` `.` `:`），不能用阿拉伯语问号 `؟`。**
2026-09-29 实测：`؟`（U+061F）是**强 RTL 字符**，在 LTR 段落里也跟着阿拉伯语 run 走，
两种模式下 `last.left < first.left` 都成立 —— 拿它当判别式会得到「rtl 没生效」的假阴性。
同理，**纯阿拉伯语、两端都没有中立字符的句子在两种模式下看起来完全一样**：节点框
收缩到文字宽度，段落对齐没有余量可挪，而 bidi 本来就把一串阿拉伯字符在 LTR 段落里
排成从右到左。差异只在四处显形：**尾部/首部中立字符**、**多行对齐**、**混排拉丁词**、
以及 chrome（编辑框 / 菜单 / tooltip）。

## 配套 demo
`arabic-demo.html` + `src/dev.arabic.ts` + `src/exampleData/arabic.ts`：
同一份数据喂两个实例（只差 `rtl`），左右并排做对照。页脚列了「看这几处」和
「没变的地方也是结论」两段说明 —— 避免有人看到静止的图以为选项没生效。
两个实例 init 后调 `scaleFit()`（半宽 pane 装不下 `direction: 1` 的整张图，会裁边）
并监听 `resize`。入口用**官方**的 `ar` 包（`import { ar } from './i18n'`）配 `contextMenu.locale`，
方向仍由 `Options.rtl` 单独给 —— 为什么是两条轴，见下。

## `rtl` 为什么留在 `Options`（2026-09-29 定，别再搬一次）
考虑过放进 `LangPack`（「语言决定方向」语义更顺，宿主一份对象同时给出文案与方向）。放弃的原因：
**`LangPack` 进实例的唯一通道是 `contextMenu.locale`**。所以要么让容器 class 读
`contextMenu.locale?.rtl`（`contextMenu: false` 时 rtl 静默失效，且「菜单文案」耦合了「文本方向」），
要么新开一个顶层 `Options.locale`（多一个公共选项，还要定 `contextMenu.locale` 的继承关系）。
两条都不划算 —— **`Options.rtl` 与 `LangPack` 各自独立**是最终决定。
`src/i18n.ts` 的 `ar` 包里**没有** `rtl` 字段，`LangPack` 上也别加：那是没人读的死字段。
`ar` 已列入 `readme.md` / `readme/zh.md` / `skills/integrate-mind-elixir/SKILL.md` 的语言清单（第 19 个）。

## 守卫
`tests/rtl.spec.ts`（6 条）。已验两条「去掉修复就失败」：① 去掉 `rtl` class 赋值 → 6 条全红；
② 只删 `#input-box` 那条规则 → 只有编辑框那条红（1 failed / 5 passed），证明每条规则各自被守住。

## 未覆盖
- **outliner**：独立样式表 + 独立入口，跟随与否未定（`dist/Outliner.css` 目前 rtl=0，
  与「共享文件不得点名任何视图」的不变式一致）。
- outliner 侧 `.outline-item-topic ul/ol { padding-left: 1.25rem }`、
  `.katex-display { text-align: left }`（见 `styles-md-layer.md`）仍是物理值，未翻。

## 另一条路（当时没选）
节点 tpc + input-box 上 `dir="auto"`（按首个强字符定方向，贴合「每个节点可能不同语言」）
或 `unicode-bidi: plaintext`（多行混合逐段定方向）。`rtl` 选项是**整图一个开关**，
做不到「同一张图里阿拉伯语节点与英文节点各按各的方向」。
