import { test, expect } from './mind-elixir-test'

// Four siblings under one main topic:
// outer covers children 0-3, inner covers 0-1
const data = {
  nodeData: {
    topic: 'Root Topic',
    id: 'root',
    children: [
      {
        id: 'main',
        topic: 'Main',
        children: [
          { id: 'child-1', topic: 'Child 1' },
          { id: 'child-2', topic: 'Child 2' },
          { id: 'child-3', topic: 'Child 3' },
          { id: 'child-4', topic: 'Child 4' },
        ],
      },
      { id: 'other', topic: 'Other' },
    ],
  },
}

const summaries = [
  { id: 'outer', parent: 'main', start: 0, end: 3, label: 'Outer summary' },
  { id: 'inner', parent: 'main', start: 0, end: 1, label: 'Inner summary' },
]

const getLabelBox = async (page: any, id: string) => {
  const box = await page.locator(`#label-s-${id}`).boundingBox()
  expect(box).not.toBeNull()
  return box!
}

const getBracketBox = async (page: any, id: string) => {
  const box = await page.locator(`#s-${id} path`).boundingBox()
  expect(box).not.toBeNull()
  return box!
}

test('nested summaries do not overlap on the right side', async ({ page, me }) => {
  await me.init({ ...data, direction: 1, summaries: [...summaries] })

  const innerLabel = await getLabelBox(page, 'inner')
  const outerLabel = await getLabelBox(page, 'outer')
  const outerBracket = await getBracketBox(page, 'outer')

  // outer bracket must sit to the right of the inner label
  expect(outerBracket.x).toBeGreaterThan(innerLabel.x + innerLabel.width)
  // and outer label to the right of the outer bracket
  expect(outerLabel.x).toBeGreaterThan(outerBracket.x + outerBracket.width)
})

test('nested summaries do not overlap on the left side', async ({ page, me }) => {
  await me.init({ ...data, direction: 0, summaries: [...summaries] })

  const innerLabel = await getLabelBox(page, 'inner')
  const outerLabel = await getLabelBox(page, 'outer')
  const outerBracket = await getBracketBox(page, 'outer')

  // outer bracket must sit to the left of the inner label
  expect(outerBracket.x + outerBracket.width).toBeLessThan(innerLabel.x)
  // and outer label to the left of the outer bracket
  expect(outerLabel.x + outerLabel.width).toBeLessThan(outerBracket.x)
})

test('nested summaries do not overlap in the down layout', async ({ page, me }) => {
  await me.init({ ...data, direction: 3, summaries: [...summaries] })

  const innerLabel = await getLabelBox(page, 'inner')
  const outerLabel = await getLabelBox(page, 'outer')
  const outerBracket = await getBracketBox(page, 'outer')
  const innerBracket = await getBracketBox(page, 'inner')

  // outer bracket must sit below the inner label
  expect(outerBracket.y).toBeGreaterThan(innerLabel.y + innerLabel.height)
  // outer label below the inner label as well
  expect(outerLabel.y).toBeGreaterThan(innerLabel.y + innerLabel.height)
  // inner bracket stays clear of the outer bracket
  expect(outerBracket.y).toBeGreaterThan(innerBracket.y + innerBracket.height - 1)
})

test('creating an inner summary pushes the existing outer one outward', async ({ page, me }) => {
  // start with only the outer summary, main goes to the left side in SIDE layout
  await me.init({ ...data, summaries: [summaries[0]] })
  const outerBefore = await getLabelBox(page, 'outer')
  const bracketBefore = await getBracketBox(page, 'outer')

  // select the first two children and create an inner summary through the UI
  await me.dragSelect('Child 1', 'Child 2')
  await page.getByText('Child 1', { exact: true }).click({ button: 'right', force: true })
  await page.locator('#cm-summary').click()
  await page.keyboard.press('Enter')
  await expect(page.locator('#input-box')).toBeHidden()

  // outer summary moved to the left
  const bracketAfter = await getBracketBox(page, 'outer')
  const outerAfter = await getLabelBox(page, 'outer')
  expect(bracketAfter.x).toBeLessThan(bracketBefore.x)
  expect(outerAfter.x).toBeLessThan(outerBefore.x)

  // no overlap between inner label and outer bracket
  // locate the inner summary by id from data instead of filtering by label text
  const updated = await me.getData()
  const innerSummary = updated.summaries!.find(s => s.label !== 'Outer summary')!
  const innerLabel = await getLabelBox(page, innerSummary.id)
  expect(bracketAfter.x + bracketAfter.width).toBeLessThan(innerLabel.x)
})

test('removing the inner summary pulls the outer bracket back inward', async ({ page, me }) => {
  await me.init({ ...data, direction: 1, summaries: [...summaries] })

  const outerBracketBefore = await getBracketBox(page, 'outer')

  // remove the inner summary through the public API (same path as the Delete key)
  await page.evaluate(() => (window as any)['#map'].removeSummary('inner'))

  const outerBracketAfter = await getBracketBox(page, 'outer')
  expect(outerBracketAfter.x).toBeLessThan(outerBracketBefore.x)
})

test('three levels of nesting fan out without overlap on the right side', async ({ page, me }) => {
  const threeLevels = [
    { id: 'outer', parent: 'main', start: 0, end: 3, label: 'Outer' },
    { id: 'middle', parent: 'main', start: 0, end: 2, label: 'Middle' },
    { id: 'inner', parent: 'main', start: 0, end: 1, label: 'Inner' },
  ]
  await me.init({ ...data, direction: 1, summaries: threeLevels })

  const innerBracket = await getBracketBox(page, 'inner')
  const middleBracket = await getBracketBox(page, 'middle')
  const outerBracket = await getBracketBox(page, 'outer')

  // brackets fan out: inner closest to the nodes, outer furthest away
  expect(middleBracket.x).toBeGreaterThan(innerBracket.x + innerBracket.width)
  expect(outerBracket.x).toBeGreaterThan(middleBracket.x + middleBracket.width)

  // each label sits to the right of its own bracket
  const innerLabel = await getLabelBox(page, 'inner')
  const middleLabel = await getLabelBox(page, 'middle')
  const outerLabel = await getLabelBox(page, 'outer')
  expect(innerLabel.x).toBeGreaterThan(innerBracket.x + innerBracket.width)
  expect(middleLabel.x).toBeGreaterThan(middleBracket.x + middleBracket.width)
  expect(outerLabel.x).toBeGreaterThan(outerBracket.x + outerBracket.width)
})
