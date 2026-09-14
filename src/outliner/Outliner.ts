import './outliner.css'
import type MindElixir from '../index'
import type { NodeObj } from '../types/index'
import type { Topic } from '../types/dom'
import { generateUUID, getObjById } from '../utils/index'
import type { HistoryStack } from '../utils/historyStack'
import { svgIcon } from './icons'
import { defaultI18n } from './types'
import type { ItemOperation, OutlinerI18n, OutlinerOptions } from './types'

type DropPosition = 'before' | 'inside' | 'after'

/**
 * The outline's view of the map's tree: `children` is always an array.
 *
 * `NodeObj.children` is optional, but every walk below reads it unconditionally
 * (`for (const child of item.children)`), so {@link ensureChildren} fills the
 * holes once per tree and every accessor hands the filled shape back.
 */
type LiveNode = NodeObj & { children: LiveNode[] }

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
  item: LiveNode
  level: number
  parentId: string | undefined
  siblingCount: number
}

/**
 * Give every node a `children` array, in place.
 *
 * The map owns the tree, so this is the one write the outline performs on it —
 * a shape normalisation it needs to walk the tree the same way for rendering and
 * for the breadcrumb. Idempotent: after the first pass over a tree, a repeat
 * costs one traversal and nothing else.
 */
const ensureChildren = (node: LiveNode): void => {
  if (!node.children) node.children = []
  node.children.forEach(ensureChildren)
}

/**
 * A mind-elixir outliner — ONE document, TWO views.
 *
 * The outline renders `mei.nodeData` in place (same reference, no clone), routes
 * every mutation to the map through the map's own node operations, and re-reads
 * the tree whenever the map's undo/redo journal moves. It therefore owns **no
 * data and no history of its own**: an edit made in the outline is a map edit, a
 * `Ctrl+Z` from either view walks one timeline, and a change made on the map —
 * including one made programmatically — shows up here.
 *
 * ```ts
 * const mei = new MindElixir({ el: '#map', allowUndo: true })
 * await mei.init(data)
 * const outliner = new Outliner({ el: '#outline', mei })
 * ```
 *
 * Sync runs on BOTH of the map's channels: the shared journal (structural edits,
 * undo/redo — collapse/expand lands there too) and the map's `expandNode` event,
 * which covers silent internal expands that record no entry of their own. Both
 * merge into one render per tick.
 *
 * A node that the map does not render — i.e. inside a collapsed branch — has no
 * element to operate on, so outline gestures on it are no-ops; unfolding the
 * branch in the map makes it work again. That is mind-elixir's own API shape:
 * every node operation takes a `Topic` element, not a `NodeObj`.
 */
export class Outliner {
  private el: HTMLElement
  private breadcrumbEl: HTMLElement
  private itemsEl: HTMLElement
  /** The map's live root (`mei.nodeData`), never a copy — assigned by {@link bindRoot}. */
  private root!: LiveNode
  /** The map's journal (`mei.historyStack`). The outline subscribes to it and pushes nothing. */
  private readonly history: HistoryStack
  private readonly mei: MindElixir
  /** While true, a sync skips its render (patch-only topic commits). */
  private suppressSync = false
  /** A deferred sync is owed — see `scheduleSync`. */
  private syncDirty = false
  /** A deferred sync flush is already queued for the end of this tick. */
  private syncQueued = false
  private readonly: boolean
  private markdown?: (markdown: string, obj: NodeObj) => string
  private i18n: OutlinerI18n
  private fileName?: string
  private onChange?: (data: NodeObj) => void

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
    this.mei = options.mei
    // Refuse to render the map's document without the map's journal: an outline
    // running on a private stack would look identical until the first Ctrl+Z.
    if (!this.mei.historyStack) {
      throw new Error('Outliner: mei.historyStack is missing — create the MindElixir instance with `allowUndo: true` and await `init`')
    }
    this.history = this.mei.historyStack
    this.readonly = options.readonly ?? false
    this.markdown = options.markdown
    this.i18n = { ...defaultI18n, ...options.i18n }
    this.fileName = options.fileName
    this.onChange = options.onChange
    this.bindRoot()

    this.breadcrumbEl = document.createElement('div')
    this.breadcrumbEl.className = 'outliner-breadcrumb'
    this.itemsEl = document.createElement('div')
    this.itemsEl.className = 'outliner-items'
    const container = document.createElement('div')
    container.className = 'outliner-container'
    container.appendChild(this.breadcrumbEl)
    container.appendChild(this.itemsEl)
    this.el.appendChild(container)

    // The outline pushes no entries of its own — every journal change (a map
    // operation, undo, redo, clear) makes it re-adopt the live tree.
    this.disposers.push(this.history.subscribe(this.requestSync))
    // Collapse/expand lands on the shared journal like any other edit, but the
    // map also fires 'expandNode' — that channel is still needed for SILENT
    // expands (auto-expanding a collapsed parent before a child is added), which
    // record nothing on their own. The journal channel renders synchronously;
    // this one defers, so the pair costs one render instead of two without
    // either notification being dropped (see `scheduleSync`).
    this.mei.bus.addListener('expandNode', this.scheduleSync)
    this.disposers.push(() => this.mei.bus.removeListener('expandNode', this.scheduleSync))
    // Undo/redo while the focus is anywhere - see the containment guard in the
    // handler for why the map's own shortcut must not be handled twice.
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
   * A detached snapshot of what the outline currently shows, with the map's
   * `parent` back-references stripped — `mei.stringifyData` is mind-elixir's own
   * serializer, so this is the same shape `mei.getData()` produces.
   *
   * In focus mode the outline renders the focused subtree while `getData()`
   * reports the whole diagram, so this follows the OUTLINE's root.
   */
  getData(): NodeObj {
    return JSON.parse(this.mei.stringifyData(this.root)) as NodeObj
  }

  /** Insert an empty child under `id` in the map and focus it in the outline. */
  addChild(id: string): void {
    const el = this.meiEle(id)
    if (!el) return
    this.flushEditingText()
    const newId = generateUUID()
    this.mei.addChild(el, { id: newId, topic: '', children: [] })
    this.focusItem(newId)
  }

  destroy(): void {
    this.disposers.forEach(fn => fn())
    this.disposers = []
    this.el.removeEventListener('keydown', this.handleTopicKeydown)
    this.el.removeEventListener('keydown', this.handleGlobalKeydown)
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

  // #region the live tree (the map owns it; the outline only reads it)

  /**
   * Point `this.root` at the live `mei.nodeData` and normalise it in place — no
   * clone, the map owns the data.
   *
   * Between `refresh` calls (undo/redo) this is the same reference, so the
   * assignment is a no-op and only the `ensureChildren` pass runs; a swapped
   * tree — a new document, or the subtree focus mode installs — re-points it.
   */
  private bindRoot(): void {
    const nodeData = this.mei.nodeData as LiveNode
    if (this.root !== nodeData) this.root = nodeData
    ensureChildren(nodeData)
  }

  /**
   * Look a node up with the map's own depth-first search. The outline keeps
   * neither a copy of the tree nor an index over it.
   */
  private byId(id: string): LiveNode | null {
    return getObjById(id, this.root) as LiveNode | null
  }

  private isRoot(id: string): boolean {
    return this.root.id === id
  }

  private parentOf(id: string): LiveNode | null {
    return (this.byId(id)?.parent as LiveNode | undefined) ?? null
  }

  /**
   * The previous sibling, straight off the map's `parent` back-references (kept
   * current by mind-elixir's `fillParent`) instead of a second tree walk.
   */
  private prevSiblingOf(id: string): LiveNode | null {
    const node = this.byId(id)
    const siblings = node?.parent?.children as LiveNode[] | undefined
    if (!node || !siblings) return null
    const index = siblings.indexOf(node)
    return index > 0 ? siblings[index - 1] : null
  }

  /**
   * Root-to-node path for the breadcrumb, walked upwards through `parent`.
   *
   * It stops at the rendered document root: in focus mode `mei.nodeData` is a
   * subtree whose `parent` still points into the map's backup tree, and the
   * breadcrumb must not show segments above what is on screen.
   */
  private pathTo(id: string): Array<{ id: string; topic: string }> {
    const path: Array<{ id: string; topic: string }> = []
    let node: LiveNode | null = this.byId(id)
    while (node) {
      path.unshift({ id: node.id, topic: node.topic })
      if (node.id === this.root.id) break
      node = (node.parent as LiveNode | undefined) ?? null
    }
    return path
  }

  /**
   * The node's element in the map. Null when the map does not render it — a node
   * inside a collapsed branch has no DOM, and every mind-elixir operation takes an
   * element, so such a node simply cannot be acted on from the outline.
   */
  private meiEle(id: string): Topic | null {
    try {
      return this.mei.findEle(id)
    } catch {
      return null
    }
  }

  // #endregion

  // #region sync (the map's journal + its expandNode event)

  /**
   * Ask for a sync and RENDER NOW. Callers such as `applyOperation` focus a node
   * right after the map call, which needs the fresh DOM, so this channel stays
   * synchronous.
   *
   * Renders even if one already ran in this tick, because the notification that
   * brought us here may describe a NEWER tree than that render saw — see
   * `scheduleSync` for why the two channels must not share a coalescing window.
   */
  private requestSync = (): void => {
    if (this.suppressSync) return
    this.syncDirty = false
    this.rerenderFromMei()
  }

  /**
   * Deferred variant, wired to the map's `expandNode` bus event.
   *
   * That event is the only channel reporting a mutation the journal does not
   * also announce: a tracked fold fires it and then pushes an entry (which
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
    if (this.suppressSync) return
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
   * Re-render the outline from the live map tree. Called on every journal
   * change, so it re-reads `this.root` (undo/redo may have swapped the tree) and
   * drops view state that may point at now-missing nodes.
   */
  private rerenderFromMei(): void {
    if (this.suppressSync) return
    this.bindRoot()
    if (this.zoomedId && !this.byId(this.zoomedId)) this.zoomedId = null
    this.editingId = null
    this.openMenuId = null
    this.render()
    this.emitChange()
  }

  private emitChange(): void {
    this.onChange?.(this.getData())
  }

  // #endregion

  // #region operations (each one is a call into the map)

  /**
   * Flush unsaved typing (from the outline editor) into the map via
   * `reshapeNode` so a following structural move cannot lose it. Skipped when
   * the text is unchanged (reshapeNode would push a no-op journal entry).
   */
  private flushEditingText(): void {
    const editing = this.liveEditingText()
    if (!editing) return
    const item = this.byId(editing.id)
    if (item && item.topic !== editing.text) this.setNodeTopicBound(editing.id, editing.text)
  }

  private setNodeTopicBound(id: string, topic: string): void {
    const el = this.meiEle(id)
    if (!el) return
    // reshapeNode (not setNodeTopic) — it fires the tracked 'reshapeNode'
    // operation so the edit lands on the shared journal, and writes the live
    // tree node directly (this.root IS mei.nodeData — no mirror patch).
    // Patch-only display: suppress the sync re-render (same rationale as
    // focus-out — a full render would swallow the click that caused the blur).
    this.suppressSync = true
    try {
      this.mei.reshapeNode(el, { topic })
    } finally {
      this.suppressSync = false
    }
  }

  private expandBound(id: string, isExpand: boolean): void {
    const el = this.meiEle(id)
    if (!el) return
    // expandNode records a tracked 'operation' AND fires 'expandNode'; the
    // constructor subscriptions handle re-rendering (the journal channel, see
    // `requestSync`), so this path and map-side folding behave identically —
    // including undo, which covers folds made from either view.
    this.mei.expandNode(el, isExpand)
  }

  /**
   * Route ONE outline gesture to the map.
   *
   * Every case is a call into mind-elixir's own node operations: the outline
   * never touches the tree, and the operation the map fires is what records the
   * journal entry that brings us back here through `requestSync`.
   */
  private applyOperation(op: ItemOperation): void {
    if (this.readonly) return
    // The root has no mind-map equivalent for any of these gestures: no parent to
    // outdent into, no sibling to swap with.
    if (this.isRoot(op.id)) return
    this.flushEditingText()
    const el = this.meiEle(op.id)
    // Not rendered in the map (collapsed branch) → nothing to act on.
    if (!el) return
    const newId = op.type === 'addSibling' || op.type === 'addSiblingBefore' ? generateUUID() : null
    const node = newId ? ({ id: newId, topic: op.newNodeContent ?? '', children: [] } satisfies NodeObj) : undefined
    switch (op.type) {
      case 'addSibling':
        this.mei.insertSibling('after', el, node)
        break
      case 'addSiblingBefore':
        this.mei.insertSibling('before', el, node)
        break
      case 'indent': {
        const prev = this.prevSiblingOf(op.id)
        const prevEl = prev ? this.meiEle(prev.id) : null
        if (prevEl) this.mei.moveNodesIn([el], prevEl)
        break
      }
      case 'outdent': {
        // Outdenting a root child has no mind-map equivalent (would leave the tree)
        const parent = this.parentOf(op.id)
        const parentEle = parent && !this.isRoot(parent.id) ? this.meiEle(parent.id) : null
        if (parentEle) this.mei.moveNodesAfter([el], parentEle)
        break
      }
      case 'moveUp':
        this.mei.moveUpNode(el)
        break
      case 'moveDown':
        this.mei.moveDownNode(el)
        break
      case 'moveTo': {
        const targetEle = op.targetId ? this.meiEle(op.targetId) : null
        if (!targetEle || (this.isRoot(op.targetId!) && op.dropPosition !== 'inside')) break
        if (op.dropPosition === 'before') this.mei.moveNodesBefore([el], targetEle)
        else if (op.dropPosition === 'after') this.mei.moveNodesAfter([el], targetEle)
        else this.mei.moveNodesIn([el], targetEle)
        break
      }
    }
    // The map call fired its operation → journal push → rerenderFromMei
    if (newId) this.focusItem(newId)
    else if (op.shouldFocusCurrent) this.focusItem(op.id)
  }

  /** Remove a node and its subtree from the map (never the document root). */
  private deleteItem(id: string): void {
    if (this.readonly || this.isRoot(id)) return
    // Pick the focus target from DOM order BEFORE deletion
    const currentEl = this.getTopicEl(id)
    let nextFocusId: string | null = null
    if (currentEl) {
      const all = Array.from(this.itemsEl.querySelectorAll<HTMLElement>('[data-outline-item]'))
      const index = all.indexOf(currentEl)
      if (index > 0) nextFocusId = all[index - 1].getAttribute('data-item-id')
      else nextFocusId = this.parentOf(id)?.id ?? null
    }
    this.flushEditingText()
    const el = this.meiEle(id)
    if (!el) return
    this.mei.removeNodes([el])
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
    if (this.zoomedId && !this.byId(this.zoomedId)) this.zoomedId = null

    this.renderBreadcrumb()

    // Items — reconcile, don't rebuild.
    const zoomed = this.zoomedId ? this.byId(this.zoomedId) : null
    const displayItems: LiveNode[] = zoomed ? zoomed.children : [this.root]
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
    const path = this.zoomedId ? this.pathTo(this.zoomedId) : []
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
    item: LiveNode,
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
  private createItemView(item: LiveNode, level: number, parentId: string | undefined, siblingCount: number): ItemView {
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
  private patchItemView(view: ItemView, item: LiveNode, level: number, parentId: string | undefined, siblingCount: number): void {
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
    const { item, level, siblingCount } = view
    this.setOpenMenu(null)
    if (action === 'outdent') {
      this.applyOperation({ type: 'outdent', id: item.id, shouldFocusCurrent: true })
    } else if (action === 'indent') {
      this.applyOperation({ type: 'indent', id: item.id, shouldFocusCurrent: true })
    } else if (action === 'delete' && (level > 0 || siblingCount > 1)) {
      this.deleteItem(item.id)
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
    this.applyOperation({ type: 'moveTo', id: draggedId, targetId: view.item.id, dropPosition: position, shouldFocusCurrent: true })
  }

  private clearDropIndicator(): void {
    if (this.dropIndicator) {
      this.dropIndicator.el.classList.remove('drag-over', 'drag-over-bottom', 'drag-over-inside')
      this.dropIndicator = null
    }
  }

  private writeTopicHtml(el: HTMLElement, text: string, item: LiveNode): void {
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

  private handleFocusIn = (e: FocusEvent): void => {
    const el = e.target as HTMLElement
    if (!el.matches?.('[data-outline-item]')) return
    const id = el.getAttribute('data-item-id')!
    const item = this.byId(id)
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
    // Route to the map; patch only this element so a following click (menu,
    // other item) is not swallowed by the sync re-render
    const item = this.byId(id)
    if (item && item.topic !== text) this.setNodeTopicBound(id, text)
    const updated = this.byId(id)
    if (updated) this.writeTopicHtml(el, updated.topic, updated)
    this.markTopicClean(id, updated?.topic ?? text)
  }

  private handleTopicKeydown = (e: KeyboardEvent): void => {
    if (e.isComposing) return
    const el = (e.target as HTMLElement).closest?.('[data-outline-item]') as HTMLElement | null
    if (!el || this.readonly) return
    const id = el.getAttribute('data-item-id')!
    const topic = el.textContent?.trim()

    if (e.key === 'ArrowUp' && e.altKey) {
      e.preventDefault()
      this.applyOperation({ type: 'moveUp', id, shouldFocusCurrent: true })
    } else if (e.key === 'ArrowDown' && e.altKey) {
      e.preventDefault()
      this.applyOperation({ type: 'moveDown', id, shouldFocusCurrent: true })
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
        this.applyOperation({ type: 'addSiblingBefore', id })
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
        this.applyOperation({ type: 'outdent', id, shouldFocusCurrent: true })
      } else if (textAfter.trim() !== '') {
        // Split at the cursor: patch this node's topic on the map, then insert
        // the tail as a new sibling.
        const meiEl = this.meiEle(id)
        if (!meiEl) return
        const newId = generateUUID()
        const item = this.byId(id)
        if (textBefore !== (item?.topic ?? '')) this.setNodeTopicBound(id, textBefore)
        this.mei.insertSibling('after', meiEl, { id: newId, topic: textAfter, children: [] })
        this.focusItem(newId)
      } else {
        this.applyOperation({ type: 'addSibling', id })
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      this.applyOperation({ type: e.shiftKey ? 'outdent' : 'indent', id, shouldFocusCurrent: true })
    } else if (e.key === 'Backspace' && topic === '' && !this.isRoot(id)) {
      // `deleteItem` refuses the document root anyway; the check keeps the
      // keystroke from being swallowed for a no-op.
      e.preventDefault()
      this.deleteItem(id)
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
      // `expanded: undefined` means expanded (the map's own default), so only an
      // explicit `false` flips this click into an expand.
      if (view) this.expandBound(view.item.id, view.item.expanded === false)
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
   * Global Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z — one journal for both views.
   *
   * The map binds the same shortcut on `mei.container` (see
   * `plugin/operationHistory`), so a keypress whose focus sits there is already
   * handled: matching it here as well would undo twice per keystroke. Everything
   * else — the focus in an outline topic, on an outline button, or nowhere in
   * particular — ends at `mei.undo` / `mei.redo`, i.e. the SAME journal. The
   * outline never keeps a stack of its own to step through.
   *
   * While a topic is being edited the browser's native contenteditable undo runs
   * first; only when it is exhausted do we step the journal.
   */
  private handleGlobalKeydown = (e: KeyboardEvent): void => {
    if (this.mei.container?.contains(e.target as Node)) return
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
          this.mei.undo()
        }
      }, 0)
      return
    }

    if (isInputElement || isContentEditable) return

    if (isModifier && key === 'z' && !e.shiftKey) {
      e.preventDefault()
      this.mei.undo()
    } else if (isModifier && (key === 'y' || (key === 'z' && e.shiftKey))) {
      e.preventDefault()
      this.mei.redo()
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
}
