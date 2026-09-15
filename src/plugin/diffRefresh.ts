import type MindElixir from '../index'
import { SIDE } from '../const'
import type { MindElixirData } from '../types/index'
import { applyTreeOps, diffTree, sameValue } from '../utils/treePatch'

/**
 * `diffRefresh` — install a new document like `refresh(data)`, but only touch
 * what actually changed.
 *
 * `refresh(data)` is, and stays, the authoritative "replace the whole document"
 * implementation: it clears the selection, resets focus mode, fires `refresh`,
 * deep-clones the input so the caller's object is never captured, then rebuilds
 * every node and every line. Nothing here changes it — this is a second entry
 * point beside it, and the two are observably equivalent by design.
 *
 * The win is in what it does *not* do: unchanged nodes keep their element, their
 * listeners, their measured size, their focus and hover state, and the map is
 * not re-laid-out from scratch. Undo/redo is the main caller (`historyStack` can
 * replay a snapshot without rebuilding the world), and progressive output is the
 * other — a streaming parser that lags thirty chunks behind still only needs one
 * diff against the newest tree, because intermediate targets are never replayed.
 *
 * Install it with `mei.install(diffRefreshPlugin)`; `restore()` picks it up
 * automatically once `mei.diffRefresh` exists.
 */
export default function (mei: MindElixir) {
  /**
   * @function
   * @instance
   * @name diffRefresh
   * @description Install `data` like {@link refresh} does, but apply only the
   * difference. Returns `false` — after falling back to `refresh` — when the
   * change cannot be expressed locally (a different root, a `direction` change,
   * focus mode). The `refresh` event is fired exactly once either way.
   * @memberof MapInteraction
   * @param {MindElixirData} data mind elixir data
   */
  mei.diffRefresh = function (this: MindElixir, data: MindElixirData): boolean {
    // Focus mode renders a subtree while `getData()` reports the whole diagram,
    // and `operationHistory.restore` re-anchors explicitly afterwards. Letting
    // `refresh` own that keeps the mapping in exactly one place; focus mode is a
    // history boundary anyway, so an undo landing here is rare.
    if (!data?.nodeData || !this.nodeData || this.isFocusMode) {
      this.refresh(data)
      return false
    }

    // Parity with `refresh`: the caller's object is never captured, and the
    // history stack stays free of aliases into the live tree.
    const target = JSON.parse(JSON.stringify(data)) as MindElixirData

    const ops = diffTree(this.nodeData, target.nodeData, { sideLayout: this.direction === SIDE })
    // `resync` is the single degradation path: hand the whole document to
    // `refresh` *before* anything is touched, so it stays idempotent and the
    // `refresh` event is not fired twice.
    if (ops.some(op => op.type === 'resync')) {
      this.refresh(data)
      return false
    }

    // ---- mirror `refresh(data)`'s side effects, one by one ----------------
    // 1. Clear the selection. Not doing it would leave the host short of the
    //    `unselect*` events `refresh` emits, and `operationHistory.restore`
    //    re-selects right after either way.
    this.clearSelection()
    // 2. `refresh(data)` resets focus mode and re-points the backup at the live
    //    tree. Here the tree is patched in place, so both already alias.
    this.isFocusMode = false
    this.nodeDataBackup = this.nodeData
    // 3. The document-changed event is public API — a host that re-baselines on
    //    `refresh` must hear about an undo too.
    this.bus.fire('refresh')
    // 4. `arrows` / `summaries` / `meta` live outside the node tree: replacing
    //    them wholesale is O(links) rather than O(nodes), so they are not worth
    //    diffing. They are worth *comparing* though — an arrow-only edit (a
    //    control point drag, a label edit, `reshapeArrow`) or a summary-only one
    //    leaves `nodeData` untouched, so the op list comes back empty, and an
    //    empty op list means "no node to patch", not "nothing to redraw". `meta`
    //    is truthy-guarded to match `refresh` exactly.
    const linksChanged = !sameValue(this.arrows, target.arrows) || !sameValue(this.summaries, target.summaries)
    if (linksChanged) {
      this.arrows = target.arrows || []
      this.summaries = target.summaries || []
    }
    if (target.meta) {
      this.meta = target.meta
    }

    // 5.-7. `fillParent` + redraw. `applyTreeOps` patches the tree and redraws
    //    whenever it applied something or the link layer was replaced, exactly
    //    like `refresh` does.
    applyTreeOps(this, ops, linksChanged)
    return true
  }
}
