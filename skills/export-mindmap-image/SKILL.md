---
name: Export Mind Map as Image
description: Guide for exporting mind maps as images using `@zumer/snapdom`.
---

# Export Mind Map as Image

Mind Elixir recommends using `@zumer/snapdom` for high-quality image exports. This tool allows you to convert the SVG nodes directly into image formats.

## 1. Installation

Install `@zumer/snapdom` as a dependency.

```bash
npm install @zumer/snapdom
```

## 2. Usage

Use the `snapdom` function to capture the mind map nodes and download them.

```typescript
import { snapdom } from '@zumer/snapdom'
// Assuming `mind` is your MindElixir instance

const downloadImage = async () => {
  // 1. Capture the nodes
  const result = await snapdom(mind.nodes)

  // 2. Download as JPG or PNG
  await result.download({
    format: 'jpg', // or 'png'
    filename: 'mind-map-export',
  })
}
```

## 3. Creating a Trigger

You can add a button to your UI to trigger this function.

```html
<button id="export-btn">Export Image</button>

<script>
  document.getElementById('export-btn').addEventListener('click', downloadImage)
</script>
```

> **Note**: The built-in `mind.exportSvg()` method is deprecated. Please use the method above for new projects.
