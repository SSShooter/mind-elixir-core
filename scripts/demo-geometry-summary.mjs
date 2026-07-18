/**
 * DOM-free geometry demo: summary brackets
 *
 *   node scripts/demo-geometry-summary.mjs
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { layoutGeometry, renderGeometrySvg } from '../dist/LayoutGeometry.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const nodeData = {
  id: 'root',
  topic: 'Summary Demo',
  children: [
    {
      id: 'left-main',
      topic: 'Product',
      direction: 0,
      children: [
        { id: 'p1', topic: 'Research' },
        { id: 'p2', topic: 'Design' },
        { id: 'p3', topic: 'Develop' },
        { id: 'p4', topic: 'Ship' },
      ],
    },
    {
      id: 'right-main',
      topic: 'Engineering',
      direction: 1,
      children: [
        {
          id: 'e1',
          topic: 'Frontend',
          children: [
            { id: 'e1a', topic: 'React' },
            { id: 'e1b', topic: 'CSS' },
          ],
        },
        {
          id: 'e2',
          topic: 'Backend',
          children: [
            { id: 'e2a', topic: 'API' },
            { id: 'e2b', topic: 'DB' },
          ],
        },
        { id: 'e3', topic: 'DevOps' },
        { id: 'e4', topic: 'QA' },
      ],
    },
    {
      id: 'right-main-2',
      topic: 'Go-to-market',
      direction: 1,
      children: [
        { id: 'g1', topic: 'Docs' },
        { id: 'g2', topic: 'Launch' },
        { id: 'g3', topic: 'Feedback' },
      ],
    },
  ],
}

const summaries = [
  // Bracket over left branch siblings (indices under left-main)
  {
    id: 'sum-left',
    parent: 'left-main',
    start: 0,
    end: 3,
    label: 'Full product cycle',
    style: {
      stroke: '#dd7878',
      labelColor: '#dd7878',
    },
  },
  // Partial range on the right
  {
    id: 'sum-eng',
    parent: 'right-main',
    start: 0,
    end: 1,
    label: 'App stack',
    style: {
      stroke: '#8839ef',
      labelColor: '#8839ef',
    },
  },
  // Single-node summary
  {
    id: 'sum-single',
    parent: 'right-main',
    start: 2,
    end: 2,
    label: 'Infra',
    style: {
      stroke: '#40a02b',
      labelColor: '#40a02b',
    },
  },
  // Long multi-line label
  {
    id: 'sum-long',
    parent: 'right-main-2',
    start: 0,
    end: 2,
    label:
      'This is a summary section that groups related go-to-market nodes and may wrap to multiple lines.',
    style: {
      labelColor: '#209fb5',
      stroke: '#209fb5',
    },
  },
]

const geometry = layoutGeometry(nodeData, {
  direction: 2,
  summaries,
})

const svg = renderGeometrySvg(geometry)
const out = join(__dirname, '..', 'demo-geometry-summary.svg')
writeFileSync(out, svg, 'utf8')

console.log('Summary demo:', {
  width: geometry.width,
  height: geometry.height,
  nodes: geometry.nodes.length,
  summaries: geometry.summaries.length,
  labels: geometry.summaries.map(s => ({
    id: s.id,
    anchor: s.anchor,
    labelW: s.labelWidth,
    labelH: s.labelHeight,
    label: s.label.slice(0, 40),
  })),
})
console.log('Wrote', out)
