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
import type { Children, Topic, Wrapper, CustomSvg } from './types/dom'
import type {
  ReshapeNode,
  InsertNodeCommon,
  AddChildFunction,
  TNodeCopy,
  MoveNodeCommon,
  RemoveNode,
  MoveNodeToCommon,
  SetNodeTopic,
} from './types/function'
import type { NodeObj } from './types/index'

const mainToSub = function (tpc: Topic) {
  const mainNode = tpc.parentElement.parentElement
  if (mainNode.parentElement.className !== 'main-node-container') return
  mainNode.lastChild?.remove() // clear svg group of main node
  mainNode.style.cssText = '' // clear position
  mainNode.className = ''
}

/**
 * @exports NodeOperation
 * @namespace NodeOperation
 */

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
export const reshapeNode: ReshapeNode = function (tpc, patchData) {
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
export const insertSibling: InsertNodeCommon = function (el, node) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const nodeObj = nodeEle.nodeObj
  if (nodeObj.root === true) {
    this.addChild()
    return
  }
  const newNodeObj = node || this.generateNewObj()
  insertNodeObj(nodeObj, newNodeObj)
  fillParent(this.nodeData)
  const t = nodeEle.parentElement
  console.time('insertSibling_DOM')

  const { grp, top } = this.createWrapper(newNodeObj)

  const children = t.parentNode.parentNode as Children
  children.insertBefore(grp, t.parentNode.nextSibling)
  if (children.className === 'main-node-container') {
    this.judgeDirection(grp, newNodeObj)
    this.linkDiv()
  } else {
    this.linkDiv(grp.offsetParent)
  }
  if (!node) {
    this.createInputDiv(top.children[0] as Topic)
  }
  this.selectNode(top.children[0] as Topic, true)
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
export const insertBefore: InsertNodeCommon = function (el, node) {
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

  const children = t.parentNode.parentNode as Children
  children.insertBefore(grp, t.parentNode)
  if (children.className === 'main-node-container') {
    this.judgeDirection(grp, newNodeObj)
    this.linkDiv()
  } else {
    this.linkDiv(grp.offsetParent)
  }
  if (!node) {
    this.createInputDiv(top.children[0] as Topic)
  }
  this.selectNode(top.children[0] as Topic, true)
  console.timeEnd('insertSibling_DOM')
  this.bus.fire('insertBefore', {
    name: 'insertSibling',
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
export const insertParent: InsertNodeCommon = function (el, node) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
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
  // FIX: style wrong when adding main node parent

  // if it's a main node previously
  if (grp0.parentNode.className === 'main-node-container') {
    grp.className = grp0.className // l/rhs
    grp0.className = ''
    grp0.querySelector('.subLines')?.remove()
    this.linkDiv()
  } else {
    this.linkDiv(grp.offsetParent)
  }

  if (!node) {
    this.createInputDiv(top.children[0] as Topic)
  }
  this.selectNode(top.children[0] as Topic, true)
  console.timeEnd('insertParent_DOM')
  this.bus.fire('operation', {
    name: 'insertParent',
    obj: newNodeObj,
  })
}

export const addChildFunction: AddChildFunction = function (nodeEle, node) {
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
    this.judgeDirection(grp, newNodeObj)
    top.nextSibling.appendChild(grp)
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
export const addChild: InsertNodeCommon = function (el, node) {
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
    this.createInputDiv(newTop.firstChild)
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
export const copyNode: TNodeCopy = function (node: Topic, to: Topic) {
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
export const moveUpNode: MoveNodeCommon = function (el) {
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
export const moveDownNode: MoveNodeCommon = function (el) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const grp = nodeEle.parentNode.parentNode
  const obj = nodeEle.nodeObj
  moveDownObj(obj)
  if (grp.nextSibling) {
    grp.insertAdjacentElement('afterend', grp.nextSibling)
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
export const removeNode: RemoveNode = function (el) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  console.log('removeNode', nodeEle)
  const nodeObj = nodeEle.nodeObj
  if (nodeObj.root === true) {
    throw new Error('Can not remove root node')
  }
  const siblings = nodeObj.parent!.children!
  const index = siblings.findIndex(node => node === nodeObj)
  const next: NodeObj | undefined = siblings[index + 1]
  const originSiblingId = next && next.id

  const childrenLength = removeNodeObj(nodeObj)
  const t = nodeEle.parentNode
  if (childrenLength === 0) {
    // remove epd when children length === 0
    const parentT = t.parentNode.parentNode.previousSibling
    // root doesn't have epd
    if (parentT.tagName !== 'ME-ROOT') {
      parentT.children[1].remove()
    }
    this.selectParent()
  } else {
    // select sibling automatically
    this.selectPrevSibling() || this.selectNextSibling() || this.selectParent()
  }
  for (const prop in this.linkData) {
    // MAYBEBUG should traverse all children node
    const link = this.linkData[prop]
    if (link.from === nodeObj.id || link.to === nodeObj.id) {
      const linkEle = this.mindElixirBox.querySelector(`[data-linkid=${this.linkData[prop].id}]`) as CustomSvg
      this.removeLink(linkEle)
    }
  }
  // remove GRP
  t.parentNode.remove()
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'removeNode',
    obj: nodeObj,
    originSiblingId,
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
export const moveNode: MoveNodeToCommon = function (from, to) {
  const fromObj = from.nodeObj
  const toObj = to.nodeObj
  const originParentId = fromObj?.parent?.id
  if (toObj.expanded === false) {
    this.expandNode(to, true)
    from = findEle(fromObj.id) as Topic
    to = findEle(toObj.id) as Topic
  }
  if (!checkMoveValid(fromObj, toObj)) {
    console.warn('Invalid move')
    return
  }
  console.time('moveNode')
  moveNodeObj(fromObj, toObj)
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
    this.judgeDirection(fromTop.parentElement, fromObj)
    toTop.nextSibling.appendChild(fromTop.parentElement)
  }
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'moveNode',
    obj: { fromObj, toObj, originParentId },
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
export const moveNodeBefore: MoveNodeToCommon = function (from, to) {
  const fromObj = from.nodeObj
  const toObj = to.nodeObj
  const originParentId = fromObj.parent!.id
  moveNodeBeforeObj(fromObj, toObj)
  fillParent(this.nodeData)
  mainToSub(from)
  const fromTop = from.parentElement
  const fromGrp = fromTop.parentNode
  const toTop = to.parentElement
  const toGrp = toTop.parentNode
  const toChilren = toTop.parentNode.parentNode
  toChilren.insertBefore(fromGrp, toGrp)
  if (toGrp.className) fromGrp.className = toGrp.className
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'moveNodeBefore',
    obj: { fromObj, toObj, originParentId },
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
export const moveNodeAfter: MoveNodeToCommon = function (from: Topic, to: Topic) {
  const fromObj = from.nodeObj
  const toObj = to.nodeObj
  const originParentId = fromObj.parent!.id
  moveNodeAfterObj(fromObj, toObj)
  fillParent(this.nodeData)
  mainToSub(from)
  const fromTop = from.parentElement
  const fromGrp = fromTop.parentElement
  const toTop = to.parentElement
  const toGrp = toTop.parentElement
  const toChilren = toGrp.parentNode
  toChilren.insertBefore(fromGrp, toGrp.nextSibling)
  if (toGrp.className) fromGrp.className = toGrp.className
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'moveNodeAfter',
    obj: { fromObj, toObj, originParentId },
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
export const beginEdit: InsertNodeCommon = function (el) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  this.createInputDiv(nodeEle)
}

export const setNodeTopic: SetNodeTopic = function (tpc, topic) {
  tpc.childNodes[0].textContent = topic
  tpc.nodeObj.topic = topic
  this.linkDiv()
}
