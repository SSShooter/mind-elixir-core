import { generateUUID, getArrowPoints, calcP1, calcP4, setAttributes } from './utils/index'
import LinkDragMoveHelper from './utils/LinkDragMoveHelper'
import { findEle } from './utils/dom'
import { createSvgGroup } from './utils/svg'
import type { CustomSvg, Topic } from './types/dom'
import type { MindElixirInstance, Uid } from './index'

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
export type LinkControllerData = {
  cx: number
  cy: number
  w: number
  h: number
}

const createText = function (string: string, x: number, y: number, color?: string) {
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  setAttributes(text, {
    'text-anchor': 'middle',
    x: x + '',
    y: y + '',
    fill: color || '#666',
  })
  text.innerHTML = string
  return text
}

export const createLink = function (this: MindElixirInstance, from: Topic, to: Topic, isInitPaint?: boolean, obj?: LinkItem) {
  const map = this.map.getBoundingClientRect()
  if (!from || !to) {
    return // not expand
  }
  const pfrom = from.getBoundingClientRect()
  const pto = to.getBoundingClientRect()
  const fromCenterX = (pfrom.x + pfrom.width / 2 - map.x) / this.scaleVal
  const fromCenterY = (pfrom.y + pfrom.height / 2 - map.y) / this.scaleVal
  const toCenterX = (pto.x + pto.width / 2 - map.x) / this.scaleVal
  const toCenterY = (pto.y + pto.height / 2 - map.y) / this.scaleVal

  let p2x, p2y, p3x, p3y
  if (isInitPaint && obj) {
    p2x = fromCenterX + obj.delta1.x
    p2y = fromCenterY + obj.delta1.y
    p3x = toCenterX + obj.delta2.x
    p3y = toCenterY + obj.delta2.y
  } else {
    if ((fromCenterY + toCenterY) / 2 - fromCenterY <= pfrom.height / 2) {
      // the situation that two div is too close
      p2x = (pfrom.x + pfrom.width - map.x) / this.scaleVal + 100
      p2y = fromCenterY
      p3x = (pto.x + pto.width - map.x) / this.scaleVal + 100
      p3y = toCenterY
    } else {
      p2x = (fromCenterX + toCenterX) / 2
      p2y = (fromCenterY + toCenterY) / 2
      p3x = (fromCenterX + toCenterX) / 2
      p3y = (fromCenterY + toCenterY) / 2
    }
  }

  const fromData = {
    cx: fromCenterX,
    cy: fromCenterY,
    w: pfrom.width,
    h: pfrom.height,
  }
  const toData = {
    cx: toCenterX,
    cy: toCenterY,
    w: pto.width,
    h: pto.height,
  }

  const p1 = calcP1(fromData, p2x, p2y)
  const p1x = p1.x
  const p1y = p1.y

  const p4 = calcP4(toData, p3x, p3y)
  const p4x = p4.x
  const p4y = p4.y

  const arrowPoint = getArrowPoints(p3x, p3y, p4x, p4y)

  const newLinkObj = {
    id: '',
    label: 'custom link',
    from: from.nodeObj.id,
    to: to.nodeObj.id,
    delta1: {
      x: p2x - fromCenterX,
      y: p2y - fromCenterY,
    },
    delta2: {
      x: p3x - toCenterX,
      y: p3y - toCenterY,
    },
  }
  const newSvgGroup = createSvgGroup(
    `M ${p1x} ${p1y} C ${p2x} ${p2y} ${p3x} ${p3y} ${p4x} ${p4y}`,
    `M ${arrowPoint.x1} ${arrowPoint.y1} L ${p4x} ${p4y} L ${arrowPoint.x2} ${arrowPoint.y2}`
  )

  const halfx = p1x / 8 + (p2x * 3) / 8 + (p3x * 3) / 8 + p4x / 8
  const halfy = p1y / 8 + (p2y * 3) / 8 + (p3y * 3) / 8 + p4y / 8
  const label = createText(newLinkObj.label, halfx, halfy)
  newSvgGroup.appendChild(label)

  if (isInitPaint && obj) {
    newLinkObj.id = obj.id
    // overwrite
    this.linkData[obj.id] = newLinkObj
  } else {
    // new
    newLinkObj.id = generateUUID()
    this.linkData[newLinkObj.id] = newLinkObj
    this.currentLink = newSvgGroup
  }
  newSvgGroup.linkObj = newLinkObj
  newSvgGroup.dataset.linkid = newLinkObj.id
  this.linkSvgGroup.appendChild(newSvgGroup)
  if (!isInitPaint) {
    this.showLinkController(p2x, p2y, p3x, p3y, newLinkObj, fromData, toData)
  }
}

export const removeLink = function (this: MindElixirInstance, linkSvg?: CustomSvg) {
  let link
  if (linkSvg) {
    link = linkSvg
  } else {
    link = this.currentLink
  }
  if (!link) return
  console.log(link)
  this.hideLinkController()
  const id = link.linkObj!.id
  console.log(id)
  delete this.linkData[id]
  link.remove()
  link = null
}
export const selectLink = function (this: MindElixirInstance, link: CustomSvg) {
  this.currentLink = link
  const obj = link.linkObj
  if (!obj) return
  const from = obj.from
  const to = obj.to

  const map = this.map.getBoundingClientRect()
  const pfrom = findEle(from).getBoundingClientRect()
  const pto = findEle(to).getBoundingClientRect()
  const fromCenterX = (pfrom.x + pfrom.width / 2 - map.x) / this.scaleVal
  const fromCenterY = (pfrom.y + pfrom.height / 2 - map.y) / this.scaleVal
  const toCenterX = (pto.x + pto.width / 2 - map.x) / this.scaleVal
  const toCenterY = (pto.y + pto.height / 2 - map.y) / this.scaleVal

  const fromData = {
    cx: fromCenterX,
    cy: fromCenterY,
    w: pfrom.width,
    h: pfrom.height,
  }
  const toData = {
    cx: toCenterX,
    cy: toCenterY,
    w: pto.width,
    h: pto.height,
  }

  const p2x = fromCenterX + obj.delta1.x
  const p2y = fromCenterY + obj.delta1.y
  const p3x = toCenterX + obj.delta2.x
  const p3y = toCenterY + obj.delta2.y

  this.showLinkController(p2x, p2y, p3x, p3y, obj, fromData, toData)
}
export const hideLinkController = function (this: MindElixirInstance) {
  this.linkController.style.display = 'none'
  this.P2.style.display = 'none'
  this.P3.style.display = 'none'
}
export const showLinkController = function (
  this: MindElixirInstance,
  p2x: number,
  p2y: number,
  p3x: number,
  p3y: number,
  linkItem: LinkItem,
  fromData: LinkControllerData,
  toData: LinkControllerData
) {
  this.linkController.style.display = 'initial'
  this.P2.style.display = 'initial'
  this.P3.style.display = 'initial'

  const p1 = calcP1(fromData, p2x, p2y)
  let p1x = p1.x
  let p1y = p1.y

  const p4 = calcP4(toData, p3x, p3y)
  let p4x = p4.x
  let p4y = p4.y

  this.P2.style.cssText = `top:${p2y}px;left:${p2x}px;`
  this.P3.style.cssText = `top:${p3y}px;left:${p3x}px;`
  this.line1.setAttribute('x1', p1x)
  this.line1.setAttribute('y1', p1y)
  this.line1.setAttribute('x2', p2x)
  this.line1.setAttribute('y2', p2y)
  this.line2.setAttribute('x1', p3x)
  this.line2.setAttribute('y1', p3y)
  this.line2.setAttribute('x2', p4x)
  this.line2.setAttribute('y2', p4y)

  if (this.helper1) {
    this.helper1.destory(this.map)
    this.helper2.destory(this.map)
  }

  this.helper1 = LinkDragMoveHelper.create(this.P2)
  this.helper2 = LinkDragMoveHelper.create(this.P3)

  this.helper1.init(this.map, (deltaX, deltaY) => {
    /**
     * user will control bezier with p2 & p3
     * p1 & p4 is depend on p2 & p3
     */
    p2x = p2x - deltaX / this.scaleVal
    p2y = p2y - deltaY / this.scaleVal

    const p1 = calcP1(fromData, p2x, p2y)
    p1x = p1.x
    p1y = p1.y

    this.P2.style.top = p2y + 'px'
    this.P2.style.left = p2x + 'px'
    this.currentLink?.children[0].setAttribute('d', `M ${p1x} ${p1y} C ${p2x} ${p2y} ${p3x} ${p3y} ${p4x} ${p4y}`)

    const halfx = p1x / 8 + (p2x * 3) / 8 + (p3x * 3) / 8 + p4x / 8
    const halfy = p1y / 8 + (p2y * 3) / 8 + (p3y * 3) / 8 + p4y / 8
    setAttributes(this.currentLink!.children[2], {
      x: halfx + '',
      y: halfy + '',
    })
    this.line1.setAttribute('x1', p1x)
    this.line1.setAttribute('y1', p1y)
    this.line1.setAttribute('x2', p2x)
    this.line1.setAttribute('y2', p2y)
    linkItem.delta1.x = p2x - fromData.cx
    linkItem.delta1.y = p2y - fromData.cy
  })

  this.helper2.init(this.map, (deltaX, deltaY) => {
    p3x = p3x - deltaX / this.scaleVal
    p3y = p3y - deltaY / this.scaleVal

    const p4 = calcP4(toData, p3x, p3y)
    p4x = p4.x
    p4y = p4.y
    const arrowPoint = getArrowPoints(p3x, p3y, p4x, p4y)

    this.P3.style.top = p3y + 'px'
    this.P3.style.left = p3x + 'px'
    this.currentLink?.children[0].setAttribute('d', `M ${p1x} ${p1y} C ${p2x} ${p2y} ${p3x} ${p3y} ${p4x} ${p4y}`)
    this.currentLink?.children[1].setAttribute('d', `M ${arrowPoint.x1} ${arrowPoint.y1} L ${p4x} ${p4y} L ${arrowPoint.x2} ${arrowPoint.y2}`)

    const halfx = p1x / 8 + (p2x * 3) / 8 + (p3x * 3) / 8 + p4x / 8
    const halfy = p1y / 8 + (p2y * 3) / 8 + (p3y * 3) / 8 + p4y / 8
    setAttributes(this.currentLink!.children[2], {
      x: halfx + '',
      y: halfy + '',
    })
    this.line2.setAttribute('x1', p3x)
    this.line2.setAttribute('y1', p3y)
    this.line2.setAttribute('x2', p4x)
    this.line2.setAttribute('y2', p4y)
    linkItem.delta2.x = p3x - toData.cx
    linkItem.delta2.y = p3y - toData.cy
  })
}
