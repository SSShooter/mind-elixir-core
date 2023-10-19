import { fillParent } from '.'
import { LEFT, RIGHT, SIDE } from '../const'
import type { MindElixirInstance, NodeObj } from '../types'
import type { Topic, Wrapper } from '../types/dom'
import { findEle, createExpander } from './dom'

// Judge new added node L or R
export const judgeDirection = function (direction: number, obj: NodeObj) {
  if (direction === LEFT) {
    return LEFT
  } else if (direction === RIGHT) {
    return RIGHT
  } else if (direction === SIDE) {
    const l = document.querySelector('.lhs')?.childElementCount || 0
    const r = document.querySelector('.rhs')?.childElementCount || 0
    if (l <= r) {
      obj.direction = LEFT
      return LEFT
    } else {
      obj.direction = RIGHT
      return RIGHT
    }
  }
}

export const addChildDom = function (this: MindElixirInstance, nodeEle: Topic, node?: NodeObj) {
  if (!nodeEle) return null
  const nodeObj = nodeEle.nodeObj
  if (nodeObj.expanded === false) {
    this.expandNode(nodeEle, true)
    // dom had resetted
    nodeEle = findEle(nodeObj.id) as Topic
  }
  const newNodeObj = node || this.generateNewObj()
  if (nodeObj.children) nodeObj.children.push(newNodeObj)
  else nodeObj.children = [newNodeObj]
  fillParent(this.nodeData)

  const top = nodeEle.parentElement

  const { grp, top: newTop } = this.createWrapper(newNodeObj)
  if (top.tagName === 'ME-PARENT') {
    if (top.children[1]) {
      top.nextSibling.appendChild(grp)
    } else {
      const c = this.createChildren([grp])
      top.appendChild(createExpander(true))
      top.insertAdjacentElement('afterend', c)
    }
    this.linkDiv(grp.offsetParent as Wrapper)
  } else if (top.tagName === 'ME-ROOT') {
    const direction = judgeDirection(this.direction, newNodeObj)
    if (direction === LEFT) {
      document.querySelector('.lhs')?.appendChild(grp)
    } else {
      document.querySelector('.rhs')?.appendChild(grp)
    }
    this.linkDiv()
  }
  return { newTop, newNodeObj }
}
