import { test, expect } from './mind-elixir-test'

const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'

const diagramA = {
  nodeData: {
    id: 'root-a',
    topic: 'Diagram A',
    children: [{ id: 'child-a', topic: 'Child A' }],
  },
}

const diagramB = {
  nodeData: {
    id: 'root-b',
    topic: 'Diagram B',
    children: [{ id: 'child-b', topic: 'Child B' }],
  },
}

test.beforeEach(async ({ me }) => {
  await me.init(diagramA)
})

test('clearHistory - undo cannot revert into pre-refresh diagram', async ({ page, me }) => {
  // Perform an operation in Diagram A
  await me.click('Child A')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(me.getByText('New Node')).toBeVisible()

  // Load Diagram B and clear the history stack
  await page.evaluate((data: typeof diagramB) => {
    const mind = (window as any)['#map']
    mind.refresh(data)
    mind.clearHistory()
  }, diagramB)

  await expect(me.getByText('Diagram B')).toBeVisible()
  await expect(me.getByText('Diagram A')).toBeHidden()

  // Undo should be a no-op — must not travel back into Diagram A
  await page.keyboard.press(`${modifier}+z`)
  await expect(me.getByText('Diagram B')).toBeVisible()
  await expect(me.getByText('Diagram A')).toBeHidden()

  // Redo should also be a no-op
  await page.keyboard.press(`${modifier}+y`)
  await expect(me.getByText('Diagram B')).toBeVisible()
  await expect(me.getByText('Diagram A')).toBeHidden()
})

test('clearHistory - operations after clearHistory are undoable normally', async ({ page, me }) => {
  // Perform an operation in Diagram A, then switch to Diagram B and clear history
  await me.click('Child A')
  await page.keyboard.press('Delete')
  await expect(me.getByText('Child A')).toBeHidden()

  await page.evaluate((data: typeof diagramB) => {
    const mind = (window as any)['#map']
    mind.refresh(data)
    mind.clearHistory()
  }, diagramB)

  await expect(me.getByText('Diagram B')).toBeVisible()

  // Add a node to Diagram B
  await me.click('Child B')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(me.getByText('New Node')).toBeVisible()

  // Undo the add — should work
  await page.keyboard.press(`${modifier}+z`)
  await expect(me.getByText('New Node')).toBeHidden()
  await expect(me.getByText('Diagram B')).toBeVisible()

  // Another undo should be a no-op — must not reach Diagram A
  await page.keyboard.press(`${modifier}+z`)
  await expect(me.getByText('Diagram B')).toBeVisible()
  await expect(me.getByText('Diagram A')).toBeHidden()

  // Redo restores the added node
  await page.keyboard.press(`${modifier}+y`)
  await expect(me.getByText('New Node')).toBeVisible()
})

test('clearHistory - first undo baseline is the refreshed diagram state', async ({ page, me }) => {
  // Switch to Diagram B and clear history
  await page.evaluate((data: typeof diagramB) => {
    const mind = (window as any)['#map']
    mind.refresh(data)
    mind.clearHistory()
  }, diagramB)

  // Add a node to Diagram B
  await me.click('Child B')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(me.getByText('New Node')).toBeVisible()

  // Undo should restore exactly to the post-refresh state of Diagram B
  await page.keyboard.press(`${modifier}+z`)
  await expect(me.getByText('New Node')).toBeHidden()
  await expect(me.getByText('Child B')).toBeVisible()
  await expect(me.getByText('Diagram B')).toBeVisible()
})
