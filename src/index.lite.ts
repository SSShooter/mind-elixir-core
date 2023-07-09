import { LEFT, MAIN_NODE_HORIZONTAL_GAP, MAIN_NODE_VERTICAL_GAP, RIGHT, SIDE, THEME } from './const'
import { isMobile, fillParent, getObjById } from './utils/index'
import { findEle, createWrapper, createParent, createTopic } from './utils/dom'
import { layout, layoutChildren, judgeDirection } from './utils/layout'
import { createLinkSvg, createLine } from './utils/svg'
import {
  selectNode,
  unselectNode,
  selectNextSibling,
  selectPrevSibling,
  selectFirstChild,
  selectParent,
  getDataString,
  getData,
  getDataMd,
  scale,
  toCenter,
  focusNode,
  cancelFocus,
  initLeft,
  initRight,
  initSide,
  setLocale,
  expandNode,
  refresh,
} from './interact'
import { setNodeTopic } from './nodeOperation'
import { createLink } from './customLink'
import linkDiv from './linkDiv'
import initMouseEvent from './mouse'
import contextMenu from './plugin/contextMenu'
import toolBar from './plugin/toolBar'
import mobileMenu from './plugin/mobileMenu'
import Bus from './utils/pubsub'
import './index.less'
import './iconfont/iconfont.js'
import type { Children } from './types/dom'
import type { MindElixirInstance, Options, MindElixirData } from './types/index'

export const E = findEle

const $d = document
function MindElixir(
  this: MindElixirInstance,
  { el, direction, toolBar, keypress, newTopicName, mainLinkStyle, overflowHidden, mainNodeHorizontalGap, mainNodeVerticalGap, mobileMenu }: Options
) {
  let box
  const elType = Object.prototype.toString.call(el)
  if (elType === '[object HTMLDivElement]') {
    box = el as HTMLElement
  } else if (elType === '[object String]') {
    box = document.querySelector(el as string) as HTMLElement
  }
  if (!box) return new Error('MindElixir: el is not a valid element')
  this.mindElixirBox = box
  this.toolBar = toolBar === undefined ? true : toolBar
  this.keypress = keypress === undefined ? true : keypress
  this.mobileMenu = mobileMenu || false
  // record the direction before enter focus mode, must true in focus mode, reset to null after exit focus
  // todo move direction to data
  this.direction = typeof direction === 'number' ? direction : 1
  this.draggable = false
  this.newTopicName = newTopicName || 'new node'
  this.editable = false
  // this.parentMap = {} // deal with large amount of nodes
  this.currentNode = null // the selected <tpc/> element
  this.currentLink = null // the selected link svg element
  this.inputDiv = null // editor
  this.scaleVal = 1
  this.tempDirection = null
  this.mainLinkStyle = mainLinkStyle || 0
  this.overflowHidden = overflowHidden || false
  this.mainNodeHorizontalGap = mainNodeHorizontalGap || MAIN_NODE_HORIZONTAL_GAP
  this.mainNodeVerticalGap = mainNodeVerticalGap || MAIN_NODE_VERTICAL_GAP

  this.bus = Bus.create()

  console.log('ME_version ' + MindElixir.version)
  this.mindElixirBox.className += ' mind-elixir'
  this.mindElixirBox.innerHTML = ''

  this.container = $d.createElement('div') // map container
  this.container.className = 'map-container'

  if (this.overflowHidden) this.container.style.overflow = 'hidden'

  this.map = $d.createElement('div') // map-canvas Element
  this.map.className = 'map-canvas'
  this.theme = THEME
  this.map.setAttribute('tabindex', '0')
  this.container.appendChild(this.map)
  this.mindElixirBox.appendChild(this.container)
  this.root = $d.createElement('me-root')

  this.mainNodes = $d.createElement('me-children') as Children
  this.mainNodes.className = 'box'

  // infrastructure

  this.lines = createLinkSvg('lines') // main link container

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
  this.map.appendChild(this.mainNodes)
  this.map.appendChild(this.lines)
  this.map.appendChild(this.linkController)
  this.map.appendChild(this.linkSvgGroup)
  this.map.appendChild(this.P2)
  this.map.appendChild(this.P3)

  if (this.overflowHidden) {
    this.container.style.overflow = 'hidden'
  } else initMouseEvent(this)
}

MindElixir.prototype = {
  fillParent,
  getObjById,
  // node operation
  judgeDirection,
  setNodeTopic,
  createLink,
  layout,
  linkDiv,

  layoutChildren,
  createWrapper,
  createParent,
  createTopic,

  selectNode,
  unselectNode,
  selectNextSibling,
  selectPrevSibling,
  selectFirstChild,
  selectParent,
  getDataString,
  getData,
  getDataMd,
  scale,
  toCenter,
  focusNode,
  cancelFocus,
  initLeft,
  initRight,
  initSide,
  setLocale,
  expandNode,
  refresh,

  init: function (data: MindElixirData) {
    if (data.direction) {
      this.direction = data.direction
    }
    this.nodeData = data.nodeData
    this.linkData = data.linkData || {}
    // plugin
    this.toolBar && toolBar(this)

    if (isMobile() && this.mobileMenu) {
      mobileMenu(this)
    } else {
      this.contextMenu && contextMenu(this, this.contextMenuOption)
    }

    const cssVar = this.theme.cssVar
    const keys = Object.keys(cssVar)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      this.mindElixirBox.style.setProperty(key, cssVar[key])
    }

    fillParent(this.nodeData)
    this.toCenter()
    this.layout()
    this.linkDiv()
  },
}

MindElixir.LEFT = LEFT
MindElixir.RIGHT = RIGHT
MindElixir.SIDE = SIDE
/**
 * @memberof MindElixir
 * @static
 */
MindElixir.version = '2.0.2'
MindElixir.E = findEle

export default MindElixir
