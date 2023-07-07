import dragMoveHelper from './utils/dragMoveHelper'

const isTopic = (target: HTMLElement) => {
  return (target as Topic).parentElement.tagName === 'ME-PARENT' || (target as Topic).parentElement.tagName === 'ME-ROOT'
}

export default function (mind: MindElixirInstance) {
  mind.map.addEventListener('click', e => {
    // if (dragMoveHelper.afterMoving) return
    // e.preventDefault() // can cause <a /> tags don't work
    const target = e.target as any
    if (target.tagName === 'ME-EPD') {
      mind.expandNode((target as Expander).previousSibling)
    } else if (!mind.editable) {
      return
    } else if (isTopic(target)) {
      mind.selectNode(target as Topic, false, e)
    } else if (target.tagName === 'path') {
      if (target?.parentElement?.tagName === 'g') {
        mind.selectLink(target.parentElement as CustomSvg)
      }
    } else if (target.className === 'circle') {
      // skip circle
    } else {
      mind.unselectNode()
      // lite version doesn't have hideLinkController
      mind.hideLinkController && mind.hideLinkController()
    }
  })

  mind.map.addEventListener('dblclick', e => {
    e.preventDefault()
    if (!mind.editable) return
    const target = e.target as HTMLElement
    if (isTopic(target)) {
      mind.beginEdit(target as Topic)
    }
  })

  /**
   * drag and move
   */
  mind.map.addEventListener('mousemove', e => {
    // click trigger mousemove in windows chrome
    // the 'true' is a string
    if ((e.target as HTMLElement).contentEditable !== 'true') {
      dragMoveHelper.onMove(e, mind.container)
    }
  })
  mind.map.addEventListener('mousedown', e => {
    if ((e.target as HTMLElement).contentEditable !== 'true') {
      dragMoveHelper.afterMoving = false
      dragMoveHelper.mousedown = true
    }
  })
  mind.map.addEventListener('mouseleave', () => {
    dragMoveHelper.clear()
  })
  mind.map.addEventListener('mouseup', () => {
    dragMoveHelper.clear()
  })
}
