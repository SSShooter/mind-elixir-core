import i18n from '../i18n'
import { encodeHTML } from '../utils/index'

export default function(mind, option) {
  const createTips = words => {
    const div = document.createElement('div')
    div.innerText = words
    div.style.cssText = 'position:absolute;bottom:20px;left:50%;transform:translateX(-50%);'
    return div
  }
  const createLi = (id, name, keyname) => {
    const li = document.createElement('li')
    li.id = id
    li.innerHTML = `<span>${encodeHTML(name)}</span><span>${encodeHTML(keyname)}</span>`
    return li
  }
  const locale = i18n[mind.locale] ? mind.locale : 'en'

  const add_child = createLi('cm-add_child', i18n[locale].addChild, 'tab')
  const add_sibling = createLi('cm-add_sibling', i18n[locale].addSibling, 'enter')
  const remove_child = createLi(
    'cm-remove_child',
    i18n[locale].removeNode,
    'delete'
  )
  const focus = createLi('cm-fucus', i18n[locale].focus, '')
  const unfocus = createLi('cm-unfucus', i18n[locale].cancelFocus, '')
  const up = createLi('cm-up', i18n[locale].moveUp, 'PgUp')
  const down = createLi('cm-down', i18n[locale].moveDown, 'Pgdn')
  const link = createLi('cm-down', i18n[locale].link, '')

  const menuUl = document.createElement('ul')
  menuUl.className = 'menu-list'
  menuUl.appendChild(add_child)
  menuUl.appendChild(add_sibling)
  menuUl.appendChild(remove_child)
  if (!option || option.focus) {
    menuUl.appendChild(focus)
    menuUl.appendChild(unfocus)
  }
  menuUl.appendChild(up)
  menuUl.appendChild(down)
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
  const menuContainer = document.createElement('cmenu')
  menuContainer.appendChild(menuUl)
  menuContainer.hidden = true

  mind.container.append(menuContainer)
  let isRoot = true
  mind.container.oncontextmenu = function(e) {
    e.preventDefault()
    if (!mind.editable) return
    // console.log(e.pageY, e.screenY, e.clientY)
    const target = e.target
    if (target.tagName === 'TPC') {
      if (target.parentElement.tagName === 'ROOT') {
        isRoot = true
      } else {
        isRoot = false
      }
      if (isRoot) {
        focus.className = 'disabled'
        up.className = 'disabled'
        down.className = 'disabled'
        add_sibling.className = 'disabled'
        remove_child.className = 'disabled'
      } else {
        focus.className = ''
        up.className = ''
        down.className = ''
        add_sibling.className = ''
        remove_child.className = ''
      }
      mind.selectNode(target)
      menuContainer.hidden = false
      const height = menuUl.offsetHeight
      const width = menuUl.offsetWidth
      if (height + e.clientY > window.innerHeight) {
        menuUl.style.top = ''
        menuUl.style.bottom = '0px'
      } else {
        menuUl.style.bottom = ''
        menuUl.style.top = e.clientY + 15 + 'px'
      }
      if (width + e.clientX > window.innerWidth) {
        menuUl.style.left = ''
        menuUl.style.right = '0px'
      } else {
        menuUl.style.right = ''
        menuUl.style.left = e.clientX + 10 + 'px'
      }
    }
  }

  menuContainer.onclick = e => {
    if (e.target === menuContainer) menuContainer.hidden = true
  }

  add_child.onclick = e => {
    mind.addChild()
    menuContainer.hidden = true
  }
  add_sibling.onclick = e => {
    if (isRoot) return
    mind.insertSibling()
    menuContainer.hidden = true
  }
  remove_child.onclick = e => {
    if (isRoot) return
    mind.removeNode()
    menuContainer.hidden = true
  }
  focus.onclick = e => {
    if (isRoot) return
    mind.focusNode(mind.currentNode)
    menuContainer.hidden = true
  }
  unfocus.onclick = e => {
    mind.cancelFocus()
    menuContainer.hidden = true
  }
  up.onclick = e => {
    if (isRoot) return
    mind.moveUpNode()
    menuContainer.hidden = true
  }
  down.onclick = e => {
    if (isRoot) return
    mind.moveDownNode()
    menuContainer.hidden = true
  }
  link.onclick = e => {
    menuContainer.hidden = true
    const from = mind.currentNode
    const tips = createTips(i18n[locale].clickTips)
    mind.container.appendChild(tips)
    mind.map.addEventListener(
      'click',
      e => {
        e.preventDefault()
        tips.remove()
        if (
          e.target.parentElement.nodeName === 'T' ||
          e.target.parentElement.nodeName === 'ROOT'
        ) {
          mind.createLink(from, mind.currentNode)
        } else {
          console.log('取消连接')
        }
      },
      {
        once: true,
      }
    )
  }
}
