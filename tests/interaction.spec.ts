import { test, expect } from './mind-elixir-test'

const id = 'root-id'
const topic = 'root-topic'
const childTopic = 'child-topic'
const data = {
  nodeData: {
    topic,
    id,
    root: true,
    children: [
      {
        id: 'middle',
        topic: 'middle',
        children: [
          {
            id: 'child',
            topic: childTopic,
          },
        ],
      },
    ],
  },
}

test.beforeEach(async ({ me }) => {
  await me.init(data)
})

test('Edit Node', async ({ page, me }) => {
  await me.dblclick(topic)
  await expect(page.locator('#input-box')).toBeVisible()
  await page.keyboard.insertText('update node')
  await page.keyboard.press('Enter')
  await expect(page.locator('#input-box')).toBeHidden()
  await expect(page.getByText('update node')).toBeVisible()
  await me.toHaveScreenshot()
})

test('Clear and reset', async ({ page, me }) => {
  await me.dblclick(topic)
  await expect(page.locator('#input-box')).toBeVisible()
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Enter')
  await expect(page.locator('#input-box')).toBeHidden()
  await expect(page.getByText(topic)).toBeVisible()
  await me.toHaveScreenshot()
})

test('Remove Node', async ({ page, me }) => {
  await me.click(childTopic)
  await page.keyboard.press('Delete')
  await expect(page.getByText(childTopic)).toBeHidden()
  await me.toHaveScreenshot()
})

test('Add Sibling', async ({ page, me }) => {
  await me.click(childTopic)
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await expect(page.locator('#input-box')).toBeHidden()
  await expect(page.getByText('New Node')).toBeVisible()
  await me.toHaveScreenshot()
})

test('Add Before', async ({ page, me }) => {
  await me.click(childTopic)
  await page.keyboard.press('Shift+Enter')
  await page.keyboard.press('Enter')
  await expect(page.locator('#input-box')).toBeHidden()
  await expect(page.getByText('New Node')).toBeVisible()
  await me.toHaveScreenshot()
})

test('Add Parent', async ({ page, me }) => {
  await me.click(childTopic)
  await page.keyboard.press('Control+Enter')
  await page.keyboard.press('Enter')
  await expect(page.locator('#input-box')).toBeHidden()
  await expect(page.getByText('New Node')).toBeVisible()
  await me.toHaveScreenshot()
})

test('Add Child', async ({ page, me }) => {
  await me.click(childTopic)
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(page.locator('#input-box')).toBeHidden()
  await expect(page.getByText('New Node')).toBeVisible()
  await me.toHaveScreenshot()
})

test('Copy and Paste', async ({ page, me }) => {
  await me.click('middle')
  await page.keyboard.press('Control+C')
  await me.click('child-topic')
  await page.keyboard.press('Control+V')
  await me.toHaveScreenshot()
})
