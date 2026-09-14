# Mind Elixir Core — project memory

Deliberately short — injected every session. Deep detail lives in the `20xx-xx-xx.md` daily logs,
`.workbuddy/bug-and-perf-scan.md` and the `mind-elixir-*` skills.

## Environment
- `pnpm` needs the nvm PATH: `PATH=/Users/darksouls/.nvm/versions/node/v24.20.0/bin:$PATH pnpm …`
- Green = **four** checks: `playwright test` (183 tests, ~16 s) + `tsc --noEmit -p tsconfig.json` +
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

## Testing traps
- New regression tests must **fail** without the fix (negative control), incl. refactors.
- `undo()` keeps entries for redo → assert depth via `currentIndex`. Scope locators `#map`/`#outline`.
- `hasText` is case-insensitive substring ("Child 1" matches "Grandchild 1"); it stops matching when
  the test empties the topic → address rows by `[data-item-id]`.
- Synthetic `KeyboardEvent` always reports `isComposing: false` — convenient for replaying Safari's
  IME ordering. Pure engine questions: `about:blank` + `page.evaluate`.

## Conventions
- Keep `CHANGELOG.md`'s `## Unreleased` current. Changing `refresh`: `restore()` calls it too —
  baseline updates go through the `refresh` event with a `restoring` flag.
- Touching mixed-in methods or `Options` → `node gen-members.js` then format `src/index.ts`.
