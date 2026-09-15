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

test('Silent expandNode from map still syncs the outline', async ({ page }) => {
  const expander = page.locator('.me-tpc[data-nodeid="mebranch1"]').locator('..').locator('.me-epd')
  await expander.click()
  await expect(outlineTopic(page, 'Child 1')).toHaveCount(0)

  await page.evaluate(() => {
    const mind = window['#map']
    mind.expandNode(mind.findEle('branch1'), true, { silent: true })
  })

  await expect(outlineTopic(page, 'Child 1')).toBeVisible()
})

test('Adding child to a collapsed parent auto-expands and syncs outline with single undo', async ({ page }) => {
  const expander = page.locator('.me-tpc[data-nodeid="mebranch1"]').locator('..').locator('.me-epd')
  await expander.click()
  await expect(outlineTopic(page, 'Child 1')).toHaveCount(0)

  await page.evaluate(() => {
    const mind = window['#map']
    mind.addChild(mind.findEle('branch1'), { id: 'newKid', topic: 'New Kid', children: [] })
  })

  await expect(outlineTopic(page, 'New Kid')).toBeVisible()
  await expect(outlineTopic(page, 'Child 1')).toBeVisible()

  await page.locator('#map .me-tpc[data-nodeid="meroot"]').click()
  await page.keyboard.press(`${modifier}+z`)
  await expect(outlineTopic(page, 'New Kid')).toHaveCount(0)
  await expect(outlineTopic(page, 'Child 1')).toHaveCount(0)
})

// A touch screen has no hover: the tap that focuses a topic is what has to bring
// its control cluster up, and the cluster has to survive the markup swap focusing
// performs. Driving it from `:hover` alone made the first tap a one-frame flash —
// the tap set the hover, the swap dropped it again — so the cluster only stuck
// from the second tap on, when the topic was already focused and nothing was
// replaced. Reveal and paint are two separate rules, and they have to move
// together: leaving the background on `:hover` shows the bare glyphs on the first
// tap and only fills them in on the second. The assertions pin both, and pin that
// the reveal stays scoped to the focused item instead of lighting every row up.
test('Focusing an item reveals and paints its controls without hover', async ({ page }) => {
  const inRow = (id: string, sel: string) =>
    page.locator(`#outline .outline-item-wrapper[data-item-id="${id}"] ${sel}`)
  const transparent = 'rgba(0, 0, 0, 0)'

  await page.locator('#outline .outline-item-topic[data-item-id="branch1"]').click()
  // Park the pointer away from the row: the focus stays, the hover does not
  await page.mouse.move(0, 0)

  await expect(inRow('branch1', '.outline-item-btn-group')).toHaveCSS('opacity', '1')
  // The `…` button and the chevron are what the group is made of, and their
  // surface is a separate `:hover` rule — 225, 220, 255 is `--rol-drag-indicator`
  await expect(inRow('branch1', '.outline-item-menu-btn')).not.toHaveCSS('background-color', transparent)
  await expect(inRow('branch1', '.outline-item-collapse-btn')).not.toHaveCSS('background-color', transparent)

  // Untouched rows stay quiet — neither revealed nor painted
  await expect(inRow('root', '.outline-item-btn-group')).toHaveCSS('opacity', '0')
  await expect(inRow('root', '.outline-item-menu-btn')).toHaveCSS('background-color', transparent)
})

// The chevron is a button and has to say so. Its hand cursor used to come from
// Tailwind's preflight in react-outliner — this library ships no preflight, so the
// reset that neutralises the UA button styling has to restore the cursor too.
// `…` sits right next to it and declared its own, which is what made the chevron's
// plain arrow look like an oversight rather than a decision.
test('The collapse chevron shows a clickable cursor', async ({ page }) => {
  const inRow = (id: string, sel: string) =>
    page.locator(`#outline .outline-item-wrapper[data-item-id="${id}"] ${sel}`)
  const chevron = inRow('branch1', '.outline-item-collapse-btn')

  // Only a branch with children is live: `hidden` takes the button out of the hit test
  await expect(chevron).toHaveAttribute('data-state', 'expanded')
  await expect(chevron).toHaveCSS('cursor', 'pointer')

  // The cursor the user sees belongs to the element under the pointer, not to the
  // button in the abstract — hover the row, land on the chevron, read it back.
  await inRow('branch1', '.outline-item-topic').hover()
  const box = (await chevron.boundingBox())!
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y)
  const hit = await page.evaluate(
    ({ x, y }: { x: number; y: number }) => {
      const el = document.elementFromPoint(x, y) as HTMLElement | null
      return el
        ? { cursor: getComputedStyle(el).cursor, onChevron: !!el.closest('.outline-item-collapse-btn') }
        : null
    },
    { x, y },
  )
  expect(hit?.onChevron).toBe(true)
  expect(hit?.cursor).toBe('pointer')

  // The row's other control agrees — the contrast that was missing
  await expect(inRow('branch1', '.outline-item-menu-btn')).toHaveCSS('cursor', 'pointer')
})
