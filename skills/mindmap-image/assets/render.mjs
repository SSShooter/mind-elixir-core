#!/usr/bin/env node
// Headless mind-map -> HD image renderer.
// Combines the standalone-HTML generation (Mind Map HTML Output) with the
// SCST capture engine (@mind-elixir/export-mindmap) running inside a headless
// Chromium browser (Playwright / @playwright/test).
//
// Usage:
//   node render.mjs --data mindmap.json --out mindmap.png --format png --scale 2 --bg "#ffffff"
//   node render.mjs --html prebuilt.html --out out.webp --method screenshot --scale 3
//
// Run from the repo root so `@playwright/test` resolves from node_modules.
// The HTML is served over a local http://127.0.0.1 server because Chromium
// blocks ES-module <script> imports on file:// (opaque) origins.

import { chromium } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import http from 'node:http'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function parseArgs(argv) {
  const o = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true
      o[key] = val
    }
  }
  return o
}

const args = parseArgs(process.argv.slice(2))
if (!args.data && !args.html) {
  console.error('Error: provide --data <MindElixirData.json> or --html <file.html>')
  process.exit(1)
}

const formatRaw = (args.format || 'png').toLowerCase()
const format = formatRaw === 'jpg' ? 'jpeg' : formatRaw // SCST + screenshot accept png|jpeg|webp
const scale = Number(args.scale || 2)
const bg = args.bg || '#ffffff'
const quality = args.quality != null ? Number(args.quality) : undefined
const out = path.resolve(args.out || `mindmap.${format}`)
const method = (args.method || 'scst').toLowerCase()
const watermark = !(args['no-watermark'] === true || args['no-watermark'] === 'true') // SCST watermarkEnabled; on by default, pass --no-watermark to disable
const padding = Number(args.padding || 20)
const title = args.title || 'Mind Map'

// ---- Build the HTML to render ----
let html
if (args.html) {
  html = await readFile(path.resolve(args.html), 'utf8')
} else {
  const tpl = await readFile(path.join(__dirname, 'template.html'), 'utf8')
  const data = (await readFile(path.resolve(args.data), 'utf8')).trim()
  html = tpl.replace('__TITLE__', title).replace('__MINDMAP_DATA__', data)
}

// ---- Serve over HTTP so module imports work ----
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end(html)
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const port = server.address().port
const url = `http://127.0.0.1:${port}/`

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: scale, // used by the screenshot method for HD output
})
const pageErrors = []
page.on('pageerror', (e) => pageErrors.push(e.message))

try {
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => window.__ready === true, { timeout: 30000 })
  await page.waitForTimeout(300) // let web fonts / images settle

  if (method === 'screenshot') {
    await page.evaluate(() => {
      const map = document.querySelector('#map')
      const inner = document.querySelector('#map .map-container') || document.querySelector('#map > div')
      if (map && inner) {
        map.style.overflow = 'visible'
        map.style.width = inner.scrollWidth + 'px'
        map.style.height = inner.scrollHeight + 'px'
      }
    })
    const box = await page.evaluate((pad) => {
      const el = document.querySelector('#map .map-container') || document.querySelector('#map > div')
      const r = el.getBoundingClientRect()
      return {
        x: Math.max(0, r.x - pad),
        y: Math.max(0, r.y - pad),
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      }
    }, padding)
    const buf = await page.screenshot({
      type: format,
      quality: format === 'png' ? undefined : quality,
      clip: box,
    })
    await writeFile(out, buf)
  } else {
    // Default: SCST exportImage inside the page -> blob: URL -> base64 PNG/JPEG/WEBP.
    const b64 = await page.evaluate(
      async (opts) => {
        const mod = await import('https://cdn.jsdelivr.net/npm/@mind-elixir/export-mindmap@0.1/dist/index.js')
        const blobUrl = await mod.exportImage(window.__mind, opts.format, {
          scale: opts.scale,
          backgroundColor: opts.bg,
          quality: opts.quality,
          watermarkEnabled: opts.watermark,
        })
        const blob = await (await fetch(blobUrl)).blob()
        const bytes = new Uint8Array(await blob.arrayBuffer())
        let bin = ''
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
        return btoa(bin)
      },
      { format, scale, bg, quality, watermark }
    )
    await writeFile(out, Buffer.from(b64, 'base64'))
  }
} finally {
  await browser.close()
  server.close()
}

if (pageErrors.length) console.warn('Page errors (non-fatal):', pageErrors.join(' | '))
console.log(`Saved ${out} (method=${method}, format=${format}, scale=${scale})`)
