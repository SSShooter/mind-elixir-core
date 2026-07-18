/**
 * DOM-free geometry demo: ultra-long / multi-line topic text
 * Verifies wrap + width against CSS me-tpc max-width: 35em (border-box).
 *
 *   node scripts/demo-geometry-longtext.mjs
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { layoutGeometry, renderGeometrySvg } from '../dist/LayoutGeometry.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const longCjk =
  '这是一段非常非常长的中文主题文本用来验证节点宽度是否会按照三十五个em自动换行而不是无限横向拉长，同时检查根节点主节点与子节点在不同字号下的最大宽度是否正确。'

const longEn =
  'This is an extremely long English topic string without intentional line breaks that should wrap within the me-tpc max-width of thirty-five ems so the layout does not stretch the entire branch horizontally forever and ever.'

const longUnbroken = 'Supercalifragilisticexpialidocious'.repeat(6)

const multiLine = `Line one is short.
Line two is a much longer sentence that will itself wrap when it hits the content max width for this node role.
Line three: 中英 mixed 宽度测试 ABCDEFG 1234567890.`

const nodeData = {
  id: 'root',
  topic:
    '超长根节点标题：LayoutGeometry 宽度 / 换行 验证（Root uses 25px font → 35em = 875px outer）',
  tags: ['long-text', 'width'],
  children: [
    {
      id: 'left',
      topic: '左侧：中文超长',
      direction: 0,
      children: [
        { id: 'L1', topic: longCjk },
        {
          id: 'L2',
          topic: multiLine,
        },
        {
          id: 'L3',
          topic: '带链接的长文本：' + longCjk.slice(0, 40),
          hyperLink: 'https://example.com',
        },
      ],
    },
    {
      id: 'right',
      topic: '右侧：English long',
      direction: 1,
      children: [
        { id: 'R1', topic: longEn },
        {
          id: 'R2',
          topic: longUnbroken,
        },
        {
          id: 'R3',
          topic: 'Custom large font long topic — should use 35em of 22px ≈ 770 outer',
          style: { fontSize: '22px', fontWeight: 'bold' },
        },
        {
          id: 'R4',
          topic: '短',
        },
      ],
    },
    {
      id: 'main-long',
      topic:
        '主节点自身也很长：main 有较大 padding(8×25) 与 2px border，border-box 下内容区应比 560 更窄一些。',
      direction: 1,
      children: [
        {
          id: 'M1',
          topic: '子节点 max≈35×16−topicPadding×2',
        },
      ],
    },
  ],
}

const geometry = layoutGeometry(nodeData, { direction: 2 })
const svg = renderGeometrySvg(geometry)

const out = join(__dirname, '..', 'demo-geometry-longtext.svg')
writeFileSync(out, svg, 'utf8')

// Diagnostic: expected CSS max outer = 35 * fontSize; content = outer − pad − border*2
function expectContentMax(fontSize, padL, padR, border) {
  return 35 * fontSize - padL - padR - border * 2
}

const report = geometry.nodes.map(n => {
  const pad = n.padding
  const chrome = pad.left + pad.right + n.borderWidth * 2
  const contentW = n.rect.width - chrome
  const expectedMax = expectContentMax(n.fontSize, pad.left, pad.right, n.borderWidth)
  return {
    id: n.id,
    role: n.role,
    fontSize: n.fontSize,
    lines: n.lines.length,
    boxW: n.rect.width,
    contentW: Math.round(contentW),
    expectedMaxContent: expectedMax,
    atCap: contentW >= expectedMax - 1,
    firstLine: (n.lines[0] || '').slice(0, 36) + (n.lines[0]?.length > 36 ? '…' : ''),
  }
})

console.log('Map size:', geometry.width, 'x', geometry.height)
console.log('\nNode width report (contentW vs CSS 35em border-box content max):')
console.table(report)
console.log('Wrote', out)
