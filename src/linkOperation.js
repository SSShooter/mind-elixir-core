import {
  dmhelper,
  generateUUID,
  getArrowPoints,
  calcP1,
  calcP4,
} from './utils/index'
import { createSvgGroup } from './utils/svg'
// custom link
export let createLink = function (from, to, isInitPaint, obj) {
  let map = this.map.getBoundingClientRect()
  if (!from || !to) {
    return // not expand
  }
  let pfrom = from.getBoundingClientRect()
  let pto = to.getBoundingClientRect()
  let fromCenterX = (pfrom.x + pfrom.width / 2 - map.x) / this.scaleVal
  let fromCenterY = (pfrom.y + pfrom.height / 2 - map.y) / this.scaleVal
  let toCenterX = (pto.x + pto.width / 2 - map.x) / this.scaleVal
  let toCenterY = (pto.y + pto.height / 2 - map.y) / this.scaleVal

  let p2x, p2y, p3x, p3y
  if (isInitPaint) {
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

  let fromData = {
    cx: fromCenterX,
    cy: fromCenterY,
    w: pfrom.width,
    h: pfrom.height,
  }
  let toData = {
    cx: toCenterX,
    cy: toCenterY,
    w: pto.width,
    h: pto.height,
  }

  let p1 = calcP1(fromData, p2x, p2y)
  let p1x = p1.x
  let p1y = p1.y

  let p4 = calcP4(toData, p3x, p3y)
  let p4x = p4.x
  let p4y = p4.y

  let arrowPoint = getArrowPoints(p3x, p3y, p4x, p4y)

  // TODO link lable
  let halfx = p1x / 8 + (p2x * 3) / 8 + (p3x * 3) / 8 + p4x / 8
  let halfy = p1y / 8 + (p2y * 3) / 8 + (p3y * 3) / 8 + p4y / 8

  let newSvgGroup = createSvgGroup(
    `M ${p1x} ${p1y} C ${p2x} ${p2y} ${p3x} ${p3y} ${p4x} ${p4y}`,
    `M ${arrowPoint.x1} ${arrowPoint.y1} L ${p4x} ${p4y} L ${arrowPoint.x2} ${arrowPoint.y2}`
  )

  let newLinkObj
  if (isInitPaint) {
    newLinkObj = {
      id: obj.id,
      label: '',
      from,
      to,
      delta1: {
        x: p2x - fromCenterX,
        y: p2y - fromCenterY,
      },
      delta2: {
        x: p3x - toCenterX,
        y: p3y - toCenterY,
      },
    }
    // overwrite
    this.linkData[obj.id] = newLinkObj
    newSvgGroup.linkObj = newLinkObj
    newSvgGroup.dataset.linkid = obj.id
  } else {
    newLinkObj = {
      id: generateUUID(),
      label: '',
      from,
      to,
      delta1: {
        x: p2x - fromCenterX,
        y: p2y - fromCenterY,
      },
      delta2: {
        x: p3x - toCenterX,
        y: p3y - toCenterY,
      },
    }
    // new
    this.linkData[newLinkObj.id] = newLinkObj
    newSvgGroup.linkObj = newLinkObj
    newSvgGroup.dataset.linkid = newLinkObj.id
    this.currentLink = newSvgGroup
  }
  this.linkSvgGroup.appendChild(newSvgGroup)
  if (!isInitPaint)
    this.showLinkController(p2x, p2y, p3x, p3y, newLinkObj, fromData, toData)
}

export let removeLink = function (linkSvg) {
  let link
  if (linkSvg) {
    link = linkSvg
  } else {
    link = this.currentLink
  }
  if (!link) return
  console.log(link)
  this.hideLinkController()
  let id = link.linkObj.id
  console.log(id)
  delete this.linkData[id]
  link.remove()
  link = null
}
export let selectLink = function (targetElement) {
  this.currentLink = targetElement
  let obj = targetElement.linkObj
  let from = obj.from
  let to = obj.to

  let map = this.map.getBoundingClientRect()
  let pfrom = from.getBoundingClientRect()
  let pto = to.getBoundingClientRect()
  let fromCenterX = (pfrom.x + pfrom.width / 2 - map.x) / this.scaleVal
  let fromCenterY = (pfrom.y + pfrom.height / 2 - map.y) / this.scaleVal
  let toCenterX = (pto.x + pto.width / 2 - map.x) / this.scaleVal
  let toCenterY = (pto.y + pto.height / 2 - map.y) / this.scaleVal

  let fromData = {
    cx: fromCenterX,
    cy: fromCenterY,
    w: pfrom.width,
    h: pfrom.height,
  }
  let toData = {
    cx: toCenterX,
    cy: toCenterY,
    w: pto.width,
    h: pto.height,
  }

  let p2x = fromCenterX + obj.delta1.x
  let p2y = fromCenterY + obj.delta1.y
  let p3x = toCenterX + obj.delta2.x
  let p3y = toCenterY + obj.delta2.y

  this.showLinkController(p2x, p2y, p3x, p3y, obj, fromData, toData)
}
export let hideLinkController = function () {
  this.linkController.style.display = 'none'
  this.P2.style.display = 'none'
  this.P3.style.display = 'none'
}
export let showLinkController = function (
  p2x,
  p2y,
  p3x,
  p3y,
  linkObj,
  fromData,
  toData
) {
  this.linkController.style.display = 'initial'
  this.P2.style.display = 'initial'
  this.P3.style.display = 'initial'

  let p1 = calcP1(fromData, p2x, p2y)
  let p1x = p1.x
  let p1y = p1.y

  let p4 = calcP4(toData, p3x, p3y)
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

  this.helper1 = new dmhelper(this.P2)
  this.helper2 = new dmhelper(this.P3)

  this.helper1.init(this.map, (deltaX, deltaY) => {
    /**
     * user will control bezier with p2 & p3
     * p1 & p4 is depend on p2 & p3
     */
    p2x = p2x - deltaX / this.scaleVal
    p2y = p2y - deltaY / this.scaleVal

    let p1 = calcP1(fromData, p2x, p2y)
    p1x = p1.x
    p1y = p1.y

    this.P2.style.top = p2y + 'px'
    this.P2.style.left = p2x + 'px'
    this.currentLink.children[0].setAttribute(
      'd',
      `M ${p1x} ${p1y} C ${p2x} ${p2y} ${p3x} ${p3y} ${p4x} ${p4y}`
    )
    this.line1.setAttribute('x1', p1x)
    this.line1.setAttribute('y1', p1y)
    this.line1.setAttribute('x2', p2x)
    this.line1.setAttribute('y2', p2y)
    linkObj.delta1.x = p2x - fromData.cx
    linkObj.delta1.y = p2y - fromData.cy
  })

  this.helper2.init(this.map, (deltaX, deltaY) => {
    p3x = p3x - deltaX / this.scaleVal
    p3y = p3y - deltaY / this.scaleVal

    let p4 = calcP4(toData, p3x, p3y)
    p4x = p4.x
    p4y = p4.y
    let arrowPoint = getArrowPoints(p3x, p3y, p4x, p4y)

    this.P3.style.top = p3y + 'px'
    this.P3.style.left = p3x + 'px'
    this.currentLink.children[0].setAttribute(
      'd',
      `M ${p1x} ${p1y} C ${p2x} ${p2y} ${p3x} ${p3y} ${p4x} ${p4y}`
    )
    this.currentLink.children[1].setAttribute(
      'd',
      `M ${arrowPoint.x1} ${arrowPoint.y1} L ${p4x} ${p4y} L ${arrowPoint.x2} ${arrowPoint.y2}`
    )
    this.line2.setAttribute('x1', p3x)
    this.line2.setAttribute('y1', p3y)
    this.line2.setAttribute('x2', p4x)
    this.line2.setAttribute('y2', p4y)
    linkObj.delta2.x = p3x - toData.cx
    linkObj.delta2.y = p3y - toData.cy
  })
}
