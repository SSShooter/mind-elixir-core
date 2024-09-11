import type { NodeObj } from '../types'

const getSibling = (obj: NodeObj): { siblings: NodeObj[] | undefined; index: number } => {
  const siblings = obj.parent?.children as NodeObj[]
  const index = siblings?.indexOf(obj) ?? 0
  return { siblings, index }
}

export function moveUpObj(obj: NodeObj) {
  const { siblings, index } = getSibling(obj)
  if (siblings === undefined) return
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
  if (siblings === undefined) return
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
  if (siblings === undefined) return 0
  siblings.splice(index, 1)
  return siblings.length
}

export function insertNodeObj(newObj: NodeObj, type: 'before' | 'after', obj: NodeObj) {
  const { siblings, index } = getSibling(obj)
  if (siblings === undefined) return
  if (type === 'before') {
    siblings.splice(index, 0, newObj)
  } else {
    siblings.splice(index + 1, 0, newObj)
  }
}

export function insertParentNodeObj(obj: NodeObj, newObj: NodeObj) {
  const { siblings, index } = getSibling(obj)
  if (siblings === undefined) return
  siblings[index] = newObj
  newObj.children = [obj]
}

export function moveNodeObj(type: 'in' | 'before' | 'after', from: NodeObj, to: NodeObj) {
  removeNodeObj(from)
  if (type === 'in') {
    if (to.children) to.children.push(from)
    else to.children = [from]
  } else {
    if (from.direction !== undefined) from.direction = to.direction
    const { siblings, index } = getSibling(to)
    if (siblings === undefined) return
    if (type === 'before') {
      siblings.splice(index, 0, from)
    } else {
      siblings.splice(index + 1, 0, from)
    }
  }
}
