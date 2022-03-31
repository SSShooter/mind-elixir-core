import { LEFT, RIGHT, SIDE } from './const'
import {
  isMobile,
  addParentLink,
  getObjById,
} from './utils/index'
import { findEle, layout, Topic, createChildren, createGroup, createTop, createTopic } from './utils/dom'
import { createLinkSvg, createLine } from './utils/svg'
import {
  selectNode,
  unselectNode,
  selectNextSibling,
  selectPrevSibling,
  selectFirstChild,
  selectParent,
  getAllDataString,
  getAllData,
  getAllDataMd,
  scale,
  toCenter,
  focusNode,
  cancelFocus,
  initLeft,
  initRight,
  initSide,
  setLocale,
  expandNode,
} from './interact'
import {
  processPrimaryNode,
  setNodeTopic,
} from './nodeOperation'
import {
  createLink,
} from './customLink'
import linkDiv from './linkDiv'
import initMouseEvent from './mouse'

import contextMenu from './plugin/contextMenu'
import toolBar from './plugin/toolBar'
import mobileMenu from './plugin/mobileMenu'

import Bus from './utils/pubsub'

import './index.less'
import './plugin/toolBar.less'
import './plugin/mobileMenu.less'

import './iconfont/iconfont.js'

export const E = findEle
type LinkObj = object
type operation = {
  name: string
}
export interface NodeObj {
  topic: string,
  id: string,
  style?: {
    fontSize?: string,
    color?: string,
    background?: string,
    fontWeight?: string
  },
  parent?: NodeObj,
  children?: NodeObj[],
  tags?: string[],
  icons?: string[],
  hyperLink?: string,
  expanded?: boolean,
  direction?: number,
  root?: boolean
}
export interface MindElixirData {
  nodeData: NodeObj,
  linkData?: LinkObj
}
export interface MindElixirInstance {
  mindElixirBox: HTMLElement,
  nodeData: NodeObj,
  linkData: LinkObj,
  currentNode: Topic | null,
  currentLink: SVGElement | null,
  inputDiv: HTMLElement | null,
  scaleVal: number,
  tempDirection: number | null,
  bus: object, // wip

  // wip
  history: operation[],
  isUndo: boolean,
  undo: () => void,

  direction: number,
  locale: string,
  draggable: boolean,
  editable: boolean,
  contextMenu: boolean,
  contextMenuOption: object,
  toolBar: boolean,
  nodeMenu: boolean,
  keypress: boolean,
  before: object,
  newTopicName: string,
  allowUndo: boolean,
  overflowHidden: boolean,
  primaryLinkStyle: number,
  primaryNodeHorizontalGap: number,
  primaryNodeVerticalGap: number,
  mobileMenu: boolean,

}
export interface Options {
  el: string,
  data: MindElixirData,
  direction?: number,
  locale?: string,
  draggable?: boolean,
  editable?: boolean,
  contextMenu?: boolean,
  contextMenuOption?: object,
  toolBar?: boolean,
  nodeMenu?: boolean,
  keypress?: boolean,
  before?: object,
  newTopicName?: string,
  allowUndo?: boolean,
  overflowHidden?: boolean,
  primaryLinkStyle?: number,
  primaryNodeHorizontalGap?: number,
  primaryNodeVerticalGap?: number,
  mobileMenu?: boolean,
}
const $d = document
function MindElixir(this: MindElixirInstance, {
  el,
  data,
  direction,
  locale,
  draggable,
  toolBar,
  keypress,
  newTopicName,
  primaryLinkStyle,
  overflowHidden,
  primaryNodeHorizontalGap,
  primaryNodeVerticalGap,
  mobileMenu,
}: Options) {
  const box = document.querySelector(el) as HTMLElement
  if (!box) return
  this.mindElixirBox = box
  this.nodeData = data.nodeData
  this.linkData = data.linkData || {}
  this.locale = locale
  this.toolBar = toolBar === undefined ? true : toolBar
  this.keypress = keypress === undefined ? true : keypress
  this.mobileMenu = mobileMenu
  // record the direction before enter focus mode, must true in focus mode, reset to null after exit focus
  // todo move direction to data
  this.direction = typeof direction === 'number' ? direction : 1
  this.draggable = draggable === undefined ? true : draggable
  this.newTopicName = newTopicName
  this.editable = false
  // this.parentMap = {} // deal with large amount of nodes
  this.currentNode = null // the selected <tpc/> element
  this.currentLink = null // the selected link svg element
  this.inputDiv = null // editor
  this.scaleVal = 1
  this.tempDirection = null
  this.primaryLinkStyle = primaryLinkStyle || 0
  this.overflowHidden = overflowHidden
  this.primaryNodeHorizontalGap = primaryNodeHorizontalGap
  this.primaryNodeVerticalGap = primaryNodeVerticalGap

  this.bus = new Bus()
  ;(this.bus as any).addListener('operation', (operation: operation) => {
    if (this.isUndo) {
      this.isUndo = false
      return
    }
    if (
      ['moveNode', 'removeNode', 'addChild', 'finishEdit', 'editStyle', 'editTags', 'editIcons'].includes(
        operation.name
      )
    ) {
      this.history.push(operation)
      // console.log(operation, this.history)
    }
  })
}

MindElixir.prototype = {
  addParentLink,
  getObjById,
  // node operation
  processPrimaryNode,
  setNodeTopic,
  createLink,
  layout,
  linkDiv,

  createChildren, createGroup, createTop, createTopic,

  selectNode,
  unselectNode,
  selectNextSibling,
  selectPrevSibling,
  selectFirstChild,
  selectParent,
  getAllDataString,
  getAllData,
  getAllDataMd,
  scale,
  toCenter,
  focusNode,
  cancelFocus,
  initLeft,
  initRight,
  initSide,
  setLocale,
  expandNode,

  init: function() {
    /**
     * @function
     * @global
     * @name E
     * @param {string} id Node id.
     * @return {TargetElement} Target element.
     * @example
     * E('bd4313fbac40284b')
     */
    addParentLink(this.nodeData)
    console.log('ME_version ' + MindElixir.version)
    this.mindElixirBox.className += ' mind-elixir'
    this.mindElixirBox.innerHTML = ''

    this.container = $d.createElement('div') // map container
    this.container.className = 'map-container'

    if (this.overflowHidden) this.container.style.overflow = 'hidden'

    this.map = $d.createElement('div') // map-canvas Element
    this.map.className = 'map-canvas'
    this.map.setAttribute('tabindex', '0')
    this.container.appendChild(this.map)
    this.mindElixirBox.appendChild(this.container)
    this.root = $d.createElement('root')

    this.box = $d.createElement('children')
    this.box.className = 'box'

    // infrastructure

    this.svg2nd = createLinkSvg('svg2nd') // main link container

    this.linkController = createLinkSvg('linkcontroller') // bezier controller container
    this.P2 = $d.createElement('div') // bezier P2
    this.P3 = $d.createElement('div') // bezier P3
    this.P2.className = this.P3.className = 'circle'
    this.line1 = createLine(0, 0, 0, 0) // bezier auxiliary line1
    this.line2 = createLine(0, 0, 0, 0) // bezier auxiliary line2
    this.linkController.appendChild(this.line1)
    this.linkController.appendChild(this.line2)

    this.linkSvgGroup = createLinkSvg('topiclinks') // storage user custom link svg

    this.map.appendChild(this.root)
    this.map.appendChild(this.box)
    this.map.appendChild(this.svg2nd)
    this.map.appendChild(this.linkController)
    this.map.appendChild(this.linkSvgGroup)
    this.map.appendChild(this.P2)
    this.map.appendChild(this.P3)

    // plugin
    this.toolBar && toolBar(this)

    if (isMobile() && this.mobileMenu) {
      mobileMenu(this)
    } else {
      this.contextMenu && contextMenu(this, this.contextMenuOption)
    }

    this.toCenter()
    this.layout()
    this.linkDiv()
    if (!this.overflowHidden) initMouseEvent(this)
  },
}

MindElixir.LEFT = LEFT
MindElixir.RIGHT = RIGHT
MindElixir.SIDE = SIDE
/**
 * @memberof MindElixir
 * @static
 */
MindElixir.version = '0.17.0'
MindElixir.E = findEle

export default MindElixir
