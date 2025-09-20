import type { MindElixirData, NodeObj, OperationType } from '../index'
import { type MindElixirInstance } from '../index'
import type { Operation } from '../utils/pubsub'

type History = {
  prev: MindElixirData
  next: MindElixirData
  currentSelected: string[]
  operation: OperationType
  currentTarget:
    | {
        type: 'summary' | 'arrow'
        value: string
      }
    | {
        type: 'nodes'
        value: string[]
      }
}

const calcCurentObject = function (operation: Operation): History['currentTarget'] {
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
      type: 'nodes',
      value: [(operation as any).obj.id],
    }
  }
}

export default function (mei: MindElixirInstance) {
  let history = [] as History[]
  let currentIndex = -1
  let current = mei.getData()
  let currentSelectedNodes: NodeObj[] = []
  mei.undo = function () {
    // 操作是删除时，undo 恢复内容，应选中操作的目标
    // 操作是新增时，undo 删除内容，应选中当前选中节点
    if (currentIndex > -1) {
      const h = history[currentIndex]
      current = h.prev
      mei.refresh(h.prev)
      try {
        if (h.currentTarget.type === 'nodes') {
          if (h.operation === 'removeNodes') {
            mei.selectNodes(h.currentTarget.value.map(id => this.findEle(id)))
          } else {
            mei.selectNodes(h.currentSelected.map(id => this.findEle(id)))
          }
        }
      } catch (e) {
        // undo add node cause node not found
      } finally {
        currentIndex--
      }
    }
  }
  mei.redo = function () {
    if (currentIndex < history.length - 1) {
      currentIndex++
      const h = history[currentIndex]
      current = h.next
      mei.refresh(h.next)
      try {
        if (h.currentTarget.type === 'nodes') {
          if (h.operation === 'removeNodes') {
            mei.selectNodes(h.currentSelected.map(id => this.findEle(id)))
          } else {
            mei.selectNodes(h.currentTarget.value.map(id => this.findEle(id)))
          }
        }
      } catch (e) {
        // redo delete node cause node not found
      }
    }
  }
  const handleOperation = function (operation: Operation) {
    if (operation.name === 'beginEdit') return
    history = history.slice(0, currentIndex + 1)
    const next = mei.getData()
    const item = {
      prev: current,
      operation: operation.name,
      currentSelected: currentSelectedNodes.map(n => n.id),
      currentTarget: calcCurentObject(operation),
      next,
    }
    history.push(item)
    current = next
    currentIndex = history.length - 1
    console.log('operation', item.currentSelected, item.currentTarget.value)
  }
  const handleKeyDown = function (e: KeyboardEvent) {
    // console.log(`mei.map.addEventListener('keydown', handleKeyDown)`, e.key, history.length, currentIndex)
    if ((e.metaKey || e.ctrlKey) && ((e.shiftKey && e.key === 'Z') || e.key === 'y')) mei.redo()
    else if ((e.metaKey || e.ctrlKey) && e.key === 'z') mei.undo()
  }
  const handleSelectNodes = function () {
    currentSelectedNodes = mei.currentNodes.map(n => n.nodeObj)
  }
  mei.bus.addListener('operation', handleOperation)
  mei.bus.addListener('selectNodes', handleSelectNodes)
  mei.container.addEventListener('keydown', handleKeyDown)
  return () => {
    mei.bus.removeListener('operation', handleOperation)
    mei.bus.removeListener('selectNodes', handleSelectNodes)
    mei.container.removeEventListener('keydown', handleKeyDown)
  }
}
