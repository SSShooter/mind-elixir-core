import type { Topic } from '../types/dom'
import type { MindElixirInstance } from '../types/index'

const selectRootLeft = (mei: MindElixirInstance) => {
  const tpcs = mei.map.querySelectorAll('.lhs>me-wrapper>me-parent>me-tpc')
  mei.selectNode(tpcs[Math.ceil(tpcs.length / 2) - 1] as Topic)
}
const selectRootRight = (mei: MindElixirInstance) => {
  const tpcs = mei.map.querySelectorAll('.rhs>me-wrapper>me-parent>me-tpc')
  mei.selectNode(tpcs[Math.ceil(tpcs.length / 2) - 1] as Topic)
}
const selectRoot = (mei: MindElixirInstance) => {
  mei.selectNode(mei.map.querySelector('me-root>me-tpc') as Topic)
}
const selectParent = function (mei: MindElixirInstance, currentNode: Topic) {
  const parent = currentNode.parentElement.parentElement.parentElement.previousSibling
  if (parent) {
    const target = parent.firstChild
    mei.selectNode(target)
  }
}
const selectFirstChild = function (mei: MindElixirInstance, currentNode: Topic) {
  const children = currentNode.parentElement.nextSibling
  if (children && children.firstChild) {
    const target = children.firstChild.firstChild.firstChild
    mei.selectNode(target)
  }
}
const handleLeftRight = function (mei: MindElixirInstance, direction: 'lhs' | 'rhs') {
  const current = mei.currentNode || mei.currentNodes?.[0]
  if (!current) return
  const nodeObj = current.nodeObj
  const main = current.offsetParent.offsetParent.parentElement
  if (nodeObj.root) {
    direction === 'lhs' ? selectRootLeft(mei) : selectRootRight(mei)
  } else if (main.className === direction) {
    selectFirstChild(mei, current)
  } else {
    if (nodeObj.parent?.root) {
      selectRoot(mei)
    } else {
      selectParent(mei, current)
    }
  }
}
const handlePrevNext = function (mei: MindElixirInstance, direction: 'previous' | 'next') {
  const current = mei.currentNode || mei.currentNodes?.[0]
  if (!current) return
  const nodeObj = current.nodeObj
  if (nodeObj.root) return
  const s = (direction + 'Sibling') as 'previousSibling' | 'nextSibling'
  const sibling = current.parentElement.parentElement[s]
  if (sibling) {
    mei.selectNode(sibling.firstChild.firstChild)
  }
}

export default function (mind: MindElixirInstance) {
  const handleRemove = () => {
    if (mind.currentArrow) mind.removeArrow()
    else if (mind.currentSummary) mind.removeSummary(mind.currentSummary.summaryObj.id)
    else if (mind.currentNode) {
      mind.removeNode()
    } else if (mind.currentNodes) {
      mind.removeNodes(mind.currentNodes)
    }
  }
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
        handlePrevNext(mind, 'previous')
      }
    },
    40: e => {
      // down
      if (e.altKey) {
        mind.moveDownNode()
      } else {
        handlePrevNext(mind, 'next')
      }
    },
    37: e => {
      // left
      if (e.metaKey || e.ctrlKey) {
        return mind.initLeft()
      }
      handleLeftRight(mind, 'lhs')
    },
    39: e => {
      // right
      if (e.metaKey || e.ctrlKey) {
        return mind.initRight()
      }
      handleLeftRight(mind, 'rhs')
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
    // del,backspace
    8: handleRemove,
    46: handleRemove,
  }
  mind.map.onkeydown = e => {
    e.preventDefault()
    if (!mind.editable) return
    // console.log(e, e.target)
    if (e.target !== e.currentTarget) {
      // input
      return
    }
    const keyHandler = key2func[e.keyCode]
    keyHandler && keyHandler(e)
  }
}
