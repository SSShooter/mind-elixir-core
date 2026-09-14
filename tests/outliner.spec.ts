import { test, expect } from './mind-elixir-test'

const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'

const data = {
  nodeData: {
    topic: 'root',
    id: 'root',
    children: [
      {
        id: 'branch1',
        topic: 'Branch 1',
        expanded: true,
        children: [
          { id: 'child1', topic: 'Child 1' },
          {
            id: 'child2',
            topic: 'Child 2',
            children: [
              { id: 'grandchild1', topic: 'Grandchild 1' },
              { id: 'grandchild2', topic: 'Grandchild 2' },
            ],
          },
        ],
      },
    ],
  },
}

const outlineTopic = (page: any, text: string) => page.locator('#outline .outline-item-topic', { hasText: new RegExp(`^${text}$`) })
const mapTopic = (page: any, text: string) => page.locator('#map').getByText(text, { exact: true })

test.beforeEach(async ({ me }) => {
  await me.initBoundOutliner(data)
})

test('Map collapse mirrors into the outliner', async ({ page }) => {
  // Expanded: the outline shows the whole subtree
  await expect(outlineTopic(page, 'Branch 1')).toBeVisible()
  await expect(outlineTopic(page, 'Child 1')).toBeVisible()
  await expect(outlineTopic(page, 'Child 2')).toBeVisible()

  // Collapse Branch 1 from the MAP
  await page.locator('.me-tpc[data-nodeid="mebranch1"]').locator('..').locator('.me-epd').click()

  // The outline must react: children gone, branch itself still there
  await expect(outlineTopic(page, 'Child 1')).toHaveCount(0)
  await expect(outlineTopic(page, 'Child 2')).toHaveCount(0)
  await expect(outlineTopic(page, 'Branch 1')).toBeVisible()
})

test('Map expand mirrors into the outliner', async ({ page, me }) => {
  // Collapse then expand from the map, checking both directions
  const expander = page.locator('.me-tpc[data-nodeid="mebranch1"]').locator('..').locator('.me-epd')
  await expander.click()
  await expect(outlineTopic(page, 'Child 1')).toHaveCount(0)

  await expander.click()
  await expect(outlineTopic(page, 'Child 1')).toBeVisible()
  await expect(outlineTopic(page, 'Child 2')).toBeVisible()
})

test('Outliner collapse button mirrors into the map', async ({ page }) => {
  const branchRow = page
    .locator('#outline .outline-item-wrapper')
    .filter({ hasText: 'Branch 1' })
    .first()
  await branchRow.locator('.outline-item-collapse-btn').click()

  // Outline hides the subtree; the map mirrors it
  await expect(outlineTopic(page, 'Child 1')).toHaveCount(0)
  await expect(page.getByText('Child 1', { exact: true })).not.toBeVisible()
})

test('Map collapse is undoable and the outline follows', async ({ page }) => {
  const expander = page.locator('.me-tpc[data-nodeid="mebranch1"]').locator('..').locator('.me-epd')
  await expander.click()
  await expect(outlineTopic(page, 'Child 1')).toHaveCount(0)

  await page.keyboard.press(`${modifier}+z`)
  await expect(outlineTopic(page, 'Child 1')).toBeVisible()
  await expect(mapTopic(page, 'Child 1')).toBeVisible()
})

test('Two map operations in one synchronous block both reach the outline', async ({ page }) => {
  // Both `addChild` calls run inside ONE evaluate(), i.e. one synchronous block,
  // so both hit the outliner's sync-request path before any microtask can run.
  // Coalescing those requests must not DROP the second one: nothing else
  // triggers a sync, so a dropped request leaves the outline permanently stale.
  await page.evaluate(() => {
    const mind = window['#map']
    const branch = mind.findEle('branch1')
    mind.addChild(branch, { id: 'blockA', topic: 'Block A', children: [] })
    mind.addChild(branch, { id: 'blockB', topic: 'Block B', children: [] })
  })

  await expect(outlineTopic(page, 'Block A')).toBeVisible()
  await expect(outlineTopic(page, 'Block B')).toBeVisible()
})

test('A node added and then removed in one block leaves no orphan in the outline', async ({ page }) => {
  await page.evaluate(() => {
    const mind = window['#map']
    const branch = mind.findEle('branch1')
    mind.addChild(branch, { id: 'transient', topic: 'Transient', children: [] })
    const added = mind.findEle('transient')
    if (added) mind.removeNodes([added])
  })

  await expect(outlineTopic(page, 'Transient')).toHaveCount(0)
  await expect(outlineTopic(page, 'Child 1')).toBeVisible()
})

test('Outliner collapse is undoable and the map follows', async ({ page }) => {
  const branchRow = page
    .locator('#outline .outline-item-wrapper')
    .filter({ hasText: 'Branch 1' })
    .first()
  await branchRow.locator('.outline-item-collapse-btn').click()
  await expect(mapTopic(page, 'Child 1')).not.toBeVisible()

  await page.keyboard.press(`${modifier}+z`)
  await expect(mapTopic(page, 'Child 1')).toBeVisible()
  await expect(outlineTopic(page, 'Child 1')).toBeVisible()
})

test('Ctrl+Z with the focus in the map steps the journal back exactly once', async ({ page }) => {
  // TWO recorded operations, then ONE keystroke. The map binds Ctrl+Z on its own
  // container; the outliner used to take the same key at document level without
  // asking who it belonged to, so a single press undid both entries.
  for (const id of ['once', 'twice']) {
    await page.evaluate(id => {
      const mind = window['#map']
      mind.addChild(mind.findEle('branch1'), { id, topic: id, children: [] })
    }, id)
  }
  await expect(outlineTopic(page, 'twice')).toBeVisible()

  await page.locator('#map .me-tpc[data-nodeid="meroot"]').click()
  await page.keyboard.press(`${modifier}+z`)

  await expect(outlineTopic(page, 'twice')).toHaveCount(0)
  await expect(outlineTopic(page, 'once')).toBeVisible()
})

// The three tests below cover the tree reads the outline does through the map's
// own data — `parent` back-references for the sibling/parent lookups, the
// upwards walk behind the breadcrumb — which the fold tests above never touch.

test('Indenting an item from its menu re-parents it on the map', async ({ page }) => {
  const row = page
    .locator('#outline .outline-item-wrapper')
    .filter({ hasText: 'Child 2' })
    .first()
  await row.locator('.outline-item-menu-btn').click()
  await page.locator('#outline .outline-item-menu-item[data-action="indent"]').click()

  // The map is the document: assert on ITS data, not on the outline's rendering
  const tree = await page.evaluate(() => {
    const branch = window['#map'].getData().nodeData.children[0]
    return {
      branchChildren: branch.children.map((c: any) => c.topic),
      child1Children: branch.children[0].children.map((c: any) => c.topic),
    }
  })
  expect(tree.branchChildren).toEqual(['Child 1'])
  expect(tree.child1Children).toEqual(['Child 2'])
  await expect(outlineTopic(page, 'Child 2')).toBeVisible()
})

test('Zooming into an item builds the root-to-node breadcrumb', async ({ page }) => {
  const row = page
    .locator('#outline .outline-item-wrapper')
    .filter({ hasText: 'Child 2' })
    .first()
  await row.locator('.outline-item-dot').click()

  const crumb = page.locator('#outline .outliner-breadcrumb')
  await expect(crumb.locator('.breadcrumb-item')).toHaveText(['outline', 'root', 'Branch 1', 'Child 2'])
  // The zoomed view renders Child 2's OWN children as the top level
  await expect(outlineTopic(page, 'Grandchild 1')).toBeVisible()
  await expect(outlineTopic(page, 'Branch 1')).toHaveCount(0)
})

test('Backspace removes a node whose topic was emptied, and never the root', async ({ page }) => {
  // Addressed by id, not by text: the topics below are emptied on purpose, so a
  // text filter would stop matching the very element under test.
  const root = page.locator('#outline .outline-item-topic[data-item-id="root"]')
  // The empty topic IS the document root: there is no parent to remove it from,
  // so the second Backspace must be a no-op rather than delete the document
  await root.click()
  await page.keyboard.press(`${modifier}+a`)
  await page.keyboard.press('Backspace')
  await expect(root).toHaveText('')
  await page.keyboard.press('Backspace')
  await expect(root).toHaveCount(1)

  const child = page.locator('#outline .outline-item-topic[data-item-id="child1"]')
  await child.click()
  await page.keyboard.press(`${modifier}+a`)
  await page.keyboard.press('Backspace')
  await expect(child).toHaveText('')
  await page.keyboard.press('Backspace')
  await expect(child).toHaveCount(0)

  const nodeData = await page.evaluate(() => window['#map'].getData().nodeData)
  expect(nodeData.id).toBe('root')
  expect(nodeData.children[0].children.map((c: any) => c.topic)).toEqual(['Child 2'])
})
