import { generateUUID, getArrowPoints, getObjById, getOffsetLT, setAttributes } from './utils/index'
import LinkDragMoveHelper from './utils/LinkDragMoveHelper'
import { calculatePrecisePosition, createArrowGroup, createLabel, editSvgText, svgNS } from './utils/svg'
import type { CustomSvg, Topic } from './types/dom'
import type { MindElixirInstance, Uid } from './index'

const highlightColor = '#4dc4ff'

export interface ArrowStyle {
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
  style?: ArrowStyle
}
export interface DivData {
  cx: number // center x
  cy: number // center y
  w: number // div width
  h: number // div height
  ctrlX: number // control point x
  ctrlY: number // control point y
}
export interface ArrowOptions {
  bidirectional?: boolean
  style?: ArrowStyle
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
function updateArrowLabel(labelEl: HTMLDivElement, x: number, y: number) {
  if (!labelEl) return
  labelEl.dataset.x = x.toString()
  labelEl.dataset.y = y.toString()
  calculatePrecisePosition(labelEl)
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
  const mainPath = `M ${p1x} ${p1y} C ${p2x} ${p2y} ${p3x} ${p3y} ${p4x} ${p4y}`

  // Update main path
  arrow.line.setAttribute('d', mainPath)

  // Apply styles to the main line if they exist
  if (linkItem.style) {
    const style = linkItem.style
    if (style.stroke) arrow.line.setAttribute('stroke', style.stroke)
    if (style.strokeWidth) arrow.line.setAttribute('stroke-width', String(style.strokeWidth))
    if (style.strokeDasharray) arrow.line.setAttribute('stroke-dasharray', style.strokeDasharray)
    if (style.strokeLinecap) arrow.line.setAttribute('stroke-linecap', style.strokeLinecap)
    if (style.opacity !== undefined) arrow.line.setAttribute('opacity', String(style.opacity))
  }

  // Update hotzone for main path (find the first hotzone path which corresponds to the main line)
  const hotzones = arrow.querySelectorAll('path[stroke="transparent"]')
  if (hotzones.length > 0) {
    hotzones[0].setAttribute('d', mainPath)
  }

  // Update arrow head
  const arrowPoint = getArrowPoints(p3x, p3y, p4x, p4y)
  if (arrowPoint) {
    const arrowPath1 = `M ${arrowPoint.x1} ${arrowPoint.y1} L ${p4x} ${p4y} L ${arrowPoint.x2} ${arrowPoint.y2}`
    arrow.arrow1.setAttribute('d', arrowPath1)

    // Update hotzone for arrow1
    if (hotzones.length > 1) {
      hotzones[1].setAttribute('d', arrowPath1)
    }

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
      const arrowPath2 = `M ${arrowPointStart.x1} ${arrowPointStart.y1} L ${p1x} ${p1y} L ${arrowPointStart.x2} ${arrowPointStart.y2}`
      arrow.arrow2.setAttribute('d', arrowPath2)

      // Update hotzone for arrow2
      if (hotzones.length > 2) {
        hotzones[2].setAttribute('d', arrowPath2)
      }

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
  if (arrow.labelEl) {
    updateArrowLabel(arrow.labelEl, halfx, halfy)
  }

  // Apply label color if specified
  if (linkItem.style?.labelColor) {
    const div = arrow.labelEl
    if (div) {
      div.style.color = linkItem.style.labelColor
    }
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
  const newSvgGroup = createArrowGroup(`M ${p1x} ${p1y} C ${p2x} ${p2y} ${p3x} ${p3y} ${p4x} ${p4y}`, toArrow, fromArrow, obj.style)

  // Use extracted common function to calculate midpoint
  const { x: halfx, y: halfy } = calcBezierMidPoint(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y)
  const labelColor = obj.style?.labelColor || 'rgb(235, 95, 82)'
  const groupId = 'arrow-' + obj.id
  newSvgGroup.id = groupId
  const renderedLabel = mei.markdown ? mei.markdown(obj.label, obj) : obj.label
  const label = createLabel(renderedLabel, halfx, halfy, {
    anchor: 'middle',
    color: labelColor,
    dataType: 'arrow',
    svgId: groupId,
  })
  newSvgGroup.labelEl = label // Store reference to label element
  newSvgGroup.arrowObj = obj
  newSvgGroup.dataset.linkid = obj.id
  mei.labelContainer.appendChild(label)
  mei.linkSvgGroup.appendChild(newSvgGroup)
  calculatePrecisePosition(label)
  if (!isInitPaint) {
    mei.arrows.push(obj)
    mei.currentArrow = newSvgGroup
    showLinkController(mei, obj, fromData, toData)
  }
}

export const createArrow = function (this: MindElixirInstance, from: Topic, to: Topic, options: ArrowOptions = {}) {
  // Calculate center positions of both nodes
  const fromOffset = getOffsetLT(this.nodes, from)
  const toOffset = getOffsetLT(this.nodes, to)

  const fromCenterX = fromOffset.offsetLeft + from.offsetWidth / 2
  const fromCenterY = fromOffset.offsetTop + from.offsetHeight / 2
  const toCenterX = toOffset.offsetLeft + to.offsetWidth / 2
  const toCenterY = toOffset.offsetTop + to.offsetHeight / 2

  // Calculate the vector between nodes
  const dx = toCenterX - fromCenterX
  const dy = toCenterY - fromCenterY
  const distance = Math.sqrt(dx * dx + dy * dy)

  // Calculate recommended offset based on distance and direction
  // Use 30% of the distance as base offset, with min 50 and max 200
  const baseOffset = Math.max(50, Math.min(200, distance * 0.3))

  // Determine the primary direction and calculate deltas accordingly
  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)

  let delta1, delta2

  if (absDx > absDy * 1.5) {
    // Primarily horizontal arrangement
    // Calculate offset from the edge of the node, not the center
    const fromEdgeOffsetX = dx > 0 ? from.offsetWidth / 2 : -from.offsetWidth / 2
    const toEdgeOffsetX = dx > 0 ? -to.offsetWidth / 2 : to.offsetWidth / 2

    delta1 = { x: fromEdgeOffsetX + (dx > 0 ? baseOffset : -baseOffset), y: 0 }
    delta2 = { x: toEdgeOffsetX + (dx > 0 ? -baseOffset : baseOffset), y: 0 }
  } else if (absDy > absDx * 1.5) {
    // Primarily vertical arrangement
    // Calculate offset from the edge of the node, not the center
    const fromEdgeOffsetY = dy > 0 ? from.offsetHeight / 2 : -from.offsetHeight / 2
    const toEdgeOffsetY = dy > 0 ? -to.offsetHeight / 2 : to.offsetHeight / 2

    delta1 = { x: 0, y: fromEdgeOffsetY + (dy > 0 ? baseOffset : -baseOffset) }
    delta2 = { x: 0, y: toEdgeOffsetY + (dy > 0 ? -baseOffset : baseOffset) }
  } else {
    // Diagonal arrangement
    // Calculate offset from the edge of the node, not the center
    const angle = Math.atan2(dy, dx)

    // Calculate which edge point the arrow exits/enters from
    const fromEdgeOffsetX = (from.offsetWidth / 2) * Math.cos(angle)
    const fromEdgeOffsetY = (from.offsetHeight / 2) * Math.sin(angle)
    const toEdgeOffsetX = -(to.offsetWidth / 2) * Math.cos(angle)
    const toEdgeOffsetY = -(to.offsetHeight / 2) * Math.sin(angle)

    // Add the control point offset from the edge
    const offsetX = baseOffset * 0.7 * (dx > 0 ? 1 : -1)
    const offsetY = baseOffset * 0.7 * (dy > 0 ? 1 : -1)

    delta1 = { x: fromEdgeOffsetX + offsetX, y: fromEdgeOffsetY + offsetY }
    delta2 = { x: toEdgeOffsetX - offsetX, y: toEdgeOffsetY - offsetY }
  }

  const arrowObj = {
    id: generateUUID(),
    label: 'Custom Link',
    from: from.nodeObj.id,
    to: to.nodeObj.id,
    delta1,
    delta2,
    ...options,
  }
  drawArrow(this, from, to, arrowObj)

  this.bus.fire('operation', {
    name: 'createArrow',
    obj: arrowObj,
  })
}

export const createArrowFrom = function (this: MindElixirInstance, arrow: Omit<Arrow, 'id'>) {
  hideLinkController(this)
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

  link.labelEl?.remove()
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

  // Clear all arrow labels before re-rendering
  const arrowLabels = this.labelContainer.querySelectorAll('.svg-label[data-type="arrow"]')
  arrowLabels.forEach(label => label.remove())

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
  if (!el) return
  if (!el.labelEl) return
  editSvgText(this, el.labelEl, el.arrowObj)
}

export function tidyArrow(this: MindElixirInstance) {
  this.arrows = this.arrows.filter(arrow => {
    return getObjById(arrow.from, this.nodeData) && getObjById(arrow.to, this.nodeData)
  })
}
