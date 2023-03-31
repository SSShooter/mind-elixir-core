import dragMoveHelper from './utils/dragMoveHelper'

export default function (mind) {
  mind.map.addEventListener('click', e => {
    // if (dragMoveHelper.afterMoving) return
    // e.preventDefault() // can cause a tag don't work
    if (e.target.nodeName === 'ME-EPD') {
      mind.expandNode(e.target.previousSibling)
    } else if (!mind.editable) {
      return
    } else if (e.target.parentElement.nodeName === 'ME-PARENT' || e.target.parentElement.nodeName === 'ME-ROOT') {
      mind.selectNode(e.target, false, e)
    } else if (e.target.nodeName === 'path') {
      if (e.target.parentElement.nodeName === 'g') {
        mind.selectLink(e.target.parentElement)
      }
    } else if (e.target.className === 'circle') {
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
    if (e.target.parentElement.nodeName === 'ME-PARENT' || e.target.parentElement.nodeName === 'ME-ROOT') {
      mind.beginEdit(e.target)
    }
  })

  /**
   * drag and move
   */
  mind.map.addEventListener('mousemove', e => {
    // click trigger mousemove in windows chrome
    // the 'true' is a string
    if (e.target.contentEditable !== 'true') {
      dragMoveHelper.onMove(e, mind.container)
    }
  })
  mind.map.addEventListener('mousedown', e => {
    if (e.target.contentEditable !== 'true') {
      dragMoveHelper.afterMoving = false
      dragMoveHelper.mousedown = true
    }
  })
  mind.map.addEventListener('mouseleave', e => {
    dragMoveHelper.clear()
  })
  mind.map.addEventListener('mouseup', e => {
    dragMoveHelper.clear()
  })
}
