import { test, expect } from './mind-elixir-test'

const data = {
  nodeData: {
    id: 'root',
    topic: 'root',
    children: [{ id: 'a', topic: 'a', style: { color: '#111111' } }],
  },
}

test.beforeEach(async ({ me }) => {
  await me.init(data)
})

test('reshapeNode - `origin` keeps the pre-edit style', async ({ page }) => {
  const result = await page.evaluate(() => {
    const m: any = (window as any)['#map']
    let captured: any = null
    m.bus.addListener('operation', (op: any) => {
      if (op.name === 'reshapeNode') captured = op
    })
    m.reshapeNode(m.findEle('a'), { style: { color: '#ff0000' } })
    return {
      originColor: captured?.origin?.style?.color,
      targetColor: captured?.target?.style?.color,
      // Before the fix both pointed at the very same object, so the "before"
      // snapshot silently reported the new style.
      sameObject: captured ? captured.origin.style === captured.target.style : null,
    }
  })

  expect(result.originColor).toBe('#111111')
  expect(result.targetColor).toBe('#ff0000')
  expect(result.sameObject).toBe(false)
})

test('reshapeNode - repeated patches do not accumulate into the snapshot', async ({ page }) => {
  const result = await page.evaluate(() => {
    const m: any = (window as any)['#map']
    const origins: string[] = []
    m.bus.addListener('operation', (op: any) => {
      if (op.name === 'reshapeNode') origins.push(op.origin?.style?.color)
    })
    const tpc = m.findEle('a')
    m.reshapeNode(tpc, { style: { color: '#ff0000' } })
    m.reshapeNode(m.findEle('a'), { style: { color: '#00ff00' } })
    return { origins, finalColor: (window as any)['#map'].findEle('a').nodeObj.style.color }
  })

  expect(result.finalColor).toBe('#00ff00')
  expect(result.origins).toEqual(['#111111', '#ff0000'])
})
