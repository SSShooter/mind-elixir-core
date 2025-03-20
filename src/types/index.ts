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
import type { ContextMenuOption } from '../plugin/contextMenu'
export { type MindElixirMethods } from '../methods'

export enum DirectionClass {
  LHS = 'lhs',
  RHS = 'rhs',
}

type Before = Partial<{
  [K in Operations]: (...args: Parameters<OperationMap[K]>) => Promise<boolean> | boolean
}>

/**
 * MindElixir Theme
 *
 * @public
 */
export type Theme = {
  name: string
  /**
   * Hint for developers to use the correct theme
   */
  type?: 'light' | 'dark'
  /**
   * Color palette for main branches
   */
  palette: string[]
  cssVar: Partial<{
    '--gap': string
    '--main-color': string
    '--main-bgcolor': string
    '--color': string
    '--bgcolor': string
    '--selected': string
    '--root-color': string
    '--root-bgcolor': string
    '--root-border-color': string
    '--root-radius': string
    '--main-radius': string
    '--topic-padding': string
    '--panel-color': string
    '--panel-bgcolor': string
    '--panel-border-color': string
  }>
}

export type Alignment = 'root' | 'nodes'

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
  contextMenuOption?: ContextMenuOption
  toolBar: boolean
  keypress: boolean
  mouseSelectionButton: 0 | 2
  before: Before
  newTopicName: string
  allowUndo: boolean
  overflowHidden: boolean
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
  selectionContainer?: string | HTMLElement

  alignment: Alignment
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
  contextMenuOption?: ContextMenuOption
  toolBar?: boolean
  keypress?: boolean
  mouseSelectionButton?: 0 | 2
  before?: Before
  newTopicName?: string
  allowUndo?: boolean
  overflowHidden?: boolean
  generateMainBranch?: (this: MindElixirInstance, params: MainLineParams) => PathString
  generateSubBranch?: (this: MindElixirInstance, params: SubLineParams) => PathString
  theme?: Theme
  nodeMenu?: boolean
  selectionContainer?: string | HTMLElement
  alignment?: Alignment
}

export type Uid = string

export type Left = 0
export type Right = 1

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
  direction?: Left | Right
  image?: {
    url: string
    width: number
    height: number
    fit?: 'fill' | 'contain' | 'cover'
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
