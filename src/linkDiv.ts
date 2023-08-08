import { createPath, createMainPath, createLinkSvg } from './utils/svg'
import { findEle } from './utils/dom'
import { SIDE, GAP, TURNPOINT_R } from './const'
import type { Wrapper, Topic, Expander, Parent } from './types/dom'
import type { MainLineParams, SubLineParams } from './types/linkDiv'
import type { MindElixirInstance } from './types/index'

const getOffsetLT = (parent: HTMLElement, child: HTMLElement) => {
  let offsetLeft = 0
  let offsetTop = 0
  while (child && child !== parent) {
    offsetLeft += child.offsetLeft
    offsetTop += child.offsetTop
    child = child.offsetParent as HTMLElement
  }
  return { offsetLeft, offsetTop }
}
let genPath: typeof generateSubLine1 = generateSubLine1
/**
 * Link nodes with svg,
 * only link specific node if `mainNode` is present
 *
 * procedure:
 * 1. layout main node, generate main link
 * 2. generate links inside main node, if `mainNode` is present, only generate the link of the specific main node
 * 3. generate custom link
 * @param mainNode regenerate sublink of the specific main node
 */
const linkDiv = function (this: MindElixirInstance, mainNode?: Wrapper) {
  console.time('linkDiv')

  const root = this.map.querySelector('me-root') as HTMLElement
  // pin center
  this.nodes.style.top = `${10000 - this.nodes.offsetHeight / 2}px`
  this.nodes.style.left = `${10000 - root.offsetLeft - root.offsetWidth / 2}px`

  const mainNodeList = this.map.querySelectorAll('me-main > me-wrapper')
  this.lines.innerHTML = ''

  genPath = this.subLinkStyle === 2 ? generateSubLine2 : generateSubLine1

  for (let i = 0; i < mainNodeList.length; i++) {
    const el = mainNodeList[i] as Wrapper
    const tpc = el.querySelector<Topic>('me-tpc') as Topic
    const p = el.firstChild
    const direction = el.parentNode.className as 'lhs' | 'rhs'
    let x1 = root.offsetLeft + root.offsetWidth / 2
    const y1 = root.offsetTop + root.offsetHeight / 2

    let x2
    const palette = this.theme.palette
    const branchColor = tpc.nodeObj.branchColor || palette[i % palette.length]

    const { offsetLeft, offsetTop } = getOffsetLT(this.nodes, p)
    if (direction === 'lhs') {
      x2 = offsetLeft + p.offsetWidth
    } else {
      x2 = offsetLeft
    }
    const y2 = offsetTop + p.offsetHeight / 2
    // console.log(x1, y1, x2, y2)
    let mainPath = ''
    if (this.mainLinkStyle === 2) {
      if (this.direction === SIDE) {
        if (direction === 'lhs') {
          x1 = x1 - root.offsetWidth / 6
        } else {
          x1 = x1 + root.offsetWidth / 6
        }
      }
      mainPath = generateMainLine2({ x1, y1, x2, y2 })
    } else {
      const pct = Math.abs(y2 - el.parentElement.offsetTop - el.parentElement.offsetHeight / 2) / el.parentElement.offsetHeight
      const offset = (1 - pct) * 0.25 * (root.offsetWidth / 2)
      if (direction === 'lhs') {
        x1 = x1 - root.offsetWidth / 10 - offset
      } else {
        x1 = x1 + root.offsetWidth / 10 + offset
      }
      mainPath = generateMainLine1({ x1, y1, x2, y2 })
    }
    this.lines.appendChild(createMainPath(mainPath, branchColor))

    // set position of main node expander
    const expander = el.children[0].children[1]
    if (expander) {
      expander.style.top = (expander.parentNode.offsetHeight - expander.offsetHeight) / 2 + 'px'
      if (direction === 'lhs') {
        expander.style.left = -10 + 'px'
      } else {
        expander.style.right = -10 + 'px'
      }
    }

    // 3. generate link inside main node
    if (mainNode && mainNode !== el) {
      continue
    }
    if (el.childElementCount) {
      const svg = createLinkSvg('subLines')
      // svg tag name is lower case
      const svgLine = el.lastChild as SVGSVGElement
      if (svgLine.tagName === 'svg') svgLine.remove()
      el.appendChild(svg)
      const parent = el.firstChild
      const children = el.children[1].children
      const path = traverseChildren(children, parent, direction, true)
      svg.appendChild(createPath(path, branchColor))
    }
  }

  // 4. generate custom link
  this.linkSvgGroup.innerHTML = ''
  for (const prop in this.linkData) {
    const link = this.linkData[prop]
    this.createLink(findEle(link.from), findEle(link.to), true, link)
  }
  console.timeEnd('linkDiv')
}

// core function of generate subLines
const traverseChildren = function (children: Wrapper[], parent: Parent, direction: 'lhs' | 'rhs', isFirst?: boolean) {
  let path = ''
  const pT = parent.offsetTop
  const pL = parent.offsetLeft
  const pW = parent.offsetWidth
  const pH = parent.offsetHeight
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    const childT = child.firstChild
    const cT = childT.offsetTop
    const cL = childT.offsetLeft
    const cW = childT.offsetWidth
    const cH = childT.offsetHeight

    path += genPath({ pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst })

    const expander = childT.children[1]
    if (expander) {
      expander.style.bottom = -(expander.offsetHeight / 2) + 'px'
      if (direction === 'lhs') {
        expander.style.left = 10 + 'px'
      } else if (direction === 'rhs') {
        expander.style.right = 10 + 'px'
      }
      // this property is added in the layout phase
      if (!expander.expanded) continue
    } else {
      // expander not exist
      continue
    }

    const nextChildren = child.children[1].children
    if (nextChildren.length > 0) {
      path += traverseChildren(nextChildren, childT, direction)
    }
  }
  return path
}

// https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#path_commands
function generateMainLine2({ x1, y1, x2, y2 }: MainLineParams) {
  return `M ${x1} ${y1} V ${y2 > y1 ? y2 - 20 : y2 + 20} C ${x1} ${y2} ${x1} ${y2} ${x2 > x1 ? x1 + 20 : x1 - 20} ${y2} H ${x2}`
}

function generateMainLine1({ x1, y1, x2, y2 }: MainLineParams) {
  return `M ${x1} ${y1} Q ${x1} ${y2} ${x2} ${y2}`
}

function generateSubLine2({ pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst }: SubLineParams) {
  let y1: number
  if (isFirst) {
    y1 = pT + pH / 2
  } else {
    y1 = pT + pH
  }
  const y2 = cT + cH
  let x1 = 0
  let x2 = 0
  let xMiddle = 0
  if (direction === 'lhs') {
    x1 = pL + GAP
    x2 = cL
    xMiddle = cL + cW
  } else if (direction === 'rhs') {
    x1 = pL + pW - GAP
    x2 = cL + cW
    xMiddle = cL
  }

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

function generateSubLine1({ pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst }: SubLineParams) {
  let y1 = 0
  let end = 0
  if (isFirst) {
    y1 = pT + pH / 2
  } else {
    y1 = pT + pH
  }
  const y2 = cT + cH
  let x1 = 0
  let x2 = 0
  let xMid = 0
  const offset = Math.min(Math.abs(y1 - y2) / 800, 1.2) * GAP
  if (direction === 'lhs') {
    xMid = pL
    x1 = xMid + GAP
    x2 = xMid - GAP
    end = cL + GAP
    return `M ${x1} ${y1} C ${xMid} ${y1} ${xMid + offset} ${y2} ${x2} ${y2} H ${end}`
  } else {
    xMid = pL + pW
    x1 = xMid - GAP
    x2 = xMid + GAP
    end = cL + cW - GAP
    return `M ${x1} ${y1} C ${xMid} ${y1} ${xMid - offset} ${y2} ${x2} ${y2} H ${end}`
  }
}

// function generateSubLine3({ x1, y1, x2, y2, xMiddle }) {
//   return `M ${x1} ${y1} Q ${x1} ${y2} ${xMiddle} ${y2} H ${x2}`
// }

export default linkDiv
