import { handleZoom } from './plugin/keypress'
import {
  createNodeDragState,
  handleNodeDragStart,
  handleNodeDragMove,
  handleNodeDragEnd,
  handleNodeDragCancel,
  updateGhostPosition,
} from './plugin/nodeDraggable'
import type { SummarySvgGroup } from './summary'
import type { Expander, CustomSvg, Topic } from './types/dom'
import type { MindElixirInstance } from './types/index'
import { getDistance, isTopic, on } from './utils'

export default function (mind: MindElixirInstance) {
  const { dragMoveHelper } = mind
  let lastTap = 0
  mind.spacePressed = false

  let lastDistance: number | null = null
  const activePointers = new Map<number, { x: number; y: number }>()

  // Node drag state - only initialize if draggable is enabled
  const nodeDragState = mind.draggable ? createNodeDragState(mind) : null

  // Long press state for touch devices
  let longPressTimer: number | null = null
  let longPressStartPos: { x: number; y: number } | null = null
  let longPressTarget: HTMLElement | null = null
  let longPressPointerId: number | null = null
  const LONG_PRESS_DURATION = 500 // 长按时间阈值（毫秒）
  const LONG_PRESS_MOVE_THRESHOLD = 10 // 移动阈值（像素）

  // Helper: Clear long press timer and state
  const clearLongPress = () => {
    if (longPressTimer !== null) {
      clearTimeout(longPressTimer)
      longPressTimer = null
      longPressStartPos = null
      longPressTarget = null
      longPressPointerId = null
    }
  }

  // Helper: Release pointer capture if it exists
  const releasePointerCaptureIfExists = (target: HTMLElement, pointerId: number) => {
    if (target.hasPointerCapture && target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId)
    }
  }

  // Helper: Handle SVG label interactions (click or double-click)
  const handleSvgLabelInteraction = (target: HTMLElement, isDoubleClick: boolean): boolean => {
    const label = target.closest('.svg-label') as HTMLElement
    if (label) {
      const id = label.dataset.svgId!
      const type = label.dataset.type
      const svgElement = document.getElementById(id)
      if (svgElement) {
        if (type === 'arrow') {
          isDoubleClick ? mind.editArrowLabel(svgElement as unknown as CustomSvg) : mind.selectArrow(svgElement as unknown as CustomSvg)
          return true
        } else if (type === 'summary') {
          isDoubleClick ? mind.editSummary(svgElement as unknown as SummarySvgGroup) : mind.selectSummary(svgElement as unknown as SummarySvgGroup)
          return true
        }
      }
    }

    // Handle topiclinks container
    const topiclinksContainer = target.closest('.topiclinks')
    if (topiclinksContainer) {
      const svgGroup = target.closest('g')
      if (svgGroup) {
        isDoubleClick ? mind.editArrowLabel(svgGroup as unknown as CustomSvg) : mind.selectArrow(svgGroup as unknown as CustomSvg)
        return true
      }
    }

    // Handle summary container
    const summaryContainer = target.closest('.summary')
    if (summaryContainer) {
      const svgGroup = target.closest('g')
      if (svgGroup) {
        isDoubleClick ? mind.editSummary(svgGroup as unknown as SummarySvgGroup) : mind.selectSummary(svgGroup as unknown as SummarySvgGroup)
        return true
      }
    }

    return false
  }

  const handleClick = (e: MouseEvent) => {
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

    // Skip click handling if we just finished a node drag
    if (nodeDragState?.isDragging) {
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

    // Handle SVG label interactions
    handleSvgLabelInteraction(target, false)
  }

  const handleDblClick = (e: MouseEvent) => {
    if (!mind.editable) return
    const target = e.target as HTMLElement
    console.log('handleDblClick', target)
    if (isTopic(target)) {
      mind.beginEdit(target)
    }

    // Handle SVG label interactions
    handleSvgLabelInteraction(target, true)
  }

  const handleTouchDblClick = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return
    if (activePointers.size > 1) return
    const currentTime = new Date().getTime()
    const tapLength = currentTime - lastTap
    if (tapLength < 300 && tapLength > 0) {
      handleDblClick(e)
    }

    lastTap = currentTime
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      mind.spacePressed = true
      mind.container.classList.add('space-pressed')
    }
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      mind.spacePressed = false
      mind.container.classList.remove('space-pressed')
    }
  }

  const handlePointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') {
      // Record current touch point
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      // Only intercept the original logic when there are 2+ fingers
      if (activePointers.size === 2) {
        // Initialize distance when the second finger touches down
        const [p1, p2] = Array.from(activePointers.values())
        lastDistance = getDistance(p1, p2)
        // Cancel long press when second finger touches
        clearLongPress()
      }
    }

    dragMoveHelper.moved = false

    const target = e.target as HTMLElement
    const mouseMoveButton = mind.mouseSelectionButton === 0 ? 2 : 0

    // Handle node dragging with left button or touch (only for topics)
    if (nodeDragState && (e.button === 0 || e.pointerType === 'touch')) {
      // For touch, only start drag with single finger
      if (e.pointerType === 'touch' && activePointers.size > 1) {
        // Cancel any ongoing drag if second finger touches
        if (nodeDragState.isDragging || nodeDragState.pointerId !== null) {
          handleNodeDragCancel(mind, nodeDragState)
        }
      } else if (e.pointerType === 'touch' && activePointers.size === 1) {
        // For touch: start long press timer instead of immediate drag
        if (isTopic(target) || target.closest('me-tpc')) {
          longPressStartPos = { x: e.clientX, y: e.clientY }
          longPressTarget = target
          longPressPointerId = e.pointerId
          longPressTimer = window.setTimeout(() => {
            // Long press triggered, start drag with immediate ghost display
            if (handleNodeDragStart(mind, nodeDragState, e, true)) {
              if (longPressTarget) {
                longPressTarget.setPointerCapture(e.pointerId)
              }
              updateGhostPosition(nodeDragState.ghost, e.clientX, e.clientY)
            }
            longPressTimer = null
            longPressStartPos = null
            longPressTarget = null
            longPressPointerId = null
          }, LONG_PRESS_DURATION)
        }
      } else if (e.pointerType === 'mouse' && handleNodeDragStart(mind, nodeDragState, e, false)) {
        // For mouse: start drag immediately
        target.setPointerCapture(e.pointerId)
        return
      }
    }

    // Support space + left mouse button drag
    const isSpaceDrag = mind.spacePressed && e.button === 0 && e.pointerType === 'mouse'
    const isNormalDrag = (e.button === mouseMoveButton && e.pointerType === 'mouse') || e.pointerType === 'touch'

    if (!isSpaceDrag && !isNormalDrag) return

    // Store initial position for movement calculation
    dragMoveHelper.x = e.clientX
    dragMoveHelper.y = e.clientY

    if (target.className !== 'circle' && target.contentEditable !== 'plaintext-only') {
      dragMoveHelper.mousedown = true
      // Capture pointer to ensure we receive all pointer events even if pointer moves outside the element
      target.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch' && activePointers.has(e.pointerId)) {
      // Update current touch point position
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

      // Check if long press should be cancelled due to movement
      if (longPressTimer !== null && longPressStartPos !== null && e.pointerId === longPressPointerId) {
        const dx = e.clientX - longPressStartPos.x
        const dy = e.clientY - longPressStartPos.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance > LONG_PRESS_MOVE_THRESHOLD) {
          // Movement exceeded threshold, cancel long press
          clearLongPress()
        }
      }

      // Only handle pinch zoom when there are 2+ fingers
      if (activePointers.size >= 2) {
        const [p1, p2] = Array.from(activePointers.values())
        const newDistance = getDistance(p1, p2)

        if (lastDistance == null) {
          lastDistance = newDistance
        } else {
          const delta = newDistance - lastDistance
          const THRESHOLD = 8

          if (Math.abs(delta) > THRESHOLD) {
            if (delta > 0) {
              handleZoom(mind, 'in', {
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2,
              })
            } else {
              handleZoom(mind, 'out', {
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2,
              })
            }

            lastDistance = newDistance
          }
        }
        return
      }
    }

    // Handle node dragging
    if (nodeDragState && nodeDragState.pointerId !== null) {
      handleNodeDragMove(mind, nodeDragState, e)
      // If dragging started, don't process map movement
      if (nodeDragState.isDragging) {
        return
      }
    }

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
    if (e.pointerType === 'touch') {
      activePointers.delete(e.pointerId)
      // End this zoom gesture when fewer than 2 fingers remain
      if (activePointers.size < 2) {
        lastDistance = null
      }

      // Cancel long press timer if still active
      clearLongPress()
    }

    // Handle node drag end
    if (nodeDragState && nodeDragState.pointerId !== null) {
      const wasDragging = nodeDragState.isDragging
      handleNodeDragEnd(mind, nodeDragState, e)

      // Release pointer capture
      releasePointerCaptureIfExists(e.target as HTMLElement, e.pointerId)

      // If we were dragging nodes, don't process map movement end
      if (wasDragging) {
        return
      }
    }

    if (!dragMoveHelper.mousedown) return
    releasePointerCaptureIfExists(e.target as HTMLElement, e.pointerId)
    dragMoveHelper.clear()
  }

  // Handle cases where pointerup might not be triggered (e.g., alert dialogs)
  const handleBlur = () => {
    // Clear long press timer
    clearLongPress()

    // Clear drag state when window loses focus (e.g., alert dialog appears)
    if (dragMoveHelper.mousedown) {
      dragMoveHelper.clear()
    }
    // Also cancel any ongoing node drag
    if (nodeDragState && (nodeDragState.isDragging || nodeDragState.pointerId !== null)) {
      handleNodeDragCancel(mind, nodeDragState)
    }
  }

  const handlePointerCancel = (e: PointerEvent) => {
    if (e.pointerType === 'touch') {
      activePointers.delete(e.pointerId)
      if (activePointers.size < 2) {
        lastDistance = null
      }

      // Cancel long press timer
      clearLongPress()
    }

    // Cancel node drag
    if (nodeDragState && nodeDragState.pointerId === e.pointerId) {
      handleNodeDragCancel(mind, nodeDragState)
    }

    // Also handle as pointer up for map movement
    handlePointerUp(e)
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
    { dom: container, evt: 'pointercancel', func: handlePointerCancel },
    { dom: container, evt: 'pointerdown', func: handleTouchDblClick },
    { dom: container, evt: 'click', func: handleClick },
    { dom: container, evt: 'dblclick', func: handleDblClick },
    { dom: container, evt: 'contextmenu', func: handleContextMenu },
    { dom: container, evt: 'wheel', func: typeof mind.handleWheel === 'function' ? mind.handleWheel : handleWheel },
    { dom: container, evt: 'blur', func: handleBlur },
    { dom: container, evt: 'keydown', func: handleKeyDown },
    { dom: container, evt: 'keyup', func: handleKeyUp },
  ])
  return off
}
