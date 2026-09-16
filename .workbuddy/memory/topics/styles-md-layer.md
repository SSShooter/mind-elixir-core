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
- Deliberately NOT shared: the map's `:has(.katex){max-width:none}`; the outline's UA-margin flattening
  for `p/ul/ol/blockquote/pre/table`.
- **`.katex-display`'s box belongs to `katex.min.css`** (`display:block; margin:1em 0;
  text-align:center`), not to this library — so a helper rule here can silently break a vendor contract.
  The outline keeps `display: block`, trims the margins (`margin: 0`) for list density, and re-anchors
  the line to the row's left edge (`text-align: left`). `inline-block` was correct-looking in review and
  wrong on screen — the user caught `$$` rendering as an inline run while the map showed it as a block
  (2026-09-16). That divergence survived because **`test.html` never loaded `katex.min.css`**, so no
  assertion could see it; the CSS-layer diff in §8 of the parity skill was blind to it too (neither
  view's CSS contains that rule).
- **Same declaration ≠ same rendering: the two views' boxes have different width semantics.** The map's
  node (`.me-tpc`) is shrink-to-fit, so KaTeX's centring is nearly invisible there (measured ink left
  edge: 3px from the node's edge, i.e. 0px from its text, when the formula is the widest line; 28.4px —
  25.4px past its text — when the text line is wider). The outline's `.outline-item-topic` is
  `flex: 1` ⇒ the display box spans the whole row, so the same centring parks the formula **193px**
  (panel 1400) / **68px** (900) from the row's left edge — it tracks the panel width, and two sibling
  `$$` rows disagree (227 vs 193). Left-aligned it is 0px at every width, which is what the map renders
  in practice. **To override vendor alignment you must hit the inner wrapper: `text-align` on
  `.katex-display` alone is a dead declaration** (KaTeX re-centers in
  `.katex-display>.katex{display:block;text-align:center}`; measured: dropping our `left` changed zero
  pixels, computed value stayed `center`). Both selectors are pinned in the contract test.
- Contract tests: `tests/md-shared-layer.spec.ts` (8). Fixture:
  `initBoundOutliner(data, el, outlineEl, markdown)`; `test.html` must import
  `katex/dist/katex.min.css` or the KaTeX assertions pass without an opponent. Probe:
  `mind-elixir-parity-harness/scripts/probe-css-layer-parity.mjs`.
- Assertion trap: a variable-bridge test must use a custom theme that makes the two sides differ — on
  the default theme `--selected` and the shared layer's fallback are the same value (`#4dc4ff`), so the
  bridge can be broken and the test still passes. The "view root" is `.map-container` inside `#map`,
  not the host element (an element's own declaration beats inheritance).
