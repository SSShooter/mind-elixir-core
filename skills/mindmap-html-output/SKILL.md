---
name: Mind Map HTML Output
description: Generate a self-contained, interactive HTML mind map file powered by the Mind Elixir core. Use when a user wants to turn outlines, markdown, notes, or structured text into a standalone .html file that renders a editable mind map in any browser (a "canvas-capable" client) — no build step required.
---

# Mind Map HTML Output

Turn any hierarchical content (bullet outline, markdown headings, meeting notes, a topic tree, structured JSON) into a **single standalone `.html` file** that renders an interactive mind map using the Mind Elixir core loaded from a CDN. The file opens directly in any browser — it is the "canvas client". No npm install, no bundler.

This is the right skill when the user says things like "把这段内容做成思维导图", "export a mind map as html", "生成一个可以直接打开的思维导图网页", or "用 mind-elixir 内核输出 html 思维导图".

## When to use

- The deliverable is a **file the user can open/share**, not a component inside an existing app.
- The user wants zero-setup output (double-click → mind map).
- Input is prose/outline/markdown that must first be structured into a tree.

If the user instead wants to embed Mind Elixir into a React/Vue project, use the **Integrate Mind Elixir** skill. For image-only export, use **Export Mind Map as Image**.

## Workflow

1. **Collect / parse the content.** Accept free text, markdown, or a tree. Reduce it to a single-rooted hierarchy.
2. **Build the `MindElixirData` JSON** (see below). Prefer JSON when you need styling, icons, tags, links, or images. For a plain nested-list outline you may instead use `plaintextConverter` (optional, see end).
3. **Produce the HTML file** from the template `assets/template.html`: replace `__TITLE__` with a title and `__MINDMAP_DATA__` with the pretty-printed `MindElixirData` JSON object. Keep everything else intact.
4. **Deliver** the `.html` file via `present_files` so the user can open it in the built-in preview or a browser. Tell them the toolbar buttons (PNG / SVG / 保存数据 / 导出 HTML) let them re-export or snapshot edits.

## `MindElixirData` shape

```js
{
  nodeData: {            // required: the root node
    topic: '中心主题',
    id: 'root',          // stable ids help avoid re-layout fl/jump
    expanded: true,
    // style: { fontSize: '20', color: '#d9434e', background: '#fff0f0' },
    // tags: ['重要'],
    // icons: ['⭐'],
    // hyperLink: 'https://example.com',
    // image: { url: 'https://.../logo.png', height: 80, width: 80 },
    children: [
      {
        topic: '分支 1',
        id: 'b1',
        expanded: true,
        children: [
          { topic: '子节点 1-1', id: 'b1-1' },
          { topic: '子节点 1-2', id: 'b1-2' },
        ],
      },
      { topic: '分支 2', id: 'b2' },
    ],
  },
  direction: 1,          // optional: 0|1|2|3 — 或设置 options.direction
  theme: {               // optional
    name: 'Latte',
    palette: ['#dd7878', '#ea76cb', '#8839ef', '#40a02b', '#209fb5', '#1e66f5'],
    cssVar: { '--main-color': '#444446', '--main-bgcolor': '#ffffff', '--color': '#777', '--bgcolor': '#f6f6f6' },
  },
  // arrows: [...], summaries: [...], compact: false
}
```

Render options (set on `new MindElixir(options)`): `el`, `direction: MindElixir.LEFT | MindElixir.RIGHT`, `toolBar`, `contextMenu`, `keypress`, and optional `markdown: (text) => parser(text)` if topics contain markdown/rich text.

## CDN notes (important)

- Pin to the major version so the API stays compatible:  
  `https://cdn.jsdelivr.net/npm/mind-elixir@5/dist/MindElixir.js`  
  `https://cdn.jsdelivr.net/npm/mind-elixir@5/dist/MindElixir.css`
- The CSS file is **`MindElixir.css`** (not `style.css`) on the CDN — match the package's `dist` output.
- PNG/SVG export use Mind Elixir's **built-in** `mind.exportPng()` / `mind.exportSvg()` — no `@zumer/snapdom` dependency needed for the standalone file.

## Optional: convert a plain outline with plaintextConverter

If the input is already an indentation/markdown bullet list, you can convert it without hand-writing JSON. In a page/script with the module available:

```js
import { plaintextToMindElixir } from 'https://cdn.jsdelivr.net/npm/mind-elixir@5/dist/PlaintextConverter.js'
const data = plaintextToMindElixir(`- 中心主题
  - 分支 1
    - 子节点
  - 分支 2`)
```

Then pass `data` into the template's `__MINDMAP_DATA__` slot. Plaintext format supports `[^id]` anchors, `{color:...}` node styling, `}` summaries, and `>` arrows — see the **Streaming Mindmap** skill for the full grammar.

## Tips & pitfalls

- Always give the root and every node a **unique, stable `id`**; regenerate ids deterministically from content paths to avoid the whole graph re-rendering on refresh.
- Keep topics short; long text hurts layout. Put detail in child nodes.
- The standalone file needs **internet access** on first open (CDN). If the user needs a fully offline file, download `MindElixir.js` + `MindElixir.css` and rewrite the two CDN URLs to relative/local paths.
- `exportPng()` is async and may return `null` if capture fails — the template guards against that.
