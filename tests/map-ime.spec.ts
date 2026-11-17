import { test, expect } from './mind-elixir-test'

/**
 * IME guard for the MAP editors (node topic + SVG labels), mirroring
 * tests/outliner-ime.spec.ts.
 *
 * Safari fires compositionend BEFORE the Enter/Esc that confirms the IME
 * candidate, so those keydowns arrive with `isComposing === false`. Without the
 * `compositionJustEnded` guard the confirming Enter would blur() the editor,
 * closing it mid-composition (bug report 2026-11-17 #8).
 */
const data = {
  nodeData: {
    topic: 'Root Topic',
    id: 'root',
    children: [
      {
        id: 'left-main',
        topic: 'Left Main',
        children: [
          { id: 'left-child-1', topic: 'Left Child 1' },
          { id: 'left-child-2', topic: 'Left Child 2' },
          { id: 'left-child-3', topic: 'Left Child 3' },
        ],
      },
    ],
  },
}

test.beforeEach(async ({ me }) => {
  await me.init(data)
})

test('Node editor: Safari Enter/Esc confirming an IME candidate do not close the editor', async ({ page, me }) => {
  await me.dblclick('Root Topic')
  await expect(page.locator('#input-box')).toBeVisible()

  await page.evaluate(() => {
    const box = document.getElementById('input-box') as HTMLElement
    // Chrome order: keydowns fired DURING a composition carry keyCode 229
    box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Process', keyCode: 229, bubbles: true, cancelable: true }))
    box.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'candidate' }))
    // Safari order: the confirming Enter and Esc land AFTER compositionend,
    // reporting `isComposing: false` — they must still be swallowed
    box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }))
  })

  // The editor stays open and the topic data is untouched
  await expect(page.locator('#input-box')).toBeVisible()
  const topic = await page.evaluate(() => (window as any)['#map'].nodeData.topic)
  expect(topic).toBe('Root Topic')
})

test('Node editor: Enter after the composition window has closed still commits', async ({ page, me }) => {
  await me.dblclick('Root Topic')
  await expect(page.locator('#input-box')).toBeVisible()

  await page.evaluate(() => {
    const box = document.getElementById('input-box') as HTMLElement
    box.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    box.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'candidate' }))
  })
  // A LATER task. Dispatch inside a setTimeout so this Enter is queued after
  // the composition-end guard's own clearing timer — deterministic, unlike a
  // test-side sleep racing the page's timer.
  await page.evaluate(
    () =>
      new Promise<void>(resolve => {
        setTimeout(() => {
          const box = document.getElementById('input-box') as HTMLElement
          box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
          resolve()
        }, 0)
      }),
  )

  await expect(page.locator('#input-box')).toBeHidden()
})

test('Summary label editor: Safari Enter confirming an IME candidate does not close the editor', async ({ page, me }) => {
  await me.click('Left Child 1')
  await page.getByText('Left Child 1', { exact: true }).click({ button: 'right', force: true })
  await page.locator('#cm-summary').click()

  // Summary creation automatically enters edit mode
  await expect(page.locator('#input-box')).toBeVisible()

  await page.evaluate(() => {
    const box = document.getElementById('input-box') as HTMLElement
    box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Process', keyCode: 229, bubbles: true, cancelable: true }))
    box.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'candidate' }))
    box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
  })

  await expect(page.locator('#input-box')).toBeVisible()
  await expect(page.locator('.svg-label[data-type="summary"]').first()).toHaveText('summary')
})

test('Summary label editor: Enter after the composition window has closed still commits', async ({ page, me }) => {
  await me.click('Left Child 1')
  await page.getByText('Left Child 1', { exact: true }).click({ button: 'right', force: true })
  await page.locator('#cm-summary').click()
  await expect(page.locator('#input-box')).toBeVisible()

  await page.evaluate(() => {
    const box = document.getElementById('input-box') as HTMLElement
    box.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }))
    box.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'candidate' }))
  })
  await page.evaluate(
    () =>
      new Promise<void>(resolve => {
        setTimeout(() => {
          const box = document.getElementById('input-box') as HTMLElement
          box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
          resolve()
        }, 0)
      }),
  )

  await expect(page.locator('#input-box')).toBeHidden()
  await expect(page.locator('.svg-label[data-type="summary"]').first()).toHaveText('summary')
})
