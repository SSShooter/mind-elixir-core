import i18n from '../i18n'
import type { Topic } from '../types/dom'
import type { MindElixirInstance } from '../types/index'
import { encodeHTML, isTopic } from '../utils/index'
import dragMoveHelper from '../utils/dragMoveHelper'
import './contextMenu.less'

export type ContextMenuOption = {
  focus?: boolean
  link?: boolean
  extend?: {
    name: string
    key?: string
    onclick: (e: MouseEvent) => void
  }[]
}

export default function (mind: MindElixirInstance, option?: ContextMenuOption) {
  const createTips = (words: string) => {
    const div = document.createElement('div')
    div.innerText = words
    div.className = 'tips'
    return div
  }
  const createLi = (id: string, name: string, keyname: string) => {
    const li = document.createElement('li')
    li.id = id
    li.innerHTML = `<span>${encodeHTML(name)}</span><span ${keyname ? 'class="key"' : ''}>${encodeHTML(keyname)}</span>`
    return li
  }
  const locale = i18n[mind.locale] ? mind.locale : 'en'
  const lang = i18n[locale]
  const add_child = createLi('cm-add_child', lang.addChild, 'Tab')
  const add_parent = createLi('cm-add_parent', lang.addParent, 'Ctrl + Enter')
  const add_sibling = createLi('cm-add_sibling', lang.addSibling, 'Enter')
  const remove_child = createLi('cm-remove_child', lang.removeNode, 'Delete')
  const focus = createLi('cm-fucus', lang.focus, '')
  const unfocus = createLi('cm-unfucus', lang.cancelFocus, '')
  const up = createLi('cm-up', lang.moveUp, 'PgUp')
  const down = createLi('cm-down', lang.moveDown, 'Pgdn')
  const link = createLi('cm-link', lang.link, '')
  const summary = createLi('cm-summary', lang.summary, '')

  const menuUl = document.createElement('ul')
  menuUl.className = 'menu-list'
  menuUl.appendChild(add_child)
  menuUl.appendChild(add_parent)
  menuUl.appendChild(add_sibling)
  menuUl.appendChild(remove_child)
  if (!option || option.focus) {
    menuUl.appendChild(focus)
    menuUl.appendChild(unfocus)
  }
  menuUl.appendChild(up)
  menuUl.appendChild(down)
  menuUl.appendChild(summary)
  if (!option || option.link) {
    menuUl.appendChild(link)
  }
  if (option && option.extend) {
    for (let i = 0; i < option.extend.length; i++) {
      const item = option.extend[i]
      const dom = createLi(item.name, item.name, item.key || '')
      menuUl.appendChild(dom)
      dom.onclick = e => {
        item.onclick(e)
      }
    }
  }
  const menuContainer = document.createElement('div')
  menuContainer.className = 'context-menu'
  menuContainer.appendChild(menuUl)
  menuContainer.hidden = true

  mind.container.append(menuContainer)
  let isRoot = true
  mind.container.oncontextmenu = function (e) {
    e.preventDefault()
    if (!mind.editable) return
    if (dragMoveHelper.moved) return
    // console.log(e.pageY, e.screenY, e.clientY)
    const target = e.target as HTMLElement
    if (isTopic(target)) {
      if (target.parentElement.tagName === 'ME-ROOT') {
        isRoot = true
      } else {
        isRoot = false
      }
      if (isRoot) {
        focus.className = 'disabled'
        up.className = 'disabled'
        down.className = 'disabled'
        add_parent.className = 'disabled'
        add_sibling.className = 'disabled'
        remove_child.className = 'disabled'
      } else {
        focus.className = ''
        up.className = ''
        down.className = ''
        add_parent.className = ''
        add_sibling.className = ''
        remove_child.className = ''
      }
      if (!mind.currentNodes) mind.selectNode(target)
      menuContainer.hidden = false

      if (dragMoveHelper.mousedown) {
        dragMoveHelper.mousedown = false
      }

      menuUl.style.top = ''
      menuUl.style.bottom = ''
      menuUl.style.left = ''
      menuUl.style.right = ''
      const rect = menuUl.getBoundingClientRect()
      const height = menuUl.offsetHeight
      const width = menuUl.offsetWidth

      const relativeY = e.clientY - rect.top
      const relativeX = e.clientX - rect.left

      if (height + relativeY > window.innerHeight) {
        menuUl.style.top = ''
        menuUl.style.bottom = '0px'
      } else {
        menuUl.style.bottom = ''
        menuUl.style.top = relativeY + 15 + 'px'
      }

      if (width + relativeX > window.innerWidth) {
        menuUl.style.left = ''
        menuUl.style.right = '0px'
      } else {
        menuUl.style.right = ''
        menuUl.style.left = relativeX + 10 + 'px'
      }
    }
  }

  menuContainer.onclick = e => {
    if (e.target === menuContainer) menuContainer.hidden = true
  }

  add_child.onclick = () => {
    mind.addChild()
    menuContainer.hidden = true
  }
  add_parent.onclick = () => {
    mind.insertParent()
    menuContainer.hidden = true
  }
  add_sibling.onclick = () => {
    if (isRoot) return
    mind.insertSibling('after')
    menuContainer.hidden = true
  }
  remove_child.onclick = () => {
    if (isRoot) return
    mind.removeNode()
    menuContainer.hidden = true
  }
  focus.onclick = () => {
    if (isRoot) return
    mind.focusNode(mind.currentNode as Topic)
    menuContainer.hidden = true
  }
  unfocus.onclick = () => {
    mind.cancelFocus()
    menuContainer.hidden = true
  }
  up.onclick = () => {
    if (isRoot) return
    mind.moveUpNode()
    menuContainer.hidden = true
  }
  down.onclick = () => {
    if (isRoot) return
    mind.moveDownNode()
    menuContainer.hidden = true
  }
  link.onclick = () => {
    menuContainer.hidden = true
    const from = mind.currentNode as Topic
    const tips = createTips(lang.clickTips)
    mind.container.appendChild(tips)
    mind.map.addEventListener(
      'click',
      e => {
        e.preventDefault()
        tips.remove()
        const target = e.target as Topic
        if (target.parentElement.tagName === 'ME-PARENT' || target.parentElement.tagName === 'ME-ROOT') {
          mind.createArrow(from, target)
        } else {
          console.log('link cancel')
        }
      },
      {
        once: true,
      }
    )
  }
  summary.onclick = () => {
    menuContainer.hidden = true
    mind.createSummary()
    mind.unselectNodes()
  }
  return () => {
    // maybe useful?
    add_child.onclick = null
    add_parent.onclick = null
    add_sibling.onclick = null
    remove_child.onclick = null
    focus.onclick = null
    unfocus.onclick = null
    up.onclick = null
    down.onclick = null
    link.onclick = null
    summary.onclick = null
    menuContainer.onclick = null
    mind.container.oncontextmenu = null
  }
}
