import type { Locale } from './i18n'
import { rmSubline } from './nodeOperation'
import type { Topic, Wrapper } from './types/dom'
import type { MindElixirData, MindElixirInstance, NodeObj } from './types/index'
import { findEle } from './utils/dom'
import { fillParent } from './utils/index'

function collectData(instance: MindElixirInstance) {
  return {
    nodeData: instance.isFocusMode ? instance.nodeDataBackup : instance.nodeData,
    arrows: instance.arrows,
    summaries: instance.summaries,
    direction: instance.direction,
    theme: instance.theme,
  }
}

export const selectNode = function (this: MindElixirInstance, targetElement: Topic, isNewNode?: boolean, e?: MouseEvent): void {
  if (!targetElement) return
  console.time('selectNode')
  this.clearSelection()
  if (typeof targetElement === 'string') {
    const el = findEle(targetElement)
    if (!el) return
    return this.selectNode(el)
  }
  targetElement.className = 'selected'
  targetElement.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  this.currentNode = targetElement
  if (isNewNode) {
    this.bus.fire('selectNewNode', targetElement.nodeObj)
  } else {
    // the variable e indicates that the action is triggered by a click
    this.bus.fire('selectNode', targetElement.nodeObj, e)
  }
  console.timeEnd('selectNode')
}

export const unselectNode = function (this: MindElixirInstance) {
  if (this.currentNode) {
    this.currentNode.className = ''
  }
  this.currentNode = null
  this.bus.fire('unselectNode')
}

export const selectNodes = function (this: MindElixirInstance, tpc: Topic[]): void {
  console.time('selectNodes')
  this.clearSelection()
  for (const el of tpc) {
    el.className = 'selected'
  }
  this.currentNodes = tpc
  this.bus.fire(
    'selectNodes',
    tpc.map(el => el.nodeObj)
  )
  console.timeEnd('selectNodes')
}

export const unselectNodes = function (this: MindElixirInstance) {
  if (this.currentNodes) {
    for (const el of this.currentNodes) {
      el.classList.remove('selected')
    }
  }
  this.currentNodes = null
  this.bus.fire('unselectNodes')
}

export const clearSelection = function (this: MindElixirInstance) {
  this.unselectNode()
  this.unselectNodes()
  this.unselectSummary()
  this.unselectArrow()
}

/**
 * @function
 * @instance
 * @name getDataString
 * @description Get all node data as string.
 * @memberof MapInteraction
 * @return {string}
 */
export const getDataString = function (this: MindElixirInstance) {
  const data = collectData(this)
  return JSON.stringify(data, (k, v) => {
    if (k === 'parent' && typeof v !== 'string') return undefined
    return v
  })
}
/**
 * @function
 * @instance
 * @name getData
 * @description Get all node data as object.
 * @memberof MapInteraction
 * @return {Object}
 */
export const getData = function (this: MindElixirInstance) {
  return JSON.parse(this.getDataString()) as MindElixirData
}

/**
 * @function
 * @instance
 * @name getDataMd
 * @description Get all node data as markdown.
 * @memberof MapInteraction
 * @return {String}
 */
export const getDataMd = function (this: MindElixirInstance) {
  const data = collectData(this).nodeData
  let mdString = '# ' + data.topic + '\n\n'
  function writeMd(children: NodeObj[], deep: number) {
    for (let i = 0; i < children.length; i++) {
      if (deep <= 6) {
        mdString += ''.padStart(deep, '#') + ' ' + children[i].topic + '\n\n'
      } else {
        mdString += ''.padStart(deep - 7, '\t') + '- ' + children[i].topic + '\n'
      }
      if (children[i].children) {
        writeMd(children[i].children || [], deep + 1)
      }
    }
  }
  writeMd(data.children || [], 2)
  return mdString
}

/**
 * @function
 * @instance
 * @name enableEdit
 * @memberof MapInteraction
 */
export const enableEdit = function (this: MindElixirInstance) {
  this.editable = true
}

/**
 * @function
 * @instance
 * @name disableEdit
 * @memberof MapInteraction
 */
export const disableEdit = function (this: MindElixirInstance) {
  this.editable = false
}

/**
 * @function
 * @instance
 * @name scale
 * @description Change the scale of the mind map.
 * @memberof MapInteraction
 * @param {number}
 */
export const scale = function (this: MindElixirInstance, scaleVal: number) {
  // TODO: recalculate the position of the map
  // plan A: use transform-origin
  // deprecated, center will be changed even if the scale function is doing well, which is very difficult to solve
  // plan B: use transform: translate
  // https://github.com/markmap/markmap/blob/e3071bc34da850ed7283b7d5b1a79b6c9b631a0e/packages/markmap-view/src/view.tsx#L640
  this.scaleVal = scaleVal
  this.map.style.transform = 'scale(' + scaleVal + ')'
  this.bus.fire('scale', scaleVal)
}
/**
 * @function
 * @instance
 * @name toCenter
 * @description Reset position of the map to center.
 * @memberof MapInteraction
 */
export const toCenter = function (this: MindElixirInstance) {
  this.container.scrollTo(10000 - this.container.offsetWidth / 2, 10000 - this.container.offsetHeight / 2)
}

/**
 * @function
 * @instance
 * @name install
 * @description Install plugin.
 * @memberof MapInteraction
 */
export const install = function (this: MindElixirInstance, plugin: (instance: MindElixirInstance) => void) {
  plugin(this)
}
/**
 * @function
 * @instance
 * @name focusNode
 * @description Enter focus mode, set the target element as root.
 * @memberof MapInteraction
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 */
export const focusNode = function (this: MindElixirInstance, el: Topic) {
  if (!el.nodeObj.parent) return
  if (this.tempDirection === null) {
    this.tempDirection = this.direction
  }
  if (!this.isFocusMode) {
    this.nodeDataBackup = this.nodeData // help reset focus mode
    this.isFocusMode = true
  }
  this.nodeData = el.nodeObj
  this.initRight()
  this.toCenter()
}
/**
 * @function
 * @instance
 * @name cancelFocus
 * @description Exit focus mode.
 * @memberof MapInteraction
 */
export const cancelFocus = function (this: MindElixirInstance) {
  this.isFocusMode = false
  if (this.tempDirection !== null) {
    this.nodeData = this.nodeDataBackup
    this.direction = this.tempDirection
    this.tempDirection = null
    this.refresh()
    this.toCenter()
  }
}
/**
 * @function
 * @instance
 * @name initLeft
 * @description Child nodes will distribute on the left side of the root node.
 * @memberof MapInteraction
 */
export const initLeft = function (this: MindElixirInstance) {
  this.direction = 0
  this.refresh()
}
/**
 * @function
 * @instance
 * @name initRight
 * @description Child nodes will distribute on the right side of the root node.
 * @memberof MapInteraction
 */
export const initRight = function (this: MindElixirInstance) {
  this.direction = 1
  this.refresh()
}
/**
 * @function
 * @instance
 * @name initSide
 * @description Child nodes will distribute on both left and right side of the root node.
 * @memberof MapInteraction
 */
export const initSide = function (this: MindElixirInstance) {
  this.direction = 2
  this.refresh()
}

/**
 * @function
 * @instance
 * @name setLocale
 * @memberof MapInteraction
 */
export const setLocale = function (this: MindElixirInstance, locale: Locale) {
  this.locale = locale
  this.refresh()
}

export const expandNode = function (this: MindElixirInstance, el: Topic, isExpand?: boolean) {
  const node = el.nodeObj
  if (typeof isExpand === 'boolean') {
    node.expanded = isExpand
  } else if (node.expanded !== false) {
    node.expanded = false
  } else {
    node.expanded = true
  }
  const parent = el.parentNode
  const expander = parent.children[1]!
  expander.expanded = node.expanded
  expander.className = node.expanded ? 'minus' : ''

  rmSubline(el)
  if (node.expanded) {
    const children = this.createChildren(
      node.children!.map(child => {
        const wrapper = this.createWrapper(child)
        return wrapper.grp
      })
    )
    parent.parentNode.appendChild(children)
  } else {
    const children = parent.parentNode.children[1]
    children.remove()
  }

  this.linkDiv(el.closest('me-main > me-wrapper') as Wrapper)

  // scroll into view if the node is out of view
  const elRect = el.getBoundingClientRect()
  const containerRect = this.container.getBoundingClientRect()
  const isOutOfView =
    elRect.bottom > containerRect.bottom || elRect.top < containerRect.top || elRect.right > containerRect.right || elRect.left < containerRect.left
  if (isOutOfView) {
    el.scrollIntoView({ block: 'center', inline: 'center' })
  }

  this.bus.fire('expandNode', node)
}

/**
 * @function
 * @instance
 * @name refresh
 * @description Refresh mind map, you can use it after modified `this.nodeData`
 * @memberof MapInteraction
 * @param {TargetElement} data mind elixir data
 */
export const refresh = function (this: MindElixirInstance, data?: MindElixirData) {
  if (data) {
    data = JSON.parse(JSON.stringify(data)) as MindElixirData // it shouldn't contanimate the original data
    this.nodeData = data.nodeData
    this.arrows = data.arrows || []
    this.summaries = data.summaries || []
  }
  fillParent(this.nodeData)
  // create dom element for every node
  this.layout()
  // generate links between nodes
  this.linkDiv()
}
