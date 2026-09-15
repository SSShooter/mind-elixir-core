# Testing traps & probes

Split out of `MEMORY.md`. These are failure modes that took real time to find.

- **Effective opacity**: row-control visibility is asserted as the product of `opacity` down the
  ancestor chain, plus `expect.poll` for the 200 ms fade (`tests/outliner.spec.ts` →
  `expectVisibleOpacity`). Never assert the cluster's own `opacity` — where the fade sits is a mechanism
  detail. Don't re-pin it.
- **Negative control**: a new regression test must FAIL without the fix, including for refactors. The
  cheap way: `git stash push -- <the src files>`, run the spec, expect red, then `git stash pop`.
- **Undo depth**: `undo()` keeps entries for redo → assert depth via `historyStack.currentIndex`.
- **Locator scoping**: `#map` / `#outline`. Two instances on one page share `document.activeElement`
  (inline-edit flows such as `createSummary` → `editSvgText` steal focus from each other) and ids are
  unique only per map — never `document.querySelector` for `#a-…`/`#s-…`, use `mei.nodes.querySelector`.
- **`hasText`** is a case-insensitive substring match ("Child 1" matches "Grandchild 1"), and it stops
  matching as soon as the test empties the topic → address rows by `[data-item-id]`.
- **Synthetic keyboard**: `new KeyboardEvent(...)` always reports `isComposing: false` — which is what
  makes it useful for replaying Safari's IME ordering. Pure engine questions need no page: `about:blank`
  + `page.evaluate`.
- **Touch emulation**: Playwright's `touchscreen.tap` (Chromium AND WebKit) also synthesizes mouse
  events → hover is set and kept, so touch-only hover bugs do NOT reproduce in emulation. Test the
  contract instead: click to focus, `page.mouse.move(0,0)` to park the pointer, then assert the computed
  style.
- **Probe scripts**: `@playwright/test` is the only resolvable entry (pnpm, no root `playwright-core`)
  → import it by absolute path from a script in the repo root, `chromium` only (headless shell + webkit
  in `~/Library/Caches/ms-playwright`), delete the script afterwards. ESM ignores `NODE_PATH`. A dev
  server on 23333 serves live `src/`, so a probe can `import('/src/index.ts')` instead of a build.
