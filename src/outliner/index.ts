/**
 * Pure-JS outliner, refactored from react-outliner.
 *
 * Bind to a mind-elixir instance — ONE data, TWO views. The outline renders
 * `mei.nodeData` in place (live reference, no clone), routes every mutation
 * to the map, and both views share the same undo/redo timeline:
 *
 * ```ts
 * import MindElixir, { Outliner } from 'mind-elixir'
 * const mei = new MindElixir({ el: '#map', allowUndo: true })
 * await mei.init(data)
 * // `history` is inferred from mei.historyStack — no need to pass it
 * const outliner = new Outliner({ el: '#outline', mei })
 * ```
 *
 * Or run standalone on its own dataset (private history stack by default):
 *
 * ```ts
 * const outliner = new Outliner({ el: '#outline', data: outline })
 * ```
 *
 * In bound mode the outline syncs on BOTH channels: the shared history stack
 * (structural edits, undo/redo) and the map's `expandNode` event. Collapsing
 * a node on the map never touches the history stack, so the bus listener is
 * what keeps the two views in step.
 */
export { Outliner } from './Outliner'
export { findItemById, findPathToNode } from './operations'
export { defaultI18n } from './types'
export type { OutlineItem, OutlineData, ItemOperation, OutlinerI18n, OutlinerMei, OutlinerOptions } from './types'
