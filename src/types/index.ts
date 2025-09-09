import type { Topic, CustomSvg } from './dom'
import type { createBus, EventMap, Operation } from '../utils/pubsub'
import type { MindElixirMethods, OperationMap, Operations } from '../methods'
import type { LinkDragMoveHelperInstance } from '../utils/LinkDragMoveHelper'
import type { Arrow } from '../arrow'
import type { Summary, SummarySvgGroup } from '../summary'
import type { MainLineParams, SubLineParams } from '../utils/generateBranch'
import type { Locale } from '../i18n'
import type { ContextMenuOption } from '../plugin/contextMenu'
import type { createDragMoveHelper } from '../utils/dragMoveHelper'
import type SelectionArea from '@viselect/vanilla'
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
  cssVar: {
    '--node-gap-x': string
    '--node-gap-y': string
    '--main-gap-x': string
    '--main-gap-y': string
    '--main-color': string
    '--main-bgcolor': string
    '--color': string
    '--bgcolor': string
    '--selected': string
    '--accent-color': string
    '--root-color': string
    '--root-bgcolor': string
    '--root-border-color': string
    '--root-radius': string
    '--main-radius': string
    '--topic-padding': string
    '--panel-color': string
    '--panel-bgcolor': string
    '--panel-border-color': string
    '--arrow-color': string
    '--arrow-label-color': string
    '--map-padding': string
  }
}

export type Alignment = 'root' | 'nodes'

export interface KeypressOptions {
  [key: string]: (e: KeyboardEvent) => void
}

/**
 * The MindElixir instance
 *
 * @public
 */
export interface MindElixirInstance extends Omit<Required<Options>, 'markdown' | 'imageProxy'>, MindElixirMethods {
  markdown?: (markdown: string) => string // Keep markdown as optional
  imageProxy?: (url: string) => string // Keep imageProxy as optional
  dragged: Topic[] | null // currently dragged nodes
  el: HTMLElement
  disposable: Array<() => void>
  isFocusMode: boolean
  nodeDataBackup: NodeObj

  nodeData: NodeObj
  arrows: Arrow[]
  summaries: Summary[]

  readonly currentNode: Topic | null
  currentNodes: Topic[]
  currentSummary: SummarySvgGroup | null
  currentArrow: CustomSvg | null
  waitCopy: Topic[] | null

  scaleVal: number
  tempDirection: number | null

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

  bus: ReturnType<typeof createBus<EventMap>>
  history: Operation[]
  undo: () => void
  redo: () => void

  selection: SelectionArea
  dragMoveHelper: ReturnType<typeof createDragMoveHelper>
}
type PathString = string
/**
 * The MindElixir options
 *
 * @public
 */
export interface Options {
  el: string | HTMLElement
  direction?: number
  locale?: Locale
  draggable?: boolean
  editable?: boolean
  contextMenu?: boolean | ContextMenuOption
  toolBar?: boolean
  keypress?: boolean | KeypressOptions
  mouseSelectionButton?: 0 | 2
  before?: Before
  newTopicName?: string
  allowUndo?: boolean
  overflowHidden?: boolean
  generateMainBranch?: (this: MindElixirInstance, params: MainLineParams) => PathString
  generateSubBranch?: (this: MindElixirInstance, params: SubLineParams) => PathString
  theme?: Theme
  selectionContainer?: string | HTMLElement
  alignment?: Alignment
  scaleSensitivity?: number
  scaleMin?: number
  scaleMax?: number
  handleWheel?: true | ((e: WheelEvent) => void)
  /**
   * Custom markdown parser function that takes markdown string and returns HTML string
   * If not provided, markdown will be disabled
   * @default undefined
   */
  markdown?: (markdown: string) => string
  /**
   * Image proxy function to handle image URLs, mainly used to solve CORS issues
   * If provided, all image URLs will be processed through this function before setting to img src
   * @default undefined
   */
  imageProxy?: (url: string) => string
  selectionDisabled?: boolean
  /** When dragging, allow the map to be moved outside container by at most this padding (px). */
  dragBoundPadding?: number
}

export type Uid = string

export type Left = 0
export type Right = 1

/**
 * Tag object for node tags with optional styling
 *
 * @public
 */
export interface TagObj {
  text: string
  style?: Partial<CSSStyleDeclaration> | Record<string, string>
  className?: string
}

/**
 * MindElixir node object
 *
 * @public
 */
export interface NodeObj {
  topic: string
  id: Uid
  style?: Partial<{
    fontSize: string
    fontFamily: string
    color: string
    background: string
    fontWeight: string
    width: string
    border: string
    textDecoration: string
  }>
  children?: NodeObj[]
  tags?: (string | TagObj)[]
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
  /**
   * The color of the branch.
   */
  branchColor?: string
  /**
   * This property is added programatically, do not set it manually.
   *
   * the Root node has no parent!
   */
  parent?: NodeObj
  /**
   * Render custom HTML in the node.
   *
   * Everything in the node will be replaced by this property.
   */
  dangerouslySetInnerHTML?: string
  /**
   * Extra data for the node, which can be used to store any custom data.
   */
  note?: string
  // TODO: checkbox
  // checkbox?: boolean | undefined
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
