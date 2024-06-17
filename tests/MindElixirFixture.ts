import { type Page, type Locator, expect } from '@playwright/test'
import type { MindElixirCtor, MindElixirData, MindElixirInstance, Options } from '../src'
import type MindElixir from '../src'
interface Window {
  m: MindElixirInstance
  MindElixir: MindElixirCtor
  E: typeof MindElixir.E
}
declare let window: Window

export class MindElixirFixture {
  private m: MindElixirInstance

  constructor(public readonly page: Page) {
    //
  }

  async goto() {
    await this.page.goto('http://localhost:23333/test.html')
  }
  async init(data: MindElixirData, el = '#map') {
    // evaluate return Serializable value
    await this.page.evaluate(
      ({ data, el }) => {
        const MindElixir = window.MindElixir
        const options: Options = {
          el,
          direction: MindElixir.SIDE,
        }
        const mind = new MindElixir(options)
        mind.init(JSON.parse(JSON.stringify(data)))
        window[el] = mind
        return mind
      },
      { data, el }
    )
  }
  async getInstance(el = '#map') {
    const instanceHandle = await this.page.evaluateHandle(el => Promise.resolve(window[el] as MindElixirInstance), el)
    return instanceHandle
  }
  async getData(el = '#map') {
    const data = await this.page.evaluate(el => {
      return window[el].getData()
    }, el)
    // console.log(a)
    // const dataHandle = await this.page.evaluateHandle(() => Promise.resolve(window.m.getData()))
    // const data = await dataHandle.jsonValue()
    return data
  }
  async dblclick(topic: string) {
    await this.page.getByText(topic).dblclick({
      force: true,
    })
  }
  async click(topic: string) {
    await this.page.getByText(topic).click({
      force: true,
    })
  }
  async dragOver(topic: string, type: 'before' | 'after' | 'in') {
    await this.page.getByText(topic).hover({ force: true })
    await this.page.mouse.down()
    const target = await this.page.getByText(topic)
    const box = (await target.boundingBox())!
    const y = type === 'before' ? -12 : type === 'after' ? box.height + 12 : box.height / 2
    // https://playwright.dev/docs/input#dragging-manually
    // If your page relies on the dragover event being dispatched, you need at least two mouse moves to trigger it in all browsers.
    await this.page.mouse.move(box.x + box.width / 2, box.y + y)
    await this.page.waitForTimeout(100) // throttle
    await this.page.mouse.move(box.x + box.width / 2, box.y + y)
  }
  async toHaveScreenshot(locator?: Locator) {
    await expect(locator || this.page.locator('me-nodes')).toHaveScreenshot({
      maxDiffPixelRatio: 0.02,
    })
  }
}
