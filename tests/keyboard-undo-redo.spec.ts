import { test, expect } from './mind-elixir-test'

const data = {
  nodeData: {
    topic: 'Root Node',
    id: 'root',
    children: [
      {
        id: 'left-1',
        topic: 'Left Branch 1',
        children: [
          {
            id: 'left-1-1',
            topic: 'Left Child 1',
          },
          {
            id: 'left-1-2',
            topic: 'Left Child 2',
          },
        ],
      },
      {
        id: 'right-1',
        topic: 'Right Branch 1',
        children: [
          {
            id: 'right-1-1',
            topic: 'Right Child 1',
          },
        ],
      },
    ],
  },
}

test.beforeEach(async ({ me }) => {
  await me.init(data)
})

test('Keyboard Shortcuts - Ctrl+Z for Undo', async ({ page, me }) => {
  // Perform an operation that can be undone
  await me.click('Left Child 1')
  await page.keyboard.press('Delete')
  await expect(page.getByText('Left Child 1')).toBeHidden()

  // Test Ctrl+Z
  await page.keyboard.press('Control+z')
  await expect(page.getByText('Left Child 1')).toBeVisible()
})

test('Keyboard Shortcuts - Ctrl+Y for Redo', async ({ page, me }) => {
  // Perform and undo an operation
  await me.click('Left Child 1')
  await page.keyboard.press('Delete')
  await page.keyboard.press('Control+z')
  await expect(page.getByText('Left Child 1')).toBeVisible()

  // Test Ctrl+Y
  await page.keyboard.press('Control+y')
  await expect(page.getByText('Left Child 1')).toBeHidden()
})

test('Keyboard Shortcuts - Ctrl+Shift+Z for Redo', async ({ page, me }) => {
  // Perform and undo an operation
  await me.click('Right Child 1')
  await page.keyboard.press('Tab') // Add child
  await page.keyboard.press('Enter')
  await expect(page.getByText('New Node')).toBeVisible()

  await page.keyboard.press('Control+z') // Undo
  await expect(page.getByText('New Node')).toBeHidden()

  // Test Ctrl+Shift+Z (alternative redo)
  await page.keyboard.press('Control+Shift+Z')
  await expect(page.getByText('New Node')).toBeVisible()
})

test('Keyboard Shortcuts - Meta+Z for Undo (Mac style)', async ({ page, me }) => {
  // This test simulates Mac-style shortcuts
  await me.click('Right Branch 1')
  await page.keyboard.press('Enter') // Add sibling
  await page.keyboard.press('Enter')
  await expect(page.getByText('New Node')).toBeVisible()

  // Test Meta+Z (Mac style undo)
  await page.keyboard.press('Meta+z')
  await expect(page.getByText('New Node')).toBeHidden()
})

test('Keyboard Shortcuts - Meta+Y for Redo (Mac style)', async ({ page, me }) => {
  // Perform and undo an operation
  await me.click('Left Branch 1')
  await page.keyboard.press('Shift+Enter') // Add before
  await page.keyboard.press('Enter')
  await expect(page.getByText('New Node')).toBeVisible()

  await page.keyboard.press('Meta+z') // Undo
  await expect(page.getByText('New Node')).toBeHidden()

  // Test Meta+Y (Mac style redo)
  await page.keyboard.press('Meta+y')
  await expect(page.getByText('New Node')).toBeVisible()
})

test('Keyboard Shortcuts - Meta+Shift+Z for Redo (Mac style)', async ({ page, me }) => {
  // Perform and undo an operation
  await me.click('Left Child 2')
  await page.keyboard.press('Control+Enter') // Add parent
  await page.keyboard.press('Enter')
  await expect(page.getByText('New Node')).toBeVisible()

  await page.keyboard.press('Meta+z') // Undo
  await expect(page.getByText('New Node')).toBeHidden()

  // Test Meta+Shift+Z (Mac style alternative redo)
  await page.keyboard.press('Meta+Shift+Z')
  await expect(page.getByText('New Node')).toBeVisible()
})

test('Keyboard Shortcuts - Rapid Undo/Redo Sequence', async ({ page, me }) => {
  // Perform multiple operations
  await me.click('Root Node')

  // Operation 1: Add child
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(page.getByText('New Node')).toBeVisible()

  // Operation 2: Edit the new node
  await me.dblclick('New Node')
  await page.keyboard.press('Control+a')
  await page.keyboard.insertText('Edited Node')
  await page.keyboard.press('Enter')
  await expect(page.getByText('Edited Node')).toBeVisible()

  // Operation 3: Add sibling
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  const newNodes = page.getByText('New Node')
  await expect(newNodes).toHaveCount(1)

  // Rapid undo sequence
  await page.keyboard.press('Control+z') // Undo add sibling
  await expect(newNodes).toHaveCount(0)

  await page.keyboard.press('Control+z') // Undo edit
  await expect(page.getByText('Edited Node')).toBeHidden()
  await expect(page.getByText('New Node')).toBeVisible()

  await page.keyboard.press('Control+z') // Undo add child
  await expect(page.getByText('New Node')).toBeHidden()

  // Rapid redo sequence
  await page.keyboard.press('Control+y') // Redo add child
  await expect(page.getByText('New Node')).toBeVisible()

  await page.keyboard.press('Control+y') // Redo edit
  await expect(page.getByText('Edited Node')).toBeVisible()

  await page.keyboard.press('Control+y') // Redo add sibling
  await expect(newNodes).toHaveCount(1)
})

test('Keyboard Shortcuts - Undo/Redo with Node Movement', async ({ page, me }) => {
  // Move a node using keyboard shortcuts
  await me.click('Left Child 1')
  await page.keyboard.press('Alt+ArrowUp') // Move up

  // Verify the node moved (this depends on the specific implementation)
  // We'll check by trying to undo the move
  await page.keyboard.press('Control+z')

  // Redo the move
  await page.keyboard.press('Control+y')
})

test('Keyboard Shortcuts - Undo/Redo Edge Cases', async ({ page, me }) => {
  // Test undo when at the beginning of history
  await page.keyboard.press('Control+z')
  await page.keyboard.press('Control+z')
  await page.keyboard.press('Control+z')
  // Should not crash or cause issues
  await expect(page.getByText('Root Node')).toBeVisible()

  // Perform an operation
  await me.click('Right Child 1')
  await page.keyboard.press('Delete')
  await expect(page.getByText('Right Child 1')).toBeHidden()

  // Test redo when at the end of history
  await page.keyboard.press('Control+y')
  await page.keyboard.press('Control+y')
  await page.keyboard.press('Control+y')
  // Should not crash or cause issues
  await expect(page.getByText('Right Child 1')).toBeHidden()
})

test('Keyboard Shortcuts - Undo/Redo with Complex Node Operations', async ({ page, me }) => {
  // Test with copy/paste operations
  await me.click('Left Branch 1')
  await page.keyboard.press('Control+c') // Copy

  await me.click('Right Branch 1')
  await page.keyboard.press('Control+v') // Paste

  // Should have two "Left Branch 1" nodes now
  const leftBranchNodes = page.getByText('Left Branch 1')
  await expect(leftBranchNodes).toHaveCount(2)

  // Undo the paste
  await page.keyboard.press('Control+z')
  await expect(leftBranchNodes).toHaveCount(1)

  // Redo the paste
  await page.keyboard.press('Control+y')
  await expect(leftBranchNodes).toHaveCount(2)
})

test('Keyboard Shortcuts - Undo/Redo Preserves Focus', async ({ page, me }) => {
  // Select a node and perform an operation
  await me.click('Left Child 2')
  await page.keyboard.press('Enter') // Add sibling
  await page.keyboard.press('Enter')

  // Undo should restore focus to the original node
  await page.keyboard.press('Control+z')

  // Test that the original node still has focus by performing an action
  await page.keyboard.press('Delete')
  await expect(page.getByText('Left Child 2')).toBeHidden()

  // Restore for cleanup
  await page.keyboard.press('Control+z')
  await expect(page.getByText('Left Child 2')).toBeVisible()
})
