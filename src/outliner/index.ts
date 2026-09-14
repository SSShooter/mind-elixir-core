/**
 * The outliner — a second view of ONE MindElixir document.
 *
 * The outline renders `mei.nodeData` in place and routes every mutation back to
 * the map through the map's own node operations, so the map and the outline are
 * two views of the same tree and share the same undo/redo journal:
 *
 * ```ts
 * import MindElixir from 'mind-elixir'
 * import { Outliner } from 'mind-elixir/outliner'
 * import 'mind-elixir/outliner/style.css'
 * const mei = new MindElixir({ el: '#map', allowUndo: true })
 * await mei.init(data)
 * // `mei` supplies both the data and the history — nothing else is passed
 * const outliner = new Outliner({ el: '#outline', mei })
 * ```
 *
 * Two import paths reach this module, and both stay supported:
 *
 * - `mind-elixir/outliner` — the outline on its own, for hosts that want the
 *   outline without the map. The bundle is self-contained (it shares no module
 *   state with the map) and carries its own stylesheet, so
 *   `mind-elixir/outliner/style.css` is enough to style it.
 * - `mind-elixir` — the main entry re-exports it, and its `style.css` already
 *   contains the outline rules. Use this when the map and the outline live in
 *   the same app and one stylesheet is preferable.
 *
 * A host that imports from both paths ends up with two copies of the class, the
 * same way `mind-elixir` and `mind-elixir/i18n` overlap — harmless (nothing
 * compares them by identity), but pick one path per app.
 *
 * The outline syncs on BOTH of the map's channels: the shared journal
 * (structural edits, undo/redo — collapse/expand lands there too) and the map's
 * `expandNode` event, which still covers silent internal expands that record no
 * entry of their own. Both merge into one render per tick.
 */
export { Outliner } from './Outliner'
export { defaultI18n } from './types'
export type { ItemOperation, OutlinerI18n, OutlinerOptions } from './types'
