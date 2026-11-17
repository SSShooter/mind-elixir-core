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

/**
 * IME-guarded commit/cancel keymap for the inline editor. Internal — wired by
 * {@link openInlineEditor}.
 *
 * IME guard: Safari fires compositionend BEFORE the Enter/Esc that confirms the
 * IME candidate, so those keydowns arrive with `isComposing === false`. A
 * `compositionJustEnded` flag — set on compositionend, cleared by a 0 ms timer —
 * swallows Enter/Esc until the end of that task, so confirming a candidate
 * never closes the editor; any keydown in a LATER task is an ordinary command.
 * Only Enter/Esc are swallowed there — those are the keys that can dismiss the
 * candidate window — so a late timer can never eat an ordinary keystroke.
 * `isComposing` + keyCode 229 cover the keydowns fired DURING a composition
 * (both engines report them). Same pattern as Outliner's `compositionJustEnded`.
 *
 * Behavior: Enter/Tab commit (blur + refocus the map container; Shift+Enter
 * keeps the wrap). Escape cancels — the editor text is reset to `original`
 * before blur, so the caller's commit policy sees unchanged input and reverts.
 */
const bindEditorKeydown = function (div: HTMLElement, container: HTMLElement, original: string) {
  let compositionJustEnded = false
  div.addEventListener('compositionend', () => {
    compositionJustEnded = true
    setTimeout(() => {
      compositionJustEnded = false
    }, 0)
  })

  div.addEventListener('keydown', e => {
    e.stopPropagation()
    if (e.isComposing || e.keyCode === 229) return
    if (compositionJustEnded && (e.key === 'Enter' || e.key === 'Escape')) return

    if (e.key === 'Enter' || e.key === 'Tab') {
      // keep wrap for shift enter
      if (e.shiftKey) return

      e.preventDefault()
      div.blur()
      container.focus()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      div.textContent = original // Discard edits — blur then reads unchanged input
      div.blur()
      container.focus()
    }
  })
}

/**
 * Open the map's inline editor over `host`: a contenteditable div that replaces
 * the visible content while editing. Shared mechanism of node-topic editing
 * ({@link editTopic}) and SVG-label editing (`editSvgText`); the caller
 * positions and styles the div and keeps the commit POLICY, this wires the
 * shared MECHANISM:
 *
 * - `#input-box` identity, plaintext-only content, initial text, selection
 * - the IME-guarded keymap (see {@link bindEditorKeydown})
 * - `host` is hidden while editing and unhidden on blur
 * - blur: read the trimmed content (innerText — Safari maps `<br>` to `\n`
 *   there; read before remove, innerText degrades on detached elements), then
 *   hand the RAW content to `onCommit`. Empty and unchanged input are NOT
 *   filtered here: the topic editor treats both as no-ops, the label editor
 *   treats empty as a revert.
 */
export const openInlineEditor = function (options: {
  mei: MindElixir
  editor: HTMLDivElement
  host: HTMLElement
  original: string
  onCommit: (content: string) => void
  /** Extra blur-time restore (e.g. the topic selection outline). */
  onRestore?: () => void
}) {
  const { mei, editor, host, original, onCommit, onRestore } = options
  editor.id = 'input-box'
  editor.textContent = original
  editor.contentEditable = 'plaintext-only'
  editor.spellcheck = false
  selectText(editor)
  bindEditorKeydown(editor, mei.container, original)
  host.style.opacity = '0'

  editor.addEventListener('blur', () => {
    // NOTE: Do not use textContent here. Safari requires innerText to properly
    // map <br> tags to \n line breaks for editable content.
    const content = editor.innerText?.trim() || ''
    editor.remove()
    host.style.opacity = '1'
    onRestore?.()
    onCommit(content)
  })
}

export const editTopic = function (this: MindElixir, el: Topic) {
  console.time('editTopic')
  if (!el) return
  const div = document.createElement('div')
  const node = el.nodeObj

  // Get the original content from topic
  const originalContent = node.topic

  // Anchor the input box to the text span (not the whole topic), so on nodes
  // with an image the box stays at the text position and the image remains
  // visible while editing.
  const textEl = el.text
  const textOffset = getOffsetLT(this.nodes, textEl)
  const style = getComputedStyle(el)
  // textOffset already includes el's padding; subtract it so the padded box
  // renders its text exactly where the original text was.
  const offsetLeft = textOffset.offsetLeft - parseFloat(style.paddingLeft || '0')
  const offsetTop = textOffset.offsetTop - parseFloat(style.paddingTop || '0')

  // Insert input box into this.nodes instead of el
  this.nodes.appendChild(div)
  div.style.cssText = `
  left: ${offsetLeft}px;
  top: ${offsetTop}px;
  min-width:${textEl.offsetWidth - 8}px;
  color:${style.color};
  font-size:${style.fontSize};
  padding:${style.padding};
  margin:${style.margin}; 
  background-color:${style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor};
  border: ${style.border};
  border-radius:${style.borderRadius}; `
  if (this.direction === LEFT) div.style.right = '0'
  // Hide the selection outline while editing; the input box replaces it visually.
  el.style.outline = 'none'

  this.bus.fire('operation', {
    name: 'beginEdit',
    target: el.nodeObj,
  })

  openInlineEditor({
    mei: this,
    editor: div,
    host: textEl,
    original: originalContent,
    onRestore: () => {
      el.style.outline = ''
    },
    onCommit: content => {
      if (content === originalContent || content === '') return
      node.topic = content
      if (this.markdown) {
        el.text.innerHTML = this.markdown(node.topic, node)
      } else {
        el.text.textContent = content
      }
      this.linkDiv()
      this.bus.fire('operation', {
        name: 'finishEdit',
        target: node,
        origin: originalContent,
      })
    },
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
