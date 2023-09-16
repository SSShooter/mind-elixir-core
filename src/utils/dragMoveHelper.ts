export default {
  moved: false, // diffrentiate click and move
  mousedown: false,
  lastX: 0,
  lastY: 0,
  onMove(e: MouseEvent, container: HTMLElement) {
    if (this.mousedown) {
      this.moved = true
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
    this.moved = false
    this.mousedown = false
    this.lastX = 0
    this.lastY = 0
  },
}
