import { test, expect } from './mind-elixir-test'

const id = 'asfihiasfajdad'
const topic = 'topic-fajfaoo'
const data = {
  nodeData: {
    topic,
    id,
    root: true,
    children: [
      {
        id: 'child',
        topic: 'child-topic',
      },
    ],
  },
}

test.beforeEach(async ({ me }) => {
  await me.goto()
  await me.init(data)
})

test('Edit Node', async ({ page, me }) => {
  await me.dblclick(topic)
  expect(await page.locator('#input-box').count()).toEqual(1)
  await page.keyboard.insertText('update node')
  await page.keyboard.press('Enter')
  expect(await page.locator('#input-box').count()).toEqual(0)
  expect(await page.getByText('update node')).toBeTruthy()
  const data = await me.getData()
  expect(data.nodeData.topic).toEqual('update node')
})

test('Clear and reset', async ({ page }) => {
  await page.getByText(topic).dblclick({
    force: true,
  })
  expect(await page.locator('#input-box').count()).toEqual(1)
  await page.keyboard.press('Backspace')
  await page.keyboard.press('Enter')
  expect(await page.locator('#input-box').count()).toEqual(0)
  expect(await page.getByText(topic)).toBeTruthy()
})

test('Remove Node', async ({ page }) => {
  const topic = 'child-topic'
  await page.getByText(topic).click({
    force: true,
  })
  await page.keyboard.press('Delete')
  expect(await page.getByText(topic)).toBeHidden()
})

test('Child Add Sibling', async ({ page }) => {
  const topic = 'child-topic'
  await page.getByText(topic).click({
    force: true,
  })
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  expect(await page.locator('#input-box')).toBeHidden()
  expect(await page.getByText('New Node')).toBeVisible()
})

test('Child Add Child', async ({ page }) => {
  const topic = 'child-topic'
  await page.getByText(topic).click({
    force: true,
  })
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  expect(await page.locator('#input-box')).toBeHidden()
  expect(await page.getByText('New Node')).toBeVisible()
})
