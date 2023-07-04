import { Topic } from "./dom.interface"
import {
  CreateWrapper,
  CreateParent,
  CreateChildren,
  CreateTopic,
  LinkDiv,
  JudgeDirection,
  TNodeOperation,
  CreateInputDiv,
  LayoutChildren,
  SelectNodeFunc,
  CommonSelectFunc,
  SiblingSelectFunc,
  GetDataStringFunc,
  GetDataFunc,
  ExpandNode,
  Layout,
  CreateLink,
  ShowLinkController
} from "./function.interface"

export type Operation = {
  name: string
}

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

interface LinkDragMoveHelperInstance {
  dom: HTMLElement
  mousedown: false
  lastX: null
  lastY: null
  init: (map: HTMLElement, cb: (deltaX: number, deltaY: number) => void) => void
  destory: (map: HTMLElement) => void
}

export interface MindElixirInstance {
  mindElixirBox: HTMLElement
  nodeData: NodeObj
  linkData: LinkObj
  currentNode: Topic | null
  currentLink: SVGElement | null
  inputDiv: HTMLElement | null
  scaleVal: number
  tempDirection: number | null

  // wip
  bus: {
    addListener: (type: string, handler) => void
    fire: (type: string, ...payload) => void
  }

  // wip
  history: Operation[]
  isUndo: boolean
  undo: () => void

  theme: Theme
  direction: number
  locale: string
  draggable: boolean
  editable: boolean
  contextMenu: boolean
  contextMenuOption: object
  toolBar: boolean
  keypress: boolean
  before: object
  newTopicName: string
  allowUndo: boolean
  overflowHidden: boolean
  mainLinkStyle: number
  mainNodeHorizontalGap: number
  mainNodeVerticalGap: number
  mobileMenu: boolean

  container: HTMLElement
  map: HTMLElement
  root: HTMLElement
  mainNodes: HTMLElement
  lines: SVGElement
  linkController: SVGElement
  P2: HTMLElement
  P3: HTMLElement
  line1: SVGElement
  line2: SVGElement
  linkSvgGroup: SVGElement

  init: Init

  generateNewObj: () => NodeObj
  createWrapper: CreateWrapper
  createParent: CreateParent
  createChildren: CreateChildren
  createTopic: CreateTopic

  linkDiv: LinkDiv
  judgeDirection: JudgeDirection

  createLink: CreateLink
  showLinkController: ShowLinkController

  addChild: TNodeOperation
  createInputDiv: CreateInputDiv
  layoutChildren: LayoutChildren

  selectNode: SelectNodeFunc
  unselectNode: CommonSelectFunc
  selectNextSibling: SiblingSelectFunc
  selectPrevSibling: SiblingSelectFunc
  selectFirstChild: CommonSelectFunc
  selectParent: CommonSelectFunc
  getDataString: GetDataStringFunc
  getData: GetDataFunc
  getDataMd: GetDataStringFunc
  scale: any
  toCenter: any
  focusNode: any
  cancelFocus: any
  initLeft: any
  initRight: any
  initSide: any
  setLocale: any
  enableEdit: any
  disableEdit: any
  expandNode: ExpandNode
  refresh: any

  layout: Layout
  removeLink: any
  addParentLink: any
}

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
  before?: object
  newTopicName?: string
  allowUndo?: boolean
  overflowHidden?: boolean
  mainLinkStyle?: number
  mainNodeHorizontalGap?: number
  mainNodeVerticalGap?: number
  mobileMenu?: boolean
  theme?: Theme
  nodeMenu?: boolean
}
type Uid = string
export interface NodeObj {
  topic: string
  id: Uid
  style?: {
    fontSize?: string
    color?: string
    background?: string
    fontWeight?: string
  }
  parent?: NodeObj
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
}

export type LinkObj = object

export interface MindElixirData {
  nodeData: NodeObj
  linkData?: LinkObj
  direction?: number
  theme?: Theme
}
