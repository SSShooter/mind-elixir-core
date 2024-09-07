import type { MindElixirData, NodeObj } from '../index'
import { type MindElixirInstance } from '../index'
import { findEle } from '../utils/dom'
import type { Operation } from '../utils/pubsub'

type History = {
  prev: MindElixirData
  next: MindElixirData
  currentObject:
    | {
        type: 'node' | 'summary' | 'arrow'
        value: string
      }
    | {
        type: 'nodes'
        value: string[]
      }
}

const calcCurentObject = function (operation: Operation): History['currentObject'] {
  if (['createSummary', 'removeSummary', 'finishEditSummary'].includes(operation.name)) {
    return {
      type: 'summary',
      value: (operation as any).obj.id,
    }
  } else if (['createArrow', 'removeArrow', 'finishEditArrowLabel'].includes(operation.name)) {
    return {
      type: 'arrow',
      value: (operation as any).obj.id,
    }
  } else if (['removeNodes', 'copyNodes', 'moveNodeBefore', 'moveNodeAfter', 'moveNodeIn'].includes(operation.name)) {
    return {
      type: 'nodes',
      value: (operation as any).objs.map((obj: NodeObj) => obj.id),
    }
  } else {
    return {
      type: 'node',
      value: (operation as any).obj.id,
    }
  }
}

export default function (mei: MindElixirInstance) {
  let history = [] as History[]
  let currentIndex = -1
  let current = mei.getData()
  mei.bus.addListener('operation', (operation: Operation) => {
    if (operation.name === 'beginEdit') return
    history = history.slice(0, currentIndex + 1)
    const next = mei.getData()
    history.push({ prev: current, currentObject: calcCurentObject(operation), next })
    current = next
    currentIndex = history.length - 1
    // console.log('operation', operation.obj.id, history)
  })
  mei.undo = function () {
    if (currentIndex > -1) {
      const h = history[currentIndex]
      current = h.prev
      mei.refresh(h.prev)
      try {
        if (h.currentObject.type === 'node') mei.selectNode(findEle(h.currentObject.value))
        else if (h.currentObject.type === 'nodes') mei.selectNodes(h.currentObject.value.map(id => findEle(id)))
      } catch (e) {
        // undo add node cause node not found
      } finally {
        currentIndex--
      }
      // console.log('current', current)
    }
  }
  mei.redo = function () {
    if (currentIndex < history.length - 1) {
      currentIndex++
      const h = history[currentIndex]
      current = h.next
      mei.refresh(h.next)
      if (h.currentObject.type === 'node') mei.selectNode(findEle(h.currentObject.value))
      else if (h.currentObject.type === 'nodes') mei.selectNodes(h.currentObject.value.map(id => findEle(id)))
    }
  }
  mei.map.addEventListener('keydown', (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'Z') mei.redo()
    else if ((e.metaKey || e.ctrlKey) && e.key === 'z') mei.undo()
  })
}
