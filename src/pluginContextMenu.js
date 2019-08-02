let i18n = {
  cn: {
    addChild: '插入子节点',
    addSibling: '插入同级节点',
    removeNode: '删除节点',
    focus: '专注',
    cancelFocus: '取消专注',
    moveUp: '上移',
    moveDown: '下移',
    link: '连接',
  },
  en: {
    addChild: 'Add a child',
    addSibling: 'Add a sibling',
    removeNode: 'Remove node',
    focus: 'Focus Mode',
    cancelFocus: 'Cancel Focus Mode',
    moveUp: 'Move up',
    moveDown: 'Move down',
    link: 'Link',
  },
  ja: {
    addChild: '插入子节点',
    addSibling: '插入同级节点',
    removeNode: '删除节点',
    focus: '专注',
    cancelFocus: '取消专注',
    moveUp: '上移',
    moveDown: '下移',
    link: '连接',
  },
}

let createLi = (id, name, keyname) => {
  let li = document.createElement('li')
  li.id = id
  li.innerHTML = `<span>${name}</span><span>${keyname}</span>`
  return li
}

let add_child = createLi('cm-add_child', '插入子节点', 'tab')
let add_sibling = createLi('cm-add_sibling', '插入同级节点', 'enter')
let remove_child = createLi('cm-remove_child', '删除节点', 'delete')
let focus = createLi('cm-fucus', '专注', '')
let unfocus = createLi('cm-unfucus', '取消专注', '')
let up = createLi('cm-up', '上移', 'PgUp')
let down = createLi('cm-down', '下移', 'Pgdn')
let link = createLi('cm-down', '连接', '')

let menuUl = document.createElement('ul')
menuUl.className = 'menu-list'
menuUl.appendChild(add_child)
menuUl.appendChild(add_sibling)
menuUl.appendChild(remove_child)
menuUl.appendChild(focus)
menuUl.appendChild(unfocus)
menuUl.appendChild(up)
menuUl.appendChild(down)
menuUl.appendChild(link)
let menuContainer = document.createElement('cmenu')
menuContainer.appendChild(menuUl)
menuContainer.hidden = true

export default function(mind) {
  mind.container.append(menuContainer)
  mind.container.oncontextmenu = function(e) {
    e.preventDefault()
    let target = e.target
    if (target.tagName === 'TPC') {
      mind.selectNode(target)
      menuContainer.hidden = false
      let height = menuUl.offsetHeight
      let width = menuUl.offsetWidth
      if (height + e.pageY > window.innerHeight) {
        menuUl.style.top = ''
        menuUl.style.bottom = '0px'
      } else {
        menuUl.style.bottom = ''
        menuUl.style.top = e.pageY + 15 + 'px'
      }
      if (width + e.pageX > window.innerWidth) {
        menuUl.style.left = ''
        menuUl.style.right = '0px'
      } else {
        menuUl.style.right = ''
        menuUl.style.left = e.pageX + 10 + 'px'
      }
    }
  }
  mind.container.onclick = e => {
    menuContainer.hidden = true
  }
  add_child.onclick = e => {
    mind.addChild()
  }
  add_sibling.onclick = e => {
    mind.insertSibling()
  }
  remove_child.onclick = e => {
    mind.removeNode()
  }
  focus.onclick = e => {
    mind.focusNode(mind.currentNode)
  }
  unfocus.onclick = e => {
    mind.cancelFocus()
  }
  up.onclick = e => {
    mind.moveUpNode()
  }
  down.onclick = e => {
    mind.moveDownNode()
  }
  link.onclick = e => {
    let from = mind.currentNode
    mind.map.addEventListener(
      'click',
      e => {
        e.preventDefault()
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

// TODO 允许拓展右键菜单
