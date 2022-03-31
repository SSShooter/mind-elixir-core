import { findEle } from './utils/dom'
/**
 * @exports -
 * workaround for jsdoc
 */
/**
 * @exports MapInteraction
 * @namespace MapInteraction
 */
function getData(instance) {
  return instance.isFocusMode ? instance.nodeDataBackup : instance.nodeData
}
/**
 * @function
 * @instance
 * @name selectNode
 * @memberof MapInteraction
 * @description Select a node and add solid border to it.
 * @param {TargetElement} el - Target element return by E('...'), default value: currentTarget.
 */
export const selectNode = function(targetElement, isNewNode) {
  if (!targetElement) return
  console.time('selectNode')
  if (typeof targetElement === 'string') {
    return this.selectNode(findEle(targetElement))
  }
  if (this.currentNode) this.currentNode.className = ''
  targetElement.className = 'selected'
  this.currentNode = targetElement
  if (isNewNode) {
    this.bus.fire('selectNewNode', targetElement.nodeObj)
  } else {
    this.bus.fire('selectNode', targetElement.nodeObj)
  }
  console.timeEnd('selectNode')
}
export const unselectNode = function() {
  if (this.currentNode) {
    this.currentNode.className = ''
  }
  this.currentNode = null
  this.bus.fire('unselectNode')
}
export const selectNextSibling = function() {
  if (!this.currentNode || this.currentNode.dataset.nodeid === 'meroot') return

  const sibling = this.currentNode.parentElement.parentElement.nextSibling
  let target: HTMLElement
  const grp = this.currentNode.parentElement.parentElement
  if (grp.className === 'rhs' || grp.className === 'lhs') {
    const siblingList = this.mindElixirBox.querySelectorAll('.' + grp.className)
    const i = Array.from(siblingList).indexOf(grp)
    if (i + 1 < siblingList.length) {
      target = siblingList[i + 1].firstChild.firstChild
    } else {
      return false
    }
  } else if (sibling) {
    target = sibling.firstChild.firstChild
  } else {
    return false
  }
  this.selectNode(target)
  return true
}
export const selectPrevSibling = function() {
  if (!this.currentNode || this.currentNode.dataset.nodeid === 'meroot') return

  const sibling = this.currentNode.parentElement.parentElement.previousSibling
  let target
  const grp = this.currentNode.parentElement.parentElement
  if (grp.className === 'rhs' || grp.className === 'lhs') {
    const siblingList = this.mindElixirBox.querySelectorAll('.' + grp.className)
    const i = Array.from(siblingList).indexOf(grp)
    if (i - 1 >= 0) {
      target = siblingList[i - 1].firstChild.firstChild
    } else {
      return false
    }
  } else if (sibling) {
    target = sibling.firstChild.firstChild
  } else {
    return false
  }
  this.selectNode(target)
  return true
}
export const selectFirstChild = function() {
  if (!this.currentNode) return
  const children = this.currentNode.parentElement.nextSibling
  if (children && children.firstChild) {
    const target = children.firstChild.firstChild.firstChild
    this.selectNode(target)
  }
}
export const selectParent = function() {
  if (!this.currentNode || this.currentNode.dataset.nodeid === 'meroot') return

  const parent = this.currentNode.parentElement.parentElement.parentElement
    .previousSibling
  if (parent) {
    const target = parent.firstChild
    this.selectNode(target)
  }
}
/**
 * @function
 * @instance
 * @name getAllDataString
 * @description Get all node data as string.
 * @memberof MapInteraction
 * @return {string}
 */
export const getAllDataString = function() {
  const data = {
    nodeData: getData(this),
    linkData: this.linkData,
  }
  return JSON.stringify(data, (k, v) => {
    if (k === 'parent') return undefined
    if (k === 'from') return v.nodeObj.id
    if (k === 'to') return v.nodeObj.id
    return v
  })
}
/**
 * @function
 * @instance
 * @name getAllData
 * @description Get all node data as object.
 * @memberof MapInteraction
 * @return {Object}
 */
export const getAllData = function(): object {
  const data = {
    nodeData: getData(this),
    linkData: this.linkData,
  }
  return JSON.parse(
    JSON.stringify(data, (k, v) => {
      if (k === 'parent') return undefined
      if (k === 'from') return v.nodeObj.id
      if (k === 'to') return v.nodeObj.id
      return v
    })
  )
}

/**
 * @function
 * @instance
 * @name getAllDataMd
 * @description Get all node data as markdown.
 * @memberof MapInteraction
 * @return {String}
 */
export const getAllDataMd = function():string {
  const data = getData(this)
  let mdString = '# ' + data.topic + '\n\n'
  function writeMd(children, deep) {
    for (let i = 0; i < children.length; i++) {
      if (deep <= 6) {
        mdString += ''.padStart(deep, '#') + ' ' + children[i].topic + '\n\n'
      } else {
        mdString +=
          ''.padStart(deep - 7, '\t') + '- ' + children[i].topic + '\n'
      }
      if (children[i].children) {
        writeMd(children[i].children, deep + 1)
      }
    }
  }
  writeMd(data.children, 2)
  return mdString
}

/**
 * @function
 * @instance
 * @name enableEdit
 * @memberof MapInteraction
 */
export const enableEdit = function() {
  this.editable = true
}

/**
 * @function
 * @instance
 * @name disableEdit
 * @memberof MapInteraction
 */
export const disableEdit = function() {
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
export const scale = function(scaleVal) {
  this.scaleVal = scaleVal
  this.map.style.transform = 'scale(' + scaleVal + ')'
}
/**
 * @function
 * @instance
 * @name toCenter
 * @description Reset position of the map to center.
 * @memberof MapInteraction
 */
export const toCenter = function() {
  this.container.scrollTo(
    10000 - this.container.offsetWidth / 2,
    10000 - this.container.offsetHeight / 2
  )
}
export const install = function(plugin) {
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
export const focusNode = function(tpcEl) {
  if (tpcEl.nodeObj.root) return
  if (this.tempDirection === null) {
    this.tempDirection = this.direction
  }
  if (!this.isFocusMode) {
    this.nodeDataBackup = this.nodeData // help reset focus mode
    this.isFocusMode = true
  }
  this.nodeData = tpcEl.nodeObj
  this.nodeData.root = true
  this.initRight()
}
/**
 * @function
 * @instance
 * @name cancelFocus
 * @description Exit focus mode.
 * @memberof MapInteraction
 */
export const cancelFocus = function() {
  this.isFocusMode = false
  if (this.tempDirection !== null) {
    delete this.nodeData.root
    this.nodeData = this.nodeDataBackup
    this.direction = this.tempDirection
    this.tempDirection = null
    this.init()
  }
}
/**
 * @function
 * @instance
 * @name initLeft
 * @description Child nodes will distribute on the left side of the root node.
 * @memberof MapInteraction
 */
export const initLeft = function() {
  this.direction = 0
  this.init()
}
/**
 * @function
 * @instance
 * @name initRight
 * @description Child nodes will distribute on the right side of the root node.
 * @memberof MapInteraction
 */
export const initRight = function() {
  this.direction = 1
  this.init()
}
/**
 * @function
 * @instance
 * @name initSide
 * @description Child nodes will distribute on both left and right side of the root node.
 * @memberof MapInteraction
 */
export const initSide = function() {
  this.direction = 2
  this.init()
}

/**
 * @function
 * @instance
 * @name setLocale
 * @memberof MapInteraction
 */
export const setLocale = function(locale) {
  this.locale = locale
  this.init()
}

export const expandNode = function(el, isExpand) {
  const node = el.nodeObj
  if (typeof isExpand === 'boolean') {
    node.expanded = isExpand
  } else if (node.expanded !== false) {
    node.expanded = false
  } else {
    node.expanded = true
  }
  // TODO 在此函数构造 html 结构，而非调用 layout
  this.layout()
  // linkDiv 已实现只更新特定主节点
  this.linkDiv()
  this.bus.fire('expandNode', node)
}

/**
 * @function
 * @instance
 * @name refresh
 * @description Refresh mind map, you can use it after modified `this.nodeData`
 * @memberof MapInteraction
 */
export const refresh = function() {
  // add parent property to every node
  this.addParentLink(this.nodeData)
  // create dom element for every node
  this.layout()
  // generate links between nodes
  this.linkDiv()
}
