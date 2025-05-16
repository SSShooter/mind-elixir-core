import { setAttributes } from '.'
import type { Arrow } from '../arrow'
import type { Summary } from '../summary'
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

export const createSvgGroup = function (d: string, arrowd1: string, arrowd2: string): CustomSvg {
  const g = $d.createElementNS(svgNS, 'g') as CustomSvg
  const svgs = [
    {
      name: 'line',
      d,
    },
    {
      name: 'arrow1',
      d: arrowd1,
    },
    {
      name: 'arrow2',
      d: arrowd2,
    },
  ] as const
  svgs.forEach((item, i) => {
    const d = item.d
    const path = $d.createElementNS(svgNS, 'path')
    const attrs = {
      d,
      stroke: 'rgb(235, 95, 82)',
      fill: 'none',
      'stroke-linecap': 'cap',
      'stroke-width': '2',
    }
    setAttributes(path, attrs)
    if (i === 0) {
      path.setAttribute('stroke-dasharray', '8,2')
    }
    const hotzone = $d.createElementNS(svgNS, 'path')
    const hotzoneAttrs = {
      d,
      stroke: 'transparent',
      fill: 'none',
      'stroke-width': '15',
    }
    setAttributes(hotzone, hotzoneAttrs)
    g.appendChild(hotzone)

    g.appendChild(path)
    g[item.name] = path
  })
  return g
}

export const editSvgText = function (mei: MindElixirInstance, textEl: SVGTextElement, node: Summary | Arrow) {
  console.time('editSummary')
  if (!textEl) return
  const div = $d.createElement('div')
  mei.nodes.appendChild(div)
  const origin = textEl.innerHTML
  div.id = 'input-box'
  div.textContent = origin
  div.contentEditable = 'plaintext-only'
  div.spellcheck = false
  const bbox = textEl.getBBox()
  console.log(bbox)
  div.style.cssText = `
    min-width:${Math.max(88, bbox.width)}px;
    position:absolute;
    left:${bbox.x}px;
    top:${bbox.y}px;
    padding: 2px 4px;
    margin: -2px -4px; 
  `
  selectText(div)
  mei.scrollIntoView(div)

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
    const text = div.textContent?.trim() || ''
    if (text === '') node.label = origin
    else node.label = text
    div.remove()
    if (text === origin) return
    textEl.innerHTML = node.label
    mei.linkDiv()

    if ('parent' in node) {
      mei.bus.fire('operation', {
        name: 'finishEditSummary',
        obj: node,
      })
    } else {
      mei.bus.fire('operation', {
        name: 'finishEditArrowLabel',
        obj: node,
      })
    }
  })
}
