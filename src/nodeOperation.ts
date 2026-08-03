import { fillParent, refreshIds, unionTopics } from './utils/index'
import { createExpander, shapeTpc } from './utils/dom'
import { deepClone } from './utils/index'
import type { Children, Topic } from './types/dom'
import { DirectionClass, type MindElixirInstance, type NodeObj } from './types/index'
import { insertNodeObj, insertParentNodeObj, removeNodeObj, moveNodeObj } from './utils/objectManipulation'
import { addChildDom, removeNodeDom } from './utils/domManipulation'
import { LEFT, RIGHT, SIDE } from './const'

const typeMap: Record<string, InsertPosition> = {
  before: 'beforebegin',
  after: 'afterend',
}

export const rmSubline = function (tpc: Topic) {
  const mainNode = tpc.parentElement.parentElement
  const lc = mainNode.lastElementChild
  if (lc?.tagName === 'svg') lc?.remove() // clear svg group of main node
}

export const reshapeNode = function (this: MindElixirInstance, tpc: Topic, patchData: Partial<NodeObj>) {
  const nodeObj = tpc.nodeObj
  const origin = deepClone(nodeObj)
  // merge styles
  if (origin.style && patchData.style) {
    patchData.style = Object.assign(origin.style, patchData.style)
  }
  const newObj = Object.assign(nodeObj, patchData)
  shapeTpc.call(this, tpc, newObj)
  this.linkDiv()
  this.bus.fire('operation', {
    name: 'reshapeNode',
    obj: newObj,
    origin,
  })
}

const addChildFunc = function (mei: MindElixirInstance, tpc: Topic, node?: NodeObj) {
  if (!tpc) return null
  const nodeObj = tpc.nodeObj
  if (nodeObj.expanded === false) {
    mei.expandNode(tpc, true)
    // dom had resetted
    tpc = mei.findEle(nodeObj.id) as Topic
  }
  const newNodeObj = node || mei.generateNewObj()
  if (nodeObj.children) nodeObj.children.push(newNodeObj)
  else nodeObj.children = [newNodeObj]
  fillParent(mei.nodeData)

  const { grp, top: newTop } = mei.createWrapper(newNodeObj)
  addChildDom(mei, tpc, grp)
  return { newTop, newNodeObj }
}

export const insertSibling = function (this: MindElixirInstance, type: 'before' | 'after', el?: Topic, node?: NodeObj) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const nodeObj = nodeEle.nodeObj
  if (!nodeObj.parent) {
    this.addChild()
    return
  } else if (!nodeObj.parent?.parent && this.direction === 2) {
    const l = this.map.querySelector('.lhs')?.childElementCount || 0
    const r = this.map.querySelector('.rhs')?.childElementCount || 0
    if (!l || !r) {
      // add at least one node to another side
      this.addChild(this.findEle(nodeObj.parent!.id), node)
      return
    }
  }
  const newNodeObj = node || this.generateNewObj()
  if (!nodeObj.parent?.parent) {
    const direction = nodeEle.closest('me-main')!.className === DirectionClass.LHS ? LEFT : RIGHT
    newNodeObj.direction = direction
  }
  insertNodeObj(newNodeObj, type, nodeObj)
  fillParent(this.nodeData)
  const t = nodeEle.parentElement
  console.time('insertSibling_DOM')

  const { grp, top } = this.createWrapper(newNodeObj)

  t.parentElement.insertAdjacentElement(typeMap[type], grp)

  this.linkDiv(grp.offsetParent)

  if (!node) {
    this.editTopic(top.firstChild)
  }
  console.timeEnd('insertSibling_DOM')
  this.bus.fire('operation', {
    name: 'insertSibling',
    type,
    obj: newNodeObj,
  })
  this.selectNode(top.firstChild, true)
}

export const insertParent = function (this: MindElixirInstance, el?: Topic, node?: NodeObj) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  rmSubline(nodeEle)
  const nodeObj = nodeEle.nodeObj
  if (!nodeObj.parent) {
    return
  }
  const newNodeObj = node || this.generateNewObj()
  if (!nodeObj.parent?.parent) {
    const direction = nodeEle.closest('me-main')!.className === DirectionClass.LHS ? LEFT : RIGHT
    newNodeObj.direction = direction
  }
  insertParentNodeObj(nodeObj, newNodeObj)
  fillParent(this.nodeData)

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
  // 同 addChild，先触发事件再选择节点，undo 时才能恢复操作前的选中状态
  this.bus.fire('operation', {
    name: 'insertParent',
    obj: newNodeObj,
  })
  this.selectNode(top.firstChild, true)
  console.timeEnd('insertParent_DOM')
}

export const addChild = function (this: MindElixirInstance, el?: Topic, node?: NodeObj) {
  console.time('addChild')
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const res = addChildFunc(this, nodeEle, node)
  if (!res) return
  const { newTop, newNodeObj } = res
  // 添加节点关注添加节点前选择的节点，所以先触发事件再选择节点
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

export const copyNode = function (this: MindElixirInstance, node: Topic, to: Topic) {
  console.time('copyNode')
  const deepCloneObj = deepClone(node.nodeObj)
  refreshIds(deepCloneObj)
  const res = addChildFunc(this, to, deepCloneObj)
  if (!res) return
  const { newNodeObj } = res
  console.timeEnd('copyNode')
  // 同 addChild，先触发事件再选择节点，undo 时才能恢复操作前的选中状态
  this.bus.fire('operation', {
    name: 'copyNode',
    obj: newNodeObj,
  })
  this.selectNode(this.findEle(newNodeObj.id))
}

export const copyNodes = function (this: MindElixirInstance, tpcs: Topic[], to: Topic) {
  const objs = []
  for (let i = 0; i < tpcs.length; i++) {
    const node = tpcs[i]
    const deepCloneObj = deepClone(node.nodeObj)
    refreshIds(deepCloneObj)
    const res = addChildFunc(this, to, deepCloneObj)
    if (!res) return
    const { newNodeObj } = res
    objs.push(newNodeObj)
  }
  // 同 addChild，先触发事件再选择节点，undo 时才能恢复操作前的选中状态
  this.bus.fire('operation', {
    name: 'copyNodes',
    objs,
  })
  this.unselectNodes(this.currentNodes)
  this.selectNodes(objs.map(obj => this.findEle(obj.id)))
}

// Resolve a move up/down into a before/after move against the adjacent
// sibling. A move at the first/last sibling is a no-op instead of wrapping.
const getMoveTarget = function (mei: MindElixirInstance, obj: NodeObj, delta: -1 | 1): { to: NodeObj; type: 'before' | 'after' } | undefined {
  const siblings = obj.parent?.children as NodeObj[] | undefined
  if (siblings === undefined) return undefined
  // In SIDE layout root-level children are rendered into separate .lhs/.rhs
  // containers, so reordering must stay within the same-side siblings to keep
  // the data order consistent with the DOM order
  const sameSideOnly = mei.direction === SIDE && !obj.parent?.parent
  const match = (sibling: NodeObj) => !sameSideOnly || sibling.direction === obj.direction
  let prev: NodeObj | undefined
  let hit = false
  for (const sibling of siblings) {
    if (!match(sibling)) continue
    if (sibling === obj) {
      // moving up: swap with the previous same-side sibling, no-op at the first
      if (delta === -1) return prev ? { to: prev, type: 'before' } : undefined
      // moving down: keep scanning for the next same-side sibling
      hit = true
      continue
    }
    if (hit) return { to: sibling, type: 'after' }
    prev = sibling
  }
  return undefined
}

export const moveUpNode = function (this: MindElixirInstance, el?: Topic) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const obj = nodeEle.nodeObj
  if (!obj.parent) return
  const target = getMoveTarget(this, obj, -1)
  if (!target) return
  moveNode([nodeEle], target.type, this.findEle(target.to.id), this)
}

export const moveDownNode = function (this: MindElixirInstance, el?: Topic) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  const obj = nodeEle.nodeObj
  if (!obj.parent) return
  const target = getMoveTarget(this, obj, 1)
  if (!target) return
  moveNode([nodeEle], target.type, this.findEle(target.to.id), this)
}

export const removeNodes = function (this: MindElixirInstance, tpcs: Topic[]) {
  tpcs = unionTopics(tpcs)
  if (tpcs.length === 0) return
  for (const tpc of tpcs) {
    const nodeObj = tpc.nodeObj
    const siblingLength = removeNodeObj(nodeObj)
    removeNodeDom(tpc, siblingLength)
  }
  const last = tpcs[tpcs.length - 1]
  this.selectNode(this.findEle(last.nodeObj.parent!.id))
  this.linkDiv()
  // 删除关注的是删除后选择的节点，所以先选择节点，再触发 removeNodes 事件可以在事件中通过 currentNodes 获取之后选择的节点
  this.bus.fire('operation', {
    name: 'removeNodes',
    objs: tpcs.map(tpc => tpc.nodeObj),
  })
}

const moveNode = (from: Topic[], type: 'before' | 'after' | 'in', to: Topic, mei: MindElixirInstance) => {
  from = unionTopics(from)

  let toObj = to.nodeObj

  // Handle 'in' type: expand node if collapsed
  if (type === 'in' && toObj.expanded === false) {
    mei.expandNode(to, true) // rerender
    to = mei.findEle(toObj.id) as Topic
    toObj = to.nodeObj
  }

  if (type === 'after') {
    from = from.reverse()
  }

  const c = new Set<Children>()

  for (const f of from) {
    const obj = f.nodeObj
    moveNodeObj(type, obj, toObj)
    fillParent(mei.nodeData)

    if (type === 'in') {
      // For 'in' type: move as child
      const fromTop = f.parentElement
      const fromWrp = fromTop.parentElement
      // capture the source children container before addChildDom relocates the wrapper
      const fromChildren = fromWrp.parentElement
      addChildDom(mei, to, fromWrp)
      c.add(fromChildren)
    } else {
      // For 'before' and 'after' type: move as sibling
      rmSubline(f)
      const fromWrp = f.parentElement.parentNode
      c.add(fromWrp.parentElement)
      const toWrp = to.parentElement.parentNode
      toWrp.insertAdjacentElement(typeMap[type], fromWrp)
    }
  }

  // When nodes are moved away, the original parent node may become childless
  // In this case, we need to clean up the related DOM structure:
  // remove expander buttons and empty wrapper containers
  for (const item of c) {
    if (item.childElementCount === 0 && item.tagName !== 'ME-MAIN') {
      item.previousSibling.children[1]!.remove()
      item.remove()
    }
  }

  mei.linkDiv()
  // 这部分还是比较混乱，移动等 api 不会清除选择再重新选择，
  // 在 selectNodes 里 scrollIntoView 也没效果，所以在这里单独 scrollIntoView
  mei.scrollIntoView(from[from.length - 1])

  const eventName = type === 'before' ? 'moveNodeBefore' : type === 'after' ? 'moveNodeAfter' : 'moveNodeIn'
  mei.bus.fire('operation', {
    name: eventName,
    objs: from.map(f => f.nodeObj),
    toObj,
  })
}

export const moveNodeIn = function (this: MindElixirInstance, from: Topic[], to: Topic) {
  moveNode(from, 'in', to, this)
}

export const moveNodeBefore = function (this: MindElixirInstance, from: Topic[], to: Topic) {
  moveNode(from, 'before', to, this)
}

export const moveNodeAfter = function (this: MindElixirInstance, from: Topic[], to: Topic) {
  moveNode(from, 'after', to, this)
}

export const beginEdit = function (this: MindElixirInstance, el?: Topic) {
  const nodeEle = el || this.currentNode
  if (!nodeEle) return
  if (nodeEle.nodeObj.dangerouslySetInnerHTML) return
  this.editTopic(nodeEle)
}

export const setNodeTopic = function (this: MindElixirInstance, el: Topic, topic: string) {
  el.text.textContent = topic
  el.nodeObj.topic = topic
  this.linkDiv()
}
