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

  // Pinch zoom state for touch devices
  const pinchHelper = {
    lastDistance: null as number | null,
    activePointers: new Map<number, { x: number; y: number }>(),
    handlePointerDown(e: PointerEvent) {
      if (e.pointerType !== 'touch') return false
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (this.activePointers.size >= 2) {
        const [p1, p2] = Array.from(this.activePointers.values())
        this.lastDistance = getDistance(p1, p2)
        return true
      }
      return false
    },
    handlePointerMove(e: PointerEvent) {
      if (e.pointerType !== 'touch' || !this.activePointers.has(e.pointerId)) return false
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (this.activePointers.size >= 2) {
        const [p1, p2] = Array.from(this.activePointers.values())
        const newDistance = getDistance(p1, p2)
        if (this.lastDistance !== null && this.lastDistance > 0) {
          const scaleRatio = newDistance / this.lastDistance
          mind.scale(mind.scaleVal * scaleRatio, {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2,
          })
        }
        this.lastDistance = newDistance
        return true
      }
      return false
    },
    handlePointerUp(e: PointerEvent) {
      if (e.pointerType !== 'touch') return
      this.activePointers.delete(e.pointerId)
      if (this.activePointers.size < 2) {
        this.lastDistance = null
      }
    },
    clear() {
      this.activePointers.clear()
      this.lastDistance = null
    },
  }

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
    if (target.closest('#input-box')) return false

    const label = target.closest<HTMLElement>('.svg-label')
    const container = target.closest<HTMLElement>('.topiclinks, .summary')

    const interaction = label
      ? { type: label.dataset.type, element: document.getElementById(label.dataset.svgId!) }
      : container
        ? { type: container.classList.contains('topiclinks') ? 'arrow' : 'summary', element: target.closest('g') }
        : null

    if (!interaction?.type || !interaction?.element) return false

    const { type, element } = interaction
    if (type === 'arrow') {
      isDoubleClick ? mind.editArrowLabel(element as ArrowSvg) : mind.selectArrow(element as ArrowSvg)
    } else {
      isDoubleClick ? mind.editSummary(element as SummarySvg) : mind.selectSummary(element as SummarySvg)
    }
    return true
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
    if (pinchHelper.handlePointerDown(e)) {
      longPressHelper.clear()
    }

    panHelper.handlePointerDown(e)

    const target = e.target as HTMLElement

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
      if (e.pointerType === 'touch' && pinchHelper.activePointers.size > 1) {
        // Cancel any ongoing drag if second finger touches
        if (nodeDragState.isDragging || nodeDragState.pointerId !== null) {
          handleNodeDragCancel(mind, nodeDragState)
        }
      } else if (e.pointerType === 'touch' && pinchHelper.activePointers.size === 1) {
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
  }

  const handlePointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') {
      longPressHelper.handleMove(e)
    }
    if (pinchHelper.handlePointerMove(e)) return

    // Handle node dragging
    if (nodeDragState && nodeDragState.pointerId !== null) {
      handleNodeDragMove(mind, nodeDragState, e)
      // If dragging started, don't process map movement
      if (nodeDragState.isDragging) {
        return
      }
    }

    panHelper.handlePointerMove(e)
  }

  const handlePointerUp = (e: PointerEvent) => {
    if (e.pointerType === 'touch') {
      pinchHelper.handlePointerUp(e)

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
    const isTouchTap = e.pointerType === 'touch' && pinchHelper.activePointers.size === 0 && !panHelper.moved
    if (isTouchTap) {
      const currentTime = new Date().getTime()
      const tapLength = currentTime - lastTap
      if (tapLength < 300 && tapLength > 0 && lastTapTarget === e.target) {
        handleDoubleClick(e)
      }
      lastTap = currentTime
      lastTapTarget = e.target
    }

    panHelper.handlePointerUp(e)
  }

  // Handle cases where interaction is interrupted (e.g., alert dialogs, system gestures, loss of focus)
  const handleInterrupt = () => {
    pinchHelper.clear()
    longPressHelper.clear()
    panHelper.clear()
    if (nodeDragState.isDragging || nodeDragState.pointerId !== null) {
      handleNodeDragCancel(mind, nodeDragState)
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
    { dom: container, evt: 'pointercancel', func: handleInterrupt },
    { dom: container, evt: 'click', func: handleSingleClick },
    { dom: container, evt: 'dblclick', func: handleDoubleClick },
    { dom: container, evt: 'contextmenu', func: handleContextMenu },
    { dom: container, evt: 'wheel', func: typeof mind.handleWheel === 'function' ? mind.handleWheel : handleWheel },
    { dom: container, evt: 'blur', func: handleInterrupt },
    { dom: container, evt: 'keydown', func: handleKeyDown },
    { dom: container, evt: 'keyup', func: handleKeyUp },
  ])
  return off
}
