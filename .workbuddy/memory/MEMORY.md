# Mind Elixir Core — project memory

Injected every session, so it stays short. Stories → `20xx-xx-xx.md` daily logs; deeper notes →
`topics/`; workflows → the `mind-elixir-*` skills. Cite a script/skill instead of restating it here.

## Environment
- `pnpm` needs the nvm PATH: `PATH=/Users/darksouls/.nvm/versions/node/v24.20.0/bin:$PATH pnpm …`
- Green = **four** checks: `playwright test` (~197, ~20 s) + `tsc --noEmit -p tsconfig.json` +
  `tsc -p tsconfig.type-test.json` (public API; a new `src/index.ts` member needs a line in
  `tests/generic-instance.type-test.ts`) + `pnpm build` (6 entries). Playwright boots its own dev server
  on 23334 — `pgrep -fl vite` first (a hand-started one poisons the run).
- `pnpm build` can die inside WorkBuddy on the safe-delete guard (`emptyDir(dist/types)`, 82 deletes >
  threshold 50) — that is the environment, not `build.js`. `mv dist /tmp/…` first, then build = EXIT 0.
- BSD: `grep -E` (`\|` matches nothing). `biome format` skips `tests/`; never aim `--write` at a
  directory (`outliner.css` gets reflowed) — target `.ts` files. `test-results/` past ~50 files blocks
  the suite → `mv` away, never delete.
- Probes and their traps: `topics/testing-traps.md`.

## Packaging
- `build.js` → one Vite lib build per entry, `emptyOutDir` only on `i === 0`; types from `tsc` into
  `dist/types`. Outliner ships twice (`mind-elixir` re-export + `mind-elixir/outliner` entry) — accepted
  duplication; pin the standalone's cleanliness with `grep -c "map-canvas\|map-container" dist/Outliner.js` = 0.
- Verify against `dist/`: static server + Chromium, import both bundles, assert computed styles (with a
  negative control), row count (ROOT is a row), `mei.undo()` moves the outline.

## Invariants
- **Focus**: `mei.nodeData` IS the focus root; `getData()` reports `nodeDataBackup`.
  `clearHistory()` runs AFTER `cancelFocus`'s `refresh()`.
- **`linkDiv`**: three phases, order load-bearing (fresh `.subLines` → read all geometry → write via
  fragment; deferring phase 0 → 58 failures). No id→node index anywhere. 5,461 nodes: 9.6 ms. It is also
  the ONLY thing that repaints arrows / summaries / labels.
- **diffRefresh** (undo/redo patch path): ops carry a global DATA anchor; emission order
  `insert → move → remove → update` is load-bearing; `clonePatch` preserves `undefined`; no extra bus
  events. Falls back to `refresh` on missing nodeData / focus mode / any resync — pin that set.
  `arrows`/`summaries` sit OUTSIDE the tree: compare them (`sameValue`), replace only when they differ,
  and hand that to `applyTreeOps(mei, ops, redraw)` — `ops.length === 0` means "no node to patch", NOT
  "nothing to redraw". Replacing without a redraw leaves the DOM bound to orphaned arrow objects.
  Harness: `tests/diff-refresh.spec.ts` — two instances, one with `diffRefresh` removed, comparing data +
  every rendered layer + bus-event counts + the link selection, and pinning the fallback set.
- **`operationHistory.restore` selection**: nodes go back to `currentSelected` on undo (the pre-op
  selection / the target on redo), but an arrow or a summary is **not** in `currentNodes` — picking one
  clears the node selection — so a link target is re-selected in BOTH directions and reachability is left
  to the `#a-…`/`#s-…` lookup inside `mei.nodes` (a link the undone step created, or one the redo removes,
  has no group → falls back). Undo of a reshape / label edit must leave the highlight and the control
  points up, or the curve changes with nothing on screen saying which link moved.
- **Outliner** (bound-only, row controls, IME guard): detail in `topics/outliner.md` +
  `skills/integrate-outliner/SKILL.md`. Load-bearing: `mei` is the ONLY required option and the tree is
  read via the map's `getObjById`/`parent` back-refs (never a second walk); breadcrumb walks UP, stops at
  `this.root.id`; row controls need three signals, never `:hover` alone, state on the row as
  `--row-control-opacity`; the IME guard needs BOTH the `isComposing`/229 early return and the
  `compositionJustEnded` window for `Enter`/`Escape` (Safari's ordering).

## Styles — md/LaTeX are ONE layer (`.me-md`), marked by the CALLER
Detail: `topics/styles-md-layer.md`. Must not be forgotten:
- `src/markdown.css` is shared; `.me-md` goes on the mount point (`options.el`) — the library injects no
  marker, and an ancestor works too. Without it md falls back to UA defaults (h1 24→32px).
- Colour flows through `--me-md-accent` / `--me-md-heading`, mapped per view in its OWN file, on the
  element that DECLARES the source variable (`theme.ts` writes `--selected` inline on `.map-container`)
  — a value on the mount point loses to it by design.
- Introduced by the **map entry only** — a **user decision (2026-09-15)** with a real cost:
  `dist/Outliner.css` has **zero** md rules, so the standalone outliner entry no longer styles md; a host
  on that path must also load `mind-elixir/style.css`. Reverting is one line, byte-identical.
- Pin `grep -c map-container dist/Outliner.css` = 0; the shared file may never name a view.

## Library quirks (found, NOT fixed — out of scope)
- `setNodeTopic` fires no `operation` → use `reshapeNode`. `moveNodeObj` gives a stale `direction` into
  main nodes.
- Outliner `onChange` misses in-outline renames (`setNodeTopicBound` suppresses the sync it rides on);
  complete signal is `mei.historyStack.subscribe`. JSDoc overstates — reported, not reworded.
- Mid-edit DOM teardown blur: 不修. Judge reachability first; give probes a positive control.
- `expandNode(el, false)` on the **root** throws (`interact.ts` takes `parent.children[1]` as the
  expander); reachable only from the API / the outliner's root-row chevron. Nested nodes are fine.

## Conventions
- **注释只写代码在做什么，不写「这次改了什么、为什么这么改」。** 不要用注释留改动说明，也不要为一次
  改动补 README 段落 / CHANGELOG 条目 —— 2026-09-15 用户明确要求把我加的这些全部删掉，语气很重。
  改动该不该被记录，由用户决定，不要自作主张留底。
- Keep `CHANGELOG.md`'s `## Unreleased` current. Changing `refresh`: `restore()` calls it too.
- 行控件的可见性**留在 CSS 里**。「改用 JS 控制会不会更快」已实测为否：1365 行下 hover 单次 recalc
  0.2 ms、script 0.5 vs 4.1 ms。
- Touching mixed-in methods or `Options` → `node gen-members.js` then format `src/index.ts`.
