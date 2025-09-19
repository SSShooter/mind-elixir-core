import type { MindElixirInstance, Topic } from '.'
import { DirectionClass } from './types/index'
import { generateUUID, getOffsetLT, setAttributes } from './utils'
import { createLabel, editSvgText, svgNS } from './utils/svg'
import { calculatePrecisePosition } from './utils/svg'

export interface SummaryStyle {
  /**
   * stroke color of the summary
   */
  stroke?: string
  /**
   * color of the summary label
   */
  labelColor?: string
}

export interface SummaryOptions {
  style?: SummaryStyle
}

/**
 * @public
 */
export interface Summary {
  id: string
  label: string
  /**
   * parent node id of the summary
   */
  parent: string
  /**
   * start index of the summary
   */
  start: number
  /**
   * end index of the summary
   */
  end: number
  /**
   * style of the summary
   */
  style?: SummaryStyle
}

export type SummarySvgGroup = SVGGElement & {
  children: [SVGPathElement]
  summaryObj: Summary
  labelEl?: HTMLDivElement // Reference to the label div element
}

const calcRange = function (nodes: Topic[]) {
  if (nodes.length === 0) throw new Error('No selected node.')
  if (nodes.length === 1) {
    const obj = nodes[0].nodeObj
    const parent = nodes[0].nodeObj.parent
    if (!parent) throw new Error('Can not select root node.')
    const i = parent.children!.findIndex(child => obj === child)
    return {
      parent: parent.id,
      start: i,
      end: i,
    }
  }
  let maxLen = 0
  const parentChains = nodes.map(item => {
    let node = item.nodeObj
    const parentChain = []
    while (node.parent) {
      const parent = node.parent
      const siblings = parent.children
      const index = siblings?.indexOf(node)
      node = parent
      parentChain.unshift({ node, index })
    }
    if (parentChain.length > maxLen) maxLen = parentChain.length
    return parentChain
  })
  let index = 0
  // find minimum common parent
  findMcp: for (; index < maxLen; index++) {
    const base = parentChains[0][index]?.node
    for (let i = 1; i < parentChains.length; i++) {
      const parentChain = parentChains[i]
      if (parentChain[index]?.node !== base) {
        break findMcp
      }
    }
  }
  if (!index) throw new Error('Can not select root node.')
  const range = parentChains.map(chain => chain[index - 1].index).sort()
  const min = range[0] || 0
  const max = range[range.length - 1] || 0
  const parent = parentChains[0][index - 1].node
  if (!parent.parent) throw new Error('Please select nodes in the same main topic.')

  return {
    parent: parent.id,
    start: min,
    end: max,
  }
}

const creatGroup = function (id: string) {
  const group = document.createElementNS(svgNS, 'g') as SummarySvgGroup
  group.setAttribute('id', id)
  return group
}

const createPath = function (d: string, color?: string) {
  const path = document.createElementNS(svgNS, 'path')
  setAttributes(path, {
    d,
    stroke: color || '#666',
    fill: 'none',
    'stroke-linecap': 'round',
    'stroke-width': '2',
  })
  return path
}

const getWrapper = (tpc: Topic) => tpc.parentElement.parentElement

const getDirection = function (mei: MindElixirInstance, { parent, start }: Summary) {
  const parentEl = mei.findEle(parent)
  const parentObj = parentEl.nodeObj
  let side: DirectionClass
  if (parentObj.parent) {
    side = parentEl.closest('me-main')!.className as DirectionClass
  } else {
    side = mei.findEle(parentObj.children![start].id).closest('me-main')!.className as DirectionClass
  }
  return side
}

const drawSummary = function (mei: MindElixirInstance, summary: Summary) {
  const { id, label: summaryText, parent, start, end, style } = summary
  const { nodes, theme, summarySvg } = mei
  const parentEl = mei.findEle(parent)
  const parentObj = parentEl.nodeObj
  const side = getDirection(mei, summary)
  let left = Infinity
  let right = 0
  let startTop = 0
  let endBottom = 0
  for (let i = start; i <= end; i++) {
    const child = parentObj.children?.[i]
    if (!child) {
      console.warn('Child not found')
      mei.removeSummary(id)
      return null
    }
    const wrapper = getWrapper(mei.findEle(child.id))
    const { offsetLeft, offsetTop } = getOffsetLT(nodes, wrapper)
    const offset = start === end ? 10 : 20
    if (i === start) startTop = offsetTop + offset
    if (i === end) endBottom = offsetTop + wrapper.offsetHeight - offset
    if (offsetLeft < left) left = offsetLeft
    if (wrapper.offsetWidth + offsetLeft > right) right = wrapper.offsetWidth + offsetLeft
  }
  let path
  let text
  const offset = !parentObj.parent ? 0 : 10
  const top = startTop + offset
  const bottom = endBottom + offset
  const md = (top + bottom) / 2
  const strokeColor = style?.stroke || theme.cssVar['--color']
  const labelColor = style?.labelColor || theme.cssVar['--color']
  const groupId = 's-' + id
  if (side === DirectionClass.LHS) {
    path = createPath(`M ${left + 10} ${top} c -5 0 -10 5 -10 10 L ${left} ${bottom - 10} c 0 5 5 10 10 10 M ${left} ${md} h -10`, strokeColor)
    text = createLabel(summaryText, left - 20, md, { anchor: 'end', color: labelColor, dataType: 's-label', svgId: groupId })
  } else {
    path = createPath(`M ${right - 10} ${top} c 5 0 10 5 10 10 L ${right} ${bottom - 10} c 0 5 -5 10 -10 10 M ${right} ${md} h 10`, strokeColor)
    text = createLabel(summaryText, right + 20, md, { anchor: 'start', color: labelColor, dataType: 's-label', svgId: groupId })
  }
  const group = creatGroup(groupId)
  group.appendChild(path)
  // Add label to the label container instead of SVG group
  mei.labelContainer.appendChild(text)
  calculatePrecisePosition(text)
  group.summaryObj = summary
  group.labelEl = text // Store reference to label element
  summarySvg.appendChild(group)
  return group
}

export const createSummary = function (this: MindElixirInstance, options: SummaryOptions = {}) {
  if (!this.currentNodes) return
  const { currentNodes: nodes, summaries, bus } = this
  const { parent, start, end } = calcRange(nodes)
  const summary = { id: generateUUID(), parent, start, end, label: 'summary', style: options.style }
  const g = drawSummary(this, summary) as SummarySvgGroup
  summaries.push(summary)
  this.editSummary(g)
  bus.fire('operation', {
    name: 'createSummary',
    obj: summary,
  })
}

export const createSummaryFrom = function (this: MindElixirInstance, summary: Omit<Summary, 'id'>) {
  // now I know the goodness of overloading
  const id = generateUUID()
  const newSummary = { ...summary, id }
  drawSummary(this, newSummary)
  this.summaries.push(newSummary)
  this.bus.fire('operation', {
    name: 'createSummary',
    obj: newSummary,
  })
}

export const removeSummary = function (this: MindElixirInstance, id: string) {
  const index = this.summaries.findIndex(summary => summary.id === id)
  if (index > -1) {
    this.summaries.splice(index, 1)
    this.nodes.querySelector('#s-' + id)?.remove()
    this.nodes.querySelector('#label-s-' + id)?.remove()
  }
  this.bus.fire('operation', {
    name: 'removeSummary',
    obj: { id },
  })
}

export const selectSummary = function (this: MindElixirInstance, el: SummarySvgGroup) {
  const label = el.labelEl
  if (label) {
    label.classList.add('selected')
  }
  this.currentSummary = el
}

export const unselectSummary = function (this: MindElixirInstance) {
  this.currentSummary?.labelEl?.classList.remove('selected')
  this.currentSummary = null
}

export const renderSummary = function (this: MindElixirInstance) {
  this.summarySvg.innerHTML = ''
  this.summaries.forEach(summary => {
    try {
      drawSummary(this, summary)
    } catch (e) {
      console.warn('Node may not be expanded')
    }
  })
  this.nodes.insertAdjacentElement('beforeend', this.summarySvg)
}

export const editSummary = function (this: MindElixirInstance, el: SummarySvgGroup) {
  if (!el) return
  if (!el.labelEl) return
  editSvgText(this, el.labelEl, el.summaryObj)
}
