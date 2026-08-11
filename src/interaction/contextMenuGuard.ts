export class ContextMenuGuard {
  private suppressedUntil = 0
  private timer: number | null = null

  private readonly preventNext = (event: Event) => {
    if (Date.now() > this.suppressedUntil) {
      this.clearListener()
      return
    }
    event.preventDefault()
    // Keep the suppression window alive so the controller's delayed context
    // menu check also observes that this gesture was a drag.
    window.removeEventListener('contextmenu', this.preventNext, true)
  }

  suppress(duration = 500): void {
    this.suppressedUntil = Date.now() + duration
    window.addEventListener('contextmenu', this.preventNext, true)
    if (this.timer !== null) window.clearTimeout(this.timer)
    this.timer = window.setTimeout(() => this.clearListener(), duration)
  }

  isSuppressed(): boolean {
    return Date.now() < this.suppressedUntil
  }

  clear(): void {
    this.suppressedUntil = 0
    this.clearListener()
  }

  destroy(): void {
    this.clear()
  }

  private clearListener(): void {
    window.removeEventListener('contextmenu', this.preventNext, true)
    if (this.timer !== null) {
      window.clearTimeout(this.timer)
      this.timer = null
    }
  }
}
