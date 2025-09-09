import { setAttributes } from '.'
import type { Arrow } from '../arrow'
import type { Summary } from '../summary'
import type { MindElixirInstance } from '../types'
import type { CustomSvg } from '../types/dom'
import { selectText } from './dom'

const $d = document
export const svgNS = 'http://www.w3.org/2000/svg'

export interface SvgTextOptions {
  anchor?: 'start' | 'middle' | 'end'
  color?: string
  dataType?: string
}

/**
 * Create an SVG text element with common attributes
 */
export const createSvgText = function (text: string, x: number, y: number, options: SvgTextOptions = {}): SVGTextElement {
  const { anchor = 'middle', color, dataType } = options

  const textElement = document.createElementNS(svgNS, 'text')
  setAttributes(textElement, {
    'text-anchor': anchor,
    x: x + '',
    y: y + '',
    fill: color || (anchor === 'middle' ? 'rgb(235, 95, 82)' : '#666'),
  })

  if (dataType) {
    textElement.dataset.type = dataType
  }

  textElement.innerHTML = text
  return textElement
}

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
  line.setAttribute('stroke', '#4dc4ff')
  line.setAttribute('fill', 'none')
  line.setAttribute('stroke-width', '2')
  line.setAttribute('opacity', '0.45')
  return line
}

export const createSvgGroup = function (
  d: string,
  arrowd1: string,
  arrowd2: string,
  style?: {
    stroke?: string
    strokeWidth?: string | number
    strokeDasharray?: string
    strokeLinecap?: 'butt' | 'round' | 'square'
    opacity?: string | number
    labelColor?: string
  }
): CustomSvg {
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
    const attrs: { [key: string]: string } = {
      d,
      stroke: style?.stroke || 'rgb(235, 95, 82)',
      fill: 'none',
      'stroke-linecap': style?.strokeLinecap || 'cap',
      'stroke-width': String(style?.strokeWidth || '2'),
    }

    if (style?.opacity !== undefined) {
      attrs['opacity'] = String(style.opacity)
    }

    setAttributes(path, attrs)

    if (i === 0) {
      // Apply stroke-dasharray to the main line
      path.setAttribute('stroke-dasharray', style?.strokeDasharray || '8,2')
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
      mei.container.focus()
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
