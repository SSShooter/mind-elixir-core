# Mind Elixir Core — project memory

Curated, long-lived notes. Injected into every session, so keep it short — deep detail
(perf tables, verification transcripts) lives in the daily logs, `.workbuddy/bug-and-perf-scan.md`,
and the `mind-elixir-*` skills.

## Environment (this machine)

- `pnpm` IS installed, just not on the tool shell's PATH — it lives in nvm's Node:
  `PATH=/Users/darksouls/.nvm/versions/node/v24.20.0/bin:$PATH pnpm …`.
  `/tmp/wb-shim/pnpm` is obsolete and deleted — do not recreate.
- Tests: `PATH=…/v24.20.0/bin:$PATH node_modules/.bin/playwright test <specs> --reporter=line`.
  `playwright.config.ts` boots its own web server (`pnpm dev --port 23334`) — let it.
  `reuseExistingServer: true` means a hand-started dev server on 23334 poisons the run: if it dies
  mid-flight, every page test fails with `ERR_CONNECTION_REFUSED` (looks like a total regression).
  Check `pgrep -fl vite` / `lsof -nP -iTCP:23334 -sTCP:LISTEN` before believing a mass failure.
- `grep` here is BSD: `\|` alternation silently matches nothing. Use `grep -E`.
- Playwright browsers must match `@playwright/test` (1.62.x → chromium-headless-shell 1234).
- Baseline: **177 tests**, ~20–23 s.
- **Green means four checks, not one**: `playwright test` (runtime) + `tsc --noEmit -p tsconfig.json`
  (source) + `tsc -p tsconfig.type-test.json` (**public API surface** — `tests/generic-instance.type-test.ts`,
  a separate tsconfig; running only the first `tsc` silently skips it) + `pnpm build`.
- `api-extractor.json` exists but `api/` is not checked in and `dist/` is untracked → `pnpm doc` is a
  manual docs step, never a green-light condition.
- A public member declared in `src/index.ts` (`declare foo: …`) needs a line in
  `tests/generic-instance.type-test.ts` too — nothing else asserts the type, and losing the declaration
  only fails in a *user's* project.
- `test-results/` past ~50 files blocks the whole suite (safe-delete shim) → `mv` it away, don't delete.
- `playwright test … | tail -40` hides the failure count (91 passed can really be 91+58 failed).
  Use `--list` or redirect to a file and grep.

## Codegen / formatting

- After changing mixed-in methods (`methods.ts`, `interact.ts`, …) or `Options`: run
  `node gen-members.js` **then** `biome format --write src/index.ts`. New types used in a
  signature must be imported there or the exhaustiveness guards fail `tsc`.
- `biome check src` has pre-existing format debt — format only the lines you touched.
- `biome format <paths>` **silently skips `tests/`** — passing 7 files reports "Checked 5 files".
  That is not a failure; don't read the count as evidence your spec was formatted.

## Focus mode (invariants)

- `mei.nodeData` IS the focus root; `getData()` / `collectData` still report `nodeDataBackup`
  (whole diagram). `restore()` re-anchors explicitly after `refresh(fullSnapshot)`.
- Focus is a history boundary: `focusNode` / `cancelFocus` call `clearHistory()`, so entries
  only ever belong to the current view. `clearHistory` must run AFTER `cancelFocus`'s `refresh()`.

## Outliner renderer (keyed reconciliation, not a rebuild)

- `views: Map<id, ItemView>`; `syncItem` walks, `patchItemView` writes diffs, `unmountUnseen`
  sweeps — an unchanged node keeps its element, listeners, focus and hover state.
- Ordering is load-bearing (`expected = cursor.nextSibling` → one `insertBefore` per moved node).
- No per-node listeners (delegated on `this.el`); no creation-time closures for live state
  (menu entries carry `data-action`; handlers read refreshed `view.*`).
- Topic cache `view.topicText` / `topicDirty`: never write topic HTML while `editingId === id`.
- `focusItem` places the caret explicitly (a reused element is already focused → no `focusin`).
- 17 DOM elements/node: `.outline-item-front` is a 1 rem spacer anchoring the dot — don't drop it.
- **Two sync channels must NOT share a coalescing window**: history push → `requestSync`
  (synchronous, callers need fresh DOM), map `expandNode` → `scheduleSync` (microtask).
  Counts asserted by `skills/mind-elixir-perf-probe/scripts/probe-sync-counts.mjs`.

## Map renderer — linkDiv

- Two-phase read/write + merging sublinks into one `<path>`: at 5,461 nodes 124.2 → **9.6 ms**,
  forced reflows 5,461 → **1**. Numbers and the per-hotspot profile: daily log 2026-09-13.
- **Three phases, order is load-bearing**: swap in a fresh empty `.subLines` per main node →
  read ALL geometry with zero writes → write everything via `DocumentFragment`.
  Phase 0 must stay: `createWrapper` only appends `.me-children` for expanded nodes, so the
  empty sublink svg at `children[1]` is an implicit contract of `traverseChildren`
  (deferring it → 58 test failures).
- `linkDiv(mainNode)` is **not** a real partial update — every main branch still runs.
- No id→node index anywhere; `getObjById` / `tidyArrow` are full-tree DFS.
- `exampleData/largeMap.ts` is only ~320 nodes — it cannot reproduce perf problems.
- Benchmark in a **live** container: the same work is 3× slower attached than detached
  (style resolution), so detached-svg numbers lie.

## Undo/redo = diff/patch (shipped 2026-09-14)

`restore()` hands the snapshot to `mei.diffRefresh(data)` — a *second* entry point beside
`refresh`, which stays untouched and authoritative. `src/utils/treePatch.ts` (`diffTree` /
`applyDataOps` pure, `applyTreeOps` DOM) + `src/plugin/diffRefresh.ts`, installed in `init`
**before** `operationHistory` (restore reads `mei.diffRefresh` at call time).
Design + the full side-effect contract: daily log 2026-09-14.

- **Ops carry a global DATA anchor, never a rendered container.** `diffTree` reconciles each
  parent's `children` order; `applyTreeOps` maps it — container from `node.direction`, slot from
  the data order ("insert before the next rendered sibling *in this container*", `null` = append).
  Reconciling per container cannot converge (one parent, two containers, one shared array) and
  drops nodes into the wrong side. `DiffOptions.sideLayout` is now only the
  "main node without a `direction`" resync guard (`layout()` writes the side on the way in).
- Emission order `insert → move → remove → update` is load-bearing (move can target a brand-new
  parent; move can rescue a node out of a doomed subtree; `expanded` lands on a settled structure).
  Every index/anchor is read off the `simChildren`/`simParent` simulation, mutated in lockstep.
- `clonePatch` must preserve `undefined` (`deepClone` is a JSON round trip — it would eat
  `expanded: undefined`, the only trace of a cleared field). Data and DOM are indexed separately.
- **`direction` change = resync only on a MAIN node** (a root child). On a deeper node the field is
  inert, so it travels as an ordinary `update` — `objectManipulation.moveNodeObj` copies the
  destination's side onto anything moved *into* a main node, so the strict rule made every plain
  drag's undo a full rebuild.
- **The patch path fires no extra bus events, on purpose.** A bound outliner learns about a restore
  through the history stack it shares with the map (`Outliner.ts:151` — "map operations, undo, redo
  and clear all land here"); its `expandNode` listener is for SILENT expands, which record nothing.
  An `expandNode` fire here was measured inert for every consumer (outliner spec 7/7,
  `probe-sync-counts.mjs` 22/22 either way) and was removed — `refresh` fires nothing at that point,
  and inventing a signal is a gratuitous deviation from the path this one claims to equal.
- Verified by `tests/diff-refresh.spec.ts` (parity harness: byte-compares `getData()` + every
  rendered container + selection + viewport + **all** bus-event counts against a control instance
  with `diffRefresh = undefined`) and `tests/tree-patch.spec.ts` (property tests). Pin the *set* of
  restores that fall back to `refresh` — otherwise "everything silently degraded" still passes parity.
- At 5,461 nodes undo went ~73 ms → ~14 ms (fold of a big branch: 93 → 37 ms). The patch floor is
  one `linkDiv()`; probe: `skills/mind-elixir-perf-probe/scripts/probe-undo-redo.mjs`.

## Known library quirks (found while doing the above — NOT fixed, out of scope)

- `setNodeTopic` (`nodeOperation.ts:339`) does not fire `operation`, so the edit gets no history
  entry *and the next undo rolls it back*. The outliner deliberately uses `reshapeNode` instead
  (`Outliner.ts:475`) even though `setNodeTopic` is still declared public.
- `moveNodeObj` gives a stale `direction` to a node moved *into* a main node (inert when rendered,
  visible in `getData()`).

## Editing / DOM teardown (decided: 不修, 2026-09-14)

- Inline edits commit on `blur`; the *implicit* blur caused by removing the focused element is
  engine-dependent (Chromium fires it synchronously during `innerHTML=''`, Firefox doesn't).
- Decided **not** to fix: every entry able to reach `layout()` mid-edit is programmatic
  (`refresh` / `init*` / `changeTheme` / `changeCompact` / `undo` / `redo` / `focusNode` /
  `cancelFocus`); mouse clicks blur first, and both inline editors `stopPropagation()` on the
  first line of keydown, so Ctrl+Z can't reach `operationHistory`'s listener.
- **Judge reachability before arguing about the bug.** Probes need a positive control
  ("correct place → fires once"), otherwise a broken probe passes silently.
- `el.blur()` called explicitly fires blur in every engine — only *implicit* blur diverges,
  so don't use "removal triggers blur" as a fallback, and don't call explicit `blur()` unreliable.
- The outliner DOES handle mid-edit Ctrl+Z explicitly (`Outliner.ts:1279-1295`) because it is
  reachable there — don't copy it to the map side without re-checking reachability.

## Testing traps

- New regression tests must be shown to FAIL without the fix. A test that passes when unfixed
  usually means the path never ran — confirm with a must-throw probe.
- `HistoryStack.undo()` keeps undone entries for redo → assert depth via `currentIndex`.
- In bound-outliner specs scope locators (`#map` / `#outline`) — `getByText` matches both views.
- ~1 px screenshot diffs are environment drift; don't update snapshots without asking.
- Pure engine questions need no app: `about:blank` + `page.evaluate`. Firefox needs
  `MOZ_DISABLE_*_SANDBOX=1` and cannot load this repo's Vite ESM.

## Conventions

- Keep `CHANGELOG.md`'s `## Unreleased` current as you go — any host-visible behavior change
  needs an entry (breaking / feature / fix / behavior change / refactor).
- Topic text may contain newlines (Shift+Enter); plaintext export escapes them symmetrically
  (`escapeTopic` / `unescapeTopic`), so a raw write would add a spurious root level.
- Changing `refresh`'s internals: `restore()` also calls it, so an unconditional
  `clearHistory()` there would wipe the stack on every undo. Baseline updates go through the
  `refresh` event with a `restoring` flag (`getData()` is a full JSON clone — not suppressing
  it costs a whole-tree clone per undo).
- `destroy(this: Partial<MindElixir>)`; `helper1/helper2` pointer listeners are only torn down
  by `hideLinkController` (`arrow.ts:553`), so destroy must call `?.destroy?.()`.
- `Bus.removeListener` iterates **backwards** (forward iteration skips the shifted item).
