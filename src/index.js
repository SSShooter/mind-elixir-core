import {
  findEle,
  createInputDiv,
  addParentLink,
  createLinkSvg,
  createLine,
} from './util'
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
  enableEdit,
  disableEdit,
} from './interact'
import {
  insertSibling,
  addChild,
  moveNode,
  removeNode,
  moveUpNode,
  moveDownNode,
  beginEdit,
  updateNodeStyle,
  updateNodeTags,
  updateNodeIcons,
  processPrimaryNode,
} from './nodeOperation'
import {
  createLink,
  removeLink,
  selectLink,
  hideLinkController,
  showLinkController,
} from './linkOperation'
import { LEFT, RIGHT, SIDE } from './const'
import example from './example'
import layout from './layout'
import linkDiv from './linkDiv'
import initMouseEvent from './mouse'
import contextMenu from './pluginContextMenu'
import toolBar from './pluginToolBar'
import nodeMenu from './pluginNodeMenu'
import nodeDraggable from './pluginNodeDraggable'
import keypress from './pluginKeypress'
import Bus from './pubsub'
import './index.less'
import './pluginContextMenu.less'
import './pluginToolBar.less'
import './pluginNodeMenu.less'

import './iconfont/iconfont.js'

// TODO MindElixirLite
// TODO Link label

window.E = findEle
export let E = findEle

let $d = document
/** 
 * @class MindElixir 
 * @example 
 * let mind = new MindElixir({
  el: '#map',
  direction: 2,
  data: data,
  draggable: true,
  editable: true,
  contextMenu: true,
  toolBar: true,
  nodeMenu: true,
  keypress: true,
})
mind.init()
 *
 */
function MindElixir({
  el,
  data,
  direction,
  locale,
  draggable,
  editable,
  contextMenu,
  toolBar,
  nodeMenu,
  keypress,
}) {
  this.container = document.querySelector(el)
  this.history = [] // TODO

  this.nodeData = data.nodeData || {}
  this.linkData = data.linkData || {}
  this.locale = locale
  this.nodeDataBackup = this.nodeData // help reset focus mode
  this.contextMenu = contextMenu === undefined ? true : contextMenu
  this.toolBar = toolBar === undefined ? true : toolBar
  this.nodeMenu = nodeMenu === undefined ? true : nodeMenu
  this.keypress = keypress === undefined ? true : keypress
  // record the direction before enter focus mode, must true in focus mode, reset to null after exit focus
  this.direction = typeof direction === 'number' ? direction : 1
  window.mevar_draggable = draggable === undefined ? true : draggable
  this.editable = editable === undefined ? true : editable
  this.parentMap = {} // deprecate?

  this.currentNode = null // the selected <tpc/> element
  this.currentLink = null // the selected link svg element
  this.inputDiv = null // editor
  this.bus = new Bus()
  this.scaleVal = 1
  this.tempDir = null
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
}

MindElixir.prototype = {
  insertSibling,
  addChild,
  removeNode,
  moveNode,
  moveUpNode,
  moveDownNode,
  beginEdit,
  updateNodeStyle,
  updateNodeTags,
  updateNodeIcons,

  createLink,
  removeLink,
  selectLink,
  hideLinkController,
  showLinkController,

  layout,
  linkDiv,
  createInputDiv,
  processPrimaryNode,

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
  enableEdit,
  disableEdit,

  init: function() {
    this.container.className = 'map-container'
    this.container.innerHTML = ''
    this.map = $d.createElement('div') // map-canvas Element
    this.map.className = 'map-canvas'
    this.map.setAttribute('tabindex', '0')
    this.container.appendChild(this.map)
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
    this.contextMenu && contextMenu(this)
    this.toolBar && toolBar(this)
    this.nodeMenu && nodeMenu(this)
    this.keypress && keypress(this)
    window.mevar_draggable && nodeDraggable(this)

    this.toCenter()
    this.layout()
    this.linkDiv()

    initMouseEvent(this)

    // this.bus.addListener('operation', operation => {
    //   this.history = [operation]
    //   this.history = this.getAllData()
    // })
  },
}

MindElixir.LEFT = LEFT
MindElixir.RIGHT = RIGHT
MindElixir.SIDE = SIDE
/**
 * @memberof MindElixir
 * @static
 */
MindElixir.version = '0.9.1'
MindElixir.E = findEle
/**
 * @memberof MindElixir
 * @static
 * @description Example data help you try Mind-elxir quickly.
 */
MindElixir.example = example
/**
 * @function new
 * @memberof MindElixir
 * @static
 * @param {String} topic root topic
 */
MindElixir.new = topic => ({
  nodeData: {
    id: 'root',
    topic: topic || 'new topic',
    root: true,
    children: [],
  },
  linkData: {},
})

export default MindElixir
