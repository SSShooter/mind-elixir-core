/**
 * DOM-free mind map → SVG demo (Node.js)
 *
 * Usage (after build):
 *   node scripts/demo-geometry.mjs
 *
 * Or with tsx/dev against source via built dist.
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { nodeDataToSvg, layoutGeometry } from '../dist/LayoutGeometry.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const nodeData = {
  id: 'root',
  topic: 'Mind Elixir',
  tags: ['Geometry'],
  children: [
    {
      id: 'a',
      topic: 'DOM-free layout',
      direction: 0,
      children: [
        { id: 'a1', topic: 'Measure text' },
        { id: 'a2', topic: 'Absolute coordinates' },
        {
          id: 'a3',
          topic: 'Nested branch',
          children: [
            { id: 'a3a', topic: 'Child A' },
            { id: 'a3b', topic: 'Child B with longer label' },
          ],
        },
      ],
    },
    {
      id: 'b',
      topic: 'Render SVG',
      direction: 1,
      children: [
        { id: 'b1', topic: 'Links via generateBranch' },
        { id: 'b2', topic: 'Theme cssVar colors' },
        { id: 'b3', topic: '中文节点测试' },
      ],
    },
    {
      id: 'c',
      topic: 'Node.js export',
      direction: 1,
      children: [
        { id: 'c1', topic: 'nodeData → layoutGeometry' },
        { id: 'c2', topic: 'layoutGeometry → SVG string' },
        { id: 'c3', topic: 'SVG → PNG (resvg / sharp)' },
      ],
    },
  ],
}

const geometry = layoutGeometry(nodeData, { direction: 2 })
const svg = nodeDataToSvg(nodeData, { direction: 2 })

const out = join(__dirname, '..', 'demo-geometry.svg')
writeFileSync(out, svg, 'utf8')

console.log('Geometry:', {
  width: geometry.width,
  height: geometry.height,
  nodes: geometry.nodes.length,
  links: geometry.links.length,
  leftMains: geometry.leftMains.length,
  rightMains: geometry.rightMains.length,
})
console.log('Wrote', out)
