# Mind Elixir Core — project memory

Deliberately short — injected every session. Deep detail lives in the `20xx-xx-xx.md` daily logs,
`.workbuddy/bug-and-perf-scan.md` and the `mind-elixir-*` skills.

## Environment
- `pnpm` is installed but not on the tool PATH (nvm's Node):
  `PATH=/Users/darksouls/.nvm/versions/node/v24.20.0/bin:$PATH pnpm …`
- Tests: `… node_modules/.bin/playwright test <specs> --reporter=line`. The config boots its own dev
  server on 23334; a hand-started one there poisons the run (`reuseExistingServer: true`) → check
  `pgrep -fl vite` before believing a mass `ERR_CONNECTION_REFUSED` failure.
- Green = **four** checks: `playwright test` (181 tests, ~15 s) + `tsc --noEmit -p tsconfig.json` +
  `tsc -p tsconfig.type-test.json` (public API surface, separate tsconfig — the first tsc skips it)
  + `pnpm build`. A public member declared in `src/index.ts` needs a line in
  `tests/generic-instance.type-test.ts` too. `playwright test` itself needs `pnpm` on the PATH (its
  webServer command is `pnpm dev --port 23334`).
- BSD `grep`: `\|` alternation silently matches nothing → use `grep -E`. `biome format` silently
  skips `tests/`, and `--write` on a *directory* also reflows `outliner.css` → point it at `.ts`
  files. `test-results/` past ~50 files blocks the suite → `mv` it away, never delete.
- `expand-collapse.spec.ts:213` ("Expand is undoable and redoable") occasionally fails in a full
  parallel run and passes solo → re-run before calling it a regression.

## Packaging
- `build.js` → one self-contained Vite lib build per entry, `emptyOutDir` only on `i === 0`, so a new
  entry appended later never wipes the earlier outputs. CSS is extracted per entry
  (`Outliner` → `dist/Outliner.js` + `dist/Outliner.css`); types come from `tsc` into `dist/types`.
- The outliner ships BOTH ways: `mind-elixir` re-exports it, and `mind-elixir/outliner` +
  `mind-elixir/outliner/style.css` are its own entry. Duplication is the accepted pattern here
  (`i18n.js` does the same). The standalone bundle stays clean because `Outliner.ts` only reaches
  `utils/index` (pure helpers) and takes the core as `import type` — verify with
  `grep -c "map-canvas\|map-container" dist/Outliner.js` (= 0).
- Verify a **packaging** change against `dist/`, not `src/`: node static server over the repo root +
  Chromium, `import '/dist/MindElixir.js'` and `/dist/Outliner.js`, then assert computed styles (with
  a no-stylesheet negative control), rendered row count (the ROOT node is a row too) and that
  `mei.undo()` moves the outline. Script kept at `/tmp/verify-outliner-build.mjs` (log 09-14).

## Codegen
- Touching mixed-in methods (`methods.ts`, `interact.ts`) or `Options` → `node gen-members.js` then
  `biome format --write src/index.ts`. New types in a signature must be imported there.

## Invariants
- **Focus**: `mei.nodeData` IS the focus root; `getData()` still reports `nodeDataBackup`. Focus is a
  history boundary — `clearHistory()` must run AFTER `cancelFocus`'s `refresh()`.
- **`linkDiv`**: three phases, order load-bearing — fresh empty `.subLines` per main node → read ALL
  geometry with zero writes → write via `DocumentFragment`. Phase 0 is an implicit contract
  (deferring it → 58 failures). 5,461 nodes: 124→**9.6 ms**, reflows 5,461→**1** (log 09-13).
  `linkDiv(main)` is not a real partial update. No id→node index anywhere (`getObjById`/`tidyArrow`
  are full-tree DFS). `exampleData/largeMap.ts` is ~320 nodes — too small to show perf problems.
  Benchmark **attached**: the same work is 3× slower live than detached.
- **Outliner**: **bound-only** — `mei` is the ONLY required option (data = `mei.nodeData` rendered by
  reference, history = `mei.historyStack`; `data`/`history`/`docName`/`commit()`/`operations.ts` are
  gone). It reads the live tree through the map's own `getObjById` + `parent` back-refs
  (`fillParent`), so *never* reintroduce a second tree walk. The breadcrumb walks UP from the node
  and must stop at `this.root.id`: in focus mode `nodeData` is a subtree whose `parent` still points
  into the backup tree. Ctrl+Z listens on `document` but returns early when
  `mei.container.contains(target)` — the map already handles it, otherwise one keypress undoes twice.
  Keyed reconciliation, not a rebuild; no per-node listeners (delegated); no creation-time closures
  for live state. Two sync channels must NOT share a window: journal push → `requestSync` (sync),
  map `expandNode` → `scheduleSync`. 17 DOM elements/node — the `.outline-item-front` 1 rem spacer
  is load-bearing.
- Outliner API facts (probed on `dist/` 09-14): constructing before `await init` — or with
  `allowUndo: false` — throws on the missing `historyStack`. `outliner.getData()` is a **bare
  `NodeObj`**, byte-identical to `mei.getData().nodeData` when not zoomed, while `mei.getData()` is
  the document wrapper. Following the map's focus mode is automatic. `readonly: true` kills the row's
  pointer events (menu/drag/edit) but not the breadcrumb. User-facing guide:
  `skills/integrate-outliner/SKILL.md` (the `skills/` folder is what `npx skills add` publishes).

## diffRefresh (undo/redo patch path, shipped 09-14)
A second entry point beside `refresh` (untouched, authoritative). `src/utils/treePatch.ts` +
`src/plugin/diffRefresh.ts`, installed in `init` before `operationHistory`. Design + side-effect
contract: log 09-14.
- Ops carry a global DATA anchor, never a rendered container. Emission order
  `insert → move → remove → update` is load-bearing. `direction` change = resync only on a MAIN node.
  `clonePatch` must preserve `undefined`. The patch path fires no extra bus events, on purpose.
- Falls back to `refresh` on: missing `nodeData` / focus mode / any `resync`. Pin that **set** —
  "everything silently degraded" still passes parity.
- 5,461 nodes: undo ~73 → ~14 ms (fold a big branch: 93 → 37 ms). Floor = one `linkDiv()`.
  Probe: `mind-elixir-perf-probe/scripts/probe-undo-redo.mjs`.
- Verified by `tests/diff-refresh.spec.ts` (parity harness) + `tests/tree-patch.spec.ts`.

## Library quirks (found, NOT fixed — out of scope)
- `setNodeTopic` (`nodeOperation.ts:339`) does not fire `operation` → the edit gets no history entry
  **and the next undo rolls it back**. Use `reshapeNode` instead (as the outliner's
  `setNodeTopicBound` does).
- `moveNodeObj` gives a stale `direction` to a node moved *into* a main node.
- **Outliner `onChange` misses in-outline renames** (found 09-14 while documenting). It rides on the
  sync render, and `setNodeTopicBound` wraps `reshapeNode` in `suppressSync` (so a full render cannot
  swallow the click that caused the blur) — so a topic edited in the outline lands in the map and the
  journal (`reshapeNode` entry, `Ctrl+Z` works) but never calls `onChange`. Structural gestures,
  undo/redo and map-side edits all fire it. Complete signal: `mei.historyStack.subscribe`. The option's
  JSDoc ("after every change that reached the outline") reads as intent the code does not meet —
  reported, not silently reworded.

## Editing / DOM teardown — decided 不修 (09-14)
Implicit blur from removing the focused element is engine-dependent (Chromium sync, Firefox not);
explicit `el.blur()` always fires. Every reachable mid-edit `layout()` caller is programmatic.
**Judge reachability before arguing about the bug**, and give probes a positive control.
The outliner handles mid-edit Ctrl+Z (`handleGlobalKeydown`); don't copy that to the map side.

## Testing traps
- New regression tests must be shown to **fail** without the fix. For a refactor, apply the same
  control to the mechanism you newly rely on: break it (`return null`) and check the *new* test
  fails while the rest stay green (09-14: `prevSiblingOf` / `pathTo`).
- `undo()` keeps entries for redo → assert depth via `currentIndex`. Scope locators
  (`#map` / `#outline`) in bound-outliner specs. ~1 px screenshot diffs are env drift.
- A locator filtered by text (`hasText`) stops matching the element the moment the test empties its
  topic → address such rows by `[data-item-id]` instead. The outliner breadcrumb lists the ROOT node
  as its own segment after the home button.
- Pure engine questions need no app: `about:blank` + `page.evaluate`
  (Firefox needs `MOZ_DISABLE_*_SANDBOX=1` and cannot load this repo's Vite ESM).

## Conventions
- Keep `CHANGELOG.md`'s `## Unreleased` current. Topic text may contain newlines; plaintext export
  escapes them symmetrically. Changing `refresh`: `restore()` calls it too, so an unconditional
  `clearHistory()` would wipe the stack on every undo; baseline updates go through the `refresh`
  event with a `restoring` flag (`getData()` is a full JSON clone).
- `destroy(this: Partial<MindElixir>)`; `helper1/2` listeners only die in `hideLinkController`
  (`arrow.ts:553`). `Bus.removeListener` iterates **backwards**.
