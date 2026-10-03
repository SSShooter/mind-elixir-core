/**
 * Demo: one Arabic dataset, two maps — `rtl: false` (the default) on the left,
 * `rtl: true` on the right, so the text direction is comparable at a glance.
 * Open /demos/arabic.html with the vite dev server (`pnpm dev`).
 */
import MindElixir from './index'
import arabicSample from './exampleData/arabic'
import { ar } from './i18n'

declare const window: Window & {
  ltr?: MindElixir
  rtl?: MindElixir
}

async function main() {
  const ltr = new MindElixir({
    el: '#map-ltr',
    newTopicName: 'موضوع جديد',
    editable: true,
    toolBar: true,
    contextMenu: { locale: ar },
  })
  await ltr.init(arabicSample)

  const rtl = new MindElixir({
    el: '#map-rtl',
    newTopicName: 'موضوع جديد',
    editable: true,
    toolBar: true,
    contextMenu: { locale: ar },
    rtl: true,
  })
  await rtl.init(arabicSample)

  // fit both maps to their half-width pane, and keep them fitted on resize
  const fit = () => {
    ltr.scaleFit()
    rtl.scaleFit()
  }
  fit()
  window.addEventListener('resize', fit)

  window.ltr = ltr
  window.rtl = rtl
}

main()
