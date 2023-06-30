// helper for custom link
export default function LinkDragMoveHelper(dom) {
  this.dom = dom
  this.mousedown = false
  this.lastX = null
  this.lastY = null
}

LinkDragMoveHelper.prototype = {
  init(map, cb) {
    this.handleMouseMove = e => {
      e.stopPropagation()
      if (this.mousedown) {
        if (!this.lastX) {
          this.lastX = e.pageX
          this.lastY = e.pageY
          return
        }
        const deltaX = this.lastX - e.pageX
        const deltaY = this.lastY - e.pageY
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
  },
  destory(map) {
    map.removeEventListener('mousemove', this.handleMouseMove)
    map.removeEventListener('mouseleave', this.handleClear)
    map.removeEventListener('mouseup', this.handleClear)
    this.dom.removeEventListener('mousedown', this.handleMouseDown)
  },
  clear() {
    this.mousedown = false
    this.lastX = null
    this.lastY = null
  },
}
