import { LEFT, RIGHT, SIDE } from '../const'
import vari from '../var'
import { NodeObj } from '../index'
import { encodeHTML } from '../utils/index'
export type Top = HTMLElement

export type Group = HTMLElement

export interface Topic extends HTMLElement {
  nodeObj?: NodeObj
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

export const createGroup = function(nodeObj: NodeObj) {
  const grp: Group = $d.createElement('GRP')
  const top: Top = createTop(nodeObj)
  grp.appendChild(top)
  if (nodeObj.children && nodeObj.children.length > 0) {
    top.appendChild(createExpander(nodeObj.expanded))
    if (nodeObj.expanded !== false) {
      const children = createChildren(nodeObj.children)
      grp.appendChild(children)
    }
  }
  return { grp, top }
}

export const shapeTpc = function(tpc: Topic, nodeObj: NodeObj) {
  tpc.innerText = nodeObj.topic

  if (nodeObj.style) {
    tpc.style.color = nodeObj.style.color || 'inherit'
    tpc.style.background = nodeObj.style.background || 'inherit'
    tpc.style.fontSize = nodeObj.style.fontSize + 'px'
    tpc.style.fontWeight = nodeObj.style.fontWeight || 'normal'
  }

  // TODO allow to add online image
  // if (nodeObj.image) {
  //   const imgContainer = $d.createElement('img')
  //   imgContainer.src = nodeObj.image.url
  //   imgContainer.style.width = nodeObj.image.width + 'px'
  //   tpc.appendChild(imgContainer)
  // }
  if (nodeObj.hyperLink) {
    const linkContainer = $d.createElement('a')
    linkContainer.className = 'hyper-link'
    linkContainer.target = '_blank'
    linkContainer.innerText = '🔗'
    linkContainer.href = nodeObj.hyperLink
    tpc.appendChild(linkContainer)
  }
  if (nodeObj.icons) {
    const iconsContainer = $d.createElement('span')
    iconsContainer.className = 'icons'
    iconsContainer.innerHTML = nodeObj.icons
      .map(icon => `<span>${encodeHTML(icon)}</span>`)
      .join('')
    tpc.appendChild(iconsContainer)
  }
  if (nodeObj.tags) {
    const tagsContainer = $d.createElement('div')
    tagsContainer.className = 'tags'
    tagsContainer.innerHTML = nodeObj.tags
      .map(tag => `<span>${encodeHTML(tag)}</span>`)
      .join('')
    tpc.appendChild(tagsContainer)
  }
}

export const createTop = function(nodeObj: NodeObj): Top {
  const top = $d.createElement('t')
  const tpc = createTopic(nodeObj)
  shapeTpc(tpc, nodeObj)
  top.appendChild(tpc)
  return top
}

export const createTopic = function(nodeObj: NodeObj): Topic {
  const topic: Topic = $d.createElement('tpc')
  topic.nodeObj = nodeObj
  topic.dataset.nodeid = 'me' + nodeObj.id
  topic.draggable = vari.draggable
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
  div.innerText = origin
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
    console.log(e, key)
    if (key === 'Enter' || key === 'Tab') {
      // keep wrap for shift enter
      if (e.shiftKey) return

      e.preventDefault()
      this.inputDiv.blur()
      this.map.focus()
    }
  })
  div.addEventListener('blur', () => {
    if (!div) return // 防止重复blur
    const node = tpc.nodeObj
    const topic = div.textContent!.trim()
    if (topic === '') node.topic = origin
    else node.topic = topic
    div.remove()
    this.inputDiv = div = null
    this.bus.fire('operation', {
      name: 'finishEdit',
      obj: node,
      origin,
    })
    if (topic === origin) return // 没有修改不做处理
    tpc.childNodes[0].textContent = node.topic
    this.linkDiv()
  })
  console.timeEnd('createInputDiv')
}

export const createExpander = function(expanded: boolean | undefined): Expander {
  const expander: Expander = $d.createElement('epd')
  // 包含未定义 expanded 的情况，未定义视为展开
  expander.innerText = expanded !== false ? '-' : '+'
  expander.expanded = expanded !== false
  expander.className = expanded !== false ? 'minus' : ''
  return expander
}

/**
 * traversal data and generate dom structure of mind map
 * @ignore
 * @param {object} data node data object
 * @param {object} container node container(mostly primary node)
 * @param {number} direction primary node direction
 * @return {ChildrenElement} children element.
 */
export function createChildren(data: NodeObj[], container?: HTMLElement, direction?) {
  let chldr: HTMLElement
  if (container) {
    chldr = container
  } else {
    chldr = $d.createElement('children')
  }
  for (let i = 0; i < data.length; i++) {
    const nodeObj = data[i]
    const grp = $d.createElement('GRP')
    if (direction === LEFT) {
      grp.className = 'lhs'
    } else if (direction === RIGHT) {
      grp.className = 'rhs'
    } else if (direction === SIDE) {
      if (nodeObj.direction === LEFT) {
        grp.className = 'lhs'
      } else if (nodeObj.direction === RIGHT) {
        grp.className = 'rhs'
      }
    }
    const top = createTop(nodeObj)
    if (nodeObj.children && nodeObj.children.length > 0) {
      top.appendChild(createExpander(nodeObj.expanded))
      grp.appendChild(top)
      if (nodeObj.expanded !== false) {
        const children = createChildren(nodeObj.children)
        grp.appendChild(children)
      }
    } else {
      grp.appendChild(top)
    }
    chldr.appendChild(grp)
  }
  return chldr
}

// Set primary nodes' direction and invoke createChildren()
export function layout() {
  console.time('layout')
  this.root.innerHTML = ''
  this.box.innerHTML = ''
  const tpc = createTopic(this.nodeData)
  shapeTpc(tpc, this.nodeData) // shape root tpc
  tpc.draggable = false
  this.root.appendChild(tpc)

  const primaryNodes: NodeObj[] = this.nodeData.children
  if (!primaryNodes || primaryNodes.length === 0) return
  if (this.direction === SIDE) {
    // initiate direction of primary nodes
    let lcount = 0
    let rcount = 0
    primaryNodes.map(node => {
      if (node.direction === undefined) {
        if (lcount <= rcount) {
          node.direction = LEFT
          lcount += 1
        } else {
          node.direction = RIGHT
          rcount += 1
        }
      } else {
        if (node.direction === LEFT) {
          lcount += 1
        } else {
          rcount += 1
        }
      }
    })
  }
  createChildren(this.nodeData.children, this.box, this.direction)
  console.timeEnd('layout')
}
