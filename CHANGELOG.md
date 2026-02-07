# Changelog

## 5.8.0 - 2026-02-07

### Features

- Build & export plaintext converter

## 5.7.1 - 2026-02-02

### Bug Fixes

- Correct input copy behavior

## 5.7.0 - 2026-02-01

### Features

- Refactor clipboard handling using native events
- Import pasteHandler for improved clipboard operations
- Remove draggable option
- Add plaintext converter for importing/exporting mind maps
- Allow creating arrows without offset

### Refactors

- Refactor node operations and improve structure
- Refactor keypress handling and clipboard functions
- Refactor utility functions in index.ts

### Chores

- Update readme
- Upgrade playwright to latest version

## 5.6.1 - 2026-01-18

### Bug Fixes

- Unify map padding across themes (`50px` → `50px 80px`)
- Export constants (LEFT, RIGHT, SIDE, THEME, DARK_THEME) to bypass SSR errors

## 5.6.0 - 2026-01-17

### Features

- Update `.svg-label` style
- Calculate arrow delta instead of constant value
- Enhance fullscreen handling

### Bug Fixes

- Prevent arrow reversal
- Improve scale validation logic

## 5.5.0 - 2026-01-05
