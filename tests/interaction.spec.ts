import { test, expect } from '@playwright/test'
import type { MindElixirCtor, MindElixirInstance, Options } from '../src'
import type MindElixir from '../src'
interface Window {
  m: MindElixirInstance
  MindElixir: MindElixirCtor
  E: typeof MindElixir.E
}
declare let window: Window

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

test.beforeEach(async ({ page }) => {
  await page.goto('http://localhost:23333/test.html')
  await page.evaluate(data => {
    const MindElixir = window.MindElixir
    const options: Options = {
      el: '#map',
      direction: MindElixir.SIDE,
    }
    const mind = new MindElixir(options)
    mind.init(JSON.parse(JSON.stringify(data)))
    window.m = mind
  }, data)
})

test('Edit Node', async ({ page }) => {
  await page.getByText(topic).dblclick({
    force: true,
  })
  expect(await page.locator('#input-box').count()).toEqual(1)
  await page.keyboard.insertText('update node')
  await page.keyboard.press('Enter')
  expect(await page.locator('#input-box').count()).toEqual(0)
  expect(await page.getByText('update node')).toBeTruthy()
  const data = await page.evaluate(() => {
    return window.m.getData()
  })
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
