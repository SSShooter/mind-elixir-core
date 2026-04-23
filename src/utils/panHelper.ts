import type { MindElixirInstance } from '../types/index'

export function createPanHelper(mei: MindElixirInstance) {
  return {
    x: 0,
    y: 0,
    moved: false, // differentiate click and move
    mousedown: false,
    handlePointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement
      const mouseMoveButton = mei.mouseSelectionButton === 0 ? 2 : 0

      // Support space + left mouse button drag
      const isSpaceDrag = mei.spacePressed && e.button === 0 && e.pointerType === 'mouse'
      // both button can be used to drag in readonly mode
      const isNormalDrag = !mei.editable || (e.button === mouseMoveButton && e.pointerType === 'mouse') || e.pointerType === 'touch'

      if (!isSpaceDrag && !isNormalDrag) return

      this.x = e.clientX
      this.y = e.clientY

      if (target.className !== 'circle' && target.contentEditable !== 'plaintext-only') {
        this.mousedown = true
        this.moved = false
        target.setPointerCapture(e.pointerId)
      }
    },
    handlePointerMove(e: PointerEvent) {
      if (!this.mousedown) return false
      if ((e.target as HTMLElement).contentEditable === 'plaintext-only' && !mei.spacePressed) return false

      const movementX = e.clientX - this.x
      const movementY = e.clientY - this.y

      this.x = e.clientX
      this.y = e.clientY

      this.moved = true
      mei.move(movementX, movementY)
      return true
    },
    handlePointerUp(e: PointerEvent) {
      if (!this.mousedown) return
      const target = e.target as HTMLElement
      if (target.hasPointerCapture && target.hasPointerCapture(e.pointerId)) {
        target.releasePointerCapture(e.pointerId)
      }
      this.clear()
    },
    clear() {
      this.mousedown = false
    },
  }
}
