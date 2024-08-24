import { generateUUID, getArrowPoints, getObjById, getOffsetLT, setAttributes } from './utils/index'
import LinkDragMoveHelper from './utils/LinkDragMoveHelper'
import { findEle } from './utils/dom'
import { createSvgGroup, editSvgText } from './utils/svg'
import type { CustomSvg, Topic } from './types/dom'
import type { MindElixirInstance, Uid } from './index'

// p1: starting point
// p2: control point of starting point
// p3: control point of ending point
// p4: ending point

export type Arrow = {
  id: string
  label: string
  from: Uid
  to: Uid
  delta1: {
    x: number
    y: number
  }
  delta2: {
    x: number
    y: number
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

// calc starting and ending point using control point and div status
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
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
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

const drawArrow = function (mei: MindElixirInstance, from: Topic, to: Topic, obj: Arrow, isInitPaint?: boolean) {
  if (!from || !to) {
    return // not expand
  }
  const start = performance.now()
  const fromData = calcCtrlP(mei, from, obj.delta1)
  const toData = calcCtrlP(mei, to, obj.delta2)

  const { x: p1x, y: p1y } = calcP(fromData)
  const { ctrlX: p2x, ctrlY: p2y } = fromData
  const { ctrlX: p3x, ctrlY: p3y } = toData
  const { x: p4x, y: p4y } = calcP(toData)

  const arrowPoint = getArrowPoints(p3x, p3y, p4x, p4y)

  const newSvgGroup = createSvgGroup(
    `M ${p1x} ${p1y} C ${p2x} ${p2y} ${p3x} ${p3y} ${p4x} ${p4y}`,
    `M ${arrowPoint.x1} ${arrowPoint.y1} L ${p4x} ${p4y} L ${arrowPoint.x2} ${arrowPoint.y2}`
  )

  const halfx = p1x / 8 + (p2x * 3) / 8 + (p3x * 3) / 8 + p4x / 8
  const halfy = p1y / 8 + (p2y * 3) / 8 + (p3y * 3) / 8 + p4y / 8
  const label = createText(obj.label, halfx, halfy, mei.theme.cssVar['--color'])
  newSvgGroup.appendChild(label)

  newSvgGroup.arrowObj = obj
  newSvgGroup.dataset.linkid = obj.id
  mei.linkSvgGroup.appendChild(newSvgGroup)
  if (!isInitPaint) {
    mei.arrows.push(obj)
    mei.currentArrow = newSvgGroup
    showLinkController(mei, obj, fromData, toData)
  }
  const end = performance.now()
  console.log(`DrawArrow Execution time: ${end - start} ms`)
}

export const createArrow = function (this: MindElixirInstance, from: Topic, to: Topic) {
  const arrowObj = {
    id: generateUUID(),
    label: 'Custom Link',
    from: from.nodeObj.id,
    to: to.nodeObj.id,
    delta1: {
      x: 0,
      y: -200,
    },
    delta2: {
      x: 0,
      y: -200,
    },
  }
  drawArrow(this, from, to, arrowObj)

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

  const from = findEle(obj.from)
  const to = findEle(obj.to)

  const fromData = calcCtrlP(this, from, obj.delta1)
  const toData = calcCtrlP(this, to, obj.delta2)

  showLinkController(this, obj, fromData, toData)
}

export const unselectArrow = function (this: MindElixirInstance) {
  this.currentArrow = null
  hideLinkController(this)
}

const hideLinkController = function (mei: MindElixirInstance) {
  mei.linkController.style.display = 'none'
  mei.P2.style.display = 'none'
  mei.P3.style.display = 'none'
}

const showLinkController = function (mei: MindElixirInstance, linkItem: Arrow, fromData: DivData, toData: DivData) {
  mei.linkController.style.display = 'initial'
  mei.P2.style.display = 'initial'
  mei.P3.style.display = 'initial'
  mei.nodes.appendChild(mei.linkController)
  mei.nodes.appendChild(mei.P2)
  mei.nodes.appendChild(mei.P3)

  // init points
  let { x: p1x, y: p1y } = calcP(fromData)
  let { ctrlX: p2x, ctrlY: p2y } = fromData
  let { ctrlX: p3x, ctrlY: p3y } = toData
  let { x: p4x, y: p4y } = calcP(toData)

  mei.P2.style.cssText = `top:${p2y}px;left:${p2x}px;`
  mei.P3.style.cssText = `top:${p3y}px;left:${p3x}px;`
  setAttributes(mei.line1, {
    x1: p1x + '',
    y1: p1y + '',
    x2: p2x + '',
    y2: p2y + '',
  })
  setAttributes(mei.line2, {
    x1: p3x + '',
    y1: p3y + '',
    x2: p4x + '',
    y2: p4y + '',
  })

  if (mei.helper1) {
    mei.helper1.destory(mei.map)
    mei.helper2?.destory(mei.map)
  }

  mei.helper1 = LinkDragMoveHelper.create(mei.P2)
  mei.helper2 = LinkDragMoveHelper.create(mei.P3)

  // TODO: generate cb function
  mei.helper1.init(mei.map, (deltaX, deltaY) => {
    // recalc key points
    p2x = p2x + deltaX / mei.scaleVal
    p2y = p2y + deltaY / mei.scaleVal
    const p1 = calcP({ ...fromData, ctrlX: p2x, ctrlY: p2y })
    p1x = p1.x
    p1y = p1.y
    const halfx = p1x / 8 + (p2x * 3) / 8 + (p3x * 3) / 8 + p4x / 8
    const halfy = p1y / 8 + (p2y * 3) / 8 + (p3y * 3) / 8 + p4y / 8
    // update dom position
    mei.P2.style.top = p2y + 'px'
    mei.P2.style.left = p2x + 'px'
    mei.currentArrow?.children[0].setAttribute('d', `M ${p1x} ${p1y} C ${p2x} ${p2y} ${p3x} ${p3y} ${p4x} ${p4y}`)
    setAttributes(mei.currentArrow!.children[2], {
      x: halfx + '',
      y: halfy + '',
    })
    setAttributes(mei.line1, {
      x1: p1x + '',
      y1: p1y + '',
      x2: p2x + '',
      y2: p2y + '',
    })
    // update linkItem
    linkItem.delta1.x = p2x - fromData.cx
    linkItem.delta1.y = p2y - fromData.cy
  })

  mei.helper2.init(mei.map, (deltaX, deltaY) => {
    p3x = p3x + deltaX / mei.scaleVal
    p3y = p3y + deltaY / mei.scaleVal
    const p4 = calcP({ ...toData, ctrlX: p3x, ctrlY: p3y })
    p4x = p4.x
    p4y = p4.y
    const halfx = p1x / 8 + (p2x * 3) / 8 + (p3x * 3) / 8 + p4x / 8
    const halfy = p1y / 8 + (p2y * 3) / 8 + (p3y * 3) / 8 + p4y / 8
    const arrowPoint = getArrowPoints(p3x, p3y, p4x, p4y)

    mei.P3.style.top = p3y + 'px'
    mei.P3.style.left = p3x + 'px'
    mei.currentArrow?.children[0].setAttribute('d', `M ${p1x} ${p1y} C ${p2x} ${p2y} ${p3x} ${p3y} ${p4x} ${p4y}`)
    mei.currentArrow?.children[1].setAttribute('d', `M ${arrowPoint.x1} ${arrowPoint.y1} L ${p4x} ${p4y} L ${arrowPoint.x2} ${arrowPoint.y2}`)
    setAttributes(mei.currentArrow!.children[2], {
      x: halfx + '',
      y: halfy + '',
    })
    // TODO: absctract this
    setAttributes(mei.line2, {
      x1: p3x + '',
      y1: p3y + '',
      x2: p4x + '',
      y2: p4y + '',
    })
    linkItem.delta2.x = p3x - toData.cx
    linkItem.delta2.y = p3y - toData.cy
  })
}

export function renderArrow(this: MindElixirInstance) {
  this.linkSvgGroup.innerHTML = ''
  for (let i = 0; i < this.arrows.length; i++) {
    const link = this.arrows[i]
    try {
      drawArrow(this, findEle(link.from), findEle(link.to), link, true)
    } catch (e) {
      console.warn('Node may not be expanded')
    }
  }
  this.nodes.appendChild(this.linkSvgGroup)
}

export function editArrowLabel(this: MindElixirInstance, el: CustomSvg) {
  console.time('editSummary')
  if (!el) return
  const textEl = el.children[2]
  editSvgText(this, textEl, div => {
    const node = el.arrowObj
    const text = div.textContent?.trim() || ''
    if (text === '') node.label = origin
    else node.label = text
    div.remove()
    if (text === origin) return
    textEl.innerHTML = node.label
    this.linkDiv()
    this.bus.fire('operation', {
      name: 'finishEditArrowLabel',
      obj: node,
    })
  })
  console.timeEnd('editSummary')
}

export function tidyArrow(this: MindElixirInstance) {
  this.arrows = this.arrows.filter(arrow => {
    return getObjById(arrow.from, this.nodeData) && getObjById(arrow.to, this.nodeData)
  })
}
