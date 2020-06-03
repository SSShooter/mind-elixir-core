import hotkeys from 'hotkeys-js'
export default function (mind) {
  hotkeys.unbind('del,backspace,f2,tab,enter,left,right,down,up')
  hotkeys(
    'del,backspace',
    {
      element: mind.map,
    },
    (e) => {
      if (mind.currentLink) mind.removeLink()
      else mind.removeNode()
    }
  )
  hotkeys(
    'f2,tab,enter,left,right,down,up,pageup,pagedown,ctrl+z, command+z',
    {
      element: mind.map,
    },
    (e, handler) => {
      console.log(e, handler)
      e.preventDefault()
      key2func[handler.key]()
    }
  )

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
      if (mind.currentNode.offsetParent.offsetParent.className === 'right-side')
        mind.selectParent()
      else if (
        mind.currentNode.offsetParent.offsetParent.className === 'left-side'
      )
        mind.selectFirstChild()
    },
    right: () => {
      if (!mind.currentNode) return
      if (mind.currentNode.offsetParent.offsetParent.className === 'right-side')
        mind.selectFirstChild()
      else if (
        mind.currentNode.offsetParent.offsetParent.className === 'left-side'
      )
        mind.selectParent()
    },
    pageup() {
      mind.moveUpNode()
    },
    pagedown() {
      mind.moveDownNode()
    },
    // ctrl z
    'command+z': () => {
      mind.undo()
    },
  }
}
