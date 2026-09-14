import type { Arrow } from '../arrow'
import type { Summary } from '../summary'
import type { NodeObj } from '../types/index'

type OperationBase<Name extends string, Target> = {
  name: Name
  target: Target
}

export type NodeOperation =
  | OperationBase<'addChild' | 'insertParent' | 'beginEdit', NodeObj>
  | (OperationBase<'insertSibling', NodeObj> & {
      position: 'before' | 'after'
    })
  | (OperationBase<'reshapeNode', NodeObj> & {
      origin: NodeObj
    })
  | (OperationBase<'finishEdit', NodeObj> & {
      origin: string
    })
  | (OperationBase<'moveNodesAfter' | 'moveNodesBefore' | 'moveNodesIn', NodeObj[]> & {
      destination: NodeObj
    })
  | OperationBase<'removeNodes' | 'copyNodes', NodeObj[]>

export type SummaryOperation = OperationBase<'createSummary' | 'removeSummary' | 'finishEditSummary', Summary>

export type ArrowOperation =
  | OperationBase<'createArrow' | 'removeArrow' | 'finishEditArrowLabel', Arrow>
  | (OperationBase<'reshapeArrow', Arrow> & {
      origin: Arrow
    })

/**
 * Collapse / expand of a node. `expanded` lives in the node data, so folding is
 * a document change like any other and lands on the undo timeline. `recursive`
 * and `level` describe the batch entry points (`expandNodeAll`, Ctrl+K) that
 * touch descendants too.
 */
export type ExpandOperation = OperationBase<'expandNode' | 'collapseNode', NodeObj> & {
  recursive?: boolean
  /** Depth limit passed to the recursive walk. `undefined` means every level. */
  level?: number
}

export type Operation = NodeOperation | SummaryOperation | ArrowOperation | ExpandOperation
export type OperationType = Operation['name']

/** Data mutation events such as node, arrow and summary operations. */
export type OperationEventMap = {
  /** Public data mutation event. Every operation uses `target`; batch operations use an array. */
  operation: (operation: Operation) => void
}

/** Selection state events for nodes, arrows and summaries. */
export type SelectionEventMap = {
  selectNewNode: (node: NodeObj) => void
  selectNodes: (nodes: NodeObj[]) => void
  unselectNodes: (nodes: NodeObj[]) => void
  selectArrow: (arrow: Arrow) => void
  unselectArrow: () => void
  selectSummary: (summary: Summary) => void
  unselectSummary: () => void
}

/** Viewport and map state events. */
export type ViewportEventMap = {
  expandNode: (node: NodeObj) => void
  changeDirection: (direction: number) => void
  scale: (scale: number) => void
  move: (data: { dx: number; dy: number }) => void
}

/** Internal rendering events. */
export type RenderEventMap = {
  linkDiv: () => void
  /** Please use throttling to prevent performance degradation. */
  updateArrowDelta: (arrow: Arrow) => void
}

/** Internal context-menu event. */
export type ContextMenuEventMap = {
  showContextMenu: (event: MouseEvent) => void
}

/** Document lifecycle events. */
export type DocumentEventMap = {
  /**
   * A new document was installed through `refresh(data)`.
   * Fired after the data is in place; listeners may re-baseline their own state.
   */
  refresh: () => void
}

/**
 * Events emitted by a MindElixir instance.
 *
 * The intersections keep the existing bus API compatible while grouping event
 * names by responsibility for maintainers and generated type declarations.
 */
export type EventMap = OperationEventMap & SelectionEventMap & ViewportEventMap & RenderEventMap & ContextMenuEventMap & DocumentEventMap

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
        // Walk backwards: removing an entry while iterating forwards skips the
        // handler that slides into its place, so a doubly-registered handler
        // kept one registration behind.
        for (let i = handlers.length - 1; i >= 0; i--) {
          if (handlers[i] === handler) {
            handlers.splice(i, 1)
          }
        }
      }
    },
  }
}
