---
name: Export Mind Map as Image
description: Guide for exporting mind maps as images using the built-in SCST engine from `@mind-elixir/export-mindmap`.
---

# Export Mind Map as Image

Mind Elixir exports images through the built-in SCST engine from `@mind-elixir/export-mindmap`. SCST is a lightweight, high-performance DOM-to-image library based on SVG `<foreignObject>` + Canvas, with zero third-party screenshot dependencies.

## 1. Installation

Install `@mind-elixir/export-mindmap` as a dependency.

```bash
npm install @mind-elixir/export-mindmap
```

## 2. Usage

Use the `downloadImage` / `exportImage` functions to capture the mind map nodes and download them.

```typescript
import { downloadImage, exportImage } from '@mind-elixir/export-mindmap'
// Assuming `mind` is your MindElixir instance

// Download as PNG / JPEG / WEBP
await downloadImage(mind, 'png') // format: 'png' | 'jpeg' | 'webp'

// Or get the URL for preview / custom handling instead of downloading
const url = await exportImage(mind, 'png')
```

## 3. Using SCST directly

SCST is also exported from the package and can be used to screenshot any DOM element.

```typescript
import { domToBlob, domToDataURL, domToObjectURL } from '@mind-elixir/export-mindmap'

const blob = await domToBlob(element, 'png', options)
const dataUrl = await domToDataURL(element, 'jpeg', options)
const objectUrl = await domToObjectURL(element, 'webp', options) // most memory-efficient for downloads
```

> **Note**: The built-in `mind.exportSvg()` method is deprecated. Please use the method above for new projects.
