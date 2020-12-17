import {
  moveNodeObj,
  removeNodeObj,
  insertNodeObj,
  insertBeforeNodeObj,
  generateNewObj,
  checkMoveValid,
  addParentLink,
  moveUpObj,
  moveDownObj,
  moveNodeBeforeObj,
  moveNodeAfterObj,
} from './utils/index'
import { findEle, createExpander, createGroup } from './utils/dom'
import { LEFT, RIGHT, SIDE } from './const'

// todo copy node

let $d = document
/**
 * @namespace NodeOperation
 */
export let updateNodeStyle = function (object) {
  if (!object.style) return
  let nodeEle = findEle(object.id)
  nodeEle.style.color = object.style.color
  nodeEle.style.background = object.style.background
  nodeEle.style.fontSize = object.style.fontSize + 'px'
  nodeEle.style.fontWeight = object.style.fontWeight || 'normal'
  this.linkDiv()
}

export let updateNodeTags = function (object) {
  if (!object.tags) return
  let nodeEle = findEle(object.id)
  let tags = object.tags
  let tagsEl = nodeEle.querySelector('.tags')
  if (tagsEl) {
    tagsEl.innerHTML = tags.map(tag => `<span>${tag}</span>`).join('')
  } else {
    let tagsContainer = $d.createElement('div')
    tagsContainer.className = 'tags'
    tagsContainer.innerHTML = tags.map(tag => `<span>${tag}</span>`).join('')
    nodeEle.appendChild(tagsContainer)
  }
  this.linkDiv()
}

export let updateNodeIcons = function (object) {
  if (!object.icons) return
  let nodeEle = findEle(object.id)
  let icons = object.icons
  let iconsEl = nodeEle.querySelector('.icons')
  if (iconsEl) {
    iconsEl.innerHTML = icons.map(icon => `<span>${icon}</span>`).join('')
  } else {
    let iconsContainer = $d.createElement('span')
    iconsContainer.className = 'icons'
    iconsContainer.innerHTML = icons
      .map(icon => `<span>${icon}</span>`)
      .join('')
    // fixed sequence: text -> icons -> tags
    if (nodeEle.lastChild.className === 'tags') {
      nodeEle.insertBefore(iconsContainer, nodeEle.lastChild)
    } else {
      nodeEle.appendChild(iconsContainer)
    }
  }
  this.linkDiv()
}

export let updateNodeSvgChart = function () {
  // TODO
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
export let insertSibling = function (el, node) {
  let nodeEle = el || this.currentNode
  if (!nodeEle) return
  let nodeObj = nodeEle.nodeObj
  if (nodeObj.root === true) {
    this.addChild()
    return
  }
  let newNodeObj = node || generateNewObj()
  insertNodeObj(nodeObj, newNodeObj)
  addParentLink(this.nodeData)
  let t = nodeEle.parentElement
  console.time('insertSibling_DOM')

  let { grp, top } = createGroup(newNodeObj)

  let children = t.parentNode.parentNode
  children.insertBefore(grp, t.parentNode.nextSibling)
  if (children.className === 'box') {
    this.processPrimaryNode(grp, newNodeObj)
    this.linkDiv()
  } else {
    this.linkDiv(grp.offsetParent)
  }
  if (!node) {
    this.createInputDiv(top.children[0])
  }
  this.selectNode(top.children[0], true)
  top.scrollIntoViewIfNeeded()
  console.timeEnd('insertSibling_DOM')
  this.bus.fire('operation', {
    name: 'insertSibling',
    obj: newNodeObj,
  })
}

export let insertBefore = function (el, node) {
  let nodeEle = el || this.currentNode
  if (!nodeEle) return
  let nodeObj = nodeEle.nodeObj
  if (nodeObj.root === true) {
    this.addChild()
    return
  }
  let newNodeObj = node || generateNewObj()
  insertBeforeNodeObj(nodeObj, newNodeObj)
  addParentLink(this.nodeData)
  let t = nodeEle.parentElement
  console.time('insertSibling_DOM')

  let { grp, top } = createGroup(newNodeObj)

  let children = t.parentNode.parentNode
  children.insertBefore(grp, t.parentNode)
  if (children.className === 'box') {
    this.processPrimaryNode(grp, newNodeObj)
    this.linkDiv()
  } else {
    this.linkDiv(grp.offsetParent)
  }
  if (!node) {
    this.createInputDiv(top.children[0])
  }
  this.selectNode(top.children[0], true)
  top.scrollIntoViewIfNeeded()
  console.timeEnd('insertSibling_DOM')
  this.bus.fire('operation', {
    name: 'insertSibling',
    obj: newNodeObj,
  })
}

/**
 * @function
 * @instance
 * @name addChild
 * @memberof NodeOperation
 * @description Create a child node.
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 * @example
 * addChild(E('bd4313fbac40284b'))
 */
export let addChild = function (el, node) {
  console.time('addChild')
  let nodeEle = el || this.currentNode
  if (!nodeEle) return
  let nodeObj = nodeEle.nodeObj
  if (nodeObj.expanded === false) {
    this.expandNode(nodeEle, true)
    // dom reset thus
    nodeEle = E(nodeObj.id)
  }
  let newNodeObj = node || generateNewObj()
  nodeObj.expanded = true
  if (nodeObj.children) nodeObj.children.push(newNodeObj)
  else nodeObj.children = [newNodeObj]
  addParentLink(this.nodeData)
  let top = nodeEle.parentElement

  let { grp, top: newTop } = createGroup(newNodeObj)

  if (top.tagName === 'T') {
    if (top.children[1]) {
      top.nextSibling.appendChild(grp)
    } else {
      let c = $d.createElement('children')
      c.appendChild(grp)
      top.appendChild(createExpander(true))
      top.parentElement.insertBefore(c, top.nextSibling)
    }
    this.linkDiv(grp.offsetParent)
  } else if (top.tagName === 'ROOT') {
    this.processPrimaryNode(grp, newNodeObj)
    top.nextSibling.appendChild(grp)
    this.linkDiv()
  }
  if (!node) {
    this.createInputDiv(newTop.children[0])
  }
  this.selectNode(newTop.children[0], true)
  newTop.scrollIntoViewIfNeeded()
  console.timeEnd('addChild')
  this.bus.fire('operation', {
    name: 'addChild',
    obj: newNodeObj,
  })
}
// uncertain link disappear sometimes??
// TODO while direction = SIDE, move up won't change the direction of primary node

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
export let moveUpNode = function (el) {
  let nodeEle = el || this.currentNode
  if (!nodeEle) return
  let grp = nodeEle.parentNode.parentNode
  let obj = nodeEle.nodeObj
  moveUpObj(obj)
  grp.parentNode.insertBefore(grp, grp.previousSibling)
  this.linkDiv()
  nodeEle.scrollIntoViewIfNeeded()
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
export let moveDownNode = function (el) {
  let nodeEle = el || this.currentNode
  if (!nodeEle) return
  let grp = nodeEle.parentNode.parentNode
  let obj = nodeEle.nodeObj
  moveDownObj(obj)
  if (grp.nextSibling) {
    grp.parentNode.insertBefore(grp, grp.nextSibling.nextSibling)
  } else {
    grp.parentNode.prepend(grp)
  }
  this.linkDiv()
  nodeEle.scrollIntoViewIfNeeded()
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
export let removeNode = function (el) {
  let nodeEle = el || this.currentNode
  if (!nodeEle) return
  let nodeObj = nodeEle.nodeObj
  if (nodeObj.root === true) {
    throw new Error('Can not remove root node')
  }
  let index = nodeObj.parent.children.findIndex(node => node === nodeObj)
  let next = nodeObj.parent.children[index + 1]
  let originSiblingId = next && next.id

  let childrenLength = removeNodeObj(nodeObj)
  let t = nodeEle.parentNode // T
  if (t.tagName === 'ROOT') {
    return
  }
  if (childrenLength === 0) {
    // remove epd when children length === 0
    let parentT = t.parentNode.parentNode.previousSibling
    if (parentT.tagName !== 'ROOT')
      // root doesn't have epd
      parentT.children[1].remove()
    this.selectParent()
  } else {
    // select sibling automatically
    let success = this.selectPrevSibling()
    if (!success) this.selectNextSibling()
  }
  for (let prop in this.linkData) {
    // MAYBEBUG should traversal all children node
    let link = this.linkData[prop]
    if (link.from === t.firstChild || link.to === t.firstChild) {
      this.removeLink(
        this.mindElixirBox.querySelector(`[data-linkid=${this.linkData[prop].id}]`)
      )
    }
  }
  // remove GRP
  t.parentNode.remove()
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'removeNode',
    obj: nodeObj,
    originSiblingId,
    originParentId: nodeObj.parent.id,
  })
}

/**
 * @function
 * @instance
 * @name moveNode
 * @memberof NodeOperation
 * @description Move the target node to another node (as child node).
 * @param {TargetElement} from - The target you want to move.
 * @param {TargetElement} to - The target(as parent node) you want to move to.
 * @example
 * moveNode(E('bd4313fbac402842'),E('bd4313fbac402839'))
 */
export let moveNode = function (from, to) {
  let fromObj = from.nodeObj
  let toObj = to.nodeObj
  let originParentId = fromObj.parent.id
  if (toObj.expanded === false) {
    this.expandNode(to, true)
    from = E(fromObj.id)
    to = E(toObj.id)
  }
  if (!checkMoveValid(fromObj, toObj)) {
    console.warn('Invalid move')
    return
  }
  console.time('moveNode')
  moveNodeObj(fromObj, toObj)
  addParentLink(this.nodeData) // update parent property
  let fromTop = from.parentElement
  let fromChilren = fromTop.parentNode.parentNode
  let toTop = to.parentElement
  if (fromChilren.className === 'box') {
    // clear svg group of primary node
    fromTop.parentNode.lastChild.remove()
  } else if (fromTop.parentNode.className === 'box') {
    fromTop.style.cssText = '' // clear style
  }
  if (toTop.tagName === 'T') {
    if (fromChilren.className === 'box') {
      // clear direaction class of primary node
      fromTop.parentNode.className = ''
    }
    if (toTop.children[1]) {
      // expander exist
      toTop.nextSibling.appendChild(fromTop.parentNode)
    } else {
      // expander not exist, no child
      let c = $d.createElement('children')
      c.appendChild(fromTop.parentNode)
      toTop.appendChild(createExpander(true))
      toTop.parentElement.insertBefore(c, toTop.nextSibling)
    }
  } else if (toTop.tagName === 'ROOT') {
    this.processPrimaryNode(fromTop.parentNode, fromObj)
    toTop.nextSibling.appendChild(fromTop.parentNode)
  }
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'moveNode',
    obj: { fromObj, toObj, originParentId },
  })
  console.timeEnd('moveNode')
}

export let moveNodeBefore = function (from, to) {
  let fromObj = from.nodeObj
  let toObj = to.nodeObj
  moveNodeBeforeObj(fromObj, toObj)
  addParentLink(this.nodeData)
  let fromTop = from.parentElement
  let fromGrp = fromTop.parentNode
  let toTop = to.parentElement
  let toGrp = toTop.parentNode
  let toChilren = toTop.parentNode.parentNode
  toChilren.insertBefore(fromGrp, toGrp)
  this.linkDiv()
}

export let moveNodeAfter = function (from, to) {
  let fromObj = from.nodeObj
  let toObj = to.nodeObj
  moveNodeAfterObj(fromObj, toObj)
  addParentLink(this.nodeData)
  let fromTop = from.parentElement
  let fromGrp = fromTop.parentNode
  let toTop = to.parentElement
  let toGrp = toTop.parentNode
  let toChilren = toTop.parentNode.parentNode
  toChilren.insertBefore(fromGrp, toGrp.nextSibling)
  this.linkDiv()
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
export let beginEdit = function (el) {
  let nodeEle = el || this.currentNode
  if (!nodeEle) return
  this.createInputDiv(nodeEle)
}

export let setNodeTopic = function (tpc, topic) {
  tpc.childNodes[0].textContent = topic
  tpc.nodeObj.topic = topic
  this.linkDiv()
}

// Judge L or R
export function processPrimaryNode(primaryNode, obj) {
  if (this.direction === LEFT) {
    primaryNode.className = 'lhs'
  } else if (this.direction === RIGHT) {
    primaryNode.className = 'rhs'
  } else if (this.direction === SIDE) {
    let l = $d.querySelectorAll('.lhs').length
    let r = $d.querySelectorAll('.rhs').length
    if (l <= r) {
      primaryNode.className = 'lhs'
      obj.direction = LEFT
    } else {
      primaryNode.className = 'rhs'
      obj.direction = RIGHT
    }
  }
}
