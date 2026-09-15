# Outliner — bound mode, row controls, IME guard

Split out of `MEMORY.md`. Details/stories: `../2026-09-1*.md`. Host-facing guide:
`skills/integrate-outliner/SKILL.md`.

## Bound-only subsystem
- `mei` is the ONLY required option; the outliner reads the live tree through the map's `getObjById` +
  `parent` back-refs — never a second tree walk.
- Breadcrumb walks UP, stops at `this.root.id`. Ctrl+Z on `document` returns early inside
  `mei.container`. Keyed reconciliation, delegated listeners, no creation-time closures.
- Two sync channels: journal push = sync, `expandNode` = deferred.
- `.outline-item-front` 1 rem spacer is load-bearing. `outliner.getData()` = bare `NodeObj` (not the
  wrapped document). `readonly` kills row pointer events, not breadcrumb.

## Row controls
- Never driven by `:hover` alone — three signals (`:hover`, `:focus-within`, `.menu-open`); reveal
  *and* paint must answer to the same ones.
- State lives on the row as `--row-control-opacity`; a *folded* chevron opts out in its own
  `[data-state='collapsed']` rule.
- No row-level background exists in the library — "the whole row has no highlight" is host CSS.
- No Tailwind preflight → every icon button declares its own `cursor`. No `:has()` left in
  `outliner.css`.
- Parity proof: `mind-elixir-parity-harness/scripts/probe-row-control-parity.mjs`.

## IME guard (outliner keydown)
- Early-return on `e.isComposing || e.keyCode === 229`, plus — for `Enter`/`Escape` ONLY — while
  `compositionJustEnded` (0 ms timer). Safari fires `compositionend` BEFORE the confirming Enter, which
  then reports `isComposing: false`; without the second line Enter would commit the edit twice.
- No `composing` flag needed.
- A negative control must disable BOTH lines — the second one silently keeps the test green.
