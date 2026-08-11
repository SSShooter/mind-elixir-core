import type MindElixir from '../index'

export class ButtonPolicy {
  constructor(private readonly mind: MindElixir) {}

  get selectionButton(): 0 | 2 {
    return this.mind.mouseSelectionButton
  }

  get panButton(): 0 | 2 {
    return this.selectionButton === 0 ? 2 : 0
  }

  isMouse(event: PointerEvent): boolean {
    return event.pointerType === 'mouse'
  }

  canSelect(event: PointerEvent): boolean {
    return this.isMouse(event) && event.button === this.selectionButton
  }

  canPan(event: PointerEvent): boolean {
    if (event.pointerType === 'touch') return true
    if (!this.isMouse(event)) return false
    if (this.mind.spacePressed && event.button === 0) return true
    return !this.mind.editable || event.button === this.panButton
  }

  isPrimary(event: PointerEvent): boolean {
    return event.pointerType === 'touch' || event.button === 0
  }
}
