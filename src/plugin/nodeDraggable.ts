import { dragMoveHelper, throttle } from '../utils/index'
import { findEle as E, Topic, Group } from '../utils/dom'
// https://html.spec.whatwg.org/multipage/dnd.html#drag-and-drop-processing-model

const $d = document
const insertPreview = function (el, insertLocation) {
  if (!insertLocation) {
    clearPreview(el)
    return el
  }
  const query = el.getElementsByClassName('insert-preview')
  const className = `insert-preview ${insertLocation} show`
  if (query.length > 0) {
    query[0].className = className
  } else {
    const insertPreviewEL = $d.createElement('div')
    insertPreviewEL.className = className
    el.appendChild(insertPreviewEL)
  }
  return el
}

const clearPreview = function (el) {
  if (!el) return
  const query = el.getElementsByClassName('insert-preview')
  for (const queryElement of query || []) {
    queryElement.remove()
  }
}

const canPreview = function (el: Element, dragged: Topic) {
  const isContain = dragged.parentNode.parentNode.contains(el)
  return el && el.tagName === 'TPC' && el !== dragged && !isContain && (el as Topic).nodeObj.root !== true
}

export default function (mind) {
  let dragged: Topic
  let insertLocation: string
  let meet: Element
  const threshold = 12

  mind.map.addEventListener('dragstart', function (e) {
    dragged = e.target
    ;(dragged.parentNode.parentNode as Group).style.opacity = '0.5'
    dragMoveHelper.clear()
  })

  mind.map.addEventListener('dragend', async function (e: DragEvent) {
    ;(e.target as HTMLElement).style.opacity = ''
    clearPreview(meet)
    const obj = dragged.nodeObj
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
    ;(dragged.parentNode.parentNode as Group).style.opacity = '1'
    dragged = null
  })

  mind.map.addEventListener(
    'dragover',
    throttle(function (e: DragEvent) {
      // console.log('drag', e)
      clearPreview(meet)
      // minus threshold infer that postion of the cursor is above topic
      const topMeet = $d.elementFromPoint(e.clientX, e.clientY - threshold)
      if (canPreview(topMeet, dragged)) {
        meet = topMeet
        const y = topMeet.getBoundingClientRect().y
        if (e.clientY > y + topMeet.clientHeight) {
          insertLocation = 'after'
        } else if (e.clientY > y + topMeet.clientHeight / 2) {
          insertLocation = 'in'
        }
      } else {
        const bottomMeet = $d.elementFromPoint(e.clientX, e.clientY + threshold)
        if (canPreview(bottomMeet, dragged)) {
          meet = bottomMeet
          const y = bottomMeet.getBoundingClientRect().y
          if (e.clientY < y) {
            insertLocation = 'before'
          } else if (e.clientY < y + bottomMeet.clientHeight / 2) {
            insertLocation = 'in'
          }
        } else {
          insertLocation = meet = null
        }
      }
      if (meet) insertPreview(meet, insertLocation)
    }, 200)
  )
}
