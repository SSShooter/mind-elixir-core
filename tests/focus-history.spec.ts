import type { Page } from '@playwright/test'
import { test, expect } from './mind-elixir-test'

const modifier = process.platform === 'darwin' ? 'Meta' : 'Control'

/**
 * Undo depth: how many entries are applied. `clear()` empties the stack and
 * resets the cursor, so `0` means "nothing left to undo".
 */
const historyIndex = (page: Page) => page.evaluate(() => (window as any)['#map'].historyStack.currentIndex)

/** Enter focus mode through the real context-menu entry point. */
const enterFocus = async (page: Page, topic: string) => {
  await page.getByText(topic, { exact: true }).click({ button: 'right', force: true })
  await page.locator('#cm-fucus').click()
}

/** Leave focus mode through the real context-menu entry point. */
const exitFocus = async (page: Page) => {
  await page.getByText('Child 1', { exact: true }).click({ button: 'right', force: true })
  await page.locator('#cm-unfucus').click()
}

const data = {
  nodeData: {
    topic: 'root',
    id: 'root',
    children: [
      {
        id: 'branch1',
        topic: 'Branch 1',
        children: [{ id: 'child1', topic: 'Child 1' }],
      },
      {
        id: 'branch2',
        topic: 'Branch 2',
        children: [{ id: 'child2', topic: 'Child 2' }],
      },
    ],
  },
}

test.beforeEach(async ({ me }) => {
  await me.init(data)
})

test('Focus mode - entering focus clears the history stack', async ({ page, me }) => {
  // Record an edit in the full view
  await me.click('Child 1')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(me.getByText('New Node')).toBeVisible()
  expect(await historyIndex(page)).toBeGreaterThan(0)

  await enterFocus(page, 'Branch 1')

  // Focus mode only renders the focused subtree…
  await expect(page.getByText('Child 2', { exact: true })).toHaveCount(0)
  // …and history from the previous view is dropped
  expect(await historyIndex(page)).toBe(0)

  // Undo must not travel back across the focus boundary
  await me.click('Child 1')
  await page.keyboard.press(`${modifier}+z`)
  expect(await historyIndex(page)).toBe(0)
  await expect(page.getByText('Child 2', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Branch 2', { exact: true })).toHaveCount(0)
  await expect(page.getByText('New Node', { exact: true })).toBeVisible()
})

test('Focus mode - leaving focus clears the history stack', async ({ page, me }) => {
  await enterFocus(page, 'Branch 1')
  await expect(page.getByText('Child 2', { exact: true })).toHaveCount(0)
  expect(await historyIndex(page)).toBe(0)

  // An edit made inside focus mode IS recorded…
  await me.click('Child 1')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(me.getByText('New Node')).toBeVisible()
  expect(await historyIndex(page)).toBeGreaterThan(0)

  // …but leaving focus drops it, and the edit itself stays applied
  await exitFocus(page)
  await expect(page.getByText('Child 2', { exact: true })).toBeVisible()
  expect(await historyIndex(page)).toBe(0)

  await me.click('Child 1')
  await page.keyboard.press(`${modifier}+z`)
  expect(await historyIndex(page)).toBe(0)
  await expect(page.getByText('New Node', { exact: true })).toBeVisible()
})

test('Focus mode - undo inside the focused view stays in focus', async ({ page, me }) => {
  await enterFocus(page, 'Branch 1')
  expect(await historyIndex(page)).toBe(0)

  // Edit inside focus mode — recorded against the focused view
  await me.click('Child 1')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(me.getByText('New Node')).toBeVisible()
  const recorded = await historyIndex(page)
  expect(recorded).toBeGreaterThan(0)

  // Undo only walks what happened inside focus mode, and must not re-render
  // the pre-focus diagram while `isFocusMode` is still true.
  await me.click('Child 1')
  await page.keyboard.press(`${modifier}+z`)
  expect(await historyIndex(page)).toBe(recorded - 1)
  await expect(page.getByText('New Node', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Child 2', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Branch 2', { exact: true })).toHaveCount(0)

  // …and redo also stays in the focused view
  await me.click('Child 1')
  await page.keyboard.press(`${modifier}+y`)
  expect(await historyIndex(page)).toBe(recorded)
  await expect(page.getByText('New Node', { exact: true })).toBeVisible()
  await expect(page.getByText('Child 2', { exact: true })).toHaveCount(0)
})

test('Focus mode - undoing inside focus keeps the whole diagram in step', async ({ page, me }) => {
  await enterFocus(page, 'Branch 1')
  await me.click('Child 1')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(me.getByText('New Node')).toBeVisible()

  await me.click('Child 1')
  await page.keyboard.press(`${modifier}+z`)
  await expect(page.getByText('New Node', { exact: true })).toHaveCount(0)

  // Leaving focus must not resurrect the undone node from a stale backup tree
  await exitFocus(page)
  await expect(page.getByText('Branch 2', { exact: true })).toBeVisible()
  await expect(page.getByText('Child 2', { exact: true })).toBeVisible()
  await expect(page.getByText('New Node', { exact: true })).toHaveCount(0)
  expect(await historyIndex(page)).toBe(0)
})
