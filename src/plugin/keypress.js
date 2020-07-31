import hotkeys from 'hotkeys-js'
export default function (mind) {
  hotkeys.unbind('del,backspace,f2,tab,enter,left,right,down,up')
  hotkeys('del,backspace', { scope: 'mind-elixir' }, e => {
    if (mind.currentLink) mind.removeLink()
    else mind.removeNode()
  })
  hotkeys(
    'f2,tab,enter,left,right,down,up,pageup,pagedown,ctrl+z, command+z',
    { scope: 'mind-elixir' },
    (e, handler) => {
      console.log(e, handler)
      e.preventDefault()
      key2func[handler.key]()
    }
  )
  hotkeys.setScope('mind-elixir')

  let key2func = {
    enter: () => {
      mind.insertSibling()
    },
    tab: () => {
      mind.addChild()
    },
    f2: () => {
      mind.beginEdit()
    },
    up: () => {
      mind.selectPrevSibling()
    },
    down: () => {
      mind.selectNextSibling()
    },
    left: () => {
      if (!mind.currentNode) return
      if (mind.currentNode.offsetParent.offsetParent.className === 'rhs')
        mind.selectParent()
      else if (mind.currentNode.offsetParent.offsetParent.className === 'lhs')
        mind.selectFirstChild()
    },
    right: () => {
      if (!mind.currentNode) return
      if (mind.currentNode.offsetParent.offsetParent.className === 'rhs')
        mind.selectFirstChild()
      else if (mind.currentNode.offsetParent.offsetParent.className === 'lhs')
        mind.selectParent()
    },
    pageup() {
      mind.moveUpNode()
    },
    pagedown() {
      mind.moveDownNode()
    },
    // ctrl z
    'ctrl+z': () => {
      mind.undo()
    },
    'command+z': () => {
      mind.undo()
    },
  }
  return hotkeys
}
