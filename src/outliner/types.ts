import type MindElixir from '../index'
import type { NodeObj } from '../types/index'

/**
 * One gesture the outline asks the map to perform.
 *
 * The payload carries only what the gesture itself needs to know: the tree it
 * applies to belongs to MindElixir, and the outline holds no clone of it. The
 * `id` is always the node the gesture is *about* — for a drag & drop that is
 * the dragged node.
 */
export interface ItemOperation {
  type: 'addSibling' | 'indent' | 'outdent' | 'moveUp' | 'moveDown' | 'addSiblingBefore' | 'moveTo'
  id: string
  /** Focus the node again after the gesture — the row is reused, so focus has to be re-placed. */
  shouldFocusCurrent?: boolean
  /** Topic of the node the gesture creates (`addSibling` / `addSiblingBefore` / the split path). */
  newNodeContent?: string
  /** `moveTo` only: the drop target. */
  targetId?: string
  /** `moveTo` only: where the dragged node lands relative to `targetId`. */
  dropPosition?: 'before' | 'after' | 'inside'
}

export interface OutlinerI18n {
  menuTitle: string
  outdent: string
  indent: string
  delete: string
  untitled: string
  zoomInAndDrag: string
}

export interface OutlinerOptions {
  /** Container element or selector. The outliner takes over its content. */
  el: HTMLElement | string
  /**
   * The MindElixir instance that owns the document — **required**, and the only
   * thing the outline is bound to. It supplies both halves of the binding:
   *
   * - the **data** (`mei.nodeData`), rendered BY REFERENCE: the outline keeps no
   *   copy and every mutation is routed back through the map's own operations,
   *   so the map and the outline are two views of ONE document;
   * - the **history** (`mei.historyStack`), the map's undo/redo journal. The
   *   outline pushes nothing onto it — it re-adopts the live tree whenever the
   *   timeline moves, which is what makes edits from either view undoable from
   *   either view.
   *
   * The instance must be created with `allowUndo: true` and awaited through
   * `init`: the constructor throws without a stack, since a private one is
   * exactly the drift this binding exists to prevent.
   */
  mei: MindElixir
  readonly?: boolean
  /**
   * Render a topic as HTML while it is not being edited — pass the map's own
   * renderer (`new MindElixir({ markdown })`) and both views show the same thing.
   * Focusing an item swaps back to the raw source, so it stays editable.
   */
  markdown?: (markdown: string, obj: NodeObj) => string
  /** Label of the breadcrumb root. */
  fileName?: string
  i18n?: Partial<OutlinerI18n>
  /** Called with a detached snapshot after every change that reached the outline. */
  onChange?: (data: NodeObj) => void
}

export const defaultI18n: OutlinerI18n = {
  menuTitle: '操作菜单',
  outdent: '取消缩进',
  indent: '缩进',
  delete: '删除',
  untitled: '(无标题)',
  zoomInAndDrag: '点击进入 / 拖拽移动',
}
