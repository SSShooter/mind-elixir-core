import { setAttributes } from '.'
import type { MindElixirInstance } from '../types'
import type { CustomSvg } from '../types/dom'
import { selectText } from './dom'

const $d = document
const svgNS = 'http://www.w3.org/2000/svg'

export const createPath = function (d: string, color: string, width: string) {
  const path = $d.createElementNS(svgNS, 'path')
  setAttributes(path, {
    d,
    stroke: color || '#666',
    fill: 'none',
    'stroke-width': width,
  })
  return path
}

export const createLinkSvg = function (klass: string) {
  const svg = $d.createElementNS(svgNS, 'svg')
  svg.setAttribute('class', klass)
  svg.setAttribute('overflow', 'visible')
  return svg
}

export const createLine = function () {
  const line = $d.createElementNS(svgNS, 'line')
  line.setAttribute('stroke', '#bbb')
  line.setAttribute('fill', 'none')
  line.setAttribute('stroke-width', '2')
  return line
}

export const createSvgGroup = function (d: string, arrowd: string): CustomSvg {
  const pathAttrs = {
    stroke: 'rgb(235, 95, 82)',
    fill: 'none',
    'stroke-linecap': 'cap',
    'stroke-width': '2',
  }
  const g = $d.createElementNS(svgNS, 'g') as CustomSvg
  const path = $d.createElementNS(svgNS, 'path')
  const arrow = $d.createElementNS(svgNS, 'path')
  setAttributes(arrow, {
    d: arrowd,
    ...pathAttrs,
  })
  setAttributes(path, {
    d,
    ...pathAttrs,
    'stroke-dasharray': '8,2',
  })

  g.appendChild(path)
  g.appendChild(arrow)
  return g
}

export const editSvgText = function (mei: MindElixirInstance, textEl: SVGTextElement, onblur: (div: HTMLDivElement) => void) {
  console.time('editSummary')
  if (!textEl) return
  const div = document.createElement('div')
  mei.nodes.appendChild(div)
  const origin = textEl.innerHTML
  div.id = 'input-box'
  div.textContent = origin
  div.contentEditable = 'true'
  div.spellcheck = false
  const l = textEl.getAttribute('x')
  const t = textEl.getAttribute('y')
  div.style.cssText = `min-width:${88}px;position:absolute;left:${l}px;top:${t}px;`
  const anchor = textEl.getAttribute('text-anchor')
  if (anchor === 'end') div.style.cssText += 'transform: translate(-100%, -100%);'
  else if (anchor === 'middle') div.style.cssText += 'transform: translate(-50%, -100%);'
  else div.style.cssText += 'transform: translate(0, -100%);'
  div.focus()

  selectText(div)

  div.addEventListener('keydown', e => {
    e.stopPropagation()
    const key = e.key

    if (key === 'Enter' || key === 'Tab') {
      // keep wrap for shift enter
      if (e.shiftKey) return

      e.preventDefault()
      div.blur()
      mei.map.focus()
    }
  })
  div.addEventListener('blur', () => {
    if (!div) return
    onblur(div)
  })
  console.timeEnd('editSummary')
}
