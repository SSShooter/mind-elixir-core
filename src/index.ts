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

type ResolvedTheme<M> = Omit<Theme<M>, 'cssVar'> & { cssVar: ThemeCssVar }

// Resolved constructor input that lives on the instance (the four excluded
// members are refined on the class below).
type ResolvedOptions<M> = Omit<Required<Options<M>>, 'el' | 'theme' | 'markdown' | 'imageProxy'>

// The class is the single canonical owner of the instance shape. Instead of a
// same-name `interface MindElixir` declaration merge (which produces a second
// API item that collides onto the same API Documenter page and hides the class
// members), the resolved options and the prototype-mixed methods are declared
// directly on the class. `Object.assign` attaches the implementations at
// runtime, and the `_Assert*` guards below keep these declarations exhaustive.
class MindElixir<M = any> {
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
  static new = <M = unknown>(topic: string): MindElixirData<M> => ({
    nodeData: {
      id: generateUUID(),
      topic: topic || 'new topic',
      children: [],
    },
  })

  // Options refined/overridden on the instance. The remaining resolved options
  // are contributed by the merged `interface MindElixir extends Options` below.
  declare el: HTMLElement
  declare theme: ResolvedTheme<M>
  declare markdown?: (markdown: string, obj: NodeObj<M> | Arrow<M> | Summary) => string
  declare imageProxy?: (url: string) => string

  // Runtime state
  declare disposable: Array<() => void>
  declare dragged: Topic<M>[] | null // currently dragged nodes
  declare spacePressed: boolean // space key pressed state
  declare isFocusMode: boolean
  declare nodeDataBackup: NodeObj<M>
  declare nodeData: NodeObj<M>
  declare arrows: Arrow<M>[]
  declare summaries: Summary[]
  declare currentNodes: Topic<M>[]
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
  declare generateMainBranch: (this: MindElixir<M>, params: MainLineParams) => string
  declare generateSubBranch: (this: MindElixir<M>, params: SubLineParams) => string
  declare selectionContainer: string | HTMLElement
  declare alignment: Alignment
  declare scaleSensitivity: number
  declare scaleMin: number
  declare scaleMax: number
  declare handleWheel: true | ((e: WheelEvent) => void)
  declare pasteHandler: (e: ClipboardEvent) => void
  declare mobileMultiSelect: boolean

  // Methods mixed into the prototype via `Object.assign` (see ./methods).
  declare init: (this: MindElixir<M>, data: MindElixirData<M>) => Error | undefined
  declare destroy: (this: Partial<MindElixir<M>>) => void
  declare enableMobileMultiSelect: (this: MindElixir<M>, enable: boolean) => void
  declare exportSvg: (this: MindElixir<M>, noForeignObject?: boolean, injectCss?: string) => Blob
  declare exportPng: (this: MindElixir<M>, noForeignObject?: boolean, injectCss?: string) => Promise<Blob | null>
  declare createSummary: (this: MindElixir<M>, options?: SummaryOptions) => void
  declare createSummaryFrom: (this: MindElixir<M>, summary: Omit<Summary, "id">) => void
  declare removeSummary: (this: MindElixir<M>, id: string) => void
  declare selectSummary: (this: MindElixir<M>, el: SummarySvg) => void
  declare unselectSummary: (this: MindElixir<M>) => void
  declare renderSummary: (this: MindElixir<M>) => void
  declare editSummary: (this: MindElixir<M>, el: SummarySvg) => void
  declare renderArrow: (this: MindElixir<M>) => void
  declare editArrowLabel: (this: MindElixir<M>, el: ArrowSvg) => void
  declare tidyArrow: (this: MindElixir<M>) => void
  declare createArrow: (this: MindElixir<M>, from: Topic<M>, to: Topic<M>, options?: ArrowOptions) => void
  declare createArrowFrom: (this: MindElixir<M>, arrow: Omit<Arrow<M>, "id">) => void
  declare removeArrow: (this: MindElixir<M>, linkSvg?: ArrowSvg) => void
  declare selectArrow: (this: MindElixir<M>, link: ArrowSvg) => void
  declare unselectArrow: (this: MindElixir<M>) => void
  declare reshapeArrow: (this: MindElixir<M>, arrow: Arrow<M>, patchData: Partial<Arrow<M>>) => void
  declare rmSubline: (this: MindElixir<M>, tpc: Topic<M>) => Promise<void>
  declare reshapeNode: (this: MindElixir<M>, tpc: Topic<M>, patchData: Partial<NodeObj<M>>) => Promise<void>
  declare insertSibling: (this: MindElixir<M>, type: "before" | "after", el?: Topic<M> | undefined, node?: NodeObj<M> | undefined) => Promise<void>
  declare insertParent: (this: MindElixir<M>, el?: Topic<M> | undefined, node?: NodeObj<M> | undefined) => Promise<void>
  declare addChild: (this: MindElixir<M>, el?: Topic<M> | undefined, node?: NodeObj<M> | undefined) => Promise<void>
  declare copyNodes: (this: MindElixir<M>, tpcs: Topic<M>[], to: Topic<M>) => Promise<void>
  declare moveUpNode: (this: MindElixir<M>, el?: Topic<M> | undefined) => Promise<void>
  declare moveDownNode: (this: MindElixir<M>, el?: Topic<M> | undefined) => Promise<void>
  declare removeNodes: (this: MindElixir<M>, tpcs: Topic<M>[]) => Promise<void>
  declare moveNodesIn: (this: MindElixir<M>, from: Topic<M>[], to: Topic<M>) => Promise<void>
  declare moveNodesBefore: (this: MindElixir<M>, from: Topic<M>[], to: Topic<M>) => Promise<void>
  declare moveNodesAfter: (this: MindElixir<M>, from: Topic<M>[], to: Topic<M>) => Promise<void>
  declare beginEdit: (this: MindElixir<M>, el?: Topic<M> | undefined) => Promise<void>
  declare setNodeTopic: (this: MindElixir<M>, el: Topic<M>, topic: string) => Promise<void>
  declare scrollIntoView: (this: MindElixir<M>, el: HTMLElement, forceCenter?: boolean) => void
  declare selectNode: (this: MindElixir<M>, tpc: Topic<M>, isNewNode?: boolean, e?: MouseEvent) => void
  declare selectNodes: (this: MindElixir<M>, tpcs: Topic<M>[]) => void
  declare unselectNodes: (this: MindElixir<M>, tpcs: Topic<M>[]) => void
  declare clearSelection: (this: MindElixir<M>) => void
  declare stringifyData: (data: object) => string
  declare getDataString: (this: MindElixir<M>) => string
  declare getData: (this: MindElixir<M>) => MindElixirData<M>
  declare enableEdit: (this: MindElixir<M>) => void
  declare disableEdit: (this: MindElixir<M>) => void
  declare scale: (this: MindElixir<M>, scaleVal: number, offset?: { x: number; y: number; }) => void
  declare scaleFit: (this: MindElixir<M>) => void
  declare move: (this: MindElixir<M>, dx: number, dy: number, smooth?: boolean) => boolean
  declare toCenter: (this: MindElixir<M>) => void
  declare install: (this: MindElixir<M>, plugin: (instance: MindElixir<M>) => void) => void
  declare focusNode: (this: MindElixir<M>, el: Topic<M>) => void
  declare cancelFocus: (this: MindElixir<M>) => void
  declare initLeft: (this: MindElixir<M>) => void
  declare initRight: (this: MindElixir<M>) => void
  declare initSide: (this: MindElixir<M>) => void
  declare initDown: (this: MindElixir<M>) => void
  declare expandNode: (this: MindElixir<M>, el: Topic<M>, isExpand?: boolean) => void
  declare expandNodeAll: (this: MindElixir<M>, el: Topic<M>, isExpand?: boolean) => void
  declare refresh: (this: MindElixir<M>, data?: MindElixirData<M>) => void
  declare getObjById: (id: string, data: NodeObj<M>) => NodeObj<M> | null
  declare generateNewObj: (this: MindElixir<M>) => NodeObjExport<M>
  declare layout: (this: MindElixir<M>) => void
  declare linkDiv: (this: MindElixir<M>, mainNode?: Wrapper) => void
  declare editTopic: (this: MindElixir<M>, el: Topic<M>) => void
  declare createWrapper: (this: MindElixir<M>, nodeObj: NodeObj<M>, omitChildren?: boolean) => { grp: Wrapper; top: Parent; tpc: Topic<M>; }
  declare createParent: (this: MindElixir<M>, nodeObj: NodeObj<M>) => { p: Parent; tpc: Topic<M>; }
  declare createChildren: (this: MindElixir<M>, wrappers: Wrapper[]) => Children
  declare createTopic: (this: MindElixir<M>, nodeObj: NodeObj<M>) => Topic<M>
  declare findEle: (this: MindElixir<M>, id: string, el?: HTMLElement) => Topic<M>
  declare changeTheme: (this: MindElixir<M>, theme: Theme<M>, shouldRefresh?: boolean) => void
  declare changeCompact: (this: MindElixir<M>, compact: boolean) => void
  // #endregion GENERATED

  get currentNode(): Topic<M> | null {
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
  }: Options<M>) {
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
    this.theme = (theme || (mediaQuery.matches ? DARK_THEME : THEME)) as ResolvedTheme<M>

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
type _OptionsDeclared<M> = _AssertNever<Exclude<keyof ResolvedOptions<M>, keyof MindElixir<M>>>
// The generated fields must also stay signature-compatible with their source
// types (not just present). `_Extends` fails to build if any signature drifts;
// re-run `npm run gen:members` after changing ./methods or the Options type.
type _Extends<A extends B, B> = A
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _MethodsInSync = _Extends<Pick<MindElixir, keyof MindElixirMethods>, MindElixirMethods>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _OptionsInSync<M> = _Extends<Pick<MindElixir<M>, keyof ResolvedOptions<M>>, ResolvedOptions<M>>

export default MindElixir
export { LEFT, RIGHT, SIDE, DOWN, THEME, DARK_THEME } // bypass ssr error

// types
export type * from './utils/pubsub'
export type * from './types/index'
export type * from './types/dom'
