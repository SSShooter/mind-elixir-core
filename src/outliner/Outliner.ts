import './outliner.css'
import { HistoryStack } from '../utils/historyStack'
import type { HistoryDirection, HistoryEntry } from '../utils/historyStack'
import type { NodeObj } from '../types/index'
import type { Topic } from '../types/dom'
import { generateUUID } from '../utils/index'
import {
  addSiblingBeforeOperation,
  addSiblingOperation,
  findItemById,
  findPathToNode,
  indentOperation,
  moveDownOperation,
  moveToOperation,
  moveUpOperation,
  outdentOperation,
} from './operations'
import { svgIcon } from './icons'
import { defaultI18n } from './types'
import type { ItemOperation, OutlineData, OutlineItem, OutlinerI18n, OutlinerMei, OutlinerOptions } from './types'

type DropPosition = 'before' | 'inside' | 'after'

/**
 * One item's DOM, kept alive across renders by {@link Outliner} — the basis of
 * the incremental renderer. Because the element survives, everything a click
 * handler needs (the live node, its level, its parent) has to be refreshed on
 * every sync: reading them from a creation-time closure would go stale the
 * moment the node is indented or moved.
 */
interface ItemView {
  container: HTMLElement
  wrapper: HTMLElement
  /** Only present at level > 0 (renders the tree's vertical guide). */
  line: HTMLElement | null
  dot: HTMLElement
  topic: HTMLElement
  btnGroup: HTMLElement
  /** Absent in readonly mode. */
  menuWrapper: HTMLElement | null
  menuBtn: HTMLElement | null
  dropdown: HTMLElement | null
  /** Mirrors the `menu-open` class so the diff needs no DOM read to skip it. */
  menuOpen: boolean
  collapse: HTMLElement
  /** Topic string currently reflected by `topic`'s markup (render cache key). */
  topicText: string
  /** True while `topic` shows raw source because the node is being edited. */
  topicDirty: boolean
  item: OutlineItem
  level: number
  parentId: string | undefined
  siblingCount: number
}

/** `parent` back-references (set by mind-elixir's fillParent) break JSON cloning. */
const stripParentRefs = (data: unknown): any => JSON.parse(JSON.stringify(data, (k, v) => (k === 'parent' && typeof v !== 'string' ? undefined : v)))

/**
 * A dependency-free outliner (React-free refactor of react-outliner).
 *
 * Two modes:
 * - **Standalone**: owns its `data`, commits every mutation as one history
 *   entry `{ before, after }` on a {@link HistoryStack}.
 * - **Bound** (`options.mei`): ONE data, TWO views — the outline renders
 *   `mei.nodeData` in place (live reference, no clone) and routes every
 *   mutation to the map, whose 'operation' events feed the shared stack. The
 *   outline re-renders on every stack change, so edits from either side and
 *   undo/redo stay consistent across both views.
 */
export class Outliner {
  private el: HTMLElement
  private breadcrumbEl: HTMLElement
  private itemsEl: HTMLElement
  /** The outline root(s). In bound mode this IS `[mei.nodeData]` — same reference, see bindToLiveTree. */
  private items: OutlineItem[] = []
  private stack: HistoryStack
  private mei: OutlinerMei | null
  /** While true, `rerenderFromMei` skips one render (patch-only topic commits). */
  private suppressSync = false
  /** A deferred sync is owed — see `scheduleSync`. */
  private syncDirty = false
  /** A deferred sync flush is already queued for the end of this tick. */
  private syncQueued = false
  private docName: string
  private readonly: boolean
  private markdown?: (text: string, item: OutlineItem) => string
  private i18n: OutlinerI18n
  private fileName?: string
  private onChange?: (data: OutlineItem[]) => void

  private zoomedId: string | null = null
  private editingId: string | null = null
  private openMenuId: string | null = null
  private draggedId: string | null = null
  /** Set at dragstart so `dragover` needs neither a DOM scan nor a live lookup. */
  private draggedContainer: HTMLElement | null = null
  private dropIndicator: { el: HTMLElement; position: DropPosition } | null = null
  /** id → reused DOM for every CURRENTLY RENDERED node (collapsed subtrees drop out). */
  private views = new Map<string, ItemView>()
  /** Ids visited by the render in progress — anything left over gets unmounted. */
  private seen = new Set<string>()
  /** Change key for the breadcrumb, which is cheap to skip and expensive to rebuild. */
  private breadcrumbSig = ''
  private disposers: Array<() => void> = []

  constructor(options: OutlinerOptions) {
    const el = typeof options.el === 'string' ? document.querySelector<HTMLElement>(options.el) : options.el
    if (!el) throw new Error('Outliner: el is not a valid element')
    this.el = el
    this.el.innerHTML = ''
    this.readonly = options.readonly ?? false
    this.markdown = options.markdown
    this.i18n = { ...defaultI18n, ...options.i18n }
    this.fileName = options.fileName
    this.onChange = options.onChange
    this.docName = options.docName ?? 'outliner'
    this.mei = options.mei ?? null
    if (this.mei) {
      // Bound mode: the map owns the data; the outline renders the LIVE tree
      // (no clone — see bindToLiveTree). The history stack MUST be mei's own —
      // the outline subscribes to it and re-syncs on every map operation, so
      // a different stack would silently break two-way sync. Default to
      // mei.historyStack when the caller doesn't pass one explicitly.
      if (!options.history && !this.mei.historyStack) {
        throw new Error('Outliner: bound mode requires mei.historyStack — create the MindElixir instance with `allowUndo: true` and await `init`')
      }
      this.stack = options.history ?? this.mei.historyStack!
      this.bindToLiveTree()
    } else {
      // Standalone: own data, own (or shared) history stack
      this.stack = options.history ?? new HistoryStack()
      if (!options.data) throw new Error('Outliner: either `data` or `mei` is required')
      this.items = Outliner.normalize(options.data)
    }

    this.breadcrumbEl = document.createElement('div')
    this.breadcrumbEl.className = 'outliner-breadcrumb'
    this.itemsEl = document.createElement('div')
    this.itemsEl.className = 'outliner-items'
    const container = document.createElement('div')
    container.className = 'outliner-container'
    container.appendChild(this.breadcrumbEl)
    container.appendChild(this.itemsEl)
    this.el.appendChild(container)

    if (this.mei) {
      // Bound mode: the outliner never pushes its own entries — it re-adopts
      // the live tree on every stack change (map operations, undo, redo and
      // clear all land here)
      this.disposers.push(this.stack.subscribe(this.requestSync))
      // Collapse/expand now lands on the shared stack like any other edit, but the
      // map also fires 'expandNode' — that channel is still needed for SILENT
      // expands (auto-expanding a collapsed parent before a child is added), which
      // record nothing on their own. The stack channel renders synchronously; this
      // one defers, so the pair costs one render instead of two without either
      // notification being dropped (see `scheduleSync`).
      const bus = this.mei.bus
      if (bus) {
        bus.addListener('expandNode', this.scheduleSync)
        this.disposers.push(() => bus.removeListener('expandNode', this.scheduleSync))
      }
    } else {
      // Shared history: restore this document when the stack walks over our entries
      this.disposers.push(this.stack.register(this.docName, this.restore))
    }
    // Global undo/redo shortcut (contenteditable-aware, see handler)
    document.addEventListener('keydown', this.handleGlobalKeydown)
    this.disposers.push(() => document.removeEventListener('keydown', this.handleGlobalKeydown))
    // Close an open item menu on any outside mousedown
    document.addEventListener('mousedown', this.handleDocumentMousedown)
    this.disposers.push(() => document.removeEventListener('mousedown', this.handleDocumentMousedown))

    this.el.addEventListener('keydown', this.handleTopicKeydown)
    this.el.addEventListener('click', this.handleClick)
    this.el.addEventListener('focusin', this.handleFocusIn)
    this.el.addEventListener('focusout', this.handleFocusOut)
    // Drag & drop is delegated like `click` — one handler for the whole list
    // instead of three per node (see the region note above the handlers).
    this.el.addEventListener('dragstart', this.handleDragStart)
    this.el.addEventListener('dragend', this.handleDragEnd)
    this.el.addEventListener('dragover', this.handleDragOver)
    this.el.addEventListener('dragleave', this.handleDragLeave)
    this.el.addEventListener('drop', this.handleDrop)

    this.render()
  }

  /**
   * Deep-clone + ensure every node has a `children` array.
   * `parent` back-references (set by mind-elixir's fillParent) break JSON
   * cloning — dropped here, same as mind-elixir's own `stringifyData`.
   */
  static normalize(data: OutlineData[]): OutlineItem[] {
    const clone = stripParentRefs(data) as OutlineItem[]
    const ensure = (item: OutlineItem): OutlineItem => {
      item.children = (item.children ?? []).map(ensure)
      return item
    }
    return clone.map(ensure)
  }

  getData(): OutlineItem[] {
    // stripParentRefs: in bound mode `items` IS the live mei tree (parent refs)
    return stripParentRefs(this.items) as OutlineItem[]
  }

  /** Replace the whole dataset (no history entry — mirrors `mei.refresh`). */
  refresh(data: OutlineData[]): void {
    if (this.mei) throw new Error('Outliner: refresh() is not available in bound mode — the data is owned by MindElixir')
    this.items = Outliner.normalize(data)
    if (this.zoomedId && !findItemById(this.items, this.zoomedId)) this.zoomedId = null
    this.editingId = null
    this.render()
    this.emitChange()
  }

  /** Programmatically set a partial update; `saveHistory = false` skips the undo timeline. */
  updateItem(id: string, patch: Partial<OutlineItem>, saveHistory = true): void {
    if (this.mei) {
      if (patch.topic !== undefined) this.setNodeTopicBound(id, patch.topic)
      if (patch.expanded !== undefined) this.expandBound(id, patch.expanded)
      return
    }
    if (saveHistory) {
      // Same vocabulary as the map: a pure fold reports expandNode / collapseNode,
      // anything else (topic, style, …) stays a reshapeNode.
      const isPureFold = patch.topic === undefined && patch.expanded !== undefined
      const op = isPureFold ? (patch.expanded ? 'expandNode' : 'collapseNode') : 'reshapeNode'
      const ok = this.commit(
        draft => {
          const item = findItemById(draft, id)
          if (!item) return null
          Object.assign(item, patch)
          return draft
        },
        { op, id }
      )
      if (ok) this.render()
      return
    }
    const item = findItemById(this.items, id)
    if (!item) return
    Object.assign(item, patch)
    this.render()
  }

  /** Insert an empty child under `id` and focus it. */
  addChild(id: string): void {
    if (this.mei) {
      const el = this.meiEle(id)
      if (!el) return
      this.flushEditingText()
      const newId = generateUUID()
      this.mei.addChild(el, { id: newId, topic: '', children: [] } as NodeObj)
      this.focusItem(newId)
      return
    }
    const newId = generateUUID()
    const ok = this.commit(
      draft => {
        const parent = findItemById(draft, id)
        if (!parent) return null
        parent.children.push({ id: newId, topic: '', children: [] })
        if (parent.expanded === false) parent.expanded = true
        return draft
      },
      { op: 'addChild', id }
    )
    if (!ok) return
    this.render()
    this.focusItem(newId)
  }

  destroy(): void {
    this.disposers.forEach(fn => fn())
    this.disposers = []
    this.el.removeEventListener('keydown', this.handleTopicKeydown)
    this.el.removeEventListener('click', this.handleClick)
    this.el.removeEventListener('focusin', this.handleFocusIn)
    this.el.removeEventListener('focusout', this.handleFocusOut)
    this.el.removeEventListener('dragstart', this.handleDragStart)
    this.el.removeEventListener('dragend', this.handleDragEnd)
    this.el.removeEventListener('dragover', this.handleDragOver)
    this.el.removeEventListener('dragleave', this.handleDragLeave)
    this.el.removeEventListener('drop', this.handleDrop)
    this.views.clear()
    this.seen.clear()
    this.dropIndicator = null
    this.draggedContainer = null
    // Drop a queued deferred sync so it cannot repopulate the element below
    this.syncDirty = false
    this.el.innerHTML = ''
  }

  focusItem(id: string): void {
    const el = this.itemsEl.querySelector(`[data-outline-item][data-item-id="${CSS.escape(id)}"]`) as HTMLElement | null
    if (!el) return
    const alreadyFocused = document.activeElement === el
    el.focus()
    // The incremental renderer REUSES the focused element, so no focusin fires and
    // the caret would stay wherever it was. Every caller of focusItem is a
    // structural edit that used to end with the caret at the end of the topic
    // (the old full rebuild always destroyed the element and refocused a fresh
    // one), so reproduce that position explicitly.
    if (alreadyFocused) this.placeCaretAtEnd(el)
  }

  // #region history

  private restore = (entry: HistoryEntry<OutlineItem[]>, direction: HistoryDirection): void => {
    this.items = JSON.parse(JSON.stringify(direction === 'undo' ? entry.before : entry.after))
    if (this.zoomedId && !findItemById(this.items, this.zoomedId)) this.zoomedId = null
    this.editingId = null
    this.openMenuId = null
    this.render()
    this.emitChange()
  }

  /**
   * Run `mutator` on a working clone; if it produces a real change, record ONE
   * history entry (before/after snapshots) and swap in the new data.
   * Returns false when readonly / no-op (no entry pushed).
   */
  private commit(mutator: (draft: OutlineItem[]) => OutlineItem[] | null, meta?: any): boolean {
    if (this.readonly) return false
    const before = this.getData()
    const draft = JSON.parse(JSON.stringify(this.items)) as OutlineItem[]
    const next = mutator(draft)
    if (!next) return false
    if (JSON.stringify(next) === JSON.stringify(before)) return false
    this.items = next
    this.stack.push(this.docName, before, this.getData(), meta)
    this.emitChange()
    return true
  }

  private emitChange(): void {
    this.onChange?.(this.getData())
  }

  // #endregion

  // #region bound mode (mei binding — one data, two views)

  /**
   * Point `this.items` at the live `mei.nodeData` root and normalise it in
   * place — no clone, the map owns the data.
   *
   * Between `mei.refresh` calls (undo/redo) this is the same reference, so
   * the assignment is a no-op; only a swapped tree re-points it.
   *
   * The recursion is the real work: `NodeObj.children` is optional and a
   * leaf may carry `undefined`, but every rendering/ops helper here treats
   * the tree as `OutlineItem[]` and walks `children` unconditionally. Fill
   * the holes once per tree — idempotent, so calling it repeatedly is free
   * after the first pass.
   */
  private bindToLiveTree(): void {
    const nodeData = this.mei!.nodeData as unknown as OutlineItem
    if (this.items?.[0] !== nodeData) {
      this.items = [nodeData]
    }
    const ensureChildren = (node: OutlineItem): void => {
      if (!node.children) node.children = []
      node.children.forEach(ensureChildren)
    }
    ensureChildren(nodeData)
  }

  /**
   * Ask for a bound-mode sync and RENDER NOW. Callers such as
   * `applyBoundOperation` focus a node right after the map call, which needs the
   * fresh DOM, so this channel stays synchronous.
   *
   * Renders even if one already ran in this tick, because the notification that
   * brought us here may describe a NEWER tree than that render saw — see
   * `scheduleSync` for why the two channels must not share a coalescing window.
   */
  private requestSync = (): void => {
    if (!this.mei || this.suppressSync) return
    this.syncDirty = false
    this.rerenderFromMei()
  }

  /**
   * Deferred variant, wired to the map's `expandNode` bus event.
   *
   * That event is the only channel reporting a mutation the history stack does
   * not also announce: a tracked fold fires it and then pushes an entry (which
   * renders synchronously through `requestSync`), while a SILENT expand —
   * `addChild` / move-into auto-expanding a collapsed target — fires it with no
   * entry of its own, the caller's operation acting as the announcement instead.
   *
   * So park the request for the end of the tick rather than rendering: if a
   * synchronous render follows in the same block it already covers this mutation
   * and clears the flag; if nothing follows, the microtask renders anyway — still
   * before the browser paints. Renders are never dropped, only coalesced.
   */
  private scheduleSync = (): void => {
    if (!this.mei || this.suppressSync) return
    this.syncDirty = true
    if (this.syncQueued) return
    this.syncQueued = true
    queueMicrotask(() => {
      this.syncQueued = false
      if (!this.syncDirty) return
      this.syncDirty = false
      this.rerenderFromMei()
    })
  }

  /**
   * Re-render the outline from the live mei tree. Called on every stack
   * change, so it re-reads `this.items` (undo/redo may have replaced the
   * tree) and drops view state that may point at now-missing nodes.
   */
  private rerenderFromMei(): void {
    if (!this.mei || this.suppressSync) return
    this.bindToLiveTree()
    if (this.zoomedId && !findItemById(this.items, this.zoomedId)) this.zoomedId = null
    this.editingId = null
    this.openMenuId = null
    this.render()
    this.emitChange()
  }

  /** Resolve a node's map element; null when the node is not rendered (collapsed). */
  private meiEle(id: string): Topic | null {
    if (!this.mei) return null
    try {
      return this.mei.findEle(id) as Topic
    } catch {
      return null
    }
  }

  private isRoot(id: string): boolean {
    return this.mei !== null && this.items[0]?.id === id
  }

  /** The node's parent in the (live) tree (null for the root). */
  private mirrorParent(id: string): OutlineItem | null {
    const find = (list: OutlineItem[]): OutlineItem | null => {
      for (const item of list) {
        if (item.children.some(child => child.id === id)) return item
        const found = find(item.children)
        if (found) return found
      }
      return null
    }
    return find(this.items)
  }

  private mirrorPrevSibling(id: string): OutlineItem | null {
    const parent = this.mirrorParent(id)
    if (!parent) return null
    const index = parent.children.findIndex(child => child.id === id)
    if (index <= 0) return null
    return parent.children[index - 1]
  }

  /**
   * Flush unsaved typing (from the outline editor) into the live tree via
   * `reshapeNode` so a following structural move cannot lose it. Skipped when
   * the text is unchanged (reshapeNode would push a no-op history entry).
   */
  private flushEditingText(): void {
    const editing = this.liveEditingText()
    if (!editing) return
    const item = findItemById(this.items, editing.id)
    if (item && item.topic !== editing.text) this.setNodeTopicBound(editing.id, editing.text)
  }

  private setNodeTopicBound(id: string, topic: string): void {
    const el = this.meiEle(id)
    if (!el) return
    // reshapeNode (not setNodeTopic) — it fires the tracked 'reshapeNode'
    // operation so the edit lands on the shared undo timeline, and writes the
    // live tree node directly (this.items IS mei.nodeData — no mirror patch).
    // Patch-only display: suppress the sync re-render (same rationale as
    // standalone focus-out — a full render would swallow the click that
    // caused the blur).
    this.suppressSync = true
    try {
      this.mei!.reshapeNode(el, { topic })
    } finally {
      this.suppressSync = false
    }
  }

  private expandBound(id: string, isExpand: boolean): void {
    const el = this.meiEle(id)
    if (!el) return
    // expandNode records a tracked 'operation' AND fires 'expandNode'; the
    // constructor subscriptions handle re-rendering (the stack channel, see
    // requestSync), so this path and map-side folding behave identically —
    // including undo, which now covers folds made from either view.
    this.mei!.expandNode(el, isExpand)
  }

  /** Bound twin of {@link applyOperation}: route the op to the map. */
  private applyBoundOperation(op: ItemOperation): void {
    if (this.isRoot(op.id) || (op.type === 'moveTo' && this.isRoot(op.draggedId!))) return
    this.flushEditingText()
    const el = this.meiEle(op.id)
    if (!el) return
    const newId = op.type === 'addSibling' || op.type === 'addSiblingBefore' ? generateUUID() : null
    const node = newId ? ({ id: newId, topic: op.newNodeContent ?? '', children: [] } as NodeObj) : undefined
    switch (op.type) {
      case 'addSibling':
        this.mei!.insertSibling('after', el, node)
        break
      case 'addSiblingBefore':
        this.mei!.insertSibling('before', el, node)
        break
      case 'indent': {
        const prev = this.mirrorPrevSibling(op.id)
        const prevEle = prev ? this.meiEle(prev.id) : null
        if (prevEle) this.mei!.moveNodesIn([el], prevEle)
        break
      }
      case 'outdent': {
        // Outdenting a root child has no mind-map equivalent (would leave the tree)
        const parent = this.mirrorParent(op.id)
        const parentEle = parent && !this.isRoot(parent.id) ? this.meiEle(parent.id) : null
        if (parentEle) this.mei!.moveNodesAfter([el], parentEle)
        break
      }
      case 'moveUp':
        this.mei!.moveUpNode(el)
        break
      case 'moveDown':
        this.mei!.moveDownNode(el)
        break
      case 'moveTo': {
        const targetEle = op.targetId ? this.meiEle(op.targetId) : null
        if (!targetEle || (this.isRoot(op.targetId!) && op.dropPosition !== 'inside')) break
        if (op.dropPosition === 'before') this.mei!.moveNodesBefore([el], targetEle)
        else if (op.dropPosition === 'after') this.mei!.moveNodesAfter([el], targetEle)
        else this.mei!.moveNodesIn([el], targetEle)
        break
      }
    }
    // The mei call fired its 'operation' → stack push → rerenderFromMei
    if (newId) this.focusItem(newId)
    else if (op.shouldFocusCurrent) this.focusItem(op.id)
  }

  // #endregion

  // #region operations

  private applyOperation(op: ItemOperation): void {
    if (this.readonly) return
    if (this.mei) {
      this.applyBoundOperation(op)
      return
    }
    const editing = this.liveEditingText()
    const newId = op.type === 'addSibling' || op.type === 'addSiblingBefore' ? generateUUID() : null
    const ok = this.commit(
      draft => {
        // Fold unsaved typing of ANOTHER node into the same entry so it is not lost
        if (editing && editing.id !== op.id) this.setTopicInDraft(draft, editing.id, editing.text)
        switch (op.type) {
          case 'addSibling':
            return addSiblingOperation(draft, op.id, op.parentId, { id: newId!, topic: op.newNodeContent ?? '', children: [] })
          case 'addSiblingBefore':
            return addSiblingBeforeOperation(draft, op.id, op.parentId, { id: newId!, topic: '', children: [] })
          case 'indent':
            return indentOperation(draft, op.id, op.parentId, op.topic)
          case 'outdent':
            if (!op.parentId) return null
            return outdentOperation(draft, op.id, op.parentId, op.topic ?? '')
          case 'moveUp':
            return moveUpOperation(draft, op.id, op.parentId)
          case 'moveDown':
            return moveDownOperation(draft, op.id, op.parentId)
          case 'moveTo': {
            if (!op.draggedId || !op.targetId || !op.dropPosition) return null
            return moveToOperation(draft, op.draggedId, op.targetId, op.dropPosition)
          }
        }
      },
      { op: op.type, id: op.id }
    )
    if (!ok) return
    this.render()
    if (newId) this.focusItem(newId)
    else if (op.shouldFocusCurrent) this.focusItem(op.id)
  }

  private deleteItem(id: string, parentId?: string): void {
    if (this.isRoot(id)) return
    // Pick the focus target from DOM order BEFORE deletion
    const currentEl = this.getTopicEl(id)
    let nextFocusId: string | null = null
    if (currentEl) {
      const all = Array.from(this.itemsEl.querySelectorAll<HTMLElement>('[data-outline-item]'))
      const index = all.indexOf(currentEl)
      if (index > 0) nextFocusId = all[index - 1].getAttribute('data-item-id')
      else if (parentId) nextFocusId = parentId
    }
    if (this.mei) {
      this.flushEditingText()
      const el = this.meiEle(id)
      if (!el) return
      this.mei.removeNodes([el])
      if (nextFocusId) this.focusItem(nextFocusId)
      return
    }
    const ok = this.commit(
      draft => {
        const remove = (list: OutlineItem[]): OutlineItem[] =>
          list
            .map(item => {
              if (item.id === id) return null
              if (item.children.length) return { ...item, children: remove(item.children) }
              return item
            })
            .filter(item => item !== null) as OutlineItem[]
        return remove(draft)
      },
      { op: 'removeNodes', id }
    )
    if (!ok) return
    this.render()
    if (nextFocusId) this.focusItem(nextFocusId)
  }

  // #endregion

  // #region render

  /**
   * Bring the DOM in line with the data — WITHOUT tearing it down.
   *
   * The old implementation ran `itemsEl.innerHTML = ''` and rebuilt every node
   * from scratch, at a cost of ~17 elements and ~8 listeners per node on every
   * call (measured: 6 ms at 341 nodes, 21 ms at 1 365, 94 ms at 5 461). Because
   * nearly every public method funnelled through here — including opening the
   * `…` menu — a single-character change re-rendered the whole document.
   *
   * Now every node owns a persistent {@link ItemView}: a node whose data did not
   * change keeps its exact element, its listeners, its focus and its hover
   * state. Only nodes that actually differ are patched, and only containers that
   * actually moved are reparented.
   */
  private render(): void {
    if (this.zoomedId && !findItemById(this.items, this.zoomedId)) this.zoomedId = null

    this.renderBreadcrumb()

    // Items — reconcile, don't rebuild.
    const zoomed = this.zoomedId ? findItemById(this.items, this.zoomedId) : null
    const displayItems = this.zoomedId ? (zoomed?.children ?? []) : this.items
    this.seen.clear()
    let cursor: HTMLElement | null = null
    for (const item of displayItems) {
      cursor = this.syncItem(item, 0, this.zoomedId ?? undefined, displayItems.length, this.itemsEl, cursor)
    }
    this.unmountUnseen()
  }

  /**
   * The breadcrumb holds only a handful of nodes, but rebuilding it means a DOM
   * teardown plus a fresh listener per segment. Skip it unless the labels moved.
   */
  private renderBreadcrumb(): void {
    const path = this.zoomedId ? (findPathToNode(this.items, this.zoomedId) ?? []) : []
    const sig = `${this.fileName ?? ''}\u0000${path.map(node => `${node.id}:${node.topic}`).join('\u0000')}`
    if (sig === this.breadcrumbSig) return
    this.breadcrumbSig = sig

    this.breadcrumbEl.innerHTML = ''
    const home = document.createElement('button')
    home.className = 'breadcrumb-item breadcrumb-root'
    home.innerHTML = `${svgIcon('home')}<span class="breadcrumb-text">${this.escapeText(this.fileName ?? '')}</span>`
    home.addEventListener('click', () => this.zoomTo(null))
    this.breadcrumbEl.appendChild(home)
    path.forEach((node, index) => {
      const segment = document.createElement('span')
      segment.className = 'breadcrumb-segment'
      const isLast = index === path.length - 1
      const label = this.escapeText(node.topic || this.i18n.untitled)
      if (isLast) {
        segment.innerHTML = `<span class="breadcrumb-separator">/</span><span class="breadcrumb-item breadcrumb-current">${label}</span>`
      } else {
        const btn = document.createElement('button')
        btn.className = 'breadcrumb-item'
        btn.innerHTML = label
        btn.addEventListener('click', () => this.zoomTo(node.id))
        segment.innerHTML = `<span class="breadcrumb-separator">/</span>`
        segment.appendChild(btn)
      }
      this.breadcrumbEl.appendChild(segment)
    })
  }

  /**
   * Reconcile one node and its subtree into `parentEl`, placing its container
   * directly after `cursor` — the previously placed sibling — so keeping
   * document order costs at most one `insertBefore` per node that moved.
   *
   * Returns this node's container, i.e. the cursor for the next sibling.
   */
  private syncItem(
    item: OutlineItem,
    level: number,
    parentId: string | undefined,
    siblingCount: number,
    parentEl: HTMLElement,
    cursor: HTMLElement | null
  ): HTMLElement {
    let view = this.views.get(item.id)
    if (view) {
      this.patchItemView(view, item, level, parentId, siblingCount)
    } else {
      view = this.createItemView(item, level, parentId, siblingCount)
      this.views.set(item.id, view)
    }

    const expected = cursor ? cursor.nextSibling : parentEl.firstChild
    if (expected !== view.container) parentEl.insertBefore(view.container, expected)
    this.seen.add(item.id)

    // A collapsed node's children do not merely hide — they leave the DOM, so
    // folding a large subtree releases its elements instead of parking them.
    if (item.expanded !== false) {
      let childCursor: HTMLElement | null = view.wrapper
      for (const child of item.children) {
        childCursor = this.syncItem(child, level + 1, item.id, item.children.length, view.container, childCursor)
      }
    }
    return view.container
  }

  /** Release the views this render did not visit: deleted nodes, folded subtrees. */
  private unmountUnseen(): void {
    for (const [id, view] of this.views) {
      if (this.seen.has(id)) continue
      view.container.remove()
      this.views.delete(id)
      if (this.openMenuId === id) this.openMenuId = null
    }
  }

  /**
   * Build a node's DOM once. Deliberately listener-free: every interaction is
   * handled by the delegated handlers on `this.el` (see the events region), which
   * is what takes the per-node listener count from 8 to 0.
   */
  private createItemView(item: OutlineItem, level: number, parentId: string | undefined, siblingCount: number): ItemView {
    const container = document.createElement('div')
    container.className = 'outline-item-container'
    container.dataset.itemId = item.id
    if (this.readonly) container.style.pointerEvents = 'none'

    let line: HTMLElement | null = null
    if (level > 0) {
      line = document.createElement('div')
      line.className = 'outline-item-vertical-line'
      line.style.left = `${level * 24 - 13}px`
      line.style.height = '100%'
      container.appendChild(line)
    }

    const wrapper = document.createElement('div')
    wrapper.className = 'outline-item-wrapper'
    wrapper.dataset.itemId = item.id
    wrapper.style.marginLeft = `${level * 24}px`
    container.appendChild(wrapper)

    const front = document.createElement('div')
    front.className = 'outline-item-front'
    const dot = document.createElement('div')
    dot.className = `outline-item-dot${this.readonly ? '' : ' outline-item-dot-zoomable'}`
    dot.title = this.i18n.zoomInAndDrag
    if (!this.readonly) dot.draggable = true
    front.appendChild(dot)
    wrapper.appendChild(front)

    const topic = document.createElement('div')
    topic.className = 'outline-item-topic'
    topic.dataset.outlineItem = ''
    topic.dataset.itemId = item.id
    if (!this.readonly) topic.contentEditable = 'plaintext-only'
    this.writeTopicHtml(topic, item.topic, item)
    wrapper.appendChild(topic)

    const btnGroup = document.createElement('div')
    btnGroup.className = 'outline-item-btn-group'

    let menuWrapper: HTMLElement | null = null
    let menuBtn: HTMLElement | null = null
    if (!this.readonly) {
      menuWrapper = document.createElement('div')
      menuWrapper.className = 'outline-item-menu-wrapper'
      menuBtn = document.createElement('button')
      menuBtn.className = 'outline-item-menu-btn'
      menuBtn.title = this.i18n.menuTitle
      menuBtn.draggable = false
      menuBtn.innerHTML = svgIcon('ellipsis', 12)
      menuWrapper.appendChild(menuBtn)
      btnGroup.appendChild(menuWrapper)
    }

    const collapse = document.createElement('button')
    collapse.className = 'outline-item-collapse-btn'
    collapse.dataset.state = item.children.length === 0 ? 'hidden' : item.expanded === false ? 'collapsed' : 'expanded'
    collapse.innerHTML = svgIcon(item.expanded === false ? 'chevronRight' : 'chevronDown')
    btnGroup.appendChild(collapse)
    wrapper.appendChild(btnGroup)

    return {
      container,
      wrapper,
      line,
      dot,
      topic,
      btnGroup,
      menuWrapper,
      menuBtn,
      dropdown: null,
      menuOpen: false,
      collapse,
      topicText: item.topic,
      topicDirty: false,
      item,
      level,
      parentId,
      siblingCount,
    }
  }

  /** Update only what actually changed. This is the hot path now. */
  private patchItemView(view: ItemView, item: OutlineItem, level: number, parentId: string | undefined, siblingCount: number): void {
    const levelChanged = view.level !== level
    // Refresh the live refs FIRST — delegated handlers read these, never closures.
    view.item = item
    view.level = level
    view.parentId = parentId
    view.siblingCount = siblingCount

    if (levelChanged) {
      view.wrapper.style.marginLeft = `${level * 24}px`
      if (view.line) view.line.style.left = `${level * 24 - 13}px`
    }

    // Never clobber the source text while the user is typing in it; the dirty
    // flag is what restores the rendered markup once editing ends. This check is
    // also why opening a menu no longer re-runs markdown/KaTeX over every node.
    if (this.editingId !== item.id && (view.topicDirty || view.topicText !== item.topic)) {
      this.writeTopicHtml(view.topic, item.topic, item)
      view.topicText = item.topic
      view.topicDirty = false
    }

    const state = item.children.length === 0 ? 'hidden' : item.expanded === false ? 'collapsed' : 'expanded'
    if (view.collapse.dataset.state !== state) {
      view.collapse.dataset.state = state
      view.collapse.innerHTML = svgIcon(item.expanded === false ? 'chevronRight' : 'chevronDown')
    }

    this.syncDropdown(view)
  }

  /**
   * The `…` dropdown is derived state: it exists iff `openMenuId` names this
   * node. `setOpenMenu` drives it directly and a render re-syncs it — so opening
   * a menu no longer costs a whole-document rebuild.
   */
  private syncDropdown(view: ItemView): void {
    const shouldOpen = !!view.menuWrapper && this.openMenuId === view.item.id
    if (shouldOpen && !view.dropdown) {
      view.dropdown = this.createDropdown(view)
      view.menuWrapper!.appendChild(view.dropdown)
    } else if (!shouldOpen && view.dropdown) {
      view.dropdown.remove()
      view.dropdown = null
    }
    // Keeps the button group visible while the menu is open, independent of hover.
    if (view.menuOpen !== shouldOpen) {
      view.wrapper.classList.toggle('menu-open', shouldOpen)
      view.menuOpen = shouldOpen
    }
  }

  /**
   * Entries carry a `data-action` rather than a closure: a closure captured at
   * build time would go stale the moment the node is indented or moved, and on
   * a reused element it never gets rebuilt.
   */
  private createDropdown(view: ItemView): HTMLElement {
    const dropdown = document.createElement('div')
    dropdown.className = 'outline-item-menu-dropdown'
    const addItem = (label: string, icon: string, action: string, danger = false) => {
      const menuItem = document.createElement('button')
      menuItem.className = `outline-item-menu-item${danger ? ' outline-item-menu-item-danger' : ''}`
      menuItem.dataset.action = action
      menuItem.innerHTML = `${svgIcon(icon, 12)}<span>${label}</span>`
      dropdown.appendChild(menuItem)
    }
    addItem(this.i18n.outdent, 'arrowLeft', 'outdent')
    addItem(this.i18n.indent, 'arrowRight', 'indent')
    if (view.level > 0 || view.siblingCount > 1) addItem(this.i18n.delete, 'trash', 'delete', true)
    return dropdown
  }

  private toggleMenu(id: string): void {
    this.setOpenMenu(this.openMenuId === id ? null : id)
  }

  /**
   * Open the menu for `id`, or close it with `null`. Touches ONLY the two nodes
   * involved — no render, no breadcrumb, no per-node work.
   */
  private setOpenMenu(id: string | null): void {
    const previousId = this.openMenuId
    if (previousId === id) return
    this.openMenuId = id
    if (previousId) {
      const previous = this.views.get(previousId)
      if (previous) this.syncDropdown(previous)
    }
    if (id) {
      const view = this.views.get(id)
      if (view) this.syncDropdown(view)
    }
  }

  private runMenuAction(action: string): void {
    const id = this.openMenuId
    if (!id) return
    const view = this.views.get(id)
    if (!view) return
    const { item, level, parentId, siblingCount } = view
    this.setOpenMenu(null)
    if (action === 'outdent') {
      this.applyOperation({ type: 'outdent', id: item.id, parentId, shouldFocusCurrent: true, topic: item.topic })
    } else if (action === 'indent') {
      this.applyOperation({ type: 'indent', id: item.id, parentId, shouldFocusCurrent: true, topic: item.topic })
    } else if (action === 'delete' && (level > 0 || siblingCount > 1)) {
      this.deleteItem(item.id, parentId)
    }
  }

  // #endregion

  // #region drag & drop (delegated)
  //
  // These used to be bound per node (3 on every wrapper), i.e. 3N listeners
  // created and thrown away on every render. One listener on `this.el` now
  // serves the whole list, and `dragstart` caches the source container so
  // `dragover` — which fires several times per frame — needs no DOM scan.

  private handleDragStart = (e: DragEvent): void => {
    const t = e.target as HTMLElement
    if (!t.closest?.('.outline-item-dot')) return
    const container = t.closest<HTMLElement>('.outline-item-container')
    const id = container?.dataset.itemId
    if (!container || !id) return
    e.stopPropagation()
    this.draggedId = id
    this.draggedContainer = container
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
    container.style.opacity = '0.4'
  }

  private handleDragEnd = (): void => {
    this.clearDropIndicator()
    this.draggedId = null
    if (this.draggedContainer) {
      this.draggedContainer.style.opacity = ''
      this.draggedContainer = null
    }
  }

  private handleDragOver = (e: DragEvent): void => {
    const wrapper = (e.target as HTMLElement).closest?.('.outline-item-wrapper') as HTMLElement | null
    if (!wrapper) return
    e.stopPropagation()
    e.preventDefault()
    const clearOwn = () => wrapper.classList.remove('drag-over', 'drag-over-bottom', 'drag-over-inside')

    const view = this.views.get(wrapper.dataset.itemId ?? '')
    if (!view || !this.draggedId || this.draggedId === view.item.id) {
      clearOwn()
      return
    }
    // The target must not sit inside the dragged node's own subtree
    const targetContainer = wrapper.closest<HTMLElement>('.outline-item-container')
    if (!this.draggedContainer || !targetContainer || this.draggedContainer.contains(targetContainer)) {
      clearOwn()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'none'
      return
    }
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'

    const rect = wrapper.getBoundingClientRect()
    const relativeY = e.clientY - rect.top
    const position: DropPosition = relativeY < rect.height * 0.25 ? 'before' : relativeY > rect.height * 0.75 ? 'after' : 'inside'
    // Same edge of the same row: leave the indicator alone rather than thrashing
    // classes (and a style recalc) on every single dragover tick.
    if (this.dropIndicator?.el === wrapper && this.dropIndicator.position === position) return
    this.clearDropIndicator()
    wrapper.classList.add(position === 'before' ? 'drag-over' : position === 'after' ? 'drag-over-bottom' : 'drag-over-inside')
    this.dropIndicator = { el: wrapper, position }
  }

  private handleDragLeave = (e: DragEvent): void => {
    const wrapper = (e.target as HTMLElement).closest?.('.outline-item-wrapper') as HTMLElement | null
    if (!wrapper) return
    e.stopPropagation()
    if (!wrapper.contains(e.relatedTarget as Node)) {
      wrapper.classList.remove('drag-over', 'drag-over-bottom', 'drag-over-inside')
    }
  }

  private handleDrop = (e: DragEvent): void => {
    const wrapper = (e.target as HTMLElement).closest?.('.outline-item-wrapper') as HTMLElement | null
    if (!wrapper) return
    e.preventDefault()
    e.stopPropagation()
    const position = this.dropIndicator?.el === wrapper ? this.dropIndicator.position : null
    this.clearDropIndicator()
    const view = this.views.get(wrapper.dataset.itemId ?? '')
    const draggedId = this.draggedId
    if (!view || !draggedId || draggedId === view.item.id || !position) return
    this.applyOperation({ type: 'moveTo', id: draggedId, draggedId, targetId: view.item.id, dropPosition: position, shouldFocusCurrent: true })
  }

  private clearDropIndicator(): void {
    if (this.dropIndicator) {
      this.dropIndicator.el.classList.remove('drag-over', 'drag-over-bottom', 'drag-over-inside')
      this.dropIndicator = null
    }
  }

  private writeTopicHtml(el: HTMLElement, text: string, item: OutlineItem): void {
    if (this.markdown) {
      el.innerHTML = this.markdown(text, item)
    } else {
      el.textContent = text
    }
  }

  private escapeText(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // #endregion

  // #region events

  private getTopicEl(id: string): HTMLElement | null {
    return this.itemsEl.querySelector(`[data-outline-item][data-item-id="${CSS.escape(id)}"]`)
  }

  private liveEditingText(): { id: string; text: string } | null {
    if (!this.editingId) return null
    const el = this.getTopicEl(this.editingId)
    if (!el) return null
    return { id: this.editingId, text: el.textContent ?? '' }
  }

  private setTopicInDraft(draft: OutlineItem[], id: string, topic: string): void {
    const item = findItemById(draft, id)
    if (item) item.topic = topic
  }

  private handleFocusIn = (e: FocusEvent): void => {
    const el = e.target as HTMLElement
    if (!el.matches?.('[data-outline-item]')) return
    const id = el.getAttribute('data-item-id')!
    const item = findItemById(this.items, id)
    if (!item) return
    this.editingId = id
    // Swap the rendered markup back to raw source so it stays editable, and mark
    // the view dirty so a later sync restores the rendered form.
    el.textContent = item.topic
    const view = this.views.get(id)
    if (view) view.topicDirty = true
    this.placeCaretAtEnd(el)
  }

  /** Move the caret to the end of `el`'s contents. */
  private placeCaretAtEnd(el: HTMLElement): void {
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }

  /** Remember that `view.topic` already shows `topic`'s rendered markup. */
  private markTopicClean(id: string, topic: string): void {
    const view = this.views.get(id)
    if (!view) return
    view.topicText = topic
    view.topicDirty = false
  }

  private handleFocusOut = (e: FocusEvent): void => {
    const el = e.target as HTMLElement
    if (!el.matches?.('[data-outline-item]')) return
    const id = el.getAttribute('data-item-id')!
    if (this.editingId !== id) return
    this.editingId = null
    const text = el.textContent ?? ''
    if (this.mei) {
      // Route to the map; patch only this element so a following click (menu,
      // other item) is not swallowed by the sync re-render
      const item = findItemById(this.items, id)
      if (item && item.topic !== text) this.setNodeTopicBound(id, text)
      const updated = findItemById(this.items, id)
      if (updated) this.writeTopicHtml(el, updated.topic, updated)
      this.markTopicClean(id, updated?.topic ?? text)
      return
    }
    // Single history entry for the topic edit; patch only this element so a
    // following click (menu, other item) is not swallowed by a full re-render
    this.commit(
      draft => {
        this.setTopicInDraft(draft, id, text)
        return draft
      },
      { op: 'finishEdit', id }
    )
    const item = findItemById(this.items, id)
    if (item) this.writeTopicHtml(el, item.topic, item)
    this.markTopicClean(id, item?.topic ?? text)
  }

  private handleTopicKeydown = (e: KeyboardEvent): void => {
    if (e.isComposing) return
    const el = (e.target as HTMLElement).closest?.('[data-outline-item]') as HTMLElement | null
    if (!el || this.readonly) return
    const id = el.getAttribute('data-item-id')!
    const topic = el.textContent?.trim()
    const parentId = this.findParentId(id)

    if (e.key === 'ArrowUp' && e.altKey) {
      e.preventDefault()
      this.applyOperation({ type: 'moveUp', id, parentId, shouldFocusCurrent: true })
    } else if (e.key === 'ArrowDown' && e.altKey) {
      e.preventDefault()
      this.applyOperation({ type: 'moveDown', id, parentId, shouldFocusCurrent: true })
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      const all = Array.from(this.itemsEl.querySelectorAll<HTMLElement>('[data-outline-item]'))
      const index = all.indexOf(el)
      if (index === -1) return
      const next = all[index + (e.key === 'ArrowUp' ? -1 : 1)]
      if (next) {
        el.blur()
        next.focus()
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        this.applyOperation({ type: 'addSiblingBefore', id, parentId, shouldFocusNew: true })
        return
      }
      const fullText = el.textContent ?? ''
      const selection = window.getSelection()
      let cursorPosition = fullText.length
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const preCaretRange = range.cloneRange()
        preCaretRange.selectNodeContents(el)
        preCaretRange.setEnd(range.endContainer, range.endOffset)
        cursorPosition = preCaretRange.toString().length
      }
      const textBefore = fullText.substring(0, cursorPosition)
      const textAfter = fullText.substring(cursorPosition)
      if (textBefore.trim() === '' && textAfter.trim() === '') {
        this.applyOperation({ type: 'outdent', id, parentId, shouldFocusCurrent: true, topic: '' })
      } else if (textAfter.trim() !== '') {
        if (this.mei) {
          const meiEl = this.meiEle(id)
          if (meiEl) {
            const newId = generateUUID()
            const item = findItemById(this.items, id)
            if (textBefore !== (item?.topic ?? '')) this.setNodeTopicBound(id, textBefore)
            this.mei.insertSibling('after', meiEl, { id: newId, topic: textAfter, children: [] } as NodeObj)
            this.focusItem(newId)
          }
          return
        }
        // Split at cursor into two nodes — one history entry
        const newId = generateUUID()
        const ok = this.commit(
          draft => {
            this.setTopicInDraft(draft, id, textBefore)
            return addSiblingOperation(draft, id, parentId, { id: newId, topic: textAfter, children: [] })
          },
          { op: 'addSibling', id }
        )
        if (!ok) return
        this.render()
        this.focusItem(newId)
      } else {
        this.applyOperation({ type: 'addSibling', id, parentId, shouldFocusNew: true })
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      this.applyOperation({ type: e.shiftKey ? 'outdent' : 'indent', id, parentId, shouldFocusCurrent: true, topic })
    } else if (e.key === 'Backspace' && topic === '' && this.findDepth(id) > 1) {
      e.preventDefault()
      this.deleteItem(id, parentId)
    }
  }

  /**
   * Single click router for the whole list. Every node interaction used to be its
   * own listener — 5 per node, recreated on every render — which both cost time
   * and made "read the current value" depend on a closure that the incremental
   * renderer deliberately keeps alive.
   */
  private handleClick = (e: MouseEvent): void => {
    const t = e.target as HTMLElement
    if (!t.closest || t.closest('.breadcrumb-item')) return

    const id = t.closest<HTMLElement>('.outline-item-container')?.dataset.itemId

    const menuItem = t.closest<HTMLElement>('.outline-item-menu-item')
    if (menuItem) {
      e.stopPropagation()
      this.runMenuAction(menuItem.dataset.action ?? '')
      return
    }

    if (t.closest('.outline-item-menu-btn')) {
      e.stopPropagation()
      if (id) this.toggleMenu(id)
      return
    }

    if (t.closest('.outline-item-collapse-btn')) {
      e.stopPropagation()
      const view = id ? this.views.get(id) : undefined
      if (view) this.updateItem(id!, { expanded: view.item.expanded === false })
      return
    }

    if (t.closest('.outline-item-dot')) {
      e.stopPropagation()
      if (id) this.zoomTo(id)
      return
    }

    // Clicking anywhere else closes an open menu without a full re-render
    this.setOpenMenu(null)
  }

  private handleDocumentMousedown = (e: MouseEvent): void => {
    if (!this.openMenuId) return
    if ((e.target as HTMLElement).closest?.('.outline-item-menu-wrapper')) return
    this.setOpenMenu(null)
  }

  /**
   * Global Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z. While a topic is being edited the
   * browser's native contenteditable undo runs first; only when it is
   * exhausted do we fall through to the shared history stack.
   */
  private handleGlobalKeydown = (e: KeyboardEvent): void => {
    const active = document.activeElement as HTMLElement | null
    const isContentEditable = !!active && (active.getAttribute('contenteditable') === 'true' || active.isContentEditable)
    const isInputElement = !!active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
    const isModifier = e.metaKey || e.ctrlKey
    const key = e.key.toLowerCase()

    if (isContentEditable && isModifier && key === 'z' && !e.shiftKey) {
      const currentContent = active.textContent || ''
      let undoResult = false
      try {
        undoResult = document.execCommand('undo')
      } catch {
        undoResult = false
      }
      setTimeout(() => {
        const newContent = active.textContent || ''
        if (!undoResult || currentContent === newContent) {
          active.blur()
          this.stack.undo()
        }
      }, 0)
      return
    }

    if (isInputElement || isContentEditable) return

    if (isModifier && key === 'z' && !e.shiftKey) {
      e.preventDefault()
      this.stack.undo()
    } else if (isModifier && (key === 'y' || (key === 'z' && e.shiftKey))) {
      e.preventDefault()
      this.stack.redo()
    }
  }

  // #endregion

  private zoomTo(id: string | null): void {
    // Zooming usually takes the menu's node out of the rendered set, so close it
    // explicitly rather than leaving `openMenuId` pointing at an unmounted view.
    this.setOpenMenu(null)
    this.zoomedId = id
    // This render is newer than anything a pending deferred sync could produce
    this.syncDirty = false
    this.render()
  }

  private findParentId(id: string): string | undefined {
    const path = findPathToNode(this.items, id)
    return path && path.length > 1 ? path[path.length - 2].id : (this.zoomedId ?? undefined)
  }

  private findDepth(id: string): number {
    return findPathToNode(this.items, id)?.length ?? 1
  }
}
