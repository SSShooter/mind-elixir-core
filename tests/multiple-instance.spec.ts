import { test, expect } from './mind-elixir-test'
import type MindElixir from '../src/index'

declare let window: {
  E: typeof MindElixir.E
}

const data1 = {
  nodeData: {
    id: 'data1',
    topic: 'new topic',
    root: true,
    children: [],
  },
}

const data2 = {
  nodeData: {
    id: 'data2',
    topic: 'new topic',
    root: true,
    children: [
      {
        id: 'child',
        topic: 'child',
        direction: 0,
      },
    ],
  },
}
test.beforeEach(async ({ me, page }) => {
  await me.init(data1, '#map')
  await me.init(data2, '#map2')
})

// fix: https://github.com/SSShooter/mind-elixir-core/issues/247
test('Add Child To Data2 Correctly', async ({ page, me }) => {
  const handle = await me.getInstance('#map2')
  handle.evaluateHandle(mei =>
    mei.addChild(window.E('data2'), {
      id: 'child2',
      topic: 'child2',
    })
  )
  handle.evaluateHandle(mei =>
    mei.addChild(window.E('child'), {
      id: 'child3',
      topic: 'child3',
    })
  )
  expect(await page.screenshot()).toMatchSnapshot()
})
