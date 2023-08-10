import './index.less'
import './iconfont/iconfont.js'
import { LEFT, RIGHT, SIDE, GAP, DARK_THEME, THEME } from './const'
import { generateUUID } from './utils/index'
import initMouseEvent from './mouse'
import Bus from './utils/pubsub'
import { findEle } from './utils/dom'
import { createLinkSvg, createLine } from './utils/svg'
// types
export * from './types/index'
import type { MindElixirData, MindElixirInstance, MindElixirMethods, Options } from './types/index'
import methods from './methods'

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
    contextMenuOption,
    toolBar,
    keypress,
    before,
    newTopicName,
    allowUndo,
    mainLinkStyle,
    subLinkStyle,
    overflowHidden,
    mobileMenu,
    theme,
  }: Options
): void {
  console.log('ME_version ' + MindElixir.version, this)
  let ele: HTMLElement | null = null
  const elType = Object.prototype.toString.call(el)
  if (elType === '[object HTMLDivElement]') {
    ele = el as HTMLElement
  } else if (elType === '[object String]') {
    ele = document.querySelector(el as string) as HTMLElement
  }
  if (!ele) throw new Error('MindElixir: el is not a valid element')

  ele.className += ' mind-elixir'
  ele.innerHTML = ''
  ele.style.setProperty('--gap', GAP + 'px')
  this.mindElixirBox = ele as HTMLElement
  this.before = before || {}
  this.locale = locale || 'en'
  this.contextMenuOption = contextMenuOption
  this.contextMenu = contextMenu === undefined ? true : contextMenu
  this.toolBar = toolBar === undefined ? true : toolBar
  this.keypress = keypress === undefined ? true : keypress
  this.mobileMenu = mobileMenu || false
  // record the direction before enter focus mode, must true in focus mode, reset to null after exit focus
  this.direction = typeof direction === 'number' ? direction : 1
  this.draggable = draggable === undefined ? true : draggable
  this.newTopicName = newTopicName || 'new node'
  this.editable = editable === undefined ? true : editable
  this.allowUndo = allowUndo === undefined ? false : allowUndo
  // this.parentMap = {} // deal with large amount of nodes
  this.currentNode = null // the selected <tpc/> element
  this.currentLink = null // the selected link svg element
  this.inputDiv = null // editor
  this.scaleVal = 1
  this.tempDirection = null
  this.mainLinkStyle = mainLinkStyle || 0
  this.subLinkStyle = subLinkStyle || 0
  this.overflowHidden = overflowHidden || false

  this.bus = Bus.create()

  this.container = $d.createElement('div') // map container
  this.container.className = 'map-container'

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  this.theme = theme || (mediaQuery.matches ? DARK_THEME : THEME)

  // infrastructure
  const canvas = $d.createElement('div') // map-canvas Element
  canvas.className = 'map-canvas'
  this.map = canvas
  this.map.setAttribute('tabindex', '0')
  this.container.appendChild(this.map)
  this.mindElixirBox.appendChild(this.container)

  this.nodes = $d.createElement('me-nodes')
  this.nodes.className = 'main-node-container'

  this.lines = createLinkSvg('lines') // main link container

  this.linkController = createLinkSvg('linkcontroller') // bezier controller container
  this.P2 = $d.createElement('div') // bezier P2
  this.P3 = $d.createElement('div') // bezier P3
  this.P2.className = this.P3.className = 'circle'
  this.P2.style.display = this.P3.style.display = 'none'
  this.line1 = createLine(0, 0, 0, 0) // bezier auxiliary line1
  this.line2 = createLine(0, 0, 0, 0) // bezier auxiliary line2
  this.linkController.appendChild(this.line1)
  this.linkController.appendChild(this.line2)
  this.linkSvgGroup = createLinkSvg('topiclinks') // storage user custom link svg

  this.map.appendChild(this.nodes)
  this.map.appendChild(this.linkController)
  this.map.appendChild(this.linkSvgGroup)
  this.map.appendChild(this.P2)
  this.map.appendChild(this.P3)

  if (this.overflowHidden) {
    this.container.style.overflow = 'hidden'
  } else initMouseEvent(this)
}

MindElixir.prototype = methods

MindElixir.LEFT = LEFT
MindElixir.RIGHT = RIGHT
MindElixir.SIDE = SIDE

MindElixir.THEME = THEME
MindElixir.DARK_THEME = DARK_THEME

/**
 * @memberof MindElixir
 * @static
 */
MindElixir.version = '2.1.0'
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
      root: true,
      children: [],
    },
    linkData: {},
  })
}

export interface MindElixirCtor {
  new (options: Options): MindElixirInstance
  E: typeof findEle
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
