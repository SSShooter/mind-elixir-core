import type { Page } from '@playwright/test'
import { test, expect } from './mind-elixir-test'

const data = {
  nodeData: {
    topic: 'root',
    id: 'root',
    root: true,
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

test.beforeEach(async ({ me }) => {
  await me.init(data)
})

const select = async (page: Page) => {
  await page.mouse.move(200, 100)
  await page.mouse.down()
  await page.getByText('child2').hover({ force: true })
  await page.mouse.up()
}

test('Multiple seletion', async ({ page }) => {
  await select(page)
  await expect(page.locator('.selected').filter({ hasText: 'child1' })).toBeVisible()
  await expect(page.locator('.selected').filter({ hasText: 'child2' })).toBeVisible()
})

test('Multiple Move Before', async ({ page, me }) => {
  await select(page)
  await page.getByText('child1').hover({ force: true })
  await page.mouse.down()
  await me.dragOver('child3', 'before')
  await expect(page.locator('.insert-preview.before')).toBeVisible()
  await page.mouse.up()
  await me.toHaveScreenshot()
})

test('Multiple Move After', async ({ page, me }) => {
  await select(page)
  await page.getByText('child1').hover({ force: true })
  await page.mouse.down()
  await me.dragOver('child3', 'after')
  await expect(page.locator('.insert-preview.after')).toBeVisible()
  await page.mouse.up()
  await me.toHaveScreenshot()
})

test('Multiple Move In', async ({ page, me }) => {
  await select(page)
  await page.getByText('child1').hover({ force: true })
  await page.mouse.down()
  await me.dragOver('child3', 'in')
  await expect(page.locator('.insert-preview.in')).toBeVisible()
  await page.mouse.up()
  await me.toHaveScreenshot()
})

test('Multiple Copy', async ({ page, me }) => {
  await select(page)
  await page.keyboard.press('Control+C')
  await me.click('child3')
  await page.keyboard.press('Control+V')
  await me.toHaveScreenshot()
})
