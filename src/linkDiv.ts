import { createPath, createLinkSvg } from './utils/svg'
import { getOffsetLT } from './utils/index'
import type { Wrapper, Topic, Parent } from './types/dom'
import type { MindElixirInstance } from './types/index'

/**
 * Link nodes with svg,
 * only link specific node if `mainNode` is present
 *
 * procedure:
 * 1. generate main link
 * 2. generate links inside main node, if `mainNode` is present, only generate the link of the specific main node
 * 3. generate custom link
 * 4. generate summary
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

  for (let i = 0; i < mainNodeList.length; i++) {
    const el = mainNodeList[i] as Wrapper
    const tpc = el.querySelector<Topic>('me-tpc') as Topic
    const p = el.firstChild
    const direction = el.parentNode.className as 'lhs' | 'rhs'
    let x1 = root.offsetLeft + root.offsetWidth / 2
    const y1 = root.offsetTop + root.offsetHeight / 2

    let x2

    const { offsetLeft, offsetTop } = getOffsetLT(this.nodes, p)
    if (direction === 'lhs') {
      x2 = offsetLeft + p.offsetWidth
    } else {
      x2 = offsetLeft
    }
    const y2 = offsetTop + p.offsetHeight / 2

    const pct = Math.abs(y2 - el.parentElement.offsetTop - el.parentElement.offsetHeight / 2) / el.parentElement.offsetHeight
    const offset = (1 - pct) * 0.25 * (root.offsetWidth / 2)
    if (direction === 'lhs') {
      x1 = x1 - root.offsetWidth / 10 - offset
    } else {
      x1 = x1 + root.offsetWidth / 10 + offset
    }
    const mainPath = this.generateMainBranch({ x1, y1, x2, y2, direction })
    const palette = this.theme.palette
    const branchColor = tpc.nodeObj.branchColor || palette[i % palette.length]
    tpc.style.borderColor = branchColor
    this.lines.appendChild(createPath(mainPath, branchColor, '3'))

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

    // generate link inside main node
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
      traverseChildren(this, svg, branchColor, children, parent, direction, true)
      // svg.appendChild(createPath(path, branchColor, '2'))
    }
  }

  this.renderArrow()
  this.renderSummary()
  console.timeEnd('linkDiv')
}

// core function of generate subLines
const traverseChildren = function (
  mei: MindElixirInstance,
  svgContainer: SVGSVGElement,
  branchColor: string,
  children: Wrapper[],
  parent: Parent,
  direction: 'lhs' | 'rhs',
  isFirst?: boolean
) {
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

    const path = mei.generateSubBranch({ pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst })
    svgContainer.appendChild(createPath(path, branchColor, '2'))
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
      traverseChildren(mei, svgContainer, branchColor, nextChildren, childT, direction)
    }
  }
}

export default linkDiv
