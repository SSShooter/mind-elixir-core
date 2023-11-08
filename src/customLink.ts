import { generateUUID, getArrowPoints, getObjById, getOffsetLT, setAttributes } from './utils/index'
import LinkDragMoveHelper from './utils/LinkDragMoveHelper'
import { findEle } from './utils/dom'
import { createSvgGroup, editSvgText } from './utils/svg'
import type { CustomSvg, Topic } from './types/dom'
import type { MindElixirInstance, Uid } from './index'

// TODO: rename `custom link` to `association`

// p1: starting point
// p2: control point of starting point
// p3: control point of ending point
// p4: ending point

export type LinkItem = {
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

export const drawCustomLink = function (this: MindElixirInstance, from: Topic, to: Topic, obj: LinkItem, isInitPaint?: boolean) {
  if (!from || !to) {
    return // not expand
  }
  const start = performance.now()
  const fromData = calcCtrlP(this, from, obj.delta1)
  const toData = calcCtrlP(this, to, obj.delta2)

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
  const label = createText(obj.label, halfx, halfy, this.theme.cssVar['--color'])
  newSvgGroup.appendChild(label)

  newSvgGroup.linkObj = obj
  newSvgGroup.dataset.linkid = obj.id
  this.linkSvgGroup.appendChild(newSvgGroup)
  if (!isInitPaint) {
    this.linkData[obj.id] = obj
    this.currentLink = newSvgGroup
    this.showLinkController(obj, fromData, toData)
  }
  const end = performance.now()
  console.log(`DrawCustomLink Execution time: ${end - start} ms`)
}

export const createLink = function (this: MindElixirInstance, from: Topic, to: Topic) {
  const linkObj = {
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
  this.drawCustomLink(from, to, linkObj)

  this.bus.fire('operation', {
    name: 'createCustomLink',
    obj: linkObj,
  })
}

export const removeLink = function (this: MindElixirInstance, linkSvg?: CustomSvg) {
  let link
  if (linkSvg) {
    link = linkSvg
  } else {
    link = this.currentLink
  }
  if (!link) return
  this.hideLinkController()
  const id = link.linkObj!.id
  delete this.linkData[id]
  link.remove()
  this.bus.fire('operation', {
    name: 'removeCustomLink',
    obj: {
      id,
    },
  })
}

export const selectLink = function (this: MindElixirInstance, link: CustomSvg) {
  this.currentLink = link
  const obj = link.linkObj

  const from = findEle(obj.from)
  const to = findEle(obj.to)

  const fromData = calcCtrlP(this, from, obj.delta1)
  const toData = calcCtrlP(this, to, obj.delta2)

  this.showLinkController(obj, fromData, toData)
}

export const unselectLink = function (this: MindElixirInstance) {
  this.currentLink = null
  this.hideLinkController()
}

export const hideLinkController = function (this: MindElixirInstance) {
  this.linkController.style.display = 'none'
  this.P2.style.display = 'none'
  this.P3.style.display = 'none'
}

export const showLinkController = function (this: MindElixirInstance, linkItem: LinkItem, fromData: DivData, toData: DivData) {
  this.linkController.style.display = 'initial'
  this.P2.style.display = 'initial'
  this.P3.style.display = 'initial'
  this.nodes.appendChild(this.linkController)
  this.nodes.appendChild(this.P2)
  this.nodes.appendChild(this.P3)

  // init points
  let { x: p1x, y: p1y } = calcP(fromData)
  let { ctrlX: p2x, ctrlY: p2y } = fromData
  let { ctrlX: p3x, ctrlY: p3y } = toData
  let { x: p4x, y: p4y } = calcP(toData)

  this.P2.style.cssText = `top:${p2y}px;left:${p2x}px;`
  this.P3.style.cssText = `top:${p3y}px;left:${p3x}px;`
  setAttributes(this.line1, {
    x1: p1x + '',
    y1: p1y + '',
    x2: p2x + '',
    y2: p2y + '',
  })
  setAttributes(this.line2, {
    x1: p3x + '',
    y1: p3y + '',
    x2: p4x + '',
    y2: p4y + '',
  })

  if (this.helper1) {
    this.helper1.destory(this.map)
    this.helper2?.destory(this.map)
  }

  this.helper1 = LinkDragMoveHelper.create(this.P2)
  this.helper2 = LinkDragMoveHelper.create(this.P3)

  // TODO: generate cb function
  this.helper1.init(this.map, (deltaX, deltaY) => {
    // recalc key points
    p2x = p2x + deltaX / this.scaleVal
    p2y = p2y + deltaY / this.scaleVal
    const p1 = calcP({ ...fromData, ctrlX: p2x, ctrlY: p2y })
    p1x = p1.x
    p1y = p1.y
    const halfx = p1x / 8 + (p2x * 3) / 8 + (p3x * 3) / 8 + p4x / 8
    const halfy = p1y / 8 + (p2y * 3) / 8 + (p3y * 3) / 8 + p4y / 8
    // update dom position
    this.P2.style.top = p2y + 'px'
    this.P2.style.left = p2x + 'px'
    this.currentLink?.children[0].setAttribute('d', `M ${p1x} ${p1y} C ${p2x} ${p2y} ${p3x} ${p3y} ${p4x} ${p4y}`)
    setAttributes(this.currentLink!.children[2], {
      x: halfx + '',
      y: halfy + '',
    })
    setAttributes(this.line1, {
      x1: p1x + '',
      y1: p1y + '',
      x2: p2x + '',
      y2: p2y + '',
    })
    // update linkItem
    linkItem.delta1.x = p2x - fromData.cx
    linkItem.delta1.y = p2y - fromData.cy
  })

  this.helper2.init(this.map, (deltaX, deltaY) => {
    p3x = p3x + deltaX / this.scaleVal
    p3y = p3y + deltaY / this.scaleVal
    const p4 = calcP({ ...toData, ctrlX: p3x, ctrlY: p3y })
    p4x = p4.x
    p4y = p4.y
    const halfx = p1x / 8 + (p2x * 3) / 8 + (p3x * 3) / 8 + p4x / 8
    const halfy = p1y / 8 + (p2y * 3) / 8 + (p3y * 3) / 8 + p4y / 8
    const arrowPoint = getArrowPoints(p3x, p3y, p4x, p4y)

    this.P3.style.top = p3y + 'px'
    this.P3.style.left = p3x + 'px'
    this.currentLink?.children[0].setAttribute('d', `M ${p1x} ${p1y} C ${p2x} ${p2y} ${p3x} ${p3y} ${p4x} ${p4y}`)
    this.currentLink?.children[1].setAttribute('d', `M ${arrowPoint.x1} ${arrowPoint.y1} L ${p4x} ${p4y} L ${arrowPoint.x2} ${arrowPoint.y2}`)
    setAttributes(this.currentLink!.children[2], {
      x: halfx + '',
      y: halfy + '',
    })
    // TODO: absctract this
    setAttributes(this.line2, {
      x1: p3x + '',
      y1: p3y + '',
      x2: p4x + '',
      y2: p4y + '',
    })
    linkItem.delta2.x = p3x - toData.cx
    linkItem.delta2.y = p3y - toData.cy
  })
}

export function renderCustomLink(this: MindElixirInstance) {
  this.linkSvgGroup.innerHTML = ''
  for (const prop in this.linkData) {
    const link = this.linkData[prop]
    try {
      this.drawCustomLink(findEle(link.from), findEle(link.to), link, true)
    } catch (e) {
      console.warn('Node may not be expanded')
    }
  }
  this.nodes.appendChild(this.linkSvgGroup)
}

export function editCutsomLinkLabel(this: MindElixirInstance, el: CustomSvg) {
  console.time('editSummary')
  if (!el) return
  const textEl = el.children[2]
  console.log(textEl, el)
  editSvgText(this, textEl, div => {
    const node = el.linkObj
    const text = div.textContent?.trim() || ''
    if (text === '') node.label = origin
    else node.label = text
    div.remove()
    if (text === origin) return
    textEl.innerHTML = node.label
    this.linkDiv()
    this.bus.fire('operation', {
      name: 'finishEditCustomLinkLabel',
      obj: node,
    })
  })
  console.timeEnd('editSummary')
}

export function tidyCustomLink(this: MindElixirInstance) {
  for (const prop in this.linkData) {
    const link = this.linkData[prop]
    if (!getObjById(link.from, this.nodeData) || !getObjById(link.to, this.nodeData)) {
      delete this.linkData[link.id]
    }
  }
}
