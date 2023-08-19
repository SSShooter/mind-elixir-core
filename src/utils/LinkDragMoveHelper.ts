const create = function (dom: HTMLElement) {
  return {
    dom,
    mousedown: false,
    lastX: 0,
    lastY: 0,
    handleMouseMove(e: MouseEvent) {
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
    handleMouseDown(e: MouseEvent) {
      e.stopPropagation()
      this.mousedown = true
    },
    handleClear(e: MouseEvent) {
      e.stopPropagation()
      this.clear()
    },
    cb: null as ((deltaX: number, deltaY: number) => void) | null,
    init(map: HTMLElement, cb: (deltaX: number, deltaY: number) => void) {
      this.cb = cb
      this.handleClear = this.handleClear.bind(this)
      this.handleMouseMove = this.handleMouseMove.bind(this)
      this.handleMouseDown = this.handleMouseDown.bind(this)
      map.addEventListener('mousemove', this.handleMouseMove)
      map.addEventListener('mouseleave', this.handleClear)
      map.addEventListener('mouseup', this.handleClear)
      this.dom.addEventListener('mousedown', this.handleMouseDown)
    },
    destory(map: HTMLElement) {
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

export type LinkDragMoveHelperInstance = ReturnType<typeof create>
export default LinkDragMoveHelper
