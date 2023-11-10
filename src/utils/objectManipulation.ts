import type { NodeObj } from '../types'

const getSibling = (obj: NodeObj): { siblings: NodeObj[]; index: number } => {
  const siblings = obj.parent?.children as NodeObj[]
  const index = siblings.indexOf(obj)
  return { siblings, index }
}

export function moveUpObj(obj: NodeObj) {
  const { siblings, index } = getSibling(obj)
  const t = siblings[index]
  if (index === 0) {
    siblings[index] = siblings[siblings.length - 1]
    siblings[siblings.length - 1] = t
  } else {
    siblings[index] = siblings[index - 1]
    siblings[index - 1] = t
  }
}

export function moveDownObj(obj: NodeObj) {
  const { siblings, index } = getSibling(obj)
  const t = siblings[index]
  if (index === siblings.length - 1) {
    siblings[index] = siblings[0]
    siblings[0] = t
  } else {
    siblings[index] = siblings[index + 1]
    siblings[index + 1] = t
  }
}

export function removeNodeObj(obj: NodeObj) {
  const { siblings, index } = getSibling(obj)
  siblings.splice(index, 1)
  return siblings.length
}

export function insertNodeObj(obj: NodeObj, newObj: NodeObj) {
  const { siblings, index } = getSibling(obj)
  siblings.splice(index + 1, 0, newObj)
}

export function insertBeforeNodeObj(obj: NodeObj, newObj: NodeObj) {
  const { siblings, index } = getSibling(obj)
  siblings.splice(index, 0, newObj)
}

export function insertParentNodeObj(obj: NodeObj, newObj: NodeObj) {
  const { siblings, index } = getSibling(obj)
  siblings[index] = newObj
  newObj.children = [obj]
}

export function moveNodeObj(from: NodeObj, to: NodeObj) {
  removeNodeObj(from)
  if (to.children) to.children.push(from)
  else to.children = [from]
}

export function moveNodeBeforeObj(from: NodeObj, to: NodeObj) {
  if (from.direction !== undefined) from.direction = to.direction
  removeNodeObj(from)
  const { siblings, index } = getSibling(to)
  siblings.splice(index, 0, from)
}

export function moveNodeAfterObj(from: NodeObj, to: NodeObj) {
  if (from.direction !== undefined) from.direction = to.direction
  removeNodeObj(from)
  const { siblings, index } = getSibling(to)
  siblings.splice(index + 1, 0, from)
}
