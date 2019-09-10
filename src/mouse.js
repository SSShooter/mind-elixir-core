import { dragMoveHelper } from './util'
export default function(mind) {
  mind.map.addEventListener('click', e => {
    // if (dragMoveHelper.afterMoving) return
    e.preventDefault()
    if (e.target.nodeName === 'EPD') {
      let target = e.target
      let node = target.previousSibling.nodeObj
      if (node.expanded !== false) {
        node.expanded = false
      } else {
        node.expanded = true
      }
      mind.layout()
      mind.linkDiv()
    } else if (
      e.target.parentElement.nodeName === 'T' ||
      e.target.parentElement.nodeName === 'ROOT'
    ) {
      mind.selectNode(e.target)
    } else if (e.target.nodeName === 'path') {
      if (e.target.parentElement.nodeName === 'g') {
        mind.selectLink(e.target.parentElement)
      }
    } else if (e.target.className === 'circle') {
      // skip circle
    } else {
      mind.unselectNode()
      mind.hideLinkController()
    }
  })

  mind.map.addEventListener('dblclick', e => {
    e.preventDefault()
    if (!mind.editable) return
    if (
      e.target.parentElement.nodeName === 'T' ||
      e.target.parentElement.nodeName === 'ROOT'
    ) {
      mind.createInputDiv(e.target)
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
