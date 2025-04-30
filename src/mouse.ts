import type { SummarySvgGroup } from './summary'
import type { Expander, CustomSvg } from './types/dom'
import type { MindElixirInstance } from './types/index'
import { isTopic } from './utils'

export default function (mind: MindElixirInstance) {
  const { dragMoveHelper } = mind
  const handleClick = (e: MouseEvent) => {
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
    // e.preventDefault() // can cause <a /> tags don't work
    const target = e.target as HTMLElement
    if (target.tagName === 'ME-EPD') {
      mind.expandNode((target as Expander).previousSibling)
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
  const handleMouseDown = (e: MouseEvent) => {
    const mouseMoveButton = mind.mouseSelectionButton === 0 ? 2 : 0
    if (e.button !== mouseMoveButton) return
    if ((e.target as HTMLElement).contentEditable === 'inherit') {
      dragMoveHelper.moved = false
      dragMoveHelper.mousedown = true
      mind.map.style.transition = 'none'
    }
  }
  const handleMouseMove = (e: MouseEvent) => {
    // click trigger mousemove in windows chrome
    if ((e.target as HTMLElement).contentEditable === 'inherit') {
      // drag and move the map
      dragMoveHelper.onMove(e)
    }
    dragMoveHelper.x = e.clientX
    dragMoveHelper.y = e.clientY
  }
  const handleMouseUp = (e: MouseEvent) => {
    const mouseMoveButton = mind.mouseSelectionButton === 0 ? 2 : 0
    if (e.button !== mouseMoveButton) return
    dragMoveHelper.clear()
  }
  const handleContextMenu = (e: MouseEvent) => {
    if (dragMoveHelper.moved) {
      e.preventDefault()
    }
  }
  mind.map.addEventListener('click', handleClick)
  mind.map.addEventListener('dblclick', handleDblClick)
  mind.map.addEventListener('mousedown', handleMouseDown)
  // to handle mouse move outside of map, add event listener to document
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.addEventListener('contextmenu', handleContextMenu)
  return () => {
    mind.map.removeEventListener('click', handleClick)
    mind.map.removeEventListener('dblclick', handleDblClick)
    mind.map.removeEventListener('mousedown', handleMouseDown)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.removeEventListener('contextmenu', handleContextMenu)
  }
}
