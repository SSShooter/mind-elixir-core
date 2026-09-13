import type { ExpandNodeOptions, NodeObj } from '../types/index'
import type { Topic } from '../types/dom'
import type { EventMap } from '../utils/pubsub'
import type { createBus } from '../utils/pubsub'
import type { HistoryStack } from '../utils/historyStack'

export interface OutlineItem {
  id: string
  topic: string
  children: OutlineItem[]
  expanded?: boolean
}

/** Loose input shape — `children` is normalized to `[]` on init. */
export interface OutlineData {
  id: string
  topic: string
  children?: OutlineData[]
  expanded?: boolean
}

export interface ItemOperation {
  type: 'addSibling' | 'indent' | 'outdent' | 'moveUp' | 'moveDown' | 'addSiblingBefore' | 'moveTo'
  id: string
  parentId?: string
  shouldFocusNew?: boolean
  shouldFocusCurrent?: boolean
  topic?: string
  newNodeContent?: string
  // For drag and drop operations
  draggedId?: string
  targetId?: string
  dropPosition?: 'before' | 'after' | 'inside'
}

export interface OutlinerI18n {
  menuTitle: string
  outdent: string
  indent: string
  delete: string
  zoomIn: string
  untitled: string
  dragToMove: string
  zoomInAndDrag: string
}

/**
 * Minimal structural surface of a MindElixir instance used by bound mode.
 * `MindElixir` satisfies this — the outliner stays dependency-free (no runtime import).
 *
 * In bound mode the outliner owns NO data: `nodeData` is the single source of
 * truth and every mutation is routed through these methods, so the map and the
 * outline are two views of ONE document and undo/redo works from both sides.
 */
export interface OutlinerMei {
  nodeData: NodeObj
  /**
   * Shared undo/redo timeline. Present only when the MindElixir instance was
   * created with `allowUndo: true` and `init` has resolved. In bound mode the
   * outliner defaults its `history` to this stack, so outline and map stay on
   * ONE timeline. Absent → bound mode is impossible (constructor throws).
   */
  historyStack?: HistoryStack
  /**
   * Event bus. Collapse/expand records a tracked operation (so the shared stack
   * already announces it) AND fires `expandNode`. The stack channel renders
   * synchronously while `expandNode` defers, so the pair costs one render
   * without either notification being dropped — see `scheduleSync`.
   */
  bus?: ReturnType<typeof createBus<EventMap>>
  /** Throws when the node is not rendered (e.g. collapsed in the map). */
  findEle(id: string): Topic
  addChild(el?: Topic, node?: NodeObj): unknown
  insertSibling(type: 'before' | 'after', el?: Topic, node?: NodeObj): unknown
  removeNodes(tpcs: Topic[]): unknown
  moveUpNode(el?: Topic): unknown
  moveDownNode(el?: Topic): unknown
  moveNodesIn(from: Topic[], to: Topic): unknown
  moveNodesBefore(from: Topic[], to: Topic): unknown
  moveNodesAfter(from: Topic[], to: Topic): unknown
  /** Tracked topic/style change — fires the 'reshapeNode' operation event. */
  reshapeNode(el: Topic, patchData: Partial<NodeObj>): unknown
  /** Tracked collapse/expand — fires the 'expandNode' operation event unless `silent`. */
  expandNode(el: Topic, isExpand?: boolean, options?: ExpandNodeOptions): unknown
}

export interface OutlinerOptions {
  /** Container element or selector. The outliner takes over its content. */
  el: HTMLElement | string
  /**
   * Bind to a MindElixir instance — ONE data, TWO views. The outline mirrors
   * `mei.nodeData`, every mutation is routed to the map (which fires history
   * operations), and the outline re-syncs via the shared stack. `data` is then
   * ignored.
   */
  mei?: OutlinerMei
  /** Standalone dataset. Required unless `mei` is given. */
  data?: OutlineData[]
  /**
   * Share an existing HistoryStack — e.g. `mei.historyStack` — so outline
   * operations and mind-map operations interleave on ONE undo/redo timeline.
   * Omit to let the outliner run on its own private stack.
   */
  history?: HistoryStack
  /** Document name used in the shared stack. Distinct outliners on one stack need distinct names. */
  docName?: string
  readonly?: boolean
  /** Render the topic as HTML when not editing (e.g. a markdown renderer). */
  markdown?: (text: string, item: OutlineItem) => string
  fileName?: string
  i18n?: Partial<OutlinerI18n>
  onChange?: (data: OutlineItem[]) => void
}

export const defaultI18n: OutlinerI18n = {
  menuTitle: '操作菜单',
  outdent: '取消缩进',
  indent: '缩进',
  delete: '删除',
  zoomIn: '点击进入',
  untitled: '(无标题)',
  dragToMove: '拖拽移动',
  zoomInAndDrag: '点击进入 / 拖拽移动',
}
