import type { MindElixirInstance, MindElixirData } from './index'
import linkDiv from './linkDiv'
import contextMenu from './plugin/contextMenu'
import keypressInit from './plugin/keypress'
import nodeDraggable from './plugin/nodeDraggable'
import operationHistory from './plugin/operationHistory'
import toolBar from './plugin/toolBar'
import selection from './plugin/selection'
import { editTopic, createWrapper, createParent, createChildren, createTopic, findEle } from './utils/dom'
import { getObjById, generateNewObj, fillParent } from './utils/index'
import { layout } from './utils/layout'
import { changeTheme } from './utils/theme'
import * as interact from './interact'
import * as nodeOperation from './nodeOperation'
import * as arrow from './arrow'
import * as summary from './summary'
import * as exportImage from './plugin/exportImage'

export type OperationMap = typeof nodeOperation
export type Operations = keyof OperationMap
type NodeOperation = {
  [K in Operations]: ReturnType<typeof beforeHook<K>>
}

function beforeHook<T extends Operations>(
  fn: OperationMap[T],
  fnName: T
): (this: MindElixirInstance, ...args: Parameters<OperationMap[T]>) => Promise<void> {
  return async function (this: MindElixirInstance, ...args: Parameters<OperationMap[T]>) {
    const hook = this.before[fnName]
    if (hook) {
      const res = await hook.apply(this, args)
      if (!res) return
    }
    ;(fn as any).apply(this, args)
  }
}

const operations = Object.keys(nodeOperation) as Array<Operations>
const nodeOperationHooked = {} as NodeOperation
if (import.meta.env.MODE !== 'lite') {
  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i]
    nodeOperationHooked[operation] = beforeHook(nodeOperation[operation], operation)
  }
}

export type MindElixirMethods = typeof methods

/**
 * Methods that mind-elixir instance can use
 *
 * @public
 */
const methods = {
  getObjById,
  generateNewObj,
  layout,
  linkDiv,
  editTopic,
  createWrapper,
  createParent,
  createChildren,
  createTopic,
  findEle,
  changeTheme,
  ...interact,
  ...(nodeOperationHooked as NodeOperation),
  ...arrow,
  ...summary,
  ...exportImage,
  init(this: MindElixirInstance, data: MindElixirData) {
    data = JSON.parse(JSON.stringify(data))
    if (!data || !data.nodeData) return new Error('MindElixir: `data` is required')
    if (data.direction !== undefined) {
      this.direction = data.direction
    }
    this.changeTheme(data.theme || this.theme, false)
    this.nodeData = data.nodeData
    fillParent(this.nodeData)
    this.arrows = data.arrows || []
    this.summaries = data.summaries || []
    this.tidyArrow()
    // plugins
    this.toolBar && toolBar(this)
    if (import.meta.env.MODE !== 'lite') {
      this.keypress && keypressInit(this, this.keypress)

      if (this.editable) {
        selection(this)
      }
      if (this.contextMenu) {
        this.disposable.push(contextMenu(this, this.contextMenu))
      }
      this.draggable && this.disposable.push(nodeDraggable(this))
      this.allowUndo && this.disposable.push(operationHistory(this))
    }
    this.layout()
    this.linkDiv()
    this.toCenter()
  },
  destroy(this: Partial<MindElixirInstance>) {
    this.disposable!.forEach(fn => fn())
    if (this.el) this.el.innerHTML = ''
    this.el = undefined
    this.nodeData = undefined
    this.arrows = undefined
    this.summaries = undefined
    this.currentArrow = undefined
    this.currentNodes = undefined
    this.currentSummary = undefined
    this.theme = undefined
    this.direction = undefined
    this.bus = undefined
    this.container = undefined
    this.map = undefined
    this.lines = undefined
    this.linkController = undefined
    this.linkSvgGroup = undefined
    this.P2 = undefined
    this.P3 = undefined
    this.line1 = undefined
    this.line2 = undefined
    this.nodes = undefined
    this.selection?.destroy()
    this.selection = undefined
  },
}

export default methods
