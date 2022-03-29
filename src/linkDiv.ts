import { createPath, createMainPath, createLinkSvg } from './utils/svg'
import { findEle, Expander } from './utils/dom'
import {
  SIDE,
  GAP,
  TURNPOINT_R,
  PRIMARY_NODE_HORIZONTAL_GAP,
  PRIMARY_NODE_VERTICAL_GAP,
} from './const'

/**
 * Link nodes with svg,
 * only link specific node if `primaryNode` is present
 *
 * procedure:
 * 1. calculate position of primary nodes
 * 2. layout primary node, generate primary link
 * 3. generate links inside primary node
 * 4. generate custom link
 * @param {object} primaryNode process the specific primary node only
 */
export default function linkDiv(primaryNode) {
  var primaryNodeHorizontalGap = this.primaryNodeHorizontalGap || PRIMARY_NODE_HORIZONTAL_GAP
  var primaryNodeVerticalGap = this.primaryNodeVerticalGap || PRIMARY_NODE_VERTICAL_GAP
  console.time('linkDiv')
  const root = this.root
  root.style.cssText = `top:${10000 - root.offsetHeight / 2}px;left:${10000 - root.offsetWidth / 2}px;`
  const primaryNodeList = this.box.children
  this.svg2nd.innerHTML = ''

  // 1. calculate position of primary nodes
  let totalHeight = 0
  let shortSide: string // l or r
  let shortSideGap = 0 // balance heigt of two side
  let currentOffsetL = 0 // left side total offset
  let currentOffsetR = 0 // right side total offset
  let totalHeightL = 0
  let totalHeightR = 0
  let base: number

  if (this.direction === SIDE) {
    let countL = 0
    let countR = 0
    let totalHeightLWithoutGap = 0
    let totalHeightRWithoutGap = 0
    for (let i = 0; i < primaryNodeList.length; i++) {
      const el = primaryNodeList[i]
      if (el.className === 'lhs') {
        totalHeightL += el.offsetHeight + primaryNodeVerticalGap
        totalHeightLWithoutGap += el.offsetHeight
        countL += 1
      } else {
        totalHeightR += el.offsetHeight + primaryNodeVerticalGap
        totalHeightRWithoutGap += el.offsetHeight
        countR += 1
      }
    }
    if (totalHeightL > totalHeightR) {
      base = 10000 - Math.max(totalHeightL) / 2
      shortSide = 'r'
      shortSideGap = (totalHeightL - totalHeightRWithoutGap) / (countR - 1)
    } else {
      base = 10000 - Math.max(totalHeightR) / 2
      shortSide = 'l'
      shortSideGap = (totalHeightR - totalHeightLWithoutGap) / (countL - 1)
    }
  } else {
    for (let i = 0; i < primaryNodeList.length; i++) {
      const el = primaryNodeList[i]
      totalHeight += el.offsetHeight + primaryNodeVerticalGap
    }
    base = 10000 - totalHeight / 2
  }

  // 2. layout primary node, generate primary link
  let primaryPath = ''
  const alignRight = 10000 - root.offsetWidth / 2 - primaryNodeHorizontalGap
  const alignLeft = 10000 + root.offsetWidth / 2 + primaryNodeHorizontalGap
  for (let i = 0; i < primaryNodeList.length; i++) {
    let x2, y2
    const el = primaryNodeList[i]
    const elOffsetH = el.offsetHeight
    if (el.className === 'lhs') {
      el.style.top = base + currentOffsetL + 'px'
      el.style.left = alignRight - el.offsetWidth + 'px'
      x2 = alignRight - 15 // padding
      y2 = base + currentOffsetL + elOffsetH / 2

      // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#path_commands
      let LEFT = 10000
      if (this.primaryLinkStyle === 2) {
        if (this.direction === SIDE) {
          LEFT = 10000 - root.offsetWidth / 6
        }
        if (y2 < 10000) {
          primaryPath += `M ${LEFT} 10000 V ${y2 + 20} C ${LEFT} ${y2} ${LEFT} ${y2} ${LEFT - 20} ${y2} H ${x2}`
        } else {
          primaryPath += `M ${LEFT} 10000 V ${y2 - 20} C ${LEFT} ${y2} ${LEFT} ${y2} ${LEFT - 20} ${y2} H ${x2}`
        }
      } else {
        primaryPath += `M 10000 10000 C 10000 10000 ${10000 + 2 * primaryNodeHorizontalGap * 0.03} ${y2} ${x2} ${y2}`
      }

      if (shortSide === 'l') {
        currentOffsetL += elOffsetH + shortSideGap
      } else {
        currentOffsetL += elOffsetH + primaryNodeVerticalGap
      }
    } else {
      el.style.top = base + currentOffsetR + 'px'
      el.style.left = alignLeft + 'px'
      x2 = alignLeft + 15 // padding
      y2 = base + currentOffsetR + elOffsetH / 2

      let LEFT = 10000
      if (this.primaryLinkStyle === 2) {
        if (this.direction === SIDE) {
          LEFT = 10000 + root.offsetWidth / 6
        }
        if (y2 < 10000) {
          primaryPath += `M ${LEFT} 10000 V ${y2 + 20} C ${LEFT} ${y2} ${LEFT} ${y2} ${LEFT + 20} ${y2} H ${x2}`
        } else {
          primaryPath += `M ${LEFT} 10000 V ${y2 - 20} C ${LEFT} ${y2} ${LEFT} ${y2} ${LEFT + 20} ${y2} H ${x2}`
        }
      } else {
        primaryPath += `M 10000 10000 C 10000 10000 ${10000 + 2 * primaryNodeHorizontalGap * 0.03} ${y2} ${x2} ${y2}`
      }
      if (shortSide === 'r') {
        currentOffsetR += elOffsetH + shortSideGap
      } else {
        currentOffsetR += elOffsetH + primaryNodeVerticalGap
      }
    }
    // set position of expander
    const expander = el.children[0].children[1]
    if (expander) {
      expander.style.top =
        (expander.parentNode.offsetHeight - expander.offsetHeight) / 2 + 'px'
      if (el.className === 'lhs') {
        expander.style.left = -10 + 'px'
      } else {
        expander.style.left = expander.parentNode.offsetWidth - 10 + 'px'
      }
    }
  }
  this.svg2nd.appendChild(createMainPath(primaryPath))

  // 3. generate link inside primary node
  for (let i = 0; i < primaryNodeList.length; i++) {
    const el = primaryNodeList[i]
    if (primaryNode && primaryNode !== primaryNodeList[i]) {
      continue
    }
    if (el.childElementCount) {
      const svg = createLinkSvg('svg3rd')
      // svg tag name is lower case
      if (el.lastChild.tagName === 'svg') el.lastChild.remove()
      el.appendChild(svg)
      const parent = el.children[0]
      const children = el.children[1].children
      path = ''
      loopChildren(children, parent, true)
      svg.appendChild(createPath(path))
    }
  }

  // 4. generate custom link
  this.linkSvgGroup.innerHTML = ''
  for (const prop in this.linkData) {
    const link = this.linkData[prop]
    if (typeof link.from === 'string') {
      this.createLink(findEle(link.from), findEle(link.to), true, link)
    } else {
      this.createLink(
        findEle(link.from.nodeObj.id),
        findEle(link.to.nodeObj.id),
        true,
        link
      )
    }
  }
  console.timeEnd('linkDiv')
}

let path = ''
function loopChildren(children: HTMLCollection, parent: HTMLElement, first?: boolean) {
  const parentOT = parent.offsetTop
  const parentOL = parent.offsetLeft
  const parentOW = parent.offsetWidth
  const parentOH = parent.offsetHeight
  for (let i = 0; i < children.length; i++) {
    const child: HTMLElement = children[i] as HTMLElement
    const childT: HTMLElement = child.children[0] as HTMLElement // t tag inside the child dom
    const childTOT = childT.offsetTop
    const childTOH = childT.offsetHeight
    let y1: number
    if (first) {
      y1 = parentOT + parentOH / 2
    } else {
      y1 = parentOT + parentOH
    }
    const y2 = childTOT + childTOH
    let x1: number, x2: number, xMiddle: number
    const direction = child.offsetParent.className
    if (direction === 'lhs') {
      x1 = parentOL + GAP
      xMiddle = parentOL
      x2 = parentOL - childT.offsetWidth

      if (
        childTOT + childTOH < parentOT + parentOH / 2 + 50 &&
        childTOT + childTOH > parentOT + parentOH / 2 - 50
      ) {
        // 相差+-50内直接直线
        path += `M ${x1} ${y1} H ${xMiddle} V ${y2} H ${x2}`
      } else if (childTOT + childTOH >= parentOT + parentOH / 2) {
        // 子底部低于父中点
        path += `M ${x1} ${y1} H ${xMiddle} V ${y2 - TURNPOINT_R} A ${TURNPOINT_R} ${TURNPOINT_R} 0 0 1 ${xMiddle - TURNPOINT_R} ${y2} H ${x2}`
      } else {
        // 子底部高于父中点
        path += `M ${x1} ${y1} H ${xMiddle} V ${y2 + TURNPOINT_R} A ${TURNPOINT_R} ${TURNPOINT_R} 0 0 0 ${xMiddle - TURNPOINT_R} ${y2} H ${x2}`
      }
    } else if (direction === 'rhs') {
      x1 = parentOL + parentOW - GAP
      xMiddle = parentOL + parentOW
      x2 = parentOL + parentOW + childT.offsetWidth

      if (
        childTOT + childTOH < parentOT + parentOH / 2 + 50 &&
        childTOT + childTOH > parentOT + parentOH / 2 - 50
      ) {
        path += `M ${x1} ${y1} H ${xMiddle} V ${y2} H ${x2}`
      } else if (childTOT + childTOH >= parentOT + parentOH / 2) {
        path += `M ${x1} ${y1} H ${xMiddle} V ${y2 - TURNPOINT_R} A ${TURNPOINT_R} ${TURNPOINT_R} 0 0 0 ${xMiddle + TURNPOINT_R} ${y2} H ${x2}`
      } else {
        path += `M ${x1} ${y1} H ${xMiddle} V ${y2 + TURNPOINT_R} A ${TURNPOINT_R} ${TURNPOINT_R} 0 0 1 ${xMiddle + TURNPOINT_R} ${y2} H ${x2}`
      }
    }

    const expander = childT.children[1] as Expander
    if (expander) {
      expander.style.top =
        (childT.offsetHeight - expander.offsetHeight) / 2 + 'px'
      if (direction === 'lhs') {
        expander.style.left = -10 + 'px'
      } else if (direction === 'rhs') {
        expander.style.left = childT.offsetWidth - 10 + 'px'
      }
      // this property is added in the layout phase
      if (!expander.expanded) continue
    } else {
      // expander not exist
      continue
    }
    // traversal
    const nextChildren = child.children[1].children
    if (nextChildren.length > 0) loopChildren(nextChildren, childT)
  }
}
