import type { MindElixirInstance } from '../types/index'

export default function (mind: MindElixirInstance) {
  const key2func: Record<string, (e: KeyboardEvent) => void> = {
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
      if (mind.currentNode.offsetParent.offsetParent.className === 'rhs') {
        mind.selectParent()
      } else if (mind.currentNode.offsetParent.offsetParent.className === 'lhs' || mind.currentNode.nodeObj.root) {
        mind.selectFirstChild()
      }
    },
    39: () => {
      // right
      if (!mind.currentNode) return
      if (mind.currentNode.offsetParent.offsetParent.className === 'rhs' || mind.currentNode.nodeObj.root) {
        mind.selectFirstChild()
      } else if (mind.currentNode.offsetParent.offsetParent.className === 'lhs') {
        mind.selectParent()
      }
    },
    33() {
      // pageUp
      mind.moveUpNode()
    },
    34() {
      // pageDown
      mind.moveDownNode()
    },
    67: (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        // ctrl c
        mind.waitCopy = mind.currentNode
      }
    },
    86: (e: KeyboardEvent) => {
      if (!mind.waitCopy || !mind.currentNode) return
      if (e.metaKey || e.ctrlKey) {
        // ctrl v
        mind.copyNode(mind.waitCopy, mind.currentNode)
        mind.waitCopy = null
      }
    },
    // ctrl z
    90: (e: KeyboardEvent) => {
      if (!mind.allowUndo) return
      if (e.metaKey || e.ctrlKey) mind.undo()
    },
    // ctrl +
    187: (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (mind.scaleVal > 1.6) return
        mind.scale((mind.scaleVal += 0.2))
      }
    },
    // ctrl -
    189: (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (mind.scaleVal < 0.6) return
        mind.scale((mind.scaleVal -= 0.2))
      }
    },
  }
  mind.map.onkeydown = e => {
    // console.log(e)
    e.preventDefault()
    if (!mind.editable) return
    // console.log(e, e.target)
    if (e.target !== e.currentTarget) {
      // input
      return
    }
    if (e.keyCode === 8 || e.keyCode === 46) {
      // del,backspace
      if (mind.currentLink) mind.removeLink()
      else mind.removeNode()
    } else {
      const keyHandler = key2func[e.keyCode]
      keyHandler && keyHandler(e)
    }
  }
}
