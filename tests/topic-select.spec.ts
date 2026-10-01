import type { Page } from '@playwright/test'
import { test, expect } from './mind-elixir-test'

const data = {
  nodeData: {
    topic: 'root',
    id: 'root',
    children: [
      {
        id: 'middle1',
        topic: 'middle1',
        children: [
          {
            id: 'child1',
            topic: 'child1',
          },
          {
            id: 'child2',
            topic: 'child2',
          },
        ],
      },
      {
        id: 'middle2',
        topic: 'middle2',
        children: [
          {
            id: 'child3',
            topic: 'child3',
          },
          {
            id: 'child4',
            topic: 'child4',
          },
        ],
      },
    ],
  },
}

const select = async (page: Page) => {
  await page.mouse.move(200, 100)
  await page.mouse.down()
  await page.getByText('child2').hover({ force: true })
  await page.waitForTimeout(1000)
  await page.mouse.up()
}

test.beforeEach(async ({ me }) => {
  await me.init(data)
})

test('Select Sibling', async ({ page, me }) => {
  await me.click('child2')
  await page.keyboard.press('ArrowUp')
  await expect(page.locator('.selected')).toHaveText('child1')
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.selected')).toHaveText('child2')

  await select(page)
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.selected')).toHaveText('child2')
  await page.keyboard.press('ArrowUp')
  await expect(page.locator('.selected')).toHaveText('child1')
})

test('Multi-select navigation anchors on the last-selected node', async ({ page, me }) => {
  // SIDE layout alternates main nodes: middle1 lands on the left, middle2 on
  // the right — so child1 and child3 sit on opposite sides.
  await me.click('child3') // give the container keyboard focus
  await page.evaluate(() => {
    const mind = (window as any)['#map']
    const pick = (id: string) => mind.map.querySelector(`[data-nodeid="me${id}"]`)
    mind.selectNodes([pick('child1'), pick('child3')])
  })
  // child3 was selected first, so the currentNodes tail — the anchor — is
  // child1 on the LEFT side. ArrowRight walks toward the root and lands on
  // middle1; anchoring on the head (child3, right side) would be a no-op.
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.selected')).toHaveText('middle1')
})

test('Parent Child', async ({ page, me }) => {
  await me.click('child1')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.selected')).toHaveText('middle1')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.selected')).toHaveText('root')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.selected')).toHaveText('middle2')
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.selected')).toHaveText('child3')

  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.selected')).toHaveText('middle2')
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.selected')).toHaveText('root')
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.selected')).toHaveText('middle1')
  await page.keyboard.press('ArrowLeft')
  await expect(page.locator('.selected')).toHaveText('child1')
})
