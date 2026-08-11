export interface PointerPosition {
  id: number
  pointerType: PointerEvent['pointerType']
  startX: number
  startY: number
  x: number
  y: number
  target: EventTarget | null
}

export class PointerTracker {
  private readonly pointers = new Map<number, PointerPosition>()
  private readonly captures = new Map<number, HTMLElement>()

  begin(event: PointerEvent): PointerPosition {
    const position: PointerPosition = {
      id: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY,
      target: event.target,
    }
    this.pointers.set(event.pointerId, position)
    return position
  }

  update(event: PointerEvent): PointerPosition | undefined {
    const position = this.pointers.get(event.pointerId)
    if (!position) return
    position.x = event.clientX
    position.y = event.clientY
    return position
  }

  end(pointerId: number): void {
    this.release(pointerId)
    this.pointers.delete(pointerId)
  }

  get(pointerId: number): PointerPosition | undefined {
    return this.pointers.get(pointerId)
  }

  active(): PointerPosition[] {
    return [...this.pointers.values()]
  }

  delta(pointerId: number): { x: number; y: number } {
    const pointer = this.pointers.get(pointerId)
    if (!pointer) return { x: 0, y: 0 }
    return { x: pointer.x - pointer.startX, y: pointer.y - pointer.startY }
  }

  distance(pointerId: number): number {
    const { x, y } = this.delta(pointerId)
    return Math.hypot(x, y)
  }

  capture(element: HTMLElement, pointerId: number): void {
    if (!element.setPointerCapture) return
    element.setPointerCapture(pointerId)
    this.captures.set(pointerId, element)
  }

  release(pointerId: number): void {
    const element = this.captures.get(pointerId)
    if (element?.hasPointerCapture?.(pointerId)) {
      element.releasePointerCapture(pointerId)
    }
    this.captures.delete(pointerId)
  }

  cancel(): void {
    for (const [pointerId, element] of this.captures) {
      if (element.hasPointerCapture?.(pointerId)) {
        element.releasePointerCapture(pointerId)
      }
    }
    this.captures.clear()
    this.pointers.clear()
  }
}
