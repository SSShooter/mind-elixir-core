import './index.css'
import './markdown.css'
import { LEFT, RIGHT, SIDE, DOWN, DARK_THEME, THEME } from './const'
import { generateUUID } from './utils/index'
import initMouseEvent from './mouse'
import { createBus } from './utils/pubsub'
import { findEle } from './utils/dom'
import { createLinkSvg, createLine } from './utils/svg'
import type {
  MindElixirData,
  MindElixirMethods,
  Options,
  Theme,
  ThemeCssVar,
  NodeObj,
  MindElixirInstance,
  NodeObjExport,
  Alignment,
  KeypressOptions,
  Before,
} from './types/index'
import type { Topic, ArrowSvg, SummarySvg, Wrapper, Parent, Children } from './types/dom'
import type { Arrow, ArrowOptions } from './arrow'
import type { Summary, SummaryOptions } from './summary'
import type { ContextMenuOption } from './plugin/contextMenu'
import type { MainLineParams, SubLineParams } from './utils/generateBranch'
import type { LinkPanHelperInstance } from './utils/LinkPanHelper'
import type { EventMap, Operation } from './utils/pubsub'
import type SelectionArea from './viselect/src'
import methods from './methods'
import { sub, main } from './utils/generateBranch'
import { version } from '../package.json'
import { createPanHelper } from './utils/panHelper'

// TODO show up animation

type ResolvedTheme = Omit<Theme, 'cssVar'> & { cssVar: ThemeCssVar }

// Resolved constructor input that lives on the instance (the four excluded
// members are refined on the class below).
type ResolvedOptions = Omit<Required<Options>, 'el' | 'theme' | 'markdown' | 'imageProxy'>

// The class is the single canonical owner of the instance shape. Instead of a
// same-name `interface MindElixir` declaration merge (which produces a second
// API item that collides onto the same API Documenter page and hides the class
// members), the resolved options and the prototype-mixed methods are declared
// directly on the class. `Object.assign` attaches the implementations at
// runtime, and the `_Assert*` guards below keep these declarations exhaustive.
class MindElixir {
  static readonly LEFT = LEFT
  static readonly RIGHT = RIGHT
  static readonly SIDE = SIDE
  static readonly DOWN = DOWN

  static readonly THEME = THEME
  static readonly DARK_THEME = DARK_THEME

  /**
   * @memberof MindElixir
   * @static
   */
  static version = version

  /**
   * @function
   * @memberof MindElixir
   * @static
   * @name E
   * @param {string} id Node id.
   * @return {TargetElement} Target element.
   * @example
   * E('bd4313fbac40284b')
   */
  static E = findEle

  /**
   * @function new
   * @memberof MindElixir
   * @static
   * @param {String} topic root topic
   */
  static new = (topic: string): MindElixirData => ({
    nodeData: {
      id: generateUUID(),
      topic: topic || 'new topic',
      children: [],
    },
  })

  // Options refined/overridden on the instance. The remaining resolved options
  // are contributed by the merged `interface MindElixir extends Options` below.
  declare el: HTMLElement
  declare theme: ResolvedTheme
  declare markdown?: (markdown: string, obj: NodeObj | Arrow | Summary) => string
  declare imageProxy?: (url: string) => string

  // Runtime state
  declare disposable: Array<() => void>
  declare dragged: Topic[] | null // currently dragged nodes
  declare spacePressed: boolean // space key pressed state
  declare isFocusMode: boolean
  declare nodeDataBackup: NodeObj
  declare nodeData: NodeObj
  declare arrows: Arrow[]
  declare summaries: Summary[]
  declare currentNodes: Topic[]
  declare currentSummary: SummarySvg | null
  declare currentArrow: ArrowSvg | null
  declare scaleVal: number
  declare tempDirection: 0 | 1 | 2 | 3 | null
  declare meta?: Record<string, any>

  // DOM infrastructure
  declare container: HTMLElement
  declare map: HTMLElement
  declare root: HTMLElement
  declare nodes: HTMLElement
  declare lines: SVGElement
  declare summarySvg: SVGElement
  declare linkController: SVGElement
  declare labelContainer: HTMLElement // Container for SVG labels
  declare P2: HTMLElement
  declare P3: HTMLElement
  declare line1: SVGElement
  declare line2: SVGElement
  declare arrowSvg: SVGElement
  /**
   * @internal
   */
  declare helper1?: LinkPanHelperInstance
  /**
   * @internal
   */
  declare helper2?: LinkPanHelperInstance

  // Services, history and selection (attached during init / by plugins)
  declare bus: ReturnType<typeof createBus<EventMap>>
  declare history: Operation[]
  declare undo: () => void
  declare redo: () => void
  /**
   * Reset the undo/redo stack and update the internal baseline snapshot to the
   * current diagram state. Call this after loading new data into an existing
   * instance (e.g. after `refresh()`) to prevent users from undoing back into
   * a previously loaded diagram.
   *
   * Only available when `allowUndo` is `true` (the default).
   */
  declare clearHistory?: () => void
  declare selection: SelectionArea
  declare panHelper: ReturnType<typeof createPanHelper>
  declare ptState?: number

  // #region GENERATED members — do not edit by hand; run `npm run gen:members`.
  // Resolved constructor options (defaults are applied in the constructor).
  declare direction: 0 | 1 | 2 | 3
  declare locale: string
  declare draggable: boolean
  declare editable: boolean
  declare contextMenu: boolean | ContextMenuOption
  declare toolBar: boolean
  declare keypress: boolean | KeypressOptions
  declare mouseSelectionButton: 0 | 2
  declare before: Before
  declare newTopicName: string
  declare allowUndo: boolean
  declare overflowHidden: boolean
  declare compact: boolean
  declare generateMainBranch: (this: MindElixirInstance, params: MainLineParams) => string
  declare generateSubBranch: (this: MindElixirInstance, params: SubLineParams) => string
  declare selectionContainer: string | HTMLElement
  declare alignment: Alignment
  declare scaleSensitivity: number
  declare scaleMin: number
  declare scaleMax: number
  declare handleWheel: true | ((e: WheelEvent) => void)
  declare pasteHandler: (e: ClipboardEvent) => void
  declare mobileMultiSelect: boolean

  // Methods mixed into the prototype via `Object.assign` (see ./methods).
  declare init: (this: MindElixirInstance, data: MindElixirData) => Error | undefined
  declare destroy: (this: Partial<MindElixirInstance>) => void
  declare enableMobileMultiSelect: (this: MindElixirInstance, enable: boolean) => void
  declare exportSvg: (this: MindElixirInstance, noForeignObject?: boolean, injectCss?: string) => Blob
  declare exportPng: (this: MindElixirInstance, noForeignObject?: boolean, injectCss?: string) => Promise<Blob | null>
  declare createSummary: (this: MindElixirInstance, options?: SummaryOptions) => void
  declare createSummaryFrom: (this: MindElixirInstance, summary: Omit<Summary, 'id'>) => void
  declare removeSummary: (this: MindElixirInstance, id: string) => void
  declare selectSummary: (this: MindElixirInstance, el: SummarySvg) => void
  declare unselectSummary: (this: MindElixirInstance) => void
  declare renderSummary: (this: MindElixirInstance) => void
  declare editSummary: (this: MindElixirInstance, el: SummarySvg) => void
  declare renderArrow: (this: MindElixirInstance) => void
  declare editArrowLabel: (this: MindElixirInstance, el: ArrowSvg) => void
  declare tidyArrow: (this: MindElixirInstance) => void
  declare createArrow: (this: MindElixirInstance, from: Topic, to: Topic, options?: ArrowOptions) => void
  declare createArrowFrom: (this: MindElixirInstance, arrow: Omit<Arrow, 'id'>) => void
  declare removeArrow: (this: MindElixirInstance, linkSvg?: ArrowSvg) => void
  declare selectArrow: (this: MindElixirInstance, link: ArrowSvg) => void
  declare unselectArrow: (this: MindElixirInstance) => void
  declare reshapeArrow: (this: MindElixirInstance, arrow: Arrow, patchData: Partial<Arrow>) => void
  declare rmSubline: (this: MindElixirInstance, tpc: Topic) => Promise<void>
  declare reshapeNode: (this: MindElixirInstance, tpc: Topic, patchData: Partial<NodeObj<unknown>>) => Promise<void>
  declare insertSibling: (
    this: MindElixirInstance,
    type: 'before' | 'after',
    el?: Topic | undefined,
    node?: NodeObj<unknown> | undefined
  ) => Promise<void>
  declare insertParent: (this: MindElixirInstance, el?: Topic | undefined, node?: NodeObj<unknown> | undefined) => Promise<void>
  declare addChild: (this: MindElixirInstance, el?: Topic | undefined, node?: NodeObj<unknown> | undefined) => Promise<void>
  declare copyNodes: (this: MindElixirInstance, tpcs: Topic[], to: Topic) => Promise<void>
  declare moveUpNode: (this: MindElixirInstance, el?: Topic | undefined) => Promise<void>
  declare moveDownNode: (this: MindElixirInstance, el?: Topic | undefined) => Promise<void>
  declare removeNodes: (this: MindElixirInstance, tpcs: Topic[]) => Promise<void>
  declare moveNodesIn: (this: MindElixirInstance, from: Topic[], to: Topic) => Promise<void>
  declare moveNodesBefore: (this: MindElixirInstance, from: Topic[], to: Topic) => Promise<void>
  declare moveNodesAfter: (this: MindElixirInstance, from: Topic[], to: Topic) => Promise<void>
  declare beginEdit: (this: MindElixirInstance, el?: Topic | undefined) => Promise<void>
  declare setNodeTopic: (this: MindElixirInstance, el: Topic, topic: string) => Promise<void>
  declare scrollIntoView: (this: MindElixirInstance, el: HTMLElement, forceCenter?: boolean) => void
  declare selectNode: (this: MindElixirInstance, tpc: Topic, isNewNode?: boolean, e?: MouseEvent) => void
  declare selectNodes: (this: MindElixirInstance, tpcs: Topic[]) => void
  declare unselectNodes: (this: MindElixirInstance, tpcs: Topic[]) => void
  declare clearSelection: (this: MindElixirInstance) => void
  declare stringifyData: (data: object) => string
  declare getDataString: (this: MindElixirInstance) => string
  declare getData: (this: MindElixirInstance) => MindElixirData
  declare enableEdit: (this: MindElixirInstance) => void
  declare disableEdit: (this: MindElixirInstance) => void
  declare scale: (this: MindElixirInstance, scaleVal: number, offset?: { x: number; y: number }) => void
  declare scaleFit: (this: MindElixirInstance) => void
  declare move: (this: MindElixirInstance, dx: number, dy: number, smooth?: boolean) => boolean
  declare toCenter: (this: MindElixirInstance) => void
  declare install: (this: MindElixirInstance, plugin: (instance: MindElixirInstance) => void) => void
  declare focusNode: (this: MindElixirInstance, el: Topic) => void
  declare cancelFocus: (this: MindElixirInstance) => void
  declare initLeft: (this: MindElixirInstance) => void
  declare initRight: (this: MindElixirInstance) => void
  declare initSide: (this: MindElixirInstance) => void
  declare initDown: (this: MindElixirInstance) => void
  declare expandNode: (this: MindElixirInstance, el: Topic, isExpand?: boolean) => void
  declare expandNodeAll: (this: MindElixirInstance, el: Topic, isExpand?: boolean) => void
  declare refresh: (this: MindElixirInstance, data?: MindElixirData) => void
  declare getObjById: (id: string, data: NodeObj) => NodeObj | null
  declare generateNewObj: (this: MindElixirInstance) => NodeObjExport
  declare layout: (this: MindElixirInstance) => void
  declare linkDiv: (this: MindElixirInstance, mainNode?: Wrapper) => void
  declare editTopic: (this: MindElixirInstance, el: Topic) => void
  declare createWrapper: (this: MindElixirInstance, nodeObj: NodeObj, omitChildren?: boolean) => { grp: Wrapper; top: Parent; tpc: Topic }
  declare createParent: (this: MindElixirInstance, nodeObj: NodeObj) => { p: Parent; tpc: Topic }
  declare createChildren: (this: MindElixirInstance, wrappers: Wrapper[]) => Children
  declare createTopic: (this: MindElixirInstance, nodeObj: NodeObj) => Topic
  declare findEle: (this: MindElixirInstance, id: string, el?: HTMLElement) => Topic
  declare changeTheme: (this: MindElixirInstance, theme: Theme, shouldRefresh?: boolean) => void
  declare changeCompact: (this: MindElixirInstance, compact: boolean) => void
  // #endregion GENERATED

  get currentNode(): Topic | null {
    return this.currentNodes[this.currentNodes.length - 1]
  }

  constructor({
    el,
    direction,
    editable,
    contextMenu,
    toolBar,
    keypress,
    mouseSelectionButton,
    selectionContainer,
    before,
    newTopicName,
    allowUndo,
    generateMainBranch,
    generateSubBranch,
    overflowHidden,
    compact,
    theme,
    alignment,
    scaleSensitivity,
    scaleMax,
    scaleMin,
    handleWheel,
    markdown,
    imageProxy,
    pasteHandler,
    mobileMultiSelect,
  }: Options) {
    let ele: HTMLElement | null = null
    const elType = Object.prototype.toString.call(el)
    if (elType === '[object HTMLDivElement]') {
      ele = el as HTMLElement
    } else if (elType === '[object String]') {
      ele = document.querySelector(el as string) as HTMLElement
    }
    if (!ele) throw new Error('MindElixir: el is not a valid element')

    ele.style.position = 'relative'
    ele.innerHTML = ''
    this.el = ele as HTMLElement
    this.disposable = []
    this.before = before || {}
    this.newTopicName = newTopicName || 'New Node'
    this.contextMenu = contextMenu ?? true
    this.toolBar = toolBar ?? true
    this.keypress = keypress ?? true
    this.mouseSelectionButton = mouseSelectionButton ?? 0
    this.direction = direction ?? 1
    this.editable = editable ?? true
    this.allowUndo = allowUndo ?? true
    this.scaleSensitivity = scaleSensitivity ?? 0.1
    this.scaleMax = scaleMax ?? 1.4
    this.scaleMin = scaleMin ?? 0.2
    this.generateMainBranch = generateMainBranch || main
    this.generateSubBranch = generateSubBranch || sub
    this.overflowHidden = overflowHidden ?? false
    this.compact = compact ?? false
    this.alignment = alignment ?? 'root'
    this.handleWheel = handleWheel ?? true
    this.markdown = markdown || undefined // Custom markdown parser function
    this.imageProxy = imageProxy || undefined // Image proxy function
    // this.parentMap = {} // deal with large amount of nodes
    this.currentNodes = [] // selected <tpc/> elements
    this.currentArrow = null // the selected link svg element
    this.scaleVal = 1
    this.tempDirection = null
    this.mobileMultiSelect = mobileMultiSelect ?? false

    this.panHelper = createPanHelper(this)
    this.bus = createBus()

    this.container = document.createElement('div') // map container
    this.selectionContainer = selectionContainer || this.container

    this.container.className = 'map-container'

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.theme = (theme || (mediaQuery.matches ? DARK_THEME : THEME)) as ResolvedTheme

    // infrastructure
    const canvas = document.createElement('div') // map-canvas Element
    canvas.className = 'map-canvas'
    this.map = canvas
    this.container.setAttribute('tabindex', '0')
    this.container.appendChild(this.map)
    this.el.appendChild(this.container)

    this.nodes = document.createElement('me-nodes')

    this.lines = createLinkSvg('lines') // main link container
    this.summarySvg = createLinkSvg('summary') // summary container

    this.linkController = createLinkSvg('linkcontroller') // bezier controller container
    this.P2 = document.createElement('div') // bezier P2
    this.P3 = document.createElement('div') // bezier P3
    this.P2.className = this.P3.className = 'circle'
    this.P2.style.display = this.P3.style.display = 'none'
    this.line1 = createLine() // bezier auxiliary line1
    this.line2 = createLine() // bezier auxiliary line2
    this.linkController.appendChild(this.line1)
    this.linkController.appendChild(this.line2)
    this.arrowSvg = createLinkSvg('topiclinks') // storage user custom link svg

    this.labelContainer = document.createElement('div') // container for SVG labels
    this.labelContainer.className = 'label-container'

    this.map.appendChild(this.nodes)

    if (this.overflowHidden) {
      this.container.style.overflow = 'hidden'
    } else {
      this.disposable.push(initMouseEvent(this))
    }

    if (pasteHandler) {
      this.pasteHandler = pasteHandler
    }
  }
}

Object.assign(MindElixir.prototype, methods)

// Compile-time guards keeping the declarations above exhaustive: if a method or
// resolved option exists on the source types but is not declared on the class,
// the corresponding `Exclude<...>` stops being `never` and this fails to build.
type _AssertNever<T extends never> = T
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _MethodsDeclared = _AssertNever<Exclude<keyof MindElixirMethods, keyof MindElixir>>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _OptionsDeclared = _AssertNever<Exclude<keyof ResolvedOptions, keyof MindElixir>>
// The generated fields must also stay signature-compatible with their source
// types (not just present). `_Extends` fails to build if any signature drifts;
// re-run `npm run gen:members` after changing ./methods or the Options type.
type _Extends<A extends B, B> = A
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _MethodsInSync = _Extends<Pick<MindElixir, keyof MindElixirMethods>, MindElixirMethods>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _OptionsInSync = _Extends<Pick<MindElixir, keyof ResolvedOptions>, ResolvedOptions>

export default MindElixir
export { LEFT, RIGHT, SIDE, DOWN, THEME, DARK_THEME } // bypass ssr error

// types
export type * from './utils/pubsub'
export type * from './types/index'
export type * from './types/dom'
