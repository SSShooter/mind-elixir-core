import { getTranslate } from '.'
import type { MindElixirInstance } from '../types/index'

export const handleMove = function (mind: MindElixirInstance, dx: number, dy: number) {
  const { map, scaleVal } = mind
  const transform = map.style.transform
  const { x, y } = getTranslate(transform)
  const newTranslateX = x + dx
  const newTranslateY = y + dy
  mind.map.style.transform = `translate(${newTranslateX}px, ${newTranslateY}px) scale(${scaleVal})`
}
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
      handleMove(mind, deltaX, deltaY)
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
