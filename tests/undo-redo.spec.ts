import { test, expect } from './mind-elixir-test'

const id = 'root-id'
const topic = 'root-topic'
const childTopic = 'child-topic'
const middleTopic = 'middle'

const data = {
  nodeData: {
    topic,
    id,
    children: [
      {
        id: 'middle',
        topic: middleTopic,
        children: [
          {
            id: 'child',
            topic: childTopic,
          },
        ],
      },
    ],
  },
}

test.beforeEach(async ({ me }) => {
  await me.init(data)
})

test('Undo/Redo - Add Node Operations', async ({ page, me }) => {
  // Select child node and add a sibling
  await me.click(childTopic)
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await expect(me.getByText('New Node')).toBeVisible()

  // Undo the add operation using Ctrl+Z
  await page.keyboard.press('Control+z')
  await expect(me.getByText('New Node')).toBeHidden()

  // Redo the add operation using Ctrl+Y
  await page.keyboard.press('Control+y')
  await expect(me.getByText('New Node')).toBeVisible()

  // Undo again using Ctrl+Z
  await page.keyboard.press('Control+z')
  await expect(me.getByText('New Node')).toBeHidden()

  // Redo using Ctrl+Shift+Z (alternative redo shortcut)
  await page.keyboard.press('Control+Shift+Z')
  await expect(me.getByText('New Node')).toBeVisible()
})

test('Undo/Redo - Remove Node Operations', async ({ page, me }) => {
  // Remove child node
  await me.click(childTopic)
  await page.keyboard.press('Delete')
  await expect(me.getByText(childTopic)).toBeHidden()

  // Undo the remove operation
  await page.keyboard.press('Control+z')
  await expect(me.getByText(childTopic)).toBeVisible()

  // Redo the remove operation
  await page.keyboard.press('Control+y')
  await expect(me.getByText(childTopic)).toBeHidden()

  // Undo again to restore the node
  await page.keyboard.press('Control+z')
  await expect(me.getByText(childTopic)).toBeVisible()
})

test('Undo/Redo - Edit Node Operations', async ({ page, me }) => {
  const originalText = childTopic
  const newText = 'updated-child-topic'

  // Edit the child node
  await me.dblclick(childTopic)
  await expect(page.locator('#input-box')).toBeVisible()
  await page.keyboard.insertText(newText)
  await page.keyboard.press('Enter')
  await expect(me.getByText(newText)).toBeVisible()

  // Undo the edit operation
  await page.keyboard.press('Control+z')
  await expect(me.getByText(originalText)).toBeVisible()
  await expect(me.getByText(newText)).toBeHidden()

  // Redo the edit operation
  await page.keyboard.press('Control+y')
  await expect(me.getByText(newText)).toBeVisible()
  await expect(me.getByText(originalText)).toBeHidden()
})

test('Undo/Redo - Multiple Operations Sequence', async ({ page, me }) => {
  // Perform multiple operations
  // 1. Add a child node
  await me.click(childTopic)
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(me.getByText('New Node')).toBeVisible()

  // 2. Add a sibling node
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  const newNodes = me.getByText('New Node')
  await expect(newNodes).toHaveCount(2)

  // 3. Edit the first new node
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('F2')
  await expect(page.locator('#input-box')).toBeVisible()
  await page.keyboard.insertText('First New Node')
  await page.keyboard.press('Enter')
  await expect(me.getByText('First New Node')).toBeVisible()

  // Now undo operations step by step
  // Undo edit operation
  await page.keyboard.press('Control+z')
  await expect(me.getByText('First New Node')).toBeHidden()
  await expect(me.getByText('New Node')).toHaveCount(2)

  // Undo second add operation
  await page.keyboard.press('Control+z')
  await expect(newNodes).toHaveCount(1)

  // Undo first add operation
  await page.keyboard.press('Control+z')
  await expect(me.getByText('New Node')).toBeHidden()

  // Redo all operations
  await page.keyboard.press('Control+y') // Redo first add
  await expect(me.getByText('New Node')).toBeVisible()

  await page.keyboard.press('Control+y') // Redo second add
  await expect(newNodes).toHaveCount(2)

  await page.keyboard.press('Control+y') // Redo edit
  await expect(me.getByText('First New Node')).toBeVisible()
})

test('Undo/Redo - Copy and Paste Operations', async ({ page, me }) => {
  // Copy middle node
  await me.click(middleTopic)
  await page.keyboard.press('Control+c')

  // Paste to child node
  await me.click(childTopic)
  await page.keyboard.press('Control+v')

  // Verify the copy was successful (should have two "middle" nodes)
  const middleNodes = me.getByText(middleTopic)
  await expect(middleNodes).toHaveCount(2)

  // Undo the paste operation
  await page.keyboard.press('Control+z')
  await expect(middleNodes).toHaveCount(1)

  // Redo the paste operation
  await page.keyboard.press('Control+y')
  await expect(middleNodes).toHaveCount(2)
})

test('Undo/Redo - Cut and Paste Operations', async ({ page, me }) => {
  // Cut child node
  await me.click(childTopic)
  await page.keyboard.press('Control+x')
  await expect(me.getByText(childTopic)).toBeHidden()

  // Paste to root node
  await me.click(topic)
  await page.keyboard.press('Control+v')
  await expect(me.getByText(childTopic)).toBeVisible()

  // Undo the paste operation
  await page.keyboard.press('Control+z')
  // After undo, the node should be back in its original position

  // Undo the cut operation
  await page.keyboard.press('Control+z')
  await expect(me.getByText(childTopic)).toBeVisible()

  // Redo the cut operation
  await page.keyboard.press('Control+y')
  await expect(me.getByText(childTopic)).toBeHidden()

  // Redo the paste operation
  await page.keyboard.press('Control+y')
  await expect(me.getByText(childTopic)).toBeVisible()
})

test('Undo/Redo - No Operations Available', async ({ page, me }) => {
  // Try to undo when no operations are available
  await page.keyboard.press('Control+z')
  // Should not crash or change anything
  await expect(me.getByText(topic)).toBeVisible()
  await expect(me.getByText(middleTopic)).toBeVisible()
  await expect(me.getByText(childTopic)).toBeVisible()

  // Try to redo when no operations are available
  await page.keyboard.press('Control+y')
  // Should not crash or change anything
  await expect(me.getByText(topic)).toBeVisible()
  await expect(me.getByText(middleTopic)).toBeVisible()
  await expect(me.getByText(childTopic)).toBeVisible()
})

test('Undo/Redo - Node Selection Restoration', async ({ page, me }) => {
  // Add a new node and verify it gets selected
  await me.click(childTopic)
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')

  // The new node should be selected (we can verify this by checking if it has focus)
  const newNode = me.getByText('New Node')
  await expect(newNode).toBeVisible()

  // Undo the operation
  await page.keyboard.press('Control+z')
  await expect(newNode).toBeHidden()

  // The original child node should be selected again after undo
  // We can verify this by trying to perform an action that requires a selected node
  await page.keyboard.press('Delete')
  await expect(me.getByText(childTopic)).toBeHidden()

  // Undo the delete to restore the node
  await page.keyboard.press('Control+z')
  await expect(me.getByText(childTopic)).toBeVisible()
})
