import { LEFT } from '../const'
import type { Topic, Wrapper, Parent, Children, Expander } from '../types/dom'
import type { MindElixirInstance, NodeObj } from '../types/index'
import { encodeHTML } from '../utils/index'
import { layoutChildren } from './layout'

// DOM manipulation
const $d = document
export const findEle = (id: string, instance?: MindElixirInstance) => {
  const scope = instance ? instance.mindElixirBox : $d
  const ele = scope.querySelector<Topic>(`[data-nodeid=me${id}]`)
  if (!ele) throw new Error(`FindEle: Node ${id} not found, maybe it's collapsed.`)
  return ele
}

export const shapeTpc = function (tpc: Topic, nodeObj: NodeObj) {
  tpc.innerHTML = ''

  if (nodeObj.style) {
    tpc.style.color = nodeObj.style.color || ''
    tpc.style.background = nodeObj.style.background || ''
    tpc.style.fontSize = nodeObj.style.fontSize + 'px'
    tpc.style.fontWeight = nodeObj.style.fontWeight || 'normal'
  }

  if (nodeObj.dangerouslySetInnerHTML) {
    tpc.innerHTML = nodeObj.dangerouslySetInnerHTML
    return
  }

  if (nodeObj.image) {
    const img = nodeObj.image
    if (img.url && img.width && img.height) {
      const imgEl = $d.createElement('img')
      imgEl.src = img.url
      imgEl.style.width = img.width + 'px'
      imgEl.style.height = img.height + 'px'
      if (img.fit) imgEl.style.objectFit = img.fit
      tpc.appendChild(imgEl)
      tpc.image = imgEl
    } else {
      console.warn('Image url/width/height are required')
    }
  } else if (tpc.image) {
    tpc.image = undefined
  }

  {
    const textEl = $d.createElement('span')
    textEl.className = 'text'
    textEl.textContent = nodeObj.topic
    tpc.appendChild(textEl)
    tpc.text = textEl
  }

  if (nodeObj.hyperLink) {
    const linkEl = $d.createElement('a')
    linkEl.className = 'hyper-link'
    linkEl.target = '_blank'
    linkEl.innerText = '🔗'
    linkEl.href = nodeObj.hyperLink
    tpc.appendChild(linkEl)
    tpc.link = linkEl
  } else if (tpc.link) {
    tpc.link = undefined
  }

  if (nodeObj.icons && nodeObj.icons.length) {
    const iconsEl = $d.createElement('span')
    iconsEl.className = 'icons'
    iconsEl.innerHTML = nodeObj.icons.map(icon => `<span>${encodeHTML(icon)}</span>`).join('')
    tpc.appendChild(iconsEl)
    tpc.icons = iconsEl
  } else if (tpc.icons) {
    tpc.icons = undefined
  }

  if (nodeObj.tags && nodeObj.tags.length) {
    const tagsEl = $d.createElement('div')
    tagsEl.className = 'tags'
    tagsEl.innerHTML = nodeObj.tags.map(tag => `<span>${encodeHTML(tag)}</span>`).join('')
    tpc.appendChild(tagsEl)
    tpc.tags = tagsEl
  } else if (tpc.tags) {
    tpc.tags = undefined
  }
}

// everything start from `Wrapper`
export const createWrapper = function (this: MindElixirInstance, nodeObj: NodeObj, omitChildren?: boolean) {
  const grp = $d.createElement('me-wrapper') as Wrapper
  const { p, tpc } = this.createParent(nodeObj)
  grp.appendChild(p)
  if (!omitChildren && nodeObj.children && nodeObj.children.length > 0) {
    const expander = createExpander(nodeObj.expanded)
    p.appendChild(expander)
    // tpc.expander = expander
    if (nodeObj.expanded !== false) {
      const children = layoutChildren(this, nodeObj.children)
      grp.appendChild(children)
    }
  }
  return { grp, top: p, tpc }
}

export const createParent = function (this: MindElixirInstance, nodeObj: NodeObj) {
  const p = $d.createElement('me-parent') as Parent
  const tpc = this.createTopic(nodeObj)
  shapeTpc(tpc, nodeObj)
  p.appendChild(tpc)
  return { p, tpc }
}

export const createChildren = function (this: MindElixirInstance, wrappers: Wrapper[]) {
  const children = $d.createElement('me-children') as Children
  children.append(...wrappers)
  return children
}

export const createTopic = function (this: MindElixirInstance, nodeObj: NodeObj) {
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

export const editTopic = function (this: MindElixirInstance, el: Topic) {
  console.time('editTopic')
  if (!el) return
  const div = $d.createElement('div')
  const origin = el.text.textContent as string
  el.appendChild(div)
  div.id = 'input-box'
  div.textContent = origin
  div.contentEditable = 'true'
  div.spellcheck = false
  const style = getComputedStyle(el)
  div.style.cssText = `min-width:${el.offsetWidth - 8}px;
  color:${style.color};
  padding:${style.padding};
  margin:${style.margin};
  font:${style.font};
  background-color:${style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor};
  border-radius:${style.borderRadius};`
  if (this.direction === LEFT) div.style.right = '0'
  div.focus()

  selectText(div)

  this.bus.fire('operation', {
    name: 'beginEdit',
    obj: el.nodeObj,
  })

  div.addEventListener('keydown', e => {
    e.stopPropagation()
    const key = e.key

    if (key === 'Enter' || key === 'Tab') {
      // keep wrap for shift enter
      if (e.shiftKey) return

      e.preventDefault()
      div.blur()
      this.map.focus()
    }
  })
  div.addEventListener('blur', () => {
    if (!div) return
    const node = el.nodeObj
    const topic = div.textContent?.trim() || ''
    if (topic === '') node.topic = origin
    else node.topic = topic
    div.remove()
    if (topic === origin) return
    el.text.textContent = node.topic
    this.linkDiv()
    this.bus.fire('operation', {
      name: 'finishEdit',
      obj: node,
      origin,
    })
  })
  console.timeEnd('editTopic')
}

export const createExpander = function (expanded: boolean | undefined): Expander {
  const expander = $d.createElement('me-epd') as Expander
  // if expanded is undefined, treat as expanded
  expander.expanded = expanded !== false
  expander.className = expanded !== false ? 'minus' : ''
  return expander
}
