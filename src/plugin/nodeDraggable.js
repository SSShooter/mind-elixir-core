import {dragMoveHelper,throttle} from '../utils/index'
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
  if (!el) {return el}
  let query = el.getElementsByClassName('insert-preview')
  for (const queryElement of query || []) {
    queryElement.remove()
  }
}

export let canPreview = function (el, dragged) {
  let isContain = dragged.parentNode.parentNode.contains(el)
  return el && el.tagName === 'TPC' && el !== dragged && !isContain && el.nodeObj.root !== true
}

export default function (mind) {
  var dragged
  var insertLocation

  /* events fired on the draggable target */
  mind.map.addEventListener('drag',throttle( function (event) {
    clearPreview(meet)
    let topMeet = $d.elementFromPoint(event.clientX, event.clientY - (event.target.clientHeight / 2))
    if (canPreview(topMeet, dragged)) {
      meet = topMeet
      // if else
      switch (true) {
        case event.clientY > topMeet.getBoundingClientRect().y  + (2 * topMeet.clientHeight) / 3:
          insertLocation = 'after'
          break
        case event.clientY > topMeet.getBoundingClientRect().y + topMeet.clientHeight / 3:
          insertLocation = 'in'
          break
      }
    } else {
      let bottomMeet = $d.elementFromPoint(event.clientX, event.clientY + (event.target.clientHeight / 2))
      if (canPreview(bottomMeet, dragged)) {
        meet = bottomMeet
        switch (true) {
          case event.clientY > bottomMeet.getBoundingClientRect().y:
            insertLocation = 'before'
            break
          case event.clientY > bottomMeet.getBoundingClientRect().y + bottomMeet.clientHeight / 3:
            insertLocation = 'in'
            break
        }
      }else{
        insertLocation = meet = null
      }
      }
    if(meet)insertPreview(meet, insertLocation)
  },100))

  mind.map.addEventListener('dragstart', function (event) {
    // store a ref. on the dragged elem
    dragged = event.target
    dragged.parentNode.parentNode.style.opacity = 0.5
    dragMoveHelper.clear()
  })

  mind.map.addEventListener('dragend', function (event) {
    // reset the transparency
    event.target.style.opacity = ''
    clearPreview(meet)
    let obj = dragged.nodeObj
    switch (insertLocation) {
      case 'before':
        mind.insertBefore(meet, obj)
        mind.removeNode(dragged)
        mind.selectNode(E(obj.id))
        break
      case 'after':
        mind.insertSibling(meet, obj)
        mind.removeNode(dragged)
        mind.selectNode(E(obj.id))
        break
      case 'in':
        mind.moveNode(dragged, meet)
        break
    }
    dragged.parentNode.parentNode.style.opacity = 1
    dragged = null
  })

  /* events fired on the drop targets */
  mind.map.addEventListener('dragover', function (event) {
    // prevent default to allow drop
    event.preventDefault()
  })

  mind.map.addEventListener('dragenter', function (event) {
    // if (event.target.tagName == 'TPC' && event.target !== dragged) {
    //   event.target.style.opacity = 0.5
    // }
  })

  mind.map.addEventListener('dragleave', function (event) {
    // if (event.target.tagName == 'TPC' && event.target !== dragged) {
    //   event.target.style.opacity = 1
    // }
  })

  mind.map.addEventListener('drop', event => {
    event.preventDefault()
    if (event.target.tagName == 'TPC' && event.target !== dragged) {
      event.target.style.opacity = 1
      clearPreview(meet)
    }
  })
}