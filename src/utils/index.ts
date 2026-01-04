import type { Topic } from '../types/dom'
import type { NodeObj, MindElixirInstance, NodeObjExport } from '../types/index'

export function encodeHTML(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

export const isMobile = (): boolean => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

export const getObjById = function (id: string, data: NodeObj): NodeObj | null {
  if (data.id === id) {
    return data
  } else if (data.children && data.children.length) {
    for (let i = 0; i < data.children.length; i++) {
      const res = getObjById(id, data.children[i])
      if (res) return res
    }
    return null
  } else {
    return null
  }
}

/**
 * Add parent property to every node
 */
export const fillParent = (data: NodeObj, parent?: NodeObj) => {
  data.parent = parent
  if (data.children) {
    for (let i = 0; i < data.children.length; i++) {
      fillParent(data.children[i], data)
    }
  }
}

export const setExpand = (node: NodeObj, isExpand: boolean, level?: number) => {
  node.expanded = isExpand
  if (node.children) {
    if (level === undefined || level > 0) {
      const nextLevel = level !== undefined ? level - 1 : undefined
      node.children.forEach(child => {
        setExpand(child, isExpand, nextLevel)
      })
    } else {
      node.children.forEach(child => {
        setExpand(child, false)
      })
    }
  }
}

export function refreshIds(data: NodeObj) {
  data.id = generateUUID()
  if (data.children) {
    for (let i = 0; i < data.children.length; i++) {
      refreshIds(data.children[i])
    }
  }
}

export const throttle = <T extends (...args: never[]) => void>(fn: T, wait: number) => {
  let pre = Date.now()
  return function (...args: Parameters<T>) {
    const now = Date.now()
    if (now - pre < wait) return
    fn(...args)
    pre = Date.now()
  }
}

export function getArrowPoints(p3x: number, p3y: number, p4x: number, p4y: number) {
  // Calculate the direction vector from p3 (control point) to p4 (end point)
  const deltax = p4x - p3x
  const deltay = p4y - p3y

  // Use atan2 to get the angle directly, which handles all quadrants correctly
  // atan2(y, x) returns angle in radians from -PI to PI
  const angleRad = Math.atan2(deltay, deltax)

  // Convert to degrees for easier understanding (optional, could work directly with radians)
  const angleDeg = (angleRad * 180) / Math.PI

  const arrowLength = 12
  const arrowAngle = 30

  // Calculate the two arrow head points
  // Subtract arrowAngle to get the two wing angles
  const a1Rad = ((angleDeg + 180 - arrowAngle) * Math.PI) / 180
  const a2Rad = ((angleDeg + 180 + arrowAngle) * Math.PI) / 180

  return {
    x1: p4x + Math.cos(a1Rad) * arrowLength,
    y1: p4y + Math.sin(a1Rad) * arrowLength,
    x2: p4x + Math.cos(a2Rad) * arrowLength,
    y2: p4y + Math.sin(a2Rad) * arrowLength,
  }
}

export function generateUUID(): string {
  return (new Date().getTime().toString(16) + Math.random().toString(16).substr(2)).substr(2, 16)
}

export const generateNewObj = function (this: MindElixirInstance): NodeObjExport {
  const id = generateUUID()
  return {
    topic: this.newTopicName,
    id,
  }
}

export function checkMoveValid(from: NodeObj, to: NodeObj) {
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

export function deepClone(obj: NodeObj) {
  const deepCloneObj = JSON.parse(
    JSON.stringify(obj, (k, v) => {
      if (k === 'parent') return undefined
      return v
    })
  )
  return deepCloneObj
}

export const getOffsetLT = (parent: HTMLElement, child: HTMLElement) => {
  let offsetLeft = 0
  let offsetTop = 0
  while (child && child !== parent) {
    offsetLeft += child.offsetLeft
    offsetTop += child.offsetTop
    child = child.offsetParent as HTMLElement
  }
  return { offsetLeft, offsetTop }
}

export const setAttributes = (el: HTMLElement | SVGElement, attrs: { [key: string]: string }) => {
  for (const key in attrs) {
    el.setAttribute(key, attrs[key])
  }
}

export const isTopic = (target?: HTMLElement): target is Topic => {
  return target ? target.tagName === 'ME-TPC' : false
}

export const unionTopics = (nodes: Topic[]) => {
  return nodes
    .filter(node => node.nodeObj.parent)
    .filter((node, _, nodes) => {
      for (let i = 0; i < nodes.length; i++) {
        if (node === nodes[i]) continue
        const { parent } = node.nodeObj
        if (parent === nodes[i].nodeObj) {
          return false
        }
      }
      return true
    })
}

export const unionNodeObjs = (nodes: NodeObj[]) => {
  return nodes
    .filter(node => node.parent)
    .filter((node, _, nodes) => {
      for (let i = 0; i < nodes.length; i++) {
        if (node === nodes[i]) continue
        const { parent } = node
        if (parent === nodes[i]) {
          return false
        }
      }
      return true
    })
}

export const getTranslate = (styleText: string) => {
  // use translate3d for GPU acceleration
  const regex = /translate3d\(([^,]+),\s*([^,]+)/
  const match = styleText.match(regex)
  return match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : { x: 0, y: 0 }
}

export const on = function (
  list: {
    [K in keyof GlobalEventHandlersEventMap]: {
      dom: EventTarget
      evt: K
      func: (this: EventTarget, ev: GlobalEventHandlersEventMap[K]) => void
    }
  }[keyof GlobalEventHandlersEventMap][]
) {
  for (let i = 0; i < list.length; i++) {
    const { dom, evt, func } = list[i]
    dom.addEventListener(evt, func as EventListener)
  }
  return function off() {
    for (let i = 0; i < list.length; i++) {
      const { dom, evt, func } = list[i]
      dom.removeEventListener(evt, func as EventListener)
    }
  }
}

export const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y
  return Math.sqrt(dx * dx + dy * dy)
}
