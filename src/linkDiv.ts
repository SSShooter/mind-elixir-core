import { createPath, createLinkSvg } from './utils/svg'
import { getOffsetLT } from './utils/index'
import type { Wrapper, Topic } from './types/dom'
import { DirectionClass, type MindElixirInstance } from './types/index'

/**
 * Link nodes with svg,
 * only link specific node if `mainNode` is present
 *
 * procedure:
 * 1. generate main link
 * 2. generate links inside main node, if `mainNode` is presented, only generate the link of the specific main node
 * 3. generate custom link
 * 4. generate summary
 * @param mainNode regenerate sublink of the specific main node
 */
const linkDiv = function (this: MindElixirInstance, mainNode?: Wrapper) {
  console.time('linkDiv')

  const root = this.map.querySelector('me-root') as HTMLElement
  const pT = root.offsetTop
  const pL = root.offsetLeft
  const pW = root.offsetWidth
  const pH = root.offsetHeight

  // pin center
  this.nodes.style.top = `${10000 - this.nodes.offsetHeight / 2}px`
  this.nodes.style.left = `${10000 - pL - pW / 2}px`

  const mainNodeList = this.map.querySelectorAll('me-main > me-wrapper')
  this.lines.innerHTML = ''

  for (let i = 0; i < mainNodeList.length; i++) {
    const el = mainNodeList[i] as Wrapper
    const tpc = el.querySelector<Topic>('me-tpc') as Topic
    const { offsetLeft: cL, offsetTop: cT } = getOffsetLT(this.nodes, tpc)
    const cW = tpc.offsetWidth
    const cH = tpc.offsetHeight
    const direction = el.parentNode.className as DirectionClass

    const mainPath = this.generateMainBranch({ pT, pL, pW, pH, cT, cL, cW, cH, direction, containerHeight: this.nodes.offsetHeight })
    const palette = this.theme.palette
    const branchColor = tpc.nodeObj.branchColor || palette[i % palette.length]
    tpc.style.borderColor = branchColor
    this.lines.appendChild(createPath(mainPath, branchColor, '3'))

    // set position of main node expander
    const expander = el.children[0].children[1]
    if (expander) {
      expander.style.top = (expander.parentNode.offsetHeight - expander.offsetHeight) / 2 + 'px'
      if (direction === DirectionClass.LHS) {
        expander.style.left = -10 + 'px'
      } else {
        expander.style.right = -10 + 'px'
      }
    }

    // generate link inside main node
    if (mainNode && mainNode !== el) {
      continue
    }

    const svg = createLinkSvg('subLines')
    // svg tag name is lower case
    const svgLine = el.lastChild as SVGSVGElement
    if (svgLine.tagName === 'svg') svgLine.remove()
    el.appendChild(svg)

    traverseChildren(this, svg, branchColor, el, direction, true)
  }

  this.renderArrow()
  this.renderSummary()
  console.timeEnd('linkDiv')
  this.bus.fire('linkDiv')
}

// core function of generate subLines

const traverseChildren = function (
  mei: MindElixirInstance,
  svgContainer: SVGSVGElement,
  branchColor: string,
  wrapper: Wrapper,
  direction: DirectionClass,
  isFirst?: boolean
) {
  const parent = wrapper.firstChild
  const children = wrapper.children[1].children
  if (children.length === 0) return

  const pT = parent.offsetTop
  const pL = parent.offsetLeft
  const pW = parent.offsetWidth
  const pH = parent.offsetHeight
  for (let i = 0; i < children.length; i++) {
    const child = children[i]
    const childP = child.firstChild
    const cT = childP.offsetTop
    const cL = childP.offsetLeft
    const cW = childP.offsetWidth
    const cH = childP.offsetHeight

    const bc = childP.firstChild.nodeObj.branchColor || branchColor
    const path = mei.generateSubBranch({ pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst })
    svgContainer.appendChild(createPath(path, bc, '2'))

    const expander = childP.children[1]

    if (expander) {
      expander.style.bottom = -(expander.offsetHeight / 2) + 'px'
      if (direction === DirectionClass.LHS) {
        expander.style.left = 10 + 'px'
      } else if (direction === DirectionClass.RHS) {
        expander.style.right = 10 + 'px'
      }
      // this property is added in the layout phase
      if (!expander.expanded) continue
    } else {
      // expander not exist
      continue
    }

    traverseChildren(mei, svgContainer, bc, child, direction)
  }
}

export default linkDiv
