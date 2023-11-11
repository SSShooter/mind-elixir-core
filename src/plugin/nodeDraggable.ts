import { throttle } from '../utils/index'
import dragMoveHelper from '../utils/dragMoveHelper'
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

const canPreview = function (el: Element, dragged: Topic[]) {
  for (const node of dragged) {
    const isContain = node.parentElement.parentElement.contains(el)
    const ok = el && el.tagName === 'ME-TPC' && el !== node && !isContain && (el as Topic).nodeObj.root !== true
    if (!ok) return false
  }
  return true
}

const createGhost = function (mei: MindElixirInstance) {
  const ghost = document.createElement('div')
  ghost.className = 'mind-elixir-ghost'
  mei.map.appendChild(ghost)
  return ghost
}

export default function (mind: MindElixirInstance) {
  let dragged: Topic[] | null = null
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
    if (!mind.currentNodes?.includes(target)) {
      mind.unselectNodes()
      mind.selectNode(target)
    }
    if (mind.currentNodes) {
      dragged = mind.currentNodes
      ghost.innerHTML = mind.currentNodes.length + ' nodes'
    } else {
      dragged = [target]
      ghost.innerHTML = target.innerHTML
    }
    for (const node of dragged) {
      node.parentElement.parentElement.style.opacity = '0.5'
    }
    e.dataTransfer?.setDragImage(ghost, 0, 0)
    dragMoveHelper.clear()
  })

  mind.map.addEventListener('dragend', async e => {
    if (!dragged) return
    for (const node of dragged) {
      node.parentElement.parentElement.style.opacity = '1'
    }
    const target = e.target as Topic
    target.style.opacity = ''
    if (!meet) return
    clearPreview(meet)
    // const obj = dragged.nodeObj
    if (insertTpye === 'before') {
      mind.moveNodeBefore(dragged, meet)
    } else if (insertTpye === 'after') {
      mind.moveNodeAfter(dragged, meet)
    } else if (insertTpye === 'in') {
      mind.moveNodeIn(dragged, meet)
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
