// helper for custom link

import type { LinkDragMoveHelperInstance } from '../types/index'

const create = function (dom: HTMLElement): LinkDragMoveHelperInstance {
  return {
    dom,
    mousedown: false,
    lastX: 0,
    lastY: 0,
    handleMouseMove(e) {
      e.stopPropagation()
      if (this.mousedown) {
        if (!this.lastX) {
          this.lastX = e.pageX
          this.lastY = e.pageY
          return
        }
        const deltaX = this.lastX - e.pageX
        const deltaY = this.lastY - e.pageY
        this.cb && this.cb(deltaX, deltaY)
        this.lastX = e.pageX
        this.lastY = e.pageY
      }
    },
    handleMouseDown(e) {
      e.stopPropagation()
      this.mousedown = true
    },
    handleClear(e) {
      e.stopPropagation()
      this.clear()
    },
    cb: null,
    init(map, cb) {
      this.cb = cb
      this.handleClear = this.handleClear.bind(this)
      this.handleMouseMove = this.handleMouseMove.bind(this)
      this.handleMouseDown = this.handleMouseDown.bind(this)
      map.addEventListener('mousemove', this.handleMouseMove)
      map.addEventListener('mouseleave', this.handleClear)
      map.addEventListener('mouseup', this.handleClear)
      this.dom.addEventListener('mousedown', this.handleMouseDown)
    },
    destory(map) {
      map.removeEventListener('mousemove', this.handleMouseMove)
      map.removeEventListener('mouseleave', this.handleClear)
      map.removeEventListener('mouseup', this.handleClear)
      this.dom.removeEventListener('mousedown', this.handleMouseDown)
    },
    clear() {
      this.mousedown = false
      this.lastX = 0
      this.lastY = 0
    },
  }
}
const LinkDragMoveHelper = {
  create,
}

export default LinkDragMoveHelper
