import type { Page } from '@playwright/test'
import { test, expect } from './mind-elixir-test'
import { MindElixirFixture } from './MindElixirFixture'

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
  await page.waitForTimeout(1000)
  await page.mouse.up()
}

test.beforeEach(async ({ me }) => {
  await me.init(data)
})

test('Select Sibling', async ({ page, me }) => {
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

test('Multi-select navigation anchors on the last-selected node', async ({ page, me }) => {
  // SIDE layout alternates main nodes: middle1 lands on the left, middle2 on
  // the right — so child1 and child3 sit on opposite sides.
  await me.click('child3') // give the container keyboard focus
  await page.evaluate(() => {
    const mind = (window as any)['#map']
    const pick = (id: string) => mind.map.querySelector(`[data-nodeid="me${id}"]`)
    mind.selectNodes([pick('child1'), pick('child3')])
  })
  // child3 was selected first, so the currentNodes tail — the anchor — is
  // child1 on the LEFT side. ArrowRight walks toward the root and lands on
  // middle1; anchoring on the head (child3, right side) would be a no-op.
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('.selected')).toHaveText('middle1')
})

test('Sibling boundary crosses into the neighbouring branch', async ({ page }) => {
  // Same-side branches are required for the boundary walk: explicit directions
  // keep m1/m3/m4 on the left so they are DOM siblings inside .lhs.
  const data = {
    nodeData: {
      id: 'root',
      topic: 'root',
      children: [
        {
          id: 'm1',
          topic: 'm1',
          direction: 0,
          children: [{ id: 'c1a', topic: 'c1a' }, { id: 'c1b', topic: 'c1b' }],
        },
        { id: 'm2', topic: 'm2', direction: 1 },
        {
          id: 'm3',
          topic: 'm3',
          direction: 0,
          children: [{ id: 'c3a', topic: 'c3a' }, { id: 'c3b', topic: 'c3b' }],
        },
        { id: 'm4', topic: 'm4', direction: 0 },
      ],
    },
  }
  await page.evaluate(dataStr => {
    const MindElixir = (window as any).MindElixir
    const mind = new MindElixir({
      el: '#map2',
      direction: MindElixir.SIDE,
      keypress: true,
      editable: true,
    })
    mind.init(JSON.parse(dataStr))
    ;(window as any)['#map2'] = mind
  }, JSON.stringify(data))
  const me = new MindElixirFixture(page)
  await me.click('c1b')
  // c1b is m1's last child; the next branch on the left side is m3, entered at
  // its first child.
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.me-tpc.selected')).toHaveText('c3a')
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.me-tpc.selected')).toHaveText('c3b')
  // m3 has no next branch with children — m4 is childless, so it is entered
  // at its own node.
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.me-tpc.selected')).toHaveText('m4')
  // Symmetric: Up from the top of a branch walks into the branch above it,
  // entering at its last child.
  await me.click('c3a')
  await page.keyboard.press('ArrowUp')
  await expect(page.locator('.me-tpc.selected')).toHaveText('c1b')
  // m1 is the first branch on its side — no branch above, so Up stays put.
  await me.click('c1a')
  await page.keyboard.press('ArrowUp')
  await expect(page.locator('.me-tpc.selected')).toHaveText('c1a')
  // A collapsed neighbour branch is entered at the branch node itself.
  await page.evaluate(() => {
    const mind = (window as any)['#map2']
    mind.expandNode(mind.map.querySelector('[data-nodeid="mem3"]'), false)
  })
  await me.click('c1b')
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.selected')).toHaveText('m3')
})

test('Boundary navigation on a lone selection fires no selection events', async ({ page, me }) => {
  // child4 is the last child of the only right-side branch: ArrowDown is a
  // boundary press. A lone node re-selecting itself would fire a pointless
  // unselect/select event pair on every press — it must be a true no-op.
  await me.click('child4')
  await page.evaluate(() => {
    const mind = (window as any)['#map']
    ;(window as any).events = []
    mind.bus.addListener('selectNodes', () => (window as any).events.push('selectNodes'))
    mind.bus.addListener('unselectNodes', () => (window as any).events.push('unselectNodes'))
  })
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.me-tpc.selected')).toHaveText('child4')
  expect(await page.evaluate(() => (window as any).events)).toEqual([])

  // A multi-selection still collapses to the anchor at the boundary.
  await page.evaluate(() => {
    const mind = (window as any)['#map']
    const pick = (id: string) => mind.map.querySelector(`[data-nodeid="me${id}"]`)
    mind.selectNodes([pick('child3'), pick('child4')])
  })
  await page.keyboard.press('ArrowDown')
  await expect(page.locator('.me-tpc.selected')).toHaveText('child4')
  expect(await page.evaluate(() => (window as any).events)).toContain('selectNodes')
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
