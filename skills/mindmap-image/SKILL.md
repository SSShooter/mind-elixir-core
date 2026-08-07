---
name: Headless Mind Map Image
description: Combine the standalone-HTML generation from "Mind Map HTML Output" with the SCST capture engine from "@mind-elixir/export-mindmap" to render a high-definition mind map PNG/JPEG/WEBP directly from a headless browser — no manual open-and-click, no screenshot dependency on viewport size.
---

# Headless Mind Map Image

Turns outlines / markdown / structured text into a **high-definition mind map image produced automatically by a headless browser**. This skill is a combination of two others in this repo:

- **Mind Map HTML Output** → builds a self-contained `MindElixirData` HTML that renders the map (no build step, CDN-loaded core).
- **Export Mind Map as Image** → its built-in **SCST** engine (`@mind-elixir/export-mindmap`) rasterizes any DOM node to a canvas via SVG `<foreignObject>`, with a `scale` option for true high-DPI output.

Instead of asking the user to open the HTML and click "导出 PNG", this skill **drives a headless Chromium (Playwright)** to (1) render the HTML and (2) call `exportImage()` inside the page, writing the resulting PNG/JPEG/WEBP straight to disk.

Use it when the user wants a ready-to-use image ("生成一张高清思维导图图片", "把内容导出成图片", "headless 直出思维导图") rather than an interactive `.html`, and prefers zero manual steps.

## Prerequisites

- **Node.js** (the repo already has `@playwright/test` in `node_modules`; run the script from the repo root so the `import { chromium } from '@playwright/test'` resolves).
- **Chromium for Playwright**: `npx playwright install chromium` (one-time).
- **Network** on first run — the HTML loads `mind-elixir` and the export package from jsDelivr CDN. For a fully offline run, download `MindElixir.js` / `MindElixir.css` / `@mind-elixir/export-mindmap` and rewrite the CDN URLs to local paths (see "Offline" below).

> The HTML is served over a local `http://127.0.0.1` server, **not** `file://`, because Chromium blocks ES-module `<script>` imports on `file://` (opaque) origins. This is handled inside the script — you don't need to do anything.

## Workflow

1. **Collect / structure the content** into a single-rooted `MindElixirData` (same shape as the HTML Output skill). Keep `topic`s short; give every node a unique stable `id`.
2. **Save the data as JSON** (e.g. `mindmap.json`) — this is the input to the render script. (You may also hand-author the standalone HTML and pass `--html` instead.)
3. **Render headlessly** with the bundled script:

   ```bash
   node skills/mindmap-image/assets/render.mjs \
     --data mindmap.json \
     --out mindmap.png \
     --format png \
     --scale 2 \
     --bg "#ffffff"
   ```

4. **Deliver** the image via `present_files`.

## Render script options (`assets/render.mjs`)

| Flag | Default | Meaning |
|------|---------|---------|
| `--data <json>` | — | Path to a `MindElixirData` JSON file (mutually exclusive with `--html`). |
| `--html <file>` | — | Use a prebuilt standalone HTML (must expose `window.__mind` and set `window.__ready = true`). |
| `--out <path>` | `mindmap.png` | Output image path. |
| `--format` | `png` | `png` \| `jpeg`/`jpg` \| `webp`. |
| `--scale` | `2` | Pixel ratio for the raster (SCST `scale`). `2`–`3` gives crisp HD; raise for print. |
| `--bg` | `#ffffff` | Background color filled behind the map (`backgroundColor`). Use `"transparent"`-friendly value only for png/webp. |
| `--quality` | — | `0`–`1` for `jpeg`/`webp`. |
| `--title` | `Mind Map` | `<title>` of the generated HTML (informational). |
| `--method` | `scst` | `scst` (default, uses SCST `exportImage` and crops to the whole map) or `screenshot` (Playwright `page.screenshot` of the map container — works without the export package). |
| `--no-watermark` | off | Remove the Mind Elixir watermark from the output (`exportImage`'s `watermarkEnabled`). On by default. |
| `--padding` | `20` | Padding (CSS px) added around the map when `--method screenshot`. |

`--data` and `--html` are mutually exclusive; one is required.

## How it works

1. The script builds (or reads) a headless-friendly HTML: it loads `mind-elixir@5` from CDN, inits with the data, hides the toolbar, and sets `window.__mind` + `window.__ready = true` after the first layout pass.
2. Playwright loads it (`setContent` + `networkidle`), waits for `window.__ready`.
3. In the **page context** it dynamically imports `@mind-elixir/export-mindmap` and calls `exportImage(window.__mind, format, { scale, backgroundColor, quality, watermarkEnabled })`, which returns a data URL of the **entire map** (SCST computes the full bounding box, so off-screen nodes are included and there is no empty viewport margin). The watermark is on by default; pass `--no-watermark` to remove it.
4. The data URL is decoded and written to `--out`.

## `MindElixirData` shape (recap)

```js
{
  nodeData: { topic: '中心主题', id: 'root', expanded: true,
    children: [ { topic: '分支 1', id: 'b1', children: [
      { topic: '子节点 1-1', id: 'b1-1' } ] }, { topic: '分支 2', id: 'b2' } ] },
  direction: 1,
  theme: { name: 'Latte', palette: ['#dd7878','#ea76cb','#8839ef','#40a02b','#209fb5','#1e66f5'],
    cssVar: { '--main-color':'#444446','--main-bgcolor':'#ffffff','--color':'#777','--bgcolor':'#f6f6f6' } }
}
```

For an indentation/markdown bullet list, convert it with `plaintextToMindElixir` (from `mind-elixir@5/dist/PlaintextConverter.js`) before passing to `--data`.

## Tips & pitfalls

- **High-DPI**: `scale` is the lever for crispness. `scale: 2` ≈ Retina; `scale: 3`–`4` for large/printed maps. Output pixel size = map natural size × scale.
- **Background**: `png`/`webp` honor `backgroundColor`; pass a light color for slides, or omit/transparent-friendly for overlays. JPEG always has a background.
- **Large maps**: SCST crops to the full map regardless of viewport, so size is bounded by the map itself, not the 1280×800 headless viewport.
- **Fonts / images**: external images/fonts are inlined by SCST automatically; ensure network access (or go offline, below).
- **Offline**: download `MindElixir.js`, `MindElixir.css`, and `@mind-elixir/export-mindmap` `dist/index.js` (+ its deps), rewrite the CDN URLs (the two in `assets/template.html` and the export package import in `assets/render.mjs`), and run with `--data`. The export package itself is pure ESM with no extra screenshot deps.
- **Still want the interactive file?** Use the **Mind Map HTML Output** skill separately to deliver the editable `.html`.
