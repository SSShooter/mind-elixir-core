import { expect, test } from '@playwright/test'
import type { NodeObj } from '../src/types'
import { type TreeOp, applyDataOps, diffTree } from '../src/utils/treePatch'

/**
 * Property tests for `diffTree` / `applyDataOps`.
 *
 * These run in Node: no page, no instance, no DOM. The contract they pin down is
 * the whole point of the module — for ANY pair of trees over a shared id space,
 *
 *     applyDataOps(clone(current), diffTree(current, target)) ≡ target
 *
 * which is exactly what undo/redo and streaming both need.
 */

/** xorshift32 — reproducible without pulling in a dependency. */
function makeRandom(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s >>>= 0
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}

const pick = <T>(rand: () => number, arr: T[]): T => arr[Math.floor(rand() * arr.length)]

/** JSON-shaped view of a tree: `parent` pointers dropped, `undefined` dropped. */
const plain = (tree: NodeObj): unknown => JSON.parse(JSON.stringify(tree, (key, value) => (key === 'parent' ? undefined : value)))

const clone = (tree: NodeObj): NodeObj => JSON.parse(JSON.stringify(tree))

const walk = (tree: NodeObj, visit: (node: NodeObj, parent: NodeObj | undefined) => void, parent?: NodeObj) => {
  visit(tree, parent)
  for (const child of tree.children ?? []) walk(child, visit, tree)
}

const nodesOf = (tree: NodeObj): NodeObj[] => {
  const out: NodeObj[] = []
  walk(tree, node => out.push(node))
  return out
}

const parentOf = (tree: NodeObj, id: string): NodeObj | undefined => {
  let found: NodeObj | undefined
  walk(tree, (node, parent) => {
    if (node.id === id) found = parent
  })
  return found
}

/** Every id in the subtree rooted at `node`, including `node`. */
const subtreeIds = (node: NodeObj): Set<string> => new Set(nodesOf(node).map(n => n.id))

function buildTree(rand: () => number, size: number): NodeObj {
  const nodes: NodeObj[] = [{ id: 'n0', topic: 'root' }]
  for (let i = 1; i < size; i++) {
    const parent = nodes[Math.floor(rand() * nodes.length)]
    const node: NodeObj = { id: `n${i}`, topic: `t${i}` }
    // A main node always carries a side once `layout()` has run, and `diffTree`
    // refuses to invent one (see `DiffOptions.sideLayout`) — so the generator has
    // to produce documents a real instance could actually be holding.
    if (parent === nodes[0]) node.direction = rand() < 0.5 ? 0 : 1
    const roll = rand()
    if (roll < 0.12) node.style = { color: '#ff0000', fontWeight: 'bold' }
    else if (roll < 0.2) node.expanded = false
    else if (roll < 0.24) node.tags = ['a', 'b']
    if (!parent.children) parent.children = []
    parent.children.push(node)
    nodes.push(node)
  }
  return nodes[0]
}

/**
 * Apply one random mutation. Returns whether the mutation makes the pair
 * non-diffable (a `direction` change, which `diffTree` must report as `resync`).
 */
function mutate(rand: () => number, tree: NodeObj, next: { id: number }): boolean {
  // Walk with parent tracking rather than reading `node.parent`: the generated
  // trees are plain (`getData()` shape), so they carry no pointers.
  const pairs: { node: NodeObj; parent?: NodeObj }[] = []
  walk(tree, (node, parent) => pairs.push({ node, parent }))
  const all = pairs.map(pair => pair.node)
  const nonRoot = pairs.filter(pair => pair.parent !== undefined)
  const roll = rand()

  if (roll < 0.22 && nonRoot.length) {
    const from = pick(rand, nonRoot)
    const forbidden = subtreeIds(from.node)
    const destinations = all.filter(node => !forbidden.has(node.id))
    if (!destinations.length) return false
    const to = pick(rand, destinations)
    from.parent!.children = from.parent!.children!.filter(child => child !== from.node)
    if (!to.children) to.children = []
    to.children.splice(Math.floor(rand() * (to.children.length + 1)), 0, from.node)
    // Landing on the root makes the node a *main* node, and main nodes have a
    // side — this is what `layout()` / `judgeDirection` guarantee on the tree a
    // real instance hands to the diff.
    if (to.id === tree.id) from.node.direction = rand() < 0.5 ? 0 : 1
    return false
  }

  if (roll < 0.4 && nonRoot.length) {
    const victim = pick(rand, nonRoot)
    victim.parent!.children = victim.parent!.children!.filter(child => child !== victim.node)
    return false
  }

  if (roll < 0.55) {
    const parent = pick(rand, all)
    if (!parent.children) parent.children = []
    const fresh: NodeObj = { id: `x${next.id++}`, topic: `new${next.id}` }
    if (parent.id === tree.id) fresh.direction = rand() < 0.5 ? 0 : 1
    if (rand() < 0.3) {
      fresh.children = [{ id: `y${next.id++}`, topic: 'grandchild' }]
    }
    parent.children.splice(Math.floor(rand() * (parent.children.length + 1)), 0, fresh)
    return false
  }

  if (roll < 0.7) {
    pick(rand, all).topic = `edited${Math.floor(rand() * 1000)}`
    return false
  }

  if (roll < 0.8) {
    const node = pick(rand, all)
    node.expanded = node.expanded === false ? true : false
    return false
  }

  if (roll < 0.86) {
    const node = pick(rand, all)
    if (node.style) delete node.style
    else node.style = { color: '#00ff00' }
    return false
  }

  if (roll < 0.92) {
    const node = pick(rand, all)
    if (node.tags) delete node.tags
    else node.tags = ['x']
    return false
  }

  if (roll < 0.96 && nonRoot.length) {
    // `moveNodeObj` hands a stale side to anything moved into a main node, so a
    // `direction` can appear (or go away) on a node that is not a main node — and
    // the diff has to carry that as a plain update. On a main node the same edit
    // is a genuine resync.
    const node = pick(rand, nonRoot).node
    if (node.direction === undefined) node.direction = rand() < 0.5 ? 0 : 1
    else delete node.direction
    return false
  }

  // A direction change is only meaningful for main nodes; `diffTree` must refuse
  // to express it and let the caller fall back to `refresh`.
  const main = tree.children ?? []
  if (!main.length) return false
  const node = pick(rand, main)
  node.direction = node.direction === 0 ? 1 : 0
  return true
}

const apply = (current: NodeObj, target: NodeObj, options?: { sideLayout?: boolean }): { ops: TreeOp[]; result: NodeObj } => {
  const copy = clone(current)
  const ops = diffTree(copy, clone(target), options)
  if (ops.some(op => op.type === 'resync')) return { ops, result: copy }
  applyDataOps(copy, ops)
  return { ops, result: copy }
}

/**
 * The documented resync rule, restated independently of the implementation: a
 * different root, or a node present in both that is a **main** node in one of the
 * two trees and has a different `direction`.
 *
 * Two qualifications are load-bearing, and both are about the rule being exact
 * rather than a safe over-approximation:
 * - a direction change on a node that was *removed* is unobservable;
 * - a direction change on a node that is not a main node in either tree is inert
 *   (nothing renders off it), so it must NOT force a resync.
 */
const idsOfMainNodes = (tree: NodeObj): Set<string> => new Set((tree.children ?? []).map(child => child.id))

const needsResync = (current: NodeObj, target: NodeObj): boolean => {
  if (current.id !== target.id) return true
  const mainBefore = idsOfMainNodes(current)
  const mainAfter = idsOfMainNodes(target)
  const before = new Map<string, NodeObj>()
  walk(current, node => before.set(node.id, node))
  let diff = false
  walk(target, node => {
    const other = before.get(node.id)
    if (!other || other.direction === node.direction) return
    if (mainBefore.has(node.id) || mainAfter.has(node.id)) diff = true
  })
  return diff
}

/**
 * The second half of the documented resync rule, restated independently: in SIDE
 * layout `layout()` writes a side onto every main node that lacks one, so a tree
 * holding such a node is a document `refresh` would *normalise* — not something a
 * local patch can reach.
 */
const hasUnassignedMain = (tree: NodeObj): boolean =>
  (tree.children ?? []).some(child => child.direction !== 0 && child.direction !== 1)

test('diffTree of a tree with itself is empty', () => {
  const rand = makeRandom(7)
  const tree = buildTree(rand, 40)
  expect(diffTree(tree, tree)).toEqual([])
  // A structurally identical clone must also produce nothing: identity is by id
  // and field value, not by object reference.
  expect(diffTree(tree, clone(tree))).toEqual([])
})

test('a single field edit produces one update and nothing structural', () => {
  const tree: NodeObj = {
    id: 'root',
    topic: 'Root',
    children: [
      { id: 'a', topic: 'A' },
      { id: 'b', topic: 'B', children: [{ id: 'c', topic: 'C' }] },
    ],
  }
  const target = clone(tree)
  target.children![1].topic = 'B2'

  const ops = diffTree(tree, target)
  expect(ops).toHaveLength(1)
  expect(ops[0]).toEqual({ type: 'update', id: 'b', patch: { topic: 'B2' } })
})

test('a clearing patch keeps the key it clears', () => {
  // `deepClone` is a JSON round trip, so `expanded: undefined` would vanish and
  // the collapse would be silently lost. This is the regression guard for that.
  const tree: NodeObj = { id: 'root', topic: 'Root', children: [{ id: 'a', topic: 'A', expanded: false, note: 'hello' }] }
  const target: NodeObj = { id: 'root', topic: 'Root', children: [{ id: 'a', topic: 'A' }] }

  const ops = diffTree(tree, target)
  expect(ops).toHaveLength(1)
  expect(ops[0].type).toBe('update')
  expect('expanded' in (ops[0] as { patch: object }).patch).toBe(true)
  expect('note' in (ops[0] as { patch: object }).patch).toBe(true)

  const copy = clone(tree)
  applyDataOps(copy, ops)
  expect(plain(copy)).toEqual(plain(target))
})

test('sideLayout: a node on the other side is not dragged into this one', () => {
  // Regression guard. `direction` splits a main node's children across `.lhs` and
  // `.rhs` while their `children` array stays a single list, so the two orders
  // disagree. A field edit must not look like a reordering under either reading —
  // the op list has to be exactly the one update.
  const tree: NodeObj = {
    id: 'root',
    topic: 'Root',
    children: [
      { id: 'a', topic: 'A', direction: 0 },
      { id: 'b', topic: 'B', direction: 1 },
      { id: 'c', topic: 'C', direction: 0 },
    ],
  }
  const target = clone(tree)
  target.children![0].topic = 'A edited'

  const ops = diffTree(tree, target, { sideLayout: true })
  expect(ops.filter(op => op.type === 'move')).toEqual([])
  expect(ops).toEqual([{ type: 'update', id: 'a', patch: { topic: 'A edited' } }])

  // Without the flag the same comparison would be free to reorder across sides,
  // so the flag has to be the thing doing the work here.
  expect(diffTree(tree, target, { sideLayout: true })).toEqual(ops)
})

test('sideLayout: reordering converges on the data order', () => {
  // The subtle one. `root.children` is `[a, b, c]` while the render order is
  // `.lhs = [a, c]` and `.rhs = [b]`; the target swaps the two lhs nodes. Both
  // `a` and `b` have to move for the *data* to reach the target — reconciling
  // each container on its own reaches `.lhs = [c, a]` but leaves the shared array
  // at `[b, c, a]`, which is not the snapshot being restored.
  const tree: NodeObj = {
    id: 'root',
    topic: 'Root',
    children: [
      { id: 'a', topic: 'A', direction: 0 },
      { id: 'b', topic: 'B', direction: 1 },
      { id: 'c', topic: 'C', direction: 0 },
    ],
  }
  // Swap the two lhs nodes; `b` (rhs) keeps its side.
  const target = clone(tree)
  target.children = [target.children![2], target.children![1], target.children![0]]

  const ops = diffTree(tree, target, { sideLayout: true })
  expect(ops.filter(op => op.type === 'move').map(op => (op as { id: string }).id)).toEqual(['a', 'b'])
  // `c` is already where it belongs, so it must not be touched.
  expect(ops.some(op => (op as { id?: string }).id === 'c')).toBe(false)

  const copy = clone(tree)
  applyDataOps(copy, ops)
  expect(plain(copy)).toEqual(plain(target))
})

test('sideLayout: a main node without a side degrades to resync', () => {
  // `layout()` writes the missing side while rendering, alternating left/right.
  // A patch cannot reproduce that write, so the documents would diverge even
  // though nothing about the node tree "changed".
  const tree: NodeObj = { id: 'root', topic: 'Root', children: [{ id: 'a', topic: 'A' }, { id: 'b', topic: 'B', direction: 1 }] }
  expect(diffTree(tree, clone(tree), { sideLayout: true })).toEqual([{ type: 'resync' }])
  // The same document is perfectly diffable when the layout does not care.
  expect(diffTree(tree, clone(tree), { sideLayout: false })).toEqual([])
})

test('a direction change on a main node degrades to resync', () => {
  const tree: NodeObj = { id: 'root', topic: 'Root', children: [{ id: 'a', topic: 'A', direction: 0 }] }
  const target: NodeObj = { id: 'root', topic: 'Root', children: [{ id: 'a', topic: 'A', direction: 1 }] }
  expect(diffTree(tree, target)).toEqual([{ type: 'resync' }])
})

test('a direction change below the main level is an ordinary update', () => {
  // `moveNodeObj` copies the destination's side onto every node it moves *into* a
  // main node, so a deep node routinely ends up carrying a `direction` that has
  // nothing to do with how it renders. Restoring the field is a shallow update;
  // calling it unexpressible would send the undo of a plain drag through a full
  // rebuild of the document — which is the entire thing this module exists to
  // avoid.
  const tree: NodeObj = {
    id: 'root',
    topic: 'Root',
    children: [{ id: 'm', topic: 'M', direction: 0, children: [{ id: 'd', topic: 'D', direction: 0 }] }],
  }
  const target = clone(tree)
  delete target.children![0].children![0].direction

  const ops = diffTree(tree, target)
  expect(ops).toHaveLength(1)
  expect(ops[0].type).toBe('update')
  expect('direction' in (ops[0] as { patch: object }).patch).toBe(true)

  const copy = clone(tree)
  applyDataOps(copy, ops)
  expect(copy.children![0].children![0].direction).toBeUndefined()

  // Mirror image: the field reappearing.
  const back = clone(target)
  applyDataOps(back, diffTree(target, tree))
  expect(plain(back)).toEqual(plain(tree))
})

test('a different root degrades to resync', () => {
  expect(diffTree({ id: 'a', topic: 'A' }, { id: 'b', topic: 'B' })).toEqual([{ type: 'resync' }])
})

test('control: the comparison is not vacuous', () => {
  const tree: NodeObj = { id: 'root', topic: 'Root', children: [{ id: 'a', topic: 'A' }, { id: 'b', topic: 'B' }] }
  const target: NodeObj = { id: 'root', topic: 'Root', children: [{ id: 'b', topic: 'B' }] }
  // Applying nothing must NOT accidentally match the target…
  const untouched = clone(tree)
  applyDataOps(untouched, [])
  expect(plain(untouched)).not.toEqual(plain(target))
  // …while the real diff must.
  const copy = clone(tree)
  applyDataOps(copy, diffTree(tree, target))
  expect(plain(copy)).toEqual(plain(target))
})

test('property: apply(diff(current, target)) === target', () => {
  let diffs = 0
  let resyncs = 0
  let structural = 0

  for (let seed = 1; seed <= 600; seed++) {
    const rand = makeRandom(seed)
    const current = buildTree(rand, 6 + Math.floor(rand() * 26))
    const target = clone(current)
    const next = { id: 0 }

    const rounds = 1 + Math.floor(rand() * 4)
    for (let i = 0; i < rounds; i++) mutate(rand, target, next)
    const expectsResync = needsResync(current, target)

    for (const sideLayout of [false, true]) {
      const copy = clone(current)
      const ops = diffTree(copy, clone(target), { sideLayout })
      // Two independent reasons to degrade: a `direction` change, and — SIDE only
      // — a main node whose side `layout()` would have to invent.
      const degrades = expectsResync || (sideLayout && (hasUnassignedMain(current) || hasUnassignedMain(target)))
      if (degrades) {
        expect(ops, `seed ${seed} should degrade to resync`).toEqual([{ type: 'resync' }])
        resyncs++
        continue
      }
      // No unforeseen degradation: every non-direction mutation must be
      // expressible with local ops, otherwise the fast path silently loses
      // coverage.
      expect(ops.some(op => op.type === 'resync'), `seed ${seed} unexpected resync: ${JSON.stringify(ops)}`).toBe(false)

      applyDataOps(copy, ops)
      expect(plain(copy), `seed ${seed} (sideLayout=${sideLayout}) ops=${JSON.stringify(ops)}`).toEqual(plain(target))

      diffs++
      if (ops.some(op => op.type === 'insert' || op.type === 'remove' || op.type === 'move')) structural++
    }
  }

  // Guard against a generator that quietly stops producing interesting work.
  expect(diffs).toBeGreaterThan(600)
  expect(structural).toBeGreaterThan(200)
  expect(resyncs).toBeGreaterThan(0)
})

test('property: the diff is a fixed point of itself', () => {
  // diff(a, b) applied to a, then diffed against b again, must be empty — i.e.
  // the op sequence really does converge on the target.
  for (let seed = 1; seed <= 200; seed++) {
    const rand = makeRandom(seed * 31)
    const current = buildTree(rand, 8 + Math.floor(rand() * 20))
    const target = clone(current)
    const next = { id: 0 }
    for (let i = 0; i < 3; i++) mutate(rand, target, next)
    if (needsResync(current, target)) continue

    const copy = clone(current)
    const ops = diffTree(copy, clone(target))
    if (ops.some(op => op.type === 'resync')) continue
    applyDataOps(copy, ops)
    expect(diffTree(copy, clone(target)), `seed ${seed} did not converge`).toEqual([])
  }
})

test('property: ids are never duplicated by a diff', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const rand = makeRandom(seed * 17)
    const current = buildTree(rand, 10 + Math.floor(rand() * 15))
    const target = clone(current)
    const next = { id: 0 }
    for (let i = 0; i < 3; i++) mutate(rand, target, next)
    if (needsResync(current, target)) continue

    const copy = clone(current)
    const ops = diffTree(copy, clone(target))
    if (ops.some(op => op.type === 'resync')) continue
    applyDataOps(copy, ops)

    const ids = nodesOf(copy).map(node => node.id)
    expect(new Set(ids).size, `seed ${seed} produced duplicate ids`).toBe(ids.length)
  }
})
