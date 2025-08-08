import { test, expect } from './mind-elixir-test'

const complexData = {
  nodeData: {
    topic: 'Main Topic',
    id: 'main',
    children: [
      {
        id: 'branch-a',
        topic: 'Branch A',
        children: [
          {
            id: 'leaf-a1',
            topic: 'Leaf A1',
          },
          {
            id: 'leaf-a2',
            topic: 'Leaf A2',
          },
        ],
      },
      {
        id: 'branch-b',
        topic: 'Branch B',
        children: [
          {
            id: 'leaf-b1',
            topic: 'Leaf B1',
          },
        ],
      },
    ],
  },
}

test.beforeEach(async ({ me }) => {
  await me.init(complexData)
})

test('Operation History - Single Node Operations', async ({ page, me }) => {
  // Test createNode operation
  await me.click('Leaf A1')
  await page.keyboard.press('Tab') // Add child
  await page.keyboard.press('Enter')
  await expect(me.getByText('New Node')).toBeVisible()

  // Undo createNode
  await page.keyboard.press('Control+z')
  await expect(me.getByText('New Node')).toBeHidden()

  // Redo createNode
  await page.keyboard.press('Control+y')
  await expect(me.getByText('New Node')).toBeVisible()

  // Test removeNode operation
  await page.keyboard.press('Delete')
  await expect(me.getByText('New Node')).toBeHidden()

  // Undo removeNode
  await page.keyboard.press('Control+z')
  await expect(me.getByText('New Node')).toBeVisible()
})

test('Operation History - Node Edit Operations', async ({ page, me }) => {
  const originalText = 'Leaf A2'
  const editedText = 'Modified Leaf A2'

  // Test finishEdit operation
  await me.dblclick(originalText)
  await page.keyboard.press('Control+a')
  await page.keyboard.insertText(editedText)
  await page.keyboard.press('Enter')
  await expect(me.getByText(editedText)).toBeVisible()

  // Undo edit
  await page.keyboard.press('Control+z')
  await expect(me.getByText(originalText)).toBeVisible()
  await expect(me.getByText(editedText)).toBeHidden()

  // Redo edit
  await page.keyboard.press('Control+y')
  await expect(me.getByText(editedText)).toBeVisible()
  await expect(me.getByText(originalText)).toBeHidden()
})

test('Operation History - Multiple Node Operations', async ({ page, me }) => {
  // Select multiple nodes using drag selection
  await me.dragSelect('Leaf A1', 'Leaf A2')

  // Remove multiple nodes
  await page.keyboard.press('Delete')
  await expect(me.getByText('Leaf A1')).toBeHidden()
  await expect(me.getByText('Leaf A2')).toBeHidden()

  // Undo removeNodes operation
  await page.keyboard.press('Control+z')
  await expect(me.getByText('Leaf A1')).toBeVisible()
  await expect(me.getByText('Leaf A2')).toBeVisible()

  // Redo removeNodes operation
  await page.keyboard.press('Control+y')
  await expect(me.getByText('Leaf A1')).toBeHidden()
  await expect(me.getByText('Leaf A2')).toBeHidden()
})

test('Operation History - Copy Multiple Nodes', async ({ page, me }) => {
  // Select and copy multiple nodes
  await me.dragSelect('Leaf A1', 'Leaf A2')
  await page.keyboard.press('Control+c')

  // Paste to another location
  await me.click('Branch B')
  await page.keyboard.press('Control+v')

  // Should have copied nodes under Branch B
  const leafA1Nodes = me.getByText('Leaf A1')
  const leafA2Nodes = me.getByText('Leaf A2')
  await expect(leafA1Nodes).toHaveCount(2)
  await expect(leafA2Nodes).toHaveCount(2)

  // Undo copyNodes operation
  await page.keyboard.press('Control+z')
  await expect(leafA1Nodes).toHaveCount(1)
  await expect(leafA2Nodes).toHaveCount(1)

  // Redo copyNodes operation
  await page.keyboard.press('Control+y')
  await expect(leafA1Nodes).toHaveCount(2)
  await expect(leafA2Nodes).toHaveCount(2)
})

test('Operation History - Node Movement Operations', async ({ page, me }) => {
  // Test moveNodeBefore operation
  await me.click('Leaf A2')
  await page.keyboard.press('Alt+ArrowUp') // Move up (before sibling)

  // Undo move operation
  await page.keyboard.press('Control+z')

  // Redo move operation
  await page.keyboard.press('Control+y')

  // Test moveNodeAfter operation
  await page.keyboard.press('Alt+ArrowDown') // Move down (after sibling)

  // Undo move operation
  await page.keyboard.press('Control+z')

  // Redo move operation
  await page.keyboard.press('Control+y')
})

test('Operation History - Complex Operation Sequence', async ({ page, me }) => {
  // Perform a complex sequence of operations

  // 1. Edit a node
  await me.dblclick('Branch A')
  await page.keyboard.press('Control+a')
  await page.keyboard.insertText('Modified Branch A')
  await page.keyboard.press('Enter')

  // 2. Add a child to the modified node
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')

  // 3. Edit the new child
  await me.dblclick('New Node')
  await page.keyboard.press('Control+a')
  await page.keyboard.insertText('New Child Node')
  await page.keyboard.press('Enter')

  // 4. Copy the branch
  await me.click('Modified Branch A')
  await page.keyboard.press('Control+c')

  // 5. Paste to main topic
  await me.click('Main Topic')
  await page.keyboard.press('Control+v')

  // Verify all operations completed
  await expect(me.getByText('Modified Branch A')).toHaveCount(2)
  await expect(me.getByText('New Child Node')).toHaveCount(2)

  // Undo operations step by step
  await page.keyboard.press('Control+z') // Undo paste
  await expect(me.getByText('Modified Branch A')).toHaveCount(1)
  await expect(me.getByText('New Child Node')).toHaveCount(1)

  await page.keyboard.press('Control+z') // Undo edit new child
  await expect(me.getByText('New Child Node')).toBeHidden()
  await expect(me.getByText('New Node')).toBeVisible()

  await page.keyboard.press('Control+z') // Undo add child
  await expect(me.getByText('New Node')).toBeHidden()

  await page.keyboard.press('Control+z') // Undo edit branch
  await expect(me.getByText('Modified Branch A')).toBeHidden()
  await expect(me.getByText('Branch A')).toBeVisible()

  // Redo all operations
  await page.keyboard.press('Control+y') // Redo edit branch
  await expect(me.getByText('Modified Branch A')).toBeVisible()

  await page.keyboard.press('Control+y') // Redo add child
  await expect(me.getByText('New Node')).toBeVisible()

  await page.keyboard.press('Control+y') // Redo edit new child
  await expect(me.getByText('New Child Node')).toBeVisible()

  await page.keyboard.press('Control+y') // Redo paste
  await expect(me.getByText('Modified Branch A')).toHaveCount(2)
})

test('Operation History - History Branching', async ({ page, me }) => {
  // Perform an operation
  await me.click('Leaf B1')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await expect(me.getByText('New Node')).toBeVisible()

  // Undo the operation
  await page.keyboard.press('Control+z')
  await expect(me.getByText('New Node')).toBeHidden()

  // Perform a different operation (this should clear the redo history)
  await page.keyboard.press('Tab') // Add child instead
  await page.keyboard.press('Enter')
  await expect(me.getByText('New Node')).toBeVisible()

  // Try to redo the original operation (should not work)
  await page.keyboard.press('Control+y')
  // The new child should still be there, not the sibling
  await expect(me.getByText('New Node')).toBeVisible()

  // Undo the child operation
  await page.keyboard.press('Control+z')
  await expect(me.getByText('New Node')).toBeHidden()
})

test('Operation History - Node Selection After Undo/Redo', async ({ page, me }) => {
  // Add a node and verify selection
  await me.click('Branch B')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')

  // The new node should be selected
  const newNode = me.getByText('New Node')
  await expect(newNode).toBeVisible()

  // Undo - should restore selection to Branch B
  await page.keyboard.press('Control+z')
  await expect(newNode).toBeHidden()

  // Verify Branch B is selected by performing an action
  await page.keyboard.press('Enter') // Add sibling
  await page.keyboard.press('Enter')
  await expect(me.getByText('New Node')).toBeVisible()

  // Clean up
  await page.keyboard.press('Control+z')
})

test('Operation History - Stress Test Multiple Rapid Operations', async ({ page, me }) => {
  // Perform many rapid operations
  await me.click('Main Topic')

  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab') // Add child
    await page.keyboard.press('Enter')
    await page.keyboard.press('Enter') // Add sibling
    await page.keyboard.press('Enter')
  }

  // Should have multiple new nodes
  const newNodes = me.getByText('New Node')
  await expect(newNodes).toHaveCount(10)

  // Undo all operations
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Control+z')
  }

  // Should be back to original state
  await expect(newNodes).toHaveCount(0)

  // Redo all operations
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Control+y')
  }

  // Should have all nodes back
  await expect(newNodes).toHaveCount(10)
})
