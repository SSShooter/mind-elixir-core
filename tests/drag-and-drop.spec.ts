import { test, expect } from './mind-elixir-test'

const m1 = 'm1'
const m2 = 'm2'
const childTopic = 'child-topic'
const data = {
  nodeData: {
    topic: 'root-topic',
    id: 'root-id',
    root: true,
    children: [
      {
        id: m1,
        topic: m1,
        children: [
          {
            id: 'child',
            topic: childTopic,
          },
        ],
      },
      {
        id: m2,
        topic: m2,
      },
    ],
  },
}

test.beforeEach(async ({ me }) => {
  await me.init(data)
})

test('DnD move before', async ({ page, me }) => {
  await page.getByText(m2).hover({ force: true })
  await page.mouse.down()
  const target = await page.getByText(m1)
  const box = (await target.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y - 12)
  await page.waitForTimeout(200) // throttle
  // https://playwright.dev/docs/input#dragging-manually
  // If your page relies on the dragover event being dispatched, you need at least two mouse moves to trigger it in all browsers.
  await page.mouse.move(box.x + box.width / 2, box.y - 12)
  await expect(page.locator('.insert-preview.before')).toBeVisible()
  await page.mouse.up()
  await me.toHaveScreenshot()
})

test('DnD move after', async ({ page, me }) => {
  await page.getByText(m2).hover({ force: true })
  await page.mouse.down()
  const target = await page.getByText(m1)
  const box = (await target.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height + 12)
  await page.waitForTimeout(200) // throttle
  await page.mouse.move(box.x + box.width / 2, box.y + box.height + 12)
  await expect(page.locator('.insert-preview.after')).toBeVisible()
  await page.mouse.up()
  await me.toHaveScreenshot()
})

test('DnD move in', async ({ page, me }) => {
  await page.getByText(m2).hover({ force: true })
  await page.mouse.down()
  const target = await page.getByText(m1)
  const box = (await target.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(200) // throttle
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await expect(page.locator('.insert-preview.in')).toBeVisible()
  await page.mouse.up()
  await me.toHaveScreenshot()
})
