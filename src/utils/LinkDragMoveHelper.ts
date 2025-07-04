import { on } from '.'

const create = function (dom: HTMLElement) {
  return {
    dom,
    moved: false, // differentiate click and move
    pointerdown: false,
    lastX: 0,
    lastY: 0,
    handlePointerMove(e: PointerEvent) {
      if (this.pointerdown) {
        this.moved = true
        // Calculate delta manually since pointer events don't have movementX/Y
        const deltaX = e.clientX - this.lastX
        const deltaY = e.clientY - this.lastY
        this.lastX = e.clientX
        this.lastY = e.clientY
        this.cb && this.cb(deltaX, deltaY)
      }
    },
    handlePointerDown(e: PointerEvent) {
      if (e.button !== 0) return
      this.pointerdown = true
      this.lastX = e.clientX
      this.lastY = e.clientY
      // Set pointer capture for better tracking
      this.dom.setPointerCapture(e.pointerId)
    },
    handleClear(e: PointerEvent) {
      this.pointerdown = false
      // Release pointer capture
      if (e.pointerId !== undefined) {
        this.dom.releasePointerCapture(e.pointerId)
      }
    },
    cb: null as ((deltaX: number, deltaY: number) => void) | null,
    init(map: HTMLElement, cb: (deltaX: number, deltaY: number) => void) {
      this.cb = cb
      this.handleClear = this.handleClear.bind(this)
      this.handlePointerMove = this.handlePointerMove.bind(this)
      this.handlePointerDown = this.handlePointerDown.bind(this)
      this.destroy = on([
        { dom: map, evt: 'pointermove', func: this.handlePointerMove },
        { dom: map, evt: 'pointerleave', func: this.handleClear },
        { dom: map, evt: 'pointerup', func: this.handleClear },
        { dom: this.dom, evt: 'pointerdown', func: this.handlePointerDown },
      ])
    },
    destroy: null as (() => void) | null,
    clear() {
      this.moved = false
      this.pointerdown = false
    },
  }
}
const LinkDragMoveHelper = {
  create,
}

export type LinkDragMoveHelperInstance = ReturnType<typeof create>
export default LinkDragMoveHelper
