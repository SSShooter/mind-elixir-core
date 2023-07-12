import type { Operation, OperationType } from '../index'
import { E, type MindElixirInstance } from '../index'

const noop = function (mei: MindElixirInstance, operation: Operation) {
  // noop
}
const redoHandlerMap: Record<OperationType, (mei: MindElixirInstance, operation: Operation) => void> = {
  moveNode(mei, operation) {
    mei.moveNode(E(operation.obj.fromObj.id), E(operation.obj.originParentId))
  },
  moveNodeAfter: noop,
  moveNodeBefore: noop,
  removeNode(mei, operation) {
    if (operation.originSiblingId) {
      mei.insertBefore(E(operation.originSiblingId), operation.obj)
    } else {
      mei.addChild(E(operation.originParentId), operation.obj)
    }
  },
  addChild(mei, operation) {
    mei.removeNode(E(operation.obj.id))
  },
  copyNode(mei, operation) {
    mei.removeNode(E(operation.obj.id))
  },
  reshapeNode: noop,
  insertSibling: noop,
  insertBefore: noop,
  insertParent: noop,
  moveUpNode: noop,
  moveDownNode: noop,
  beginEdit: noop,
  finishEdit(mei, operation) {
    mei.setNodeTopic(E(operation.obj.id), operation.origin)
  },
}

export default function (mei: MindElixirInstance) {
  mei.history = []
  mei.isUndo = false
  mei.undo = function () {
    const operation = mei.history.pop()
    if (!operation) return
    mei.isUndo = true
    if (redoHandlerMap[operation.name]) {
      redoHandlerMap[operation.name](mei, operation)
    } else {
      mei.isUndo = false
    }
  }
  mei.bus.addListener('operation', (operation: Operation) => {
    if (mei.isUndo) {
      mei.isUndo = false
      return
    }
    if (['moveNode', 'removeNode', 'addChild', 'finishEdit', 'editStyle', 'editTags', 'editIcons'].includes(operation.name)) {
      mei.history.push(operation)
    }
  })
  mei.map.addEventListener('keydown', (e: KeyboardEvent) => {
    if (!mei.allowUndo) return
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') mei.undo()
  })
}
