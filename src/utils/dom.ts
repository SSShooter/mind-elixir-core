import { LEFT } from '../const'
import type { Topic, Wrapper, Parent, Children, Expander } from '../types/dom'
import type { CreateWrapper, CreateParent, CreateChildren, CreateTopic, CreateInputDiv } from '../types/function'
import type { MindElixirInstance, NodeObj } from '../types/index'
import { encodeHTML } from '../utils/index'

// DOM manipulation
const $d = document
export const findEle = (id: string, instance?: MindElixirInstance): Topic => {
  const scope = instance ? instance.mindElixirBox : $d
  const ele = scope.querySelector<Topic>(`[data-nodeid=me${id}]`)
  if (!ele) new Error(`findEle: ${id} not found`)
  return ele as Topic
}

export const shapeTpc = function (tpc: Topic, nodeObj: NodeObj) {
  tpc.textContent = nodeObj.topic

  if (nodeObj.style) {
    tpc.style.color = nodeObj.style.color || ''
    tpc.style.background = nodeObj.style.background || ''
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
export const createWrapper: CreateWrapper = function (nodeObj, omitChildren) {
  const grp = $d.createElement('me-wrapper') as Wrapper
  const top = this.createParent(nodeObj)
  grp.appendChild(top)
  if (!omitChildren && nodeObj.children && nodeObj.children.length > 0) {
    top.appendChild(createExpander(nodeObj.expanded))
    if (nodeObj.expanded !== false) {
      const children = this.layoutChildren(nodeObj.children)
      grp.appendChild(children)
    }
  }
  return { grp, top }
}

export const createParent: CreateParent = function (nodeObj: NodeObj): Parent {
  const top = $d.createElement('me-parent') as Parent
  const tpc = this.createTopic(nodeObj)
  shapeTpc(tpc, nodeObj)
  top.appendChild(tpc)
  return top
}

export const createChildren: CreateChildren = function (wrappers) {
  const children = $d.createElement('me-children') as Children
  children.append(...wrappers)
  return children
}

export const createTopic: CreateTopic = function (nodeObj) {
  const topic = $d.createElement('me-tpc') as Topic
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

export const createInputDiv: CreateInputDiv = function (tpc) {
  console.time('createInputDiv')
  if (!tpc) return
  const div = $d.createElement('div')
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
      this.inputDiv?.blur()
      this.map.focus()
    }
  })
  div.addEventListener('blur', () => {
    if (!div) return
    const node = tpc.nodeObj
    const topic = div.textContent?.trim() || ''
    console.log(topic)
    if (topic === '') node.topic = origin
    else node.topic = topic
    div.remove()
    // memory leak?
    this.inputDiv = null
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
  const expander = $d.createElement('me-epd') as Expander
  // 包含未定义 expanded 的情况，未定义视为展开
  expander.expanded = expanded !== false
  expander.className = expanded !== false ? 'minus' : ''
  return expander
}
