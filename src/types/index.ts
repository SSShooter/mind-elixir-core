import type Bus from '../utils/pubsub'
import type { changeTheme } from '../utils/theme'
import type { Topic, CustomSvg, Children } from './dom'
import type {
  Init,
  CreateWrapper,
  CreateParent,
  CreateChildren,
  CreateTopic,
  LinkDiv,
  JudgeDirection,
  InsertNodeCommon,
  CreateInputDiv,
  LayoutChildren,
  MoveNodeToCommon,
  MoveNodeCommon,
  RemoveNode,
  TNodeCopy,
  SetNodeTopic,
  SelectNodeFunc,
  CommonSelectFunc,
  SiblingSelectFunc,
  GetDataStringFunc,
  GetDataFunc,
  ExpandNode,
  RefreshFunc,
  Layout,
  RemoveLink,
  SelectLink,
  HideLinkController,
  CreateLink,
  ShowLinkController,
} from './function'
import type { Scale, ToCenter, FocusNode, CancelFocus, InitLeft, InitRight, InitSide, SetLocale, EnableEdit, DisableEdit, Install } from './interact'

export enum OperationType {
  moveNode = 'moveNode',
  moveNodeAfter = 'moveNodeAfter',
  moveNodeBefore = 'moveNodeBefore',
  removeNode = 'removeNode',
  addChild = 'addChild',
  copyNode = 'copyNode',
  reshapeNode = 'reshapeNode',
  insertSibling = 'insertSibling',
  insertBefore = 'insertBefore',
  insertParent = 'insertParent',
  moveUpNode = 'moveUpNode',
  moveDownNode = 'moveDownNode',

  beginEdit = 'beginEdit',
  finishEdit = 'finishEdit',
}

export type Operation = {
  name: OperationType
  obj: any
  origin: any
  originSiblingId: string
  originParentId: string
}

export interface Theme {
  name: string
  palette: string[]
  cssVar: Record<string, string>
  // {
  //   '--main-color': string
  //   '--main-bgcolor': string
  //   '--color': string
  //   '--bgcolor': string
  // }
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

export interface MindElixirInstance {
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

  bus: ReturnType<typeof Bus.create>

  history: Operation[]
  isUndo: boolean
  undo: () => void
  install: Install

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
  mainNodeHorizontalGap: number
  mainNodeVerticalGap: number
  subLinkStyle: number
  mobileMenu: boolean

  container: HTMLElement
  map: HTMLElement
  root: HTMLElement
  mainNodes: Children
  lines: SVGElement
  linkController: SVGElement
  P2: HTMLElement
  P3: HTMLElement
  line1: SVGElement
  line2: SVGElement
  linkSvgGroup: SVGElement

  mapHeight: number

  init: Init

  generateNewObj: GenerateNewObj
  createWrapper: CreateWrapper
  createParent: CreateParent
  createChildren: CreateChildren
  createTopic: CreateTopic

  linkDiv: LinkDiv
  judgeDirection: JudgeDirection

  addChild: InsertNodeCommon
  createInputDiv: CreateInputDiv
  layoutChildren: LayoutChildren

  moveNode: MoveNodeToCommon
  moveUpNode: MoveNodeCommon
  moveDownNode: MoveNodeCommon
  moveNodeBefore: MoveNodeToCommon
  moveNodeAfter: MoveNodeToCommon
  removeNode: RemoveNode
  copyNode: TNodeCopy
  setNodeTopic: SetNodeTopic

  insertParent: InsertNodeCommon
  insertSibling: InsertNodeCommon
  insertBefore: InsertNodeCommon

  selectNode: SelectNodeFunc
  unselectNode: CommonSelectFunc
  selectNextSibling: SiblingSelectFunc
  selectPrevSibling: SiblingSelectFunc
  selectFirstChild: CommonSelectFunc
  selectParent: CommonSelectFunc
  getDataString: GetDataStringFunc
  getData: GetDataFunc
  getDataMd: GetDataStringFunc
  scale: Scale
  toCenter: ToCenter
  focusNode: FocusNode
  cancelFocus: CancelFocus
  initLeft: InitLeft
  initRight: InitRight
  initSide: InitSide
  setLocale: SetLocale
  enableEdit: EnableEdit
  disableEdit: DisableEdit
  expandNode: ExpandNode
  refresh: RefreshFunc

  layout: Layout
  beginEdit: InsertNodeCommon
  fillParent: FillParent
  getObjById: GetObjById
  removeLink: RemoveLink
  selectLink: SelectLink
  hideLinkController: HideLinkController
  createLink: CreateLink
  showLinkController: ShowLinkController
  helper1: LinkDragMoveHelperInstance
  helper2: LinkDragMoveHelperInstance

  changeTheme: typeof changeTheme
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
  mainNodeHorizontalGap?: number
  mainNodeVerticalGap?: number
  subLinkStyle?: number
  mobileMenu?: boolean
  theme?: Theme
  nodeMenu?: boolean
}
export type Uid = string
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
