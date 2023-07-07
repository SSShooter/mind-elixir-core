const Bus = {
  create() {
    return {
      handlers: {} as Record<string, ((...arg: any[]) => void)[]>,
      showHandler: function () {
        console.log(this.handlers)
      },
      addListener: function (type: string, handler: (...arg: any[]) => void) {
        if (this.handlers[type] === undefined) this.handlers[type] = []
        this.handlers[type].push(handler)
      },
      fire: function (type: string, ...payload: any[]) {
        if (this.handlers[type] instanceof Array) {
          const handlers = this.handlers[type]
          for (let i = 0; i < handlers.length; i++) {
            handlers[i](...payload)
          }
        }
      },
      removeListener: function (type: string, handler: (...arg: any[]) => void) {
        if (!this.handlers[type]) return
        const handlers = this.handlers[type]
        if (!handler) {
          handlers.length = 0
        } else if (handlers.length) {
          for (let i = 0; i < handlers.length; i++) {
            if (handlers[i] === handler) {
              this.handlers[type].splice(i, 1)
            }
          }
        }
      },
    }
  },
}

export default Bus
