import { on } from '.'

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
      this.destory = on([
        { dom: map, evt: 'mousemove', func: this.handleMouseMove },
        { dom: map, evt: 'mouseleave', func: this.handleClear },
        { dom: map, evt: 'mouseup', func: this.handleClear },
        { dom: this.dom, evt: 'mousedown', func: this.handleMouseDown },
      ])
    },
    destory: null as (() => void) | null,
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
