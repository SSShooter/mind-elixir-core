import { test, expect } from './mind-elixir-test'
import type { Page } from '@playwright/test'

const LEFT = 0 as const
const RIGHT = 1 as const

const sideData = {
  nodeData: {
    topic: 'root',
    id: 'root',
    children: [
      { id: 'l1', topic: 'l1', direction: LEFT },
      { id: 'r1', topic: 'r1', direction: RIGHT },
      { id: 'l2', topic: 'l2', direction: LEFT },
      { id: 'r2', topic: 'r2', direction: RIGHT },
    ],
  },
}

const nestedData = {
  nodeData: {
    topic: 'root',
    id: 'root',
    children: [
      {
        id: 'parent',
        topic: 'parent',
        children: [
          { id: 'a', topic: 'a' },
          { id: 'b', topic: 'b' },
          { id: 'c', topic: 'c' },
        ],
      },
    ],
  },
}

// Topic text order of one side container in the DOM
const domOrder = (page: Page, selector: string) =>
  page.evaluate(sel => Array.from(document.querySelectorAll(`${sel} > .me-wrapper .me-tpc`)).map(el => el.textContent), selector)

// Topic order of root-level children projected to one side, from the data
const dataOrder = (page: Page, direction: number) =>
  page.evaluate(dir => (window as any)['#map'].getData().nodeData.children.filter((c: any) => c.direction === dir).map((c: any) => c.topic), direction)

const callApi = (page: Page, name: 'moveUpNode' | 'moveDownNode') => page.evaluate(api => (window as any)['#map'][api](), name)

test.describe('SIDE layout keeps data and DOM order in sync', () => {
  test.beforeEach(async ({ me }) => {
    await me.init(sideData)
  })

  test('moveUpNode swaps only within the same side', async ({ page, me }) => {
    await me.click('l2')
    await callApi(page, 'moveUpNode')
    // l2 swaps with l1 (its same-side predecessor), not with r1
    expect(await domOrder(page, '.lhs')).toEqual(['l2', 'l1'])
    expect(await domOrder(page, '.rhs')).toEqual(['r1', 'r2'])
    expect(await dataOrder(page, LEFT)).toEqual(['l2', 'l1'])
    expect(await dataOrder(page, RIGHT)).toEqual(['r1', 'r2'])
  })

  test('moveDownNode swaps only within the same side', async ({ page, me }) => {
    await me.click('r1')
    await callApi(page, 'moveDownNode')
    // r1 swaps with r2 (its same-side successor), not with l2
    expect(await domOrder(page, '.rhs')).toEqual(['r2', 'r1'])
    expect(await domOrder(page, '.lhs')).toEqual(['l1', 'l2'])
    expect(await dataOrder(page, RIGHT)).toEqual(['r2', 'r1'])
    expect(await dataOrder(page, LEFT)).toEqual(['l1', 'l2'])
  })

  test('moveUpNode on the first same-side sibling is a no-op', async ({ page, me }) => {
    await me.click('l1')
    await callApi(page, 'moveUpNode')
    expect(await domOrder(page, '.lhs')).toEqual(['l1', 'l2'])
    expect(await domOrder(page, '.rhs')).toEqual(['r1', 'r2'])
    expect(await dataOrder(page, LEFT)).toEqual(['l1', 'l2'])
    expect(await dataOrder(page, RIGHT)).toEqual(['r1', 'r2'])
  })

  test('moveDownNode on the last same-side sibling is a no-op', async ({ page, me }) => {
    await me.click('r2')
    await callApi(page, 'moveDownNode')
    expect(await domOrder(page, '.rhs')).toEqual(['r1', 'r2'])
    expect(await domOrder(page, '.lhs')).toEqual(['l1', 'l2'])
    expect(await dataOrder(page, RIGHT)).toEqual(['r1', 'r2'])
    expect(await dataOrder(page, LEFT)).toEqual(['l1', 'l2'])
  })
})

test.describe('regular sibling reordering', () => {
  test.beforeEach(async ({ me }) => {
    await me.init(nestedData)
  })

  test('moveUpNode/moveDownNode swap adjacent siblings', async ({ page, me }) => {
    await me.click('b')
    await callApi(page, 'moveUpNode')
    let order = await page.evaluate(() => (window as any)['#map'].getData().nodeData.children[0].children.map((c: any) => c.topic))
    expect(order).toEqual(['b', 'a', 'c'])
    await callApi(page, 'moveDownNode')
    order = await page.evaluate(() => (window as any)['#map'].getData().nodeData.children[0].children.map((c: any) => c.topic))
    expect(order).toEqual(['a', 'b', 'c'])
  })

  test('moveUpNode on the first sibling is a no-op', async ({ page, me }) => {
    await me.click('a')
    await callApi(page, 'moveUpNode')
    const order = await page.evaluate(() => (window as any)['#map'].getData().nodeData.children[0].children.map((c: any) => c.topic))
    expect(order).toEqual(['a', 'b', 'c'])
  })

  test('moveDownNode on the last sibling is a no-op', async ({ page, me }) => {
    await me.click('c')
    await callApi(page, 'moveDownNode')
    const order = await page.evaluate(() => (window as any)['#map'].getData().nodeData.children[0].children.map((c: any) => c.topic))
    expect(order).toEqual(['a', 'b', 'c'])
  })

  test('moveUpNode/moveDownNode are no-ops on the root node', async ({ page, me }) => {
    const before = await me.getData()
    await me.click('root')
    await callApi(page, 'moveUpNode')
    await callApi(page, 'moveDownNode')
    expect(await me.getData()).toEqual(before)
  })
})
