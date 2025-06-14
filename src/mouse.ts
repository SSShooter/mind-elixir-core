import { handleZoom } from './plugin/keypress'
import type { SummarySvgGroup } from './summary'
import type { Expander, CustomSvg, Topic } from './types/dom'
import type { MindElixirInstance } from './types/index'
import { isTopic, on } from './utils'

// Helper function to safely check if event is TouchEvent
const isTouchEvent = (e: Event): e is TouchEvent => {
  return typeof TouchEvent !== 'undefined' && e instanceof TouchEvent
}

export default function (mind: MindElixirInstance) {
  const { dragMoveHelper } = mind
  // Track previous touch position for calculating movement delta
  let previousTouchX = 0
  let previousTouchY = 0

  const handleClick = (e: MouseEvent) => {
    // Only handle mouse clicks, not touch events for click
    if (isTouchEvent(e)) return
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
    const trySvg = target.parentElement?.parentElement as unknown as SVGElement
    if (trySvg.getAttribute('class') === 'topiclinks') {
      mind.selectArrow(target.parentElement as unknown as CustomSvg)
    } else if (trySvg.getAttribute('class') === 'summary') {
      mind.selectSummary(target.parentElement as unknown as SummarySvgGroup)
    }
  }
  const handleDblClick = (e: MouseEvent | TouchEvent) => {
    // Only handle mouse double clicks, not touch events
    // if (e instanceof TouchEvent) return
    if (!mind.editable) return
    const target = e.target as HTMLElement
    if (isTopic(target)) {
      mind.beginEdit(target)
    }
    const trySvg = target.parentElement?.parentElement as unknown as SVGElement
    if (trySvg.getAttribute('class') === 'topiclinks') {
      mind.editArrowLabel(target.parentElement as unknown as CustomSvg)
    } else if (trySvg.getAttribute('class') === 'summary') {
      mind.editSummary(target.parentElement as unknown as SummarySvgGroup)
    }
  }
  let lastTap = 0
  const handleTouchDblClick = (e: MouseEvent | TouchEvent) => {
    const currentTime = new Date().getTime()
    const tapLength = currentTime - lastTap
    console.log('tapLength', tapLength)
    if (tapLength < 300 && tapLength > 0) {
      handleDblClick(e)
    }

    lastTap = currentTime
  }
  // Unified handlers that can handle both mouse and touch events
  const handlePointerDown = (e: MouseEvent | TouchEvent) => {
    console.log('handlePointerDown', e)
    if (e instanceof MouseEvent) {
      const mouseMoveButton = mind.mouseSelectionButton === 0 ? 2 : 0
      if (e.button !== mouseMoveButton) return
    } else {
      // For touch events, store initial position for movement calculation
      previousTouchX = e.touches[0]?.clientX || 0
      previousTouchY = e.touches[0]?.clientY || 0
    }

    if ((e.target as HTMLElement).contentEditable === 'inherit') {
      dragMoveHelper.moved = false
      dragMoveHelper.mousedown = true
      mind.map.style.transition = 'none'
    }
  }

  const handlePointerMove = (e: MouseEvent | TouchEvent) => {
    // click trigger mousemove in windows chrome
    if ((e.target as HTMLElement).contentEditable === 'inherit') {
      // drag and move the map
      if (e instanceof MouseEvent) {
        dragMoveHelper.onMove(e)
        dragMoveHelper.x = e.clientX
        dragMoveHelper.y = e.clientY
      } else {
        // TouchEvent - calculate movement delta and create a simulated mouse event
        const currentTouchX = e.touches[0]?.clientX || 0
        const currentTouchY = e.touches[0]?.clientY || 0

        const movementX = currentTouchX - previousTouchX
        const movementY = currentTouchY - previousTouchY

        const simulatedMouseEvent = {
          clientX: currentTouchX,
          clientY: currentTouchY,
          movementX: movementX,
          movementY: movementY,
          target: e.target,
        } as MouseEvent

        dragMoveHelper.onMove(simulatedMouseEvent)
        dragMoveHelper.x = currentTouchX
        dragMoveHelper.y = currentTouchY

        // Update previous position for next movement calculation
        previousTouchX = currentTouchX
        previousTouchY = currentTouchY
      }
    } else if (e instanceof MouseEvent) {
      dragMoveHelper.x = e.clientX
      dragMoveHelper.y = e.clientY
    } else {
      // Update touch position even when not dragging
      const currentTouchX = e.touches[0]?.clientX || 0
      const currentTouchY = e.touches[0]?.clientY || 0
      dragMoveHelper.x = currentTouchX
      dragMoveHelper.y = currentTouchY
      previousTouchX = currentTouchX
      previousTouchY = currentTouchY
    }
  }

  const handlePointerUp = (e: MouseEvent | TouchEvent) => {
    if (e instanceof MouseEvent) {
      const mouseMoveButton = mind.mouseSelectionButton === 0 ? 2 : 0
      if (e.button !== mouseMoveButton) return
    }
    dragMoveHelper.clear()
  }

  const handleContextMenu = (e: MouseEvent | TouchEvent) => {
    console.log('handleContextMenu', e)
    e.preventDefault()
    // Only handle mouse context menu events, not touch events
    if (isTouchEvent(e)) return
    if (!mind.editable) return
    setTimeout(() => {
      // delay to avoid conflict with click event on Mac
      if (mind.dragMoveHelper.moved) return
      mind.bus.fire('showContextMenu', e)
    }, 100)
  }

  const handleWheel = (e: WheelEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) {
      if (e.deltaY < 0) handleZoom(mind, 'in', mind.dragMoveHelper)
      else if (mind.scaleVal - 0.2 > 0) handleZoom(mind, 'out', mind.dragMoveHelper)
    } else if (e.shiftKey) {
      mind.move(-e.deltaY, 0)
    } else {
      mind.map.style.transition = 'none'
      mind.move(-e.deltaX, -e.deltaY)
      mind.map.style.transition = 'transform 0.3s'
    }
  }

  const { map, container } = mind
  const off = on([
    { dom: map, evt: 'click', func: handleClick },
    { dom: map, evt: 'dblclick', func: handleDblClick },
    { dom: map, evt: 'mousedown', func: handlePointerDown },
    // to handle mouse move outside of map, add event listener to document
    { dom: document, evt: 'mousemove', func: handlePointerMove },
    { dom: document, evt: 'mouseup', func: handlePointerUp },
    { dom: container, evt: 'contextmenu', func: handleContextMenu },
    // support touch events
    { dom: map, evt: 'touchstart', func: handlePointerDown },
    { dom: document, evt: 'touchmove', func: handlePointerMove },
    { dom: document, evt: 'touchend', func: handlePointerUp },
    { dom: map, evt: 'touchend', func: handleTouchDblClick },
    // support wheel event
    { dom: map, evt: 'wheel', func: handleWheel },
  ])
  return off
}
