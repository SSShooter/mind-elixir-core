import type { Topic } from '../types/dom'
import type { KeypressOptions, MindElixirInstance } from '../types/index'
import { DirectionClass } from '../types/index'

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
const handleLeftRight = function (mei: MindElixirInstance, direction: DirectionClass) {
  const current = mei.currentNode || mei.currentNodes?.[0]
  if (!current) return
  const nodeObj = current.nodeObj
  const main = current.offsetParent.offsetParent.parentElement
  if (!nodeObj.parent) {
    direction === DirectionClass.LHS ? selectRootLeft(mei) : selectRootRight(mei)
  } else if (main.className === direction) {
    selectFirstChild(mei, current)
  } else {
    if (!nodeObj.parent?.parent) {
      selectRoot(mei)
    } else {
      selectParent(mei, current)
    }
  }
}
const handlePrevNext = function (mei: MindElixirInstance, direction: 'previous' | 'next') {
  const current = mei.currentNode
  if (!current) return
  const nodeObj = current.nodeObj
  if (!nodeObj.parent) return
  const s = (direction + 'Sibling') as 'previousSibling' | 'nextSibling'
  const sibling = current.parentElement.parentElement[s]
  if (sibling) {
    mei.selectNode(sibling.firstChild.firstChild)
  } else {
    // handle multiple nodes including last node
    mei.selectNode(current)
  }
}
export const handleZoom = function (
  mei: MindElixirInstance,
  direction: 'in' | 'out',
  offset?: {
    x: number
    y: number
  }
) {
  const { scaleVal, scaleSensitivity } = mei
  switch (direction) {
    case 'in':
      if (scaleVal > 1.6) return
      mei.scale(scaleVal + scaleSensitivity, offset)
      break
    case 'out':
      if (scaleVal < 0.6) return
      mei.scale(scaleVal - scaleSensitivity, offset)
  }
}

export default function (mind: MindElixirInstance, options: boolean | KeypressOptions) {
  options = options === true ? {} : options
  const handleRemove = () => {
    if (mind.currentArrow) mind.removeArrow()
    else if (mind.currentSummary) mind.removeSummary(mind.currentSummary.summaryObj.id)
    else if (mind.currentNodes) {
      mind.removeNodes(mind.currentNodes)
    }
  }
  const key2func: Record<string, (e: KeyboardEvent) => void> = {
    Enter: e => {
      // enter
      if (e.shiftKey) {
        mind.insertSibling('before')
      } else if (e.ctrlKey) {
        mind.insertParent()
      } else {
        mind.insertSibling('after')
      }
    },
    Tab: () => {
      mind.addChild()
    },
    F1: () => {
      mind.toCenter()
    },
    F2: () => {
      mind.beginEdit()
    },
    ArrowUp: e => {
      if (e.altKey) {
        mind.moveUpNode()
      } else if (e.metaKey || e.ctrlKey) {
        return mind.initSide()
      } else {
        handlePrevNext(mind, 'previous')
      }
    },
    ArrowDown: e => {
      if (e.altKey) {
        mind.moveDownNode()
      } else {
        handlePrevNext(mind, 'next')
      }
    },
    ArrowLeft: e => {
      if (e.metaKey || e.ctrlKey) {
        return mind.initLeft()
      }
      handleLeftRight(mind, DirectionClass.LHS)
    },
    ArrowRight: e => {
      if (e.metaKey || e.ctrlKey) {
        return mind.initRight()
      }
      handleLeftRight(mind, DirectionClass.RHS)
    },
    PageUp: () => {
      return mind.moveUpNode()
    },
    PageDown: () => {
      mind.moveDownNode()
    },
    c: (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        mind.waitCopy = mind.currentNodes
      }
    },
    x: (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        mind.waitCopy = mind.currentNodes
        handleRemove()
      }
    },
    v: (e: KeyboardEvent) => {
      if (!mind.waitCopy || !mind.currentNode) return
      if (e.metaKey || e.ctrlKey) {
        if (mind.waitCopy.length === 1) {
          mind.copyNode(mind.waitCopy[0], mind.currentNode)
        } else {
          mind.copyNodes(mind.waitCopy, mind.currentNode)
        }
      }
    },
    '=': (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        handleZoom(mind, 'in')
      }
    },
    '-': (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        handleZoom(mind, 'out')
      }
    },
    '0': (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        mind.scale(1)
      }
    },
    Delete: handleRemove,
    Backspace: handleRemove,
    ...options,
  }
  mind.container.onkeydown = e => {
    e.preventDefault()
    if (!mind.editable) return
    if (e.target !== e.currentTarget) {
      // input
      return
    }
    const keyHandler = key2func[e.key]
    keyHandler && keyHandler(e)
  }
}
