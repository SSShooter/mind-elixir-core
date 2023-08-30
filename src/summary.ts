import type { MindElixirInstance, Topic } from '.'
import { getOffsetLT } from './utils'
import { findEle } from './utils/dom'

const calcRange = function (currentNodes: Topic[]) {
  let maxLen = 0
  const parentChains = currentNodes.map(item => {
    let node = item.nodeObj
    const parentChain = []
    while (node.parent) {
      const parent = node.parent
      const siblings = parent.children
      const index = siblings?.indexOf(node)
      node = parent
      parentChain.unshift({ node, index })
    }
    if (parentChain.length > maxLen) maxLen = parentChain.length
    return parentChain
  })
  let index = 0
  findMcp: for (; index < maxLen; index++) {
    const base = parentChains[0][index]?.node
    console.log(base)
    for (let i = 1; i < parentChains.length; i++) {
      const parentChain = parentChains[i]
      if (parentChain[index]?.node !== base) {
        break findMcp
      }
    }
  }
  // minimum common parent
  const range = parentChains.map(chain => chain[index - 1].index).sort()
  console.log(parentChains, 'parentChains')
  const min = range[0] || 0
  const max = range[range.length - 1] || 0
  const parent = parentChains[0][index - 1].node
  return {
    min,
    max,
    parent,
  }
}

const createPath = function (d: string, color?: string) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', d)
  path.setAttribute('stroke', color || '#666')
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke-width', '3')
  return path
}

const drawSummary = function (this: MindElixirInstance) {
  if (!this.currentNodes) return
  const { min, max, parent } = calcRange(this.currentNodes)
  console.log(parent, 'parent')
  console.log(min, 'min')
  console.log(max, 'max')
  const parentTpc = this.nodes
  const start = findEle(parent.children![min].id).parentElement.parentElement // TODO select wrapper
  const end = findEle(parent.children![max].id).parentElement.parentElement
  const { offsetLeft: sL, offsetTop: sT } = getOffsetLT(parentTpc, start)
  const { offsetLeft: eL, offsetTop: eT } = getOffsetLT(parentTpc, end)
  console.log({ sL, sT, eL, eT })
  const left = Math.min(sL, eL)
  const path = createPath(`M ${left} ${sT + start.offsetHeight / 2} L ${left} ${eT + end.offsetHeight / 2}`)
  this.lines.appendChild(path)
  // this.nodes.appendChild()
}

export default drawSummary
