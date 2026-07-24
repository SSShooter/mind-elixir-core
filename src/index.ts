import './index.less'
import './markdown.css'
import { LEFT, RIGHT, SIDE, DOWN, DARK_THEME, THEME } from './const'
import { generateUUID } from './utils/index'
import initMouseEvent from './mouse'
import { createBus } from './utils/pubsub'
import { findEle } from './utils/dom'
import { createLinkSvg, createLine } from './utils/svg'
import type { MindElixirData, MindElixirMethods, Options, Theme, ThemeCssVar, NodeObj } from './types/index'
import type { Topic, ArrowSvg, SummarySvg } from './types/dom'
import type { Arrow } from './arrow'
import type { Summary } from './summary'
import type { LinkPanHelperInstance } from './utils/LinkPanHelper'
import type { EventMap, Operation } from './utils/pubsub'
import type SelectionArea from './viselect/src'
import methods from './methods'
import { sub, main } from './utils/generateBranch'
import { version } from '../package.json'
import { createPanHelper } from './utils/panHelper'

// TODO show up animation

type ResolvedTheme = Omit<Theme, 'cssVar'> & { cssVar: ThemeCssVar }

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

// The class owns its instance shape. The two things that legitimately come from
// elsewhere are composed via declaration merging:
// - resolved constructor input (`Options`, minus the members refined above)
// - behavior mixed into the prototype via `Object.assign` (`MindElixirMethods`)
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface MindElixir extends Omit<Required<Options>, 'el' | 'theme' | 'markdown' | 'imageProxy'>, MindElixirMethods {}

Object.assign(MindElixir.prototype, methods)

export default MindElixir
export { LEFT, RIGHT, SIDE, DOWN, THEME, DARK_THEME } // bypass ssr error

// types
export type * from './utils/pubsub'
export type * from './types/index'
export type * from './types/dom'
