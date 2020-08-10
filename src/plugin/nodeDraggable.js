import {dragMoveHelper} from '../utils/index'
export default function (mind) {
  var dragged

  /* events fired on the draggable target */
  mind.map.addEventListener('drag', function (event) { })

  mind.map.addEventListener('dragstart', function (event) {
    // store a ref. on the dragged elem
    dragged = event.target
    dragMoveHelper.clear()
  })

  mind.map.addEventListener('dragend', function (event) {
    // reset the transparency
    event.target.style.opacity = ''
  })

  /* events fired on the drop targets */
  mind.map.addEventListener('dragover', function (event) {
    // prevent default to allow drop
    event.preventDefault()
  })

  mind.map.addEventListener('dragenter', function (event) {
    if (event.target.tagName == 'TPC' && event.target !== dragged) {
      event.target.style.opacity = 0.5
    }
  })

  mind.map.addEventListener('dragleave', function (event) {
    if (event.target.tagName == 'TPC' && event.target !== dragged) {
      event.target.style.opacity = 1
    }
  })

  mind.map.addEventListener('drop', event => {
    event.preventDefault()
    if (event.target.tagName == 'TPC' && event.target !== dragged) {
      event.target.style.opacity = 1
      mind.moveNode(dragged, event.target)
      dragged = null
    }
  })
}