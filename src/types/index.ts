import type Bus from '../utils/pubsub'
import type { Topic, CustomSvg } from './dom'
import type { EventMap, Operation } from '../utils/pubsub'
import type { MindElixirMethods, OperationMap, Operations } from '../methods'
import type { LinkDragMoveHelperInstance } from '../utils/LinkDragMoveHelper'
import type { Arrow } from '../arrow'
import type { Summary, SummarySvgGroup } from '../summary'
import type SelectionArea from '@viselect/vanilla'
import type { MainLineParams, SubLineParams } from '../utils/generateBranch'
import type { Locale } from '../i18n'
export * from '../methods'

type Before = Partial<{
  [K in Operations]: (...args: Parameters<OperationMap[K]>) => Promise<boolean> | boolean
}>

export type Theme = {
  name: string
  palette: string[]
  cssVar: Partial<{
    '--main-color': string
    '--main-bgcolor': string
    '--color': string
    '--bgcolor': string
    '--selected': string
    '--panel-color': string
    '--panel-bgcolor': string
    '--root-color': string
    '--root-bgcolor': string
    '--root-radius': string
    '--main-radius': string
    '--topic-padding': string
    '--panel-border-color': string
  }>
}

/**
 * The MindElixir instance
 *
 * @public
 */
export interface MindElixirInstance extends MindElixirMethods {
  disposable: Array<() => void>
  isFocusMode: boolean
  nodeDataBackup: NodeObj
  mindElixirBox: HTMLElement

  nodeData: NodeObj
  arrows: Arrow[]
  summaries: Summary[]

  currentNode: Topic | null
  currentNodes: Topic[] | null
  currentSummary: SummarySvgGroup | null
  currentArrow: CustomSvg | null

  waitCopy: Topic[] | null
  scaleVal: number
  tempDirection: number | null
  theme: Theme
  userTheme?: Theme
  direction: number
  locale: Locale
  draggable: boolean
  editable: boolean
  contextMenu: boolean
  contextMenuOption: object
  toolBar: boolean
  keypress: boolean
  mouseSelectionButton: 0 | 2
  before: Before
  newTopicName: string
  allowUndo: boolean
  overflowHidden: boolean
  mainBranchStyle: number
  subBranchStyle: number
  mobileMenu: boolean
  generateMainBranch: (params: MainLineParams) => PathString
  generateSubBranch: (params: SubLineParams) => PathString

  container: HTMLElement
  map: HTMLElement
  root: HTMLElement
  nodes: HTMLElement
  lines: SVGElement
  summarySvg: SVGElement
  linkController: SVGElement
  P2: HTMLElement
  P3: HTMLElement
  line1: SVGElement
  line2: SVGElement
  linkSvgGroup: SVGElement
  /**
   * @internal
   */
  helper1?: LinkDragMoveHelperInstance
  /**
   * @internal
   */
  helper2?: LinkDragMoveHelperInstance

  bus: ReturnType<typeof Bus.create<EventMap>>
  history: Operation[]
  undo: () => void
  redo: () => void

  selection: SelectionArea
}
type PathString = string
/**
 * The MindElixir options
 *
 * @public
 */
export type Options = {
  el: string | HTMLElement
  direction?: number
  locale?: Locale
  draggable?: boolean
  editable?: boolean
  contextMenu?: boolean
  contextMenuOption?: any
  toolBar?: boolean
  keypress?: boolean
  mouseSelectionButton?: 0 | 2
  before?: Before
  newTopicName?: string
  allowUndo?: boolean
  overflowHidden?: boolean
  generateMainBranch?: (this: MindElixirInstance, params: MainLineParams) => PathString
  generateSubBranch?: (this: MindElixirInstance, params: SubLineParams) => PathString
  mobileMenu?: boolean
  theme?: Theme
  nodeMenu?: boolean
}

export type Uid = string

/**
 * MindElixir node object
 *
 * @public
 */
export type NodeObj = {
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
  image?: {
    url: string
    width: number
    height: number
  }
  // main node specific properties
  branchColor?: string
  // add programatically
  parent?: NodeObj // root node has no parent!
  // TODO: checkbox
  // checkbox?: boolean | undefined
  dangerouslySetInnerHTML?: string
}
export type NodeObjExport = Omit<NodeObj, 'parent'>

/**
 * The exported data of MindElixir
 *
 * @public
 */
export type MindElixirData = {
  nodeData: NodeObj
  arrows?: Arrow[]
  summaries?: Summary[]
  direction?: number
  theme?: Theme
}
