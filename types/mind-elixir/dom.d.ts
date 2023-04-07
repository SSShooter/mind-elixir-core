interface Element {
  setAttribute(name: string, value: boolean): void
  setAttribute(name: string, value: number): void
}

interface Wrapper extends HTMLElement {
  parentElement: Children
}

interface Parent extends HTMLElement {
  parentElement: Wrapper
}

interface Children extends HTMLElement {
  parentElement: Wrapper
}

interface Topic extends HTMLElement {
  nodeObj?: NodeObj
  linkContainer?: HTMLElement
  parentElement: Parent
}

interface Expander extends HTMLElement {
  expanded?: boolean
  parentElement: Parent
}

interface CustomSvg extends SVGElement {
  linkObj?: object
}
