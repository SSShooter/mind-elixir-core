---
name: Migrate to Mind Elixir v6
description: v6 breaking changes only. Consumer-facing breaking changes in v6 (next/v6 vs v5.15.0) are (1) mind-map inner DOM nodes are now plain `<div>`s with class names instead of custom elements (`me-main`, `me-wrapper`, `me-parent`, `me-children`, `me-tpc`, `me-epd`), (2) public instance method `copyNode` removed → use `copyNodes([node], to)`, (3) batch move methods `moveNodeIn/Before/After` renamed to `moveNodesIn/Before/After` with pluralized `operation` event names. Plus a minor `lite` build IIFE filename change.
---

# Migrate to Mind Elixir v6 — Breaking Changes

Breaking changes introduced in `next/v6` vs `v5.15.0`. Only v6-new changes are listed (v5-line changes like `refresh()`/`draggable`→`editable`/i18n relocation are out of scope).

## 1. Custom DOM elements → plain `<div>`s (class-driven)

The six **inner** node elements are now `<div>`s with the same class names. `me-nodes` and `me-root` stay custom elements.

| Old | New |
| --- | --- |
| `<me-main> <me-wrapper> <me-parent> <me-children> <me-tpc> <me-epd>` | `<div class="me-main">` … etc. |

**Fix in consumer code:**
- CSS: `me-tpc {…}` → `.me-tpc {…}`; descendant selectors use `.me-` classes, not tag names.
- JS: `querySelector('me-tpc')` → `.me-tpc`; `getElementsByTagName('me-…')` → `querySelectorAll('.me-…')`; `el.tagName === 'ME-TPC'` → `el.classList.contains('me-tpc')`.
- `me-tpc:defined` / `:not(:defined)` selectors no longer apply.
- Direction is a class on `.me-main` (`lhs`/`rhs`/`down`) — use `directionOf(el)` or `classList.contains('lhs')`, not `className === 'lhs'`.

## 2. Removed method `copyNode`

`mind.copyNode(node, to)` removed. Use `mind.copyNodes([node], to)` (wrap in array).
- `operation` listeners: `name === 'copyNode'` never fires → use `'copyNodes'`; payload is `objs: NodeObj[]` (not `obj`).
- The `declare copyNode` TS member is gone.

## 3. Renamed batch move methods to plural

The three methods whose first arg is `Topic[]` were renamed (method name == `operation` event name):

| v5 | v6 |
| --- | --- |
| `moveNodeIn(from, to)` | `moveNodesIn(from, to)` |
| `moveNodeBefore(from, to)` | `moveNodesBefore(from, to)` |
| `moveNodeAfter(from, to)` | `moveNodesAfter(from, to)` |

**Fix:** rename calls AND `operation` listeners branch on the plural names (`'moveNodeIn'`→`'moveNodesIn'`, etc.). Payload stays `objs: NodeObj[], toObj`. Single-node `moveUpNode`/`moveDownNode` are **unchanged** (they internally fire the plural events). The `declare moveNode*` TS members are gone.

## 4. Minor: `lite` build drops IIFE output

`mind-elixir/lite` no longer emits `MindElixirLite.iife.js` → now `MindElixirLite.js`. Importing via the `mind-elixir/lite` specifier is unaffected; only update if you referenced the IIFE file by path.

## Verification checklist

1. CSS `me-…` tag selectors → `.me-…` class selectors; map still styled.
2. JS `querySelector('me-…')` / `getElementsByTagName` / `tagName === 'ME-…'` → class-based queries + `classList.contains`.
3. Direct `MindElixirLite.iife.js` refs → `MindElixirLite.js` (only if by path).
4. `me-nodes` / `me-root` unchanged.
5. `copyNode` → `copyNodes([node], to)`; listeners use `'copyNodes'` + `objs`.
6. `moveNodeIn/Before/After` → `moveNodesIn/Before/After`; listeners use plural event names. `moveUpNode`/`moveDownNode` unchanged.
