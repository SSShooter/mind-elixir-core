const create = function (dom: HTMLElement) {
  return {
    dom,
    moved: false, // diffrentiate click and move
    mousedown: false,
    handleMouseMove(e: MouseEvent) {
      if (this.mousedown) {
        this.moved = true
        this.cb && this.cb(e.movementX, e.movementY)
      }
    },
    handleMouseDown(e: MouseEvent) {
      // e.stopPropagation()
      if (e.button !== 0) return
      this.mousedown = true
    },
    handleClear(e: MouseEvent) {
      // e.stopPropagation()
      // this.clear()
      this.mousedown = false
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
      this.moved = false
      this.mousedown = false
    },
  }
}
const LinkDragMoveHelper = {
  create,
}

export type LinkDragMoveHelperInstance = ReturnType<typeof create>
export default LinkDragMoveHelper
