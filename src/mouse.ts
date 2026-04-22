import {
  createNodeDragState,
  handleNodeDragStart,
  handleNodeDragMove,
  handleNodeDragEnd,
  handleNodeDragCancel,
  updateGhostPosition,
} from './plugin/nodeDraggable'
import { handleWheelZoom } from './plugin/keypress'
import type { Expander, ArrowSvg, Topic, SummarySvg } from './types/dom'
import type { MindElixirInstance } from './types/index'
import { getDistance, isTopic, on } from './utils'

export default function (mind: MindElixirInstance) {
  const { panHelper, container } = mind
  let lastTap = 0
  let lastTapTarget: EventTarget | null = null
  mind.spacePressed = false

  let lastDistance: number | null = null
  const activePointers = new Map<number, { x: number; y: number }>()

  // Node drag state - always initialize
  const nodeDragState = createNodeDragState(mind)

  // Long press state for touch devices
  const longPressHelper = {
    timer: null as number | null,
    startPos: null as { x: number; y: number } | null,
    target: null as HTMLElement | null,
    pointerId: null as number | null,
    DURATION: 500,
    MOVE_THRESHOLD: 10,
    clear() {
      if (this.timer !== null) {
        clearTimeout(this.timer)
        this.timer = null
        this.startPos = null
        this.target = null
        this.pointerId = null
      }
    },
    start(e: PointerEvent, cb: (e: PointerEvent) => void) {
      this.timer = window.setTimeout(() => {
        cb(e)
        this.timer = null
        this.startPos = null
        this.target = null
        this.pointerId = null
      }, this.DURATION)
      this.startPos = { x: e.clientX, y: e.clientY }
      this.target = e.target as HTMLElement
      this.pointerId = e.pointerId
    },
    handleMove(e: PointerEvent) {
      if (this.timer !== null && this.startPos !== null && e.pointerId === this.pointerId) {
        const dx = e.clientX - this.startPos.x
        const dy = e.clientY - this.startPos.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance > this.MOVE_THRESHOLD) {
          this.clear()
        }
      }
    },
  }

  // Helper: Release pointer capture if it exists
  const releasePointerCaptureIfExists = (target: HTMLElement, pointerId: number) => {
    if (target.hasPointerCapture && target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId)
    }
  }

  // Helper: Handle SVG label interactions (click or double-click)
  const handleSvgLabelInteraction = (target: HTMLElement, isDoubleClick: boolean): boolean => {
    if (target.id === 'input-box' || target.closest('#input-box')) return false

    const label = target.closest('.svg-label') as HTMLElement
    if (label) {
      const id = label.dataset.svgId!
      const type = label.dataset.type
      const svgElement = document.getElementById(id)
      if (svgElement) {
        if (type === 'arrow') {
          isDoubleClick ? mind.editArrowLabel(svgElement as unknown as ArrowSvg) : mind.selectArrow(svgElement as unknown as ArrowSvg)
          return true
        } else if (type === 'summary') {
          isDoubleClick ? mind.editSummary(svgElement as unknown as SummarySvg) : mind.selectSummary(svgElement as unknown as SummarySvg)
          return true
        }
      }
    }

    // Handle topiclinks container
    const topiclinksContainer = target.closest('.topiclinks')
    if (topiclinksContainer) {
      const svgGroup = target.closest('g')
      if (svgGroup) {
        isDoubleClick ? mind.editArrowLabel(svgGroup as unknown as ArrowSvg) : mind.selectArrow(svgGroup as unknown as ArrowSvg)
        return true
      }
    }

    // Handle summary container
    const summaryContainer = target.closest('.summary')
    if (summaryContainer) {
      const svgGroup = target.closest('g')
      if (svgGroup) {
        isDoubleClick ? mind.editSummary(svgGroup as unknown as SummarySvg) : mind.selectSummary(svgGroup as unknown as SummarySvg)
        return true
      }
    }

    return false
  }

  const handleSingleClick = (e: PointerEvent) => {
    // Only handle primary button clicks
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (mind.helper1?.moved) {
      mind.helper1.clear()
      return
    }
    if (mind.helper2?.moved) {
      mind.helper2.clear()
      return
    }
    if (panHelper.moved) {
      panHelper.clear()
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
    } else if (!mind.editable) {
      return
    }

    // Handle SVG label interactions
    handleSvgLabelInteraction(target, false)
  }

  const handleDoubleClick = (e: MouseEvent | PointerEvent) => {
    if (!mind.editable) return
    const target = e.target as HTMLElement
    if (isTopic(target)) {
      mind.beginEdit(target)
    }

    // Handle SVG label interactions
    handleSvgLabelInteraction(target, true)
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
        longPressHelper.clear()
      }
    }

    panHelper.moved = false

    const target = e.target as HTMLElement
    const mouseMoveButton = mind.mouseSelectionButton === 0 ? 2 : 0

    // Unified node selection
    if (mind.editable && (e.button === 0 || e.pointerType === 'touch') && isTopic(target)) {
      mind.selection?.cancel()
      const nodes = mind.currentNodes || []
      const isMulti = e.ctrlKey || e.metaKey

      if (isMulti) {
        if (nodes.includes(target)) {
          mind.selection?.deselect(target)
          return // Skip drag if we just deselected
        } else {
          mind.selection?.select(target)
        }
      } else if (!nodes.includes(target)) {
        // This is a bit complex, intertwined with selection and nodeDraggable
        // The main conflict is between multi-node dragging and selecting a single node when multiple nodes are already selected
        mind.selectNode(target)
      }
    }

    // Handle node dragging with left button or touch (only for topics)
    if (mind.editable && (e.button === 0 || e.pointerType === 'touch')) {
      // For touch, only start drag with single finger
      if (e.pointerType === 'touch' && activePointers.size > 1) {
        // Cancel any ongoing drag if second finger touches
        if (nodeDragState.isDragging || nodeDragState.pointerId !== null) {
          handleNodeDragCancel(mind, nodeDragState)
        }
      } else if (e.pointerType === 'touch' && activePointers.size === 1) {
        // For touch: start long press timer instead of immediate drag
        if (isTopic(target) || target.closest('me-tpc')) {
          longPressHelper.start(e, e => {
            // Long press triggered, start drag with immediate ghost display
            if (handleNodeDragStart(mind, nodeDragState, e, true)) {
              if (longPressHelper.target) {
                longPressHelper.target.setPointerCapture(e.pointerId)
              }
              updateGhostPosition(nodeDragState.ghost, e.clientX, e.clientY)
            }
          })
        }
      } else if (e.pointerType === 'mouse' && handleNodeDragStart(mind, nodeDragState, e, false)) {
        // For mouse: start drag immediately
        target.setPointerCapture(e.pointerId)
        return
      }
    }

    // Support space + left mouse button drag
    const isSpaceDrag = mind.spacePressed && e.button === 0 && e.pointerType === 'mouse'
    // both button can be used to drag in readonly mode
    const isNormalDrag = !mind.editable || (e.button === mouseMoveButton && e.pointerType === 'mouse') || e.pointerType === 'touch'

    if (!isSpaceDrag && !isNormalDrag) return

    // Store initial position for movement calculation
    panHelper.x = e.clientX
    panHelper.y = e.clientY

    if (target.className !== 'circle' && target.contentEditable !== 'plaintext-only') {
      panHelper.mousedown = true
      // Capture pointer to ensure we receive all pointer events even if pointer moves outside the element
      target.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch' && activePointers.has(e.pointerId)) {
      // Update current touch point position
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })

      // Check if long press should be cancelled due to movement
      longPressHelper.handleMove(e)

      // Only handle pinch zoom when there are 2+ fingers
      if (activePointers.size >= 2) {
        const [p1, p2] = Array.from(activePointers.values())
        const newDistance = getDistance(p1, p2)

        if (lastDistance == null) {
          lastDistance = newDistance
        } else {
          if (lastDistance > 0) {
            const scaleRatio = newDistance / lastDistance
            mind.scale(mind.scaleVal * scaleRatio, {
              x: (p1.x + p2.x) / 2,
              y: (p1.y + p2.y) / 2,
            })
          }
          lastDistance = newDistance
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
    if ((e.target as HTMLElement).contentEditable !== 'plaintext-only' || (mind.spacePressed && panHelper.mousedown)) {
      // drag and move the map
      // Calculate movement delta manually since pointer events don't have movementX/Y
      const movementX = e.clientX - panHelper.x
      const movementY = e.clientY - panHelper.y

      panHelper.onMove(movementX, movementY)
    }

    panHelper.x = e.clientX
    panHelper.y = e.clientY
  }

  const handlePointerUp = (e: PointerEvent) => {
    if (e.pointerType === 'touch') {
      activePointers.delete(e.pointerId)
      // End this zoom gesture when fewer than 2 fingers remain
      if (activePointers.size < 2) {
        lastDistance = null
      }

      // Cancel long press timer if still active
      longPressHelper.clear()
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

    // Handle click / double-click for touch via pointer events
    // For touch: skip if multi-finger gesture or map was dragged
    const isTouchTap = e.pointerType === 'touch' && activePointers.size === 0 && !panHelper.moved
    if (isTouchTap) {
      const currentTime = new Date().getTime()
      const tapLength = currentTime - lastTap
      if (tapLength < 300 && tapLength > 0 && lastTapTarget === e.target) {
        handleDoubleClick(e)
      }
      lastTap = currentTime
      lastTapTarget = e.target
    }

    if (!panHelper.mousedown) return
    releasePointerCaptureIfExists(e.target as HTMLElement, e.pointerId)
    panHelper.clear()
  }

  // Handle cases where pointerup might not be triggered (e.g., alert dialogs)
  const handleBlur = () => {
    // Clear long press timer
    longPressHelper.clear()

    // Clear drag state when window loses focus (e.g., alert dialog appears)
    if (panHelper.mousedown) {
      panHelper.clear()
    }
    // Also cancel any ongoing node drag
    if (nodeDragState.isDragging || nodeDragState.pointerId !== null) {
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
      longPressHelper.clear()
    }

    // Cancel node drag
    if (nodeDragState.pointerId === e.pointerId) {
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
      if (mind.panHelper.moved) return
      mind.bus.fire('showContextMenu', e)
    }, 200)
  }

  const handleWheel = (e: WheelEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) return handleWheelZoom(mind, e)
    if (e.shiftKey) return mind.move(-e.deltaY, 0)
    mind.move(-e.deltaX, -e.deltaY)
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

  const off = on([
    { dom: container, evt: 'pointerdown', func: handlePointerDown },
    { dom: container, evt: 'pointermove', func: handlePointerMove },
    { dom: container, evt: 'pointerup', func: handlePointerUp },
    { dom: container, evt: 'pointercancel', func: handlePointerCancel },
    { dom: container, evt: 'click', func: handleSingleClick },
    { dom: container, evt: 'dblclick', func: handleDoubleClick },
    { dom: container, evt: 'contextmenu', func: handleContextMenu },
    { dom: container, evt: 'wheel', func: typeof mind.handleWheel === 'function' ? mind.handleWheel : handleWheel },
    { dom: container, evt: 'blur', func: handleBlur },
    { dom: container, evt: 'keydown', func: handleKeyDown },
    { dom: container, evt: 'keyup', func: handleKeyUp },
  ])
  return off
}
