# Changelog

## Unreleased

### Breaking Changes

- `expandNode` and `expandNodeAll` now emit a tracked operation. `expanded` lives in the node data, so folding is undoable like any other edit: an expander click, `Ctrl/Cmd` + click (recursive) and the `Ctrl+K` whole-map folds each record one entry. Hosts that call these methods as pure view operations should pass `{ silent: true }`.

### Features

- `mei.diffRefresh(data)` installs a document like `refresh(data)` but applies only the difference. Every side effect of `refresh` is mirrored — the selection reset, leaving focus mode, the `refresh` event, the deep clone of the input, the redraw — while unchanged nodes keep their element, listeners, focus and hover state. It returns `false` after handing the document to `refresh` when the change cannot be expressed locally: a different root node, a `direction` change on a main node, a main node whose side `layout()` would have to invent, or focus mode. Undo/redo is the main caller; progressive output is the other — a parser that lags thirty chunks behind still only needs one diff against its newest tree, because intermediate targets are never replayed.
- Collapse / expand lands on the shared undo timeline. `Ctrl+Z` restores the previous fold state, and folds made from the outliner and from the map share one timeline.
- `expandNode(el, isExpand?, options?)` and `expandNodeAll(el, isExpand?, options?)` accept `{ silent: true }` to skip the history entry. Used internally when a collapsed parent is auto-expanded before a child is added or a node is moved in, so ONE undo restores the whole gesture.

### Bug Fixes

- `expandNodeAll` now fires the `expandNode` event, so a bound outliner stays in sync after a recursive expand.
- Folding a childless node — or re-applying a state a node already has — no longer touches the DOM or the history stack.
- A bound outliner no longer drops a sync when several map operations land in the same synchronous block. Notifications arriving from the shared stack are applied immediately, while the ones from the map's `expandNode` event are coalesced to the end of the tick — so neither channel can be swallowed. Before this, a second programmatic `addChild` in one block left the outline permanently stale; a single fold still costs exactly one render.
- The `…` item menu no longer flickers on open. Its button group is revealed by the item's open state instead of `:hover`, which the previous re-render destroyed on every toggle.
- `Ctrl+Z` with the focus inside the map no longer steps the timeline twice when an outliner is bound. The outliner handled the shortcut at document level without noticing the map handles the same keys on its own container, so one keystroke undid two entries.
- Undo inside focus mode no longer re-renders the whole diagram. Restoring a snapshot re-anchors the focused subtree, so `Ctrl+Z` stays in focus and `cancelFocus` restores a backup tree that matches what was on screen.
- Loading a new document with `refresh(data)` no longer leaves the previous view behind. Swapping documents while a node was focused kept the focus backup tree alive, so `getData()` kept reporting the old diagram and the first `Ctrl+Z` rolled the new data back entirely.
- The undo baseline is re-anchored on `refresh(data)`. Hosts no longer have to call `clearHistory()` by hand for the first `Ctrl+Z` after a document swap to make sense.
- `init()` no longer throws a `TypeError` when the instance is destroyed while it awaits `document.fonts.ready` — a fast mount/unmount (React StrictMode) used to end in an unhandled rejection.
- `destroy()` releases what it used to keep: the focus backup tree, the undo stack, the pan helper, the arrow helpers and the dragged-node list stayed reachable, holding detached DOM and the whole data tree out of reach of the garbage collector.
- `reshapeNode` no longer hands the `operation` event an `origin` that already equals the new state. The style merge mutated the before-snapshot in place, so listeners doing diffing or rollback saw a no-op.
- Removing a node whose parent pointer and sibling array had drifted apart no longer deletes the last sibling (`splice(-1, 1)`).
- `removeListener` drops every registration of a handler. Forward iteration skipped the entry that slid into the removed slot, so a handler registered twice kept one registration alive.
- `createSummary` with an unusable selection — nothing selected, the root node, or nodes from different main topics — is a no-op instead of throwing. The guard tested `currentNodes` for truthiness while it is `[]` when empty, so the range calculation threw straight out of the context-menu handler and the selection was never cleared afterwards.

### Behavior Changes

- Undoing an operation that changed nothing renders nothing. `refresh` tears the document down and redraws unconditionally, so it emitted a `linkDiv` for a no-op history entry (a drag that lands a node where it already was still records one); the incremental path only redraws when it patched something. The rendered result is identical either way.
- `focusNode` and `cancelFocus` clear the undo/redo stack. Focus mode swaps the rendered document (the map shows one subtree while `getData()` keeps reporting the whole diagram), so entries recorded before the switch are not replayable — the focus boundary is now a history boundary in both directions.
- `refresh(data)` leaves focus mode and fires a new `refresh` event once the data is in place, so listeners can re-baseline their own state.
- Plaintext export escapes `\` and line breaks. A topic holding a newline (Shift+Enter) used to round-trip as two nodes — and when the second line landed at indent 0 it synthesized an extra root, adding a whole level to the tree. Export now writes `\\` and `\n`; import restores both.

### Refactors

- Undo/redo patches the map instead of rebuilding it. `operationHistory.restore` hands the snapshot to `diffRefresh`, which walks the difference against the live tree and applies it through the same incremental primitives the forward operations already use, then redraws once. Undoing a removal no longer re-creates every other node, and the DOM, listeners and measured geometry survive a `Ctrl+Z`. At 5 461 nodes undoing a one-node change went from ~73 ms to ~14 ms (5.3×), and undoing a fold of a 1 365-node branch from ~93 ms to ~37 ms — the fold stays the expensive case because unfurling it does have to build that subtree. The two paths are pinned event-for-event by the suite: a restore emits exactly the bus events it emitted through `refresh`, so existing listeners keep working. `refresh` itself is untouched: it stays the authoritative "replace the whole document" implementation.
- The map's structural diff reconciles the `children` order of each parent and leaves the containers to the DOM layer. Reconciling per rendered container instead cannot converge at all: in SIDE layout one parent's children are split across `.lhs` and `.rhs`, so ordering each of them says nothing about how the two interleave in the shared array. Which side a node draws on is read off its own `direction`, and its slot inside that container is derived from the data order.
- Outliner rendering is a keyed reconciliation instead of a full rebuild. Each rendered node keeps a persistent view, so a node whose data did not change keeps its DOM element, listeners, focus and hover state, and a collapsed subtree releases its DOM rather than parking it. Re-rendering the outline at 5 461 nodes went from 94 ms to ~1 ms, and an idle re-render at 1 365 nodes from 21 ms to 0.3 ms.
- The outliner no longer binds listeners per node (8 → 0); clicks and drag & drop are delegated to the container. Opening the `…` menu touches only the nodes involved instead of re-rendering the document, and no longer re-runs markdown/KaTeX over every topic.
- The outliner is a view of a MindElixir document and nothing else. `new Outliner({ el, mei })` — `mei` is required and carries both halves of the binding: the tree it renders (`mei.nodeData`, read by reference) and the journal it syncs against (`mei.historyStack`). Standalone mode is deleted, because that outline was a second document that merely looked like the first one: the `data`, `history` and `docName` options are gone, `refresh()` and `updateItem()` are gone (the map owns the document — `mei.refresh` / `mei.reshapeNode`), and so are the `OutlineItem`, `OutlineData` and `OutlinerMei` types — the outline speaks `NodeObj` and binds to the instance rather than to a shape that could drift from it. It also stops carrying a parallel tree DSL: nodes are looked up with the map's own `getObjById`, a node's parent and previous sibling come off the map's `parent` back-references, the breadcrumb walks upwards from the node instead of down from the root, and `src/outliner/operations.ts` — `cloneTree`, `locate`, `walk` and six mutating tree operations — is deleted. Undo/redo has one entry point per view instead of one journal per document: both call `mei.undo()` / `mei.redo()`, and the outliner subscribes to the map's stack only to re-read the tree.
- Link rendering reads layout once and writes once. `linkDiv` used to interleave `offsetWidth` / `offsetHeight` reads with DOM writes for every node, forcing one synchronous layout per node — exactly as many reflows as the map had nodes. All geometry is now measured before anything is written, and the sub-lines sharing a stroke are merged into a single `<path>` (a handful of elements instead of one per line). At 5 461 nodes `linkDiv` went from 124 ms to 9.6 ms, editing a topic from 116 ms to 10.5 ms, and `refresh` from 210 ms to 102 ms; forced reflows dropped from 5 461 to 1.
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
