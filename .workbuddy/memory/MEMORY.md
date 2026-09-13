# Mind Elixir Core — project memory

Curated, long-lived notes. Daily logs live beside this file.

## Environment (this machine)

- No global `pnpm` in non-interactive shells. Use `zsh -lc 'corepack pnpm …'`; it needs
  sandbox-escalated execution because it writes `~/Library/pnpm/store`. An interrupted
  install once left `node_modules` with a full `.pnpm` store but no top-level links —
  `corepack pnpm install --frozen-lockfile` restores them.
- Playwright browsers must match the installed `@playwright/test` (1.62.x → chromium
  headless shell 1234): `node_modules/.bin/playwright install chromium-headless-shell`.
  Older cached builds only produce "Executable doesn't exist".
- `playwright.config.ts` boots its web server via `pnpm dev --port 23334`. Without a global
  pnpm, put a shim first on PATH — `/tmp/wb-shim/pnpm` forwarding `dev` to
  `node node_modules/vite/bin/vite.js`. Playwright does not reuse a hand-started server
  reliably, so let the shim start it.
- Test command: `PATH=/tmp/wb-shim:$PATH node_modules/.bin/playwright test <specs> --reporter=line`.

## Codegen / formatting

- `src/index.ts` carries a `// #region GENERATED members` block. After changing mixed-in
  methods (`src/methods.ts`, `src/interact.ts`, …) or the `Options` type, run
  `node gen-members.js` **then** `node_modules/.bin/biome format --write src/index.ts`
  (raw codegen emits double quotes and trailing `;` inside object types). Any new type used
  in a signature must be imported in `src/index.ts`; the guards at the bottom fail `tsc` otherwise.
- `biome check src` has pre-existing format debt — format only the lines you touched
  (compare with a formatted copy in the same directory instead of running `--write`).

## Testing notes

- `HistoryStack.undo()` keeps undone entries for redo, so assert undo depth with
  `historyStack.currentIndex`, never `getEntries().length`.
- In bound-outliner specs `page.getByText(...)` matches both views — scope locators with
  `page.locator('#map')` / `page.locator('#outline')`.
- Screenshot failures of ~1 pixel (e.g. `multiple-instance.spec.ts`) are rendering
  environment drift, not regressions; do not update snapshots without asking.
