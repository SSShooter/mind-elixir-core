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
  width?: number
  fontSize?: string
  fontFamily?: string
}

/**
 * Calculate auto height for text content
 */
const calculateAutoHeight = function (div: HTMLDivElement, width: number): number {
  // Temporarily add to DOM to measure height
  div.style.position = 'absolute'
  div.style.visibility = 'hidden'
  div.style.width = width - 4 + 'px'
  div.style.height = 'auto'
  document.body.appendChild(div)
  const measuredHeight = div.offsetHeight
  document.body.removeChild(div)

  // Reset styles
  div.style.position = ''
  div.style.visibility = ''
  div.style.width = '100%'

  return measuredHeight
}

/**
 * Create an SVG foreignObject with HTML div for text with auto-wrapping
 */
export const createSvgText = function (text: string, x: number, y: number, options: SvgTextOptions = {}): SVGForeignObjectElement {
  const { anchor = 'middle', color, dataType, width = 200, fontSize = '14px', fontFamily = 'Arial, sans-serif' } = options

  // Create foreignObject element
  const foreignObject = document.createElementNS(svgNS, 'foreignObject')

  // Create HTML div inside foreignObject
  const div = document.createElement('div')
  div.style.cssText = `
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: ${anchor === 'start' ? 'flex-start' : anchor === 'end' ? 'flex-end' : 'center'};
    font-size: ${fontSize};
    font-family: ${fontFamily};
    color: ${color || (anchor === 'middle' ? 'rgb(235, 95, 82)' : '#666')};
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
    line-height: 1.2;
    padding: 2px;
    box-sizing: border-box;
  `

  div.innerHTML = text

  // Calculate actual height using auto height
  const actualHeight = calculateAutoHeight(div, width)

  // Calculate position based on anchor
  let adjustedX = x
  if (anchor === 'middle') {
    adjustedX = x - width / 2
  } else if (anchor === 'end') {
    adjustedX = x - width
  }

  setAttributes(foreignObject, {
    x: adjustedX + '',
    y: y - actualHeight / 2 + '', // Center vertically with actual height
    width: width + '',
    height: actualHeight + '',
  })

  if (dataType) {
    foreignObject.dataset.type = dataType
  }

  // Store autoHeight configuration for later use in editing
  foreignObject.dataset.autoHeight = 'true'

  foreignObject.appendChild(div)

  return foreignObject
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

export const editSvgText = function (mei: MindElixirInstance, textEl: SVGForeignObjectElement, node: Summary | Arrow) {
  console.time('editSummary')
  if (!textEl) return

  // Get the inner div element from foreignObject
  const innerDiv = textEl.querySelector('div') as HTMLDivElement
  const origin = innerDiv.innerHTML

  const div = $d.createElement('div')
  mei.nodes.appendChild(div)
  div.id = 'input-box'
  div.innerHTML = origin // Use innerHTML to preserve formatting
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
    background: white;
    border: 1px solid #ccc;
    border-radius: 2px;
    font-size: 14px;
    font-family: Arial, sans-serif;
    line-height: 1.2;
    word-wrap: break-word;
    overflow-wrap: break-word;
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
    const text = div.innerHTML?.trim() || ''
    if (text === '') node.label = origin
    else node.label = text
    div.remove()
    if (text === origin) return

    innerDiv.innerHTML = node.label

    // Calculate new height using the shared function
    const currentHeight = parseFloat(textEl.getAttribute('height') || '50')
    const newHeight = innerDiv.clientHeight

    if (newHeight !== currentHeight) {
      // Update foreignObject height
      textEl.setAttribute('height', newHeight + '')

      // Recalculate y position to keep centered
      const currentY = parseFloat(textEl.getAttribute('y') || '0')
      const centerY = currentY + currentHeight / 2
      const newY = centerY - newHeight / 2
      textEl.setAttribute('y', newY + '')
    }

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
