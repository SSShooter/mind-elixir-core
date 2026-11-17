import { test, expect } from './mind-elixir-test'

const data = {
  nodeData: {
    topic: 'Root Node',
    id: 'root',
    children: [
      {
        id: 'left-1',
        topic: 'Left Branch 1',
        children: [
          {
            id: 'left-1-1',
            topic: 'Left Child 1',
          },
        ],
      },
      {
        id: 'right-1',
        topic: 'Right Branch 1',
      },
    ],
  },
}

test.beforeEach(async ({ me }) => {
  await me.init(data)
})

// Regression: readonly mode only guarded `keydown`; the cut/paste clipboard
// listeners mutated node data regardless of `editable`.
// https://github.com/... — bug report 2026-11-17, issue 2
test('Readonly - cut does not remove nodes', async ({ page, me }) => {
  // positive control: the same cut removes the node when editable
  await me.click('Left Child 1')
  await page.evaluate(() => {
    const mind = window['#map']
    mind.container.dispatchEvent(
      new ClipboardEvent('cut', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() })
    )
  })
  await expect(page.getByText('Left Child 1')).toBeHidden()

  // reload to restore the map, then verify readonly behaviour
  await me.goto()
  await me.init(data)
  await me.click('Left Child 1')
  await page.evaluate(() => window['#map'].disableEdit())
  await page.evaluate(() => {
    const mind = window['#map']
    mind.container.dispatchEvent(
      new ClipboardEvent('cut', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() })
    )
  })
  await expect(page.getByText('Left Child 1')).toBeVisible()
  await expect(page.getByText('Root Node')).toBeVisible()
})

test('Readonly - paste does not insert nodes', async ({ page, me }) => {
  const payload = JSON.stringify({
    magic: 'MIND-ELIXIR-WAIT-COPY',
    data: [{ id: 'pasted-1', topic: 'Pasted Node' }],
  })

  // positive control: the same paste inserts a node when editable
  await me.click('Right Branch 1')
  await page.evaluate(json => {
    const mind = window['#map']
    const dt = new DataTransfer()
    dt.setData('text/plain', json)
    mind.container.dispatchEvent(
      new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt })
    )
  }, payload)
  await expect(page.getByText('Pasted Node')).toBeVisible()

  // reload to restore the map, then verify readonly behaviour
  await me.goto()
  await me.init(data)
  await me.click('Right Branch 1')
  await page.evaluate(() => window['#map'].disableEdit())
  await page.evaluate(json => {
    const mind = window['#map']
    const dt = new DataTransfer()
    dt.setData('text/plain', json)
    mind.container.dispatchEvent(
      new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: dt })
    )
  }, payload)
  await expect(page.getByText('Pasted Node')).toBeHidden()
  await expect(page.getByText('Right Branch 1')).toBeVisible()
})

test('Readonly - copy still works', async ({ page, me }) => {
  await me.click('Left Child 1')
  await page.evaluate(() => window['#map'].disableEdit())
  const copied = await page.evaluate(() => {
    const mind = window['#map']
    const dt = new DataTransfer()
    mind.container.dispatchEvent(
      new ClipboardEvent('copy', { bubbles: true, cancelable: true, clipboardData: dt })
    )
    return dt.getData('text/plain')
  })
  expect(copied).toContain('Left Child 1')
})
