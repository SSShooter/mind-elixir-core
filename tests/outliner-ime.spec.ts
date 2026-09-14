import { test, expect } from './mind-elixir-test'

const data = {
  nodeData: {
    topic: 'root',
    id: 'root',
    children: [
      {
        id: 'branch1',
        topic: 'Branch 1',
        expanded: true,
        children: [
          { id: 'child1', topic: 'Child 1' },
          {
            id: 'child2',
            topic: 'Child 2',
            children: [
              { id: 'grandchild1', topic: 'Grandchild 1' },
              { id: 'grandchild2', topic: 'Grandchild 2' },
            ],
          },
        ],
      },
    ],
  },
}

const topics = (page: any) => page.locator('#outline .outline-item-topic')

test.beforeEach(async ({ me }) => {
  await me.initBoundOutliner(data)
})

test('Enter that confirms an IME composition does not create a sibling', async ({ page }) => {
  await topics(page).filter({ hasText: 'Child 1' }).first().click()
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#outline .outline-item-topic')) as HTMLElement[]
    const el = items.find(i => i.textContent === 'Child 1')
    if (!el) throw new Error('row not found: Child 1')
    el.focus()
    // Chrome order: keydowns fired during a composition carry keyCode 229
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Process', keyCode: 229, bubbles: true, cancelable: true }))
    el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'candidate' }))
    // Safari order: the confirming Enter (and Esc) land AFTER compositionend,
    // reporting `isComposing: false` — they must still be swallowed
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  })

  await expect(topics(page)).toHaveCount(6)
  await expect(topics(page).filter({ hasText: /^$/ })).toHaveCount(0)
})

test('Enter after the composition window has closed still creates a sibling', async ({ page }) => {
  await topics(page).filter({ hasText: 'Child 1' }).first().click()
  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('#outline .outline-item-topic')) as HTMLElement[]
    const el = items.find(i => i.textContent === 'Child 1')
    if (!el) throw new Error('row not found: Child 1')
    el.focus()
    el.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    el.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'candidate' }))
  })
  // A LATER task. Dispatch inside a setTimeout so this Enter is queued after
  // the composition-end guard's own clearing timer — deterministic, unlike a
  // test-side sleep racing the page's timer.
  await page.evaluate(
    () =>
      new Promise<void>(resolve => {
        setTimeout(() => {
          const items = Array.from(document.querySelectorAll('#outline .outline-item-topic')) as HTMLElement[]
          const el = items.find(i => i.textContent === 'Child 1')
          if (!el) throw new Error('row not found: Child 1')
          el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
          resolve()
        }, 0)
      }),
  )

  await expect(topics(page)).toHaveCount(7)
})
