import { stringifyData } from '../interact'
import type { Topic } from '../types/dom'
import type { KeypressOptions, MindElixirInstance, NodeObj } from '../types/index'
import { DirectionClass } from '../types/index'
import { setExpand, unionTopics } from '../utils'

const COPY_MAGIC = 'MIND-ELIXIR-WAIT-COPY'

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
      mei.scale(scaleVal + scaleSensitivity, offset)
      break
    case 'out':
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

  // Track key sequence for Ctrl+K+Ctrl+0
  let ctrlKPressed = false
  let ctrlKTimeout: number | null = null
  const handleControlKPlusX = (e: KeyboardEvent) => {
    const nodeData = mind.nodeData
    if (e.key === '0') {
      // Ctrl+K+Ctrl+0: Collapse all nodes
      for (const node of nodeData.children!) {
        setExpand(node, false)
      }
    }
    if (e.key === '=') {
      // Ctrl+K+Ctrl+1: Expand all nodes
      for (const node of nodeData.children!) {
        setExpand(node, true)
      }
    }
    if (['1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(e.key)) {
      for (const node of nodeData.children!) {
        setExpand(node, true, Number(e.key) - 1)
      }
    }
    mind.refresh()
    mind.toCenter()

    ctrlKPressed = false
    if (ctrlKTimeout) {
      clearTimeout(ctrlKTimeout)
      ctrlKTimeout = null
      mind.container.removeEventListener('keydown', handleControlKPlusX)
    }
  }

  const key2func: Record<string, (e: KeyboardEvent) => void> = {
    Enter: e => {
      if (e.shiftKey) {
        mind.insertSibling('before')
      } else if (e.ctrlKey || e.metaKey) {
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
      if (mind.currentSummary) {
        mind.editSummary(mind.currentSummary)
      } else if (mind.currentArrow) {
        mind.editArrowLabel(mind.currentArrow)
      } else {
        mind.beginEdit()
      }
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
        if (ctrlKPressed) {
          return
        } else {
          // Regular Ctrl+0: Reset zoom
          mind.scale(1)
        }
      }
    },
    k: (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        ctrlKPressed = true
        // Reset the flag after 2 seconds if no follow-up key is pressed
        if (ctrlKTimeout) {
          clearTimeout(ctrlKTimeout)
          mind.container.removeEventListener('keydown', handleControlKPlusX)
        }
        ctrlKTimeout = window.setTimeout(() => {
          ctrlKPressed = false
          ctrlKTimeout = null
        }, 2000)
        mind.container.addEventListener('keydown', handleControlKPlusX)
      }
    },
    Delete: handleRemove,
    Backspace: handleRemove,
    ...options,
  }
  mind.container.onkeydown = e => {
    // it will prevent all input in children node, so we have to stop propagation in input element
    const isCopyCutPaste = (e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key)
    if (!isCopyCutPaste) {
      e.preventDefault()
    }
    if (!mind.editable) return
    const keyHandler = key2func[e.key]
    keyHandler && keyHandler(e)
  }

  const handleSetNodesClip = (e: ClipboardEvent) => {
    if (mind.currentNodes.length === 0) return false
    if (e.clipboardData) {
      const nodeObjs = unionTopics(mind.currentNodes).map(node => node.nodeObj)
      const data = stringifyData({
        magic: COPY_MAGIC,
        data: nodeObjs,
      })
      e.clipboardData.setData('text/plain', data)
      e.preventDefault()
      return true
    }
    return false
  }

  mind.container.addEventListener('copy', handleSetNodesClip)
  mind.container.addEventListener('cut', (e: ClipboardEvent) => {
    if (handleSetNodesClip(e)) handleRemove()
  })

  mind.container.addEventListener('paste', (e: ClipboardEvent) => {
    const json = e.clipboardData?.getData('text/plain')
    if (json) {
      try {
        const parsed = JSON.parse(json)
        if (parsed && parsed.magic === COPY_MAGIC && Array.isArray(parsed.data)) {
          const data = parsed.data as NodeObj[]
          const tpc = data.map(obj => ({ nodeObj: obj })) as Topic[] // fake Topic
          if (data.length > 0 && mind.currentNode) {
            mind.copyNodes(tpc, mind.currentNode)
            e.preventDefault()
          }
          return
        }
      } catch (error) {
        // Not a valid JSON from MindElixir, fall through to pasteHandler.
      }
    }
    if (mind.pasteHandler) {
      mind.pasteHandler(e)
    }
  })
}
