import type { Operation } from '../index'
import { E, type MindElixirInstance } from '../index'

export default function (mei: MindElixirInstance) {
  mei.history = []
  mei.isUndo = false
  mei.undo = function () {
    console.log('undo')
    const operation = mei.history.pop()
    if (!operation) return
    mei.isUndo = true
    if (operation.name === 'moveNode') {
      mei.moveNode(E(operation.obj.fromObj.id), E(operation.obj.originParentId))
    } else if (operation.name === 'removeNode') {
      if (operation.originSiblingId) {
        mei.insertBefore(E(operation.originSiblingId), operation.obj)
      } else {
        mei.addChild(E(operation.originParentId), operation.obj)
      }
    } else if (operation.name === 'addChild' || operation.name === 'copyNode') {
      mei.removeNode(E(operation.obj.id))
    } else if (operation.name === 'finishEdit') {
      mei.setNodeTopic(E(operation.obj.id), operation.origin)
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
      // console.log(operation, mei.history)
    }
  })
  mei.map.addEventListener('keydown', (e: KeyboardEvent) => {
    if (!mei.allowUndo) return
    if ((e.metaKey || e.ctrlKey) && e.key === 'z') mei.undo()
  })
}
