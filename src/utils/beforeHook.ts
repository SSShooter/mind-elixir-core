import type { MindElixirInstance } from '../types/index'

export default function beforeHook(fn: (...arg: any[]) => void, fnName: string) {
  return async function (this: MindElixirInstance, ...args: unknown[]) {
    const hook = this.before[fnName]
    if (hook) {
      await hook.apply(this, args)
    }
    fn.apply(this, args)
  }
}
