import vari from '../var'

export let isMobile = () =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )

export let getObjById = (id, data) => {
  data = data || this.nodeData
  if (data.id === id) {
    return data
  } else if (data.children && data.children.length) {
    for (let i = 0; i < data.children.length; i++) {
      let res = getObjById(id, data.children[i])
      if (res) return res
    }
  } else {
    return null
  }
}

export let addParentLink = (data, parent) => {
  data.parent = parent
  if (data.children) {
    for (let i = 0; i < data.children.length; i++) {
      addParentLink(data.children[i], data)
    }
  }
}

export let throttle = (fn, wait) => {
  var pre = Date.now()
  return function () {
    var context = this
    var args = arguments
    var now = Date.now()
    if (now - pre >= wait) {
      fn.apply(context, args)
      pre = Date.now()
    }
  }
}

export function getArrowPoints(p3x, p3y, p4x, p4y) {
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

export function calcP1(fromData, p2x, p2y) {
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
    // console.log('斜率', k)
    // console.log('fromData.cx-x', fromData.cx - p2x)
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

export function calcP4(toData, p3x, p3y) {
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
    // console.log('斜率', k)
    // console.log('toData.cx-x', toData.cx - p3x)
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

export function generateUUID() {
  return (
    new Date().getTime().toString(16) + Math.random().toString(16).substr(2)
  ).substr(2, 16)
}

export function generateNewObj() {
  let id = generateUUID()
  return {
    topic: vari.newTopicName || 'new node',
    id,
    // selected: true,
    // new: true,
  }
}

export function generateNewLink(from, to) {
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

export function checkMoveValid(from, to) {
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

export function getObjSibling(obj) {
  let childrenList = obj.parent.children
  let index = childrenList.indexOf(obj)
  if (index + 1 >= childrenList.length) {
    // 最后一个
    return null
  } else {
    return childrenList[index + 1]
  }
}

export function moveUpObj(obj) {
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

export function moveDownObj(obj) {
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

export function removeNodeObj(obj) {
  let childrenList = obj.parent.children
  let index = childrenList.indexOf(obj)
  childrenList.splice(index, 1)
  return childrenList.length
}

export function insertNodeObj(obj, newObj) {
  let childrenList = obj.parent.children
  let index = childrenList.indexOf(obj)
  childrenList.splice(index + 1, 0, newObj)
}

export function insertBeforeNodeObj(obj, newObj) {
  let childrenList = obj.parent.children
  let index = childrenList.indexOf(obj)
  childrenList.splice(index, 0, newObj)
}

export function moveNodeObj(from, to) {
  removeNodeObj(from)
  if (to.children) to.children.push(from)
  else to.children = [from]
}

export function moveNodeBeforeObj(from, to) {
  removeNodeObj(from)
  let childrenList = to.parent.children
  let toIndex = 0
  for (let i = 0; i < childrenList.length; i++) {
    if (childrenList[i] === to) {
      toIndex = i
      break
    }
  }
  childrenList.splice(toIndex, 0, from)
}

export function moveNodeAfterObj(from, to) {
  removeNodeObj(from)
  let childrenList = to.parent.children
  let toIndex = 0
  for (let i = 0; i < childrenList.length; i++) {
    if (childrenList[i] === to) {
      toIndex = i
      break
    }
  }
  childrenList.splice(toIndex + 1, 0, from)
}

export let dragMoveHelper = {
  afterMoving: false, // 区别click事件
  mousedown: false,
  lastX: null,
  lastY: null,
  onMove(e, container) {
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
  clear() {
    this.afterMoving = false
    this.mousedown = false
    this.lastX = null
    this.lastY = null
  },
}

export function dmhelper(dom) {
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
