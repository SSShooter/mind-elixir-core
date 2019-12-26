import hotkeys from 'hotkeys-js'
export default function(mind) {
  hotkeys.unbind('del,backspace,space,spacebar,tab,enter,left,right,down,up,pageup,pagedown,command+z,ctrl+z,command+shift+z,ctrl+shift+z,command+c,ctrl+c')
  hotkeys(
    'del,backspace',
    {
      element: mind.map,
    },
    e => {
      if (mind.currentLink) mind.removeLink()
      else mind.removeNode()
    }
  )
  hotkeys(
    'tab,enter,left,right,down,up,pageup,pagedown',
    {
      element: mind.map,
    },
    (e, handler) => {
      e.preventDefault()
      key2func[handler.key]()
    }
  )
  hotkeys('command+z, ctrl+z',{element: mind.map},e => {
    mind.pre()
  })
  hotkeys('command+shift+z, ctrl+shift+z',{element: mind.map},e => {
    mind.pro()
  })
  hotkeys('command+c,ctrl+c',{element:mind.map},e => {
    mind.copy()
  })
  hotkeys('command+v,ctrl+v',{element:mind.map},e => {
    mind.paste()
  })

  hotkeys('space,spacebar',{element:mind.map},e =>{
    console.log('space')
    mind.beginEdit()
  })
  let key2func = {
    enter: () => {
      mind.insertSibling()
    },
    tab: () => {
      mind.addChild()
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
    }
  }
}
