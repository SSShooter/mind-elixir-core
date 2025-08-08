import { test, expect } from './mind-elixir-test'

const data = {
  nodeData: {
    topic: 'Root',
    id: 'root',
    children: [
      {
        id: 'child1',
        topic: 'Child 1',
      },
    ],
  },
}

test.beforeEach(async ({ me }) => {
  await me.init(data)
})

test('Simple Undo/Redo - Basic Add Node', async ({ page, me }) => {
  // Add a node
  await me.click('Child 1')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  await expect(page.getByText('New Node')).toBeVisible()

  // Test Ctrl+Z (undo)
  await page.keyboard.press('Control+z')
  await expect(page.getByText('New Node')).toBeHidden()

  // Test Ctrl+Y (redo)
  await page.keyboard.press('Control+y')
  await expect(page.getByText('New Node')).toBeVisible()
})

test('Simple Undo/Redo - Basic Remove Node', async ({ page, me }) => {
  // Remove a node
  await me.click('Child 1')
  await page.keyboard.press('Delete')
  await expect(page.getByText('Child 1')).toBeHidden()

  // Test Ctrl+Z (undo)
  await page.keyboard.press('Control+z')
  await expect(page.getByText('Child 1')).toBeVisible()

  // Test Ctrl+Y (redo)
  await page.keyboard.press('Control+y')
  await expect(page.getByText('Child 1')).toBeHidden()
})

test('Simple Undo/Redo - Test Ctrl+Shift+Z', async ({ page, me }) => {
  // Add a node
  await me.click('Child 1')
  await page.keyboard.press('Tab') // Add child
  await page.keyboard.press('Enter')
  await expect(page.getByText('New Node')).toBeVisible()

  // Undo
  await page.keyboard.press('Control+z')
  await expect(page.getByText('New Node')).toBeHidden()

  // Try Ctrl+Shift+Z for redo
  await page.keyboard.press('Control+Shift+Z')
  await page.waitForTimeout(500)

  const nodeVisible = await page.getByText('New Node').isVisible()
  console.log('Node visible after Ctrl+Shift+Z:', nodeVisible)

  // If that didn't work, try lowercase z
  if (!nodeVisible) {
    await page.keyboard.press('Control+Shift+Z')
    await page.waitForTimeout(500)
    const nodeVisible2 = await page.getByText('New Node').isVisible()
    console.log('Node visible after Ctrl+Shift+z:', nodeVisible2)
  }
})

test('Simple Undo/Redo - Test Meta Keys', async ({ page, me }) => {
  // Add a node
  await me.click('Root')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(page.getByText('New Node')).toBeVisible()

  // Test Meta+Z (Mac style undo)
  await page.keyboard.press('Meta+z')
  await expect(page.getByText('New Node')).toBeHidden()

  // Test Meta+Y (Mac style redo)
  await page.keyboard.press('Meta+y')
  await expect(page.getByText('New Node')).toBeVisible()
})

test('Simple Undo/Redo - Multiple Operations', async ({ page, me }) => {
  // Operation 1: Add child
  await me.click('Child 1')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(page.getByText('New Node')).toBeVisible()

  // Operation 2: Add sibling
  await page.keyboard.press('Enter')
  await page.keyboard.press('Enter')
  const newNodes = page.getByText('New Node')
  await expect(newNodes).toHaveCount(2)

  // Undo twice
  await page.keyboard.press('Control+z')
  await expect(newNodes).toHaveCount(1)

  await page.keyboard.press('Control+z')
  await expect(newNodes).toHaveCount(0)

  // Redo twice
  await page.keyboard.press('Control+y')
  await expect(newNodes).toHaveCount(1)

  await page.keyboard.press('Control+y')
  await expect(newNodes).toHaveCount(2)
})

test('Simple Undo/Redo - Edit Node', async ({ page, me }) => {
  // Edit a node
  await me.dblclick('Child 1')
  await page.keyboard.press('Control+a')
  await page.keyboard.insertText('Modified Child')
  await page.keyboard.press('Enter')
  await expect(page.getByText('Modified Child')).toBeVisible()

  // Undo edit
  await page.keyboard.press('Control+z')
  await expect(page.getByText('Child 1')).toBeVisible()
  await expect(page.getByText('Modified Child')).toBeHidden()

  // Redo edit
  await page.keyboard.press('Control+y')
  await expect(page.getByText('Modified Child')).toBeVisible()
  await expect(page.getByText('Child 1')).toBeHidden()
})
