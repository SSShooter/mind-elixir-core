import { LEFT, RIGHT, SIDE } from '../const'
import { createExpander, shapeTpc } from './dom'
import { NodeObj } from '../index'

const $d = document

// Set primary nodes' direction and invoke createChildren()
export function layout() {
  console.time('layout')
  this.root.innerHTML = ''
  this.box.innerHTML = ''
  const tpc = this.createTopic(this.nodeData)
  shapeTpc(tpc, this.nodeData) // shape root tpc
  tpc.draggable = false
  this.root.appendChild(tpc)

  const primaryNodes: NodeObj[] = this.nodeData.children
  if (!primaryNodes || primaryNodes.length === 0) return
  if (this.direction === SIDE) {
    // initiate direction of primary nodes
    let lcount = 0
    let rcount = 0
    primaryNodes.map(node => {
      if (node.direction === undefined) {
        if (lcount <= rcount) {
          node.direction = LEFT
          lcount += 1
        } else {
          node.direction = RIGHT
          rcount += 1
        }
      } else {
        if (node.direction === LEFT) {
          lcount += 1
        } else {
          rcount += 1
        }
      }
    })
  }
  this.createChildren(this.nodeData.children, this.box, this.direction)
  console.timeEnd('layout')
}

/**
 * traversal data and generate dom structure of mind map
 * @ignore
 * @param {object} data node data object
 * @param {object} container node container(mostly primary node)
 * @param {number} direction primary node direction
 * @return {ChildrenElement} children element.
 */
export function createChildren(data: NodeObj[], container?: HTMLElement, direction?) {
  let chldr: HTMLElement
  if (container) {
    chldr = container
  } else {
    chldr = $d.createElement('children')
  }
  for (let i = 0; i < data.length; i++) {
    const nodeObj = data[i]
    const grp = $d.createElement('GRP')
    if (direction === LEFT) {
      grp.className = 'lhs'
    } else if (direction === RIGHT) {
      grp.className = 'rhs'
    } else if (direction === SIDE) {
      if (nodeObj.direction === LEFT) {
        grp.className = 'lhs'
      } else if (nodeObj.direction === RIGHT) {
        grp.className = 'rhs'
      }
    }
    const top = this.createTop(nodeObj)
    if (nodeObj.children && nodeObj.children.length > 0) {
      top.appendChild(createExpander(nodeObj.expanded))
      grp.appendChild(top)
      if (nodeObj.expanded !== false) {
        const children = this.createChildren(nodeObj.children)
        grp.appendChild(children)
      }
    } else {
      grp.appendChild(top)
    }
    chldr.appendChild(grp)
  }
  return chldr
}
