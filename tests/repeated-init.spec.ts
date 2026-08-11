import { test, expect } from './mind-elixir-test'

const firstData = {
  nodeData: {
    id: 'first-root',
    topic: 'First document',
    children: [{ id: 'first-child', topic: 'First child' }],
  },
}

const secondData = {
  nodeData: {
    id: 'second-root',
    topic: 'Second document',
    children: [{ id: 'second-child', topic: 'Second child' }],
  },
}

test('destroy removes fullscreen listeners', async ({ page, me }) => {
  await me.init(firstData)

  const removedListeners = await page.evaluate(() => {
    const mind = (window as any)['#map']
    const el = mind.el
    const originalRemoveEventListener = el.removeEventListener
    let removed = 0
    el.removeEventListener = function (type: string, ...args: any[]) {
      if (type === 'fullscreenchange') removed++
      return originalRemoveEventListener.call(this, type, ...args)
    }
    mind.destroy()
    mind.destroy()
    return removed
  })

  expect(removedListeners).toBe(1)
})

test('destroy clears the instance DOM', async ({ page, me }) => {
  await me.init(firstData)

  await page.evaluate(() => {
    const mind = (window as any)['#map']
    mind.destroy()
  })

  await expect(page.locator('#map')).toBeEmpty()
})

test('repeated init is ignored', async ({ page, me }) => {
  await me.init(firstData)

  const result = await page.evaluate(async (data: typeof secondData) => {
    const mind = (window as any)['#map']
    const countsBefore = {
      toolbars: mind.container.querySelectorAll('.mind-elixir-toolbar').length,
      contextMenus: mind.container.querySelectorAll('.context-menu').length,
      operationListeners: mind.bus.handlers.operation.length,
    }
    const returnValue = await mind.init(data)
    const countsAfter = {
      toolbars: mind.container.querySelectorAll('.mind-elixir-toolbar').length,
      contextMenus: mind.container.querySelectorAll('.context-menu').length,
      operationListeners: mind.bus.handlers.operation.length,
    }
    return { returnValue, countsBefore, countsAfter }
  }, secondData)

  expect(result.returnValue).toBeUndefined()
  expect(result.countsAfter).toEqual(result.countsBefore)
  await expect(me.getByText('First document')).toBeVisible()
  await expect(me.getByText('Second document')).toBeHidden()
})
