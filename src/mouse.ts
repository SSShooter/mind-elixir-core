import type { SummarySvgGroup } from './summary'
import type { Expander, CustomSvg } from './types/dom'
import type { MindElixirInstance } from './types/index'
import { isTopic } from './utils'
import dragMoveHelper from './utils/dragMoveHelper'

export default function (mind: MindElixirInstance) {
  mind.map.addEventListener('click', e => {
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
    mind.clearSelection()
    // e.preventDefault() // can cause <a /> tags don't work
    const target = e.target as HTMLElement
    if (target.tagName === 'ME-EPD') {
      mind.expandNode((target as Expander).previousSibling)
    } else if (isTopic(target)) {
      mind.selectNode(target, false, e)
    } else if (!mind.editable) {
      return
    } else if (target.tagName === 'text') {
      if (target.dataset.type === 'custom-link') {
        mind.selectArrow(target.parentElement as unknown as CustomSvg)
      } else {
        mind.selectSummary(target.parentElement as unknown as SummarySvgGroup)
      }
    } else if (target.className === 'circle') {
      // skip circle
    }
  })

  mind.map.addEventListener('dblclick', e => {
    if (!mind.editable) return
    const target = e.target as HTMLElement
    if (isTopic(target)) {
      mind.beginEdit(target)
    } else if (target.tagName === 'text') {
      if (target.dataset.type === 'custom-link') {
        mind.editArrowLabel(target.parentElement as unknown as CustomSvg)
      } else {
        mind.editSummary(target.parentElement as unknown as SummarySvgGroup)
      }
    }
  })

  /**
   * drag and move the map
   */
  mind.map.addEventListener('mousemove', e => {
    // click trigger mousemove in windows chrome
    if ((e.target as HTMLElement).contentEditable !== 'true') {
      dragMoveHelper.onMove(e, mind.container)
    }
  })
  mind.map.addEventListener('mousedown', e => {
    const mouseMoveButton = mind.mouseSelectionButton === 0 ? 2 : 0
    if (e.button !== mouseMoveButton) return
    if ((e.target as HTMLElement).contentEditable !== 'true') {
      dragMoveHelper.moved = false
      dragMoveHelper.mousedown = true
    }
  })
  mind.map.addEventListener('mouseleave', e => {
    const mouseMoveButton = mind.mouseSelectionButton === 0 ? 2 : 0
    if (e.button !== mouseMoveButton) return
    dragMoveHelper.clear()
  })
  mind.map.addEventListener('mouseup', e => {
    const mouseMoveButton = mind.mouseSelectionButton === 0 ? 2 : 0
    if (e.button !== mouseMoveButton) return
    dragMoveHelper.clear()
  })
}
