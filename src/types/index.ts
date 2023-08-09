import type Bus from '../utils/pubsub'
import type { Topic, CustomSvg } from './dom'
import type { EventMap, Operation } from '../utils/pubsub'
import type methods from '../methods'

export interface Theme {
  name: string
  palette: string[]
  cssVar: {
    '--main-color': string
    '--main-bgcolor': string
    '--color': string
    '--bgcolor': string
  }
}

export interface LinkDragMoveHelperInstance {
  dom: HTMLElement
  mousedown: boolean
  lastX: number
  lastY: number
  init: (map: HTMLElement, cb: (deltaX: number, deltaY: number) => void) => void
  destory: (map: HTMLElement) => void
  clear: () => void
  handleMouseMove: (e: MouseEvent) => void
  handleMouseDown: (e: MouseEvent) => void
  handleClear: (e: MouseEvent) => void

  cb: ((deltaX: number, deltaY: number) => void) | null
}

type MindElixirMethods = typeof methods
export interface MindElixirInstance extends MindElixirMethods {
  isFocusMode: boolean
  nodeDataBackup: NodeObj
  mindElixirBox: HTMLElement
  nodeData: NodeObj
  linkData: LinkObj
  currentNode: Topic | null
  waitCopy: Topic | null
  currentLink: CustomSvg | null
  inputDiv: HTMLElement | null
  scaleVal: number
  tempDirection: number | null
  theme: Theme
  userTheme?: Theme
  direction: number
  locale: string
  draggable: boolean
  editable: boolean
  contextMenu: boolean
  contextMenuOption: object
  toolBar: boolean
  keypress: boolean
  before: Before
  newTopicName: string
  allowUndo: boolean
  overflowHidden: boolean
  mainLinkStyle: number
  subLinkStyle: number
  mobileMenu: boolean

  container: HTMLElement
  map: HTMLElement
  root: HTMLElement
  nodes: HTMLElement
  lines: SVGElement
  linkController: SVGElement
  P2: HTMLElement
  P3: HTMLElement
  line1: SVGElement
  line2: SVGElement
  linkSvgGroup: SVGElement
  helper1: LinkDragMoveHelperInstance
  helper2: LinkDragMoveHelperInstance

  bus: ReturnType<typeof Bus.create<EventMap>>
  history: Operation[]
  undo: () => void
  redo: () => void
}

export type Before = Record<string, (...args: any[]) => Promise<boolean> | boolean>
export type GenerateNewObj = (this: MindElixirInstance) => NodeObjExport
export type GetObjById = (id: string, data: NodeObj) => NodeObj | null
export type FillParent = (data: NodeObj, parent?: NodeObj) => void

export interface Options {
  el: string | HTMLElement
  direction?: number
  locale?: string
  draggable?: boolean
  editable?: boolean
  contextMenu?: boolean
  contextMenuOption?: any
  toolBar?: boolean
  keypress?: boolean
  before?: Before
  newTopicName?: string
  allowUndo?: boolean
  overflowHidden?: boolean
  mainLinkStyle?: number
  subLinkStyle?: number
  mobileMenu?: boolean
  theme?: Theme
  nodeMenu?: boolean
}
export type Uid = string

/**
 * MindElixir node object
 */
export interface NodeObj {
  topic: string
  id: Uid
  style?: {
    fontSize?: string
    color?: string
    background?: string
    fontWeight?: string
  }
  children?: NodeObj[]
  tags?: string[]
  icons?: string[]
  hyperLink?: string
  expanded?: boolean
  direction?: number
  root?: boolean
  image?: {
    url: string
    width: number
    height: number
  }
  // main node specific properties
  branchColor?: string
  // add programatically
  parent?: NodeObj // root node has no parent
}
export type NodeObjExport = Omit<NodeObj, 'parent'>
export type LinkItem = {
  id: string
  label: string
  from: Uid
  to: Uid
  delta1: {
    x: number
    y: number
  }
  delta2: {
    x: number
    y: number
  }
}
export type LinkObj = Record<string, LinkItem>

export interface MindElixirData {
  nodeData: NodeObj
  linkData?: LinkObj
  direction?: number
  theme?: Theme
}
