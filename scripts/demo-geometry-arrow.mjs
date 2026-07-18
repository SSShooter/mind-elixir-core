/**
 * DOM-free geometry demo: custom arrows (topiclinks)
 * Connects nearby nodes so curves / arrowheads are easy to see.
 *
 *   node scripts/demo-geometry-arrow.mjs
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { layoutGeometry, renderGeometrySvg } from '../dist/LayoutGeometry.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const nodeData = {
  id: 'root',
  topic: 'Arrow Demo',
  children: [
    {
      id: 'left-main',
      topic: 'Left branch',
      direction: 0,
      children: [
        { id: 'L1', topic: 'Source A' },
        { id: 'L2', topic: 'Source B' },
        {
          id: 'L3',
          topic: 'Nested',
          children: [
            { id: 'L3a', topic: 'Deep left' },
            { id: 'L3b', topic: 'Also deep' },
          ],
        },
      ],
    },
    {
      id: 'right-main',
      topic: 'Right branch',
      direction: 1,
      children: [
        { id: 'R1', topic: 'Target A' },
        { id: 'R2', topic: 'Target B' },
        { id: 'R3', topic: 'Target C' },
      ],
    },
    {
      id: 'right-main-2',
      topic: 'Related topic',
      direction: 1,
      children: [
        { id: 'R4', topic: 'Peer node' },
        { id: 'R5', topic: 'Another peer' },
      ],
    },
  ],
}

const arrows = [
  // Adjacent siblings on the left
  {
    id: 'arr-sib-left',
    label: 'sibling',
    from: 'L1',
    to: 'L2',
    delta1: { x: -40, y: 20 },
    delta2: { x: -40, y: -20 },
    style: {
      stroke: '#e64553',
      strokeWidth: 2,
      labelColor: '#e64553',
    },
  },
  // Nested peers (very close)
  {
    id: 'arr-nested',
    label: 'nested',
    from: 'L3a',
    to: 'L3b',
    delta1: { x: -50, y: 15 },
    delta2: { x: -50, y: -15 },
    style: {
      stroke: '#dd7878',
      labelColor: '#dd7878',
    },
  },
  // Adjacent siblings on the right
  {
    id: 'arr-sib-right',
    label: 'auto delta',
    from: 'R1',
    to: 'R2',
    // no delta — exercise default short-distance C-curve
  },
  // Neighboring leaves under same parent
  {
    id: 'arr-same-side',
    label: 'same side',
    from: 'R2',
    to: 'R3',
    delta1: { x: 50, y: 25 },
    delta2: { x: 50, y: -25 },
    style: {
      stroke: '#209fb5',
      labelColor: '#209fb5',
    },
  },
  // Bidirectional between two nearby peers under Related topic
  {
    id: 'arr-bi',
    label: 'Bidirectional!',
    from: 'R4',
    to: 'R5',
    bidirectional: true,
    delta1: { x: 60, y: 20 },
    delta2: { x: 60, y: -20 },
    style: {
      stroke: '#8839ef',
      labelColor: '#8839ef',
      strokeWidth: '2',
      strokeDasharray: '6,4',
      opacity: '1',
    },
  },
  // Short hop: main topic → its own child (nearby)
  {
    id: 'arr-parent-child',
    label: 'Render',
    from: 'right-main',
    to: 'R3',
    delta1: { x: 80, y: 40 },
    delta2: { x: -30, y: -10 },
    style: {
      stroke: '#fe640b',
      strokeWidth: 2,
      labelColor: '#fe640b',
    },
  },
]

const geometry = layoutGeometry(nodeData, {
  direction: 2,
  arrows,
})

const svg = renderGeometrySvg(geometry)
const out = join(__dirname, '..', 'demo-geometry-arrow.svg')
writeFileSync(out, svg, 'utf8')

console.log('Arrow demo:', {
  width: geometry.width,
  height: geometry.height,
  nodes: geometry.nodes.length,
  arrows: geometry.arrows.length,
  arrowLabels: geometry.arrows.map(a => `${a.label}: ${a.id}`),
})
console.log('Wrote', out)
