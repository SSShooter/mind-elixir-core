export default function (mind) {
  let key2func = {
    13: () => {
      // enter
      mind.insertSibling()
    },
    9: () => {
      // tab
      mind.addChild()
    },
    113: () => {
      // f2
      mind.beginEdit()
    },
    38: () => {
      // up
      mind.selectPrevSibling()
    },
    40: () => {
      // down
      mind.selectNextSibling()
    },
    37: () => {
      // left
      if (!mind.currentNode) return
      if (mind.currentNode.offsetParent.offsetParent.className === 'rhs')
        mind.selectParent()
      else if (mind.currentNode.offsetParent.offsetParent.className === 'lhs')
        mind.selectFirstChild()
    },
    39: () => {
      // right
      if (!mind.currentNode) return
      if (mind.currentNode.offsetParent.offsetParent.className === 'rhs')
        mind.selectFirstChild()
      else if (mind.currentNode.offsetParent.offsetParent.className === 'lhs')
        mind.selectParent()
    },
    33() {
      // pageUp
      mind.moveUpNode()
    },
    34() {
      // pageDown
      mind.moveDownNode()
    },
    // ctrl z
    90: e => {
      if (!mind.allowUndo) return
      if (e.metaKey || e.ctrlKey) mind.undo()
    },
    // +
    187: e => {
      if (e.metaKey || e.ctrlKey) {
        if (mind.scaleVal > 1.6) return
        mind.scale((mind.scaleVal += 0.2))
      }
    },
    // -
    189: e => {
      if (e.metaKey || e.ctrlKey) {
        if (mind.scaleVal < 0.6) return
        mind.scale((mind.scaleVal -= 0.2))
      }
    },
  }
  mind.map.onkeydown = e => {
    // console.log(e, e.target)
    if (e.target !== e.currentTarget) {
      // input
      return
    }
    e.preventDefault()
    if (e.keyCode === 8 || e.keyCode === 46) {
      // del,backspace
      if (mind.currentLink) mind.removeLink()
      else mind.removeNode()
    } else {
      key2func[e.keyCode] && key2func[e.keyCode](e)
    }
  }
}
