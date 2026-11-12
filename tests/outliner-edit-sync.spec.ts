import { test, expect } from './mind-elixir-test'

// Editing-state integrity in the outliner.
//
// `rerenderFromMei` used to clear `editingId` unconditionally, so an
// external sync (programmatic undo/redo, a map edit from another view) landed
// mid-edit would overwrite the in-progress DOM with the model topic, and the
// late focusout — seeing `editingId !== id` — dropped the typing entirely.
//
// The in-editor Ctrl+Z branch used to skip `preventDefault()` (the
// browser default undid a SECOND step on top of `execCommand`), and its
// fallback blurred first — the commit pushed a reshape entry that the very
// next `mei.undo()` ate, so the undo never reached the target operation.

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
          { id: 'child1', topic: 'Child 1' },
          {
            id: 'child2',
            topic: 'Child 2',
            children: [
              { id: 'grandchild1', topic: 'Grandchild 1' },
              { id: 'grandchild2', topic: 'Grandchild 2' },
            ],
          },
        ],
      },
    ],
  },
}

const topic = (page: any, id: string) => page.locator(`#outline .outline-item-topic[data-item-id="${id}"]`)

const child1Topic = async (page: any) =>
  page.evaluate(() => {
    const branch = (window as any)['#map'].getData().nodeData.children[0]
    return branch.children.find((c: any) => c.id === 'child1').topic
  })

test.beforeEach(async ({ me }) => {
  await me.initBoundOutliner(data)
})

// An external sync must commit the in-flight typing, not clobber it.
test('Uncommitted typing is committed by an external map edit, not overwritten', async ({ page }) => {
  await topic(page, 'child1').click()
  await page.keyboard.type(' edited')
  await expect(topic(page, 'child1')).toHaveText('Child 1 edited')
  // Not committed yet — the edit lives in the DOM only
  expect(await child1Topic(page)).toBe('Child 1')

  // External sync: a programmatic map operation (another view / another client)
  await page.evaluate(() => {
    const mind = (window as any)['#map']
    mind.addChild(mind.findEle('branch1'), { id: 'ext', topic: 'Ext', children: [] })
  })

  // The typing was committed to the model by the sync…
  expect(await child1Topic(page)).toBe('Child 1 edited')
  // …and the DOM still shows it, focus intact (still editing)
  await expect(topic(page, 'child1')).toHaveText('Child 1 edited')
  expect(await page.evaluate(() => document.activeElement?.getAttribute('data-item-id'))).toBe('child1')
  await expect(topic(page, 'ext')).toBeVisible()

  // Blur: the edit was already committed, so nothing is lost or double-pushed
  await topic(page, 'root').click()
  expect(await child1Topic(page)).toBe('Child 1 edited')
  // One journal entry for the edit: a single undo reverts it completely
  await page.evaluate(() => (window as any)['#map'].undo())
  expect(await child1Topic(page)).toBe('Child 1')
})

// Same contract for the undo channel.
test('Uncommitted typing survives a programmatic undo', async ({ page }) => {
  await page.evaluate(() => {
    const mind = (window as any)['#map']
    mind.addChild(mind.findEle('branch1'), { id: 'blockA', topic: 'Block A', children: [] })
  })
  await topic(page, 'child1').click()
  await page.keyboard.type('X')
  await expect(topic(page, 'child1')).toHaveText('Child 1X')

  await page.evaluate(() => (window as any)['#map'].undo())

  // The undo reached its target (Block A added) without eating the typing
  const state = await page.evaluate(() => {
    const branch = (window as any)['#map'].getData().nodeData.children[0]
    return {
      topics: branch.children.map((c: any) => c.topic),
      child1: branch.children.find((c: any) => c.id === 'child1').topic,
    }
  })
  expect(state.topics).not.toContain('Block A')
  expect(state.child1).toBe('Child 1X')
  await expect(topic(page, 'child1')).toHaveText('Child 1X')
  expect(await page.evaluate(() => document.activeElement?.getAttribute('data-item-id'))).toBe('child1')

  // Blur commits nothing new; the edit stays
  await topic(page, 'root').click()
  expect(await child1Topic(page)).toBe('Child 1X')
})

// The in-editor branch must prevent the browser default, or a real
// keystroke reverts TWO steps (execCommand + the keydown default action).
// Asserted via `defaultPrevented` on a cancelable event: native undo grouping
// makes step-counting through text content non-deterministic.
test('Ctrl+Z while editing prevents the browser default and walks native undo only', async ({ page }) => {
  await topic(page, 'child1').click()
  await page.evaluate(() => {
    const el = document.querySelector('#outline .outline-item-topic[data-item-id="child1"]') as HTMLElement
    el.focus()
    document.execCommand('insertText', false, 'abcd')
  })
  await expect(topic(page, 'child1')).toHaveText('Child 1abcd')

  const prevented = await page.evaluate(() => {
    const e = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true, cancelable: true })
    document.dispatchEvent(e)
    return e.defaultPrevented
  })
  expect(prevented).toBe(true)

  // The handler's execCommand consumed the typing entry (the dispatch is a
  // full handler run, not a dry probe), and a SUCCESSFUL native undo must not
  // additionally step the shared journal
  await expect(topic(page, 'child1')).toHaveText('Child 1')
  expect(await page.evaluate(() => (window as any)['#map'].historyStack.size)).toBe(0)
})

// With the native stack exhausted, the fallback steps the journal; the
// uncommitted typing must be committed by that sync (not by a manual blur that
// pushes an entry for the undo to eat), and the edit must survive.
test('Ctrl+Z with exhausted native undo steps the journal and keeps the edit', async ({ page }) => {
  await page.evaluate(() => {
    const mind = (window as any)['#map']
    mind.addChild(mind.findEle('branch1'), { id: 'blockA', topic: 'Block A', children: [] })
  })
  await topic(page, 'child1').click()
  // Programmatic replacement: dirty DOM, EMPTY native undo stack
  await page.evaluate(() => {
    const el = document.querySelector('#outline .outline-item-topic[data-item-id="child1"]') as HTMLElement
    el.textContent = 'Child 1 replaced'
  })

  await page.keyboard.press('Control+z')

  // The fallback runs in a setTimeout — poll until the journal step landed.
  // The undo reached the last real operation (Block A)…
  await expect
    .poll(() =>
      page.evaluate(() => {
        const branch = (window as any)['#map'].getData().nodeData.children[0]
        return branch.children.some((c: any) => c.topic === 'Block A')
      }),
    )
    .toBe(false)

  // …while the uncommitted edit was committed, not reverted
  const state = await page.evaluate(() => {
    const branch = (window as any)['#map'].getData().nodeData.children[0]
    return branch.children.find((c: any) => c.id === 'child1').topic
  })
  expect(state).toBe('Child 1 replaced')
  await expect(topic(page, 'child1')).toHaveText('Child 1 replaced')
  expect(await page.evaluate(() => document.activeElement?.getAttribute('data-item-id'))).toBe('child1')

  // Blur commits nothing new
  await topic(page, 'root').click()
  expect(await child1Topic(page)).toBe('Child 1 replaced')
})
