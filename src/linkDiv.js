import { createPath, createMainPath, createLinkSvg } from './utils/svg'
import { findEle } from './utils/dom'
import {
  SIDE,
  GAP,
  TURNPOINT_R,
  PRIMARY_NODE_HORIZONTAL_GAP,
  PRIMARY_NODE_VERTICAL_GAP,
} from './const'

/**
 * functionality:
 * 1. calculate position of primary nodes
 * 2. layout primary node, generate primary link
 * 3. generate link inside primary node
 * 4. generate custom link
 * @param {object} primaryNode process the specific primary node only
 */
export default function linkDiv(primaryNode) {
  var primaryNodeHorizontalGap = this.primaryNodeHorizontalGap || PRIMARY_NODE_HORIZONTAL_GAP
  var primaryNodeVerticalGap = this.primaryNodeVerticalGap || PRIMARY_NODE_VERTICAL_GAP
  console.time('linkDiv')
  let root = this.root
  root.style.cssText = `top:${10000 - root.offsetHeight / 2}px;left:${
    10000 - root.offsetWidth / 2
  }px;`
  let primaryNodeList = this.box.children
  this.svg2nd.innerHTML = ''

  // 1. calculate position of primary nodes
  let totalHeight = 0
  let shortSide // side with smaller height
  let shortSideGap = 0 // balance heigt of two side
  let currentOffsetL = 0 // left side total offset
  let currentOffsetR = 0 // right side total offset
  let totalHeightL = 0
  let totalHeightR = 0
  let base

  if (this.direction === SIDE) {
    let countL = 0
    let countR = 0
    let totalHeightLWithoutGap = 0
    let totalHeightRWithoutGap = 0
    for (let i = 0; i < primaryNodeList.length; i++) {
      let el = primaryNodeList[i]
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
      let el = primaryNodeList[i]
      totalHeight += el.offsetHeight + primaryNodeVerticalGap
    }
    base = 10000 - totalHeight / 2
  }

  // 2. layout primary node, generate primary link
  let path = ''
  for (let i = 0; i < primaryNodeList.length; i++) {
    let x2, y2
    let el = primaryNodeList[i]
    let elOffsetH = el.offsetHeight
    let Cy
    if (el.className === 'lhs') {
      el.style.top = base + currentOffsetL + 'px'
      el.style.left =
        10000 -
        root.offsetWidth / 2 -
        primaryNodeHorizontalGap -
        el.offsetWidth +
        'px'
      x2 = 10000 - root.offsetWidth / 2 - primaryNodeHorizontalGap - 15 // padding
      y2 = base + currentOffsetL + elOffsetH / 2

      let LEFT = 10000
      if (this.primaryLinkStyle === 2) {
        if(this.direction === SIDE){
          LEFT = 10000 - root.offsetWidth / 6
        }
        if (y2 < 10000)
          path += `M ${LEFT} 10000
         L ${LEFT} ${y2 + 20} 
        C ${LEFT} ${y2} ${LEFT} ${y2} ${LEFT - 20} ${y2} 
          L ${x2} ${y2}`
        else
          path += `M ${LEFT} 10000
         L ${LEFT} ${y2 - 20} 
        C ${LEFT} ${y2} ${LEFT} ${y2} ${LEFT - 20} ${y2} 
          L ${x2} ${y2}`
      } else {
        path += `M ${10000} ${10000} C 10000 10000 ${
          10000 + 2 * primaryNodeHorizontalGap * 0.03
        } ${y2} ${x2} ${y2}`
      }

      if (shortSide === 'l') {
        currentOffsetL += elOffsetH + shortSideGap
      } else {
        currentOffsetL += elOffsetH + primaryNodeVerticalGap
      }
    } else {
      el.style.top = base + currentOffsetR + 'px'
      el.style.left =
        10000 + root.offsetWidth / 2 + primaryNodeHorizontalGap + 'px'
      x2 = 10000 + root.offsetWidth / 2 + primaryNodeHorizontalGap + 15 // padding
      y2 = base + currentOffsetR + elOffsetH / 2

      let LEFT = 10000
      if (this.primaryLinkStyle === 2) {
        if(this.direction === SIDE){
          LEFT = 10000 + root.offsetWidth / 6
        }
        if (y2 < 10000)
          path += `M ${LEFT} 10000
         L ${LEFT} ${y2 + 20} 
        C ${LEFT} ${y2} ${LEFT} ${y2} ${LEFT + 20} ${y2} 
          L ${x2} ${y2}`
        else
          path += `M ${LEFT} 10000
         L ${LEFT} ${y2 - 20} 
        C ${LEFT} ${y2} ${LEFT} ${y2} ${LEFT + 20} ${y2} 
          L ${x2} ${y2}`
      } else {
        path += `M ${10000} ${10000} C 10000 10000 ${
          10000 + 2 * primaryNodeHorizontalGap * 0.03
        } ${y2} ${x2} ${y2}`
      }
      if (shortSide === 'r') {
        currentOffsetR += elOffsetH + shortSideGap
      } else {
        currentOffsetR += elOffsetH + primaryNodeVerticalGap
      }
    }
    // set position of expander
    let expander = el.children[0].children[1]
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
  this.svg2nd.appendChild(createMainPath(path))

  // 3. generate link inside primary node
  for (let i = 0; i < primaryNodeList.length; i++) {
    let el = primaryNodeList[i]
    if (primaryNode && primaryNode !== primaryNodeList[i]) {
      continue
    }
    if (el.childElementCount) {
      let svg = createLinkSvg('svg3rd')
      // svg tag name is lower case
      if (el.lastChild.tagName === 'svg') el.lastChild.remove()
      el.appendChild(svg)
      let parent = el.children[0]
      let children = el.children[1].children
      let path = ''
      loopChildren(children, parent, true)
      svg.appendChild(createPath(path))
      function loopChildren(children, parent, first) {
        // parent node of the child dom
        let parentOT = parent.offsetTop
        let parentOL = parent.offsetLeft
        let parentOW = parent.offsetWidth
        let parentOH = parent.offsetHeight
        for (let i = 0; i < children.length; i++) {
          let child = children[i]
          let childT = child.children[0] // t tag inside the child dom
          let childTOT = childT.offsetTop
          let childTOH = childT.offsetHeight
          let y1
          if (first) {
            y1 = parentOT + parentOH / 2
          } else {
            y1 = parentOT + parentOH
          }
          let y2 = childTOT + childTOH
          let x1, x2, xMiddle
          let direction = child.offsetParent.className
          if (direction === 'lhs') {
            x1 = parentOL + GAP
            xMiddle = parentOL
            x2 = parentOL - childT.offsetWidth
            // console.log('x1,y1,x2,y2,child',x1,y1,x2,y2,child)
            if (
              childTOT + childTOH < parentOT + parentOH / 2 + 50 &&
              childTOT + childTOH > parentOT + parentOH / 2 - 50
            ) {
              // 相差+-50内直接直线
              path += `M ${x1} ${y1} L ${xMiddle} ${y1} L ${xMiddle} ${y2} L ${x2} ${y2}`
            } else if (childTOT + childTOH >= parentOT + parentOH / 2) {
              // 子底部高于父中点
              path += `M ${x1} ${y1} 
            L ${xMiddle} ${y1} 
            L ${xMiddle} ${y2 - TURNPOINT_R} 
            A ${TURNPOINT_R} ${TURNPOINT_R} 0 0 1 
            ${xMiddle - TURNPOINT_R},${y2} 
            L ${x2} ${y2}`
            } else {
              // 子底部低于父中点
              path += `M ${x1} ${y1} 
            L ${xMiddle} ${y1} 
            L ${xMiddle} ${y2 + TURNPOINT_R} 
            A ${TURNPOINT_R} ${TURNPOINT_R} 0 0 0 
            ${xMiddle - TURNPOINT_R},${y2} 
            L ${x2} ${y2}`
            }
          } else if (direction === 'rhs') {
            x1 = parentOL + parentOW - GAP
            xMiddle = parentOL + parentOW
            x2 = parentOL + parentOW + childT.offsetWidth

            if (
              childTOT + childTOH < parentOT + parentOH / 2 + 50 &&
              childTOT + childTOH > parentOT + parentOH / 2 - 50
            ) {
              path += `M ${x1} ${y1} L ${xMiddle} ${y1} L ${xMiddle} ${y2} L ${x2} ${y2}`
            } else if (childTOT + childTOH >= parentOT + parentOH / 2) {
              path += `M ${x1} ${y1} 
            L ${xMiddle} ${y1} 
            L ${xMiddle} ${y2 - TURNPOINT_R} 
            A ${TURNPOINT_R} ${TURNPOINT_R} 0 0 0 ${
                xMiddle + TURNPOINT_R
              },${y2} 
            L ${x2} ${y2}`
            } else {
              path += `M ${x1} ${y1} 
            L ${xMiddle} ${y1} 
            L ${xMiddle} ${y2 + TURNPOINT_R} 
            A ${TURNPOINT_R} ${TURNPOINT_R} 0 0 1 ${
                xMiddle + TURNPOINT_R
              },${y2} 
            L ${x2} ${y2}`
            }
          }

          let expander = childT.children[1]
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
          let nextChildren = child.children[1].children
          if (nextChildren.length > 0) loopChildren(nextChildren, childT)
        }
      }
    }
  }

  // 4. generate custom link
  this.linkSvgGroup.innerHTML = ''
  for (let prop in this.linkData) {
    let link = this.linkData[prop]
    if (typeof link.from === 'string')
      this.createLink(findEle(link.from), findEle(link.to), true, link)
    else
      this.createLink(
        findEle(link.from.nodeObj.id),
        findEle(link.to.nodeObj.id),
        true,
        link
      )
  }
  console.timeEnd('linkDiv')
}
