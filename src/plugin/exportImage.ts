import type { Topic } from '../types/dom'
import type { MindElixirInstance } from '../types'
import { setAttributes } from '../utils'
import { getOffsetLT } from '../utils'

function createSvgDom(height: string, width: string) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  setAttributes(svg, {
    version: '1.1',
    xmlns: 'http://www.w3.org/2000/svg',
    height,
    width,
  })
  return svg
}

function lineHightToPadding(lineHeight: string, fontSize: string) {
  return (parseInt(lineHeight) - parseInt(fontSize)) / 2
}

function generateSvgText(tpc: HTMLElement, tpcStyle: CSSStyleDeclaration, x: number, y: number) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  const content = tpc.childNodes[0].textContent
  const lines = content!.split('\n')
  lines.forEach((line, index) => {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
    setAttributes(text, {
      x: x + parseInt(tpcStyle.paddingLeft) + '',
      y:
        y +
        parseInt(tpcStyle.paddingTop) +
        lineHightToPadding(tpcStyle.lineHeight, tpcStyle.fontSize) * (index + 1) +
        parseFloat(tpcStyle.fontSize) * (index + 1) +
        '',
      'text-anchor': 'start',
      'font-family': tpcStyle.fontFamily,
      'font-size': `${tpcStyle.fontSize}`,
      'font-weight': `${tpcStyle.fontWeight}`,
      fill: `${tpcStyle.color}`,
    })
    text.innerHTML = line
    g.appendChild(text)
  })
  return g
}

function generateSvgTextUsingForeignObject(tpc: HTMLElement, tpcStyle: CSSStyleDeclaration, x: number, y: number) {
  const content = tpc.childNodes[0].textContent!
  const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
  setAttributes(foreignObject, {
    x: x + parseInt(tpcStyle.paddingLeft) + '',
    y: y + parseInt(tpcStyle.paddingTop) + '',
    width: tpcStyle.width,
    height: tpcStyle.height,
  })
  const div = document.createElement('div')
  setAttributes(div, {
    xmlns: 'http://www.w3.org/1999/xhtml',
    style: `font-family: ${tpcStyle.fontFamily}; font-size: ${tpcStyle.fontSize}; font-weight: ${tpcStyle.fontWeight}; color: ${tpcStyle.color};`,
  })
  div.innerHTML = content
  foreignObject.appendChild(div)
  return foreignObject
}

function convertDivToSvg(mei: MindElixirInstance, tpc: HTMLElement, useForeignObject = false) {
  const tpcStyle = getComputedStyle(tpc)
  const { offsetLeft: x, offsetTop: y } = getOffsetLT(mei.nodes, tpc)

  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  setAttributes(bg, {
    x: x + '',
    y: y + '',
    rx: tpcStyle.borderRadius,
    ry: tpcStyle.borderRadius,
    width: tpcStyle.width,
    height: tpcStyle.height,
    fill: tpcStyle.backgroundColor,
    stroke: tpcStyle.borderColor,
    'stroke-width': tpcStyle.borderWidth,
  })
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  g.appendChild(bg)
  let text: SVGGElement | null
  if (useForeignObject) {
    text = generateSvgTextUsingForeignObject(tpc, tpcStyle, x, y)
  } else text = generateSvgText(tpc, tpcStyle, x, y)
  g.appendChild(text)
  return g
}

function convertAToSvg(mei: MindElixirInstance, a: HTMLAnchorElement) {
  const aStyle = getComputedStyle(a)
  const { offsetLeft: x, offsetTop: y } = getOffsetLT(mei.nodes, a)
  const svgA = document.createElementNS('http://www.w3.org/2000/svg', 'a')
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  setAttributes(text, {
    x: x + '',
    y: y + parseInt(aStyle.fontSize) + '',
    'text-anchor': 'start',
    'font-family': aStyle.fontFamily,
    'font-size': `${aStyle.fontSize}`,
    'font-weight': `${aStyle.fontWeight}`,
    fill: `${aStyle.color}`,
  })
  text.innerHTML = a.textContent!
  svgA.appendChild(text)
  svgA.setAttribute('href', a.href)
  return svgA
}

const padding = 100

const head = `<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`

const generateSvg = (mei: MindElixirInstance) => {
  const mapDiv = mei.nodes
  const height = mapDiv.offsetHeight + padding * 2
  const width = mapDiv.offsetWidth + padding * 2
  const svg = createSvgDom(height + 'px', width + 'px')
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  const bgColor = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  setAttributes(bgColor, {
    x: '0',
    y: '0',
    width: `${width}`,
    height: `${height}`,
    fill: mei.theme.cssVar['--bgcolor'] as string,
  })
  svg.appendChild(bgColor)
  mapDiv.querySelectorAll('.subLines').forEach(item => {
    const clone = item.cloneNode(true) as SVGSVGElement
    const { offsetLeft, offsetTop } = getOffsetLT(mapDiv, item.parentElement as HTMLElement)
    clone.setAttribute('x', `${offsetLeft}`)
    clone.setAttribute('y', `${offsetTop}`)
    g.appendChild(clone)
  })

  const mainLine = mapDiv.querySelector('.lines')?.cloneNode(true) as SVGSVGElement
  g.appendChild(mainLine)
  const topiclinks = mapDiv.querySelector('.topiclinks')?.cloneNode(true) as SVGSVGElement
  g.appendChild(topiclinks)
  const summaries = mapDiv.querySelector('.summary')?.cloneNode(true) as SVGSVGElement
  g.appendChild(summaries)

  mapDiv.querySelectorAll('me-tpc').forEach(tpc => {
    g.appendChild(convertDivToSvg(mei, tpc as Topic, true))
  })
  mapDiv.querySelectorAll('.tags > span').forEach(tag => {
    g.appendChild(convertDivToSvg(mei, tag as HTMLElement))
  })
  mapDiv.querySelectorAll('.icons > span').forEach(icon => {
    g.appendChild(convertDivToSvg(mei, icon as HTMLElement))
  })
  mapDiv.querySelectorAll('.hyper-link').forEach(hl => {
    g.appendChild(convertAToSvg(mei, hl as HTMLAnchorElement))
  })
  g.setAttribute('x', `${padding}`)
  g.setAttribute('y', `${padding}`)
  svg.appendChild(g)
  return head + svg.outerHTML
}
export const exportSvg = (mei: MindElixirInstance, name: string) => {
  const svgString = generateSvg(mei)
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

export const exportPng = (mei: MindElixirInstance, name: string) => {
  const svgString = generateSvg(mei)

  // use base64 to bypass canvas taint
  const url = 'data:image/svg+xml;charset=utf-8;base64,' + btoa(unescape(encodeURIComponent(svgString)))

  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    const png = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = png
    a.download = name
    a.click()
    URL.revokeObjectURL(url)
  }
  img.src = url
}
