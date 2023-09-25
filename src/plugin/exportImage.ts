import type { Topic } from '../types/dom'
import type { MindElixirInstance } from '../types'
import { setAttributes } from '../utils'
import { getOffsetLT } from '../utils'

function createSvgDom(height: string, width: string) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('height', height)
  svg.setAttribute('width', width)
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  svg.setAttribute('version', '1.2')
  svg.setAttribute('xlink', 'http://www.w3.org/1999/xlink')
  return svg
}

function convertTopicToSvg(mei: MindElixirInstance, tpc: Topic) {
  const t = tpc.parentNode
  const nodeObj = tpc.nodeObj
  // if (nodeObj.root) {
  //   continue
  // }
  const tpcRect = tpc.getBoundingClientRect()
  const top = t.offsetTop
  const left = t.offsetLeft
  const tpcStyle = getComputedStyle(tpc)
  const tStyle = getComputedStyle(t)
  const { offsetLeft: topicOffsetLeft, offsetTop: topicOffsetTop } = getOffsetLT(mei.nodes, tpc)

  // render tags
  let tags = ''
  if (nodeObj.tags && nodeObj.tags.length) {
    const tagsEle = tpc.querySelectorAll('.tags > span')
    for (let i = 0; i < tagsEle.length; i++) {
      const tag = tagsEle[i]
      const tagRect = tag.getBoundingClientRect()
      tags += `<rect x="${topicOffsetLeft}" y="${topicOffsetTop + 4}" rx="5px" ry="5px" width="${tagRect.width}" height="${
        tagRect.height
      }" style="fill: #d6f0f8;"></rect>
        <text font-family="微软雅黑" font-size="12px"  fill="#276f86" x="${topicOffsetLeft + 4}" y="${topicOffsetTop + 4 + 12}">${
        tag.innerHTML
      }</text>`
    }
  }
  let icons = ''
  if (nodeObj.icons && nodeObj.icons.length) {
    const iconsEle = tpc.querySelectorAll('.icons > span')
    for (let i = 0; i < iconsEle.length; i++) {
      const icon = iconsEle[i]
      const iconRect = icon.getBoundingClientRect()
      icons += `
        <tspan>${icon.innerHTML}</tspan>`
    }
  }

  const bg: SVGRectElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  setAttributes(bg, {
    x: `${topicOffsetLeft}`,
    y: `${topicOffsetTop}`,
    rx: tpcStyle.borderRadius,
    ry: tpcStyle.borderRadius,
    width: `${tpcRect.width}`,
    height: `${tpcRect.height}`,
    fill: tpcStyle.backgroundColor,
    stroke: tpcStyle.borderColor,
    'stroke-width': tpcStyle.borderWidth,
  })
  const text: SVGTextElement = document.createElementNS('http://www.w3.org/2000/svg', 'text')
  setAttributes(text, {
    x: topicOffsetLeft + parseInt(tpcStyle.paddingLeft) + '',
    y: topicOffsetTop + parseInt(tpcStyle.paddingTop) + '',
    'text-anchor': 'start',
    align: 'top',
    anchor: 'start',
    'font-family': '微软雅黑',
    'font-size': `${tpcStyle.fontSize}`,
    'font-weight': `${tpcStyle.fontWeight}`,
    fill: `${tpcStyle.color}`,
  })
  text.innerHTML = `${nodeObj.topic}${icons}`
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  g.appendChild(bg)
  g.appendChild(text)
  // const svg = `<g id="${nodeObj.id}">
  //     ${border}
  //     ${backgroundColor}
  //     <text x="${topicOffsetLeft}" y="${topicOffsetTop}" text-anchor="start" align="top" anchor="start" font-family="微软雅黑" font-size="${tpcStyle.fontSize}" font-weight="${tpcStyle.fontWeight}" fill="${tpcStyle.color}">
  //       ${nodeObj.topic}
  //       ${icons}
  //     </text>
  //     ${tags}
  // </g>`
  return g
}

const head = `<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`
const generateSvg = (mei: MindElixirInstance) => {
  const mapDiv = mei.nodes
  const height = mapDiv.offsetHeight
  const width = mapDiv.offsetWidth
  const svg = createSvgDom(height + 'px', width + 'px')
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
    // clone and append item to svg
    const clone = item.cloneNode(true) as SVGSVGElement
    // set item position
    const { offsetLeft, offsetTop } = getOffsetLT(mapDiv, item.parentElement as HTMLElement)
    clone.setAttribute('x', `${offsetLeft}`)
    clone.setAttribute('y', `${offsetTop}`)
    svg.appendChild(clone)
  })

  const mainLine = mapDiv.querySelector('.lines') as Element
  svg.appendChild(mainLine.cloneNode(true))
  const topiclinks = mapDiv.querySelector('.topiclinks') as Element
  svg.appendChild(topiclinks.cloneNode(true))
  const summaries = mapDiv.querySelector('.summary') as Element
  svg.appendChild(summaries.cloneNode(true))

  mapDiv.querySelectorAll('me-tpc').forEach(tpc => {
    svg.appendChild(convertTopicToSvg(mei, tpc as Topic))
  })
  return head + svg.outerHTML
}
export const exportSvg = (mei: MindElixirInstance, name: string) => {
  const svgString = generateSvg(mei)
  // return svgString
  // download string
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'name'
  a.click()
  URL.revokeObjectURL(url)
}
