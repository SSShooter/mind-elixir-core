import Canvg from 'canvg'

let head = `<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">`
let IMG_PADDING = 40
let $d = document
let maxTop, maxBottom, maxLeft, maxRight, svgHeight, svgWidth

function initVar() {
  maxTop = 10000
  maxBottom = 10000
  maxLeft = 10000
  maxRight = 10000
  svgHeight = 0
  svgWidth = 0
}

function generateSvgDom() {
  let primaryNodes = $d.querySelectorAll('.box > grp, root')
  let svgContent = ''
  // calculate distance to center from top, left, bottom, right
  for (let i = 0; i < primaryNodes.length; i++) {
    let primaryNode = primaryNodes[i]
    let rect = primaryNode.getBoundingClientRect()
    let top = primaryNode.offsetTop
    let bottom = top + rect.height
    let left = primaryNode.offsetLeft
    let right = left + rect.width
    
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
  } 
  
  for (let i = 0; i < primaryNodes.length; i++) {
    let primaryNode = primaryNodes[i]
    if(primaryNode.tagName === 'ROOT') continue
    svgContent += PrimaryToSvg(primaryNode)
  }
  console.log(maxTop, maxBottom, maxLeft, maxRight)
  svgContent += RootToSvg()
  // image margin
  svgHeight = maxBottom - maxTop + IMG_PADDING * 2
  svgWidth = maxRight - maxLeft + IMG_PADDING * 2
  // svgContent += customLinkTransform()
  let svgFile = createSvg(svgHeight, svgWidth)
  svgContent =
    `<rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="#f6f6f6"></rect>` +
    svgContent
  svgFile.innerHTML = svgContent
  // document.body.append(svgFile)
  return svgFile
}

function createSvg(height, width) {
  let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('height', height)
  svg.setAttribute('width', width)
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  svg.setAttribute('version', '1.2')
  svg.setAttribute('xlink', 'http://www.w3.org/1999/xlink')
  return svg
}

function RootToSvg() {
  let root = $d.querySelector('root')
  let rootTpc = $d.querySelector('root > tpc')
  let rect = rootTpc.getBoundingClientRect()
  let top = 0
  let left = 0
  let nodeObj = $d.querySelector('root > tpc').nodeObj
  let rootOffsetY = root.offsetTop - maxTop
  let rootOffsetX = root.offsetLeft - maxLeft

  let svg2ndEle = $d.querySelector('.svg2nd')

  let svg2nd = `<g transform="translate(${IMG_PADDING - maxLeft}, ${
    IMG_PADDING - maxTop
  })">${svg2ndEle.innerHTML}</g>`
  return (
    svg2nd +
    `<g id="root" transform="translate(${rootOffsetX + IMG_PADDING}, ${
      rootOffsetY + IMG_PADDING
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
  svg += `<g transform="translate(${primaryNodeOffsetX + IMG_PADDING}, ${
    primaryNodeOffsetY + IMG_PADDING
  })">`
  svg += svg3rd ? svg3rd.innerHTML : ''
  for (let i = 0; i < topics.length; i++) {
    let tpc = topics[i]
    let t = tpc.parentNode
    let nodeObj = tpc.nodeObj
    if (nodeObj.root) {
      continue
    }
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
    svg += `<g id="${nodeObj.id}">
      ${border}
      ${backgroundColor}
      <text x="${topicOffsetLeft}" y="${topicOffsetTop}" text-anchor="start" align="top" anchor="start" font-family="微软雅黑" font-size="${tpcStyle.fontSize}" font-weight="${tpcStyle.fontWeight}" fill="${tpcStyle.color}">
        ${nodeObj.topic}
        ${icons}
      </text>
      ${tags}
  </g>`
  }
  svg += '</g>'
  return svg
}

function splitMultipleLineText() {
  const maxWidth = 800 // should minus padding
  let text = ''
  let textEl = document.createElement('span')
  textEl.style.cssText =
    'padding:0;margin:0;font-family:微软雅黑;font-size:18px;font-weight:bolder;'
  textEl.innerHTML = ''
  let lines = []
  for (let i = 0; i < text.length; i++) {
    textEl.innerHTML += text[i]
    let w = textEl.getBoundingClientRect().width
    if (w > maxWidth) {
      lines.push(textEl.innerHTML)
      textEl.innerHTML = ''
    }
  }
  return lines
}

function getFileName() {
  return $d.querySelector('root > tpc').innerText
}

function customLinkTransform() {
  let customLinks = $d.querySelector('.topiclinks').children
  let resLinks = ''
  for (let i = 0; i < customLinks.length; i++) {
    let customLink = customLinks[i].outerHTML
    let cnt = 0
    let data = customLink.replace(/\d+(\.\d+)? /g, function (match) {
      match = Number(match)
      console.log(match, svgWidth, svgHeight)
      let res
      if (match < 256) {
        res = match
      } else {
        if (cnt % 2) {
          // y
          res = match - 10000 + svgHeight / 2
        } else {
          // x
          res = match - 10000 + svgWidth / 2
        }
      }
      cnt++
      return res + ' '
    })
    resLinks += data
  }
  console.log(resLinks)
  return resLinks
}

export let exportSvg = function (instance, fileName) {
  if (!instance) throw new Error('Mind-elixir instance is not presented. ---> exportSvg(instance, fileName)') 
  initVar()
  $d = instance.container
  let svgFile = generateSvgDom()
  let dlUrl = URL.createObjectURL(
    new Blob([head + svgFile.outerHTML.replace(/&nbsp;/g, ' ')])
  )
  let a = document.createElement('a')
  a.href = dlUrl
  a.download = (fileName || getFileName()) + '.svg'
  a.click()
}

export let exportPng = async function (instance, fileName) {
  if (!instance) throw new Error('Mind-elixir instance is not presented. ---> exportSvg(instance, fileName)') 
  initVar()
  $d = instance.container
  let svgFile = generateSvgDom()
  const canvas = document.createElement('canvas')
  canvas.style.display = 'none'
  const ctx = canvas.getContext('2d')

  let v = await Canvg.fromString(
    ctx,
    head + svgFile.outerHTML.replace(/&nbsp;/g, ' ')
  )
  v.start()
  let imgURL = canvas.toDataURL('image/png')
  let a = document.createElement('a')
  a.href = imgURL
  a.download = fileName || getFileName() + '.png'
  a.click()
}

export default {
  exportSvg,
  exportPng,
}
