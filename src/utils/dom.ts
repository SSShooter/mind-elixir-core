import type MindElixir from '../index'
import { LEFT } from '../const'
import type { Topic, Wrapper, Parent, Children, Expander } from '../types/dom'
import { DirectionClass, type NodeObj } from '../types/index'
import { encodeHTML, getOffsetLT } from '../utils/index'
import { layoutChildren } from './layout'

// DOM manipulation
export const findEle = function (this: MindElixir, id: string, el?: HTMLElement) {
  const scope = this?.el ? this.el : el ? el : document
  const ele = scope.querySelector<Topic>(`[data-nodeid="me${id}"]`)
  if (!ele) throw new Error(`FindEle: Node ${id} not found, maybe it's collapsed.`)
  return ele
}

export const shapeTpc = function (this: MindElixir, tpc: Topic, nodeObj: NodeObj) {
  tpc.innerHTML = ''

  if (nodeObj.style) {
    const style = nodeObj.style
    type KeyOfStyle = keyof typeof style
    for (const key in style) {
      tpc.style[key as KeyOfStyle] = style[key as KeyOfStyle]!
    }
  }

  if (nodeObj.dangerouslySetInnerHTML) {
    tpc.innerHTML = nodeObj.dangerouslySetInnerHTML
    return
  }

  if (nodeObj.image) {
    const img = nodeObj.image
    if (img.url && img.width && img.height) {
      const imgEl = document.createElement('img')
      // Use imageProxy function if provided, otherwise use original URL
      imgEl.src = this.imageProxy ? this.imageProxy(img.url) : img.url
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
    const textEl = document.createElement('span')
    textEl.className = 'text'

    // Check if markdown parser is provided and topic contains markdown syntax
    if (this.markdown) {
      textEl.innerHTML = this.markdown(nodeObj.topic, nodeObj)
    } else {
      textEl.textContent = nodeObj.topic
    }

    tpc.appendChild(textEl)
    tpc.text = textEl
  }

  if (nodeObj.hyperLink) {
    const linkEl = document.createElement('a')
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
    const iconsEl = document.createElement('span')
    iconsEl.className = 'icons'
    iconsEl.innerHTML = nodeObj.icons.map(icon => `<span>${encodeHTML(icon)}</span>`).join('')
    tpc.appendChild(iconsEl)
    tpc.icons = iconsEl
  } else if (tpc.icons) {
    tpc.icons = undefined
  }

  if (nodeObj.tags && nodeObj.tags.length) {
    const tagsEl = document.createElement('div')
    tagsEl.className = 'tags'

    nodeObj.tags.forEach(tag => {
      const span = document.createElement('span')

      if (typeof tag === 'string') {
        span.textContent = tag
      } else {
        span.textContent = tag.text
        if (tag.className) {
          span.className = tag.className
        }
        if (tag.style) {
          Object.assign(span.style, tag.style)
        }
      }

      tagsEl.appendChild(span)
    })

    tpc.appendChild(tagsEl)
    tpc.tags = tagsEl
  } else if (tpc.tags) {
    tpc.tags = undefined
  }
}

// everything start from `Wrapper`
export const createWrapper = function (this: MindElixir, nodeObj: NodeObj, omitChildren?: boolean) {
  const grp = document.createElement('div') as unknown as Wrapper
  grp.className = 'me-wrapper'
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

export const createParent = function (this: MindElixir, nodeObj: NodeObj) {
  const p = document.createElement('div') as unknown as Parent
  p.className = 'me-parent'
  const tpc = this.createTopic(nodeObj)
  shapeTpc.call(this, tpc, nodeObj)
  p.appendChild(tpc)
  return { p, tpc }
}

export const createChildren = function (this: MindElixir, wrappers: Wrapper[]) {
  const children = document.createElement('div') as unknown as Children
  children.className = 'me-children'
  children.append(...wrappers)
  return children
}

export const createTopic = function (this: MindElixir, nodeObj: NodeObj) {
  const topic = document.createElement('div') as unknown as Topic
  topic.className = 'me-tpc'
  topic.nodeObj = nodeObj
  topic.dataset.nodeid = 'me' + nodeObj.id
  return topic
}

export const createMain = function (directionClass: DirectionClass): HTMLElement {
  const el = document.createElement('div')
  el.className = `me-main ${directionClass}`
  return el
}

export const directionOf = function (el: Element): DirectionClass {
  const cls = el.classList
  if (cls.contains(DirectionClass.DOWN)) return DirectionClass.DOWN
  if (cls.contains(DirectionClass.LHS)) return DirectionClass.LHS
  return DirectionClass.RHS
}

export function selectText(div: HTMLElement) {
  const range = document.createRange()
  range.selectNodeContents(div)
  const getSelection = window.getSelection()
  if (getSelection) {
    getSelection.removeAllRanges()
    getSelection.addRange(range)
  }
}

export const editTopic = function (this: MindElixir, el: Topic) {
  console.time('editTopic')
  if (!el) return
  const div = document.createElement('div')
  const node = el.nodeObj

  // Get the original content from topic
  const originalContent = node.topic

  // Use getOffsetLT to calculate el's offset relative to this.nodes
  const { offsetLeft, offsetTop } = getOffsetLT(this.nodes, el)

  // Insert input box into this.nodes instead of el
  this.nodes.appendChild(div)
  div.id = 'input-box'
  div.textContent = originalContent
  div.contentEditable = 'plaintext-only'
  div.spellcheck = false
  const style = getComputedStyle(el)
  div.style.cssText = `
  left: ${offsetLeft}px;
  top: ${offsetTop}px;
  min-width:${el.offsetWidth - 8}px;
  color:${style.color};
  font-size:${style.fontSize};
  padding:${style.padding};
  margin:${style.margin}; 
  background-color:${style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor};
  border: ${style.border};
  border-radius:${style.borderRadius}; `
  if (this.direction === LEFT) div.style.right = '0'
  el.style.opacity = '0'
  selectText(div)

  this.bus.fire('operation', {
    name: 'beginEdit',
    target: el.nodeObj,
  })

  div.addEventListener('keydown', e => {
    e.stopPropagation()
    if (e.isComposing) return
    const key = e.key

    if (key === 'Enter' || key === 'Tab') {
      // keep wrap for shift enter
      if (e.shiftKey) return

      e.preventDefault()
      div.blur()
      this.container.focus()
    } else if (key === 'Escape') {
      e.preventDefault()
      div.textContent = originalContent // Discard edits
      div.blur()
      this.container.focus()
    }
  })

  div.addEventListener('blur', () => {
    if (!div) return
    el.style.opacity = '1'
    // NOTE: Do not use textContent here. Safari requires innerText to properly map <br> tags to \n line breaks for editable content.
    // Read before remove(): innerText degrades to textContent on detached elements and loses line breaks.
    const inputContent = div.innerText?.trim() || ''
    div.remove()
    if (inputContent === originalContent || inputContent === '') return

    // Update topic content
    node.topic = inputContent

    if (this.markdown) {
      el.text.innerHTML = this.markdown(node.topic, node)
    } else {
      el.text.textContent = inputContent
    }

    this.linkDiv()
    this.bus.fire('operation', {
      name: 'finishEdit',
      target: node,
      origin: originalContent,
    })
  })
  console.timeEnd('editTopic')
}

export const createExpander = function (expanded: boolean | undefined): Expander {
  const expander = document.createElement('div') as unknown as Expander
  expander.className = 'me-epd' + (expanded !== false ? ' minus' : '')
  // if expanded is undefined, treat as expanded
  expander.expanded = expanded !== false
  return expander
}
