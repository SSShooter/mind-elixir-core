// node v10.14.1 working wrong
const puppeteer = require('puppeteer')
const pti = require('puppeteer-to-istanbul')

let browser = null
let page = null
// https://github.com/istanbuljs/puppeteer-to-istanbul
beforeAll(async () => {
  browser = await puppeteer.launch({
    // headless: false,
    // devtools: true
  })
  page = await browser.newPage()

  // await Promise.all([
  //   page.coverage.startJSCoverage(),
  //   page.coverage.startCSSCoverage(),
  // ])

  await page.goto('http://localhost:8080/')
})

describe('interact', () => {
  it('selectNode"', async () => {
    await page.evaluate(`m.selectNode(E('bd1f07c598e729dc'))`)
    let selected = await page.evaluate(() => {
      return E('bd1f07c598e729dc').classList.contains('selected')
    })
    expect(selected).toBeTruthy()
  })
})

afterAll(async () => {
  // const [jsCoverage, cssCoverage] = await Promise.all([
  //   page.coverage.stopJSCoverage(),
  //   page.coverage.stopCSSCoverage(),
  // ])
  // pti.write([...jsCoverage, ...cssCoverage], {
  //   includeHostname: true,
  //   storagePath: './.nyc_output',
  // })
  await browser.close()
})
