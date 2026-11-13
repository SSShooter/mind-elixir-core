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

test('concurrent init registers plugins exactly once', async ({ page, me }) => {
  await me.goto()
  const result = await page.evaluate(async (dataStr: string) => {
    const MindElixir = (window as any).MindElixir
    const mind = new MindElixir({
      el: '#map2',
      direction: MindElixir.SIDE,
      allowUndo: true,
      keypress: true,
      editable: true,
    })

    // Count clipboard listener registrations on the container: keypress adds
    // copy/cut/paste exactly once per completed plugin setup.
    let clipboardAdds = 0
    const originalAdd = mind.container.addEventListener.bind(mind.container)
    mind.container.addEventListener = function (type: string, listener: any, options: any) {
      if (type === 'copy' || type === 'cut' || type === 'paste') clipboardAdds++
      return originalAdd(type, listener, options)
    }

    // Fire two inits back-to-back without awaiting the first. The first blocks
    // on `document.fonts.ready`; if the `pluginsInitialized` flag is only set
    // after that await, the second call re-runs the full plugin setup.
    const data = JSON.parse(dataStr)
    await Promise.all([mind.init(data), mind.init(data)])
    mind.container.addEventListener = originalAdd

    return {
      clipboardAdds,
      // `operationHistory` is the only init-time 'operation' listener; a leaked
      // duplicate history stack shows up as a second listener here.
      operationListeners: mind.bus.handlers.operation.length,
    }
  }, JSON.stringify(secondData))

  expect(result.clipboardAdds).toBe(3)
  expect(result.operationListeners).toBe(1)
})
