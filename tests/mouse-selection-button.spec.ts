import type { Page } from '@playwright/test'
import { test, expect } from './mind-elixir-test'

const data = {
  nodeData: {
    id: 'root',
    topic: 'root',
    children: [
      { id: 'left-1', topic: 'left-1' },
      { id: 'left-2', topic: 'left-2' },
      { id: 'right-1', topic: 'right-1' },
      { id: 'right-2', topic: 'right-2' },
    ],
  },
}

async function initRightButtonMap(page: Page) {
  await page.waitForFunction(() => Boolean(window.MindElixir))
  const dataStr = JSON.stringify(data)
  await page.evaluate(async dataStr => {
    const MindElixir = window.MindElixir
    const mind = new MindElixir({
      el: '#map',
      direction: MindElixir.SIDE,
      editable: true,
      mouseSelectionButton: 2,
    })
    await mind.init(JSON.parse(dataStr))
    window['#map'] = mind
  }, dataStr)
}

test.describe('mouseSelectionButton', () => {
  test.beforeEach(async ({ me }) => {
    await initRightButtonMap(me.page)
  })

  test('uses the configured right button for box selection', async ({ page }) => {
    const container = (await page.locator('.map-container').boundingBox())!
    const target = (await page.locator('.me-tpc').filter({ hasText: /^left-1$/ }).boundingBox())!
    const startX = container.x + 2
    const startY = container.y + 2
    const endX = target.x + target.width + 8
    const endY = target.y + target.height + 8

    await page.mouse.move(startX, startY)
    await page.mouse.down({ button: 'right' })
    await page.mouse.move(endX, endY)
    await page.mouse.up({ button: 'right' })

    await expect(page.locator('.me-tpc.selected')).toHaveCount(1)
    await expect(page.locator('.me-tpc').filter({ hasText: /^left-1$/ })).toHaveClass(/selected/)
    await expect(page.locator('.context-menu')).toBeHidden()
    expect(await page.evaluate(() => window['#map'].ptState)).toBe(0)
  })

  test('uses the opposite left button for map panning', async ({ page }) => {
    const before = await page.locator('.map-container .map-canvas').evaluate(el => el.getAttribute('style'))
    const container = (await page.locator('.map-container').boundingBox())!

    await page.mouse.move(container.x + 8, container.y + 8)
    await page.mouse.down({ button: 'left' })
    await page.mouse.move(container.x + 48, container.y + 8)
    await page.mouse.up({ button: 'left' })

    const after = await page.locator('.map-container .map-canvas').evaluate(el => el.getAttribute('style'))
    expect(after).not.toBe(before)
  })

  test('clears selection when left-clicking blank space', async ({ page }) => {
    await page.locator('.me-tpc').filter({ hasText: /^left-1$/ }).click({ force: true })
    await expect(page.locator('.me-tpc.selected')).toHaveCount(1)

    const container = (await page.locator('.map-container').boundingBox())!
    await page.mouse.click(container.x + 8, container.y + 8, { button: 'left' })

    await expect(page.locator('.me-tpc.selected')).toHaveCount(0)
  })

  test('keeps the context menu for a plain right click', async ({ page }) => {
    const node = (await page.getByText('left-1', { exact: true }).boundingBox())!
    await page.mouse.click(node.x + node.width / 2, node.y + node.height / 2, { button: 'right' })

    await expect(page.locator('.context-menu')).toBeVisible()
  })
})
