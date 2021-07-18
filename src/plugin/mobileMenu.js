export default function (mind, option) {
  let createLi = (id, name) => {
    let div = document.createElement('div')
    div.id = id
    div.innerHTML = `<svg class="icon" aria-hidden="true">
    <use xlink:href="#icon-${name}"></use>
  </svg>`
    return div
  }

  let add_child = createLi('cm-add_child', 'zijiedian')
  let add_sibling = createLi('cm-add_sibling', 'tongjijiedian-')
  let remove_child = createLi('cm-remove_child', 'shanchu2')
  // let focus = createLi('cm-fucus', i18n[locale].focus, '')
  // let unfocus = createLi('cm-unfucus', i18n[locale].cancelFocus, '')
  let up = createLi('cm-up', 'rising')
  let down = createLi('cm-down', 'falling')
  let edit = createLi('cm-edit', 'edit')
  // let link = createLi('cm-down', i18n[locale].link, '')

  let menuUl = document.createElement('ul')
  menuUl.className = 'menu-list'
  // if (!option || option.link) {
  //   menuUl.appendChild(link)
  // }
  if (option && option.extend) {
    for (let i = 0; i < option.extend.length; i++) {
      let item = option.extend[i]
      let dom = createLi(item.name, item.name)
      menuUl.appendChild(dom)
      dom.onclick = e => {
        item.onclick(e)
      }
    }
  }
  let menuContainer = document.createElement('mmenu')
  menuContainer.appendChild(add_child)
  menuContainer.appendChild(add_sibling)
  menuContainer.appendChild(remove_child)
  // if (!option || option.focus) {
  //   menuContainer.appendChild(focus)
  //   menuContainer.appendChild(unfocus)
  // }
  menuContainer.appendChild(up)
  menuContainer.appendChild(down)
  menuContainer.appendChild(edit)
  menuContainer.hidden = true

  mind.container.append(menuContainer)
  let isRoot = true
  // mind.container.onclick = function (e) {
  //   e.preventDefault()
  //   // console.log(e.pageY, e.screenY, e.clientY)
  //   let target = e.target
  //   if (target.tagName === 'TPC') {
  //     if (target.parentElement.tagName === 'ROOT') {
  //       isRoot = true
  //     } else {
  //       isRoot = false
  //     }
  //     // if (isRoot) {
  //     //   focus.className = 'disabled'
  //     //   up.className = 'disabled'
  //     //   down.className = 'disabled'
  //     //   add_sibling.className = 'disabled'
  //     //   remove_child.className = 'disabled'
  //     // } else {
  //     //   focus.className = ''
  //     //   up.className = ''
  //     //   down.className = ''
  //     //   add_sibling.className = ''
  //     //   remove_child.className = ''
  //     // }
  //     mind.selectNode(target)
  //     menuContainer.hidden = false
  //     let height = menuUl.offsetHeight
  //     let width = menuUl.offsetWidth
  //     let rect = target.getBoundingClientRect()
  //     // menuUl.style.top = rect.top - 10 - height + 'px'
  //     // menuUl.style.left = rect.left - (width - rect.width) / 2 + 'px'
  //     // menuUl.style.left = e.clientX + 'px'
  //   }
  // }

  mind.bus.addListener('unselectNode', function () {
    menuContainer.hidden = true
  })
  mind.bus.addListener('selectNode', function (nodeObj) {
    menuContainer.hidden = false
    if (nodeObj.root) {
      isRoot = true
    } else {
      isRoot = false
    }
  })
  menuContainer.onclick = e => {
    if (e.target === menuContainer) menuContainer.hidden = true
  }

  add_child.onclick = e => {
    mind.addChild()
  }
  add_sibling.onclick = e => {
    if (isRoot) return
    mind.insertSibling()
  }
  remove_child.onclick = e => {
    if (isRoot) return
    mind.removeNode()
  }
  // focus.onclick = e => {
  //   if (isRoot) return
  //   mind.focusNode(mind.currentNode)
  //   menuContainer.hidden = true
  // }
  // unfocus.onclick = e => {
  //   mind.cancelFocus()
  //   menuContainer.hidden = true
  // }
  up.onclick = e => {
    if (isRoot) return
    mind.moveUpNode()
  }
  down.onclick = e => {
    if (isRoot) return
    mind.moveDownNode()
  }
  edit.onclick = e => {
    mind.beginEdit()
  }
  // link.onclick = e => {
  //   let from = mind.currentNode
  //   mind.map.addEventListener(
  //     'click',
  //     e => {
  //       e.preventDefault()
  //       if (
  //         e.target.parentElement.nodeName === 'T' ||
  //         e.target.parentElement.nodeName === 'ROOT'
  //       ) {
  //         mind.createLink(from, mind.currentNode)
  //       } else {
  //         console.log('取消连接')
  //       }
  //     },
  //     {
  //       once: true,
  //     }
  //   )
  // }
}
