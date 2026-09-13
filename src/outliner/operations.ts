import type { OutlineItem } from './types'

/**
 * Pure tree operations for the outline.
 *
 * Every helper takes the tree, returns a NEW tree (structural sharing is not
 * attempted — the callers always work on a JSON clone and commit the result as
 * one history entry). Operations are keyed by `targetId`, not by node
 * reference, because the draft is a fresh clone of the live data.
 */

/** Shallow-ish structural clone so mutations never touch the caller's tree. */
const cloneTree = (items: OutlineItem[]): OutlineItem[] => items.map(item => ({ ...item, children: cloneTree(item.children) }))

/** Walk every node, calling `visit` with the node and its parent list. */
const walk = (
  items: OutlineItem[],
  visit: (item: OutlineItem, siblings: OutlineItem[], index: number, parent: OutlineItem | null) => void,
  parent: OutlineItem | null = null
): void => {
  items.forEach((item, index) => {
    visit(item, items, index, parent)
    walk(item.children, visit, item)
  })
}

/** Locate a node and its containing sibling list. */
const locate = (
  items: OutlineItem[],
  id: string
): { item: OutlineItem; siblings: OutlineItem[]; index: number; parent: OutlineItem | null } | null => {
  let found: { item: OutlineItem; siblings: OutlineItem[]; index: number; parent: OutlineItem | null } | null = null
  walk(items, (item, siblings, index, parent) => {
    if (!found && item.id === id) found = { item, siblings, index, parent }
  })
  return found
}

/** Insert `newItem` right after `targetId`. */
export function addSiblingOperation(items: OutlineItem[], targetId: string, parentId: string | undefined, newItem: OutlineItem): OutlineItem[] {
  const draft = cloneTree(items)
  const hit = locate(draft, targetId)
  if (!hit) return items
  hit.siblings.splice(hit.index + 1, 0, newItem)
  return draft
}

/** Insert `newItem` right before `targetId`. */
export function addSiblingBeforeOperation(items: OutlineItem[], targetId: string, parentId: string | undefined, newItem: OutlineItem): OutlineItem[] {
  const draft = cloneTree(items)
  const hit = locate(draft, targetId)
  if (!hit) return items
  hit.siblings.splice(hit.index, 0, newItem)
  return draft
}

/** Demote `targetId` under its previous sibling. */
export function indentOperation(items: OutlineItem[], targetId: string, parentId: string | undefined, topic?: string): OutlineItem[] {
  const draft = cloneTree(items)
  const hit = locate(draft, targetId)
  if (!hit || hit.index === 0) return items
  const [node] = hit.siblings.splice(hit.index, 1)
  if (topic !== undefined) node.topic = topic
  const prevSibling = hit.siblings[hit.index - 1]
  prevSibling.children.push(node)
  if (prevSibling.expanded === false) prevSibling.expanded = true
  return draft
}

/** Swap `targetId` with its previous sibling. */
export function moveUpOperation(items: OutlineItem[], targetId: string, parentId: string | undefined): OutlineItem[] {
  const draft = cloneTree(items)
  const hit = locate(draft, targetId)
  if (!hit || hit.index === 0) return items
  const [node] = hit.siblings.splice(hit.index, 1)
  hit.siblings.splice(hit.index - 1, 0, node)
  return draft
}

/** Swap `targetId` with its next sibling. */
export function moveDownOperation(items: OutlineItem[], targetId: string, parentId: string | undefined): OutlineItem[] {
  const draft = cloneTree(items)
  const hit = locate(draft, targetId)
  if (!hit || hit.index >= hit.siblings.length - 1) return items
  const [node] = hit.siblings.splice(hit.index, 1)
  hit.siblings.splice(hit.index + 1, 0, node)
  return draft
}

/** Promote `targetId` to its parent's level, right after the parent. */
export function outdentOperation(items: OutlineItem[], targetId: string, parentId: string, topic: string): OutlineItem[] {
  const draft = cloneTree(items)
  const hit = locate(draft, targetId)
  if (!hit || !hit.parent) return items
  const parentHit = locate(draft, hit.parent.id)
  if (!parentHit) return items
  const [node] = hit.siblings.splice(hit.index, 1)
  node.topic = topic
  parentHit.siblings.splice(parentHit.index + 1, 0, node)
  return draft
}

/** Drag & drop move: relocate `draggedId` relative to `targetId`. */
export function moveToOperation(
  items: OutlineItem[],
  draggedId: string,
  targetId: string,
  position: 'before' | 'after' | 'inside'
): OutlineItem[] {
  if (draggedId === targetId) return items
  const draft = cloneTree(items)
  // A node cannot be moved into its own subtree
  const draggedHit = locate(draft, draggedId)
  if (!draggedHit) return items
  if (locate(draggedHit.item.children, targetId)) return items

  const targetHit = locate(draft, targetId)
  if (!targetHit) return items

  const [node] = draggedHit.siblings.splice(draggedHit.index, 1)

  if (position === 'inside') {
    targetHit.item.children.push(node)
    if (targetHit.item.expanded === false) targetHit.item.expanded = true
  } else {
    // Re-locate: removal above may have shifted the target's sibling list
    const refreshed = locate(draft, targetId)
    if (!refreshed) return items
    refreshed.siblings.splice(position === 'before' ? refreshed.index : refreshed.index + 1, 0, node)
  }
  return draft
}

/** Find an item anywhere in the tree. */
export function findItemById(items: OutlineItem[], id: string): OutlineItem | null {
  for (const item of items) {
    if (item.id === id) return item
    const found = findItemById(item.children, id)
    if (found) return found
  }
  return null
}

/** Path from root to the node, for the breadcrumb. */
export function findPathToNode(
  items: OutlineItem[],
  targetId: string,
  path: Array<{ id: string; topic: string }> = []
): Array<{ id: string; topic: string }> | null {
  for (const item of items) {
    const next = [...path, { id: item.id, topic: item.topic }]
    if (item.id === targetId) return next
    const found = findPathToNode(item.children, targetId, next)
    if (found) return found
  }
  return null
}
