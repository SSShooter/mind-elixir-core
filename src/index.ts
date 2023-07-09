import { LEFT, RIGHT, SIDE, GAP, THEME, MAIN_NODE_HORIZONTAL_GAP, MAIN_NODE_VERTICAL_GAP } from './const'
import { isMobile, fillParent, getObjById, generateUUID, generateNewObj } from './utils/index'
import { findEle, createInputDiv, createWrapper, createParent, createChildren, createTopic } from './utils/dom'
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
  enableEdit,
  disableEdit,
  expandNode,
  refresh,
  install,
} from './interact'
import {
  insertSibling,
  insertBefore,
  insertParent,
  addChild,
  copyNode,
  moveNode,
  removeNode,
  moveUpNode,
  moveDownNode,
  beginEdit,
  reshapeNode,
  setNodeTopic,
  moveNodeBefore,
  moveNodeAfter,
} from './nodeOperation'
import { createLink, removeLink, selectLink, hideLinkController, showLinkController } from './customLink'
import linkDiv from './linkDiv'
import initMouseEvent from './mouse'

import contextMenu from './plugin/contextMenu'
import toolBar from './plugin/toolBar'
import nodeDraggable from './plugin/nodeDraggable'
import keypress from './plugin/keypress'
import mobileMenu from './plugin/mobileMenu'

import Bus from './utils/pubsub'

import './index.less'
import './iconfont/iconfont.js'
import type { MindElixirData, MindElixirInstance, Operation, Options } from './types/index'
import type { Children } from './types/dom'

// TODO show up animation

/**
 * @function
 * @global
 * @name E
 * @param {string} id Node id.
 * @return {TargetElement} Target element.
 * @example
 * E('bd4313fbac40284b')
 */
export const E = findEle
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
    overflowHidden,
    mainNodeHorizontalGap,
    mainNodeVerticalGap,
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
  if (!ele) new Error('MindElixir: el is not a valid element')

  ele!.className += ' mind-elixir'
  ele!.innerHTML = ''
  ele!.style.setProperty('--gap', GAP + 'px')
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
  this.allowUndo = allowUndo === undefined ? true : allowUndo
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

  // redo
  this.history = []
  this.isUndo = false
  this.undo = function () {
    const operation = this.history.pop()
    if (!operation) return
    this.isUndo = true
    if (operation.name === 'moveNode') {
      this.moveNode(E(operation.obj.fromObj.id), E(operation.obj.originParentId))
    } else if (operation.name === 'removeNode') {
      if (operation.originSiblingId) {
        this.insertBefore(E(operation.originSiblingId), operation.obj)
      } else {
        this.addChild(E(operation.originParentId), operation.obj)
      }
    } else if (operation.name === 'addChild' || operation.name === 'copyNode') {
      this.removeNode(E(operation.obj.id))
    } else if (operation.name === 'finishEdit') {
      this.setNodeTopic(E(operation.obj.id), operation.origin)
    } else {
      this.isUndo = false
    }
  }
  this.bus.addListener('operation', (operation: Operation) => {
    if (this.isUndo) {
      this.isUndo = false
      return
    }
    if (['moveNode', 'removeNode', 'addChild', 'finishEdit', 'editStyle', 'editTags', 'editIcons'].includes(operation.name)) {
      this.history.push(operation)
      // console.log(operation, this.history)
    }
  })
  // redo end

  this.container = $d.createElement('div') // map container
  this.container.className = 'map-container'

  this.theme = theme || THEME
  const canvas = $d.createElement('div') // map-canvas Element
  canvas.className = 'map-canvas'
  this.map = canvas
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

function beforeHook(fn: (...arg: any[]) => void, fnName: string) {
  return async function (this: MindElixirInstance, ...args: unknown[]) {
    const hook = this.before[fnName]
    if (hook) {
      await hook.apply(this, args)
    }
    fn.apply(this, args)
  }
}

MindElixir.prototype = {
  fillParent,
  getObjById,
  generateNewObj,
  // node operation
  insertSibling: beforeHook(insertSibling, 'insertSibling'),
  insertBefore: beforeHook(insertBefore, 'insertBefore'),
  insertParent: beforeHook(insertParent, 'insertParent'),
  addChild: beforeHook(addChild, 'addChild'),
  copyNode: beforeHook(copyNode, 'copyNode'),
  moveNode: beforeHook(moveNode, 'moveNode'),
  removeNode: beforeHook(removeNode, 'removeNode'),
  moveUpNode: beforeHook(moveUpNode, 'moveUpNode'),
  moveDownNode: beforeHook(moveDownNode, 'moveDownNode'),
  beginEdit: beforeHook(beginEdit, 'beginEdit'),
  moveNodeBefore: beforeHook(moveNodeBefore, 'moveNodeBefore'),
  moveNodeAfter: beforeHook(moveNodeAfter, 'moveNodeAfter'),
  reshapeNode,
  judgeDirection,
  setNodeTopic,

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
  enableEdit,
  disableEdit,
  expandNode,
  refresh,
  findEle,
  install,
  init(this: MindElixirInstance, data: MindElixirData) {
    if (!data || !data.nodeData) return new Error('MindElixir: `data` is required')
    if (data.direction) {
      this.direction = data.direction
    }
    if (data.theme) {
      this.theme = data.theme
    }
    this.nodeData = data.nodeData
    this.linkData = data.linkData || {}
    // plugin
    this.toolBar && toolBar(this)
    this.keypress && keypress(this)

    if (isMobile() && this.mobileMenu) {
      mobileMenu(this)
    } else {
      this.contextMenu && contextMenu(this, this.contextMenuOption)
    }
    this.draggable && nodeDraggable(this)

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

/**
 * @function new
 * @memberof MindElixir
 * @static
 * @param {String} topic root topic
 */
MindElixir.new = (topic: string): MindElixirData => ({
  nodeData: {
    id: generateUUID(),
    topic: topic || 'new topic',
    root: true,
    children: [],
  },
  linkData: {},
})

interface MindElixirCtor {
  new (options: Options): MindElixirInstance
  E: typeof findEle
  new: typeof MindElixir.new
  version: string
  LEFT: typeof LEFT
  RIGHT: typeof RIGHT
  SIDE: typeof SIDE
}

export default MindElixir as any as MindElixirCtor
