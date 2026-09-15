import { expect, test } from './mind-elixir-test'

/**
 * Parity harness for `mei.diffRefresh`.
 *
 * Two instances of the same document take the same operations. One undoes/redoes
 * through `diffRefresh` (the patched path), the other through `refresh` (the
 * rebuild path, i.e. the behaviour every existing host already relies on). After
 * every undo and every redo the two must be **indistinguishable**: same exported
 * data, same node DOM, same lines / arrows / summaries / labels, same viewport
 * transform, and the same public bus events.
 *
 * The point is not "the diff is correct" — `tree-patch.spec.ts` proves that — but
 * "the diff is not observably a different feature". Anything `refresh` does that
 * `diffRefresh` forgets (a side effect, an event, a cleanup) shows up here.
 */

const baseData = {
  nodeData: {
    id: 'root',
    topic: 'Root',
    children: [
      {
        id: 'm1',
        topic: 'M1',
        children: [
          { id: 'c1', topic: 'C1' },
          { id: 'c2', topic: 'C2', style: { color: '#123456' }, tags: ['tag'] },
          { id: 'c3', topic: 'C3', children: [{ id: 'g1', topic: 'G1' }] },
        ],
      },
      // Collapsed with children: exercises every op that targets a node with no
      // DOM element of its own.
      { id: 'm2', topic: 'M2', expanded: false, children: [{ id: 'h1', topic: 'H1' }] },
      { id: 'm3', topic: 'M3', icons: ['🔥'], hyperLink: 'https://example.com' },
    ],
  },
  arrows: [{ id: 'a1', label: 'to M3', from: 'm1', to: 'm3' }],
  summaries: [{ id: 's1', label: 'group', parent: 'root', start: 0, end: 1 }],
  meta: { name: 'parity' },
}

test('diffRefresh is observably equivalent to refresh', async ({ page, me }) => {
  await me.goto()

  const report = await page.evaluate(async (dataStr: string) => {
    const MindElixir = (window as any).MindElixir
    const make = async (selector: string) => {
      const mind = new MindElixir({
        el: selector,
        direction: MindElixir.SIDE,
        allowUndo: true,
        keypress: true,
        editable: true,
      })
      await mind.init(JSON.parse(dataStr))
      return mind
    }

    const fast = await make('#map')
    const slow = await make('#map2')

    if (typeof fast.diffRefresh !== 'function') return { error: 'mei.diffRefresh was not installed by init()' }

    // Count the calls that go through the patched path, so a run where the fast
    // path never ran cannot pass silently.
    let diffCalls = 0
    let fallbackCalls = 0
    const original = fast.diffRefresh
    fast.diffRefresh = function (this: any, data: any) {
      diffCalls++
      const handled: boolean = original.call(this, data)
      if (!handled) fallbackCalls++
      return handled
    }
    // Force the legacy path on the control instance.
    slow.diffRefresh = undefined

    const counters: Record<string, Record<string, number>> = { fast: {}, slow: {} }
    const EVENTS = [
      'refresh',
      'selectNodes',
      'unselectNodes',
      // `restore` re-selects the target of the step it just replayed, arrows and
      // summaries included, so the link selection is part of what the two paths
      // have to agree on.
      'selectArrow',
      'unselectArrow',
      'selectSummary',
      'unselectSummary',
      'linkDiv',
      'operation',
    ]
    for (const name of EVENTS) {
      counters.fast[name] = 0
      counters.slow[name] = 0
      fast.bus.addListener(name, () => counters.fast[name]++)
      slow.bus.addListener(name, () => counters.slow[name]++)
    }

    const svgInner = (m: any, cls: string) => (m.map.querySelector(`svg.${cls}`)?.innerHTML ?? '')
    // Selecting an arrow mounts the bezier controller inside `.me-nodes`, and
    // `layout()`'s rebuild drops it again on the next `refresh` — so once an
    // arrow has been selected, the two paths hold those three elements in
    // different places. They are `display: none` either way and are never read
    // back through the DOM (the instance keeps its own references), so where
    // they happen to sit is normalized out rather than pinned.
    const stripController = (html: string) =>
      html.replace(/<svg class="linkcontroller"[\s\S]*?<\/svg>|<div class="circle"[^>]*><\/div>/g, '')
    const snapshot = (m: any) => {
      // Summaries get a generated id per instance, so the two maps never agree on
      // it — and an id is not what is being compared. Every id this instance
      // generated is folded to a placeholder. (`s1` comes from the fixture.)
      const generated = (m.summaries || []).map((s: any) => s.id).filter((id: string) => id !== 's1')
      return generated
        .reduce((text: string, id: string) => text.split(id).join('#generated#'), JSON.stringify({
          data: m.getData(),
          nodes: stripController(m.map.querySelector('.me-nodes')!.innerHTML),
          lines: svgInner(m, 'lines'),
          summaries: svgInner(m, 'summary'),
          arrows: svgInner(m, 'topiclinks'),
          labels: m.map.querySelector('.label-container')!.innerHTML,
          transform: m.map.style.transform,
          selected: (m.currentNodes || []).map((n: any) => n.nodeObj.id),
          // The link selection is not in `currentNodes`, and it is what makes a
          // replayed arrow / summary step visible on screen.
          selectedArrow: m.currentArrow?.arrowObj?.id ?? null,
          selectedSummary: m.currentSummary?.summaryObj?.id ?? null,
        }))
    }

    const mismatches: string[] = []
    let firstDiff: { where: string; fast: any; slow: any } | null = null

    const compare = (where: string) => {
      const a = snapshot(fast)
      const b = snapshot(slow)
      if (a !== b) {
        mismatches.push(where)
        if (!firstDiff) {
          const pa = JSON.parse(a)
          const pb = JSON.parse(b)
          const differing = Object.keys(pa).filter(key => JSON.stringify(pa[key]) !== JSON.stringify(pb[key]))
          firstDiff = {
            where,
            fast: Object.fromEntries(differing.map(k => [k, pa[k]])),
            slow: Object.fromEntries(differing.map(k => [k, pb[k]])),
          }
        }
      }
      for (const name of EVENTS) {
        const a = counters.fast[name]
        const b = counters.slow[name]
        if (a !== b) mismatches.push(`${where} — ${name} fired ${a}x vs ${b}x`)
      }
    }

    const resetCounters = () => {
      for (const name of EVENTS) {
        counters.fast[name] = 0
        counters.slow[name] = 0
      }
    }

    const operations: Array<[string, (m: any) => unknown]> = [
      ['addChild on a main node', m => m.addChild(m.findEle('m3'), { id: 'x1', topic: 'X1' })],
      ['removeNodes a styled leaf', m => m.removeNodes([m.findEle('c2')])],
      ['moveNodesIn under another main node', m => m.moveNodesIn([m.findEle('c1')], m.findEle('m3'))],
      ['moveNodesBefore across parents', m => m.moveNodesBefore([m.findEle('g1')], m.findEle('c1'))],
      ['reshapeNode style + topic', m => m.reshapeNode(m.findEle('m3'), { style: { background: '#ffee00' }, topic: 'M3 edited' })],
      // NOT a tracked operation: `setNodeTopic` mutates the topic and the DOM but
      // never fires `operation`, so it records no history entry (the library's own
      // outliner uses `reshapeNode` for this reason). The documented consequence
      // is that the *next* operation's snapshot predates it, so undoing that
      // operation also reverts this edit. That is what the diff has to reproduce:
      // a topic change made outside the history has to come back correctly.
      ['setNodeTopic (untracked — reverted by the next undo)', m => m.setNodeTopic(m.findEle('c3'), 'C3 edited')],
      // A `note` edit touches no rendered field.
      ['reshapeNode note only', m => m.reshapeNode(m.findEle('g1'), { note: 'hello' })],
      ['insertSibling', m => m.insertSibling('after', m.findEle('g1'), { id: 'x2', topic: 'X2' })],
      // The "rescue" shape: a new parent is inserted around an existing node, so
      // undoing has to pull the child back out before dropping the parent.
      ['insertParent', m => m.insertParent(m.findEle('c3'), { id: 'p1', topic: 'P1' })],
      ['expandNode a collapsed node', m => m.expandNode(m.findEle('m2'), true)],
      ['collapseNode it again', m => m.expandNode(m.findEle('m2'), false)],
      ['addChild under a visible node', m => m.addChild(m.findEle('m1'), { id: 'x3', topic: 'X3' })],
      ['removeNodes the node added above', m => m.removeNodes([m.findEle('x3')])],
      // Collapsing a subtree hides every descendant; its undo re-materialises
      // them from the live data rather than from the snapshot.
      ['collapseNode a whole subtree', m => m.expandNode(m.findEle('m1'), false)],
      ['expandNode it back open', m => m.expandNode(m.findEle('m1'), true)],
      // Root-level reordering. `layout()` puts m1 and m3 on the left and m2 on the
      // right, so the render order and the data order already disagree — this is
      // the case where "insert before the data anchor" and "insert before the DOM
      // anchor" are different instructions.
      ['moveNodesAfter a main node past its same-side sibling', m => m.moveNodesAfter([m.findEle('m1')], m.findEle('m3'))],
      ['moveNodesBefore a main node ahead of its same-side sibling', m => m.moveNodesBefore([m.findEle('m1')], m.findEle('m3'))],
      // …and the one that changes the node's side. `moveNodeObj` copies the
      // destination's side, so this is a `direction` change: the diff must refuse
      // it and hand the whole document to `refresh`.
      ['moveNodesBefore a main node across sides', m => m.moveNodesBefore([m.findEle('m2')], m.findEle('m3'))],
      // ---- link layer: nothing inside `nodeData` moves ----------------------
      // Arrows and summaries live outside the node tree, so these ops diff to an
      // EMPTY op list. That is the case where "there is nothing to patch" must
      // not be read as "there is nothing to redraw": the drawn curve / bracket /
      // label is the whole visible result of the operation.
      ['reshapeArrow control point', m => m.reshapeArrow(m.arrows[0], { delta1: { x: 150, y: 80 } })],
      ['reshapeArrow label + style', m => m.reshapeArrow(m.arrows[0], { label: 'A1 relabelled', style: { stroke: '#ff0066' } })],
      [
        'createSummaryFrom',
        // `createSummary()` would also start an inline label edit, and two
        // instances share one `document.activeElement`: the second one's
        // `selectText` blurs the first one's input box mid-compare. The
        // data+render path is what this harness is about, so the summary is
        // created without entering edit mode.
        m => m.createSummaryFrom({ parent: 'm3', start: 3, end: 3, label: 'generated' }),
      ],
      ['removeSummary', m => m.removeSummary(m.summaries[0].id)],
    ]

    // Baseline parity: both instances must already be indistinguishable before
    // a single operation runs, otherwise every later comparison is noise.
    resetCounters()
    compare('after init')

    /** Which restore calls degraded to `refresh`, and how many times each did. */
    const fallbacks: Record<string, number> = {}
    const countFallbacks = (label: string, before: number) => {
      const n = fallbackCalls - before
      if (n) fallbacks[label] = n
    }

    for (const [label, run] of operations) {
      resetCounters()
      try {
        await run(fast)
        await run(slow)
      } catch (error) {
        mismatches.push(`${label} — applying threw ${error}`)
        continue
      }

      compare(`${label} / applied`)

      resetCounters()
      let mark = fallbackCalls
      fast.undo()
      slow.undo()
      countFallbacks(`${label} / undo`, mark)
      compare(`${label} / undo`)

      resetCounters()
      mark = fallbackCalls
      fast.redo()
      slow.redo()
      countFallbacks(`${label} / redo`, mark)
      compare(`${label} / redo`)
    }

    return { error: null, mismatches, firstDiff, diffCalls, fallbacks, opCount: operations.length }
  }, JSON.stringify(baseData))

  expect(report.error).toBeNull()
  expect(report.mismatches, JSON.stringify(report.firstDiff)).toEqual([])
  // Guard: the fast path really was taken (otherwise this test only proves that
  // `refresh` equals itself).
  expect(report.diffCalls).toBeGreaterThanOrEqual(report.opCount * 2)
  // …and it rarely gave up. This is the sharp end of the guard: parity would hold
  // trivially if every call fell back to `refresh`, so the list of degradations
  // is pinned exactly. Today the only op the diff cannot express is the one that
  // flips a node's side — `moveNodeObj` copies the destination's `direction`, so
  // undoing it (and redoing it) is a `direction` change.
  expect(report.fallbacks).toEqual({
    'moveNodesBefore a main node across sides / undo': 1,
    'moveNodesBefore a main node across sides / redo': 1,
  })
})

test('the parity harness can fail', async ({ page, me }) => {
  await me.goto()

  // Positive control for the test above: a `diffRefresh` that does nothing but
  // the cheap side effects MUST be caught. Without this, a harness that compares
  // two identical things would pass forever.
  const report = await page.evaluate(async (dataStr: string) => {
    const MindElixir = (window as any).MindElixir
    const make = async (selector: string) => {
      const mind = new MindElixir({ el: selector, direction: MindElixir.SIDE, allowUndo: true, keypress: true, editable: true })
      await mind.init(JSON.parse(dataStr))
      return mind
    }
    const fast = await make('#map')
    const slow = await make('#map2')
    slow.diffRefresh = undefined

    // A broken fast path: mirrors the side effects but never applies the diff.
    fast.diffRefresh = function (this: any) {
      this.clearSelection()
      this.bus.fire('refresh')
      return true
    }

    const snapshot = (m: any) => JSON.stringify({ data: m.getData(), nodes: m.map.querySelector('.me-nodes')!.innerHTML })

    await fast.addChild(fast.findEle('m3'), { id: 'x1', topic: 'X1' })
    await slow.addChild(slow.findEle('m3'), { id: 'x1', topic: 'X1' })
    fast.undo()
    slow.undo()

    return { equal: snapshot(fast) === snapshot(slow), unchanged: JSON.stringify(fast.getData()) === JSON.stringify(slow.getData()) }
  }, JSON.stringify(baseData))

  expect(report.equal).toBe(false)
})

test('a resync candidate falls back to refresh and stays correct', async ({ page, me }) => {
  await me.goto()

  const report = await page.evaluate(async (dataStr: string) => {
    const MindElixir = (window as any).MindElixir
    const mind = new MindElixir({ el: '#map', direction: MindElixir.SIDE, allowUndo: true, keypress: true, editable: true })
    await mind.init(JSON.parse(dataStr))

    // A target with a different root — the one change that must not be patched.
    const foreign = JSON.parse(dataStr)
    foreign.nodeData = { id: 'other', topic: 'Other root' }
    const handled = mind.diffRefresh(foreign)

    return { handled, rootId: mind.getData().nodeData.id, domRoot: mind.map.querySelector('.me-tpc')!.dataset.nodeid }
  }, JSON.stringify(baseData))

  expect(report.handled).toBe(false)
  expect(report.rootId).toBe('other')
  expect(report.domRoot).toBe('meother')
})
