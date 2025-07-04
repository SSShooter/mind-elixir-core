import { handleZoom } from './plugin/keypress'
import type { SummarySvgGroup } from './summary'
import type { Expander, CustomSvg, Topic } from './types/dom'
import type { MindElixirInstance } from './types/index'
import { isTopic, on } from './utils'

export default function (mind: MindElixirInstance) {
  const { dragMoveHelper } = mind

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
    const trySvg = target.parentElement?.parentElement as unknown as SVGElement
    if (trySvg.getAttribute('class') === 'topiclinks') {
      mind.selectArrow(target.parentElement as unknown as CustomSvg)
    } else if (trySvg.getAttribute('class') === 'summary') {
      mind.selectSummary(target.parentElement as unknown as SummarySvgGroup)
    }
  }

  const handleDblClick = (e: MouseEvent) => {
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
  const handleTouchDblClick = (e: PointerEvent) => {
    const currentTime = new Date().getTime()
    const tapLength = currentTime - lastTap
    console.log('tapLength', tapLength)
    if (tapLength < 300 && tapLength > 0) {
      handleDblClick(e)
    }

    lastTap = currentTime
  }

  const handlePointerDown = (e: PointerEvent) => {
    console.log('handlePointerDown', e)
    dragMoveHelper.moved = false
    const mouseMoveButton = mind.mouseSelectionButton === 0 ? 2 : 0
    if (e.button !== mouseMoveButton && e.pointerType === 'mouse') return

    // Store initial position for movement calculation
    dragMoveHelper.x = e.clientX
    dragMoveHelper.y = e.clientY

    const target = e.target as HTMLElement
    if (target.className === 'circle') return
    if (target.contentEditable !== 'plaintext-only') {
      dragMoveHelper.mousedown = true
      mind.map.style.transition = 'none'
      // Capture pointer to ensure we receive all pointer events even if pointer moves outside the element
      target.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: PointerEvent) => {
    // click trigger pointermove in windows chrome
    if ((e.target as HTMLElement).contentEditable !== 'plaintext-only') {
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
    const mouseMoveButton = mind.mouseSelectionButton === 0 ? 2 : 0
    if (e.button !== mouseMoveButton && e.pointerType === 'mouse') return
    const target = e.target as HTMLElement
    // Release pointer capture
    if (target.hasPointerCapture && target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId)
    }
    dragMoveHelper.clear()
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
      mind.map.style.transition = 'none'
      mind.move(-e.deltaX, -e.deltaY)
      mind.map.style.transition = 'transform 0.3s'
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
    { dom: container, evt: 'wheel', func: handleWheel },
  ])
  return off
}
