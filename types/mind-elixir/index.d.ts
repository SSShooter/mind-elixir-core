/// <reference path="./dom.d.ts" />
/// <reference path="./function.d.ts" />
/// <reference path="./interact.d.ts" />

type operation = {
  name: string
}

interface Theme {
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

interface MindElixirInstance {
  isFocusMode: boolean
  nodeDataBackup: NodeObj
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
  history: operation[]
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
  mainNodes: Children
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

  addChild: InsertNodeCommon
  createInputDiv: CreateInputDiv
  layoutChildren: LayoutChildren

  moveNode: MoveNodeCommon
  moveUpNode: MoveNodeCommon
  moveDownNode: MoveNodeCommon
  moveNodeBefore: MoveNodeCommon
  moveNodeAfter: MoveNodeCommon
  removeNode: RemoveNode
  setNodeTopic: SetNodeTopic

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
  refresh

  layout: Layout
  removeLink
  addParentLink
  helper1: LinkDragMoveHelperInstance
  helper2: LinkDragMoveHelperInstance
}

interface Options {
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
interface NodeObj {
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
  parent: NodeObj
}
type LinkItem = {
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
type LinkObj = Record<string, LinkItem>

interface MindElixirData {
  nodeData: NodeObj
  linkData?: LinkObj
  direction?: number
  theme?: Theme
}
