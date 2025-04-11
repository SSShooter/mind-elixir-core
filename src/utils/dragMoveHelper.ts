import { getTranslate } from '.'
import type { MindElixirInstance } from '../types/index'

export default {
  moved: false, // diffrentiate click and move
  mousedown: false,
  onMove(e: MouseEvent, mind: MindElixirInstance) {
    if (this.mousedown) {
      this.moved = true
      const deltaX = e.movementX
      const deltaY = e.movementY
      const { map, scaleVal } = mind
      const transform = map.style.transform
      const { x, y } = getTranslate(transform)
      const newTranslateX = x + deltaX
      const newTranslateY = y + deltaY
      mind.map.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px) scale(${scaleVal})`
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
