import { test, expect } from './mind-elixir-test'

const data = {
  nodeData: {
    topic: 'Root Topic',
    id: 'root',
    children: [
      {
        id: 'left-main',
        topic: 'Left Main',
        children: [
          {
            id: 'left-child-1',
            topic: 'Left Child 1',
          },
          {
            id: 'left-child-2',
            topic: 'Left Child 2',
          },
          {
            id: 'left-child-3',
            topic: 'Left Child 3',
          },
        ],
      },
      {
        id: 'right-main',
        topic: 'Right Main',
        children: [
          {
            id: 'right-child-1',
            topic: 'Right Child 1',
          },
          {
            id: 'right-child-2',
            topic: 'Right Child 2',
          },
        ],
      },
    ],
  },
}

test.beforeEach(async ({ me }) => {
  await me.init(data)
})

test('Create summary for single node', async ({ page, me }) => {
  // Select a single child node
  await me.click('Left Child 1')

  // Get position of the selected node
  const leftChild1 = page.getByText('Left Child 1', { exact: true })
  const nodeBox = await leftChild1.boundingBox()

  // Right click to open context menu
  await leftChild1.click({ button: 'right', force: true })

  // Click summary option in context menu
  await page.locator('#cm-summary').click()

  // Verify summary SVG group appears
  await expect(page.locator('svg g[id^="s-"]')).toBeVisible()

  // Verify summary text label is visible
  await expect(page.locator('.svg-label[data-type="summary"]').first()).toBeVisible()
  await expect(page.locator('.svg-label[data-type="summary"]').first()).toHaveText('summary')

  // Verify summary path (bracket shape) is visible
  await expect(page.locator('svg g[id^="s-"] path')).toBeVisible()

  // Verify summary is positioned near the selected node
  const summaryPath = page.locator('svg g[id^="s-"] path')
  const summaryBox = await summaryPath.boundingBox()

  // Summary should be vertically aligned with the selected node (with some tolerance)
  expect(Math.abs(summaryBox!.y - nodeBox!.y)).toBeLessThan(50)
})

test('Create summary for multiple nodes', async ({ page, me }) => {
  // Use drag selection to select multiple child nodes
  await me.dragSelect('Left Child 1', 'Left Child 3')

  // Get positions of the selected nodes before creating summary
  const leftChild1 = page.getByText('Left Child 1', { exact: true })
  const leftChild2 = page.getByText('Left Child 2', { exact: true })
  const leftChild3 = page.getByText('Left Child 3', { exact: true })

  const node1Box = await leftChild1.boundingBox()
  const node2Box = await leftChild2.boundingBox()
  const node3Box = await leftChild3.boundingBox()

  // Right click to open context menu on one of the selected nodes
  await leftChild1.click({ button: 'right', force: true })

  // Click summary option in context menu
  await page.locator('#cm-summary').click()

  // Verify summary appears
  await expect(page.locator('svg g[id^="s-"]')).toBeVisible()
  await expect(page.locator('.svg-label[data-type="summary"]').first()).toHaveText('summary')
  await expect(page.locator('svg g[id^="s-"] path')).toBeVisible()

  // Verify summary bracket spans across all three selected nodes
  const summaryPath = page.locator('svg g[id^="s-"] path')
  const summaryBox = await summaryPath.boundingBox()

  // Summary should span from the top of the first node to the bottom of the last node
  const topMostNode = Math.min(node1Box!.y, node2Box!.y, node3Box!.y)
  const bottomMostNode = Math.max(node1Box!.y + node1Box!.height, node2Box!.y + node2Box!.height, node3Box!.y + node3Box!.height)

  // Summary bracket should cover the vertical range of all selected nodes
  // Allow some tolerance for padding and bracket styling
  expect(summaryBox!.y).toBeLessThanOrEqual(topMostNode + 10)
  expect(summaryBox!.y + summaryBox!.height).toBeGreaterThanOrEqual(bottomMostNode - 10)
})

test('Select and highlight summary', async ({ page, me }) => {
  // Create a summary first
  await me.click('Left Child 1')
  await page.getByText('Left Child 1', { exact: true }).click({ button: 'right', force: true })
  await page.locator('#cm-summary').click()

  // Wait for edit mode to finish (press Enter to complete editing)
  await page.keyboard.press('Enter')
  await expect(page.locator('#input-box')).toBeHidden()

  // Click on the summary to select it
  await page.locator('svg g[id^="s-"]').click()

  // Verify selection state (label should have selected class)
  await expect(page.locator('.svg-label[data-type="summary"].selected').first()).toBeVisible()
})

test('Edit summary text', async ({ page, me }) => {
  // Create a summary first
  await me.click('Left Child 1')
  await page.getByText('Left Child 1', { exact: true }).click({ button: 'right', force: true })
  await page.locator('#cm-summary').click()

  // Summary creation automatically enters edit mode, so input box should already be visible
  await expect(page.locator('#input-box')).toBeVisible()

  // Clear existing text and type new text
  await page.keyboard.press('Control+a')
  await page.keyboard.insertText('Custom Summary')
  await page.keyboard.press('Enter')

  // Verify input box disappears
  await expect(page.locator('#input-box')).toBeHidden()

  // Verify new text is displayed
  await expect(page.locator('.svg-label[data-type="summary"]').first()).toHaveText('Custom Summary')

  // Test editing existing summary by double clicking
  await page.locator('.svg-label[data-type="summary"]').first().dblclick()

  // Input box should appear again
  await expect(page.locator('#input-box')).toBeVisible()

  // Change text again
  await page.keyboard.press('Control+a')
  await page.keyboard.insertText('Updated Summary')
  await page.keyboard.press('Enter')

  // Verify updated text
  await expect(page.locator('.svg-label[data-type="summary"]').first()).toHaveText('Updated Summary')
})

test('Remove summary', async ({ page, me }) => {
  // Create a summary first
  await me.click('Left Child 1')
  await page.getByText('Left Child 1', { exact: true }).click({ button: 'right', force: true })
  await page.locator('#cm-summary').click()

  // Wait for edit mode to finish (press Enter to complete editing)
  await page.keyboard.press('Enter')
  await expect(page.locator('#input-box')).toBeHidden()

  // Verify summary exists
  await expect(page.locator('svg g[id^="s-"]')).toBeVisible()

  // Select and delete summary
  await page.locator('svg g[id^="s-"]').click()
  await page.keyboard.press('Delete')

  // Verify summary is removed
  await expect(page.locator('svg g[id^="s-"]')).not.toBeVisible()
})

test('Cannot create summary on root node', async ({ page, me }) => {
  // Try to select root node
  await me.click('Root Topic')

  // Try to create summary via right click menu
  await page.getByText('Root Topic', { exact: true }).click({ button: 'right', force: true })

  // Verify summary option is not available or doesn't work for root
  // (The context menu might not show summary option for root, or it might be disabled)
  const summaryOption = page.locator('#cm-summary')
  if (await summaryOption.isVisible()) {
    await summaryOption.click()
  }

  // Verify no summary is created
  await expect(page.locator('svg g[id^="s-"]')).not.toBeVisible()
})

test('Summary appears on correct side for left branch', async ({ page, me }) => {
  // Select node on left side
  await me.click('Left Child 1')
  await page.getByText('Left Child 1', { exact: true }).click({ button: 'right', force: true })
  await page.locator('#cm-summary').click()

  // Get the summary group
  const summaryGroup = page.locator('svg g[id^="s-"]')
  await expect(summaryGroup).toBeVisible()

  // Verify text is positioned correctly for left side (anchor: end)
  const summaryText = page.locator('.svg-label[data-type="summary"]').first()
  await expect(summaryText).toHaveAttribute('data-anchor', 'end')
})

test('Summary appears on correct side for right branch', async ({ page, me }) => {
  // Select node on right side
  await me.click('Right Child 1')
  await page.getByText('Right Child 1', { exact: true }).click({ button: 'right', force: true })
  await page.locator('#cm-summary').click()

  // Get the summary group
  const summaryGroup = page.locator('svg g[id^="s-"]')
  await expect(summaryGroup).toBeVisible()

  // Verify text is positioned correctly for right side (anchor: start)
  const summaryText = page.locator('.svg-label[data-type="summary"]').first()
  await expect(summaryText).toHaveAttribute('data-anchor', 'start')
})

test('Multiple summaries can coexist', async ({ page, me }) => {
  // Create first summary
  await me.click('Left Child 1')
  await page.getByText('Left Child 1', { exact: true }).click({ button: 'right', force: true })
  await page.locator('#cm-summary').click()
  await page.keyboard.press('Enter') // Finish editing first summary
  await expect(page.locator('#input-box')).toBeHidden()

  // Create second summary
  await me.click('Right Child 1')
  await page.getByText('Right Child 1', { exact: true }).click({ button: 'right', force: true })
  await page.locator('#cm-summary').click()
  await page.keyboard.press('Enter') // Finish editing second summary
  await expect(page.locator('#input-box')).toBeHidden()

  // Verify both summaries exist
  const summaryGroups = page.locator('svg g[id^="s-"]')
  await expect(summaryGroups).toHaveCount(2)

  // Verify both have text elements
  await expect(page.locator('.svg-label[data-type="summary"]')).toHaveCount(2)
})

test('Summary covers exact range of selected nodes', async ({ page, me }) => {
  // Use drag selection to select all three child nodes
  await me.dragSelect('Left Child 1', 'Left Child 3')

  // Create summary
  await page.getByText('Left Child 1', { exact: true }).click({ button: 'right', force: true })
  await page.locator('#cm-summary').click()

  // Finish editing
  await page.keyboard.press('Enter')
  await expect(page.locator('#input-box')).toBeHidden()

  // Get positions of all child nodes
  const child1Box = await page.getByText('Left Child 1', { exact: true }).boundingBox()
  const child2Box = await page.getByText('Left Child 2', { exact: true }).boundingBox()
  const child3Box = await page.getByText('Left Child 3', { exact: true }).boundingBox()

  // Get summary bracket position
  const summaryBox = await page.locator('svg g[id^="s-"] path').boundingBox()

  // Summary should span from Child 1 to Child 3 (including Child 2 in between)
  // This verifies that the summary covers the range correctly
  const topNode = Math.min(child1Box!.y, child2Box!.y, child3Box!.y)
  const bottomNode = Math.max(child1Box!.y + child1Box!.height, child2Box!.y + child2Box!.height, child3Box!.y + child3Box!.height)

  // Summary bracket should cover the range including all selected nodes
  expect(summaryBox!.y).toBeLessThanOrEqual(topNode + 10)
  expect(summaryBox!.y + summaryBox!.height).toBeGreaterThanOrEqual(bottomNode - 10)

  // Verify that all three children are within the summary range
  expect(summaryBox!.y).toBeLessThanOrEqual(child1Box!.y + 10)
  expect(summaryBox!.y).toBeLessThanOrEqual(child2Box!.y + 10)
  expect(summaryBox!.y).toBeLessThanOrEqual(child3Box!.y + 10)
  expect(summaryBox!.y + summaryBox!.height).toBeGreaterThanOrEqual(child1Box!.y + child1Box!.height - 10)
  expect(summaryBox!.y + summaryBox!.height).toBeGreaterThanOrEqual(child2Box!.y + child2Box!.height - 10)
  expect(summaryBox!.y + summaryBox!.height).toBeGreaterThanOrEqual(child3Box!.y + child3Box!.height - 10)
})

test('Summary selection state management', async ({ page, me }) => {
  // Create two summaries
  await me.click('Left Child 1')
  await page.getByText('Left Child 1', { exact: true }).click({ button: 'right', force: true })
  await page.locator('#cm-summary').click()
  await page.keyboard.press('Enter') // Finish editing first summary

  await me.click('Right Child 1')
  await page.getByText('Right Child 1', { exact: true }).click({ button: 'right', force: true })
  await page.locator('#cm-summary').click()
  await page.keyboard.press('Enter') // Finish editing second summary

  const summaryGroups = page.locator('svg g[id^="s-"]')
  const firstSummary = summaryGroups.first()
  const secondSummary = summaryGroups.last()

  // Get the corresponding label elements
  const firstLabel = page.locator('.svg-label[data-type="summary"]').first()
  const secondLabel = page.locator('.svg-label[data-type="summary"]').last()

  // Select first summary
  await firstSummary.click()
  await expect(firstLabel).toHaveClass(/selected/)
  await expect(secondLabel).not.toHaveClass(/selected/)

  // Select second summary
  await secondSummary.click()
  await expect(firstLabel).not.toHaveClass(/selected/)
  await expect(secondLabel).toHaveClass(/selected/)

  // Click elsewhere to deselect
  await page.locator('#map').click()
  await expect(firstLabel).not.toHaveClass(/selected/)
  await expect(secondLabel).not.toHaveClass(/selected/)
})

test('Summary keyboard shortcuts', async ({ page, me }) => {
  // Create a summary
  await me.click('Left Child 1')
  await page.getByText('Left Child 1', { exact: true }).click({ button: 'right', force: true })
  await page.locator('#cm-summary').click()
  await page.keyboard.press('Enter')

  // Select the summary
  await page.locator('svg g[id^="s-"]').click()
  await expect(page.locator('.svg-label[data-type="summary"].selected').first()).toBeVisible()

  // Test F2 to edit
  await page.keyboard.press('F2')
  await expect(page.locator('#input-box')).toBeVisible()
  await page.keyboard.press('Enter')

  // Test Delete key to remove
  await page.keyboard.press('Delete')
  await expect(page.locator('svg g[id^="s-"]')).not.toBeVisible()
})

test('Summary with empty text handling', async ({ page, me }) => {
  // Create a summary
  await me.click('Left Child 1')
  await page.getByText('Left Child 1', { exact: true }).click({ button: 'right', force: true })
  await page.locator('#cm-summary').click()

  // Clear all text and press Enter
  await page.keyboard.press('Control+a')
  await page.keyboard.press('Delete')
  await page.keyboard.press('Enter')

  // Summary should still exist and revert to original text when empty
  await expect(page.locator('svg g[id^="s-"]')).toBeVisible()
  const summaryText = page.locator('.svg-label[data-type="summary"]').first()
  await expect(summaryText).toBeVisible()
  // When text is cleared, it should revert to the original 'summary' text
  await expect(summaryText).toHaveText('summary')
})
