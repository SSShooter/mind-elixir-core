import Canvg from 'canvg'
let $d = document
let maxTop = 10000
let maxBottom = 10000
let maxLeft = 10000
let maxRight = 10000
let imgPadding = 40
let head = `<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`
function generateSvgDom() {
  let primaryNodes = $d.querySelectorAll('.box > grp, root')
  let svgContent = ''
  for (let i = 0; i < primaryNodes.length; i++) {
    let primaryNode = primaryNodes[i]
    let rect = primaryNode.getBoundingClientRect()
    let top = primaryNode.offsetTop
    let bottom = top + rect.height
    let left = primaryNode.offsetLeft
    let right = left + rect.width
    // console.log(top, bottom, left, right)
    if (top < maxTop) {
      maxTop = top
    }
    if (bottom > maxBottom) {
      maxBottom = bottom
    }
    if (left < maxLeft) {
      maxLeft = left
    }
    if (right > maxRight) {
      maxRight = right
    }
    svgContent += PrimaryToSvg(primaryNode)
  }
  console.log(maxTop, maxBottom, maxLeft, maxRight)
  svgContent += RootToSvg()
  // 需要添加图片边缘padding
  let svgHeight = maxBottom - maxTop + imgPadding * 2
  let svgWidth = maxRight - maxLeft + imgPadding * 2
  let svgFile = createSvg(svgHeight, svgWidth)
  svgContent =
    `<rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="#f6f6f6"></rect>` +
    svgContent
  svgFile.innerHTML = svgContent
  // document.body.append(svgFile)
  return svgFile
}

function createSvg(height, width) {
  let svg = $d.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('height', height)
  svg.setAttribute('width', width)
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  svg.setAttribute('version', '1.2')
  svg.setAttribute('xlink', 'http://www.w3.org/1999/xlink')
  return svg
}

function RootToSvg() {
  let root = document.querySelector('root')
  let rootTpc = document.querySelector('root > tpc')
  let rect = rootTpc.getBoundingClientRect()
  let top = 0
  let left = 0
  let nodeObj = document.querySelector('root > tpc').nodeObj
  let rootOffsetY = root.offsetTop - maxTop
  let rootOffsetX = root.offsetLeft - maxLeft

  let svg2ndEle = document.querySelector('.svg2nd')

  let svg2nd = `<g transform="translate(${imgPadding - maxLeft}, ${
    imgPadding - maxTop
    })">${svg2ndEle.innerHTML}</g>`
  return (
    svg2nd +
    `<g id="root" transform="translate(${rootOffsetX + imgPadding}, ${
    rootOffsetY + imgPadding
    })">
      <rect x="${left}" y="${top}" rx="5px" ry="5px" width="${
    rect.width
    }" height="${rect.height}" style="fill: #00aaff;"></rect>
      <text x="${left + 15}" y="${
    top + 35
    }" text-anchor="start" align="top" anchor="start" font-family="微软雅黑" font-size="25px" font-weight="normal" fill="#ffffff">
        ${nodeObj.topic}
      </text>
  </g>`
  )
}

function PrimaryToSvg(primaryNode) {
  let topics = primaryNode.querySelectorAll('tpc')
  let primaryNodeOffsetY = primaryNode.offsetTop - maxTop
  let primaryNodeOffsetX = primaryNode.offsetLeft - maxLeft

  let svg = ''
  let svg3rd = primaryNode.querySelector('.svg3rd')
  svg += `<g transform="translate(${primaryNodeOffsetX + imgPadding}, ${
    primaryNodeOffsetY + imgPadding
    })">`
  svg += svg3rd ? svg3rd.innerHTML : ''
  for (let i = 0; i < topics.length; i++) {
    let tpc = topics[i]
    let t = tpc.parentNode
    let nodeObj = tpc.nodeObj
    if (nodeObj.root) { continue }
    let tpcRect = tpc.getBoundingClientRect()
    let top = t.offsetTop
    let left = t.offsetLeft
    let tpcStyle = getComputedStyle(tpc)
    let tStyle = getComputedStyle(t)
    let topicOffsetLeft =
      left + parseInt(tStyle.paddingLeft) + parseInt(tpcStyle.paddingLeft)
    let topicOffsetTop =
      top +
      parseInt(tStyle.paddingTop) +
      parseInt(tpcStyle.paddingTop) +
      parseInt(tpcStyle.fontSize)
    let topicOffsetTopTop =
      top +
      parseInt(tStyle.paddingTop) +
      parseInt(tpcStyle.paddingTop)
    // style render
    let border = ''
    if (tpcStyle.borderWidth != '0px') {
      border = `<rect x="${left + 15}" y="${top}" rx="5px" ry="5px" width="${
        tpcRect.width
        }" height="${
        tpcRect.height
        }" style="fill: rgba(0,0,0,0); stroke:#444;stroke-width:1px;"></rect>`
    }
    let backgroundColor = ''
    if (tpcStyle.backgroundColor != 'rgba(0, 0, 0, 0)') {
      backgroundColor = `<rect x="${
        left + 15
        }" y="${top}" rx="5px" ry="5px" width="${tpcRect.width}" height="${
        tpcRect.height
        }" style="fill: ${tpcStyle.backgroundColor};"></rect>`
    }
    // render tags
    let tags = ''
    if (nodeObj.tags && nodeObj.tags.length) {
      let tagsEle = tpc.querySelectorAll('.tags > span')
      for (let i = 0; i < tagsEle.length; i++) {
        let tag = tagsEle[i]
        let tagRect = tag.getBoundingClientRect()
        tags += `<rect x="${topicOffsetLeft}" y="${
          topicOffsetTop + 4
          }" rx="5px" ry="5px" width="${tagRect.width}" height="${
          tagRect.height
          }" style="fill: #d6f0f8;"></rect>
        <text font-family="微软雅黑" font-size="12px"  fill="#276f86" x="${
          topicOffsetLeft + 4
          }" y="${topicOffsetTop + 4 + 12}">${tag.innerHTML}</text>`
      }
    }
    let icons = ''
    if (nodeObj.icons && nodeObj.icons.length) {
      let iconsEle = tpc.querySelectorAll('.icons > span')
      for (let i = 0; i < iconsEle.length; i++) {
        let icon = iconsEle[i]
        let iconRect = icon.getBoundingClientRect()
        icons += `
        <tspan>${icon.innerHTML}</tspan>`
      }
    }
    // render every single node
    svg += `<g id="${nodeObj.id}">
      ${border}
      ${backgroundColor}
      <foreignObject  x="${topicOffsetLeft}" y="${topicOffsetTopTop}" width="${tpcStyle.width}" height="${tpcStyle.height}">
      <p xmlns="http://www.w3.org/1999/xhtml" style="padding:0;margin:0;font-family:微软雅黑;font-size:${tpcStyle.fontSize};font-weight:${tpcStyle.fontWeight};color:${tpcStyle.color}">
        ${nodeObj.topic}
        ${icons}
      </p>
      </foreignObject>
      ${tags}
  </g>`
  }
  svg += '</g>'
  return svg
}

export let exportSvg = function () {
  let svgFile = generateSvgDom()
  let dlUrl = URL.createObjectURL(
    new Blob([head + svgFile.outerHTML.replace(/&nbsp;/g, ' ')])
  )
  let a = document.createElement('a')
  a.href = dlUrl
  a.download = 'me-mindmap.svg'
  a.click()
}

export let exportPng = async function () {
  let svgFile = generateSvgDom()
  const canvas = document.createElement('canvas')
  canvas.style.display = 'none'
  const ctx = canvas.getContext('2d')
  // Canvg do not support foreignObject
  let v = await Canvg.fromString(
    ctx,
    head + svgFile.outerHTML.replace(/&nbsp;/g, ' ')
  )
  v.start()
  let imgURL = canvas.toDataURL('image/png')
  let a = document.createElement('a')
  a.href = imgURL
  a.download = 'me-mindmap.png'
  a.click()
}


export default {
  exportSvg, exportPng
}