import type { Topic } from '../types/dom'
import type { MindElixirInstance } from '../types'
import { setAttributes } from '../utils'
import { getOffsetLT, isTopic } from '../utils'

const ns = 'http://www.w3.org/2000/svg'
function createSvgDom(height: string, width: string) {
  const svg = document.createElementNS(ns, 'svg')
  setAttributes(svg, {
    version: '1.1',
    xmlns: ns,
    height,
    width,
  })
  return svg
}

function lineHightToPadding(lineHeight: string, fontSize: string) {
  return (parseInt(lineHeight) - parseInt(fontSize)) / 2
}

function generateSvgText(tpc: HTMLElement, tpcStyle: CSSStyleDeclaration, x: number, y: number) {
  const g = document.createElementNS(ns, 'g')
  let content = ''
  if ((tpc as Topic).text) {
    content = (tpc as Topic).text.textContent!
  } else {
    content = tpc.childNodes[0].textContent!
  }
  const lines = content!.split('\n')
  lines.forEach((line, index) => {
    const text = document.createElementNS(ns, 'text')
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
  let content = ''
  if ((tpc as Topic).nodeObj?.dangerouslySetInnerHTML) {
    content = (tpc as Topic).nodeObj.dangerouslySetInnerHTML!
  } else if ((tpc as Topic).text) {
    content = (tpc as Topic).text.textContent!
  } else {
    content = tpc.childNodes[0].textContent!
  }
  const foreignObject = document.createElementNS(ns, 'foreignObject')
  setAttributes(foreignObject, {
    x: x + parseInt(tpcStyle.paddingLeft) + '',
    y: y + parseInt(tpcStyle.paddingTop) + '',
    width: tpcStyle.width,
    height: tpcStyle.height,
  })
  const div = document.createElement('div')
  setAttributes(div, {
    xmlns: 'http://www.w3.org/1999/xhtml',
    style: `font-family: ${tpcStyle.fontFamily}; font-size: ${tpcStyle.fontSize}; font-weight: ${tpcStyle.fontWeight}; color: ${tpcStyle.color}; white-space: pre-wrap;`,
  })
  div.innerHTML = content
  foreignObject.appendChild(div)
  return foreignObject
}

function createElBox(mei: MindElixirInstance, tpc: Topic) {
  const tpcStyle = getComputedStyle(tpc)
  const { offsetLeft: x, offsetTop: y } = getOffsetLT(mei.nodes, tpc)

  const bg = document.createElementNS(ns, 'rect')
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
  return bg
}
function convertDivToSvg(mei: MindElixirInstance, tpc: HTMLElement, useForeignObject = false) {
  const tpcStyle = getComputedStyle(tpc)
  const { offsetLeft: x, offsetTop: y } = getOffsetLT(mei.nodes, tpc)

  const bg = document.createElementNS(ns, 'rect')
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
  const g = document.createElementNS(ns, 'g')
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
  const svgA = document.createElementNS(ns, 'a')
  const text = document.createElementNS(ns, 'text')
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

function convertImgToSvg(mei: MindElixirInstance, a: HTMLImageElement) {
  const aStyle = getComputedStyle(a)
  const { offsetLeft: x, offsetTop: y } = getOffsetLT(mei.nodes, a)
  const svgI = document.createElementNS(ns, 'image')
  setAttributes(svgI, {
    x: x + '',
    y: y + '',
    width: aStyle.width + '',
    height: aStyle.height + '',
    href: a.src,
  })
  return svgI
}

const padding = 100

const head = `<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`

const generateSvg = (mei: MindElixirInstance, noForeignObject = false) => {
  const mapDiv = mei.nodes
  const height = mapDiv.offsetHeight + padding * 2
  const width = mapDiv.offsetWidth + padding * 2
  const svg = createSvgDom(height + 'px', width + 'px')
  const g = document.createElementNS(ns, 'svg')
  const bgColor = document.createElementNS(ns, 'rect')
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

  const mainLine = mapDiv.querySelector('.lines')?.cloneNode(true)
  mainLine && g.appendChild(mainLine)
  const topiclinks = mapDiv.querySelector('.topiclinks')?.cloneNode(true)
  topiclinks && g.appendChild(topiclinks)
  const summaries = mapDiv.querySelector('.summary')?.cloneNode(true)
  summaries && g.appendChild(summaries)

  mapDiv.querySelectorAll<Topic>('me-tpc').forEach(tpc => {
    if (tpc.nodeObj.dangerouslySetInnerHTML) {
      g.appendChild(convertDivToSvg(mei, tpc, noForeignObject ? false : true))
    } else {
      g.appendChild(createElBox(mei, tpc))
      g.appendChild(convertDivToSvg(mei, tpc.text, noForeignObject ? false : true))
    }
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
  mapDiv.querySelectorAll('img').forEach(img => {
    g.appendChild(convertImgToSvg(mei, img))
  })
  setAttributes(g, {
    x: padding + '',
    y: padding + '',
    overflow: 'visible',
  })
  svg.appendChild(g)
  return svg
}

const generateSvgStr = (svgEl: SVGSVGElement, injectCss?: string) => {
  if (injectCss) svgEl.insertAdjacentHTML('afterbegin', '<style>' + injectCss + '</style>')
  return head + svgEl.outerHTML
}

function blobToUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = evt => {
      resolve(evt.target!.result as string)
    }
    reader.onerror = err => {
      reject(err)
    }
    reader.readAsDataURL(blob)
  })
}

export const exportSvg = function (this: MindElixirInstance, noForeignObject = false, injectCss?: string) {
  const svgEl = generateSvg(this, noForeignObject)
  const svgString = generateSvgStr(svgEl, injectCss)
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  return blob
}

export const exportPng = async function (this: MindElixirInstance, noForeignObject = false, injectCss?: string): Promise<Blob | null> {
  const blob = this.exportSvg(noForeignObject, injectCss)
  // use base64 to bypass canvas taint
  const url = await blobToUrl(blob)
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.setAttribute('crossOrigin', 'anonymous')
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(resolve, 'image/png', 1)
    }
    img.src = url
    img.onerror = reject
  })
}
