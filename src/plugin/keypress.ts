import type { Topic } from '../types/dom'
import type { MindElixirInstance } from '../types/index'

const selectLeft = (mei: MindElixirInstance) => {
  const tpcs = mei.map.querySelectorAll('.lhs>me-wrapper>me-parent>me-tpc')
  mei.selectNode(tpcs[Math.ceil(tpcs.length / 2) - 1] as Topic)
}
const selectRight = (mei: MindElixirInstance) => {
  const tpcs = mei.map.querySelectorAll('.rhs>me-wrapper>me-parent>me-tpc')
  mei.selectNode(tpcs[Math.ceil(tpcs.length / 2) - 1] as Topic)
}
const selectRoot = (mei: MindElixirInstance) => {
  mei.selectNode(mei.map.querySelector('me-root>me-tpc') as Topic)
}

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
      const nodeObj = mind.currentNode.nodeObj
      const main = mind.currentNode.offsetParent.offsetParent.parentElement
      if (mind.currentNode.nodeObj.root) {
        selectLeft(mind)
      } else if (main.className === 'rhs') {
        if (nodeObj.parent?.root) {
          selectRoot(mind)
        } else {
          mind.selectParent()
        }
      } else if (main.className === 'lhs') {
        mind.selectFirstChild()
      }
    },
    39: () => {
      // right
      if (!mind.currentNode) return
      const nodeObj = mind.currentNode.nodeObj
      const main = mind.currentNode.offsetParent.offsetParent.parentElement
      if (nodeObj.root) {
        selectRight(mind)
      } else if (main.className === 'lhs') {
        if (nodeObj.parent?.root) {
          selectRoot(mind)
        } else {
          mind.selectParent()
        }
      } else if (main.className === 'rhs') {
        mind.selectFirstChild()
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
