import { dragMoveHelper, throttle } from '../utils/index'
import { findEle as E, Topic, Group } from '../utils/dom'
let $d = document
var meet
export let insertPreview = function (el, insertLocation) {
  if (!insertLocation) {
    clearPreview(el)
    return el
  }
  let query = el.getElementsByClassName('insert-preview')
  let className = `insert-preview ${insertLocation} show`
  if (query.length > 0) {
    query[0].className = className
  } else {
    let insertPreviewEL = $d.createElement('div')
    insertPreviewEL.className = className
    el.appendChild(insertPreviewEL)
  }
  return el
}

export let clearPreview = function (el) {
  if (!el) {
    return el
  }
  let query = el.getElementsByClassName('insert-preview')
  for (const queryElement of query || []) {
    queryElement.remove()
  }
}

export let canPreview = function (el, dragged) {
  let isContain = dragged.parentNode.parentNode.contains(el)
  return (
    el &&
    el.tagName === 'TPC' &&
    el !== dragged &&
    !isContain &&
    el.nodeObj.root !== true
  )
}

export default function (mind) {
  var dragged: Topic
  var insertLocation
  let threshold = 12
  /* events fired on the draggable target */
  mind.map.addEventListener(
    'drag',
    function () { }
  )

  mind.map.addEventListener('dragstart', function (event) {
    // store a ref. on the dragged elem
    console.log(event)
    dragged = event.target
      ; (dragged.parentNode.parentNode as Group).style.opacity = '0.5'
    dragMoveHelper.clear()
  })

  mind.map.addEventListener('dragend', async function (event: DragEvent) {
    // reset transparency
    (event.target as HTMLElement).style.opacity = ''
    clearPreview(meet)
    let obj = dragged.nodeObj
    switch (insertLocation) {
      case 'before':
        mind.moveNodeBefore(dragged, meet)
        mind.selectNode(E(obj.id))
        break
      case 'after':
        mind.moveNodeAfter(dragged, meet)
        mind.selectNode(E(obj.id))
        break
      case 'in':
        mind.moveNode(dragged, meet)
        break
    }
    ; (dragged.parentNode.parentNode as Group).style.opacity = '1'
    dragged = null
  })

  mind.map.addEventListener('dragover', throttle(function (event: DragEvent) {
    console.log('drag', event)
    clearPreview(meet)
    let topMeet = $d.elementFromPoint(
      event.clientX,
      event.clientY - threshold
    )
    if (canPreview(topMeet, dragged)) {
      meet = topMeet
      let y = topMeet.getBoundingClientRect().y
      if (event.clientY > y + topMeet.clientHeight) {
        insertLocation = 'after'
      } else if (event.clientY > y + topMeet.clientHeight / 2) {
        insertLocation = 'in'
      }
    } else {
      let bottomMeet = $d.elementFromPoint(
        event.clientX,
        event.clientY + threshold
      )
      if (canPreview(bottomMeet, dragged)) {
        meet = bottomMeet
        let y = bottomMeet.getBoundingClientRect().y
        if (event.clientY < y) {
          insertLocation = 'before'
        } else if (event.clientY < y + bottomMeet.clientHeight / 2) {
          insertLocation = 'in'
        }
      } else {
        insertLocation = meet = null
      }
    }
    if (meet) insertPreview(meet, insertLocation)
  }, 100))

  mind.map.addEventListener('dragenter', function (event) {
  })

  mind.map.addEventListener('dragleave', function (event) {
  })

  mind.map.addEventListener('drop', event => {
    event.preventDefault()
    if (event.target.tagName == 'TPC' && event.target !== dragged) {
      event.target.style.opacity = 1
      clearPreview(meet)
    }
  })
}
