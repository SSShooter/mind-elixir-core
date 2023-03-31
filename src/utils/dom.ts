import { LEFT } from '../const'
import { NodeObj } from '../index'
import { encodeHTML } from '../utils/index'
export type Top = HTMLElement

export type Group = HTMLElement

export interface Topic extends HTMLElement {
  nodeObj?: NodeObj
  linkContainer?: HTMLElement
}

export interface Expander extends HTMLElement {
  expanded?: boolean
}

// DOM manipulation
const $d = document
export const findEle = (id: string, instance?) => {
  const scope = instance ? instance.mindElixirBox : $d
  return scope.querySelector(`[data-nodeid=me${id}]`)
}

export const shapeTpc = function (tpc: Topic, nodeObj: NodeObj) {
  tpc.textContent = nodeObj.topic

  if (nodeObj.style) {
    tpc.style.color = nodeObj.style.color || 'inherit'
    tpc.style.background = nodeObj.style.background || 'inherit'
    tpc.style.fontSize = nodeObj.style.fontSize + 'px'
    tpc.style.fontWeight = nodeObj.style.fontWeight || 'normal'
  }

  if (nodeObj.image) {
    const img = nodeObj.image
    if (img.url && img.width && img.height) {
      const imgContainer = $d.createElement('img')
      imgContainer.src = img.url
      imgContainer.style.width = img.width + 'px'
      imgContainer.style.height = img.height + 'px'
      tpc.appendChild(imgContainer)
    } else {
      console.warn('image url/width/height are required')
    }
  }

  if (nodeObj.hyperLink) {
    const linkContainer = $d.createElement('a')
    linkContainer.className = 'hyper-link'
    linkContainer.target = '_blank'
    linkContainer.innerText = '🔗'
    linkContainer.href = nodeObj.hyperLink
    tpc.appendChild(linkContainer)
    tpc.linkContainer = linkContainer
    console.log(linkContainer)
  } else if (tpc.linkContainer) {
    tpc.linkContainer.remove()
    tpc.linkContainer = null
  }
  if (nodeObj.icons && nodeObj.icons.length) {
    const iconsContainer = $d.createElement('span')
    iconsContainer.className = 'icons'
    iconsContainer.innerHTML = nodeObj.icons.map(icon => `<span>${encodeHTML(icon)}</span>`).join('')
    tpc.appendChild(iconsContainer)
  }
  if (nodeObj.tags && nodeObj.tags.length) {
    const tagsContainer = $d.createElement('div')
    tagsContainer.className = 'tags'
    tagsContainer.innerHTML = nodeObj.tags.map(tag => `<span>${encodeHTML(tag)}</span>`).join('')
    tpc.appendChild(tagsContainer)
  }

  if (nodeObj.branchColor) {
    tpc.style.borderColor = nodeObj.branchColor
  }
}

// everything is staring from `Wrapper`
export const createWrapper = function (nodeObj: NodeObj, omitChildren?: boolean) {
  const grp: Group = $d.createElement('me-wrapper')
  const top: Top = this.createParent(nodeObj)
  grp.appendChild(top)
  if (!omitChildren && nodeObj.children && nodeObj.children.length > 0) {
    top.appendChild(createExpander(nodeObj.expanded))
    if (nodeObj.expanded !== false) {
      const children = this.createChildren(nodeObj.children)
      grp.appendChild(children)
    }
  }
  return { grp, top }
}

export const createParent = function (nodeObj: NodeObj): Top {
  const top = $d.createElement('me-parent')
  const tpc = this.createTopic(nodeObj)
  shapeTpc(tpc, nodeObj)
  top.appendChild(tpc)
  return top
}

export const createTopic = function (nodeObj: NodeObj): Topic {
  const topic: Topic = $d.createElement('me-tpc')
  topic.nodeObj = nodeObj
  topic.dataset.nodeid = 'me' + nodeObj.id
  topic.draggable = this.draggable
  return topic
}

export function selectText(div: HTMLElement) {
  const range = $d.createRange()
  range.selectNodeContents(div)
  const getSelection = window.getSelection()
  if (getSelection) {
    getSelection.removeAllRanges()
    getSelection.addRange(range)
  }
}

export function createInputDiv(tpc: Topic) {
  console.time('createInputDiv')
  if (!tpc) return
  let div = $d.createElement('div')
  const origin = tpc.childNodes[0].textContent as string
  tpc.appendChild(div)
  div.id = 'input-box'
  div.textContent = origin
  div.contentEditable = 'true'
  div.spellcheck = false
  div.style.cssText = `min-width:${tpc.offsetWidth - 8}px;`
  if (this.direction === LEFT) div.style.right = '0'
  div.focus()

  selectText(div)
  this.inputDiv = div

  this.bus.fire('operation', {
    name: 'beginEdit',
    obj: tpc.nodeObj,
  })

  div.addEventListener('keydown', e => {
    e.stopPropagation()
    const key = e.key

    if (key === 'Enter' || key === 'Tab') {
      // keep wrap for shift enter
      if (e.shiftKey) return

      e.preventDefault()
      this.inputDiv.blur()
      this.map.focus()
    }
  })
  div.addEventListener('blur', () => {
    if (!div) return
    const node = tpc.nodeObj
    const topic = div.textContent!.trim()
    console.log(topic)
    if (topic === '') node.topic = origin
    else node.topic = topic
    div.remove()
    this.inputDiv = div = null
    if (topic === origin) return
    tpc.childNodes[0].textContent = node.topic
    this.linkDiv()
    this.bus.fire('operation', {
      name: 'finishEdit',
      obj: node,
      origin,
    })
  })
  console.timeEnd('createInputDiv')
}

export const createExpander = function (expanded: boolean | undefined): Expander {
  const expander: Expander = $d.createElement('me-epd')
  // 包含未定义 expanded 的情况，未定义视为展开
  expander.expanded = expanded !== false
  expander.className = expanded !== false ? 'minus' : ''
  return expander
}
