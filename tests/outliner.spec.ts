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
