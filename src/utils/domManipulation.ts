import { LEFT, RIGHT, SIDE } from '../const'
import { rmSubline } from '../nodeOperation'
import type { MindElixirInstance, NodeObj } from '../types'
import type { Topic, Wrapper } from '../types/dom'
import { createExpander } from './dom'

// Judge new added node L or R
export const judgeDirection = function ({ map, direction }: MindElixirInstance, obj: NodeObj) {
  if (direction === LEFT) {
    return LEFT
  } else if (direction === RIGHT) {
    return RIGHT
  } else if (direction === SIDE) {
    const l = map.querySelector('.lhs')?.childElementCount || 0
    const r = map.querySelector('.rhs')?.childElementCount || 0
    if (l <= r) {
      obj.direction = LEFT
      return LEFT
    } else {
      obj.direction = RIGHT
      return RIGHT
    }
  }
}

export const addChildDom = function (mei: MindElixirInstance, to: Topic, wrapper: Wrapper) {
  const tpc = wrapper.children[0].children[0]
  const top = to.parentElement
  if (top.tagName === 'ME-PARENT') {
    rmSubline(tpc)
    if (top.children[1]) {
      top.nextSibling.appendChild(wrapper)
    } else {
      const c = mei.createChildren([wrapper])
      top.appendChild(createExpander(true))
      top.insertAdjacentElement('afterend', c)
    }
    mei.linkDiv(wrapper.offsetParent as Wrapper)
  } else if (top.tagName === 'ME-ROOT') {
    const direction = judgeDirection(mei, tpc.nodeObj)
    if (direction === LEFT) {
      mei.container.querySelector('.lhs')?.appendChild(wrapper)
    } else {
      mei.container.querySelector('.rhs')?.appendChild(wrapper)
    }
    mei.linkDiv()
  }
}

export const removeNodeDom = function (tpc: Topic, siblingLength: number) {
  const p = tpc.parentNode
  if (siblingLength === 0) {
    // remove epd when children length === 0
    const c = p.parentNode.parentNode
    if (c.tagName !== 'ME-MAIN') {
      // Root
      c.previousSibling.children[1]!.remove() // remove epd
      c.remove() // remove Children div
    }
  }
  p.parentNode.remove()
}
