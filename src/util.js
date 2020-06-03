let $d = document
import { LEFT } from './const'

export let addParentLink = (data, parent) => {
  data.parent = parent
  if (data.children) {
    for (let i = 0; i < data.children.length; i++) {
      addParentLink(data.children[i], data)
    }
  }
}

export let findEle = id => {
  return $d.querySelector(`[data-nodeid=me${id}]`)
}

export let createLinkSvg = function (klass) {
  let svg = $d.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('class', klass)
  return svg
}

export let createLine = function (x1, y1, x2, y2) {
  let line = $d.createElementNS('http://www.w3.org/2000/svg', 'line')
  line.setAttribute('x1', x1)
  line.setAttribute('y1', y1)
  line.setAttribute('x2', x2)
  line.setAttribute('y2', y2)
  line.setAttribute('stroke', '#bbb')
  line.setAttribute('fill', 'none')
  line.setAttribute('stroke-width', '2')
  return line
}

export let createPath = function (d) {
  let path = $d.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', d)
  path.setAttribute('stroke', '#555')
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke-linecap', 'square')
  path.setAttribute('stroke-width', '1')
  path.setAttribute('transform', 'translate(0.5,-0.5)')
  // adding translate(0.5,-0.5) can fix render error on windows, but i still dunno why
  return path
}

export let createSvgGroup = function (d, arrowd) {
  let g = $d.createElementNS('http://www.w3.org/2000/svg', 'g')
  let path = $d.createElementNS('http://www.w3.org/2000/svg', 'path')
  let arrow = $d.createElementNS('http://www.w3.org/2000/svg', 'path')
  arrow.setAttribute('d', arrowd)
  arrow.setAttribute('stroke', 'rgb(235, 95, 82)')
  arrow.setAttribute('fill', 'none')
  arrow.setAttribute('stroke-linecap', 'cap')
  arrow.setAttribute('stroke-width', '2')
  path.setAttribute('d', d)
  path.setAttribute('stroke', 'rgb(235, 95, 82)')
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke-linecap', 'cap')
  path.setAttribute('stroke-width', '2')

  g.appendChild(path)
  g.appendChild(arrow)
  return g
}

export function getArrowPoints (p3x, p3y, p4x, p4y) {
  let deltay = p4y - p3y
  let deltax = p3x - p4x
  let angle = (Math.atan(Math.abs(deltay) / Math.abs(deltax)) / 3.14) * 180
  if (deltax < 0 && deltay > 0) {
    angle = 180 - angle
  }
  if (deltax < 0 && deltay < 0) {
    angle = 180 + angle
  }
  if (deltax > 0 && deltay < 0) {
    angle = 360 - angle
  }
  let arrowLength = 20
  let arrowAngle = 30
  var a1 = angle + arrowAngle
  let a2 = angle - arrowAngle
  return {
    x1: p4x + Math.cos((Math.PI * a1) / 180) * arrowLength,
    y1: p4y - Math.sin((Math.PI * a1) / 180) * arrowLength,
    x2: p4x + Math.cos((Math.PI * a2) / 180) * arrowLength,
    y2: p4y - Math.sin((Math.PI * a2) / 180) * arrowLength,
  }
}

export function calcP1 (fromData, p2x, p2y) {
  let x, y
  let k = (fromData.cy - p2y) / (p2x - fromData.cx)
  if (k > fromData.h / fromData.w || k < -fromData.h / fromData.w) {
    if (fromData.cy - p2y < 0) {
      x = fromData.cx - fromData.h / 2 / k
      y = fromData.cy + fromData.h / 2
    } else {
      x = fromData.cx + fromData.h / 2 / k
      y = fromData.cy - fromData.h / 2
    }
  } else {
    console.log('斜率', k)
    console.log('fromData.cx-x', fromData.cx - p2x)
    if (fromData.cx - p2x < 0) {
      x = fromData.cx + fromData.w / 2
      y = fromData.cy - (fromData.w * k) / 2
    } else {
      x = fromData.cx - fromData.w / 2
      y = fromData.cy + (fromData.w * k) / 2
    }
  }
  return {
    x,
    y,
  }
}

export function calcP4 (toData, p3x, p3y) {
  let x, y
  let k = (toData.cy - p3y) / (p3x - toData.cx)
  if (k > toData.h / toData.w || k < -toData.h / toData.w) {
    if (toData.cy - p3y < 0) {
      x = toData.cx - toData.h / 2 / k
      y = toData.cy + toData.h / 2
    } else {
      x = toData.cx + toData.h / 2 / k
      y = toData.cy - toData.h / 2
    }
  } else {
    console.log('斜率', k)
    console.log('toData.cx-x', toData.cx - p3x)
    if (toData.cx - p3x < 0) {
      x = toData.cx + toData.w / 2
      y = toData.cy - (toData.w * k) / 2
    } else {
      x = toData.cx - toData.w / 2
      y = toData.cy + (toData.w * k) / 2
    }
  }
  return {
    x,
    y,
  }
}

export let createMainPath = function (d) {
  let path = $d.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', d)
  path.setAttribute('stroke', '#666')
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke-width', '2')
  return path
}

export let createListItem = function (topic) {
  let listItem = $d.createElement('l')
  listItem.appendChild(topic)
  return listItem
}

export let createGroup = function (firstChild, secondChild) {
  let group = $d.createElement('GRP')
  group.appendChild(firstChild)
  group.appendChild(secondChild)
  return group
}

export let createTop = function (nodeObj) {
  let top = $d.createElement('t')
  top.appendChild(createTopic(nodeObj))
  top.appendChild(createExpander(nodeObj.expanded))
  return top
}

export let createSimpleTop = function (nodeObj) {
  let top = $d.createElement('t')
  top.appendChild(createTopic(nodeObj))
  return top
}

export let createTopic = function (nodeObj) {
  let topic = $d.createElement('tpc')
  topic.nodeObj = nodeObj
  topic.innerHTML = nodeObj.topic
  topic.dataset.nodeid = 'me' + nodeObj.id
  topic.draggable = window.mevar_draggable
  return topic
}

export let createExpander = function (expanded) {
  let expander = $d.createElement('epd')
  // 包含未定义 expanded 的情况，未定义视为展开
  expander.innerHTML = expanded !== false ? '-' : '+'
  expander.expanded = expanded !== false ? true : false
  expander.className = expanded !== false ? 'minus' : ''
  return expander
}

export function createInputDiv (tpc) {
  console.time('createInputDiv')
  if (!tpc) return
  let div = $d.createElement('div')
  let origin = tpc.childNodes[0].textContent
  tpc.appendChild(div)
  div.innerHTML = origin
  div.contentEditable = true
  div.spellcheck = false
  div.style.cssText = `min-width:${tpc.offsetWidth-8}px;`
  if (this.direction === LEFT) div.style.right = 0
  div.focus()

  selectText(div)
  this.inputDiv = div

  this.bus.fire('operation', {
    name: 'beginEdit',
    obj: tpc.nodeObj,
  })

  div.addEventListener('keydown', e => {
    let key = e.keyCode
    if (key === 8) {
      // 不停止冒泡冒到document就把节点删了
      e.stopPropagation()
    } else if (key === 13 || key === 9) {
      e.preventDefault()
      this.inputDiv.blur()
      this.map.focus()
    }
  })
  div.addEventListener('blur', () => {
    if (!div) return // 防止重复blur
    let node = tpc.nodeObj
    let topic = div.textContent.trim()
    if (topic === '') node.topic = origin
    else node.topic = topic
    div.remove()
    this.inputDiv = div = null
    this.bus.fire('operation', {
      name: 'finishEdit',
      obj: node,
      origin
    })
    if (topic === origin) return // 没有修改不做处理
    tpc.childNodes[0].textContent = node.topic
    this.linkDiv()
  })
  console.timeEnd('createInputDiv')
}

export function selectText (div) {
  if ($d.selection) {
    let range = $d.body.createTextRange()
    range.moveToElementText(div)
    range.select()
  } else if (window.getSelection) {
    let range = $d.createRange()
    range.selectNodeContents(div)
    window.getSelection().removeAllRanges()
    window.getSelection().addRange(range)
  }
}

export function generateUUID () {
  return (
    new Date().getTime().toString(16) +
    Math.random()
      .toString(16)
      .substr(2)
  ).substr(2, 16)
}

export function generateNewObj () {
  let id = generateUUID()
  return {
    topic: 'new node',
    id,
    // selected: true,
    // new: true,
  }
}

export function generateNewLink (from, to) {
  let id = generateUUID()
  return {
    id,
    name: '',
    from,
    to,
    delta1: { x: 0, y: -100 },
    delta2: { x: 0, y: -100 },
  }
}

export function checkMoveValid (from, to) {
  let valid = true
  while (to.parent) {
    if (to.parent === from) {
      valid = false
      break
    }
    to = to.parent
  }
  return valid
}

export function getObjSibling (obj) {
  let childrenList = obj.parent.children
  let index = childrenList.indexOf(obj)
  if (index + 1 >= childrenList.length) {
    // 最后一个
    return null
  } else {
    return childrenList[index + 1]
  }
}

export function moveUpObj (obj) {
  let childrenList = obj.parent.children
  let index = childrenList.indexOf(obj)
  let t = childrenList[index]
  if (index === 0) {
    childrenList[index] = childrenList[childrenList.length - 1]
    childrenList[childrenList.length - 1] = t
  } else {
    childrenList[index] = childrenList[index - 1]
    childrenList[index - 1] = t
  }
  t = null
}

export function moveDownObj (obj) {
  let childrenList = obj.parent.children
  let index = childrenList.indexOf(obj)
  let t = childrenList[index]
  if (index === childrenList.length - 1) {
    childrenList[index] = childrenList[0]
    childrenList[0] = t
  } else {
    childrenList[index] = childrenList[index + 1]
    childrenList[index + 1] = t
  }
  t = null
}

export function removeNodeObj (obj) {
  let childrenList = obj.parent.children
  let index = childrenList.indexOf(obj)
  childrenList.splice(index, 1)
  return childrenList.length
}

export function insertNodeObj (obj, newObj) {
  let childrenList = obj.parent.children
  let index = childrenList.indexOf(obj)
  childrenList.splice(index + 1, 0, newObj)
}

export function moveNodeObj (from, to) {
  removeNodeObj(from)
  if (to.children) to.children.push(from)
  else to.children = [from]
}

export let dragMoveHelper = {
  afterMoving: false, // 区别click事件
  mousedown: false,
  lastX: null,
  lastY: null,
  onMove (e, container) {
    if (this.mousedown) {
      this.afterMoving = true
      if (!this.lastX) {
        this.lastX = e.pageX
        this.lastY = e.pageY
        return
      }
      let deltaX = this.lastX - e.pageX
      let deltaY = this.lastY - e.pageY
      container.scrollTo(
        container.scrollLeft + deltaX,
        container.scrollTop + deltaY
      )
      this.lastX = e.pageX
      this.lastY = e.pageY
    }
  },
  clear () {
    this.afterMoving = false
    this.mousedown = false
    this.lastX = null
    this.lastY = null
  },
}

export function dmhelper (dom) {
  this.dom = dom
  this.mousedown = false
  this.lastX = null
  this.lastY = null
}
dmhelper.prototype.init = function (map, cb) {
  this.handleMouseMove = e => {
    e.stopPropagation()
    if (this.mousedown) {
      if (!this.lastX) {
        this.lastX = e.pageX
        this.lastY = e.pageY
        return
      }
      let deltaX = this.lastX - e.pageX
      let deltaY = this.lastY - e.pageY
      cb(deltaX, deltaY)
      this.lastX = e.pageX
      this.lastY = e.pageY
    }
  }
  this.handleMouseDown = e => {
    e.stopPropagation()
    this.mousedown = true
  }
  this.handleClear = e => {
    e.stopPropagation()
    this.clear()
  }
  map.addEventListener('mousemove', this.handleMouseMove)
  map.addEventListener('mouseleave', this.handleClear)
  map.addEventListener('mouseup', this.handleClear)
  this.dom.addEventListener('mousedown', this.handleMouseDown)
}

dmhelper.prototype.destory = function (map) {
  map.removeEventListener('mousemove', this.handleMouseMove)
  map.removeEventListener('mouseleave', this.handleClear)
  map.removeEventListener('mouseup', this.handleClear)
  this.dom.removeEventListener('mousedown', this.handleMouseDown)
}

dmhelper.prototype.clear = function () {
  this.mousedown = false
  this.lastX = null
  this.lastY = null
}
