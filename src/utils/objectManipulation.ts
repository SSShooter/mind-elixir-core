import type { NodeObj } from '../types'

const getSibling = (obj: NodeObj): { siblings: NodeObj[] | undefined; index: number } => {
  const siblings = obj.parent?.children as NodeObj[]
  const index = siblings?.indexOf(obj) ?? 0
  return { siblings, index }
}

export function removeNodeObj(obj: NodeObj) {
  const { siblings, index } = getSibling(obj)
  if (siblings === undefined) return 0
  // `indexOf` returns -1 when the parent pointer and the children array have
  // drifted apart; `splice(-1, 1)` would then silently drop the LAST sibling.
  if (index === -1) return siblings.length
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

/**
 * True when `to` is `from` itself or lives inside `from`'s subtree. Moving a
 * node under itself re-parents it as its own ancestor — the data becomes a
 * cycle and `fillParent` / `getData` blow up — so callers must reject it.
 * The visited set only guards against an already-corrupted tree whose parent
 * chain loops; a healthy chain strictly shrinks towards the root.
 */
export function isDescendantOrSelf(from: NodeObj, to: NodeObj): boolean {
  let cur: NodeObj | undefined = to
  const seen = new Set<NodeObj>()
  while (cur && !seen.has(cur)) {
    if (cur === from) return true
    seen.add(cur)
    cur = cur.parent
  }
  return false
}

/**
 * Move `from` relative to `to`. Returns `false` (data untouched) when the
 * target is `from` itself or one of its descendants — callers can use the
 * return value to detect a rejected move.
 */
export function moveNodeObj(type: 'in' | 'before' | 'after', from: NodeObj, to: NodeObj): boolean {
  // e.g. `moveNodesIn([A], A)` used to push A into its own children; for
  // before/after, `removeNodeObj` above made `indexOf(to)` return -1 and
  // `splice(-1, 0, from)` silently landed on the wrong slot.
  if (isDescendantOrSelf(from, to)) return false
  removeNodeObj(from)
  if (!to.parent?.parent) {
    from.direction = to.direction
  }
  if (type === 'in') {
    if (to.children) to.children.push(from)
    else to.children = [from]
  } else {
    if (from.direction !== undefined) from.direction = to.direction
    const { siblings, index } = getSibling(to)
    if (siblings === undefined) return false
    if (type === 'before') {
      siblings.splice(index, 0, from)
    } else {
      siblings.splice(index + 1, 0, from)
    }
  }
  return true
}
