import './index.less'
import { LEFT, RIGHT, SIDE, DARK_THEME, THEME } from './const'
import { generateUUID } from './utils/index'
import initMouseEvent from './mouse'
import { createBus } from './utils/pubsub'
import { findEle } from './utils/dom'
import { createLinkSvg, createLine } from './utils/svg'
import type { MindElixirData, MindElixirInstance, MindElixirMethods, Options } from './types/index'
import methods from './methods'
import { sub, main } from './utils/generateBranch'
// @ts-expect-error json file
import { version } from '../package.json'
import { createDragMoveHelper } from './utils/dragMoveHelper'
import type { Topic } from './docs'

// TODO show up animation
const $d = document

function MindElixir(
  this: MindElixirInstance,
  {
    el,
    direction,
    locale,
    draggable,
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
    theme,
    alignment,
    scaleSensitivity,
    scaleMax,
    scaleMin,
    handleWheel,
    markdown,
    imageProxy,
    selectionDisabled,
    dragBoundPadding,
  }: Options
): void {
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
  this.locale = locale || 'en'
  this.newTopicName = newTopicName || 'New Node'
  this.contextMenu = contextMenu ?? true
  this.toolBar = toolBar ?? true
  this.keypress = keypress ?? true
  this.mouseSelectionButton = mouseSelectionButton ?? 0
  this.direction = direction ?? 1
  this.draggable = draggable ?? true
  this.editable = editable ?? true
  this.allowUndo = allowUndo ?? true
  this.scaleSensitivity = scaleSensitivity ?? 0.1
  this.scaleMax = scaleMax ?? 1.4
  this.scaleMin = scaleMin ?? 0.2
  this.generateMainBranch = generateMainBranch || main
  this.generateSubBranch = generateSubBranch || sub
  this.overflowHidden = overflowHidden ?? false
  this.alignment = alignment ?? 'root'
  this.handleWheel = handleWheel ?? true
  this.markdown = markdown || undefined // Custom markdown parser function
  this.imageProxy = imageProxy || undefined // Image proxy function
  this.selectionDisabled = selectionDisabled ?? false
  // this.parentMap = {} // deal with large amount of nodes
  this.currentNodes = [] // selected <tpc/> elements
  this.currentArrow = null // the selected link svg element
  this.scaleVal = 1
  this.tempDirection = null

  this.dragMoveHelper = createDragMoveHelper(this)
  this.bus = createBus()

  this.container = $d.createElement('div') // map container
  this.selectionContainer = selectionContainer || this.container

  this.container.className = 'map-container'

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  this.theme = theme || (mediaQuery.matches ? DARK_THEME : THEME)

  // infrastructure
  const canvas = $d.createElement('div') // map-canvas Element
  canvas.className = 'map-canvas'
  this.map = canvas
  this.container.setAttribute('tabindex', '0')
  this.container.appendChild(this.map)
  this.el.appendChild(this.container)

  this.nodes = $d.createElement('me-nodes')

  this.lines = createLinkSvg('lines') // main link container
  this.summarySvg = createLinkSvg('summary') // summary container

  this.linkController = createLinkSvg('linkcontroller') // bezier controller container
  this.P2 = $d.createElement('div') // bezier P2
  this.P3 = $d.createElement('div') // bezier P3
  this.P2.className = this.P3.className = 'circle'
  this.P2.style.display = this.P3.style.display = 'none'
  this.line1 = createLine() // bezier auxiliary line1
  this.line2 = createLine() // bezier auxiliary line2
  this.linkController.appendChild(this.line1)
  this.linkController.appendChild(this.line2)
  this.linkSvgGroup = createLinkSvg('topiclinks') // storage user custom link svg

  this.map.appendChild(this.nodes)

  if (this.overflowHidden) {
    this.container.style.overflow = 'hidden'
  } else {
    this.disposable.push(initMouseEvent(this))
  }
}

MindElixir.prototype = methods

Object.defineProperty(MindElixir.prototype, 'currentNode', {
  get() {
    return this.currentNodes[this.currentNodes.length - 1]
  },
  enumerable: true,
})

MindElixir.LEFT = LEFT
MindElixir.RIGHT = RIGHT
MindElixir.SIDE = SIDE

MindElixir.THEME = THEME
MindElixir.DARK_THEME = DARK_THEME

/**
 * @memberof MindElixir
 * @static
 */
MindElixir.version = version
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
MindElixir.E = findEle

/**
 * @function new
 * @memberof MindElixir
 * @static
 * @param {String} topic root topic
 */
if (import.meta.env.MODE !== 'lite') {
  MindElixir.new = (topic: string): MindElixirData => ({
    nodeData: {
      id: generateUUID(),
      topic: topic || 'new topic',
      children: [],
    },
  })
}

export interface MindElixirCtor {
  new (options: Options): MindElixirInstance
  E: (id: string, el?: HTMLElement) => Topic
  new: typeof MindElixir.new
  version: string
  LEFT: typeof LEFT
  RIGHT: typeof RIGHT
  SIDE: typeof SIDE
  THEME: typeof THEME
  DARK_THEME: typeof DARK_THEME
  prototype: MindElixirMethods
}

export default MindElixir as unknown as MindElixirCtor

// types
export type * from './utils/pubsub'
export type * from './types/index'
export type * from './types/dom'
