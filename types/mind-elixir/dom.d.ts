interface Element {
  setAttribute(name: string, value: boolean): void
  setAttribute(name: string, value: number): void
}

type Wrapper = HTMLElement
type Parent = HTMLElement
type Children = HTMLElement

interface Topic extends HTMLElement {
  nodeObj?: NodeObj
  linkContainer?: HTMLElement
}

interface Expander extends HTMLElement {
  expanded?: boolean
}

interface CustomSvg extends SVGElement {
  linkObj?: object
}

