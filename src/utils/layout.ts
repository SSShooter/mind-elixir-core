import type MindElixir from '../index'
import { LEFT, RIGHT, SIDE, DOWN } from '../const'
import type { Children } from '../types/dom'
import { DirectionClass, type NodeObj } from '../types/index'
import { createMain, shapeTpc } from './dom'

// Set main nodes' direction and invoke layoutChildren()
export const layout = function (this: MindElixir) {
  console.time('layout')
  this.nodes.innerHTML = ''
  // toggle the top-down layout class on the container
  this.nodes.className = this.direction === DOWN ? 'down' : ''

  const tpc = this.createTopic(this.nodeData)
  shapeTpc.call(this, tpc, this.nodeData) // shape root tpc
  tpc.draggable = false
  const root = document.createElement('me-root')
  root.appendChild(tpc)

  const mainNodes = this.nodeData.children || []
  if (this.direction === SIDE) {
    // initiate direction of main nodes
    let lcount = 0
    let rcount = 0
    mainNodes.map(node => {
      if (node.direction === LEFT) {
        lcount += 1
      } else if (node.direction === RIGHT) {
        rcount += 1
      } else {
        if (lcount <= rcount) {
          node.direction = LEFT
          lcount += 1
        } else {
          node.direction = RIGHT
          rcount += 1
        }
      }
    })
  }
  layoutMainNode(this, mainNodes, root)
  console.timeEnd('layout')
}

const layoutMainNode = function (mei: MindElixir, data: NodeObj[], root: HTMLElement) {
  // Top-down layout: root on top, all main nodes in a single container below
  if (mei.direction === DOWN) {
    const downPart = createMain(DirectionClass.DOWN)
    for (let i = 0; i < data.length; i++) {
      const { grp: w } = mei.createWrapper(data[i])
      downPart.appendChild(w)
    }
    mei.nodes.appendChild(root)
    mei.nodes.appendChild(downPart)

    mei.nodes.appendChild(mei.lines)
    mei.nodes.appendChild(mei.labelContainer)
    return
  }

  const leftPart = createMain(DirectionClass.LHS)
  const rightPart = createMain(DirectionClass.RHS)
  for (let i = 0; i < data.length; i++) {
    const nodeObj = data[i]
    const { grp: w } = mei.createWrapper(nodeObj)
    if (mei.direction === SIDE) {
      if (nodeObj.direction === LEFT) {
        leftPart.appendChild(w)
      } else {
        rightPart.appendChild(w)
      }
    } else if (mei.direction === LEFT) {
      leftPart.appendChild(w)
    } else {
      rightPart.appendChild(w)
    }
  }

  mei.nodes.appendChild(leftPart)
  mei.nodes.appendChild(root)
  mei.nodes.appendChild(rightPart)

  mei.nodes.appendChild(mei.lines)
  mei.nodes.appendChild(mei.labelContainer)
}

export const layoutChildren = function (mei: MindElixir, data: NodeObj[]) {
  const chldr = document.createElement('div') as unknown as Children
  chldr.className = 'me-children'
  for (let i = 0; i < data.length; i++) {
    const nodeObj = data[i]
    const { grp } = mei.createWrapper(nodeObj)
    chldr.appendChild(grp)
  }
  return chldr
}
