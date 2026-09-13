# Mind Elixir Core — project memory

Curated, long-lived notes. Daily logs live beside this file.

## Environment (this machine)

- **`pnpm` IS installed — it is just not on the tool shell's PATH.** It lives inside nvm's
  Node: `~/.nvm/versions/node/v24.20.0/bin/pnpm`. `~/.zshrc` adds nvm to PATH and is only
  read by **interactive** shells, so prefix the bin dir from the Bash tool:
  `PATH=/Users/darksouls/.nvm/versions/node/v24.20.0/bin:$PATH pnpm …`.
- `package.json` has no `packageManager` field, so corepack is never required. The old
  `/tmp/wb-shim/pnpm` forwarding shim is **obsolete and has been deleted** — do not recreate it.
- Playwright browsers must match the installed `@playwright/test` (1.62.x → chromium
  headless shell 1234): `node_modules/.bin/playwright install chromium-headless-shell`.
  Older cached builds only produce "Executable doesn't exist".
- `playwright.config.ts` boots its web server via `pnpm dev --port 23334`; let it do that
  (Playwright does not reuse a hand-started server reliably). To drive a plain script
  instead, start that server yourself via the Bash tool with `run_in_background: true`.
- Test command: `PATH=/Users/darksouls/.nvm/versions/node/v24.20.0/bin:$PATH node_modules/.bin/playwright test <specs> --reporter=line`.
  The Bash tool's managed Node 22 runs the same toolchain fine.

## Codegen / formatting

- `src/index.ts` carries a `// #region GENERATED members` block. After changing mixed-in
  methods (`src/methods.ts`, `src/interact.ts`, …) or the `Options` type, run
  `node gen-members.js` **then** `node_modules/.bin/biome format --write src/index.ts`
  (raw codegen emits double quotes and trailing `;` inside object types). Any new type used
  in a signature must be imported in `src/index.ts`; the guards at the bottom fail `tsc` otherwise.
- `biome check src` has pre-existing format debt — format only the lines you touched
  (compare with a formatted copy in the same directory instead of running `--write`).

## Focus mode (invariants)

- In focus mode `mei.nodeData` IS the focus root (and `fillParent` leaves its `parent`
  `undefined`), while `getData()` / `collectData` keep reporting `nodeDataBackup` — the whole
  diagram. So `mei.refresh(snapshot)` inside focus breaks the `nodeData` ⊂ `nodeDataBackup`
  aliasing that `cancelFocus` relies on; `operationHistory.restore` re-anchors it explicitly
  (refresh the full snapshot, then re-point `nodeData` at the focus root found inside it).
- Focus is a history boundary: `focusNode` / `cancelFocus` call `clearHistory()`, so stack
  entries only ever belong to the current focus view. `clearHistory` must run AFTER
  `cancelFocus`'s `refresh()`, otherwise the re-baseline snapshot is the focus subtree.

## Outliner renderer (invariants — read before touching render paths)

`render()` is a **keyed reconciliation**, not a rebuild: each rendered node owns a
persistent `ItemView` in `views: Map<id, ItemView>`. `syncItem` walks the visible tree,
`patchItemView` writes only what differs, `unmountUnseen` releases anything the walk
missed — so a fold genuinely frees its DOM. A node whose data is unchanged keeps its
element, listeners, focus and hover state.

- **Ordering is load-bearing**: each container goes right after the previously placed
  sibling (`expected = cursor.nextSibling`), giving one `insertBefore` per moved node.
  Stale containers land after the correct ones and are swept by `unmountUnseen`.
- **No per-node listeners.** All interaction is delegated on `this.el` (`handleClick`
  router + drag handlers); `createItemView` is deliberately listener-free (8 → 0/node).
- **No creation-time closures for live state.** Menu entries carry `data-action`; click
  and drag handlers read `view.item / level / parentId / siblingCount`, refreshed on every
  sync. The old closures went stale as soon as a node moved.
- **Topic cache** (`view.topicText` / `topicDirty`): never write topic HTML while
  `editingId === item.id`; the dirty flag restores rendered markup after editing. This is
  also why opening a menu no longer re-runs markdown/KaTeX over every node.
- **`focusItem` places the caret explicitly** — a reused element is already focused so no
  `focusin` fires, and the old rebuild always left the caret at the end.
- **The `…` menu is derived state** (exists iff `openMenuId` names the node).
  `setOpenMenu` touches only the two nodes involved; the button group is revealed by the
  `.menu-open` class on the wrapper, never by `:hover` (that coupling caused the flicker).
- 17 DOM elements/node is unchanged: `.outline-item-front` is a 1rem flex spacer anchoring
  the absolutely-positioned dot — dropping it shifts every topic.

- **Bound-mode sync has TWO channels and they must NOT share a coalescing window**
  (fixed 2026-09-13, was a lost-update bug):
  - history-stack push → `requestSync` → renders **synchronously** (one push = one new
    change; `applyBoundOperation` / `deleteItem` focus a node right after the map call and
    need the fresh DOM, so this cannot be deferred).
  - map `expandNode` event → `scheduleSync` → **deferred to a microtask** (`syncDirty` +
    `syncQueued`). `interact.ts:447` fires `expandNode` *before* the `operation` that
    pushes history, and a **silent** expand (`nodeOperation.ts:45/255`) fires it with no
    entry of its own — the caller's operation is its announcement. So deferring is always
    safe and folds still cost exactly **one** render.
  - Anything that renders on its own (`zoomTo`) or tears down (`destroy`) must clear
    `syncDirty`, or the queued microtask repopulates an already-swept container.
  - Counts are asserted by `skills/mind-elixir-perf-probe/scripts/probe-sync-counts.mjs`
    (fold=1, two ops in one block=2, silent expand=0 sync + 1 microtask, undo/redo=1).

### Measured baseline (2026-09-13, Chromium headless, 20-run avg, driven via `window.o`)

| nodes | old full render | idle render | topic edit | fold | menu toggle |
|---|---|---|---|---|---|
| 341 | 6.33 ms | 0.065 ms | 0.120 ms | 0.060 ms | 0.025 ms |
| 1,365 | 20.86 ms | 0.310 ms | 0.240 ms | 0.215 ms | 0.015 ms |
| 5,461 | 94.39 ms | 1.035 ms | 1.070 ms | 0.970 ms | 0.015 ms |

Cost is now the O(n) diff walk (~0.0022 ms/node), not DOM writes. The `…` menu and
outliner drag & drop have **no suite coverage** — re-run the functional probe after
touching either. Tooling + pitfalls: `mind-elixir-perf-probe` skill.

## Testing notes

- `HistoryStack.undo()` keeps undone entries for redo, so assert undo depth with
  `historyStack.currentIndex`, never `getEntries().length`.
- In bound-outliner specs `page.getByText(...)` matches both views — scope locators with
  `page.locator('#map')` / `page.locator('#outline')`.
- Screenshot failures of ~1 pixel (e.g. `multiple-instance.spec.ts`) are rendering
  environment drift, not regressions; do not update snapshots without asking.
