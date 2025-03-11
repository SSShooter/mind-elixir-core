import type { MindElixirInstance } from '../types/index'

export default {
  moved: false, // diffrentiate click and move
  mousedown: false,
  onMove(e: MouseEvent, mind: MindElixirInstance) {
    if (this.mousedown) {
      this.moved = true
      const deltaX = e.movementX
      const deltaY = e.movementY
      const { container, map, scaleVal } = mind
      let scrollLeft = container.scrollLeft - deltaX
      let scrollTop = container.scrollTop - deltaY
      if (scaleVal < 1) {
        const minScrollLeft = (container.scrollWidth - map.clientWidth * scaleVal) / 2
        const minScrollTop = (container.scrollHeight - map.clientHeight * scaleVal) / 2
        scrollLeft = Math.max(minScrollLeft, Math.min(container.scrollHeight - minScrollLeft, scrollLeft))
        scrollTop = Math.max(minScrollTop, Math.min(container.scrollWidth - minScrollTop, scrollTop))
      }
      container.scrollTo(scrollLeft, scrollTop)
    }
  },
  clear() {
    // delay to avoid trigger contextmenu
    setTimeout(() => {
      this.moved = false
      this.mousedown = false
    }, 0)
  },
}
