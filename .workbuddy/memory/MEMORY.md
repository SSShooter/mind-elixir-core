# Mind Elixir Core — project memory

Deliberately short — injected every session. Detail lives in the `20xx-xx-xx.md` daily logs,
`.workbuddy/bug-and-perf-scan.md` and the `mind-elixir-*` skills. Cite a skill/script instead of
restating it here.

## Environment
- `pnpm` needs the nvm PATH: `PATH=/Users/darksouls/.nvm/versions/node/v24.20.0/bin:$PATH pnpm …`
- Green = **four** checks: `playwright test` (~196 tests, ~17 s) + `tsc --noEmit -p tsconfig.json` +
  `tsc -p tsconfig.type-test.json` (public API) + `pnpm build`. New public members in `src/index.ts`
  need a line in `tests/generic-instance.type-test.ts`. Playwright boots its own dev server on 23334 —
  a hand-started one poisons the run (`pgrep -fl vite` first).
- BSD `grep`: use `grep -E` (`\|` matches nothing). `biome format` skips `tests/`; `--write` on a
  directory reflows `outliner.css` → target `.ts` files. `test-results/` past ~50 files blocks the
  suite → `mv` it away, never delete.
- Flaky-in-full-run candidate (passes solo): `expand-collapse.spec.ts:213`. A test-side sleep racing
  a page timer is NOT flakiness — make the ordering deterministic instead.
- Ad-hoc browser probes: `@playwright/test` is the only resolvable entry (pnpm, no root
  `playwright-core`); import it by absolute path from a script outside the repo, `chromium` only
  (headless shell + webkit in `~/Library/Caches/ms-playwright`). ESM ignores `NODE_PATH`.

## Packaging
- `build.js` → one Vite lib build per entry, `emptyOutDir` only on `i === 0`. CSS extracted per entry;
  types from `tsc` into `dist/types`. Outliner ships twice (`mind-elixir` re-export +
  `mind-elixir/outliner` entry) — accepted duplication; the standalone stays clean because
  `Outliner.ts` only reaches `utils/index`. Pin that with
  `grep -c "map-canvas\|map-container" dist/Outliner.js` = 0.
- Verify against `dist/`: static server + Chromium, import both bundles, assert computed styles (with
  a negative control), row count (ROOT is a row), `mei.undo()` moves the outline.

## Invariants
- **Focus**: `mei.nodeData` IS the focus root; `getData()` reports `nodeDataBackup`. `clearHistory()`
  runs AFTER `cancelFocus`'s `refresh()`.
- **`linkDiv`**: three phases, order load-bearing (fresh `.subLines` → read all geometry → write via
  fragment; deferring phase 0 → 58 failures). No id→node index anywhere. 5,461 nodes: 9.6 ms.
- **Outliner**: **bound-only** (`mei` the only required option); reads the live tree via the map's
  `getObjById` + `parent` back-refs — never a second tree walk. Breadcrumb walks UP, stops at
  `this.root.id`. Ctrl+Z on `document` returns early inside `mei.container`. Keyed reconciliation,
  delegated listeners, no creation-time closures. Two sync channels (journal push = sync,
  `expandNode` = deferred). `.outline-item-front` 1 rem spacer is load-bearing.
  `outliner.getData()` = bare `NodeObj`; `readonly` kills row pointer events, not breadcrumb.
  Guide: `skills/integrate-outliner/SKILL.md`. Row-control + IME rules → `skills/` and the parity
  harness, not this file.
- **Row controls**: never driven by `:hover` alone — three signals (`:hover`, `:focus-within`,
  `.menu-open`); reveal *and* paint must answer to the same ones. State lives on the row as
  `--row-control-opacity`; a *folded* chevron opts out in its own `[data-state='collapsed']` rule.
  No row-level background exists in the library — "whole row has no highlight" is host CSS. No
  Tailwind preflight → every icon button declares its own `cursor`. No `:has()` left in
  `outliner.css`. Parity proof: `mind-elixir-parity-harness/scripts/probe-row-control-parity.mjs`.
- **Outliner IME guard**: early-return on `e.isComposing || e.keyCode === 229`, plus — for
  `Enter`/`Escape` only — while `compositionJustEnded` (0 ms timer; Safari fires compositionend
  BEFORE the confirming Enter, which then reports `isComposing: false`). No `composing` flag needed.
  Negative control must disable BOTH lines — the second one silently keeps the test green.
- **diffRefresh** (undo/redo patch path): ops carry a global DATA anchor; emission order
  `insert → move → remove → update` is load-bearing; `clonePatch` preserves `undefined`; no extra bus
  events. Falls back to `refresh` on missing nodeData / focus mode / any resync — pin that set.

## Styles — md/LaTeX are ONE layer (`.me-md`), marked by the CALLER
- `src/markdown.css` is shared by both views. Scope is `.me-md`, which goes on the mount point
  (`options.el`) — the library injects no marker, and the rules are descendant selectors, so an
  ancestor works too. Without it md falls back to the UA defaults (h1 24px → 32px).
- Colour goes through `--me-md-accent` / `--me-md-heading`, mapped per view in its OWN file
  (`index.css` ← `--selected`; `outliner.css` ← `--rol-primary-color` / `--rol-header-color`). The
  mapping must sit on the element that DECLARES the source variable — `theme.ts` writes `--selected`
  inline on `.map-container`, and a value set on the mount point loses to it (by design).
- The md layer is introduced by the **map entry only**: `src/index.ts` imports `index.css` then
  `markdown.css`; `Outliner.ts` / `src/outliner/index.ts` import nothing but `outliner.css`. A CSS
  import is per-bundle, so this is a **user decision (2026-09-15)** with a real cost: `dist/Outliner.css`
  is 7180 B with **zero** md rules (it keeps only the now-dead `--me-md-accent` mapping on
  `.outliner-container`), i.e. `mind-elixir/outliner/style.css` alone no longer styles md — a host on
  the standalone path must also load `mind-elixir/style.css`. `dist/MindElixir.css` is complete:
  index.css + markdown.css + outliner.css (the latter via `export { Outliner } from './outliner'`,
  `index.ts:422`). Moving the import back into the outliner entry was measured byte-identical
  (7954 B) — one line, if the standalone promise is ever wanted again.
- Nothing in the shared file may name a view: pin `grep -c map-container dist/Outliner.css` = 0
  (+ the `Outliner.js` one).
- Deliberately NOT shared: the map's `:has(.katex){max-width:none}`; the outline's block flattening
  + `.katex-display: inline-block` (same content 118.2 px vs 200.2 px).
- Contract tests: `tests/md-shared-layer.spec.ts` (7). Fixture:
  `initBoundOutliner(data, el, outlineEl, markdown)`. Probe:
  `mind-elixir-parity-harness/scripts/probe-css-layer-parity.mjs`.

## Library quirks (found, NOT fixed — out of scope)
- `setNodeTopic` fires no `operation` (no history entry, next undo rolls it back) → use `reshapeNode`.
  `moveNodeObj` gives a stale `direction` into main nodes.
- Outliner `onChange` misses in-outline renames (`setNodeTopicBound` suppresses the sync it rides on).
  Complete signal: `mei.historyStack.subscribe`. JSDoc overstates — reported, not reworded.
- Mid-edit DOM teardown blur: decided 不修. Judge reachability first; give probes a positive control.
- `expandNode(el, false)` on the **root** throws (`interact.ts` takes `parent.children[1]` as the
  expander; the root's parent has no `.me-epd`). Reachable only from the API / the outliner's root-row
  chevron. Nested nodes are fine.

## Testing traps
- Row-control visibility is asserted as **effective** opacity (`tests/outliner.spec.ts`'s
  `expectVisibleOpacity`: product down the ancestor chain + `expect.poll` for the 200 ms fade), never
  as the cluster's own `opacity` — where the fade sits is a mechanism detail. Don't re-pin it.
- New regression tests must **fail** without the fix (negative control), incl. refactors.
- `undo()` keeps entries for redo → assert depth via `currentIndex`. Scope locators `#map`/`#outline`.
- `hasText` is case-insensitive substring ("Child 1" matches "Grandchild 1"); it stops matching once
  the test empties the topic → address rows by `[data-item-id]`.
- Synthetic `KeyboardEvent` always reports `isComposing: false` — good for replaying Safari's IME
  ordering. Pure engine questions: `about:blank` + `page.evaluate`.
- Playwright `touchscreen.tap` (Chromium AND WebKit) also synthesizes mouse events → hover is set and
  kept, so touch-only hover bugs do NOT reproduce in emulation. Test the contract instead: click to
  focus, `page.mouse.move(0,0)` to park the pointer, then assert the computed style.

## Conventions
- **注释只写代码在做什么，不写「这次改了什么、为什么这么改」。** 不要用注释留改动说明，也不要
  为一次改动补 README 段落 / CHANGELOG 条目 —— 2026-09-15 用户明确要求把我加的这些全部删掉，
  语气很重。改动该不该被记录，由用户决定，不要自作主张留底。
- Keep `CHANGELOG.md`'s `## Unreleased` current. Changing `refresh`: `restore()` calls it too —
  baseline updates go through the `refresh` event with a `restoring` flag.
- 行控件的可见性**留在 CSS 里**。「改用 JS 控制会不会更快」已实测为否：1365 行下 hover 单次 recalc
  0.2 ms、script 0.5 vs 4.1 ms。
- Touching mixed-in methods or `Options` → `node gen-members.js` then format `src/index.ts`.
