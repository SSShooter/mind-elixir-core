# md / LaTeX styles — one shared layer, marked by the caller

Split out of `MEMORY.md` (which is injected every session). Detail: `../2026-09-15.md`.

- `src/markdown.css` is shared by the map and the outliner. Scope is `.me-md`, which goes on the mount
  point (`options.el`) — the library injects no marker, and the rules are descendant selectors, so an
  ancestor works too. Without it md falls back to UA defaults (h1 24px → 32px).
- Colour goes through `--me-md-accent` / `--me-md-heading`, mapped per view in its OWN file
  (`index.css` ← `--selected`; `outliner.css` ← `--rol-primary-color` / `--rol-header-color`). The
  mapping must sit on the element that DECLARES the source variable — `theme.ts` writes `--selected`
  inline on `.map-container`, and a value set on the mount point loses to it (by design).
- The md layer is introduced by the **map entry only**: `src/index.ts` imports `index.css` then
  `markdown.css`; `Outliner.ts` / `src/outliner/index.ts` import nothing but `outliner.css`. A CSS
  import is per-bundle, so this is a **user decision (2026-09-15)** with a real cost:
  `dist/Outliner.css` is 7180 B with **zero** md rules (it keeps only the now-dead `--me-md-accent`
  mapping on `.outliner-container`), i.e. `mind-elixir/outliner/style.css` alone no longer styles md —
  a host on the standalone path must also load `mind-elixir/style.css`. `dist/MindElixir.css` is
  complete: index.css + markdown.css + outliner.css (the latter via `export { Outliner } from
  './outliner'`, `index.ts:422`). Moving the import back was measured byte-identical (7954 B) — one
  line, if the standalone promise is ever wanted again.
- Nothing in the shared file may name a view: pin `grep -c map-container dist/Outliner.css` = 0 (plus
  the `Outliner.js` one).
- Deliberately NOT shared: the map's `:has(.katex){max-width:none}`; the outline's block flattening
  + `.katex-display: inline-block` (same content 118.2 px vs 200.2 px).
- Contract tests: `tests/md-shared-layer.spec.ts` (7). Fixture:
  `initBoundOutliner(data, el, outlineEl, markdown)`. Probe:
  `mind-elixir-parity-harness/scripts/probe-css-layer-parity.mjs`.
- Assertion trap: a variable-bridge test must use a custom theme that makes the two sides differ — on
  the default theme `--selected` and the shared layer's fallback are the same value (`#4dc4ff`), so the
  bridge can be broken and the test still passes. The "view root" is `.map-container` inside `#map`,
  not the host element (an element's own declaration beats inheritance).
