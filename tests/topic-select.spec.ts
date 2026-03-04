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
  await page.mouse.up()
}

test.beforeEach(async ({ me }) => {
  await me.init(data)
})

test('Keyboard shortcuts work immediately after clicking a node when map is unfocused', async ({ page, me }) => {
  // Blur the map container to simulate the window not having focus
  await page.evaluate(() => {
    const container = document.querySelector('.map-container') as HTMLElement
    container.blur()
  })
  // Verify the map container lost focus
  const isFocused = await page.evaluate(() => document.activeElement?.classList.contains('map-container'))
  expect(isFocused).toBe(false)

  // Click a node to select it - this should focus the map container
  await me.click('child1')

  // Verify the map container has focus after selecting a node
  const isNowFocused = await page.evaluate(() => document.activeElement?.classList.contains('map-container'))
  expect(isNowFocused).toBe(true)

  // Press Delete immediately - should work without needing an additional click
  await page.keyboard.press('Delete')
  await expect(page.getByText('child1')).toBeHidden()
})
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
