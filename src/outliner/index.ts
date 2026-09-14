/**
 * The outliner — a second view of ONE MindElixir document.
 *
 * The outline renders `mei.nodeData` in place and routes every mutation back to
 * the map through the map's own node operations, so the map and the outline are
 * two views of the same tree and share the same undo/redo journal:
 *
 * ```ts
 * import MindElixir, { Outliner } from 'mind-elixir'
 * const mei = new MindElixir({ el: '#map', allowUndo: true })
 * await mei.init(data)
 * // `mei` supplies both the data and the history — nothing else is passed
 * const outliner = new Outliner({ el: '#outline', mei })
 * ```
 *
 * The outline syncs on BOTH of the map's channels: the shared journal
 * (structural edits, undo/redo — collapse/expand lands there too) and the map's
 * `expandNode` event, which still covers silent internal expands that record no
 * entry of their own. Both merge into one render per tick.
 */
export { Outliner } from './Outliner'
export { defaultI18n } from './types'
export type { ItemOperation, OutlinerI18n, OutlinerOptions } from './types'
