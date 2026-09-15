import { test, expect } from './mind-elixir-test'

const data = {
  nodeData: {
    topic: 'root',
    id: 'root',
    children: [{ id: 'md', topic: '# Big\n\n*em* __hi__ **star**' }],
  },
}

const mapRoot = '#map .map-container'
const mapTopic = '#map .me-tpc'
const outlineRoot = '#outline .outliner-container'
const outlineTopic = '#outline .outline-item-topic'

const cssVar = (page: any, selector: string, name: string) =>
  page.evaluate(
    ({ selector, name }: { selector: string; name: string }) => getComputedStyle(document.querySelector(selector)!).getPropertyValue(name).trim(),
    { selector, name },
  )

const colorOf = (page: any, selector: string) => page.locator(selector).first().evaluate((el: HTMLElement) => getComputedStyle(el).color)

test.beforeEach(async ({ me }) => {
  await me.initBoundOutliner(data, '#map', '#outline', true)
})

test('The mount point carries the marker — the library adds none', async ({ page }) => {
  await expect(page.locator('#map')).toHaveClass(/\bme-md\b/)
  await expect(page.locator('#outline')).toHaveClass(/\bme-md\b/)
  await expect(page.locator(mapRoot)).not.toHaveClass(/\bme-md\b/)
  await expect(page.locator(outlineRoot)).not.toHaveClass(/\bme-md\b/)
})

test('No marker, no md styling — the layer is the caller’s switch', async ({ page }) => {
  const h1Size = (selector: string) => page.locator(selector).first().evaluate((el: HTMLElement) => getComputedStyle(el).fontSize)

  expect(await h1Size(`${mapTopic} h1`)).toBe('24px')

  await page.evaluate(() => document.querySelector('#map')!.classList.remove('me-md'))
  const untagged = await h1Size(`${mapTopic} h1`)
  expect(untagged).not.toBe('24px')
  expect(Number.parseFloat(untagged)).toBeGreaterThan(24)

  expect(await h1Size(`${outlineTopic} h1`)).toBe('24px')
})

test('The outline maps the shared variables onto its own theme', async ({ page }) => {
  await page.evaluate(() => document.documentElement.style.setProperty('--rol-primary-color', 'rgb(7, 8, 9)'))
  await page.evaluate(() => document.documentElement.style.setProperty('--rol-header-color', 'rgb(4, 5, 6)'))

  expect(await cssVar(page, outlineRoot, '--me-md-accent')).toBe('rgb(7, 8, 9)')
  expect(await cssVar(page, outlineRoot, '--me-md-heading')).toBe('rgb(4, 5, 6)')
})

test('One variable moves md styling in BOTH views', async ({ page }) => {
  await page.evaluate(
    roots => {
      for (const sel of roots) document.querySelector(sel)!.style.setProperty('--me-md-accent', 'rgb(1, 2, 3)')
    },
    [mapRoot, outlineRoot],
  )

  expect(await colorOf(page, `${mapTopic} em`)).toBe('rgb(1, 2, 3)')
  expect(await colorOf(page, `${outlineTopic} em`)).toBe('rgb(1, 2, 3)')
})

test('The map reaches the shared layer through --selected', async ({ page }) => {
  await page.evaluate(sel => document.querySelector(sel)!.style.setProperty('--selected', 'rgb(255, 0, 0)'), mapRoot)

  expect(await cssVar(page, mapRoot, '--me-md-accent')).toBe('rgb(255, 0, 0)')
  expect(await colorOf(page, `${mapTopic} h1`)).toBe('rgb(255, 0, 0)')
  expect(await colorOf(page, `${mapTopic} em`)).toBe('rgb(255, 0, 0)')
})

test('__emphasis__ renders the same highlight in both views', async ({ page }) => {
  const background = (selector: string) =>
    page.locator(selector).first().evaluate((el: HTMLElement) => getComputedStyle(el).backgroundColor)

  const map = await background(`${mapTopic} strong.underscore-emphasis`)
  const outline = await background(`${outlineTopic} strong.underscore-emphasis`)

  expect(map).toBe('rgba(255, 235, 59, 0.25)')
  expect(outline).toBe(map)
})

test('The type scale is one rule set, not two', async ({ page }) => {
  const metrics = (selector: string) =>
    page.locator(selector).first().evaluate((el: HTMLElement) => {
      const cs = getComputedStyle(el)
      return `${cs.fontSize}/${cs.fontWeight}`
    })

  expect(await metrics(`${mapTopic} h1`)).toBe(await metrics(`${outlineTopic} h1`))
  expect(await metrics(`${mapTopic} strong.asterisk-emphasis`)).toBe(await metrics(`${outlineTopic} strong.asterisk-emphasis`))
})
