import type { MindElixirData } from '../index'
import { type MindElixirInstance } from '../index'
import { findEle } from '../utils/dom'
import type { Operation } from '../utils/pubsub'

type History = {
  prev: MindElixirData
  currentNodeId: string | undefined
  next: MindElixirData
}

export default function (mei: MindElixirInstance) {
  let history = [] as History[]
  let currentIndex = -1
  let current = mei.getData()
  mei.bus.addListener('operation', (operation: Operation) => {
    if (operation.name === 'beginEdit') return
    history = history.slice(0, currentIndex + 1)
    const next = mei.getData()
    let currentNodeId = undefined
    if ('obj' in operation) currentNodeId = operation.obj.id
    history.push({ prev: current, currentNodeId, next })
    current = next
    currentIndex = history.length - 1
    // console.log('operation', operation.obj.id, history)
  })
  mei.undo = function () {
    if (currentIndex > -1) {
      const h = history[currentIndex]
      current = h.prev
      mei.refresh(h.prev)
      if (h.currentNodeId) mei.selectNode(findEle(h.currentNodeId))
      currentIndex--
      console.log('current', current)
    }
  }
  mei.redo = function () {
    if (currentIndex < history.length - 1) {
      currentIndex++
      const h = history[currentIndex]
      current = h.next
      mei.refresh(h.next)
      if (h.currentNodeId) mei.selectNode(findEle(h.currentNodeId))
    }
  }
  mei.map.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'Z') mei.redo()
    else if ((e.metaKey || e.ctrlKey) && e.key === 'z') mei.undo()
  })
}
