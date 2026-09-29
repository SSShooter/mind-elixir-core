import { test, expect } from './mind-elixir-test'

/**
 * `rtl` is TEXT direction only: it puts an `rtl` class on the map container and
 * that class owns the whole override set in `src/index.css`. Branch placement is
 * a separate axis, so nothing here may assert on `.lhs` / `.rhs` geometry.
 *
 * The discriminator for "is this paragraph right-to-left" is a trailing ASCII
 * neutral: in RTL script `!` must land LEFT of the word, in an LTR paragraph it
 * lands to its RIGHT. Every rtl assertion is paired with the same assertion on a
 * default map, so a stylesheet that forced `direction: rtl` everywhere — or a
 * probe that always answered "rtl" — cannot pass.
 */

const AR_PUNCT = 'مرحبا!'
const AR_ML = 'مرحبا\nبالعالم'
/** Long enough that the topic, not the chip row, sets the node's content width. */
const AR_LONG = 'نص طويل إلى حد ما هنا'

const data = {
  nodeData: {
    topic: 'root',
    id: 'root',
    children: [
      { id: 'lhs', topic: AR_PUNCT, direction: 0 },
      { id: 'rhs', topic: AR_PUNCT, direction: 1 },
      { id: 'ml', topic: AR_ML, direction: 1 },
      { id: 'tags', topic: AR_LONG, direction: 1, tags: [AR_PUNCT, 'الثاني', 'الثالث'] },
    ],
  },
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** The `me` fixture owns `#map2` (default); `#map` is mounted here with `rtl`. */
const mountRtl = (page: any, el = '#map') =>
  page.evaluate(
    ({ el, dataStr }: { el: string; dataStr: string }) => {
      const MindElixir = (window as any).MindElixir
      const mind = new MindElixir({ el, direction: MindElixir.SIDE, keypress: true, editable: true, rtl: true })
      mind.init(JSON.parse(dataStr))
      ;(window as any)[el] = mind
    },
    { el, dataStr: JSON.stringify(data) },
  )

const classOf = (page: any, el: string) =>
  page.evaluate((el: string) => (document.querySelector(`${el} .map-container`) as HTMLElement).className, el)

/** Per-character client rects plus the resolved paragraph direction of a topic. */
const probeTopic = (page: any, el: string, id: string) =>
  page.evaluate(
    ({ el, id }: { el: string; id: string }) => {
      const tpc = (window as any)[el].findEle(id) as HTMLElement
      const n = document.createTreeWalker(tpc, NodeFilter.SHOW_TEXT).nextNode() as Text
      const chars: Array<{ left: number; right: number; top: number }> = []
      for (let i = 0; i < n.data.length; i++) {
        if (n.data[i] === '\n') continue
        const r = document.createRange()
        r.setStart(n, i)
        r.setEnd(n, i + 1)
        const b = r.getBoundingClientRect()
        chars.push({ left: b.left, right: b.right, top: b.top })
      }
      return { chars, dir: getComputedStyle(tpc).direction }
    },
    { el, id },
  )

/** Where the trailing neutral ended up relative to the word. */
const neutralSide = (chars: Array<{ left: number }>) => (chars[chars.length - 1].left < chars[0].left ? 'left' : 'right')

const linesOf = (chars: Array<{ left: number; right: number; top: number }>) => {
  const tops = [...new Set(chars.map(c => Math.round(c.top)))].sort((a, b) => a - b)
  return tops.map(t => {
    const onLine = chars.filter(c => Math.round(c.top) === t)
    return { left: Math.min(...onLine.map(c => c.left)), right: Math.max(...onLine.map(c => c.right)) }
  })
}

/** A node's tag row: direction, on-screen order, edges, and per-char x of chip 1. */
const probeTags = (page: any, el: string, id: string) =>
  page.evaluate(
    ({ el, id }: { el: string; id: string }) => {
      const tpc = (window as any)[el].findEle(id) as HTMLElement
      const tags = tpc.querySelector('.tags') as HTMLElement
      const chips = [...tags.children] as HTMLElement[]
      const box = (e: HTMLElement) => e.getBoundingClientRect()
      const cs = getComputedStyle(tpc)
      const b = box(tpc)

      // the trailing neutral inside the first chip, same trick as `probeTopic`
      const n = document.createTreeWalker(chips[0], NodeFilter.SHOW_TEXT).nextNode() as Text
      const charLefts: number[] = []
      for (let i = 0; i < n.data.length; i++) {
        const r = document.createRange()
        r.setStart(n, i)
        r.setEnd(n, i + 1)
        charLefts.push(r.getBoundingClientRect().left)
      }

      return {
        dir: getComputedStyle(tags).direction,
        chipDir: getComputedStyle(chips[0]).direction,
        dom: chips.map(c => c.textContent),
        byX: chips
          .map(c => ({ text: c.textContent ?? '', left: box(c).left }))
          .sort((a, z) => a.left - z.left)
          .map(r => r.text),
        contentLeft: b.left + parseFloat(cs.paddingLeft),
        contentRight: b.right - parseFloat(cs.paddingRight),
        minLeft: Math.min(...chips.map(c => box(c).left)),
        maxRight: Math.max(...chips.map(c => box(c).right)),
        charLefts,
      }
    },
    { el, id },
  )

test.beforeEach(async ({ me, page }) => {
  await mountRtl(page)
  await me.init(data, '#map2')
})

test('the rtl class follows the option, and only then', async ({ page }) => {
  expect((await classOf(page, '#map')).split(' ')).toContain('rtl')
  expect((await classOf(page, '#map2')).split(' ')).not.toContain('rtl')
})

test('RTL topics get a right-to-left paragraph; the default map does not', async ({ page }) => {
  // `lhs` also pins the cascade: `.lhs .me-tpc` forces `ltr` in the base sheet,
  // so the override has to outrank it — otherwise left-branch topics stay LTR.
  for (const id of ['rhs', 'lhs']) {
    const on = await probeTopic(page, '#map', id)
    expect(on.dir).toBe('rtl')
    expect(neutralSide(on.chars)).toBe('left')

    const off = await probeTopic(page, '#map2', id)
    expect(off.dir).toBe('ltr')
    expect(neutralSide(off.chars)).toBe('right')
  }
})

test('multi-line topics align to the leading edge of the paragraph', async ({ page }) => {
  const on = linesOf((await probeTopic(page, '#map', 'ml')).chars)
  expect(Math.abs(on[0].right - on[1].right)).toBeLessThan(1.5)

  const off = linesOf((await probeTopic(page, '#map2', 'ml')).chars)
  expect(Math.abs(off[0].left - off[1].left)).toBeLessThan(1.5)
})

test('the editor inherits the container direction', async ({ page }) => {
  // `#input-box` hangs off `.me-nodes`, not off the topic, and the base sheet
  // pins it to `ltr` by id — so this is its own rule, not an inheritance.
  await page.evaluate(() => {
    const mei = (window as any)['#map']
    mei.beginEdit(mei.findEle('rhs'))
  })
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('#map #input-box')!).direction)).toBe('rtl')
})

test('labels, the drag ghost and the context menu follow too', async ({ page }) => {
  const chrome = await page.evaluate(() => {
    const draw = (el: string) => {
      const m = (window as any)[el]
      m.createArrow(m.findEle('rhs'), m.findEle('lhs'))
      const tips = document.createElement('div')
      tips.className = 'tips'
      m.container.appendChild(tips)
    }
    draw('#map')
    draw('#map2')

    const dirOf = (sel: string) => getComputedStyle(document.querySelector(sel)!).direction
    const keySpan = '#map .context-menu .menu-list li span:last-child'
    return {
      hasMenu: !!document.querySelector('#map .context-menu'),
      labelRtl: dirOf('#map .svg-label'),
      labelLtr: dirOf('#map2 .svg-label'),
      ghost: dirOf('#map .mind-elixir-ghost'),
      tips: dirOf('#map .tips'),
      menuItem: dirOf('#map .context-menu .menu-list li'),
      keySpan: dirOf(keySpan),
      keyFloat: getComputedStyle(document.querySelector(keySpan)!).float,
    }
  })

  expect(chrome.hasMenu).toBe(true)
  expect(chrome.labelRtl).toBe('rtl')
  expect(chrome.labelLtr).toBe('ltr')
  expect(chrome.ghost).toBe('rtl')
  expect(chrome.tips).toBe('rtl')
  expect(chrome.menuItem).toBe('rtl')
  // The shortcut hint is a Latin binding: it keeps reading LTR and moves to the
  // leading edge, where `float: right` used to park it.
  expect(chrome.keySpan).toBe('ltr')
  expect(chrome.keyFloat).toBe('left')
})

test('offsets pinned to the left flip, leaving the default map alone', async ({ page }) => {
  const offsets = await page.evaluate(() => {
    const read = (root: string) => {
      const tpc = document.querySelector(`${root} .me-tpc`) as HTMLElement
      const icons = document.createElement('span')
      icons.className = 'icons'
      icons.innerHTML = '<span>i</span>'
      const link = document.createElement('a')
      link.className = 'hyper-link'
      link.textContent = 'x'
      tpc.append(icons, link)
      const box = (el: HTMLElement) => {
        const s = getComputedStyle(el)
        return { left: s.marginLeft, right: s.marginRight }
      }
      return { icons: box(icons), link: box(link) }
    }
    return { rtl: read('#map'), ltr: read('#map2') }
  })

  expect(offsets.rtl.icons).toEqual({ left: '0px', right: '5px' })
  expect(offsets.rtl.link.left).toBe('0px')
  expect(offsets.ltr.icons).toEqual({ left: '5px', right: '0px' })
  expect(offsets.ltr.link.right).toBe('0px')
})

test('the tag row is read right-to-left and starts at the leading edge', async ({ page }) => {
  // The base sheet pins `.tags` to `ltr` (a row of chips used to be treated as
  // decoration, not text). Without the override the row hangs off the trailing
  // edge while the topic sits on the leading one.
  const on = await probeTags(page, '#map', 'tags')
  expect(on.dir).toBe('rtl')
  expect(on.chipDir).toBe('rtl')
  // DOM order is the data order on both maps; only the reading order changes.
  expect(on.byX).toEqual([...on.dom].reverse())
  // `abs` on purpose: the row is flush with the leading edge, so the chip margin
  // has to be mirrored too — the base `margin-right` would leave 4px on that
  // side and this only catches it if the gap is allowed to be negative.
  expect(Math.abs(on.maxRight - on.contentRight)).toBeLessThan(2.5)
  // guard: the row has to be narrower than the topic, or "flush" would be vacuous
  expect(on.minLeft - on.contentLeft).toBeGreaterThan(12)

  const off = await probeTags(page, '#map2', 'tags')
  expect(off.dir).toBe('ltr')
  expect(off.chipDir).toBe('ltr')
  expect(off.byX).toEqual(off.dom)
  expect(Math.abs(off.minLeft - off.contentLeft)).toBeLessThan(2.5)
  expect(off.contentRight - off.maxRight).toBeGreaterThan(12)
})

test('a chip is text too, so its own paragraph follows the direction', async ({ page }) => {
  const on = await probeTags(page, '#map', 'tags')
  expect(on.charLefts[on.charLefts.length - 1]).toBeLessThan(on.charLefts[0])

  const off = await probeTags(page, '#map2', 'tags')
  expect(off.charLefts[off.charLefts.length - 1]).toBeGreaterThan(off.charLefts[0])
})
