export {}
declare global {
  interface Element {
    setAttribute(name: string, value: boolean): void
    setAttribute(name: string, value: number): void
  }
}
