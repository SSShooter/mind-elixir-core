export default {
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
      const deltaX = this.lastX - e.pageX
      const deltaY = this.lastY - e.pageY
      container.scrollTo(container.scrollLeft + deltaX, container.scrollTop + deltaY)
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
