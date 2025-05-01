import type { Locale } from './i18n'
import { rmSubline } from './nodeOperation'
import type { Topic, Wrapper } from './types/dom'
import type { MindElixirData, MindElixirInstance, NodeObj } from './types/index'
import { findEle } from './utils/dom'
import { fillParent, getTranslate } from './utils/index'

function collectData(instance: MindElixirInstance) {
  return {
    nodeData: instance.isFocusMode ? instance.nodeDataBackup : instance.nodeData,
    arrows: instance.arrows,
    summaries: instance.summaries,
    direction: instance.direction,
    theme: instance.theme,
  }
}

export const selectNode = function (this: MindElixirInstance, tpc: Topic, isNewNode?: boolean, e?: MouseEvent): void {
  // selectNode clears all selected nodes by default
  this.clearSelection()
  tpc.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  this.selection.select(tpc)
  if (isNewNode) {
    this.bus.fire('selectNewNode', tpc.nodeObj)
  }
}

export const selectNodes = function (this: MindElixirInstance, tpc: Topic[]): void {
  // update currentNodes in selection.ts to keep sync with SelectionArea cache
  this.selection.select(tpc)
}

export const unselectNodes = function (this: MindElixirInstance, tpc: Topic[]) {
  this.selection.deselect(tpc)
}

export const clearSelection = function (this: MindElixirInstance) {
  this.unselectNodes(this.currentNodes)
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
export const scale = function (this: MindElixirInstance, scaleVal: number, offset: { x: number; y: number } = { x: 0, y: 0 }) {
  const rect = this.container.getBoundingClientRect()
  const centerX = rect.width / 2 - 10000
  const centerY = rect.height / 2 - 10000

  const oldScale = this.scaleVal
  const oldTransform = this.map.style.transform

  const { x: x0, y: y0 } = getTranslate(oldTransform)
  const x = x0 - (offset.x - rect.left - rect.width / 2)
  const y = y0 - (offset.y - rect.top - rect.height / 2)

  const newTranslateX = (centerX - x) * (1 - scaleVal / oldScale)
  const newTranslateY = (centerY - y) * (1 - scaleVal / oldScale)
  this.map.style.transform = `translate(${x0 + newTranslateX}px, ${y0 + newTranslateY}px) scale(${scaleVal})`
  this.scaleVal = scaleVal
  this.bus.fire('scale', scaleVal)
}

/**
 * Better to use with option `alignment: 'nodes'`.
 */
export const scaleFit = function (this: MindElixirInstance) {
  const heightPercent = this.nodes.offsetHeight / this.container.offsetHeight
  const widthPercent = this.nodes.offsetWidth / this.container.offsetWidth
  const scale = 1 / Math.max(1, Math.max(heightPercent, widthPercent))
  this.scaleVal = scale
  this.map.style.transform = 'scale(' + scale + ')'
  this.bus.fire('scale', scale)
}

/**
 * Move the map by `dx` and `dy`.
 */
export const move = function (this: MindElixirInstance, dx: number, dy: number) {
  const { map, scaleVal, container, bus } = this
  const transform = map.style.transform
  const { x, y } = getTranslate(transform)
  const newTranslateX = x + dx
  const newTranslateY = y + dy
  const overflow = (1 - scaleVal) * 10000
  const min = 0 - overflow
  const maxX = -20000 + container.offsetWidth + overflow
  const maxY = -20000 + container.offsetHeight + overflow

  const tx = Math.min(min, Math.max(maxX, newTranslateX))
  const ty = Math.min(min, Math.max(maxY, newTranslateY))

  map.style.transform = `translate(${tx}px, ${ty}px) scale(${scaleVal})`
  bus.fire('move', { dx, dy })
}

/**
 * @function
 * @instance
 * @name toCenter
 * @description Reset position of the map to center.
 * @memberof MapInteraction
 */
export const toCenter = function (this: MindElixirInstance) {
  // this.container.scrollTo(10000 - this.container.offsetWidth / 2, 10000 - this.container.offsetHeight / 2)
  const containerRect = this.container.getBoundingClientRect()
  const centerX = containerRect.width / 2 - 10000
  const centerY = containerRect.height / 2 - 10000
  this.map.style.transform = `translate(${centerX}px, ${centerY}px) scale(${this.scaleVal})`
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
  this.clearSelection()
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
