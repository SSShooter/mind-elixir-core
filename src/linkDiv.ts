import { createPath, createMainPath, createLinkSvg } from './utils/svg'
import { findEle } from './utils/dom'
import { SIDE, GAP, TURNPOINT_R, MAIN_NODE_HORIZONTAL_GAP, MAIN_NODE_VERTICAL_GAP } from './const'

/**
 * Link nodes with svg,
 * only link specific node if `mainNode` is present
 *
 * procedure:
 * 1. calculate position of main nodes
 * 2. layout main node, generate main link
 * 3. generate links inside main node
 * 4. generate custom link
 * @param {object} mainNode process the specific main node only
 */
export default function linkDiv(mainNode) {
  const mainNodeHorizontalGap = this.mainNodeHorizontalGap || MAIN_NODE_HORIZONTAL_GAP
  const mainNodeVerticalGap = this.mainNodeVerticalGap || MAIN_NODE_VERTICAL_GAP
  console.time('linkDiv')
  const root = this.root
  root.style.cssText = `top:${10000 - root.offsetHeight / 2}px;left:${10000 - root.offsetWidth / 2}px;`
  const mainNodeList = this.box.children
  this.lines.innerHTML = ''

  // 1. calculate position of main nodes
  let totalHeight = 0
  let shortSide: string // l or r
  let shortSideGap = 0 // balance heigt of two side
  let currentOffsetL = 0 // left side total offset
  let currentOffsetR = 0 // right side total offset
  let totalHeightL = 0
  let totalHeightR = 0
  let base: number // start offset

  if (this.direction === SIDE) {
    let countL = 0
    let countR = 0
    let totalHeightLWithoutGap = 0
    let totalHeightRWithoutGap = 0
    for (let i = 0; i < mainNodeList.length; i++) {
      const el = mainNodeList[i]
      if (el.className === 'lhs') {
        totalHeightL += el.offsetHeight + mainNodeVerticalGap
        totalHeightLWithoutGap += el.offsetHeight
        countL += 1
      } else {
        totalHeightR += el.offsetHeight + mainNodeVerticalGap
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
    for (let i = 0; i < mainNodeList.length; i++) {
      const el = mainNodeList[i]
      totalHeight += el.offsetHeight + mainNodeVerticalGap
    }
    base = 10000 - totalHeight / 2
  }

  // 2. layout main node, generate main link
  const alignRight = 10000 - root.offsetWidth / 2 - mainNodeHorizontalGap
  const alignLeft = 10000 + root.offsetWidth / 2 + mainNodeHorizontalGap
  for (let i = 0; i < mainNodeList.length; i++) {
    let x1 = 10000
    const y1 = 10000
    let x2, y2
    const el = mainNodeList[i]
    const palette = this.theme.palette
    const branchColor = el.querySelector('me-tpc').nodeObj.branchColor || palette[i % palette.length]
    const elOffsetH = el.offsetHeight
    if (el.className === 'lhs') {
      el.style.top = base + currentOffsetL + 'px'
      el.style.left = alignRight - el.offsetWidth + 'px'
      x2 = alignRight - GAP
      y2 = base + currentOffsetL + elOffsetH / 2

      if (shortSide === 'l') {
        currentOffsetL += elOffsetH + shortSideGap
      } else {
        currentOffsetL += elOffsetH + mainNodeVerticalGap
      }
    } else {
      el.style.top = base + currentOffsetR + 'px'
      el.style.left = alignLeft + 'px'
      x2 = alignLeft + GAP
      y2 = base + currentOffsetR + elOffsetH / 2

      if (shortSide === 'r') {
        currentOffsetR += elOffsetH + shortSideGap
      } else {
        currentOffsetR += elOffsetH + mainNodeVerticalGap
      }
    }

    let mainPath = ''
    if (this.mainLinkStyle === 2) {
      if (this.direction === SIDE) {
        if (el.className === 'lhs') {
          x1 = 10000 - root.offsetWidth / 6
        } else {
          x1 = 10000 + root.offsetWidth / 6
        }
      }
      mainPath = generateMainLine2({ x1, y1, x2, y2 })
    } else {
      const pct = Math.abs(y2 - 10000) / (10000 - base)
      if (el.className === 'lhs') {
        x1 = 10000 - root.offsetWidth / 10 - (1 - pct) * 0.25 * (root.offsetWidth / 2)
      } else {
        x1 = 10000 + root.offsetWidth / 10 + (1 - pct) * 0.25 * (root.offsetWidth / 2)
      }
      mainPath = generateMainLine1({ x1, y1, x2, y2 })
    }
    this.lines.appendChild(createMainPath(mainPath, branchColor))

    // set position of expander
    const expander = el.children[0].children[1]
    if (expander) {
      expander.style.top = (expander.parentNode.offsetHeight - expander.offsetHeight) / 2 + 'px'
      if (el.className === 'lhs') {
        expander.style.left = -10 + 'px'
      } else {
        expander.style.left = expander.parentNode.offsetWidth - 10 + 'px'
      }
    }

    // 3. generate link inside main node
    if (mainNode && mainNode !== mainNodeList[i]) {
      continue
    }
    if (el.childElementCount) {
      const svg = createLinkSvg('subLines')
      // svg tag name is lower case
      if (el.lastChild.tagName === 'svg') el.lastChild.remove()
      el.appendChild(svg)
      const parent = el.children[0]
      const children = el.children[1].children
      const path = traverseChildren(children, parent, true)
      svg.appendChild(createPath(path, branchColor))
    }
  }

  // 4. generate custom link
  this.linkSvgGroup.innerHTML = ''
  for (const prop in this.linkData) {
    const link = this.linkData[prop]
    if (typeof link.from === 'string') {
      this.createLink(findEle(link.from), findEle(link.to), true, link)
    } else {
      this.createLink(findEle(link.from.nodeObj.id), findEle(link.to.nodeObj.id), true, link)
    }
  }
  console.timeEnd('linkDiv')
}

// core function of generate subLines
function traverseChildren(children: HTMLCollection, parent: HTMLElement, first?: boolean): string {
  let path = ''
  const parentOT = parent.offsetTop
  const parentOL = parent.offsetLeft
  const parentOW = parent.offsetWidth
  const parentOH = parent.offsetHeight
  for (let i = 0; i < children.length; i++) {
    const child: HTMLElement = children[i] as HTMLElement
    const childT: HTMLElement = child.children[0] as HTMLElement // t tag inside the child dom
    const childTOT = childT.offsetTop
    const childTOH = childT.offsetHeight
    const cW = childT.offsetWidth
    const cL = childT.offsetLeft
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
      x2 = cL
      xMiddle = cL + cW
    } else if (direction === 'rhs') {
      x1 = parentOL + parentOW - GAP
      x2 = cL + cW
      xMiddle = cL
    }

    path += generateSubLine({ x1, y1, x2, y2, xMiddle })

    const expander = childT.children[1] as Expander
    if (expander) {
      expander.style.top = (childT.offsetHeight - expander.offsetHeight) / 2 + 'px'
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

    const nextChildren = child.children[1].children
    if (nextChildren.length > 0) {
      path += traverseChildren(nextChildren, childT)
    }
  }
  return path
}

// https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#path_commands
function generateMainLine2({ x1, y1, x2, y2 }) {
  return `M ${x1} 10000 V ${y2 > y1 ? y2 - 20 : y2 + 20} C ${x1} ${y2} ${x1} ${y2} ${x2 > x1 ? x1 + 20 : x1 - 20} ${y2} H ${x2}`
}

function generateMainLine1({ x1, y1, x2, y2 }) {
  return `M ${x1} ${y1} Q ${x1} ${y2} ${x2} ${y2}`
}

function generateSubLine({ x1, y1, x2, y2, xMiddle }) {
  if (y2 < y1 + 50 && y2 > y1 - 50) {
    // draw straight line if the distance is between +-50
    return `M ${x1} ${y1} H ${xMiddle} V ${y2} H ${x2}`
  } else if (y2 >= y1) {
    // child bottom lower than parent
    return `M ${x1} ${y1} H ${xMiddle} V ${y2 - TURNPOINT_R} A ${TURNPOINT_R} ${TURNPOINT_R} 0 0 ${x1 > x2 ? 1 : 0} ${
      x1 > x2 ? xMiddle - TURNPOINT_R : xMiddle + TURNPOINT_R
    } ${y2} H ${x2}`
  } else {
    // child bottom higher than parent
    return `M ${x1} ${y1} H ${xMiddle} V ${y2 + TURNPOINT_R} A ${TURNPOINT_R} ${TURNPOINT_R} 0 0 ${x1 > x2 ? 0 : 1} ${
      x1 > x2 ? xMiddle - TURNPOINT_R : xMiddle + TURNPOINT_R
    } ${y2} H ${x2}`
  }
}

function generateSubLine2({ x1, y1, x2, y2, xMiddle }) {
  return `M ${x1} ${y1} Q ${x1} ${y2} ${xMiddle} ${y2} H ${x2}`
}
