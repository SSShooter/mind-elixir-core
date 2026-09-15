import type MindElixir from '../index'
import type { NodeObj } from '../types/index'
import type { HistoryDirection, HistoryEntry } from '../utils/historyStack'
import { HistoryStack } from '../utils/historyStack'
import type { Operation } from '../utils/pubsub'

type RestoreMeta = {
  operation: string
  currentSelected: string[]
  currentTarget:
    | {
        type: 'summary' | 'arrow'
        value: string
      }
    | {
        type: 'nodes'
        value: string[]
      }
}

const calcCurrentTarget = function (operation: Operation): RestoreMeta['currentTarget'] {
  switch (operation.name) {
    case 'createSummary':
    case 'finishEditSummary':
    case 'removeSummary':
      return { type: 'summary', value: operation.target.id }
    case 'createArrow':
    case 'finishEditArrowLabel':
    case 'removeArrow':
    case 'reshapeArrow':
      return { type: 'arrow', value: operation.target.id }
    case 'removeNodes':
    case 'copyNodes':
    case 'moveNodesBefore':
    case 'moveNodesAfter':
    case 'moveNodesIn':
      return { type: 'nodes', value: operation.target.map(node => node.id) }
    // Collapse / expand: the target is the folded node (or the root for a
    // whole-map batch). Restore never selects it — see `restore` below.
    case 'expandNode':
    case 'collapseNode':
      return { type: 'nodes', value: [operation.target.id] }
    default:
      return { type: 'nodes', value: [operation.target.id] }
  }
}

export default function (mei: MindElixir) {
  // The map is one "document" on the shared timeline. The outliner registers
  // itself with the SAME stack, so Ctrl+Z walks both views chronologically.
  const stack = new HistoryStack()
  const DOC = 'map'

  let currentSelectedNodes: string[] = []
  /** State matching the stack's current position — `before` for the next push. */
  let currentSnapshot = mei.getData()
  /** True while `restore` is driving `refresh` — see `handleRefresh`. */
  let restoring = false

  // `refresh(data)` installs a brand new document, so the next push must start
  // from it instead of the pre-refresh state. Re-baseline WITHOUT dropping the
  // stack: unlike `focusNode`/`cancelFocus` this is not a view swap, and
  // `stack.clear()` here would wipe the entries `restore` is walking.
  const handleRefresh = function () {
    if (restoring) return
    currentSnapshot = mei.getData()
  }

  const selectNodesByIds = (ids: string[]) => {
    const els: ReturnType<MindElixir['findEle']>[] = []
    ids.forEach(id => {
      try {
        els.push(mei.findEle(id))
      } catch {
        // node not rendered (collapsed) — skip
      }
    })
    if (!els.length) return
    mei.selectNodes(els)
    // `selectNodes`' internal scrollIntoView is a no-op here (same reason
    // nodeOperation.ts scrolls explicitly after moveNodes)
    mei.scrollIntoView(els[els.length - 1])
  }

  /** Depth-first lookup inside a snapshot (the entries are plain clones). */
  const findById = (node: NodeObj, id: string): NodeObj | null => {
    if (node.id === id) return node
    for (const child of node.children ?? []) {
      const hit = findById(child, id)
      if (hit) return hit
    }
    return null
  }

  const restore = (entry: HistoryEntry, direction: HistoryDirection) => {
    const meta = entry.meta as RestoreMeta | undefined
    // `before` is the state to show on undo, `after` on redo
    const snapshot = direction === 'undo' ? entry.before : entry.after
    // In focus mode the map renders a subtree while `getData()` keeps reporting
    // the whole diagram, so refreshing a snapshot verbatim would blow the
    // focused view back open. Re-anchor instead: the refreshed full tree
    // becomes `nodeDataBackup` and its focus root the rendered document.
    // History never crosses a focus boundary (`focusNode` / `cancelFocus`
    // clear it), so the focus root is guaranteed to exist in the snapshot.
    const focusRootId = mei.isFocusMode ? mei.nodeData?.id : null
    // `refresh(data)` resets focus mode, so suppress the re-baseline it would
    // otherwise trigger (it would clone the whole tree for nothing) and
    // re-anchor focus explicitly below.
    restoring = true
    // `diffRefresh` is `refresh` minus the rebuild: it patches the live tree in
    // place and mirrors every side effect of `refresh(data)` (selection, focus
    // reset, the `refresh` event, the deep clone of the input). It falls back to
    // `refresh` itself for changes it cannot express locally, so this is a fast
    // path, not a second behaviour to reason about.
    mei.diffRefresh ? mei.diffRefresh(snapshot) : mei.refresh(snapshot)
    restoring = false
    if (focusRootId) {
      const full = mei.nodeData
      const focused = findById(full, focusRootId)
      if (focused) {
        mei.nodeDataBackup = full
        mei.nodeData = focused
        mei.isFocusMode = true
        mei.refresh()
      } else {
        // Unreachable in practice — degrade to a consistent non-focus state
        // rather than leaving `isFocusMode` true over a whole-diagram render.
        mei.nodeDataBackup = full
        mei.isFocusMode = false
        mei.tempDirection = null
      }
    }
    // Keep the push baseline in step with what the map now shows. Without this,
    // the next operation would record the pre-undo state as its `before` and
    // undo/redo would drift after a branching edit.
    currentSnapshot = snapshot
    if (!meta) return

    const { currentTarget, operation, currentSelected } = meta
    // Deleting on undo / creating on redo means the target is gone — restore
    // the selection that was active before the operation instead.
    const targetRemoved = operation === 'removeNodes' || operation === 'removeSummary' || operation === 'removeArrow'
    // Folding never touches the selection (an expander click is not a select), so
    // both directions fall back to the pre-operation selection instead of jumping
    // the selection onto the node that was folded.
    const isViewOperation = operation === 'expandNode' || operation === 'collapseNode'
    // An arrow or a summary is never part of the node selection: picking one
    // calls `clearSelection`, so `currentSelected` is `[]` by then. Falling back
    // to it after undoing a reshape / a label edit therefore highlights nothing
    // at all, and the user cannot see which link the step touched. Keep the
    // target selected in both directions instead — the group lookup below is
    // what decides reachability, and it fails exactly when the restored state no
    // longer holds the target (an arrow the undone step created, or one the redo
    // removes), at which point the `currentSelected` fallback is the right answer.
    const isLinkTarget = currentTarget.type !== 'nodes'
    const shouldSelectTarget = !isViewOperation && (isLinkTarget || (direction === 'undo') === targetRemoved)

    if (currentTarget.type === 'nodes') {
      selectNodesByIds(shouldSelectTarget ? currentTarget.value : currentSelected)
      return
    }

    // summary / arrow: resolve the group element by its id prefix, inside this
    // instance's node container. Ids are only unique within one map, so a
    // document-wide lookup crosses instances when a host renders two maps.
    const prefix = currentTarget.type === 'summary' ? 's-' : 'a-'
    if (shouldSelectTarget) {
      const group = mei.nodes.querySelector<SVGElement>(`#${CSS.escape(prefix + currentTarget.value)}`)
      if (group) {
        if (currentTarget.type === 'summary') mei.selectSummary(group as any)
        else mei.selectArrow(group as any)
        return
      }
    }
    selectNodesByIds(currentSelected)
  }

  stack.register(DOC, restore)

  mei.historyStack = stack
  mei.undo = function () {
    stack.undo()
  }
  mei.redo = function () {
    stack.redo()
  }
  const clearHistory = function () {
    stack.clear()
    mei.clearSelection()
    // Re-baseline: the next push must start from the current state
    currentSnapshot = mei.getData()
  }
  mei.clearHistory = clearHistory

  const handleOperation = function (operation: Operation) {
    if (operation.name === 'beginEdit' || operation.silent) return
    const after = mei.getData()
    stack.push(DOC, currentSnapshot, after, {
      operation: operation.name,
      currentSelected: currentSelectedNodes,
      currentTarget: calcCurrentTarget(operation),
    } satisfies RestoreMeta)
    currentSnapshot = after
  }
  const handleKeyDown = function (e: KeyboardEvent) {
    if (!mei.editable) return
    if (!e.metaKey && !e.ctrlKey) return
    // Use e.key instead of e.code: e.code is the physical key position, which
    // does not match the letter on non-QWERTY layouts (e.g. AZERTY Z -> code KeyW),
    // see https://github.com/SSShooter/mind-elixir-core/issues/380
    const key = e.key.toLowerCase()
    if (key === 'z') e.shiftKey ? mei.redo() : mei.undo()
    else if (key === 'y') mei.redo()
  }
  const handleSelectNodes = function () {
    currentSelectedNodes = mei.currentNodes.map(n => n.nodeObj.id)
  }
  mei.bus.addListener('operation', handleOperation)
  mei.bus.addListener('refresh', handleRefresh)
  mei.bus.addListener('selectNodes', handleSelectNodes)
  // 反选（如 Ctrl+点击）只会 fire unselectNodes，也需同步选中状态，避免记录陈旧的 currentSelected
  mei.bus.addListener('unselectNodes', handleSelectNodes)
  mei.container.addEventListener('keydown', handleKeyDown)

  return () => {
    stack.clear()
    mei.bus.removeListener('operation', handleOperation)
    mei.bus.removeListener('refresh', handleRefresh)
    mei.bus.removeListener('selectNodes', handleSelectNodes)
    mei.bus.removeListener('unselectNodes', handleSelectNodes)
    mei.container.removeEventListener('keydown', handleKeyDown)
  }
}
