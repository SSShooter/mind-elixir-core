import { test, expect } from './mind-elixir-test'

// 30 children so the content height exceeds the 300px container,
// making viselect resolve _scrollAvailable = true
const data = {
  nodeData: {
    id: 'root',
    topic: 'root',
    children: Array.from({ length: 30 }, (_, i) => ({
      id: `child-${i}`,
      topic: `child-${i} ${'text'.repeat(8)}`,
    })),
  },
}

test.describe('selection auto-scroll', () => {
  test.beforeEach(async ({ me }) => {
    await me.init(data)
  })

  test('keeps the selection area stable when the map is clamped at its boundary', async ({ page }) => {
    // Push the map to its left clamp boundary in one shot;
    // any further leftward move request gets fully clamped
    await page.evaluate(() => (window as any)['#map'].move(-10000, 0))

    const container = (await page.locator('.map-container').boundingBox())!
    const startY = container.y + container.height / 2
    // Map has been shifted left, so node right edges stop at the container
    // center line — the right side is blank (pointerdown target === container)
    const anchorX = container.x + container.width - 60
    // 2px from the right edge: inside startScrollMargins (50px), triggers auto-scroll
    const edgeX = container.x + container.width - 2

    await page.mouse.move(anchorX, startY)
    await page.mouse.down()
    // Multi-step move: the scroll loop only starts on the second pointermove
    // (scroll speed is computed by the previous event)
    await page.mouse.move(edgeX, startY, { steps: 3 })
    await page.waitForTimeout(600) // let the auto-scroll loop run against the boundary

    const area = page.locator('.selection-area')
    const box1 = (await area.boundingBox())!
    await page.waitForTimeout(400)
    const box2 = (await area.boundingBox())!
    await page.mouse.up()

    // Anchor must not drift: selection area position and size stay stable
    expect(Math.abs(box2.x - box1.x)).toBeLessThan(1)
    expect(Math.abs(box2.width - box1.width)).toBeLessThan(1)
  })
})
