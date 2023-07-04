import { LEFT, RIGHT, SIDE } from '../const'
import { Children, JudgeDirection, LayoutChildren, NodeObj } from '../interface'
import { createExpander, shapeTpc } from './dom'

const $d = document

// Set main nodes' direction and invoke layoutChildren()
export const layout = function () {
  console.time('layout')
  this.root.innerHTML = ''
  this.mainNodes.innerHTML = ''
  const tpc = this.createTopic(this.nodeData)
  shapeTpc(tpc, this.nodeData) // shape root tpc
  tpc.draggable = false
  this.root.appendChild(tpc)

  const mainNodes: NodeObj[] = this.nodeData.children
  if (!mainNodes || mainNodes.length === 0) return
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
  this.layoutChildren(this.nodeData.children, this.mainNodes, this.direction)
  console.timeEnd('layout')
}

/**
 * traversal data and generate dom structure of mind map
 * @ignore
 * @param {object} data node data object
 * @param {object} container node container(optional)
 * @param {number} direction main node direction(optional)
 * @return {ChildrenElement} children element.
 */
export const layoutChildren: LayoutChildren = function (data, container, direction) {
  const children = container ? container : ($d.createElement('me-children') as Children)

  for (let i = 0; i < data.length; i++) {
    const nodeObj = data[i]
    const grp = $d.createElement('me-wrapper')
    // only main nodes have `direction`
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

    const top = this.createParent(nodeObj)
    if (nodeObj.children && nodeObj.children.length > 0) {
      top.appendChild(createExpander(nodeObj.expanded))
      grp.appendChild(top)
      if (nodeObj.expanded !== false) {
        const children = this.layoutChildren(nodeObj.children)
        grp.appendChild(children)
      }
    } else {
      grp.appendChild(top)
    }

    children.appendChild(grp)
  }

  return children
}

// Judge new added node L or R
export const judgeDirection: JudgeDirection = function (mainNode, obj) {
  if (this.direction === LEFT) {
    mainNode.className = 'lhs'
  } else if (this.direction === RIGHT) {
    mainNode.className = 'rhs'
  } else if (this.direction === SIDE) {
    const l = $d.querySelectorAll('.lhs').length
    const r = $d.querySelectorAll('.rhs').length
    if (l <= r) {
      mainNode.className = 'lhs'
      obj.direction = LEFT
    } else {
      mainNode.className = 'rhs'
      obj.direction = RIGHT
    }
  }
}
