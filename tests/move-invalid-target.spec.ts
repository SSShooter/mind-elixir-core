import { test, expect } from './mind-elixir-test'
import type { Page } from '@playwright/test'

const nestedData = {
  nodeData: {
    topic: 'root',
    id: 'root',
    children: [
      {
        id: 'parent',
        topic: 'parent',
        children: [
          { id: 'a', topic: 'a', expanded: false, children: [{ id: 'a1', topic: 'a1' }] },
          { id: 'b', topic: 'b' },
          { id: 'c', topic: 'c' },
        ],
      },
    ],
  },
}

const callMove = (
  page: Page,
  api: 'moveNodesIn' | 'moveNodesBefore' | 'moveNodesAfter',
  fromId: string,
  toId: string
) =>
  page.evaluate(async ({ api, fromId, toId }) => {
    const mind = (window as any)['#map']
    return mind[api]([mind.findEle(fromId)], mind.findEle(toId))
  }, { api, fromId, toId })

test.describe('public move APIs reject self/descendant targets', () => {
  test.beforeEach(async ({ me }) => {
    await me.init(nestedData)
  })

  test('moveNodesIn with itself as target is a full no-op', async ({ page, me }) => {
    await page.evaluate(() => {
      ;(window as any).ops = []
      ;(window as any)['#map'].bus.addListener('operation', (op: any) => (window as any).ops.push(op.name))
    })
    const before = await me.getData()

    // `false` tells the caller the move was rejected
    expect(await callMove(page, 'moveNodesIn', 'a', 'a')).toBe(false)

    // data unchanged AND no history entry pushed — the operation event used to
    // fire with a corrupted cyclic tree
    expect(await me.getData()).toEqual(before)
    expect(await page.evaluate(() => (window as any).ops)).toEqual([])
    // one undo is still a no-op afterwards (no empty history step was created)
    await page.evaluate(() => (window as any)['#map'].undo())
    expect(await me.getData()).toEqual(before)
  })

  test('moveNodesBefore with itself as target is a full no-op', async ({ page, me }) => {
    const before = await me.getData()

    expect(await callMove(page, 'moveNodesBefore', 'a', 'a')).toBe(false)

    // `splice(-1, 0, from)` used to drop `a` onto the last slot of its
    // siblings, silently demoting `b`
    expect(await me.getData()).toEqual(before)
    const domOrder = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.me-tpc')).map(el => el.textContent)
    )
    expect(domOrder).toEqual(['parent', 'a', 'b', 'c', 'root'])
  })

  test('the guard runs before the destination expand side effect', async ({ page, me }) => {
    const before = await me.getData()

    // `a` starts collapsed; a self move must be rejected BEFORE the expand
    // branch fires, so `a1` never appears in the DOM
    expect(await callMove(page, 'moveNodesIn', 'a', 'a')).toBe(false)

    expect(await me.getData()).toEqual(before)
    const a1Visible = await page.getByText('a1', { exact: true }).isVisible().catch(() => false)
    expect(a1Visible).toBe(false)
  })

  test('a legal move into a sibling still works', async ({ page, me }) => {
    // `true` tells the caller the move executed
    expect(await callMove(page, 'moveNodesIn', 'b', 'a')).toBe(true)

    const data = await me.getData()
    const a = data.nodeData.children[0].children.find((c: any) => c.id === 'a')
    expect(a.children.map((c: any) => c.id)).toEqual(['a1', 'b'])
  })
})
