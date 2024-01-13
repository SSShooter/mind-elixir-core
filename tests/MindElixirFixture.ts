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
  async init(data: MindElixirData) {
    const mind = await this.page.evaluate(data => {
      const MindElixir = window.MindElixir
      const options: Options = {
        el: '#map',
        direction: MindElixir.SIDE,
      }
      const mind = new MindElixir(options)
      mind.init(JSON.parse(JSON.stringify(data)))
      window.m = mind
      return mind
    }, data)
    this.m = mind
  }
  async getData() {
    return await this.page.evaluate(() => {
      return window.m.getData()
    })
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
    await this.page.waitForTimeout(200) // throttle
    await this.page.mouse.move(box.x + box.width / 2, box.y + y)
  }
  async toHaveScreenshot(locator?: Locator) {
    await expect(locator || this.page.locator('me-nodes')).toHaveScreenshot()
  }
}
