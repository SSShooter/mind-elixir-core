/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyFunction = (...args: any[]) => any
type EventMap = Record<string, AnyFunction>

export class EventTarget<Events extends EventMap> {
  private readonly _listeners = new Map<keyof Events, Set<AnyFunction>>()

  public addEventListener<K extends keyof Events>(event: K, cb: Events[K]): this {
    const set = this._listeners.get(event) ?? new Set()
    this._listeners.set(event, set)
    set.add(cb as AnyFunction)
    return this
  }

  public removeEventListener<K extends keyof Events>(event: K, cb: Events[K]): this {
    this._listeners.get(event)?.delete(cb as AnyFunction)
    return this
  }

  public dispatchEvent<K extends keyof Events>(event: K, ...data: Parameters<Events[K]>): boolean {
    let ok = true
    for (const cb of this._listeners.get(event) ?? []) {
      ok = cb(...data) !== false && ok
    }

    return ok
  }

  public unbindAllListeners(): void {
    this._listeners.clear()
  }

  // Let's also support on, off and emit like node
  public on = this.addEventListener
  public off = this.removeEventListener
  public emit = this.dispatchEvent
}
