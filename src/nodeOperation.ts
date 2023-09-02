import {
  moveNodeObj,
  removeNodeObj,
  insertNodeObj,
  insertBeforeNodeObj,
  insertParentNodeObj,
  checkMoveValid,
  fillParent,
  moveUpObj,
  moveDownObj,
  moveNodeBeforeObj,
  moveNodeAfterObj,
  refreshIds,
} from './utils/index'
import { findEle, createExpander, shapeTpc } from './utils/dom'
import { deepClone } from './utils/index'
import type { Topic, Wrapper, CustomSvg } from './types/dom'
import type { MindElixirInstance, NodeObj } from './types/index'
import { LEFT, RIGHT, SIDE } from './const'

const mainToSub = function (tpc: Topic) {
  const mainNode = tpc.parentElement.parentElement
  const lc = mainNode.lastElementChild
  if (lc?.tagName === 'svg') lc?.remove() // clear svg group of main node
}

// Judge new added node L or R
const judgeDirection = function (direction: number, obj: NodeObj) {
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

/**
 * @function
 * @instance
 * @name reshapeNode
 * @memberof NodeOperation
 * @description Re-shape a node.
 * @param {TargetElement} el - Target element return by E('...')
 * @param {patchData} node - Data should be patched to the original data
 * @example
 * reshapeNode(E('bd4313fbac40284b'),{tags:['A', 'B'], style:{color:'#000'}})
 */
export const reshapeNode = function (this: MindElixirInstance, tpc: Topic, patchData: NodeObj) {
  console.log(patchData)
  const nodeObj = tpc.nodeObj
  const origin = deepClone(nodeObj)
  // merge styles
  if (origin.style && patchData.style) {
    patchData.style = Object.assign(origin.style, patchData.style)
  }
  const newObj = Object.assign(nodeObj, patchData)
  shapeTpc(tpc, newObj)
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'reshapeNode',
    obj: newObj,
    origin,
  })
}

/**
 * @function
 * @instance
 * @name insertSibling
 * @memberof NodeOperation
 * @description Create a sibling node.
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 * @param {node} node - New node information.
 * @example
 * insertSibling(E('bd4313fbac40284b'))
 */
export const insertSibling = function (this: MindElixirInstance, el?: Topic, node?: NodeObj) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const nodeObj = nodeEle.nodeObj
  if (nodeObj.root === true) {
    this.addChild()
    return
  } else if (nodeObj.parent?.root === true && nodeObj.parent?.children?.length === 1) {
    // add at least one node to another side
    this.addChild(findEle(nodeObj.parent!.id))
    return
  }
  const newNodeObj = node || this.generateNewObj()
  insertNodeObj(nodeObj, newNodeObj)
  fillParent(this.nodeData)
  const t = nodeEle.parentElement
  console.time('insertSibling_DOM')

  const { grp, top } = this.createWrapper(newNodeObj)

  const children = t.parentNode.parentNode
  children.insertBefore(grp, t.parentNode.nextSibling)

  this.linkDiv(grp.offsetParent)

  if (!node) {
    this.editTopic(top.firstChild)
  }
  this.selectNode(top.firstChild, true)
  console.timeEnd('insertSibling_DOM')
  this.bus.fire('operation', {
    name: 'insertSibling',
    obj: newNodeObj,
  })
}

/**
 * @function
 * @instance
 * @name insertBefore
 * @memberof NodeOperation
 * @description Create a sibling node before the selected node.
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 * @param {node} node - New node information.
 * @example
 * insertBefore(E('bd4313fbac40284b'))
 */
export const insertBefore = function (this: MindElixirInstance, el?: Topic, node?: NodeObj) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const nodeObj = nodeEle.nodeObj
  if (nodeObj.root === true) {
    this.addChild()
    return
  }
  const newNodeObj = node || this.generateNewObj()
  insertBeforeNodeObj(nodeObj, newNodeObj)
  fillParent(this.nodeData)
  const t = nodeEle.parentElement
  console.time('insertSibling_DOM')

  const { grp, top } = this.createWrapper(newNodeObj)

  const children = t.parentNode.parentNode
  children.insertBefore(grp, t.parentNode)

  this.linkDiv(grp.offsetParent)

  if (!node) {
    this.editTopic(top.firstChild)
  }
  this.selectNode(top.firstChild, true)
  console.timeEnd('insertSibling_DOM')
  this.bus.fire('operation', {
    name: 'insertBefore',
    obj: newNodeObj,
  })
}

/**
 * @function
 * @instance
 * @name insertParent
 * @memberof NodeOperation
 * @description Create a parent node of the selected node.
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 * @param {node} node - New node information.
 * @example
 * insertParent(E('bd4313fbac40284b'))
 */
export const insertParent = function (this: MindElixirInstance, el?: Topic, node?: NodeObj) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  mainToSub(nodeEle)
  const nodeObj = nodeEle.nodeObj
  if (nodeObj.root === true) {
    return
  }
  const newNodeObj = node || this.generateNewObj()
  insertParentNodeObj(nodeObj, newNodeObj)
  fillParent(this.nodeData)

  // warning: the tricky part
  const grp0 = nodeEle.parentElement.parentElement
  console.time('insertParent_DOM')
  const { grp, top } = this.createWrapper(newNodeObj, true)
  top.appendChild(createExpander(true))
  grp0.insertAdjacentElement('afterend', grp)

  const c = this.createChildren([grp0])
  top.insertAdjacentElement('afterend', c)

  this.linkDiv()

  if (!node) {
    this.editTopic(top.firstChild)
  }
  this.selectNode(top.firstChild, true)
  console.timeEnd('insertParent_DOM')
  this.bus.fire('operation', {
    name: 'insertParent',
    obj: newNodeObj,
  })
}

const addChildFunction = function (this: MindElixirInstance, nodeEle: Topic, node?: NodeObj) {
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

/**
 * @function
 * @instance
 * @name addChild
 * @memberof NodeOperation
 * @description Create a child node.
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 * @param {node} node - New node information.
 * @example
 * addChild(E('bd4313fbac40284b'))
 */
export const addChild = function (this: MindElixirInstance, el?: Topic, node?: NodeObj) {
  console.time('addChild')
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const res = addChildFunction.call(this, nodeEle, node)
  if (!res) return
  const { newTop, newNodeObj } = res
  this.bus.fire('operation', {
    name: 'addChild',
    obj: newNodeObj,
  })
  console.timeEnd('addChild')
  if (!node) {
    this.editTopic(newTop.firstChild)
  }
  this.selectNode(newTop.firstChild, true)
}
// uncertain link disappear sometimes??
// TODO while direction = SIDE, move up won't change the direction of main node

/**
 * @function
 * @instance
 * @name copyNode
 * @memberof NodeOperation
 * @description Copy node to another node.
 * @param {TargetElement} node - Target element return by E('...'), default value: currentTarget.
 * @param {TargetElement} to - The target(as parent node) you want to copy to.
 * @example
 * copyNode(E('bd4313fbac402842'),E('bd4313fbac402839'))
 */
export const copyNode = function (this: MindElixirInstance, node: Topic, to: Topic) {
  console.time('copyNode')
  const deepCloneObj = deepClone(node.nodeObj)
  refreshIds(deepCloneObj)
  const res = addChildFunction.call(this, to, deepCloneObj)
  if (!res) return
  const { newNodeObj } = res
  console.timeEnd('copyNode')
  this.bus.fire('operation', {
    name: 'copyNode',
    obj: newNodeObj,
  })
}

/**
 * @function
 * @instance
 * @name moveUpNode
 * @memberof NodeOperation
 * @description Move the target node up.
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 * @example
 * moveUpNode(E('bd4313fbac40284b'))
 */
export const moveUpNode = function (this: MindElixirInstance, el?: Topic) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const grp = nodeEle.parentNode.parentNode
  const obj = nodeEle.nodeObj
  moveUpObj(obj)
  grp.parentNode.insertBefore(grp, grp.previousSibling)
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'moveUpNode',
    obj,
  })
}

/**
 * @function
 * @instance
 * @name moveDownNode
 * @memberof NodeOperation
 * @description Move the target node down.
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 * @example
 * moveDownNode(E('bd4313fbac40284b'))
 */
export const moveDownNode = function (this: MindElixirInstance, el?: Topic) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const grp = nodeEle.parentNode.parentNode
  const obj = nodeEle.nodeObj
  moveDownObj(obj)
  if (grp.nextSibling) {
    grp.nextSibling.insertAdjacentElement('afterend', grp)
  } else {
    grp.parentNode.prepend(grp)
  }
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'moveDownNode',
    obj,
  })
}

/**
 * @function
 * @instance
 * @name removeNode
 * @memberof NodeOperation
 * @description Remove the target node.
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 * @example
 * removeNode(E('bd4313fbac40284b'))
 */
export const removeNode = function (this: MindElixirInstance, el?: Topic) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const nodeObj = nodeEle.nodeObj
  if (nodeObj.root === true) {
    throw new Error('Can not remove root node')
  }
  const siblings = nodeObj.parent!.children!
  const i = siblings.findIndex(node => node === nodeObj)
  const siblingLength = removeNodeObj(nodeObj)

  const t = nodeEle.parentNode
  if (siblingLength === 0) {
    // remove epd when children length === 0
    const c = t.parentNode.parentNode
    // root doesn't have epd
    if (c.tagName !== 'ME-MAIN') {
      c.previousSibling.children[1].remove()
    }
  }
  // automatically select sibling or parent
  if (siblings.length !== 0) {
    const sibling = siblings[i] || siblings[i - 1]
    this.selectNode(findEle(sibling.id))
  } else {
    this.selectNode(findEle(nodeObj.parent!.id))
  }

  for (const prop in this.linkData) {
    // MAYBEBUG should traverse all children node
    const link = this.linkData[prop]
    if (link.from === nodeObj.id || link.to === nodeObj.id) {
      const linkEle = this.mindElixirBox.querySelector(`[data-linkid=${this.linkData[prop].id}]`) as CustomSvg
      this.removeLink(linkEle)
    }
  }
  t.parentNode.remove()
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'removeNode',
    obj: nodeObj,
    originIndex: i,
    originParentId: nodeObj?.parent?.id,
  })
}

/**
 * @function
 * @instance
 * @name moveNode
 * @memberof NodeOperation
 * @description Move a node to another node (as child node).
 * @param {TargetElement} from - The target you want to move.
 * @param {TargetElement} to - The target(as parent node) you want to move to.
 * @example
 * moveNode(E('bd4313fbac402842'),E('bd4313fbac402839'))
 */
export const moveNode = function (this: MindElixirInstance, from: Topic, to: Topic) {
  const obj = from.nodeObj
  const toObj = to.nodeObj
  const originParentId = obj?.parent?.id
  if (toObj.expanded === false) {
    this.expandNode(to, true)
    from = findEle(obj.id) as Topic
    to = findEle(toObj.id) as Topic
  }
  if (!checkMoveValid(obj, toObj)) {
    console.warn('Invalid move')
    return
  }
  console.time('moveNode')
  moveNodeObj(obj, toObj)
  fillParent(this.nodeData) // update parent property
  const fromTop = from.parentElement
  const toTop = to.parentElement
  if (toTop.tagName === 'ME-PARENT') {
    mainToSub(from)
    if (toTop.children[1]) {
      // expander exist
      toTop.nextSibling.appendChild(fromTop.parentElement)
    } else {
      // expander not exist, no child
      const c = this.createChildren([fromTop.parentElement])
      toTop.appendChild(createExpander(true))
      toTop.parentElement.insertBefore(c, toTop.nextSibling)
    }
  } else if (toTop.tagName === 'ME-ROOT') {
    judgeDirection(this.direction, obj)
    toTop.nextSibling.appendChild(fromTop.parentElement)
  }
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'moveNode',
    obj,
    toObj,
    originParentId,
  })
  console.timeEnd('moveNode')
}

/**
 * @function
 * @instance
 * @name moveNodeBefore
 * @memberof NodeOperation
 * @description Move a node and become previous node of another node.
 * @param {TargetElement} from
 * @param {TargetElement} to
 * @example
 * moveNodeBefore(E('bd4313fbac402842'),E('bd4313fbac402839'))
 */
export const moveNodeBefore = function (this: MindElixirInstance, from: Topic, to: Topic) {
  const obj = from.nodeObj
  const toObj = to.nodeObj
  const originParentId = obj.parent?.id
  moveNodeBeforeObj(obj, toObj)
  fillParent(this.nodeData)
  mainToSub(from)
  const fromTop = from.parentElement
  const fromGrp = fromTop.parentNode
  const toTop = to.parentElement
  const toGrp = toTop.parentNode
  toGrp.insertAdjacentElement('beforebegin', fromGrp)
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'moveNodeBefore',
    obj,
    toObj,
    originParentId,
  })
}

/**
 * @function
 * @instance
 * @name moveNodeAfter
 * @memberof NodeOperation
 * @description Move a node and become next node of another node.
 * @param {TargetElement} from
 * @param {TargetElement} to
 * @example
 * moveNodeAfter(E('bd4313fbac402842'),E('bd4313fbac402839'))
 */
export const moveNodeAfter = function (this: MindElixirInstance, from: Topic, to: Topic) {
  const obj = from.nodeObj
  const toObj = to.nodeObj
  const originParentId = obj.parent?.id
  moveNodeAfterObj(obj, toObj)
  fillParent(this.nodeData)
  mainToSub(from)
  const fromTop = from.parentElement
  const fromGrp = fromTop.parentElement
  const toTop = to.parentElement
  const toGrp = toTop.parentElement
  toGrp.insertAdjacentElement('afterend', fromGrp)
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'moveNodeAfter',
    obj,
    toObj,
    originParentId,
  })
}

/**
 * @function
 * @instance
 * @name beginEdit
 * @memberof NodeOperation
 * @description Begin to edit the target node.
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 * @example
 * beginEdit(E('bd4313fbac40284b'))
 */
export const beginEdit = function (this: MindElixirInstance, el?: Topic) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  this.editTopic(nodeEle)
}

export const setNodeTopic = function (this: MindElixirInstance, el: Topic, topic: string) {
  el.childNodes[0].textContent = topic
  el.nodeObj.topic = topic
  this.linkDiv()
}
