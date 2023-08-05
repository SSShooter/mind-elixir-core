import { LEFT, RIGHT, SIDE, GAP, DARK_THEME, THEME } from './const'
import { isMobile, fillParent, getObjById, generateUUID, generateNewObj } from './utils/index'
import { findEle, createInputDiv, createWrapper, createParent, createChildren, createTopic } from './utils/dom'
import { layout, layoutChildren } from './utils/layout'
import { createLinkSvg, createLine } from './utils/svg'
import * as interact from './interact'
import * as nodeOperation from './nodeOperation'
import { createLink, removeLink, selectLink, hideLinkController, showLinkController } from './customLink'
import linkDiv from './linkDiv'
import initMouseEvent from './mouse'

import contextMenu from './plugin/contextMenu'
import toolBar from './plugin/toolBar'
import nodeDraggable from './plugin/nodeDraggable'
import keypress from './plugin/keypress'
import mobileMenu from './plugin/mobileMenu'
import operationHistory from './plugin/operationHistory'

import Bus from './utils/pubsub'

import './index.less'
import './iconfont/iconfont.js'
import type { MindElixirData, MindElixirInstance, Options } from './types/index'
import type { Children } from './types/dom'
import { changeTheme } from './utils/theme'
import beforeHook from './utils/beforeHook'

export * from './types/index'

// TODO show up animation
const $d = document
/**
 * @export MindElixir
 * @example
 * let mind = new MindElixir({
  el: '#map',
  direction: 2,
  data: data,
  draggable: true,
  editable: true,
  contextMenu: true,
  toolBar: true, 
  keypress: true,
})
mind.init()
 *
 */
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

  const bus = Bus.create()
  this.bus = bus

  this.container = $d.createElement('div') // map container
  this.container.className = 'map-container'

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  this.theme = theme || (mediaQuery.matches ? DARK_THEME : THEME)

  const canvas = $d.createElement('div') // map-canvas Element
  canvas.className = 'map-canvas'
  this.map = canvas
  this.map.setAttribute('tabindex', '0')
  this.container.appendChild(this.map)
  this.mindElixirBox.appendChild(this.container)

  this.nodes = $d.createElement('me-nodes') as Children
  this.nodes.className = 'main-node-container'

  // infrastructure

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

type NodeOperation = Partial<Record<keyof typeof nodeOperation, ReturnType<typeof beforeHook>>>
const operations = Object.keys(nodeOperation) as Array<keyof typeof nodeOperation>
const nodeOperationHooked: NodeOperation = {}
if (import.meta.env.MODE !== 'lite') {
  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i]
    nodeOperationHooked[operation] = beforeHook(nodeOperation[operation], operation)
  }
}

MindElixir.prototype = {
  getObjById,
  generateNewObj,
  ...nodeOperationHooked,

  createLink,
  removeLink,
  selectLink,
  hideLinkController,
  showLinkController,

  layout,
  linkDiv,
  createInputDiv,

  layoutChildren,
  createWrapper,
  createParent,
  createChildren,
  createTopic,

  ...interact,
  findEle,

  changeTheme,
  init(this: MindElixirInstance, data: MindElixirData) {
    if (!data || !data.nodeData) return new Error('MindElixir: `data` is required')
    if (data.direction !== undefined) {
      this.direction = data.direction
    }
    this.changeTheme(data.theme || this.theme, false)
    this.nodeData = data.nodeData
    fillParent(this.nodeData)
    this.linkData = data.linkData || {}
    // plugins
    this.toolBar && toolBar(this)
    if (import.meta.env.MODE !== 'lite') {
      this.keypress && keypress(this)

      if (isMobile() && this.mobileMenu) {
        mobileMenu(this)
      } else {
        this.contextMenu && contextMenu(this, this.contextMenuOption)
      }
      this.draggable && nodeDraggable(this)
      this.allowUndo && operationHistory(this)
    }
    this.toCenter()
    this.layout()
    this.linkDiv()
  },
}

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

interface MindElixirCtor {
  new (options: Options): MindElixirInstance
  E: typeof findEle
  new: typeof MindElixir.new
  version: string
  LEFT: typeof LEFT
  RIGHT: typeof RIGHT
  SIDE: typeof SIDE
  THEME: typeof THEME
  DARK_THEME: typeof DARK_THEME
}

export default MindElixir as unknown as MindElixirCtor
