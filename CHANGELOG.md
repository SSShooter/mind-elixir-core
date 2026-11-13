# Changelog

## 6.0.1 - 2026-11-13

### Features

- Markdown and KaTeX now render in arrow and summary labels, including when an arrow label is edited.

### Bug Fixes

- Moving a node into itself or one of its own children is now rejected instead of corrupting the map.
- Initializing a map twice in quick succession no longer duplicates its behaviour.
- Unfinished typing in the outliner is no longer lost when the map updates elsewhere or when you undo.
- Choosing "link" repeatedly no longer creates duplicate arrows, and clicking away cancels an unfinished link.
- Removing an arrow or summary no longer leaves it selected, so delete and rename target the right element.
- Box selection stays aligned when the map auto-scrolls to its edge.

### Behavior Changes

- Some operation methods now return `undefined` when a call is cancelled, with no change to runtime behaviour.

## 6.0.0 - 2026-11-02

### Breaking Changes

See [skills/migrate-to-v6/SKILL.md](skills/migrate-to-v6/SKILL.md) for the full migration guide.

### Features

- Pass `rtl: true` to `Options` to switch node topics, the editor, labels and context menu to right-to-left text direction (Arabic, Hebrew, Persian, Urdu); branch layout axis is unaffected.
- Add `ar` (Arabic) locale to the `i18n` export.
- Pass a `markdown` renderer to `Options` (and `new Outliner(…)`) to render topics as Markdown / KaTeX in both the map and the outliner.
- Arrow-key navigation crosses into neighbouring branches at boundaries: `ArrowDown` from the last child and `ArrowUp` from the first child of a branch step into the nearest sibling branch, landing at its first/last child or the branch node itself when collapsed.
- `mei.diffRefresh(data)` applies only the difference between the current document and `data`, keeping unchanged nodes' elements, listeners and focus state; falls back to `refresh` when the change cannot be expressed incrementally.
- Collapse / expand is now undoable: `Ctrl+Z` restores the previous fold state, and folds from the outliner and the map share one undo timeline.
- `expandNode` and `expandNodeAll` accept `{ silent: true }` to skip the history entry, so an auto-expand before adding a child costs no extra undo step.
- The outliner ships as its own entry point: `import { Outliner } from 'mind-elixir/outliner'` and `import 'mind-elixir/outliner/style.css'`; the main entry still re-exports it unchanged.

### Bug Fixes

- Input box now preserves line breaks (`white-space: pre-wrap`) so Shift+Enter newlines survive editing in WebKit.
- `init()` no longer throws a `TypeError` when the instance is destroyed during `document.fonts.ready` (React StrictMode fast mount/unmount).
- `destroy()` now properly releases internal references (focus backup tree, undo stack, pan/arrow helpers, dragged-node list) to prevent memory leaks.
- Ensure focus backup tree and undo baseline are properly reset/re-anchored when using `refresh(data)` or undoing inside focus mode.
- Folding a childless node or re-applying the existing fold state no longer touches the DOM or the history stack.
- `reshapeNode` no longer passes an `origin` that already equals the new state to the `operation` event.
- Removing a node whose parent pointer and sibling array had drifted apart no longer deletes the last sibling (`splice(-1, 1)`).
- `removeListener` now drops every registration of a handler, not just the first.
- `createSummary` with an unusable selection (nothing selected, the root, or nodes from different main topics) is now a no-op instead of throwing.

### Behavior Changes

- Undoing a no-op operation renders nothing; the incremental path only redraws when it patched something.
- `focusNode` and `cancelFocus` clear the undo/redo stack, making the focus boundary a history boundary in both directions.
- `refresh(data)` now leaves focus mode and fires a `refresh` event once the data is in place.
- Plaintext export now escapes `\` and line breaks (`\\` / `\n`) so topics with Shift+Enter newlines round-trip correctly.

### Refactors

- Undo/redo patches the map with `diffRefresh` instead of rebuilding it; at 5 461 nodes undoing a one-node change drops from ~73 ms to ~14 ms.
- The structural diff reconciles `children` order per parent rather than per rendered container, fixing SIDE-layout convergence.
- Outliner rendering is a keyed reconciliation: unchanged nodes keep their DOM element, listeners and focus state; re-rendering at 5 461 nodes drops from 94 ms to ~1 ms.
- Outliner event listeners are delegated to the container (8 per-node listeners → 0), and opening the `…` menu no longer re-runs markdown/KaTeX over every topic.
- The outliner is now a pure view of a `MindElixir` instance: standalone mode, `refresh()`, `updateItem()`, `OutlineItem`/`OutlineData`/`OutlinerMei` types, and the internal tree DSL (`cloneTree`, `locate`, `walk`, six mutating operations) are all removed.
- Link rendering batches all geometry reads before any DOM writes, cutting forced reflows from one per node to one total; `linkDiv` at 5 461 nodes drops from 124 ms to 9.6 ms.
- Moving several nodes no longer re-walks the whole tree once per node.

## 5.15.0 - 2026-08-03

### Breaking Changes

- `refresh(data)` no longer applies `data.theme`. Theme handling is fully decoupled from `refresh`; call `changeTheme(theme)` explicitly when you need to switch themes (e.g. `mind.changeTheme(data.theme)` before/after `mind.refresh(data)`).
- `moveUpNode` and `moveDownNode` no longer emit `moveUpNode` and `moveDownNode` operation events. They now reuse the existing `moveNode` flow and fire `moveNodeBefore`, `moveNodeAfter`, or `moveNodeIn` instead. Update any listeners accordingly.

### Features

- Add down layout support via `direction: 3`
- Add `genMembers` build script for generating class member declarations from TypeScript compiler output

### Bug Fixes

- Prevent undo/redo when the map is not editable
- Fix ctrl+k chord accidentally triggering refresh
- Return move success status to control wheel event propagation
- Clamp node movement within container center boundaries
- Preserve line breaks when removing div on blur
- Ensure correct sorting of range indices in summaries
- Avoid mutating summaries during render
- Set direction for new parent node in `insertParent`
- Remove residual DOM after `moveNodeIn`
- Handle root topic positioning without `me-main` ancestor in arrow rendering
- Correct alignment centering for downward layout
- Align padding and adjust subline drawing for first-level nodes
- Fix DOWN direction `addChild` on root
- Suppress context menu after right button panning
- Prevent errors when node has no children in keypress handler
- Make arrow control point drag work with operation history
- Fire events before selecting nodes to support undo operations
- Include `reshapeArrow` in arrow operation types for undo/redo
- Sync selection state on `unselectNodes` to avoid stale history

### Refactors

- Refactor MindElixir to use class-based implementation
- Replace codegen with direct TypeScript compiler API usage for generating type declarations
- Optimize `unionTopics` filtering logic
- Unify `moveUpNode` and `moveDownNode` logic with `getMoveTarget` helper
- Improve calculation of anchor point on node border
- Remove stroke-linecap style support from arrow component

### Chores

- Replace ESLint and Prettier with Biome for linting and formatting
- Replace less with lightningcss and update config
- Bump TypeScript to 7.x

## 5.14.0 - 2026-07-12

### Features

- Implement `reshapeArrow` utility to support programmatically updating connection arrow properties (e.g., style, label, and deltas) and emit `reshapeArrow` operation event.

### Bug Fixes

- **mobile**: Fallback to map panning when node dragging is aborted in `DragWait` state.

## 5.13.0 - 2026-06-24

### Features

- Extend theme definitions with required cssVar property

### Bug Fixes

- Constrain text width on p elements instead of topic container to allow LaTeX to render at full width
- Prevent keyboard event processing during IME composition in DOM and SVG handlers

## 5.12.2 - 2026-05-25

### Features

- Add custom branch rendering and metadata support

## 5.12.1 - 2026-05-23

### Features

- Support serializing and restoring compact mode state in MindElixirData

## 5.12.0 - 2026-05-23

### Features

- Add compact mode support for configurable node spacing

## 5.11.3 - 2026-05-22

### Bug Fixes

- Ignore non-left mouse button events in double-click detection
- Prevent context menu trigger during active node editing or interaction states

## 5.11.2 - 2026-05-21

### Features

- Add forceCenter parameter to scrollIntoView
- Add enableMobileMultiSelect
- Add summary & arrow events

### Bug Fixes

- Fix readonly mode misbehavior
- Fix text truncation when parsing MathJax in plaintext

### Refactors

- Introduce state machine to manage pointer interactions
- Simplify interaction state machine by merging selection logic
- Implement CanvasPointerDown state to coordinate canvas interaction and selection logic
- Migrate mouse and touch events to PointerEvents across viselect core
- Unify and optimize node drag ghost positioning
- Unify blur & pointer cancel handler
- Encapsulate touch pinch and pan logic into dedicated helper
- Rename linkSvgGroup to arrowSvg and optimize SVG interaction logic
- Standardize SVG types and rename arrow group IDs for consistency
- Aggregate long-press logic into longPressHelper object

## 5.11.0 - 2026-04-22

### Features

- Improve Magic Trackpad UX

### Bug Fixes

- Prevent double-clicking multiple elements

### Refactors

- Round arrow delta values to integers
- Use pointer events to handle click & double-click
- Unify node selection logic to `mouse.ts`
- Rename `dragmove` to `pan`

### Tests

- Improve test compatibility for macOS and extend timeouts

## 5.10.0 - 2026-03-29

### Breaking Changes

- **i18n**: The `locale` option has moved from the top-level `Options` to `contextMenu.locale`.
  - The top-level `Options.locale` now only accepts a language code (`string`) and is **deprecated**.
  - To provide custom translations or set the language, use `contextMenu: { locale: LangPack }`.
  - Predefined language packs (like `en`, `zh_CN`) are now available via the new `i18n` export.

### Features

- Support preserving arrow delta coordinates (x,y) in plaintext converter

## 5.9.3 - 2026-03-09

### Features

- Support `Esc` key to exit node editing

### Bug Fixes

- Support dynamically toggling drag and selection features

## 5.9.2 - 2026-03-03

### Bug Fixes

- Fix line break conversion for editable content in Safari

## 5.9.1 - 2026-02-24

### Features

- Improve pinch gesture ux

### Refactors

- Remove top-level scope document to avoid immediate errors in SSR applications

## 5.9.0 - 2026-02-21

### Features

- Add mindElixirToPlaintext

### Bug Fixes

- Fix arrow highlight show repeatedly

### Refactors

- Optimize plaintext converter algorithm

## 5.8.3 - 2026-02-18

### Refactors

- Refactor plaintext converter

## 5.8.2 - 2026-02-16

### Features

- Both buttons can be used to drag in readonly mode
- Support more styles in plaintext converter

## 5.8.0 - 2026-02-07

### Features

- Build & export plaintext converter

## 5.7.1 - 2026-02-02

### Bug Fixes

- Correct input copy behavior

## 5.7.0 - 2026-02-01

### Features

- Refactor clipboard handling using native events
- Import pasteHandler for improved clipboard operations
- Remove draggable option
- Add plaintext converter for importing/exporting mind maps
- Allow creating arrows without offset

### Refactors

- Refactor node operations and improve structure
- Refactor keypress handling and clipboard functions
- Refactor utility functions in index.ts

### Chores

- Update readme
- Upgrade playwright to latest version

## 5.6.1 - 2026-01-18

### Bug Fixes

- Unify map padding across themes (`50px` → `50px 80px`)
- Export constants (LEFT, RIGHT, SIDE, THEME, DARK_THEME) to bypass SSR errors

## 5.6.0 - 2026-01-17

### Features

- Update `.svg-label` style
- Calculate arrow delta instead of constant value
- Enhance fullscreen handling

### Bug Fixes

- Prevent arrow reversal
- Improve scale validation logic

## 5.5.0 - 2026-01-05
