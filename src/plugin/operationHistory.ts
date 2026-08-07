import type MindElixir from '../index'
import type { MindElixirData, NodeObj, OperationType } from '../index'
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

const calcCurrentTarget = function (operation: Operation): History['currentTarget'] {
  switch (operation.name) {
    case 'createSummary':
    case 'finishEditSummary':
    case 'removeSummary':
      return { type: 'summary', value: operation.target.id }
    case 'createArrow':
    case 'finishEditArrowLabel':
    case 'removeArrow':
    case 'reshapeArrow':
      return { type: 'arrow', value: operation.target.id }
    case 'removeNodes':
    case 'copyNodes':
    case 'moveNodesBefore':
    case 'moveNodesAfter':
    case 'moveNodesIn':
      return { type: 'nodes', value: operation.target.map(node => node.id) }
    default:
      return { type: 'nodes', value: [operation.target.id] }
  }
}

export default function (mei: MindElixir) {
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
  mei.clearHistory = function () {
    history = []
    currentIndex = -1
    current = mei.getData()
    mei.clearSelection()
  }
  const handleOperation = function (operation: Operation) {
    if (operation.name === 'beginEdit') return
    history = history.slice(0, currentIndex + 1)
    const next = mei.getData()
    const item = {
      prev: current,
      operation: operation.name,
      currentSelected: currentSelectedNodes.map(n => n.id),
      currentTarget: calcCurrentTarget(operation),
      next,
    }
    history.push(item)
    current = next
    currentIndex = history.length - 1
    console.log('operation', item.currentSelected, item.currentTarget.value)
  }
  const handleKeyDown = function (e: KeyboardEvent) {
    // console.log(`mei.map.addEventListener('keydown', handleKeyDown)`, e.key, history.length, currentIndex)
    if (!mei.editable) return
    if (!e.metaKey && !e.ctrlKey) return
    // Use e.key instead of e.code: e.code is the physical key position, which
    // does not match the letter on non-QWERTY layouts (e.g. AZERTY Z -> code KeyW),
    // see https://github.com/SSShooter/mind-elixir-core/issues/380
    const key = e.key.toLowerCase()
    if (key === 'z') e.shiftKey ? mei.redo() : mei.undo()
    else if (key === 'y') mei.redo()
  }
  const handleSelectNodes = function () {
    currentSelectedNodes = mei.currentNodes.map(n => n.nodeObj)
  }
  mei.bus.addListener('operation', handleOperation)
  mei.bus.addListener('selectNodes', handleSelectNodes)
  // 反选（如 Ctrl+点击）只会 fire unselectNodes，也需同步选中状态，避免记录陈旧的 currentSelected
  mei.bus.addListener('unselectNodes', handleSelectNodes)
  mei.container.addEventListener('keydown', handleKeyDown)
  return () => {
    mei.bus.removeListener('operation', handleOperation)
    mei.bus.removeListener('selectNodes', handleSelectNodes)
    mei.bus.removeListener('unselectNodes', handleSelectNodes)
    mei.container.removeEventListener('keydown', handleKeyDown)
  }
}
