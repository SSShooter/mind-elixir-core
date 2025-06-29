import { generateUUID, getArrowPoints, getObjById, getOffsetLT, setAttributes } from './utils/index'
import LinkDragMoveHelper from './utils/LinkDragMoveHelper'
import { findEle } from './utils/dom'
import { createSvgGroup, editSvgText, svgNS } from './utils/svg'
import type { CustomSvg, Topic } from './types/dom'
import type { MindElixirInstance, Uid } from './index'

export interface Arrow {
  id: string
  /**
   * label of arrow
   */
  label: string
  /**
   * id of start node
   */
  from: Uid
  /**
   * id of end node
   */
  to: Uid
  /**
   *  offset of control point from start point
   */
  delta1: {
    x: number
    y: number
  }
  /**
   * offset of control point from end point
   */
  delta2: {
    x: number
    y: number
  }
  /**
   * whether the arrow is bidirectional
   */
  bidirectional?: boolean
  /**
   * style properties for the arrow
   */
  style?: {
    /**
     * stroke color of the arrow
     */
    stroke?: string
    /**
     * stroke width of the arrow
     */
    strokeWidth?: string | number
    /**
     * stroke dash array for dashed lines
     */
    strokeDasharray?: string
    /**
     * stroke line cap style
     */
    strokeLinecap?: 'butt' | 'round' | 'square'
    /**
     * opacity of the arrow
     */
    opacity?: string | number
    /**
     * color of the arrow label
     */
    labelColor?: string
  }
}
export type DivData = {
  cx: number // center x
  cy: number // center y
  w: number // div width
  h: number // div height
  ctrlX: number // control point x
  ctrlY: number // control point y
}
export type ArrowOptions = {
  bidirectional?: boolean
  style?: {
    stroke?: string
    strokeWidth?: string | number
    strokeDasharray?: string
    strokeLinecap?: 'butt' | 'round' | 'square'
    opacity?: string | number
    labelColor?: string
  }
}

/**
 * Calculate bezier curve midpoint position
 */
function calcBezierMidPoint(p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number, p4x: number, p4y: number) {
  return {
    x: p1x / 8 + (p2x * 3) / 8 + (p3x * 3) / 8 + p4x / 8,
    y: p1y / 8 + (p2y * 3) / 8 + (p3y * 3) / 8 + p4y / 8,
  }
}

/**
 * Update arrow label position
 */
function updateArrowLabel(label: SVGTextElement, x: number, y: number) {
  setAttributes(label, {
    x: x + '',
    y: y + '',
  })
}

/**
 * Update control line position
 */
function updateControlLine(line: SVGElement, x1: number, y1: number, x2: number, y2: number) {
  setAttributes(line, {
    x1: x1 + '',
    y1: y1 + '',
    x2: x2 + '',
    y2: y2 + '',
  })
}

/**
 * Update arrow path and related elements
 */
function updateArrowPath(
  arrow: CustomSvg,
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  p3x: number,
  p3y: number,
  p4x: number,
  p4y: number,
  linkItem: Arrow
) {
  // Update main path
  arrow.line.setAttribute('d', `M ${p1x} ${p1y} C ${p2x} ${p2y} ${p3x} ${p3y} ${p4x} ${p4y}`)

  // Apply styles to the main line if they exist
  if (linkItem.style) {
    const style = linkItem.style
    if (style.stroke) arrow.line.setAttribute('stroke', style.stroke)
    if (style.strokeWidth) arrow.line.setAttribute('stroke-width', String(style.strokeWidth))
    if (style.strokeDasharray) arrow.line.setAttribute('stroke-dasharray', style.strokeDasharray)
    if (style.strokeLinecap) arrow.line.setAttribute('stroke-linecap', style.strokeLinecap)
    if (style.opacity !== undefined) arrow.line.setAttribute('opacity', String(style.opacity))
  }

  // Update arrow head
  const arrowPoint = getArrowPoints(p3x, p3y, p4x, p4y)
  if (arrowPoint) {
    arrow.arrow1.setAttribute('d', `M ${arrowPoint.x1} ${arrowPoint.y1} L ${p4x} ${p4y} L ${arrowPoint.x2} ${arrowPoint.y2}`)

    // Apply styles to arrow head
    if (linkItem.style) {
      const style = linkItem.style
      if (style.stroke) arrow.arrow1.setAttribute('stroke', style.stroke)
      if (style.strokeWidth) arrow.arrow1.setAttribute('stroke-width', String(style.strokeWidth))
      if (style.strokeLinecap) arrow.arrow1.setAttribute('stroke-linecap', style.strokeLinecap)
      if (style.opacity !== undefined) arrow.arrow1.setAttribute('opacity', String(style.opacity))
    }
  }

  // Update start arrow if bidirectional
  if (linkItem.bidirectional) {
    const arrowPointStart = getArrowPoints(p2x, p2y, p1x, p1y)
    if (arrowPointStart) {
      arrow.arrow2.setAttribute('d', `M ${arrowPointStart.x1} ${arrowPointStart.y1} L ${p1x} ${p1y} L ${arrowPointStart.x2} ${arrowPointStart.y2}`)

      // Apply styles to start arrow head
      if (linkItem.style) {
        const style = linkItem.style
        if (style.stroke) arrow.arrow2.setAttribute('stroke', style.stroke)
        if (style.strokeWidth) arrow.arrow2.setAttribute('stroke-width', String(style.strokeWidth))
        if (style.strokeLinecap) arrow.arrow2.setAttribute('stroke-linecap', style.strokeLinecap)
        if (style.opacity !== undefined) arrow.arrow2.setAttribute('opacity', String(style.opacity))
      }
    }
  }

  // Update label position and color
  const { x: halfx, y: halfy } = calcBezierMidPoint(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y)
  updateArrowLabel(arrow.label, halfx, halfy)

  // Apply label color if specified
  if (linkItem.style?.labelColor) {
    arrow.label.setAttribute('fill', linkItem.style.labelColor)
  }

  // Update highlight layer
  updateArrowHighlight(arrow)
}

/**
 * calc control point, center point and div size
 */
function calcCtrlP(mei: MindElixirInstance, tpc: Topic, delta: { x: number; y: number }) {
  const { offsetLeft: x, offsetTop: y } = getOffsetLT(mei.nodes, tpc)
  const w = tpc.offsetWidth
  const h = tpc.offsetHeight
  const cx = x + w / 2
  const cy = y + h / 2
  const ctrlX = cx + delta.x
  const ctrlY = cy + delta.y
  return {
    w,
    h,
    cx,
    cy,
    ctrlX,
    ctrlY,
  }
}

/**
 * calc start and end point using control point and div status
 */
function calcP(data: DivData) {
  let x, y
  const k = (data.cy - data.ctrlY) / (data.ctrlX - data.cx)
  if (k > data.h / data.w || k < -data.h / data.w) {
    if (data.cy - data.ctrlY < 0) {
      x = data.cx - data.h / 2 / k
      y = data.cy + data.h / 2
    } else {
      x = data.cx + data.h / 2 / k
      y = data.cy - data.h / 2
    }
  } else {
    if (data.cx - data.ctrlX < 0) {
      x = data.cx + data.w / 2
      y = data.cy - (data.w * k) / 2
    } else {
      x = data.cx - data.w / 2
      y = data.cy + (data.w * k) / 2
    }
  }
  return {
    x,
    y,
  }
}

const createText = function (string: string, x: number, y: number, color?: string) {
  const text = document.createElementNS(svgNS, 'text')
  setAttributes(text, {
    'text-anchor': 'middle',
    x: x + '',
    y: y + '',
    fill: color || '#666',
  })
  text.dataset.type = 'custom-link'
  text.innerHTML = string
  return text
}

/**
 * FYI
 * p1: start point
 * p2: control point of start point
 * p3: control point of end point
 * p4: end point
 */
const drawArrow = function (mei: MindElixirInstance, from: Topic, to: Topic, obj: Arrow, isInitPaint?: boolean) {
  if (!from || !to) {
    return // not expand
  }

  const fromData = calcCtrlP(mei, from, obj.delta1)
  const toData = calcCtrlP(mei, to, obj.delta2)

  const { x: p1x, y: p1y } = calcP(fromData)
  const { ctrlX: p2x, ctrlY: p2y } = fromData
  const { ctrlX: p3x, ctrlY: p3y } = toData
  const { x: p4x, y: p4y } = calcP(toData)

  const arrowT = getArrowPoints(p3x, p3y, p4x, p4y)
  if (!arrowT) return

  const toArrow = `M ${arrowT.x1} ${arrowT.y1} L ${p4x} ${p4y} L ${arrowT.x2} ${arrowT.y2}`
  let fromArrow = ''
  if (obj.bidirectional) {
    const arrowF = getArrowPoints(p2x, p2y, p1x, p1y)
    if (!arrowF) return
    fromArrow = `M ${arrowF.x1} ${arrowF.y1} L ${p1x} ${p1y} L ${arrowF.x2} ${arrowF.y2}`
  }
  const newSvgGroup = createSvgGroup(`M ${p1x} ${p1y} C ${p2x} ${p2y} ${p3x} ${p3y} ${p4x} ${p4y}`, toArrow, fromArrow, obj.style)

  // Use extracted common function to calculate midpoint
  const { x: halfx, y: halfy } = calcBezierMidPoint(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y)
  const labelColor = obj.style?.labelColor || mei.theme.cssVar['--color']
  const label = createText(obj.label, halfx, halfy, labelColor)
  newSvgGroup.appendChild(label)
  newSvgGroup.label = label

  newSvgGroup.arrowObj = obj
  newSvgGroup.dataset.linkid = obj.id
  mei.linkSvgGroup.appendChild(newSvgGroup)
  if (!isInitPaint) {
    mei.arrows.push(obj)
    mei.currentArrow = newSvgGroup
    showLinkController(mei, obj, fromData, toData)
  }
}

export const createArrow = function (this: MindElixirInstance, from: Topic, to: Topic, options: ArrowOptions = {}) {
  const arrowObj = {
    id: generateUUID(),
    label: 'Custom Link',
    from: from.nodeObj.id,
    to: to.nodeObj.id,
    delta1: {
      x: from.offsetWidth / 2 + 100,
      y: 0,
    },
    delta2: {
      x: to.offsetWidth / 2 + 100,
      y: 0,
    },
    ...options,
  }
  drawArrow(this, from, to, arrowObj)

  this.bus.fire('operation', {
    name: 'createArrow',
    obj: arrowObj,
  })
}

export const createArrowFrom = function (this: MindElixirInstance, arrow: Omit<Arrow, 'id'>) {
  const arrowObj = { ...arrow, id: generateUUID() }
  drawArrow(this, this.findEle(arrowObj.from), this.findEle(arrowObj.to), arrowObj)

  this.bus.fire('operation', {
    name: 'createArrow',
    obj: arrowObj,
  })
}

export const removeArrow = function (this: MindElixirInstance, linkSvg?: CustomSvg) {
  let link
  if (linkSvg) {
    link = linkSvg
  } else {
    link = this.currentArrow
  }
  if (!link) return
  hideLinkController(this)
  const id = link.arrowObj!.id
  this.arrows = this.arrows.filter(arrow => arrow.id !== id)
  link.remove()
  this.bus.fire('operation', {
    name: 'removeArrow',
    obj: {
      id,
    },
  })
}

export const selectArrow = function (this: MindElixirInstance, link: CustomSvg) {
  this.currentArrow = link
  const obj = link.arrowObj

  const from = this.findEle(obj.from)
  const to = this.findEle(obj.to)

  const fromData = calcCtrlP(this, from, obj.delta1)
  const toData = calcCtrlP(this, to, obj.delta2)

  showLinkController(this, obj, fromData, toData)
}

export const unselectArrow = function (this: MindElixirInstance) {
  hideLinkController(this)
  this.currentArrow = null
}

/**
 * Create a highlight path element with common attributes
 */
const createHighlightPath = function (d: string, highlightColor: string): SVGPathElement {
  const path = document.createElementNS(svgNS, 'path')
  setAttributes(path, {
    d,
    stroke: highlightColor,
    fill: 'none',
    'stroke-width': '6',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  })
  return path
}

const addArrowHighlight = function (arrow: CustomSvg, highlightColor: string) {
  const highlightGroup = document.createElementNS(svgNS, 'g')
  highlightGroup.setAttribute('class', 'arrow-highlight')
  highlightGroup.setAttribute('opacity', '0.45')

  const highlightLine = createHighlightPath(arrow.line.getAttribute('d')!, highlightColor)
  highlightGroup.appendChild(highlightLine)

  const highlightArrow1 = createHighlightPath(arrow.arrow1.getAttribute('d')!, highlightColor)
  highlightGroup.appendChild(highlightArrow1)

  if (arrow.arrow2.getAttribute('d')) {
    const highlightArrow2 = createHighlightPath(arrow.arrow2.getAttribute('d')!, highlightColor)
    highlightGroup.appendChild(highlightArrow2)
  }

  arrow.insertBefore(highlightGroup, arrow.firstChild)
}

const removeArrowHighlight = function (arrow: CustomSvg) {
  const highlightGroup = arrow.querySelector('.arrow-highlight')
  if (highlightGroup) {
    highlightGroup.remove()
  }
}

const updateArrowHighlight = function (arrow: CustomSvg) {
  const highlightGroup = arrow.querySelector('.arrow-highlight')
  if (!highlightGroup) return

  const highlightPaths = highlightGroup.querySelectorAll('path')
  if (highlightPaths.length >= 1) {
    highlightPaths[0].setAttribute('d', arrow.line.getAttribute('d')!)
  }
  if (highlightPaths.length >= 2) {
    highlightPaths[1].setAttribute('d', arrow.arrow1.getAttribute('d')!)
  }
  if (highlightPaths.length >= 3 && arrow.arrow2.getAttribute('d')) {
    highlightPaths[2].setAttribute('d', arrow.arrow2.getAttribute('d')!)
  }
}

const hideLinkController = function (mei: MindElixirInstance) {
  mei.helper1?.destroy!()
  mei.helper2?.destroy!()
  mei.linkController.style.display = 'none'
  mei.P2.style.display = 'none'
  mei.P3.style.display = 'none'
  if (mei.currentArrow) {
    removeArrowHighlight(mei.currentArrow)
  }
}

const showLinkController = function (mei: MindElixirInstance, linkItem: Arrow, fromData: DivData, toData: DivData) {
  const { linkController, P2, P3, line1, line2, nodes, map, currentArrow, bus } = mei
  if (!currentArrow) return
  linkController.style.display = 'initial'
  P2.style.display = 'initial'
  P3.style.display = 'initial'
  nodes.appendChild(linkController)
  nodes.appendChild(P2)
  nodes.appendChild(P3)

  const highlightColor = '#4dc4ff'
  addArrowHighlight(currentArrow, highlightColor)

  // init points
  let { x: p1x, y: p1y } = calcP(fromData)
  let { ctrlX: p2x, ctrlY: p2y } = fromData
  let { ctrlX: p3x, ctrlY: p3y } = toData
  let { x: p4x, y: p4y } = calcP(toData)

  P2.style.cssText = `top:${p2y}px;left:${p2x}px;`
  P3.style.cssText = `top:${p3y}px;left:${p3x}px;`
  updateControlLine(line1, p1x, p1y, p2x, p2y)
  updateControlLine(line2, p3x, p3y, p4x, p4y)

  mei.helper1 = LinkDragMoveHelper.create(P2)
  mei.helper2 = LinkDragMoveHelper.create(P3)

  mei.helper1.init(map, (deltaX, deltaY) => {
    // recalc key points
    p2x = p2x + deltaX / mei.scaleVal // scale should keep the latest value
    p2y = p2y + deltaY / mei.scaleVal
    const p1 = calcP({ ...fromData, ctrlX: p2x, ctrlY: p2y })
    p1x = p1.x
    p1y = p1.y

    // update dom position
    P2.style.top = p2y + 'px'
    P2.style.left = p2x + 'px'

    // Use extracted common function to update arrow
    updateArrowPath(currentArrow, p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y, linkItem)
    updateControlLine(line1, p1x, p1y, p2x, p2y)

    linkItem.delta1.x = p2x - fromData.cx
    linkItem.delta1.y = p2y - fromData.cy

    bus.fire('updateArrowDelta', linkItem)
  })

  mei.helper2.init(map, (deltaX, deltaY) => {
    p3x = p3x + deltaX / mei.scaleVal
    p3y = p3y + deltaY / mei.scaleVal
    const p4 = calcP({ ...toData, ctrlX: p3x, ctrlY: p3y })
    p4x = p4.x
    p4y = p4.y

    P3.style.top = p3y + 'px'
    P3.style.left = p3x + 'px'

    // Use extracted common function to update arrow
    updateArrowPath(currentArrow, p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y, linkItem)
    updateControlLine(line2, p3x, p3y, p4x, p4y)

    linkItem.delta2.x = p3x - toData.cx
    linkItem.delta2.y = p3y - toData.cy

    bus.fire('updateArrowDelta', linkItem)
  })
}

export function renderArrow(this: MindElixirInstance) {
  this.linkSvgGroup.innerHTML = ''
  for (let i = 0; i < this.arrows.length; i++) {
    const link = this.arrows[i]
    try {
      drawArrow(this, this.findEle(link.from), this.findEle(link.to), link, true)
    } catch (e) {
      console.warn('Node may not be expanded')
    }
  }
  this.nodes.appendChild(this.linkSvgGroup)
}

export function editArrowLabel(this: MindElixirInstance, el: CustomSvg) {
  hideLinkController(this)
  console.time('editSummary')
  if (!el) return
  const textEl = el.label
  editSvgText(this, textEl, el.arrowObj)
  console.timeEnd('editSummary')
}

export function tidyArrow(this: MindElixirInstance) {
  this.arrows = this.arrows.filter(arrow => {
    return getObjById(arrow.from, this.nodeData) && getObjById(arrow.to, this.nodeData)
  })
}
