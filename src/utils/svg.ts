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
  dataType: string
  svgId: string // Associated SVG element ID
}

/**
 * Create a div label for SVG elements with positioning
 */
// Helper function to calculate precise position based on actual DOM dimensions
export const calculatePrecisePosition = function (element: HTMLElement): void {
  // Get actual dimensions
  const actualWidth = element.clientWidth
  const actualHeight = element.clientHeight
  const data = element.dataset
  const x = Number(data.x)
  const y = Number(data.y)
  const anchor = data.anchor

  // Calculate position based on anchor and actual dimensions
  let adjustedX = x
  if (anchor === 'middle') {
    adjustedX = x - actualWidth / 2
  } else if (anchor === 'end') {
    adjustedX = x - actualWidth
  }

  // Set final position with actual dimensions
  element.style.left = `${adjustedX}px`
  element.style.top = `${y - actualHeight / 2}px`
  element.style.visibility = 'visible'
}

export const createLabel = function (text: string, x: number, y: number, options: SvgTextOptions): HTMLDivElement {
  const { anchor = 'middle', color, dataType, svgId } = options

  // Create label div element
  const labelDiv = document.createElement('div')
  labelDiv.className = 'svg-label'
  labelDiv.style.color = color || '#666'

  // Generate unique ID for the label
  const labelId = 'label-' + svgId
  labelDiv.id = labelId
  labelDiv.innerHTML = text

  labelDiv.dataset.type = dataType
  labelDiv.dataset.svgId = svgId
  labelDiv.dataset.x = x.toString()
  labelDiv.dataset.y = y.toString()
  labelDiv.dataset.anchor = anchor

  return labelDiv
}

/**
 * Find SVG element by label ID
 */
export const findSvgByLabelId = function (labelId: string): SVGElement | null {
  const labelEl = document.getElementById(labelId) as HTMLElement
  if (!labelEl || !labelEl.dataset.svgId) {
    return null
  }
  const svgElement = document.getElementById(labelEl.dataset.svgId)
  return svgElement as unknown as SVGElement
}

/**
 * Find label element by SVG ID
 */
export const findLabelBySvgId = function (svgId: string): HTMLDivElement | null {
  const labelEl = document.querySelector(`[data-svg-id="${svgId}"]`) as HTMLDivElement
  return labelEl
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

export const createArrowGroup = function (
  d: string,
  arrowd1: string,
  arrowd2: string,
  style?: {
    stroke?: string
    strokeWidth?: string | number
    strokeDasharray?: string
    strokeLinecap?: 'butt' | 'round' | 'square'
    opacity?: string | number
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
      stroke: style?.stroke || 'rgb(227, 125, 116)',
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

export const editSvgText = function (mei: MindElixirInstance, textEl: HTMLDivElement, node: Summary | Arrow) {
  if (!textEl) return

  // textEl is now a div element directly
  const origin = node.label

  const div = textEl.cloneNode(true) as HTMLDivElement
  mei.nodes.appendChild(div)
  div.id = 'input-box'
  div.textContent = origin
  div.contentEditable = 'plaintext-only'
  div.spellcheck = false

  div.style.cssText = `
    left:${textEl.style.left};
    top:${textEl.style.top}; 
    max-width: 200px;
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

    textEl.textContent = node.label
    // Recalculate position with new content while preserving existing color
    calculatePrecisePosition(textEl)

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
