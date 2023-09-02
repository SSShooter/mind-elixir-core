import type { MindElixirInstance, Topic } from '.'
import { generateUUID, getOffsetLT } from './utils'
import { findEle, selectText } from './utils/dom'

export type Summary = {
  id: string
  text: string
  start: string
  end: string
}

export type SummarySvgGroup = SVGGElement & {
  summaryObj: Summary
}

const calcRange = function (currentNodes: Topic[]) {
  let maxLen = 0
  const parentChains = currentNodes.map(item => {
    let node = item.nodeObj
    const parentChain = []
    while (node.parent) {
      const parent = node.parent
      const siblings = parent.children
      const index = siblings?.indexOf(node)
      node = parent
      parentChain.unshift({ node, index })
    }
    if (parentChain.length > maxLen) maxLen = parentChain.length
    return parentChain
  })
  let index = 0
  findMcp: for (; index < maxLen; index++) {
    const base = parentChains[0][index]?.node
    console.log(base)
    for (let i = 1; i < parentChains.length; i++) {
      const parentChain = parentChains[i]
      if (parentChain[index]?.node !== base) {
        break findMcp
      }
    }
  }
  // minimum common parent
  const range = parentChains.map(chain => chain[index - 1].index).sort()
  console.log(parentChains, 'parentChains')
  const min = range[0] || 0
  const max = range[range.length - 1] || 0
  const parent = parentChains[0][index - 1].node

  const start = parent.children![min].id
  const end = parent.children![max].id
  return {
    start,
    end,
  }
}

const creatGroup = function (id: string) {
  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SummarySvgGroup
  group.setAttribute('id', id)
  return group
}

const createPath = function (d: string, color?: string) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', d)
  path.setAttribute('stroke', color || '#666')
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('stroke-width', '2')
  return path
}

const createText = function (string: string, x: number, y: number, anchor: 'start' | 'end') {
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  text.innerHTML = string
  text.setAttribute('text-anchor', anchor)
  text.setAttribute('x', x)
  text.setAttribute('y', y)
  return text
}

const getWrapper = (id: string) => findEle(id).parentElement.parentElement

const drawSummary = function (mei: MindElixirInstance, summary: Summary) {
  const { id, text: summaryText, start, end } = summary
  const parentTpc = mei.nodes
  const startWrapper = getWrapper(start)
  const endWrapper = getWrapper(end)
  const side = startWrapper.closest('me-main')?.className as 'lhs' | 'rls'
  const { offsetLeft: sL, offsetTop: sT } = getOffsetLT(parentTpc, startWrapper)
  const { offsetLeft: eL, offsetTop: eT } = getOffsetLT(parentTpc, endWrapper)
  console.log({ sL, sT, eL, eT })
  let path
  let text
  const top = sT + 10
  const bottom = eT + endWrapper.offsetHeight + 10
  const md = (top + bottom) / 2
  if (side === 'lhs') {
    const left = Math.min(sL, eL)
    path = createPath(`M ${left + 10} ${top} c -5 0 -10 5 -10 10 L ${left} ${bottom - 10} c 0 5 5 10 10 10 M ${left} ${md} h -10`)
    text = createText(summaryText, left - 20, md + 6, 'end')
  } else {
    const right = sL + Math.max(startWrapper.offsetWidth, endWrapper.offsetWidth)
    path = createPath(`M ${right - 10} ${top} c 5 0 10 5 10 10 L ${right} ${bottom - 10} c 0 5 -5 10 -10 10 M ${right} ${md} h 10`)
    text = createText(summaryText, right + 20, md + 6, 'start')
  }
  const group = creatGroup('s-' + id)
  group.appendChild(path)
  group.appendChild(text)
  group.summaryObj = summary
  mei.summarySvg.appendChild(group)
}

export const createSummary = function (this: MindElixirInstance) {
  if (!this.currentNodes) return
  const { start, end } = calcRange(this.currentNodes)
  const summary = { id: generateUUID(), start, end, text: 'summary!' }
  drawSummary(this, summary)
  this.summaries.push(summary)
}

export const removeSummary = function (this: MindElixirInstance, id: string) {
  const index = this.summaries.findIndex(summary => summary.id === id)
  if (index > -1) {
    this.summaries.splice(index, 1)
    document.querySelector('#s-' + id)?.remove()
  }
}

export const renderSummary = function (this: MindElixirInstance) {
  this.summarySvg.innerHTML = ''
  this.summaries.forEach(summary => {
    drawSummary(this, summary)
  })
  this.nodes.insertAdjacentElement('beforeend', this.summarySvg)
}

const getDirection = function (id: string) {
  return findEle(id).closest('me-main')?.className as 'lhs' | 'rls'
}

export const editSummary = function (this: MindElixirInstance, el: SummarySvgGroup) {
  console.time('editSummary')
  if (!el) return
  const textEl = el.childNodes[1] as SVGTextElement
  const div = document.createElement('div')
  this.nodes.appendChild(div)
  const origin = textEl.innerHTML
  div.id = 'input-box'
  div.textContent = origin
  div.contentEditable = 'true'
  div.spellcheck = false
  const l = textEl.getAttribute('x') + 'px'
  const t = textEl.getAttribute('y') + 'px'
  div.style.cssText = `min-width:${100 - 8}px;position:absolute;left:${l};top:${t};`
  if (getDirection(el.summaryObj.start) === 'lhs') div.style.cssText += 'transform: translate(-100%, -100%);'
  else div.style.cssText += 'transform: translate(0, -100%);'
  div.focus()

  selectText(div)
  this.inputDiv = div

  div.addEventListener('keydown', e => {
    e.stopPropagation()
    const key = e.key

    if (key === 'Enter' || key === 'Tab') {
      // keep wrap for shift enter
      if (e.shiftKey) return

      e.preventDefault()
      this.inputDiv?.blur()
      this.map.focus()
    }
  })
  div.addEventListener('blur', () => {
    if (!div) return
    const node = el.summaryObj
    const text = div.textContent?.trim() || ''
    console.log(text)
    if (text === '') node.text = origin
    else node.text = text
    div.remove()
    // memory leak?
    this.inputDiv = null
    // debugger
    if (text === origin) return
    textEl.innerHTML = node.text
    this.linkDiv()
    // this.bus.fire('operation', {
    //   name: 'finishEdit',
    //   obj: node,
    //   origin,
    // })
  })
  console.timeEnd('editSummary')
}
