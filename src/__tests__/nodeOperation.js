// node v10.14.1 working wrong
const puppeteer = require('puppeteer')
const pti = require('puppeteer-to-istanbul')

let browser = null
let page = null
// https://github.com/istanbuljs/puppeteer-to-istanbul
beforeAll(async() => {
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

describe('nodeOperation', () => {
  it('addChild"', async() => {
    await page.evaluate(`m.addChild(E('bd1f07c598e729dc'))`)
    await page.waitForSelector('#input-box')
    await page.keyboard.press('Enter')
    const id = await page.evaluate(() => {
      return E('bd1f07c598e729dc').nodeObj.children[0].parent.id
    })
    expect(id).toEqual('bd1f07c598e729dc')
  })
  it('insertSibling"', async() => {
    await page.evaluate(`m.insertSibling(E('bd1f07c598e729dc'))`)
    const newId = await page.evaluate(`currentOperation.obj.id`)
    await page.waitForSelector('#input-box')
    await page.keyboard.press('Enter')
    const res = await page.evaluate(newId => {
      const newNode = E(newId).nodeObj
      const oldNode = E('bd1f07c598e729dc').nodeObj
      const sameParent = newNode.parent.id === oldNode.parent.id
      const sibling = newNode.parent.children
      const i1 = sibling.indexOf(oldNode)
      const i2 = sibling.indexOf(newNode)
      const isSibling = i2 - i1 === 1
      return [sameParent, isSibling]
    }, newId)
    expect(res[0]).toEqual(true)
    expect(res[1]).toEqual(true)
  })
  it('insertBefore"', async() => {
    await page.evaluate(`m.insertBefore(E('bd1f07c598e729dc'))`)
    await page.keyboard.press('Enter')
    const res = await page.evaluate(() => {
      const newId = currentOperation.obj.id
      const newNode = E(newId).nodeObj
      const oldNode = E('bd1f07c598e729dc').nodeObj
      const sameParent = newNode.parent.id === oldNode.parent.id
      const sibling = newNode.parent.children
      const i1 = sibling.indexOf(oldNode)
      const i2 = sibling.indexOf(newNode)
      const isSibling = i1 - i2 === 1
      return [sameParent, isSibling]
    })
    expect(res[0]).toEqual(true)
    expect(res[1]).toEqual(true)
  })
  it('moveNode"', async() => {
    const res = await page.evaluate(async() => {
      let from = E('bd1f07c598e729dc')
      let to = E('bd1babdd5c18a7a2')
      await m.moveNode(from, to)

      const domCheck =
        from.closest('children').previousElementSibling === to.parentNode

      from = from.nodeObj
      to = to.nodeObj
      const objCheck = to.children.indexOf(from) !== -1

      return [objCheck, domCheck]
    })
    expect(res[0]).toEqual(true)
    expect(res[1]).toEqual(true)
  })
  it('moveNodeBefore"', async() => {
    const res = await page.evaluate(async() => {
      let from = E('bd1f07c598e729dc')
      let to = E('bd1babdd5c18a7a2')
      await m.moveNodeBefore(from, to)

      const domCheck =
        from.closest('grp') === to.closest('grp').previousElementSibling

      from = from.nodeObj
      to = to.nodeObj
      const sibling = from.parent.children
      const i1 = sibling.indexOf(from)
      const i2 = sibling.indexOf(to)

      const objCheck = i2 - i1 === 1

      return [objCheck, domCheck]
    })
    expect(res[0]).toEqual(true)
    expect(res[1]).toEqual(true)
  })
  it('moveNodeAfter"', async() => {
    const res = await page.evaluate(async() => {
      let from = E('bd1f07c598e729dc')
      let to = E('bd1babdd5c18a7a2')
      await m.moveNodeAfter(from, to)

      const domCheck =
        from.closest('grp').previousElementSibling === to.closest('grp')

      from = from.nodeObj
      to = to.nodeObj
      const sibling = from.parent.children
      const i1 = sibling.indexOf(from)
      const i2 = sibling.indexOf(to)

      const objCheck = i1 - i2 === 1

      return [objCheck, domCheck]
    })
    expect(res[0]).toEqual(true)
    expect(res[1]).toEqual(true)
  })
  it('removeNode"', async() => {
    const res = await page.evaluate(async() => {
      const el = E('bd1f07c598e729dc')
      await m.removeNode(el)

      const domCheck = E('bd1f07c598e729dc')

      const objCheck = m.getObjById('bd1f07c598e729dc', m.nodeData)

      return [objCheck, domCheck]
    })
    expect(res[0]).toBeFalsy()
    expect(res[1]).toBeFalsy()

    const delRoot = await page.evaluate(async() => {
      const el = E('root')
      try {
        await m.removeNode(el)
      } catch (err) {
        return err.message
      }
    })
    expect(delRoot).toEqual('Can not remove root node')
  })
})

afterAll(async() => {
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
