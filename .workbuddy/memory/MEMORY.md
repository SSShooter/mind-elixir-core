# Mind Elixir Core — project memory

Deliberately short — injected every session. Deep detail lives in the `20xx-xx-xx.md` daily logs,
`.workbuddy/bug-and-perf-scan.md` and the `mind-elixir-*` skills.

## Environment
- `pnpm` needs the nvm PATH: `PATH=/Users/darksouls/.nvm/versions/node/v24.20.0/bin:$PATH pnpm …`
- Green = **four** checks: `playwright test` (189 tests, ~17 s) + `tsc --noEmit -p tsconfig.json` +
  `tsc -p tsconfig.type-test.json` (public API; first tsc skips it) + `pnpm build`. Public members
  in `src/index.ts` need a line in `tests/generic-instance.type-test.ts`. Playwright config boots
  its own dev server on 23334 — a hand-started one poisons the run (`pgrep -fl vite` first).
- BSD `grep`: use `grep -E` (`\|` matches nothing). `biome format` skips `tests/`; `--write` on a
  directory reflows `outliner.css` → target `.ts` files. `test-results/` past ~50 files blocks the
  suite → `mv` it away, never delete.
- Flaky-in-full-run candidates (pass solo): `expand-collapse.spec.ts:213`. Re-run before calling
  it a regression. A test-side sleep racing a page timer is NOT flakiness — make the ordering
  deterministic instead (dispatch in a page-side `setTimeout` queued after the one under test).

## Packaging
- `build.js` → one Vite lib build per entry, `emptyOutDir` only on `i === 0`. CSS extracted per
  entry; types from `tsc` into `dist/types`. Outliner ships twice (`mind-elixir` re-export +
  `mind-elixir/outliner` entry) — accepted duplication; standalone stays clean because `Outliner.ts`
  only reaches `utils/index` (`grep -c "map-canvas\|map-container" dist/Outliner.js` = 0).
- Verify packaging changes against `dist/`: static server + Chromium, import both bundles, assert
  computed styles (with negative control), row count (ROOT is a row), `mei.undo()` moves outline.
  Script: `/tmp/verify-outliner-build.mjs` (log 09-14).

## Invariants
- **Focus**: `mei.nodeData` IS the focus root; `getData()` reports `nodeDataBackup`. `clearHistory()`
  must run AFTER `cancelFocus`'s `refresh()`.
- **`linkDiv`**: three phases, order load-bearing (fresh `.subLines` → read all geometry → write via
  fragment; deferring phase 0 → 58 failures). No id→node index anywhere. 5,461 nodes: 9.6 ms.
- **Outliner**: **bound-only** (`mei` is the only required option). Reads the live tree via the
  map's `getObjById` + `parent` back-refs — never a second tree walk. Breadcrumb walks UP and stops
  at `this.root.id`. Ctrl+Z on `document` returns early inside `mei.container`. Keyed
  reconciliation, delegated listeners, no creation-time closures. Two sync channels (journal push =
  sync, `expandNode` = deferred). `.outline-item-front` 1 rem spacer is load-bearing.
  `outliner.getData()` = bare `NodeObj`; `readonly` kills row pointer events, not breadcrumb.
  Guide: `skills/integrate-outliner/SKILL.md`.
- **Outliner row controls** (fixed 09-14, two rounds; mechanism rewritten 09-15): the row's control
  cluster is never driven by `:hover` alone — **three** signals: `:hover`, `:focus-within` (the
  touch-safe one), `.menu-open`. Touch has no persistent hover, and the tap that focuses a topic
  replaces its markup (`handleFocusIn`), which drops the hover the same tap set → first tap flashed,
  second tap worked. Reveal *and* paint must answer to the same signals: a control that is visible
  but unpainted reads as a stray glyph, not as a button. No row-level background exists in the
  library at all (wrapper/topic transparent in idle, hover AND focus) — a "whole row has no
  highlight" report is host CSS, not ours. No Tailwind preflight here → **every** icon button must
  declare its own `cursor`; `…` did, the chevron didn't (fixed 09-15) — check new controls for the
  same gap.
  **The state lives on the row as `--row-control-opacity`** (0 at rest, 1 on the three signals);
  every control consumes it via `opacity: var(--row-control-opacity)`. A *folded* chevron is the one
  exception and says so in its own `[data-state='collapsed']` rule (`opacity: 1` + the painted
  surface + `pointer-events: auto`), which is what keeps it up at rest and keeps `…` down — the
  `…` used to ride on the same arm and showed as a bare, unpainted glyph beside an already blue
  chevron (fixed 09-15). Anything else added to the cluster needs the same decision: follow the
  state, or opt out explicitly. This replaced a group-level `opacity` + `:has()` + `:not()` chain
  (no `:has()` left in `outliner.css`; the group holds geometry only). Proven equivalent in
  chromium + webkit, 9 states × 88 rows, by `mind-elixir-parity-harness/scripts/probe-row-control-parity.mjs`.
- **Outliner IME guard** (fixed 09-14, simplified same day): `handleTopicKeydown` early-returns on
  `e.isComposing || e.keyCode === 229`, plus — only for `Enter`/`Escape` — when
  `compositionJustEnded` (true until the end of the compositionend task, cleared by a 0 ms timer;
  Safari fires compositionend BEFORE the confirming Enter, which then reports `isComposing: false`).
  A `compositionstart` listener / `composing` flag is NOT needed: both engines report
  `isComposing: true` for keydowns fired DURING composition. Don't "simplify" it back to
  `isComposing` only, and keep the Enter/Esc restriction so a late timer can't eat keystrokes.
  Negative-control trap: when reverting the guard, disable BOTH lines — the second
  (`compositionJustEnded`) one silently keeps the test green.
- **diffRefresh** (undo/redo patch path): ops carry a global DATA anchor; emission order
  `insert → move → remove → update` is load-bearing; `clonePatch` preserves `undefined`; no extra
  bus events. Falls back to `refresh` on missing nodeData / focus mode / any resync — pin that set.
  Probe: `mind-elixir-perf-probe/scripts/probe-undo-redo.mjs`.

## Library quirks (found, NOT fixed — out of scope)
- `setNodeTopic` fires no `operation` (no history entry, next undo rolls it back) → use
  `reshapeNode`. `moveNodeObj` gives a stale `direction` into main nodes.
- Outliner `onChange` misses in-outline renames (`setNodeTopicBound` suppresses the sync it rides
  on). Complete signal: `mei.historyStack.subscribe`. JSDoc overstates — reported, not reworded.
- Mid-edit DOM teardown blur: decided 不修. Judge reachability first; give probes a positive control.
- `expandNode(el, false)` on the **root** throws `Cannot set properties of undefined (setting
  'expanded')`: `interact.ts` grabs `parent.children[1]` as the expander, and the root's parent has
  no `.me-epd`. Reachable only from the API / the outliner's root-row chevron (the map renders no
  root expander). Verified 09-15 with `mind.findEle(rootId)`; nested nodes are fine.

## Testing traps
- Row-control visibility is asserted as **effective** opacity (`tests/outliner.spec.ts`'s
  `expectVisibleOpacity`, product down the ancestor chain + `expect.poll` for the 200 ms fade), never
  as the cluster's own `opacity` — where the fade physically sits is a mechanism detail. Don't
  re-pin it; a group-level assertion silently rots the moment the mechanism moves.
- New regression tests must **fail** without the fix (negative control), incl. refactors.
- `undo()` keeps entries for redo → assert depth via `currentIndex`. Scope locators `#map`/`#outline`.
- `hasText` is case-insensitive substring ("Child 1" matches "Grandchild 1"); it stops matching when
  the test empties the topic → address rows by `[data-item-id]`.
- Synthetic `KeyboardEvent` always reports `isComposing: false` — convenient for replaying Safari's
  IME ordering. Pure engine questions: `about:blank` + `page.evaluate`.
- Playwright `touchscreen.tap` (Chromium AND WebKit) also synthesizes mouse events → hover is set
  and kept, so touch-only bugs about hover do NOT reproduce in emulation. Test the contract instead:
  click to focus, `page.mouse.move(0,0)` to park the pointer, then assert the computed style.
  `:hover`-driven visibility anywhere is a touch bug candidate. WebKit came from
  `pnpm exec playwright install webkit` (only chromium shipped by default).

## Conventions
- Keep `CHANGELOG.md`'s `## Unreleased` current. Changing `refresh`: `restore()` calls it too —
  baseline updates go through the `refresh` event with a `restoring` flag.
- 行控件的可见性**留在 CSS 里**（`:hover`/`:focus-within`/`menu-open`/折叠状态即浏览器自己的状态）。
  「改用 JS 控制会不会更快」已实测为否（inline style 一样触发失效重算，还多出事件派发 +
  行元素按 key 复用导致的重推导入侵）：1365 行下 hover 单次 recalc 0.2 ms、script 0.5 vs 4.1 ms,
  见 `mind-elixir-perf-probe/scripts/probe-css-vs-js-control.mjs` 与 09-15 日志。要简化就读 perChild 版。
- Touching mixed-in methods or `Options` → `node gen-members.js` then format `src/index.ts`.
