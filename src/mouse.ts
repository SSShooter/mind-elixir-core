import { handleZoom } from './plugin/keypress'
import type { SummarySvgGroup } from './summary'
import type { Expander, CustomSvg, Topic } from './types/dom'
import type { MindElixirInstance } from './types/index'
import { isTopic, on } from './utils'

export default function (mind: MindElixirInstance) {
  const { dragMoveHelper } = mind
  let lastTap = 0
  // 初始化空格键状态到实例中
  mind.spacePressed = false

  const handleClick = (e: MouseEvent) => {
    console.log('handleClick', e)
    // Only handle primary button clicks
    if (e.button !== 0) return
    if (mind.helper1?.moved) {
      mind.helper1.clear()
      return
    }
    if (mind.helper2?.moved) {
      mind.helper2.clear()
      return
    }
    if (dragMoveHelper.moved) {
      dragMoveHelper.clear()
      return
    }
    const target = e.target as HTMLElement
    if (target.tagName === 'ME-EPD') {
      if (e.ctrlKey || e.metaKey) {
        mind.expandNodeAll((target as Expander).previousSibling)
      } else {
        mind.expandNode((target as Expander).previousSibling)
      }
    } else if (target.tagName === 'ME-TPC' && mind.currentNodes.length > 1) {
      // This is a bit complex, intertwined with selection and nodeDraggable
      // The main conflict is between multi-node dragging and selecting a single node when multiple nodes are already selected
      mind.selectNode(target as Topic)
    } else if (!mind.editable) {
      return
    }
    // Check if clicked on a label div
    const labelDiv = target.closest('.svg-label') as HTMLElement
    if (labelDiv && labelDiv.dataset.svgId) {
      const svgElement = document.getElementById(labelDiv.dataset.svgId)
      if (svgElement) {
        const svgGroup = svgElement.closest('g')
        if (svgGroup) {
          // Check if it's an arrow or summary based on parent container
          const topiclinksContainer = svgGroup.closest('.topiclinks')
          const summaryContainer = svgGroup.closest('.summary')

          if (topiclinksContainer) {
            mind.selectArrow(svgGroup as unknown as CustomSvg)
            return
          } else if (summaryContainer) {
            mind.selectSummary(svgGroup as unknown as SummarySvgGroup)
            return
          }
        }
      }
    }

    // Find the closest SVG container using native closest() method
    const topiclinksContainer = target.closest('.topiclinks')
    if (topiclinksContainer) {
      const svgGroup = target.closest('g')
      if (svgGroup) {
        mind.selectArrow(svgGroup as unknown as CustomSvg)
        return
      }
    }

    const summaryContainer = target.closest('.summary')
    if (summaryContainer) {
      const svgGroup = target.closest('g')
      if (svgGroup) {
        mind.selectSummary(svgGroup as unknown as SummarySvgGroup)
        return
      }
    }
  }

  const handleDblClick = (e: MouseEvent) => {
    if (!mind.editable) return
    const target = e.target as HTMLElement
    console.log('handleDblClick', target)
    if (isTopic(target)) {
      mind.beginEdit(target)
    }

    // Check if double-clicked on a label div
    const labelDiv = target.closest('.svg-label') as HTMLElement
    if (labelDiv && labelDiv.dataset.svgId) {
      const svgElement = document.getElementById(labelDiv.dataset.svgId)
      if (svgElement) {
        const svgGroup = svgElement.closest('g')
        if (svgGroup) {
          // Check if it's an arrow or summary based on parent container
          const topiclinksContainer = svgGroup.closest('.topiclinks')
          const summaryContainer = svgGroup.closest('.summary')

          if (topiclinksContainer) {
            mind.editArrowLabel(svgGroup as unknown as CustomSvg)
            return
          } else if (summaryContainer) {
            mind.editSummary(svgGroup as unknown as SummarySvgGroup)
            return
          }
        }
      }
    }

    // Find the closest SVG container using native closest() method
    const topiclinksContainer = target.closest('.topiclinks')
    if (topiclinksContainer) {
      const svgGroup = target.closest('g')
      if (svgGroup) {
        mind.editArrowLabel(svgGroup as unknown as CustomSvg)
        return
      }
    }

    const summaryContainer = target.closest('.summary')
    if (summaryContainer) {
      const svgGroup = target.closest('g')
      if (svgGroup) {
        mind.editSummary(svgGroup as unknown as SummarySvgGroup)
        return
      }
    }
  }

  const handleTouchDblClick = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return
    const currentTime = new Date().getTime()
    const tapLength = currentTime - lastTap
    console.log('tapLength', tapLength)
    if (tapLength < 300 && tapLength > 0) {
      handleDblClick(e)
    }

    lastTap = currentTime
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      mind.spacePressed = true
      mind.container.classList.add('space-pressed')
      e.preventDefault() // 防止页面滚动
    }
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      mind.spacePressed = false
      mind.container.classList.remove('space-pressed')
    }
  }

  const handlePointerDown = (e: PointerEvent) => {
    dragMoveHelper.moved = false

    // 支持空格+左键拖拽
    const isSpaceDrag = mind.spacePressed && e.button === 0 && e.pointerType === 'mouse'
    const mouseMoveButton = mind.mouseSelectionButton === 0 ? 2 : 0
    const isNormalDrag = e.button === mouseMoveButton && e.pointerType === 'mouse'

    if (!isSpaceDrag && !isNormalDrag) return

    // Store initial position for movement calculation
    dragMoveHelper.x = e.clientX
    dragMoveHelper.y = e.clientY

    const target = e.target as HTMLElement

    // 对于空格拖拽，直接启用；对于普通拖拽，需要检查目标元素
    if (isSpaceDrag || (target.className !== 'circle' && target.contentEditable !== 'plaintext-only')) {
      dragMoveHelper.mousedown = true
      // Capture pointer to ensure we receive all pointer events even if pointer moves outside the element
      target.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: PointerEvent) => {
    // click trigger pointermove in windows chrome
    if ((e.target as HTMLElement).contentEditable !== 'plaintext-only' || (mind.spacePressed && dragMoveHelper.mousedown)) {
      // drag and move the map
      // Calculate movement delta manually since pointer events don't have movementX/Y
      const movementX = e.clientX - dragMoveHelper.x
      const movementY = e.clientY - dragMoveHelper.y

      dragMoveHelper.onMove(movementX, movementY)
    }

    dragMoveHelper.x = e.clientX
    dragMoveHelper.y = e.clientY
  }

  const handlePointerUp = (e: PointerEvent) => {
    if (!dragMoveHelper.mousedown) return
    const target = e.target as HTMLElement
    if (target.hasPointerCapture && target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId)
    }
    dragMoveHelper.clear()
  }

  // Handle cases where pointerup might not be triggered (e.g., alert dialogs)
  const handleBlur = () => {
    // Clear drag state when window loses focus (e.g., alert dialog appears)
    if (dragMoveHelper.mousedown) {
      dragMoveHelper.clear()
    }
  }

  const handleContextMenu = (e: MouseEvent) => {
    console.log('handleContextMenu', e)
    e.preventDefault()
    // Only handle right-click for context menu
    if (e.button !== 2) return
    if (!mind.editable) return
    const target = e.target as HTMLElement
    if (isTopic(target) && !target.classList.contains('selected')) {
      mind.selectNode(target)
    }
    setTimeout(() => {
      // delay to avoid conflict with click event on Mac
      if (mind.dragMoveHelper.moved) return
      mind.bus.fire('showContextMenu', e)
    }, 200)
  }

  const handleWheel = (e: WheelEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
      if (e.deltaY < 0) handleZoom(mind, 'in', mind.dragMoveHelper)
      else if (mind.scaleVal - mind.scaleSensitivity > 0) handleZoom(mind, 'out', mind.dragMoveHelper)
    } else if (e.shiftKey) {
      mind.move(-e.deltaY, 0)
    } else {
      mind.move(-e.deltaX, -e.deltaY)
    }
  }

  const { container } = mind
  const off = on([
    { dom: container, evt: 'pointerdown', func: handlePointerDown },
    { dom: container, evt: 'pointermove', func: handlePointerMove },
    { dom: container, evt: 'pointerup', func: handlePointerUp },
    { dom: container, evt: 'pointerup', func: handleTouchDblClick },
    { dom: container, evt: 'click', func: handleClick },
    { dom: container, evt: 'dblclick', func: handleDblClick },
    { dom: container, evt: 'contextmenu', func: handleContextMenu },
    { dom: container, evt: 'wheel', func: typeof mind.handleWheel === 'function' ? mind.handleWheel : handleWheel },
    { dom: container, evt: 'blur', func: handleBlur },
    { dom: document, evt: 'keydown', func: handleKeyDown },
    { dom: document, evt: 'keyup', func: handleKeyUp },
  ])
  return off
}
