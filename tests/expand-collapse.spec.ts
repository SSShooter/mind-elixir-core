import { test, expect } from './mind-elixir-test'

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
  const expandButton = page.locator('me-tpc[data-nodeid="mebranch2"]').locator('..').locator('me-epd')
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
  const collapseButton = page.locator('me-tpc[data-nodeid="mebranch1"]').locator('..').locator('me-epd')
  await collapseButton.click()
  
  // Verify child nodes are now not visible
  await expect(page.getByText('Child 1', { exact: true })).not.toBeVisible()
  await expect(page.getByText('Child 2', { exact: true })).not.toBeVisible()
  
  
})

test('Expand all children recursively', async ({ page, me }) => {
  // First collapse Branch 1
  const branch1Button = page.locator('me-tpc[data-nodeid="mebranch1"]').locator('..').locator('me-epd')
  await branch1Button.click()
  
  // Verify all child nodes are not visible
  await expect(page.getByText('Child 1', { exact: true })).not.toBeVisible()
  await expect(page.getByText('Child 2', { exact: true })).not.toBeVisible()
  await expect(page.getByText('Grandchild 1', { exact: true })).not.toBeVisible()
  
  // Ctrl click for recursive expansion
  await page.keyboard.down("Control");
  await branch1Button.click()
  await page.keyboard.up("Control");
  
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
  const branch2Container = page.locator('me-tpc[data-nodeid="mebranch2"]').locator('..').locator('..').locator('me-children')
  await expect(branch2Container.getByText('Child 5', { exact: true })).toBeVisible()
})

test('Auto expand when copying node to collapsed parent', async ({ page, me }) => {
  // Ensure Branch 2 is collapsed
  await expect(page.getByText('Child 3', { exact: true })).not.toBeVisible()
  
  // Select Child 1 and copy
  await me.click('Child 1')
  await page.keyboard.press('Control+c')
  
  // Select collapsed Branch 2
  await me.click('Branch 2')
  
  // Paste
  await page.keyboard.press('Control+v')
  
  // Verify Branch 2 auto-expands and contains copied node
  await expect(page.getByText('Child 3', { exact: true })).toBeVisible()
  await expect(page.getByText('Child 4', { exact: true })).toBeVisible()
  
  // Should have two "Child 1" (original and copied)
  const child1Elements = page.getByText('Child 1', { exact: true })
  await expect(child1Elements).toHaveCount(2)
  
  
})

test('Expand state persistence after layout refresh', async ({ page, me }) => {
  // Expand Branch 2
  const expandButton = page.locator('me-tpc[data-nodeid="mebranch2"]').locator('..').locator('me-epd')
  await expandButton.click()
  await expect(page.getByText('Child 3', { exact: true })).toBeVisible()
  
  // Get current data and reinitialize
  const currentData = await me.getData()
  await me.init(currentData)
  
  // Verify expand state persists
  await expect(page.getByText('Child 3', { exact: true })).toBeVisible()
  await expect(page.getByText('Child 4', { exact: true })).toBeVisible() 
})
