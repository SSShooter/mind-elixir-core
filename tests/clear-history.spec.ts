import { test, expect } from './mind-elixir-test'

const diagramA = {
  nodeData: {
    id: 'root-a',
    topic: 'Diagram A',
    children: [
      { id: 'child-a', topic: 'Child A' },
    ],
  },
}

const diagramB = {
  nodeData: {
    id: 'root-b',
    topic: 'Diagram B',
    children: [
      { id: 'child-b', topic: 'Child B' },
    ],
  },
}

test.beforeEach(async ({ me }) => {
  await me.init(diagramA)
})

test('clearHistory - undo cannot revert into the pre-refresh diagram', async ({ page, me }) => {
  // Perform an operation in Diagram A
  await me.click('Child A')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(me.getByText('New Node')).toBeVisible()

  // Load a new diagram and clear the history
  await page.evaluate(data => {
    const mind = (window as any)['#map']
    mind.refresh(data)
    mind.clearHistory()
  }, diagramB)

  // Diagram B should now be shown
  await expect(me.getByText('Diagram B')).toBeVisible()
  await expect(me.getByText('Diagram A')).toBeHidden()

  // Undo should NOT travel back into Diagram A
  await page.keyboard.press('Control+z')
  await expect(me.getByText('Diagram B')).toBeVisible()
  await expect(me.getByText('Diagram A')).toBeHidden()

  // Redo should also be a no-op
  await page.keyboard.press('Control+y')
  await expect(me.getByText('Diagram B')).toBeVisible()
  await expect(me.getByText('Diagram A')).toBeHidden()
})

test('clearHistory - operations after clearHistory are undoable normally', async ({ page, me }) => {
  // Perform an operation in Diagram A then load Diagram B and clear history
  await me.click('Child A')
  await page.keyboard.press('Delete')
  await expect(me.getByText('Child A')).toBeHidden()

  await page.evaluate(data => {
    const mind = (window as any)['#map']
    mind.refresh(data)
    mind.clearHistory()
  }, diagramB)

  // Now add a node to Diagram B
  await me.click('Child B')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(me.getByText('New Node')).toBeVisible()

  // Undo the add — should work
  await page.keyboard.press('Control+z')
  await expect(me.getByText('New Node')).toBeHidden()

  // Redo the add — should also work
  await page.keyboard.press('Control+y')
  await expect(me.getByText('New Node')).toBeVisible()

  // One more undo should be a no-op (no history before the cleared point)
  await page.keyboard.press('Control+z') // undo add
  await page.keyboard.press('Control+z') // should be no-op, not reach Diagram A
  await expect(me.getByText('Diagram B')).toBeVisible()
  await expect(me.getByText('Diagram A')).toBeHidden()
})

test('clearHistory - first undo baseline is the refreshed diagram state', async ({ page, me }) => {
  // Load Diagram B, clear history, then add a node and undo
  await page.evaluate(data => {
    const mind = (window as any)['#map']
    mind.refresh(data)
    mind.clearHistory()
  }, diagramB)

  await me.click('Child B')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(me.getByText('New Node')).toBeVisible()

  // Undo restores exactly to the state right after refresh (Diagram B with just Child B)
  await page.keyboard.press('Control+z')
  await expect(me.getByText('New Node')).toBeHidden()
  await expect(me.getByText('Child B')).toBeVisible()
  await expect(me.getByText('Diagram B')).toBeVisible()
})
