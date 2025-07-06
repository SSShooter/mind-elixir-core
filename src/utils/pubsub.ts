import type { Arrow } from '../arrow'
import type { Summary } from '../summary'
import type { NodeObj } from '../types/index'

type NodeOperation =
  | {
      name: 'moveNodeIn' | 'moveDownNode' | 'moveUpNode' | 'copyNode' | 'addChild' | 'insertParent' | 'insertBefore' | 'beginEdit'
      obj: NodeObj
    }
  | {
      name: 'insertSibling'
      type: 'before' | 'after'
      obj: NodeObj
    }
  | {
      name: 'reshapeNode'
      obj: NodeObj
      origin: NodeObj
    }
  | {
      name: 'finishEdit'
      obj: NodeObj
      origin: string
    }
  | {
      name: 'moveNodeAfter' | 'moveNodeBefore' | 'moveNodeIn'
      objs: NodeObj[]
      toObj: NodeObj
    }

type MultipleNodeOperation =
  | {
      name: 'removeNodes'
      objs: NodeObj[]
    }
  | {
      name: 'copyNodes'
      objs: NodeObj[]
    }

export type SummaryOperation =
  | {
      name: 'createSummary'
      obj: Summary
    }
  | {
      name: 'removeSummary'
      obj: { id: string }
    }
  | {
      name: 'finishEditSummary'
      obj: Summary
    }

export type ArrowOperation =
  | {
      name: 'createArrow'
      obj: Arrow
    }
  | {
      name: 'removeArrow'
      obj: { id: string }
    }
  | {
      name: 'finishEditArrowLabel'
      obj: Arrow
    }

export type Operation = NodeOperation | MultipleNodeOperation | SummaryOperation | ArrowOperation
export type OperationType = Operation['name']

export type EventMap = {
  operation: (info: Operation) => void
  selectNewNode: (nodeObj: NodeObj) => void
  selectNodes: (nodeObj: NodeObj[]) => void
  unselectNodes: (nodeObj: NodeObj[]) => void
  expandNode: (nodeObj: NodeObj) => void
  linkDiv: () => void
  scale: (scale: number) => void
  move: (data: { dx: number; dy: number }) => void
  /**
   *  please use throttling to prevent performance degradation
   */
  updateArrowDelta: (arrow: Arrow) => void
  showContextMenu: (e: MouseEvent) => void
}

export function createBus<T extends Record<string, (...args: any[]) => void> = EventMap>() {
  return {
    handlers: {} as Record<keyof T, ((...arg: any[]) => void)[]>,
    addListener: function <K extends keyof T>(type: K, handler: T[K]) {
      if (this.handlers[type] === undefined) this.handlers[type] = []
      this.handlers[type].push(handler)
    },
    fire: function <K extends keyof T>(type: K, ...payload: Parameters<T[K]>) {
      if (this.handlers[type] instanceof Array) {
        const handlers = this.handlers[type]
        for (let i = 0; i < handlers.length; i++) {
          handlers[i](...payload)
        }
      }
    },
    removeListener: function <K extends keyof T>(type: K, handler: T[K]) {
      if (!this.handlers[type]) return
      const handlers = this.handlers[type]
      if (!handler) {
        handlers.length = 0
      } else if (handlers.length) {
        for (let i = 0; i < handlers.length; i++) {
          if (handlers[i] === handler) {
            this.handlers[type].splice(i, 1)
          }
        }
      }
    },
  }
}
