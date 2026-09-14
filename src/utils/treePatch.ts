import type MindElixir from '../index'
import { DOWN, LEFT, RIGHT, SIDE } from '../const'
import type { Children, Expander, Parent, Topic, Wrapper } from '../types/dom'
import type { NodeObj } from '../types/index'
import { createExpander, shapeTpc } from './dom'
import { removeNodeDom } from './domManipulation'
import { deepClone } from './index'

/**
 * Structural diffing for `nodeData` trees.
 *
 * `refresh(data)` rebuilds the whole world: `layout()` empties `.me-nodes` and
 * `linkDiv()` empties `.lines`. That is the right trade for "install a new
 * document", but it used to be the only path undo/redo had, so every Ctrl+Z paid
 * O(nodes) DOM construction plus O(nodes) forced reflows — and dropped
 * selection, focus and edit state.
 *
 * The forward operations (`addChild` / `removeNodes` / `moveNodes*` /
 * `expandNode`) are already incremental. This module supplies the missing
 * primitive: `patch(target)` — walk the difference between the live tree and
 * any target tree, then apply it through those same incremental building
 * blocks. Undo/redo is one caller (`target` is `entry.before` / `entry.after`);
 * progressive output (streaming) is another (`target` is whatever the parser
 * has produced so far). A caller that lags behind simply diffs against the
 * newest target — intermediate states are never replayed.
 *
 * Two layers:
 * - `diffTree` / `applyDataOps` are **pure** (no DOM, no instance) and define
 *   the op semantics. They are what the property tests exercise.
 * - `applyTreeOps` performs the same op sequence against a live instance,
 *   mapping each op onto the existing incremental DOM helpers.
 */

/**
 * One step of a structural diff.
 *
 * Ops are emitted — and must be applied — in phase order (`insert` → `move` →
 * `remove` → `update`). Every `index` / `before` refers to the state *after* all
 * preceding ops have been applied, which is what makes a long batch stay
 * unambiguous — and always to the parent's `children` order, never to a rendered
 * container. The DOM layer maps that order onto whatever containers the layout
 * actually uses.
 */
export type TreeOp =
  /** Drop this node and everything below it. */
  | { type: 'remove'; id: string }
  /**
   * Attach a brand new subtree. `node` carries every descendant that is also
   * new; descendants that already exist in the live tree are pruned out and
   * arrive later as `move` ops (otherwise the id would exist twice).
   */
  | { type: 'insert'; parentId: string; index: number; node: NodeObj }
  /** Relocate an existing node — `before: null` appends to the end. */
  | { type: 'move'; id: string; parentId: string; before: string | null }
  /**
   * Reconcile the `children` **key**, not its contents.
   *
   * Exported data distinguishes a node that never had children (no key) from one
   * that lost its last child (`children: []`), and `getData()` shows the
   * difference. Structural ops can only shrink an array to `[]`, so removing the
   * key — or creating it — needs this explicit step. Contents are already
   * correct by the time it runs.
   */
  | { type: 'children'; id: string; present: boolean }
  /** Shallow field changes (topic / style / expanded / …). Never structural. */
  | { type: 'update'; id: string; patch: Partial<NodeObj> }
  /**
   * The difference is not expressible as local ops — the caller must fall back
   * to `refresh(target)`. Not a real op: the mere presence aborts the batch.
   */
  | { type: 'resync' }

export interface DiffOptions {
  /**
   * Set when `direction === SIDE`.
   *
   * **Ordering is not layout-dependent.** `diffTree` always reconciles the data
   * order and `applyTreeOps` derives each element's position from that order, so
   * one parent having two containers (`.lhs` / `.rhs`) needs no special case
   * here. Getting that split wrong is subtle: reconciling *per container* cannot
   * reach the target data order at all, because ordering each container says
   * nothing about how the two interleave in the shared `children` array.
   *
   * What *does* depend on the layout is `direction` itself. `layout()` assigns a
   * side to every main node that has none, alternating left/right as it walks —
   * a write into the caller's data that no local op can reproduce. A tree holding
   * an unassigned main node therefore degrades to `resync`.
   */
  sideLayout?: boolean
}

/**
 * Fields an `update` op may carry. `id` is identity, `children` is expressed by
 * the structural ops and `parent` is derived (`fillParent`). `direction` is
 * layout state rather than content, so `diffTree` decides case by case whether it
 * can travel as an update or needs a `resync`.
 */
const PATCH_KEYS = [
  'topic',
  'style',
  'tags',
  'icons',
  'hyperLink',
  'expanded',
  'image',
  'branchColor',
  'dangerouslySetInnerHTML',
  'note',
  'metadata',
  'direction',
] as const

/** Keys whose change requires the topic element to be rebuilt. */
const RENDER_KEYS = new Set<string>(['topic', 'style', 'tags', 'icons', 'hyperLink', 'expanded', 'image', 'branchColor', 'dangerouslySetInnerHTML'])

type Entry = { node: NodeObj; parentId: string | null; index: number }

/** A node viewed as a loose record — the key-driven parts of the diff need it. */
const loose = (node: NodeObj): Record<string, unknown> => node as unknown as Record<string, unknown>

/**
 * One pre-order pass building `id -> {node, parentId, index}`. Iterative on
 * purpose: a deep chain is cheap to build and expensive to blow the stack on.
 */
const indexTree = (root: NodeObj, into: Map<string, Entry>) => {
  const stack: [NodeObj, string | null, number][] = [[root, null, 0]]
  while (stack.length) {
    const [node, parentId, index] = stack.pop()!
    into.set(node.id, { node, parentId, index })
    const kids = node.children
    if (kids) {
      for (let i = kids.length - 1; i >= 0; i--) stack.push([kids[i], node.id, i])
    }
  }
}

const preorderOf = (root: NodeObj): string[] => {
  const out: string[] = []
  const stack: NodeObj[] = [root]
  while (stack.length) {
    const node = stack.pop()!
    out.push(node.id)
    const kids = node.children
    if (kids) for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i])
  }
  return out
}

/**
 * Shallow-with-one-level-recursion equality, used to decide whether a field
 * needs an `update`. Reference equality first (free, and the common case for
 * scalars), then a structural compare for the object-valued fields. A false
 * negative only costs an `update` that writes the value it already had.
 */
const sameValue = (a: unknown, b: unknown): boolean => {
  if (a === b) return true
  if (a === null || b === null || a === undefined || b === undefined) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

/**
 * Clone a patch **preserving `undefined` values**. `deepClone` is a JSON round
 * trip, so it would silently drop `expanded: undefined` and with it the only
 * evidence that a field was meant to be cleared.
 */
const clonePatch = (patch: Partial<NodeObj>): Partial<NodeObj> => {
  const out: Record<string, unknown> = {}
  for (const key in patch) {
    const value = (patch as Record<string, unknown>)[key]
    out[key] = value === undefined ? undefined : deepClone(value)
  }
  return out as Partial<NodeObj>
}

/**
 * Diff `current` against `target`.
 *
 * Emitted order is `insert` → `move` → `remove` → `update`, which is what makes
 * the indices unambiguous:
 * - moves run before removes so a node can be rescued out of a subtree that is
 *   about to disappear (the undo of `insertParent` is exactly that shape);
 * - inserts run first so a move can target a parent that did not exist yet
 *   (the redo of `insertParent`);
 * - updates run last, so an `expanded` change relocates/materialises children
 *   whose final structure is already in place.
 */
export function diffTree(current: NodeObj, target: NodeObj, options?: DiffOptions): TreeOp[] {
  if (current === target) return []
  // The root is the layout anchor: `layout()` clamps it between the two main
  // containers, so it can never be relocated or replaced by local ops.
  if (current.id !== target.id) return [{ type: 'resync' }]

  const cur = new Map<string, Entry>()
  const tgt = new Map<string, Entry>()
  indexTree(current, cur)
  indexTree(target, tgt)

  // `direction` decides which container a **main** node renders into, so a change
  // there is not expressible as a local op: the `move` that relocates the node
  // resolves its container in phase 2, long before an `update` could correct the
  // field in phase 4. Degrade rather than guess.
  //
  // On a deeper node the very same field is inert — nothing renders off it — so it
  // travels as an ordinary `update`. That distinction matters more than it looks:
  // `objectManipulation.moveNodeObj` copies the destination's side onto anything
  // moved *into* a main node, so treating every `direction` change as a `resync`
  // would send the undo of a plain drag back through a full rebuild.
  for (const [id, t] of tgt) {
    const c = cur.get(id)
    if (!c || c.node.direction === t.node.direction) continue
    if (c.parentId === current.id || t.parentId === current.id) return [{ type: 'resync' }]
  }

  // `layout()` renders a main node by writing its side, so a tree whose main
  // nodes have none is a document `refresh` would *normalise* on the way in.
  // Patching in place would skip that write and leave the two paths reporting
  // different data — `direction: undefined` here, `0`/`1` there.
  if (options?.sideLayout) {
    const unassigned = (tree: NodeObj) => (tree.children ?? []).some(child => child.direction !== LEFT && child.direction !== RIGHT)
    if (unassigned(current) || unassigned(target)) return [{ type: 'resync' }]
  }

  const removed = new Set<string>()
  for (const id of cur.keys()) if (!tgt.has(id)) removed.add(id)
  const added = new Set<string>()
  for (const id of tgt.keys()) if (!cur.has(id)) added.add(id)

  const ops: TreeOp[] = []

  // ---- simulation ------------------------------------------------------
  // A lightweight mirror of the id graph, mutated in lockstep with the emitted
  // ops. Every index/anchor is read off it, so the produced sequence stays
  // correct no matter how many ops accumulate.
  const simChildren = new Map<string, string[]>()
  const simParent = new Map<string, string | null>()

  const simInsertBefore = (id: string, parentId: string, anchor: string | null) => {
    let arr = simChildren.get(parentId)
    if (!arr) simChildren.set(parentId, (arr = []))
    const at = anchor === null ? arr.length : arr.indexOf(anchor)
    arr.splice(at < 0 ? arr.length : at, 0, id)
    simParent.set(id, parentId)
  }
  const simDetach = (id: string) => {
    const from = simParent.get(id)
    if (from === undefined || from === null) return
    const arr = simChildren.get(from)
    if (!arr) return
    const at = arr.indexOf(id)
    if (at > -1) arr.splice(at, 1)
  }
  const simRegister = (node: NodeObj) => {
    for (const child of node.children ?? []) {
      simInsertBefore(child.id, node.id, null)
      simRegister(child)
    }
  }
  simRegister(current)
  simParent.set(current.id, null)

  const preorder = preorderOf(target)

  // ---- phase 1: insert new subtrees ------------------------------------
  for (const id of preorder) {
    if (!added.has(id)) continue
    const entry = tgt.get(id)!
    const parentId = entry.parentId
    // A node whose parent is also new rides along inside the ancestor's payload
    // — emitting it separately would attach it twice.
    if (parentId === null || added.has(parentId)) continue

    // Keep only the new descendants; the pre-existing ones are relocated by
    // `move` ops in phase 2. An empty `children` array is preserved: it is a
    // real shape in exported data (a node that lost its last child keeps one),
    // and dropping it would make the patched tree differ from the snapshot.
    const prune = (node: NodeObj): NodeObj => {
      const out: Record<string, unknown> = {}
      const source = loose(node)
      for (const key in source) {
        if (key === 'children' || key === 'parent') continue
        out[key] = source[key]
      }
      if (node.children) out.children = node.children.filter(child => added.has(child.id)).map(prune)
      return out as unknown as NodeObj
    }
    const payload = deepClone(prune(entry.node))

    // Land the payload just before the first sibling that follows it in target
    // order and is already present, so phase 2 usually has nothing left to do.
    // `index` counts within the parent's **data** order; `applyTreeOps` re-derives
    // the element position from it, so a second container needs no case here.
    const siblings = simChildren.get(parentId) ?? []
    const present = new Set(siblings)
    const targetKids = tgt.get(parentId)!.node.children ?? []
    let anchor: string | null = null
    for (let j = entry.index + 1; j < targetKids.length; j++) {
      if (present.has(targetKids[j].id)) {
        anchor = targetKids[j].id
        break
      }
    }

    ops.push({
      type: 'insert',
      parentId,
      index: anchor === null ? siblings.length : siblings.indexOf(anchor),
      node: payload,
    })
    simInsertBefore(id, parentId, anchor)
    simRegister(payload)
  }

  // ---- phase 2: relocate + reorder -------------------------------------
  // Reverse cursor pass — the same keyed reconciliation the outliner uses.
  // Walking the target order back to front means the anchor is always a node
  // that has already been settled, and a node that already sits in the right
  // place produces no op at all.
  //
  // The pass runs over the **data** order of each parent, never over a rendered
  // container. `direction` only decides where an element is drawn, and drawing is
  // `applyTreeOps`'s business: with two containers per parent there is no
  // container-local order that can express the shared `children` array, so
  // reconciling per container cannot converge.
  const parents: string[] = []
  const seen = new Set<string>()
  for (const id of preorder) {
    const entry = tgt.get(id)!
    if (entry.parentId === null || seen.has(entry.parentId)) continue
    seen.add(entry.parentId)
    parents.push(entry.parentId)
  }

  for (const parentId of parents) {
    const desired = (tgt.get(parentId)!.node.children ?? []).filter(child => !removed.has(child.id)).map(child => child.id)
    const wanted = new Set(desired)

    const arr = simChildren.get(parentId) ?? []
    const keptNow = arr.filter(id => wanted.has(id))
    // Fast path: this parent is already in target order.
    if (keptNow.length === desired.length && keptNow.every((id, i) => id === desired[i])) continue

    let cursor: string | null = null
    for (let i = desired.length - 1; i >= 0; i--) {
      const id = desired[i]
      // "In place" means: a child of this parent already, with nothing but
      // settled nodes between it and the anchor.
      let inPlace = simParent.get(id) === parentId
      if (inPlace) {
        const here = simChildren.get(parentId) ?? []
        let next: string | null = null
        for (let j = here.indexOf(id) + 1; j < here.length; j++) {
          if (wanted.has(here[j])) {
            next = here[j]
            break
          }
        }
        inPlace = next === cursor
      }
      if (!inPlace) {
        ops.push({ type: 'move', id, parentId, before: cursor })
        simDetach(id)
        simInsertBefore(id, parentId, cursor)
      }
      cursor = id
    }
  }

  // ---- phase 3: remove --------------------------------------------------
  // Only the roots of the removed forest: dropping a node takes its whole
  // subtree with it, and every surviving descendant was moved out in phase 2.
  for (const id of preorderOf(current)) {
    if (!removed.has(id)) continue
    const parentId = cur.get(id)!.parentId
    if (parentId !== null && removed.has(parentId)) continue
    ops.push({ type: 'remove', id })
  }

  // ---- phase 4: field updates ------------------------------------------
  for (const id of preorder) {
    const c = cur.get(id)
    if (!c) continue
    const t = tgt.get(id)!
    // Key presence first: by now the contents have converged, so this only has
    // to decide whether an emptied array should keep existing.
    const targetHasChildren = 'children' in t.node
    if (targetHasChildren !== 'children' in c.node) {
      ops.push({ type: 'children', id, present: targetHasChildren })
    }
    let patch: Record<string, unknown> | null = null
    for (const key of PATCH_KEYS) {
      if (!sameValue(loose(c.node)[key], loose(t.node)[key])) {
        if (!patch) patch = {}
        patch[key] = loose(t.node)[key]
      }
    }
    if (patch) ops.push({ type: 'update', id, patch: clonePatch(patch as Partial<NodeObj>) })
  }

  return ops
}

/**
 * Apply ops to a plain tree — the reference implementation of the op semantics.
 * `applyTreeOps` below mirrors it against the DOM. `root` is mutated in place.
 */
export function applyDataOps(root: NodeObj, ops: TreeOp[]): NodeObj {
  const byId = new Map<string, NodeObj>()

  const unindex = (node: NodeObj) => {
    byId.delete(node.id)
    for (const child of node.children ?? []) unindex(child)
  }
  const index = (node: NodeObj, parent: NodeObj | undefined) => {
    node.parent = parent
    byId.set(node.id, node)
    for (const child of node.children ?? []) index(child, node)
  }
  const detach = (node: NodeObj) => {
    const parent = node.parent
    if (!parent?.children) return
    const at = parent.children.indexOf(node)
    if (at > -1) parent.children.splice(at, 1)
  }
  index(root, undefined)

  for (const op of ops) {
    if (op.type === 'resync') break
    if (op.type === 'insert') {
      const parent = byId.get(op.parentId)
      if (!parent) continue
      const node = deepClone(op.node)
      if (!parent.children) parent.children = []
      parent.children.splice(Math.min(Math.max(op.index, 0), parent.children.length), 0, node)
      index(node, parent)
    } else if (op.type === 'remove') {
      const node = byId.get(op.id)
      if (!node) continue
      detach(node)
      unindex(node)
    } else if (op.type === 'move') {
      const node = byId.get(op.id)
      const to = byId.get(op.parentId)
      if (!node || !to) continue
      detach(node)
      if (!to.children) to.children = []
      const at = op.before === null ? -1 : to.children.findIndex(child => child.id === op.before)
      if (at < 0) to.children.push(node)
      else to.children.splice(at, 0, node)
      node.parent = to
    } else if (op.type === 'children') {
      const node = byId.get(op.id)
      if (!node) continue
      if (op.present) {
        if (!node.children) node.children = []
      } else if (node.children && node.children.length === 0) {
        delete node.children
      }
    } else {
      const node = byId.get(op.id)
      if (!node) continue
      const patch = clonePatch(op.patch) as Record<string, unknown>
      const target = loose(node)
      for (const key in patch) target[key] = patch[key]
    }
  }
  return root
}

/* ---------------------------------------------------------------------- *
 * DOM side
 * ---------------------------------------------------------------------- */

/** Same as `rmSubline` in nodeOperation, inlined to avoid the import cycle. */
const dropSublines = (tpc: Topic) => {
  const mainNode = tpc.parentElement?.parentElement as Wrapper | undefined
  const last = mainNode?.lastElementChild
  if (last?.tagName === 'svg') last.remove()
}

/** True while every ancestor of `node` is expanded — i.e. it has a DOM element. */
const isRendered = (node: NodeObj): boolean => {
  let parent = node.parent
  while (parent) {
    if (parent.expanded === false) return false
    parent = parent.parent
  }
  return true
}

/** Assign `parent` pointers over a subtree (what `fillParent` recurses over). */
const fillParents = (node: NodeObj, parent: NodeObj | undefined) => {
  node.parent = parent
  for (const child of node.children ?? []) fillParents(child, node)
}

/** The container holding the children of a main node, by layout + direction. */
const mainContainerOf = function (mei: MindElixir, node: NodeObj): Element | null {
  if (mei.direction === SIDE) {
    return mei.container.querySelector(node.direction === LEFT ? '.lhs' : '.rhs')
  }
  if (mei.direction === DOWN) {
    // `me-nodes` carries the `down` class too, so qualify with `.me-main`
    return mei.container.querySelector('.me-main.down')
  }
  return mei.container.querySelector(mei.direction === LEFT ? '.me-main.lhs' : '.me-main.rhs')
}

/** `.me-children` of an ordinary node, created on demand (mirrors addChildDom). */
const ensureChildren = function (mei: MindElixir, parentTpc: Topic, parentNode: NodeObj): Children | null {
  const top = parentTpc.parentElement as Parent | null
  if (!top) return null
  if (!top.children[1]) {
    const children = mei.createChildren([])
    top.appendChild(createExpander(parentNode.expanded))
    top.insertAdjacentElement('afterend', children)
    return children
  }
  const next = top.nextElementSibling as Children | null
  if (next?.classList.contains('me-children')) return next
  // Expander present but the children container is gone: the node is collapsed,
  // and its DOM is rebuilt from data when it expands again.
  return null
}

/**
 * What should `node` be inserted *before* inside `container`?
 *
 * The op carries a global data anchor, but the DOM is partitioned: in SIDE
 * layout a main node's children are split across `.lhs` and `.rhs`, and even in
 * a single-container layout a collapsed sibling has no element at all. So the
 * only sound reference is the next sibling that is rendered *and* lives in this
 * same container — anything else would drag the node into the wrong parent or
 * the wrong side.
 *
 * `null` means "append", which is right for both the first and the last
 * position: the two differ only in whether the container was empty.
 */
const nextSiblingWrapper = (container: Element, node: NodeObj, parentNode: NodeObj, dom: Map<string, Topic>): Node | null => {
  const kids = parentNode.children ?? []
  for (let i = kids.indexOf(node) + 1; i < kids.length; i++) {
    const wrapper = dom.get(kids[i].id)?.parentElement?.parentElement as Wrapper | undefined
    if (wrapper?.parentElement === container) return wrapper
  }
  return null
}

/** Relocate `wrapper` to its data-implied slot, skipping a no-op move. */
const placeWrapper = (container: Element, wrapper: Wrapper, ref: Node | null) => {
  // Re-inserting a node directly before its current next sibling is a no-op by
  // spec, but it still costs a mutation record and a style invalidation — and
  // most of a batch's `move` ops are exactly that shape.
  if (wrapper.parentElement === container && wrapper.nextElementSibling === ref) return
  container.insertBefore(wrapper, ref)
}

/**
 * Mirror of `expandNode`'s DOM work, minus the two things `refresh` never did:
 * the per-node `linkDiv` and the viewport drift compensation (`this.move`).
 * Redrawing once at the end of the batch is cheaper and — since undo/redo must
 * behave like `refresh` — also the parity-correct choice.
 */
const setExpandedDom = function (mei: MindElixir, tpc: Topic, node: NodeObj, expanded: boolean, dom: Map<string, Topic>) {
  const parent = tpc.parentNode as Parent
  const expander = parent.children[1] as Expander | undefined
  if (expander) {
    expander.expanded = expanded
    expander.className = 'me-epd' + (expanded ? ' minus' : '')
  }
  dropSublines(tpc)
  const wrapper = parent.parentNode as Wrapper
  if (expanded) {
    const children = mei.createChildren((node.children ?? []).map(child => mei.createWrapper(child).grp))
    wrapper.appendChild(children)
    for (const el of children.querySelectorAll<Topic>('.me-tpc')) dom.set(el.nodeObj.id, el)
  } else {
    const children = wrapper.children[1] as Children | undefined
    if (children && children.classList.contains('me-children')) {
      for (const el of children.querySelectorAll<Topic>('.me-tpc')) dom.delete(el.nodeObj.id)
      children.remove()
    }
  }
}

/**
 * Drop the expander and the children container of a node that just lost its last
 * child. Mirrors the cleanup loop at the end of `nodeOperation.moveNode`.
 */
const pruneEmptyParent = (tpc: Topic, dom: Map<string, Topic>) => {
  const top = tpc.parentElement as Parent | null
  const wrapper = top?.parentNode as Wrapper | undefined
  const children = wrapper?.children[1] as Children | undefined
  if (!children?.classList.contains('me-children')) return
  for (const el of children.querySelectorAll<Topic>('.me-tpc')) dom.delete(el.nodeObj.id)
  const expander = (children.previousElementSibling as Parent | null)?.children[1] as Expander | undefined
  expander?.remove()
  children.remove()
}

/**
 * Apply a diff to a live instance.
 *
 * Returns `false` when the op list contains a `resync` — the caller then hands
 * the target to `refresh()` instead, which is exactly today's behaviour.
 *
 * `nodeData` is mutated **in place**: its identity is what the outliner binds to
 * and what focus mode aliases (`nodeDataBackup`), so replacing it would break
 * both.
 *
 * Data and DOM are indexed separately. A node hidden inside a collapsed ancestor
 * has no element but its data still has to move; looking nodes up through the
 * DOM alone would silently drop every op that targeted one.
 */
export const applyTreeOps = function (mei: MindElixir, ops: TreeOp[]): boolean {
  for (const op of ops) if (op.type === 'resync') return false
  const root = mei.nodeData
  if (!root) return false

  /** id -> live node, for every node in the tree (rendered or not). */
  const live = new Map<string, NodeObj>()
  /** id -> `.me-tpc`, only for nodes that currently have an element. */
  const dom = new Map<string, Topic>()

  const indexNode = (node: NodeObj, parent: NodeObj | undefined) => {
    node.parent = parent
    live.set(node.id, node)
    for (const child of node.children ?? []) indexNode(child, node)
  }
  const unindexNode = (node: NodeObj) => {
    live.delete(node.id)
    for (const child of node.children ?? []) unindexNode(child)
  }
  const indexDom = (scope: Element) => {
    for (const tpc of scope.querySelectorAll<Topic>('.me-tpc')) dom.set(tpc.nodeObj.id, tpc)
  }

  indexNode(root, undefined)
  indexDom(mei.map)

  for (const op of ops) {
    if (op.type === 'insert') {
      const parentNode = live.get(op.parentId)
      if (!parentNode) continue

      const fresh = deepClone(op.node)
      if (!parentNode.children) parentNode.children = []
      parentNode.children.splice(Math.min(Math.max(op.index, 0), parentNode.children.length), 0, fresh)
      indexNode(fresh, parentNode)

      const parentTpc = dom.get(op.parentId)
      let container: Element | null = null
      if (parentNode.id === root.id) {
        container = mainContainerOf(mei, fresh)
      } else if (parentTpc && parentNode.expanded !== false && isRendered(parentNode)) {
        container = ensureChildren(mei, parentTpc, parentNode)
      }
      // No container means they are hidden inside a collapsed ancestor (or a
      // collapsed parent): data only, materialised by the expand in phase 4.
      if (!container) continue

      const { grp } = mei.createWrapper(fresh)
      placeWrapper(container, grp as unknown as Wrapper, nextSiblingWrapper(container, fresh, parentNode, dom))
      indexDom(grp)
    } else if (op.type === 'move') {
      const node = live.get(op.id)
      const parentNode = live.get(op.parentId)
      if (!node || !parentNode) continue

      const from = node.parent
      const fromTpc = from ? dom.get(from.id) : undefined
      const fromWasRendered = from ? isRendered(from) : false
      if (from?.children) {
        const at = from.children.indexOf(node)
        if (at > -1) from.children.splice(at, 1)
      }
      if (!parentNode.children) parentNode.children = []
      const anchorNode = op.before === null ? undefined : parentNode.children.find(child => child.id === op.before)
      const at = anchorNode ? parentNode.children.indexOf(anchorNode) : -1
      if (at < 0) parentNode.children.push(node)
      else parentNode.children.splice(at, 0, node)
      node.parent = parentNode

      // The source may have just lost its last child, which makes its expander
      // and children container meaningless (`nodeOperation.moveNode` does the
      // same cleanup).
      const fromEmptied = !!from && !!fromTpc && fromWasRendered && (from.children?.length ?? 0) === 0

      const tpc = dom.get(op.id)
      const wrapper = tpc?.parentElement?.parentElement as Wrapper | undefined
      const parentTpc = dom.get(op.parentId)
      if (!tpc || !wrapper) {
        if (fromEmptied) pruneEmptyParent(fromTpc!, dom)
        continue
      }
      if (parentNode.id !== root.id && (!parentTpc || parentNode.expanded === false || !isRendered(parentNode))) {
        if (fromEmptied) pruneEmptyParent(fromTpc!, dom)
        continue
      }

      // The destination container comes from the node's own `direction` (a
      // direction change is a `resync`, so it cannot shift mid-batch), while the
      // position inside it is re-derived from the data order. Using the op's
      // anchor as the DOM reference instead would be wrong in SIDE layout: the
      // anchor may sit in the other container, and inserting there would move the
      // node to the wrong side of the root.
      const container = parentNode.id === root.id ? mainContainerOf(mei, node) : ensureChildren(mei, parentTpc!, parentNode)
      if (container) {
        placeWrapper(container, wrapper, nextSiblingWrapper(container, node, parentNode, dom))
      }
      // Prune the source *after* the element has left it. Doing it first wipes
      // the moved node's index entry — it is still inside that container at that
      // point — and the relocation above would then silently be skipped, leaving
      // the node with data but no element.
      if (fromEmptied) pruneEmptyParent(fromTpc!, dom)
    } else if (op.type === 'remove') {
      const node = live.get(op.id)
      if (!node) continue
      const parent = node.parent
      const tpc = dom.get(op.id)
      // `siblingLength` is read *after* this node leaves, so the node that empties
      // a parent is also the one that collects the expander and the container.
      const siblings = parent?.children ? parent.children.length - 1 : 0
      if (tpc && isRendered(node)) {
        dropSublines(tpc)
        removeNodeDom(tpc, siblings)
        for (const el of tpc.querySelectorAll<Topic>('.me-tpc')) dom.delete(el.nodeObj.id)
      }
      dom.delete(op.id)
      if (parent?.children) {
        const at = parent.children.indexOf(node)
        if (at > -1) parent.children.splice(at, 1)
      }
      unindexNode(node)
    } else if (op.type === 'children') {
      const node = live.get(op.id)
      if (!node) continue
      if (op.present) {
        if (!node.children) node.children = []
      } else if (node.children && node.children.length === 0) {
        delete node.children
      }
    } else if (op.type === 'update') {
      const node = live.get(op.id)
      if (!node) continue
      const patch = op.patch as Record<string, unknown>
      let shape = false
      for (const key in patch) {
        if (key === 'children' || key === 'parent' || key === 'expanded') continue
        ;(node as unknown as Record<string, unknown>)[key] = patch[key] === undefined ? undefined : deepClone(patch[key])
        if (RENDER_KEYS.has(key)) shape = true
      }

      const tpc = dom.get(op.id)
      if (tpc && shape) {
        // `shapeTpc` writes every key of `nodeObj.style` onto the topic, so an
        // inline style the target dropped has to be cleared first.
        if ('style' in patch) tpc.removeAttribute('style')
        shapeTpc.call(mei, tpc, node)
      }
      if (!('expanded' in patch)) continue

      const changed = (node.expanded === false) !== (patch.expanded === false)
      node.expanded = patch.expanded as boolean | undefined
      if (!changed) continue

      // Deliberately no `expandNode` fire. A bound outliner learns about a restore
      // through the history stack it shares with the map — "map operations, undo,
      // redo and clear all land here" (`Outliner.ts:151`); its `expandNode`
      // listener is there for SILENT expands, which record nothing on their own.
      // `refresh` fires nothing at this point either, and inventing a signal here
      // would be a deviation from the path this one claims to be
      // indistinguishable from. Measured both ways: the outliner spec (7/7) and
      // `probe-sync-counts.mjs` (22/22, incl. "undo of a fold = 1 render") pass
      // identically whether or not this fires.
      if (!tpc || !node.children?.length || !isRendered(node)) continue
      setExpandedDom(mei, tpc, node, node.expanded !== false, dom)
    }
  }

  fillParents(root, undefined)
  // Redraw whenever anything was applied — same trigger as `refresh`, so the two
  // paths stay observably identical. An empty op list means the document already
  // matched, and then there is nothing to draw.
  if (ops.length) mei.linkDiv()
  return true
}
