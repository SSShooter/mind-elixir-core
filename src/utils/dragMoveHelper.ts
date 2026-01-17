import type { MindElixirInstance } from '../types/index'

export function createDragMoveHelper(mei: MindElixirInstance) {
  return {
    x: 0,
    y: 0,
    moved: false, // diffrentiate click and move
    mousedown: false,
    onMove(deltaX: number, deltaY: number) {
      if (this.mousedown) {
        this.moved = true
        mei.move(deltaX, deltaY)
      }
    },
    clear() {
      this.mousedown = false
    },
  }
}
