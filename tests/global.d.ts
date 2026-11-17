import type MindElixir from '../src'
import type { Topic } from '../src'

// Shared window typings for Playwright tests. The test page (tests/test.html)
// exposes map instances, the Outliner class and helpers on `window`; maps are
// stored under their selector key (e.g. `window['#map']`) via
// MindElixirFixture.init. The index signature keeps arbitrary instance keys
// (including selectors with special characters) type-safe as `any`.
declare global {
  interface Window {
    [key: string]: any
    m: MindElixir
    MindElixir: typeof MindElixir
    // `MindElixir.E` (findEle) declares `this: MindElixir`; a standalone
    // signature lets tests call it as `window.E(id, container)` without the
    // receiver being a MindElixir instance.
    E: (id: string, el?: HTMLElement) => Topic
    Outliner: any
    outliner: any
    renderMarkdown: (text: string) => string
    collectIstanbulCoverage?: (coverageJSON: string) => void
    __coverage__?: unknown
  }
}

export {}
