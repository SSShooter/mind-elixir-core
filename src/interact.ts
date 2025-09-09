import type { Locale } from './i18n'
import { rmSubline } from './nodeOperation'
import type { Topic, Wrapper } from './types/dom'
import type { MindElixirData, MindElixirInstance, NodeObj } from './types/index'
import { fillParent, getTranslate, setExpand } from './utils/index'

function collectData(instance: MindElixirInstance) {
  return {
    nodeData: instance.isFocusMode ? instance.nodeDataBackup : instance.nodeData,
    arrows: instance.arrows,
    summaries: instance.summaries,
    direction: instance.direction,
    theme: instance.theme,
  }
}

export const scrollIntoView = function (this: MindElixirInstance, el: HTMLElement) {
  // scrollIntoView needs to be implemented manually because native scrollIntoView behaves incorrectly after transform
  const container = this.container
  const rect = el.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  const isOutOfView =
    rect.top > containerRect.bottom || rect.bottom < containerRect.top || rect.left > containerRect.right || rect.right < containerRect.left
  if (isOutOfView) {
    // Calculate the offset between container center and element center
    const elCenterX = rect.left + rect.width / 2
    const elCenterY = rect.top + rect.height / 2
    const containerCenterX = containerRect.left + containerRect.width / 2
    const containerCenterY = containerRect.top + containerRect.height / 2
    const offsetX = elCenterX - containerCenterX
    const offsetY = elCenterY - containerCenterY
    this.move(-offsetX, -offsetY, true)
  }
}

export const selectNode = function (this: MindElixirInstance, tpc: Topic, isNewNode?: boolean, e?: MouseEvent): void {
  // selectNode clears all selected nodes by default
  this.clearSelection()
  this.scrollIntoView(tpc)
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
  if (scaleVal < this.scaleMin || scaleVal > this.scaleMax) return
  const rect = this.container.getBoundingClientRect()
  // refer to /refs/scale-calc.excalidraw for the process
  // remove coordinate system influence and calculate quantities directly
  // cursor xy
  const xc = offset.x ? offset.x - rect.left - rect.width / 2 : 0
  const yc = offset.y ? offset.y - rect.top - rect.height / 2 : 0

  const { dx, dy } = getCenterDefault(this)
  const oldTransform = this.map.style.transform
  const { x: xCurrent, y: yCurrent } = getTranslate(oldTransform) // current offset
  // before xy
  const xb = xCurrent - dx
  const yb = yCurrent - dy

  const oldScale = this.scaleVal
  // Note: cursor needs to be reversed, probably because transform itself is reversed
  const xres = (-xc + xb) * (1 - scaleVal / oldScale)
  const yres = (-yc + yb) * (1 - scaleVal / oldScale)

  this.map.style.transform = `translate(${xCurrent - xres}px, ${yCurrent - yres}px) scale(${scaleVal})`
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
export const move = function (this: MindElixirInstance, dx: number, dy: number, smooth = false) {
  const { map, scaleVal, bus } = this
  const transform = map.style.transform
  let { x, y } = getTranslate(transform)
  x += dx
  y += dy

  // apply candidate transform first so we can measure visual bounds
  if (smooth) {
    map.style.transition = 'transform 0.3s'
    setTimeout(() => {
      map.style.transition = 'none'
    }, 300)
  }

  // candidate transform
  const candidateX = x
  const candidateY = y
  map.style.transform = `translate(${candidateX}px, ${candidateY}px) scale(${scaleVal})`

  // enforce drag bounds (allow a padding outside the container)
  try {
    const padding = (this.dragBoundPadding as number) || 0
    const containerRect = this.container.getBoundingClientRect()
    const nodesRect = this.nodes.getBoundingClientRect()

    let adjustX = 0
    if (nodesRect.left > containerRect.right + padding) {
      // nodes shifted too far right; move left
      adjustX = -((nodesRect.left - (containerRect.right + padding)) / scaleVal)
    } else if (nodesRect.right < containerRect.left - padding) {
      // nodes shifted too far left; move right
      adjustX = (containerRect.left - padding - nodesRect.right) / scaleVal
    }

    let adjustY = 0
    if (nodesRect.top > containerRect.bottom + padding) {
      // nodes too far down; move up
      adjustY = -((nodesRect.top - (containerRect.bottom + padding)) / scaleVal)
    } else if (nodesRect.bottom < containerRect.top - padding) {
      // nodes too far up; move down
      adjustY = (containerRect.top - padding - nodesRect.bottom) / scaleVal
    }

    if (adjustX !== 0 || adjustY !== 0) {
      // apply adjustments in pre-scale translate units
      const finalX = candidateX + adjustX
      const finalY = candidateY + adjustY
      map.style.transform = `translate(${finalX}px, ${finalY}px) scale(${scaleVal})`
      const actualDx = finalX - getTranslate(transform).x
      const actualDy = finalY - getTranslate(transform).y
      bus.fire('move', { dx: actualDx, dy: actualDy })
      return
    }
  } catch (e) {
    // if anything fails, fall back to applying candidate transform
  }

  // no adjustments needed
  bus.fire('move', { dx, dy })
}

/**
 * 获取默认居中的偏移
 */
const getCenterDefault = (mei: MindElixirInstance) => {
  const { container, map, nodes } = mei

  const root = map.querySelector('me-root') as HTMLElement
  const pT = root.offsetTop
  const pL = root.offsetLeft
  const pW = root.offsetWidth
  const pH = root.offsetHeight

  let dx, dy
  if (mei.alignment === 'root') {
    dx = container.offsetWidth / 2 - pL - pW / 2
    dy = container.offsetHeight / 2 - pT - pH / 2
    map.style.transformOrigin = `${pL + pW / 2}px 50%`
  } else {
    dx = (container.offsetWidth - nodes.offsetWidth) / 2
    dy = (container.offsetHeight - nodes.offsetHeight) / 2
    map.style.transformOrigin = `50% 50%`
  }
  return { dx, dy }
}

/**
 * @function
 * @instance
 * @name toCenter
 * @description Reset position of the map to center.
 * @memberof MapInteraction
 */
export const toCenter = function (this: MindElixirInstance) {
  const { map } = this
  const { dx, dy } = getCenterDefault(this)
  map.style.transform = `translate(${dx}px, ${dy}px) scale(${this.scaleVal})`
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
  this.toCenter()
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
  this.toCenter()
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
  this.toCenter()
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

  // Calculate position before expansion
  const expanderRect = el.getBoundingClientRect()
  const beforePosition = {
    x: expanderRect.left,
    y: expanderRect.top,
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

  // Calculate position after expansion and compensate for drift
  const afterRect = el.getBoundingClientRect()
  const afterPosition = {
    x: afterRect.left,
    y: afterRect.top,
  }

  // Calculate the drift and move to compensate
  const driftX = beforePosition.x - afterPosition.x
  const driftY = beforePosition.y - afterPosition.y

  this.move(driftX, driftY)

  this.bus.fire('expandNode', node)
}

export const expandNodeAll = function (this: MindElixirInstance, el: Topic, isExpand?: boolean) {
  const node = el.nodeObj
  const beforeRect = el.getBoundingClientRect()
  const beforePosition = {
    x: beforeRect.left,
    y: beforeRect.top,
  }
  setExpand(node, isExpand ?? !node.expanded)
  this.refresh()
  const afterRect = this.findEle(node.id).getBoundingClientRect()
  const afterPosition = {
    x: afterRect.left,
    y: afterRect.top,
  }
  const driftX = beforePosition.x - afterPosition.x
  const driftY = beforePosition.y - afterPosition.y

  this.move(driftX, driftY)
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
  this.clearSelection()
  if (data) {
    data = JSON.parse(JSON.stringify(data)) as MindElixirData // it shouldn't contanimate the original data
    this.nodeData = data.nodeData
    this.arrows = data.arrows || []
    this.summaries = data.summaries || []
    data.theme && this.changeTheme(data.theme)
  }
  fillParent(this.nodeData)
  // create dom element for every node
  this.layout()
  // generate links between nodes
  this.linkDiv()
}
