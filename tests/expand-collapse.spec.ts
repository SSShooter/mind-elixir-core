import type { Page } from '@playwright/test'
import { test, expect } from './mind-elixir-test'

const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'

/**
 * Undo depth: how many entries are applied (the stack keeps undone entries
 * around for redo, so `getEntries().length` would not drop after an undo).
 */
const historySize = (page: Page) =>
  page.evaluate(() => (window as any)['#map'].historyStack.currentIndex)

/** The fold toggle next to a topic (`data-nodeid` carries the `me` element prefix). */
const expanderOf = (page: Page, id: string) =>
  page.locator(`.me-tpc[data-nodeid="me${id}"]`).locator('..').locator('.me-epd')

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
          {
            id: 'child1',
            topic: 'Child 1',
          },
          {
            id: 'child2',
            topic: 'Child 2',
            children: [
              {
                id: 'grandchild1',
                topic: 'Grandchild 1',
              },
              {
                id: 'grandchild2',
                topic: 'Grandchild 2',
              },
            ],
          },
        ],
      },
      {
        id: 'branch2',
        topic: 'Branch 2',
        expanded: false, // Initially collapsed
        children: [
          {
            id: 'child3',
            topic: 'Child 3',
          },
          {
            id: 'child4',
            topic: 'Child 4',
          },
        ],
      },
      {
        id: 'branch3',
        topic: 'Branch 3',
        children: [
          {
            id: 'child5',
            topic: 'Child 5',
          },
        ],
      },
    ],
  },
}

test.beforeEach(async ({ me }) => {
  await me.init(data)
})

test('Expand collapsed node', async ({ page, me }) => {
  // Verify initial state: Branch 2 is collapsed
  const branch2 = page.getByText('Branch 2', { exact: true })
  await expect(branch2).toBeVisible()

  // Child nodes should not be visible
  await expect(page.getByText('Child 3', { exact: true })).not.toBeVisible()
  await expect(page.getByText('Child 4', { exact: true })).not.toBeVisible()

  // Click expand button
  const expandButton = page.locator('.me-tpc[data-nodeid="mebranch2"]').locator('..').locator('.me-epd')
  await expandButton.click()

  // Verify child nodes are now visible
  await expect(page.getByText('Child 3', { exact: true })).toBeVisible()
  await expect(page.getByText('Child 4', { exact: true })).toBeVisible()
})

test('Collapse expanded node', async ({ page, me }) => {
  // Branch 1 is initially expanded
  await expect(page.getByText('Child 1', { exact: true })).toBeVisible()
  await expect(page.getByText('Child 2', { exact: true })).toBeVisible()

  // Click collapse button
  const collapseButton = page.locator('.me-tpc[data-nodeid="mebranch1"]').locator('..').locator('.me-epd')
  await collapseButton.click()

  // Verify child nodes are now not visible
  await expect(page.getByText('Child 1', { exact: true })).not.toBeVisible()
  await expect(page.getByText('Child 2', { exact: true })).not.toBeVisible()
})

test('Expand all children recursively', async ({ page, me }) => {
  // First collapse Branch 1
  const branch1Button = page.locator('.me-tpc[data-nodeid="mebranch1"]').locator('..').locator('.me-epd')
  await branch1Button.click()

  // Verify all child nodes are not visible
  await expect(page.getByText('Child 1', { exact: true })).not.toBeVisible()
  await expect(page.getByText('Child 2', { exact: true })).not.toBeVisible()
  await expect(page.getByText('Grandchild 1', { exact: true })).not.toBeVisible()

  // Ctrl click for recursive expansion
  await page.keyboard.down(modifier)
  await branch1Button.click()
  await page.keyboard.up(modifier)

  // Verify all levels of child nodes are visible
  await expect(page.getByText('Child 1', { exact: true })).toBeVisible()
  await expect(page.getByText('Child 2', { exact: true })).toBeVisible()
  await expect(page.getByText('Grandchild 1', { exact: true })).toBeVisible()
  await expect(page.getByText('Grandchild 2', { exact: true })).toBeVisible()
})

test('Auto expand when moving node to collapsed parent', async ({ page, me }) => {
  // First ensure Branch 2 is collapsed
  const branch2 = page.getByText('Branch 2', { exact: true })
  await expect(page.getByText('Child 3', { exact: true })).not.toBeVisible()

  // Select Child 5 for moving
  const child5 = page.getByText('Child 5', { exact: true })
  await child5.hover({ force: true })
  await page.mouse.down()

  // Drag to collapsed Branch 2
  await me.dragOver('Branch 2', 'in')
  await expect(page.locator('.insert-preview.in')).toBeVisible()

  // Release mouse to complete move
  await page.mouse.up()

  // Verify Branch 2 auto-expands and Child 5 is now in it
  await expect(page.getByText('Child 3', { exact: true })).toBeVisible()
  await expect(page.getByText('Child 4', { exact: true })).toBeVisible()
  await expect(page.getByText('Child 5', { exact: true })).toBeVisible()

  // Verify Child 5 actually moved under Branch 2
  const branch2Container = page.locator('.me-tpc[data-nodeid="mebranch2"]').locator('..').locator('..').locator('.me-children')
  await expect(branch2Container.getByText('Child 5', { exact: true })).toBeVisible()
})

test('Auto expand when copying node to collapsed parent', async ({ page, me }) => {
  // Ensure Branch 2 is collapsed
  await expect(page.getByText('Child 3', { exact: true })).not.toBeVisible()

  // Select Child 1 and copy
  await me.click('Child 1')
  await page.keyboard.press(`${modifier}+c`)

  // Select collapsed Branch 2
  await me.click('Branch 2')

  // Paste
  await page.keyboard.press(`${modifier}+v`)

  // Verify Branch 2 auto-expands and contains copied node
  await expect(page.getByText('Child 3', { exact: true })).toBeVisible()
  await expect(page.getByText('Child 4', { exact: true })).toBeVisible()

  // Should have two "Child 1" (original and copied)
  const child1Elements = page.getByText('Child 1', { exact: true })
  await expect(child1Elements).toHaveCount(2)
})

test('Expand state persistence after layout refresh', async ({ page, me }) => {
  // Expand Branch 2
  const expandButton = page.locator('.me-tpc[data-nodeid="mebranch2"]').locator('..').locator('.me-epd')
  await expandButton.click()
  await expect(page.getByText('Child 3', { exact: true })).toBeVisible()

  // Get current data and reinitialize
  const currentData = await me.getData()
  await me.init(currentData)

  // Verify expand state persists
  await expect(page.getByText('Child 3', { exact: true })).toBeVisible()
  await expect(page.getByText('Child 4', { exact: true })).toBeVisible()
})

// #region fold on the undo timeline

test('Collapse is undoable', async ({ page }) => {
  const before = await historySize(page)
  await expanderOf(page, 'branch1').click()
  await expect(page.getByText('Child 1', { exact: true })).not.toBeVisible()
  expect(await historySize(page)).toBe(before + 1)

  await page.keyboard.press(`${modifier}+z`)
  await expect(page.getByText('Child 1', { exact: true })).toBeVisible()
  await expect(page.getByText('Child 2', { exact: true })).toBeVisible()
  expect(await historySize(page)).toBe(before)
})

test('Expand is undoable and redoable', async ({ page }) => {
  await expanderOf(page, 'branch2').click()
  await expect(page.getByText('Child 3', { exact: true })).toBeVisible()

  await page.keyboard.press(`${modifier}+z`)
  await expect(page.getByText('Child 3', { exact: true })).not.toBeVisible()

  await page.keyboard.press(`${modifier}+y`)
  await expect(page.getByText('Child 3', { exact: true })).toBeVisible()
})

test('Recursive expand is ONE entry and undoes in one step', async ({ page }) => {
  const branch1 = expanderOf(page, 'branch1')
  await branch1.click()
  await expect(page.getByText('Grandchild 1', { exact: true })).not.toBeVisible()
  const afterCollapse = await historySize(page)

  await page.keyboard.down(modifier)
  await branch1.click()
  await page.keyboard.up(modifier)
  await expect(page.getByText('Grandchild 1', { exact: true })).toBeVisible()
  expect(await historySize(page)).toBe(afterCollapse + 1)

  await page.keyboard.press(`${modifier}+z`)
  await expect(page.getByText('Grandchild 1', { exact: true })).not.toBeVisible()
})

test('Folding a childless node records nothing', async ({ page }) => {
  const before = await historySize(page)
  // Leaves render no expander button, so go through the API instead.
  await page.evaluate(() => {
    const mind = (window as any)['#map']
    mind.expandNode(mind.findEle('child5'), false)
    mind.expandNodeAll(mind.findEle('child5'))
  })
  expect(await historySize(page)).toBe(before)
})

test('Moving into a collapsed parent folds it back with ONE undo', async ({ page, me }) => {
  const before = await historySize(page)
  await page.getByText('Child 5', { exact: true }).hover({ force: true })
  await page.mouse.down()
  await me.dragOver('Branch 2', 'in')
  await page.mouse.up()

  // The destination auto-expands, but the move owns the only history entry
  await expect(page.getByText('Child 3', { exact: true })).toBeVisible()
  expect(await historySize(page)).toBe(before + 1)

  await page.keyboard.press(`${modifier}+z`)
  await expect(page.getByText('Child 3', { exact: true })).not.toBeVisible()
  const branch3Children = page.locator('.me-tpc[data-nodeid="mebranch3"]').locator('..').locator('..').locator('.me-children')
  await expect(branch3Children.getByText('Child 5', { exact: true })).toBeVisible()
})

test('expandNode fires operation event with silent flag and does not grow history when silent', async ({ page }) => {
  const operations: any[] = []
  await page.exposeFunction('logOp', (op: any) => operations.push(op))

  await page.evaluate(() => {
    const mind = (window as any)['#map']
    mind.bus.addListener('operation', (op: any) => {
      ;(window as any).logOp({ name: op.name, id: op.target?.id, silent: op.silent, recursive: op.recursive })
    })
  })

  const before = await historySize(page)

  // Expand with silent: true
  await page.evaluate(() => {
    const mind = (window as any)['#map']
    mind.expandNode(mind.findEle('branch2'), true, { silent: true })
  })

  // History size must NOT increase
  expect(await historySize(page)).toBe(before)
  expect(operations).toEqual([
    { name: 'expandNode', id: 'branch2', silent: true, recursive: undefined },
  ])

  // Normal collapse without silent
  await page.evaluate(() => {
    const mind = (window as any)['#map']
    mind.expandNode(mind.findEle('branch2'), false)
  })

  expect(await historySize(page)).toBe(before + 1)
  expect(operations.length).toBe(2)
  expect(operations[1]).toEqual({ name: 'collapseNode', id: 'branch2', silent: undefined, recursive: undefined })
})

// #endregion fold on the undo timeline
