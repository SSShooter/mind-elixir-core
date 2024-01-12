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
    13: e => {
      // enter
      if (e.shiftKey) {
        mind.insertSibling('before')
      } else if (e.ctrlKey) {
        mind.insertParent()
      } else {
        mind.insertSibling('after')
      }
    },
    9: () => {
      // tab
      mind.addChild()
    },
    112: () => {
      // f1
      mind.toCenter()
    },
    113: () => {
      // f2
      mind.beginEdit()
    },
    38: e => {
      // up
      if (e.altKey) {
        mind.moveUpNode()
      } else if (e.metaKey || e.ctrlKey) {
        return mind.initSide()
      } else {
        mind.selectPrevSibling()
      }
    },
    40: e => {
      // down
      if (e.altKey) {
        mind.moveDownNode()
      } else {
        mind.selectNextSibling()
      }
    },
    37: e => {
      // left
      if (e.metaKey || e.ctrlKey) {
        return mind.initLeft()
      }
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
    39: e => {
      // right
      if (e.metaKey || e.ctrlKey) {
        return mind.initRight()
      }
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
        if (mind.currentNode) mind.waitCopy = [mind.currentNode]
        else if (mind.currentNodes) mind.waitCopy = mind.currentNodes
      }
    },
    86: (e: KeyboardEvent) => {
      if (!mind.waitCopy || !mind.currentNode) return
      if (e.metaKey || e.ctrlKey) {
        // ctrl v
        if (mind.waitCopy.length === 1) {
          mind.copyNode(mind.waitCopy[0], mind.currentNode)
        } else {
          mind.copyNodes(mind.waitCopy, mind.currentNode)
        }
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
    // ctrl 0
    48: (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        mind.scale(1)
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
      // bug
      if (mind.currentArrow) mind.removeArrow()
      else if (mind.currentSummary) mind.removeSummary(mind.currentSummary.summaryObj.id)
      else if (mind.currentNode) {
        mind.removeNode()
      } else if (mind.currentNodes) {
        mind.removeNodes(mind.currentNodes)
      }
    } else {
      const keyHandler = key2func[e.keyCode]
      keyHandler && keyHandler(e)
    }
  }
}
