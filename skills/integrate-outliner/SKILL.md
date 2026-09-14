---
name: Integrate the Outliner
description: Guide for putting the outline view beside a Mind Elixir map — one document, two views sharing a single undo/redo timeline. Covers setup order, options, gestures, theming and the traps.
---

# Integrate the Outliner

The outliner is a **second view of ONE Mind Elixir document**, not a second document. It renders
`mei.nodeData` **by reference**, routes every edit back through the map's own node operations, and
re-reads the tree whenever the map's undo/redo journal moves. The repo ships a live demo of exactly
this wiring: `outliner-demo.html` + `src/dev.outliner.ts` (`pnpm dev`, then open
`/outliner-demo.html`).

## 1. What it is not

- It has **no `data` option and no history option of its own**. `mei` is the only required option,
  and it supplies both halves of the binding: the tree (`mei.nodeData`) and the journal
  (`mei.historyStack`).
- There is no standalone mode. The outline keeps no copy of the tree, so it cannot drift from the
  map — that is the point of the binding. If you need an outline of data no map owns, render your
  own list.
- Nothing is cloned. A change on either side is visible on the other side immediately, including
  programmatic changes (`mei.addChild(...)`, `mei.refresh(data)`, undo/redo).

## 2. Install

```bash
npm i mind-elixir
```

Two entry points ship, and both stay supported:

| Import from | You get | Stylesheet to load |
| --- | --- | --- |
| `mind-elixir/outliner` | the outline alone — the map is not bundled | `mind-elixir/outliner/style.css` |
| `mind-elixir` | the map, which re-exports `Outliner` | `mind-elixir/style.css` (already contains the outline rules) |

Pick **one** import path per app. Importing from both paths loads two copies of the class; nothing
compares them by identity so it still works, it is simply duplicated bytes.

## 3. Minimal setup

```html
<div id="map"></div>
<div id="outline"></div>
```

Both containers need a height; the outline scrolls itself, so give it an overflow.

```css
#map,
#outline {
  height: 100%;
  overflow: auto;
}
```

```js
import MindElixir from 'mind-elixir'
import { Outliner } from 'mind-elixir/outliner'
import 'mind-elixir/outliner/style.css'

const mei = new MindElixir({ el: '#map', allowUndo: true })

// historyStack is created while init() runs — await it BEFORE binding
await mei.init(data)

const outline = new Outliner({ el: '#outline', mei, fileName: 'My outline' })
```

**The order is load-bearing.** The constructor throws when `mei.historyStack` is missing:

```
Outliner: mei.historyStack is missing — create the MindElixir instance with `allowUndo: true` and await `init`
```

So `allowUndo: true` (the default) and an awaited `init` are the two prerequisites. The throw is
deliberate — an outline running on a private stack looks perfect right up to the first `Ctrl+Z`.

## 4. Options

| Option | Type | Notes |
| --- | --- | --- |
| `el` | `HTMLElement \| string` | **Required.** Its content is replaced by the outline (`innerHTML = ''` first). |
| `mei` | `MindElixir` | **Required.** The instance that owns the document. |
| `fileName` | `string` | Label of the breadcrumb's root button. |
| `readonly` | `boolean` | Default `false`. See §8 for what it disables. |
| `markdown` | `(md, obj) => string` | Render a topic as HTML while it is not being edited. Pass the map's own renderer — see §6. |
| `i18n` | `Partial<OutlinerI18n>` | Partial override of the built-in labels: `menuTitle`, `outdent`, `indent`, `delete`, `untitled`, `zoomInAndDrag`. |
| `onChange` | `(data: NodeObj) => void` | Called with a **detached snapshot** after a change is synced into the outline. This is the "save it" hook — read §5 for the one case it does not cover. |

```js
const outline = new Outliner({
  el: '#outline',
  mei,
  fileName: 'Roadmap',
  i18n: { menuTitle: 'Actions', untitled: '(untitled)' },
  onChange: snapshot => save(snapshot),
})
```

## 5. Reading data back

```js
outline.getData()        // NodeObj — detached snapshot of what the OUTLINE shows
mei.getData()            // MindElixirData — the whole document
```

These are **different shapes**, which is easy to trip over:

- `outline.getData()` returns a bare `NodeObj` tree (the root, with `children`), serialized with the
  map's own `stringifyData`, so `parent` back-references are stripped. When the outline is not
  zoomed it is byte-for-byte `mei.getData().nodeData`.
- `mei.getData()` returns the document wrapper: `{ nodeData, arrows, summaries, direction, theme,
  compact }`.
- `onChange` receives the same bare tree `outline.getData()` returns.

### `onChange` fires on a sync, not on every keystroke

`onChange` rides on the outline's re-render, so its timing follows the sync — with one gap worth
knowing before you build a save hook on it:

| Change | Reaches the map + journal | Fires `onChange` |
| --- | --- | --- |
| Any structural gesture in the outline (add / indent / move / delete / collapse) | yes | yes |
| Undo / redo | yes | yes |
| A change made on the map side, including a programmatic one | yes | yes |
| **Editing a topic's text inside the outline** | yes (one `reshapeNode` journal entry — `Ctrl+Z` still restores it) | **no** |

A topic edit is committed on blur, but that path deliberately suppresses the re-render (a full render
would swallow the click that caused the blur), and `emitChange` only runs as part of a render. If your
save hook must see renames too, subscribe to the journal as well — it is the complete signal:

```js
mei.historyStack.subscribe(() => save(outline.getData()))
```

Other public methods:

```js
outline.addChild(id)     // insert an empty child under `id` in the MAP, then focus it in the outline
outline.focusItem(id)    // focus (and scroll to) a row without editing it
outline.destroy()        // unsubscribe and empty the container — call it on unmount
```

## 6. Share one markdown renderer

Pass the **same function** to both views and they render identically. `src/dev.markdown.ts` is the
demo's shared renderer: a KaTeX pre-pass (marked would otherwise eat the LaTeX), then `marked`.

```js
const renderMarkdown = text => marked(text)

const mei = new MindElixir({ el: '#map', markdown: renderMarkdown })
await mei.init(data)
const outline = new Outliner({ el: '#outline', mei, markdown: renderMarkdown })
```

Focusing a row swaps the rendered HTML back to the **raw markdown source** so it stays editable;
leaving the row re-renders it. Without a `markdown` function the topic is plain text.

## 7. One undo/redo timeline

The outline pushes **nothing** onto the journal. It subscribes to it and re-adopts the live tree, so:

- `mei.undo()` / `mei.redo()` undo an edit made in either view.
- `Ctrl+Z`, `Ctrl+Y` and `Ctrl+Shift+Z` (`Cmd` on macOS) work from either view. The outline listens on
  `document` and returns early when the focus is inside the map's container, so one keystroke is never
  two undos.
- Collapse / expand is an edit like any other and lands on the same timeline.

To show history state (as the demo's inspector does), read the shared stack:

```js
const stack = mei.historyStack          // same object the outline syncs against
stack.canUndo, stack.canRedo, stack.currentIndex
stack.getEntries()                      // [{ time, doc, meta }, ...]
stack.subscribe(render)                 // returns an unsubscribe function
stack.undo(); stack.redo(); stack.clear()
```

## 8. Gestures and what `readonly` turns off

| Gesture | Result |
| --- | --- |
| Click a row's text | Focus it and edit the raw source (caret at the end); commit on blur |
| `Enter` | Empty row → outdent it; caret in the middle → split into a new sibling; otherwise add a sibling after |
| `Shift+Enter` | Add a sibling before |
| `Tab` / `Shift+Tab` | Indent / outdent |
| `Alt+↑` / `Alt+↓` | Move the row up / down among its siblings |
| `↑` / `↓` | Move the focus between rows (no structural change) |
| `Backspace` on an empty, non-root row | Delete it |
| Click the dot | Zoom the outline into that subtree; the breadcrumb walks back out |
| **Drag the dot** | Move the node: drop on the top quarter of a row → before, bottom quarter → after, middle → inside |
| Collapse button | Expand / collapse the node — the same `expanded` flag the map uses |
| `…` button | Menu: outdent / indent / delete |

`readonly: true` turns off editing, drag & drop, the zoom dot and the `…` menu — the whole row gets
`pointer-events: none`. The breadcrumb still works, so a zoomed outline stays navigable.

## 9. Theming

Everything is driven by CSS custom properties, so a host overrides them on the outline (or `:root`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `--rol-primary-color` | `#3b35ab` | Accent (dots, focus, breadcrumb) |
| `--rol-header-color` | `#433f96` | Headings |
| `--rol-text-color` | `#1f2937` | Body text |
| `--rol-text-disabled` | `#9ca3af` | Disabled text |
| `--rol-border-light` | `#f3f4f6` | Hairlines |
| `--rol-danger-color` | `#ef4444` | Destructive menu entry |
| `--rol-drag-indicator` | `#e1dcff` | Drop indicators (plus `-10` / `-30` mixes) |
| `--rol-bg-color` | `transparent` | Container background |

For dark mode put a `dark` class on an ancestor — the stylesheet defines the same variables under
`.dark`.

```css
#outline {
  --rol-primary-color: #2f6feb;
  --rol-text-color: #1f2328;
}
```

## 10. Focus mode travels with it

Focusing a node on the map (`mei.focusNode(el)`) swaps the map's rendered document to that subtree,
and the outline follows automatically — it renders whatever `mei.nodeData` currently is. That is also
a history boundary: `focusNode` / `cancelFocus` clear the journal, and the outline renders the
focused subtree until you cancel. Nothing to wire up.

## 11. Gotchas

- **A node the map does not render has no element**, so outline gestures on it are no-ops: inside a
  collapsed branch the map has no `Topic` element to operate on, and every mind-elixir node operation
  takes an element rather than a `NodeObj`. Unfold in the map and the row works again.
- **The root node is a row too.** A 3-level document with 4 nodes renders 5 rows.
- **The constructor clears `el`** — do not put an outline in a container you also render into.
- **`destroy()` in framework teardown.** It unsubscribes the `document`-level keydown listener and
  the map's `expandNode` listener, so a removed component leaves nothing behind.
- One outline per `mei` is the intended shape; extra outlines are allowed but each owns its own DOM.

### React

```jsx
useEffect(() => {
  let mei
  let outline
  let cancelled = false
  ;(async () => {
    mei = new MindElixir({ el: mapRef.current, allowUndo: true })
    await mei.init(data)
    if (cancelled) return // StrictMode: the effect already cleaned up
    outline = new Outliner({ el: outlineRef.current, mei })
  })()
  return () => {
    cancelled = true
    outline?.destroy()
    mei?.destroy() // safe even while init() is still awaiting
  }
}, [])
```

Bind **after** `await init` — that is the gate from §3. In StrictMode the effect runs twice, so the
async body must be cancellation-safe: destroy the map in the cleanup too, and let `await init`
finish on a destroyed instance (mind-elixir tolerates that).
