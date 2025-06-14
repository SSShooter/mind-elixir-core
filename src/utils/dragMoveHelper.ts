import type { MindElixirInstance } from '../types/index'

export function createDragMoveHelper(mei: MindElixirInstance) {
  return {
    x: 0,
    y: 0,
    moved: false, // diffrentiate click and move
    mousedown: false,
    onMove(e: MouseEvent) {
      if (this.mousedown) {
        this.moved = true
        const deltaX = e.movementX
        const deltaY = e.movementY
        mei.move(deltaX, deltaY)
      }
    },
    clear() {
      this.mousedown = false
      mei.map.style.transition = 'transform 0.3s'
    },
  }
}
