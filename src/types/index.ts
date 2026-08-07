import type { Topic } from './dom'
import type { OperationMap, Operations } from '../methods'
import type { Arrow } from '../arrow'
import type { Summary } from '../summary'
import type { MainLineParams, SubLineParams } from '../utils/generateBranch'
import type { LangPack } from '../i18n'
import type { ContextMenuOption } from '../plugin/contextMenu'
import type MindElixir from '../index'
export { type MindElixirMethods } from '../methods'
export type { MainLineParams, SubLineParams } from '../utils/generateBranch'

export const DirectionClass = {
  LHS: 'lhs',
  RHS: 'rhs',
  DOWN: 'down',
} as const

export type DirectionClass = (typeof DirectionClass)[keyof typeof DirectionClass]

/**
 * Before-hook map for node operations. Each hook receives the same arguments as
 * its operation and may veto it by returning `false` (or a promise resolving to
 * `false`).
 *
 * @public
 */
export type Before = Partial<{
  [K in Operations]: (...args: Parameters<OperationMap[K]>) => Promise<boolean> | boolean
}>

/**
 * MindElixir Theme
 *
 * @public
 */
export type ThemeCssVar = {
  '--node-gap-x': string
  '--node-gap-y': string
  '--main-gap-x': string
  '--main-gap-y': string
  '--main-color': string
  '--main-bgcolor': string
  '--main-bgcolor-transparent': string
  '--main-border'?: string
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
  '--map-padding': string
}

/**
 * MindElixir Theme
 *
 * @public
 */
export type Theme<M = any> = {
  name: string
  /**
   * Hint for developers to use the correct theme
   */
  type?: 'light' | 'dark'
  /**
   * Color palette for main branches
   */
  palette: string[]
  cssVar?: Partial<ThemeCssVar>
  generateMainBranch?: (this: MindElixir<M>, params: MainLineParams) => string
  generateSubBranch?: (this: MindElixir<M>, params: SubLineParams) => string
}

export type Alignment = 'root' | 'nodes'

export interface KeypressOptions {
  [key: string]: (e: KeyboardEvent) => void
}

/**
 * The MindElixir instance type is the exported `MindElixir` class itself.
 */
type PathString = string
/**
 * The MindElixir options
 *
 * @public
 */
export interface Options<M = any> {
  el: string | HTMLElement
  direction?: 0 | 1 | 2 | 3
  /**
   * @deprecated Use `contextMenu.locale` instead.
   */
  locale?: string
  /**
   * @deprecated Use `editable` instead
   */
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
  /**
   * Compact mode. If true, distance fields will be controlled to a small value.
   */
  compact?: boolean
  generateMainBranch?: (this: MindElixir<M>, params: MainLineParams) => PathString
  generateSubBranch?: (this: MindElixir<M>, params: SubLineParams) => PathString
  theme?: Theme<M>
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
  markdown?: (markdown: string, obj: NodeObj<M> | Arrow<M> | Summary) => string
  /**
   * Image proxy function to handle image URLs, mainly used to solve CORS issues
   * If provided, all image URLs will be processed through this function before setting to img src
   * @default undefined
   */
  imageProxy?: (url: string) => string

  /**
   * Custom paste handler when there are no nodes copied;
   * @default undefined
   */
  pasteHandler?: (e: ClipboardEvent) => void
  /**
   * Enable mobile multi-select mode
   * @default false
   */
  mobileMultiSelect?: boolean
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
export interface NodeObj<M = any> {
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
  children?: NodeObj<M>[]
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
  parent?: NodeObj<M>
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
  /**
   * Generic metadata for the node, can be used to store any custom data.
   */
  metadata?: M
  // TODO: checkbox
  // checkbox?: boolean | undefined
}
export type NodeObjExport<M = any> = Omit<NodeObj<M>, 'parent'>

/**
 * The exported data of MindElixir
 *
 * @public
 */
export type MindElixirData<M = any> = {
  nodeData: NodeObj<M>
  arrows?: Arrow<M>[]
  summaries?: Summary[]
  direction?: 0 | 1 | 2 | 3
  theme?: Theme<M>
  compact?: boolean
  /**
   * Extension fields to store arbitrary metadata for the map.
   */
  meta?: Record<string, any>
}
