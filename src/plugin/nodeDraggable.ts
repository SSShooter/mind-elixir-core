import { throttle } from '../utils/index'
import dragMoveHelper from '../utils/dragMoveHelper'
import { findEle as E } from '../utils/dom'
import type { Topic } from '../types/dom'
import type { MindElixirInstance } from '../types/index'
// https://html.spec.whatwg.org/multipage/dnd.html#drag-and-drop-processing-model
type InsertType = 'before' | 'after' | 'in' | null
const $d = document
const insertPreview = function (el: Element, insertTpye: InsertType) {
  if (!insertTpye) {
    clearPreview(el)
    return el
  }
  const query = el.getElementsByClassName('insert-preview')
  const className = `insert-preview ${insertTpye} show`
  if (query.length > 0) {
    query[0].className = className
  } else {
    const insertPreviewEL = $d.createElement('div')
    insertPreviewEL.className = className
    el.appendChild(insertPreviewEL)
  }
  return el
}

const clearPreview = function (el: Element | null) {
  if (!el) return
  const query = el.getElementsByClassName('insert-preview')
  for (const queryElement of query || []) {
    queryElement.remove()
  }
}

const canPreview = function (el: Element, dragged: Topic) {
  const isContain = dragged.parentElement.parentElement.contains(el)
  return el && el.tagName === 'ME-TPC' && el !== dragged && !isContain && (el as Topic).nodeObj.root !== true
}

const createGhost = function (mei: MindElixirInstance) {
  const ghost = document.createElement('div')
  ghost.className = 'mind-elixir-ghost'
  mei.map.appendChild(ghost)
  return ghost
}

export default function (mind: MindElixirInstance) {
  let dragged: Topic | null = null
  let insertTpye: InsertType = null
  let meet: Topic | null = null
  const ghost = createGhost(mind)
  const threshold = 12

  mind.map.addEventListener('dragstart', e => {
    const target = e.target as Topic
    if (target?.tagName !== 'ME-TPC') {
      // it should be a topic element, return if not
      e.preventDefault()
      return
    }
    dragged = target
    dragged.parentElement.parentElement.style.opacity = '0.5'
    ghost.innerHTML = dragged.innerHTML
    e.dataTransfer?.setDragImage(ghost, 0, 0)
    dragMoveHelper.clear()
  })

  mind.map.addEventListener('dragend', async e => {
    if (!dragged) return
    dragged.parentElement.parentElement.style.opacity = '1'
    const target = e.target as Topic
    target.style.opacity = ''
    if (!meet) return
    clearPreview(meet)
    const obj = dragged.nodeObj
    switch (insertTpye) {
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
    dragged = null
  })

  mind.map.addEventListener(
    'dragover',
    throttle(function (e: DragEvent) {
      if (!dragged) return
      clearPreview(meet)
      // minus threshold infer that postion of the cursor is above topic
      const topMeet = $d.elementFromPoint(e.clientX, e.clientY - threshold) as Topic
      if (canPreview(topMeet, dragged)) {
        meet = topMeet
        const y = topMeet.getBoundingClientRect().y
        if (e.clientY > y + topMeet.clientHeight) {
          insertTpye = 'after'
        } else if (e.clientY > y + topMeet.clientHeight / 2) {
          insertTpye = 'in'
        }
      } else {
        const bottomMeet = $d.elementFromPoint(e.clientX, e.clientY + threshold) as Topic
        if (canPreview(bottomMeet, dragged)) {
          meet = bottomMeet
          const y = bottomMeet.getBoundingClientRect().y
          if (e.clientY < y) {
            insertTpye = 'before'
          } else if (e.clientY < y + bottomMeet.clientHeight / 2) {
            insertTpye = 'in'
          }
        } else {
          insertTpye = meet = null
        }
      }
      if (meet) insertPreview(meet, insertTpye)
    }, 200)
  )
}
