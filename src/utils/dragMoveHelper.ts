import type { MindElixirInstance } from '../types/index'

export default {
  x: 0,
  y: 0,
  moved: false, // diffrentiate click and move
  mousedown: false,
  onMove(e: MouseEvent, mind: MindElixirInstance) {
    if (this.mousedown) {
      this.moved = true
      const deltaX = e.movementX
      const deltaY = e.movementY
      mind.move(deltaX, deltaY)
    }
  },
  clear(mind: MindElixirInstance) {
    // delay to avoid trigger contextmenu
    setTimeout(() => {
      this.moved = false
      this.mousedown = false
      mind.map.style.transition = 'transform 0.3s'
    }, 0)
  },
}
