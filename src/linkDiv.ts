import type MindElixir from './index'
import { createPath, createLinkSvg } from './utils/svg'
import { getOffsetLT } from './utils/index'
import { directionOf } from './utils/dom'
import type { Wrapper, Topic } from './types/dom'
import type { DirectionClass } from './types/index'

/** One `<path>`. `d` may hold several `M …` subpaths when they share a stroke. */
type SubPath = { d: string; color: string }

/**
 * Fold a sublink into `out`, merging it into the previous `<path>` when both
 * share a stroke. Every sublink used to be its own element, and inserting
 * thousands of fresh elements into the live document (style resolution
 * included) measured ~6 ms at 5.5k nodes — more than the string building and
 * the geometry reads combined. Subpaths render identically because `main`/`sub`
 * always return absolute commands starting with `M`.
 */
const pushSubPath = (out: SubPath[], d: string, color: string) => {
  const last = out[out.length - 1]
  if (last && last.color === color) {
    last.d += ' ' + d
  } else {
    out.push({ d, color })
  }
}

type MainBranch = {
  el: Wrapper
  tpc: Topic
  /** Path of the line joining this main node to the root. */
  d: string
  branchColor: string
  /** Freshly attached, still empty `<svg>` that will hold this branch's sublinks. */
  svg: SVGSVGElement | null
  /** `null` when this branch was skipped because `mainNode` selected another one. */
  subPaths: SubPath[] | null
}

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
const linkDiv = function (this: MindElixir, mainNode?: Wrapper) {
  console.time('linkDiv')

  const root = this.map.querySelector('.me-root') as HTMLElement
  const pT = root.offsetTop
  const pL = root.offsetLeft
  const pW = root.offsetWidth
  const pH = root.offsetHeight
  // Loop invariants: they used to be read inside the loop, costing one forced
  // layout per main node for a value that cannot change while we draw.
  const containerHeight = this.nodes.offsetHeight
  const containerWidth = this.nodes.offsetWidth

  const mainNodeList = this.map.querySelectorAll('.me-main > .me-wrapper')
  this.lines.innerHTML = ''

  // ---- Phase 0: swap in fresh sublink containers ----
  // A childless wrapper has no `me-children`, so the empty `<svg>` that lands at
  // index 1 is what the walk in phase 1 reads as "no children". Attaching them
  // up front (instead of interleaved with the measurements) preserves that
  // invariant while keeping every path append out of the read path.
  const subSvgs: (SVGSVGElement | null)[] = []
  for (let i = 0; i < mainNodeList.length; i++) {
    const el = mainNodeList[i] as Wrapper
    if (mainNode && mainNode !== el) {
      subSvgs.push(null)
      continue
    }
    const svg = createLinkSvg('subLines')
    // svg tag name is lower case
    const svgLine = el.lastChild as SVGSVGElement
    if (svgLine.tagName === 'svg') svgLine.remove()
    el.appendChild(svg)
    subSvgs.push(svg)
  }

  // ---- Phase 1: measure ----
  // Every geometry read happens here, before any path is written. Interleaving
  // them (the previous shape of this loop) invalidated the layout on each
  // `style.borderColor` / `appendChild`, so the next read forced a synchronous
  // reflow — one per node, i.e. 5,461 reflows on a 5,461 node map.
  // Deferring the writes is safe because `.lines` and `.subLines` are
  // `position: absolute`: attaching or filling them never reflows the node
  // tree, so these measurements are identical to the interleaved ones.
  const branches: MainBranch[] = []
  const palette = this.theme.palette

  for (let i = 0; i < mainNodeList.length; i++) {
    const el = mainNodeList[i] as Wrapper
    const tpc = el.querySelector<Topic>('.me-tpc') as Topic
    const { offsetLeft: cL, offsetTop: cT } = getOffsetLT(this.nodes, tpc)
    const cW = tpc.offsetWidth
    const cH = tpc.offsetHeight
    const direction = directionOf(el.parentNode as Element)

    const branchColor = tpc.nodeObj.branchColor || palette[i % palette.length]
    const d = this.generateMainBranch({
      pT,
      pL,
      pW,
      pH,
      cT,
      cL,
      cW,
      cH,
      direction,
      containerHeight,
      containerWidth,
    })

    // generate link inside main node
    let subPaths: SubPath[] | null = null
    if (subSvgs[i]) {
      subPaths = []
      collectSubPaths(this, subPaths, branchColor, el, direction, true)
    }

    branches.push({ el, tpc, svg: subSvgs[i], d, branchColor, subPaths })
  }

  // ---- Phase 2: draw ----
  // No layout reads from here on, so nothing can force another reflow.
  const mainFrag = document.createDocumentFragment()
  for (const branch of branches) {
    branch.tpc.style.borderColor = branch.branchColor
    mainFrag.appendChild(createPath(branch.d, branch.branchColor, '3'))

    if (!branch.svg || !branch.subPaths) continue

    const subFrag = document.createDocumentFragment()
    for (const subPath of branch.subPaths) {
      subFrag.appendChild(createPath(subPath.d, subPath.color, '2'))
    }
    branch.svg.appendChild(subFrag)
  }
  this.lines.appendChild(mainFrag)

  this.labelContainer.innerHTML = ''
  this.renderArrow()
  this.renderSummary()
  console.timeEnd('linkDiv')
  this.bus.fire('linkDiv')
}

/**
 * Collect the sublink paths of a subtree into `out` (measure only, no writes).
 */
const collectSubPaths = function (
  mei: MindElixir,
  out: SubPath[],
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
    pushSubPath(out, mei.generateSubBranch({ pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst }), bc)

    const expander = childP.children[1]

    if (expander) {
      // this property is added in the layout phase
      if (!expander.expanded) continue
    } else {
      // expander not exist
      continue
    }

    collectSubPaths(mei, out, bc, child, direction)
  }
}

export default linkDiv
