interface Element {
  setAttribute(name: string, value: boolean): void
  setAttribute(name: string, value: number): void
}

interface Wrapper extends HTMLElement {
  parentNode: Children
  parentElement: Children
  offsetParent: Wrapper
  nextSibling: Wrapper | undefined
}

interface Parent extends HTMLElement {
  parentNode: Wrapper
  parentElement: Wrapper
  nextSibling: Children
}

interface Children extends HTMLElement {
  parentNode: Wrapper
  parentElement: Wrapper
  previousSibling: Parent
}

interface Topic extends HTMLElement {
  nodeObj?: NodeObj
  linkContainer?: HTMLElement
  parentNode: Parent
  parentElement: Parent
}

interface Expander extends HTMLElement {
  expanded?: boolean
  parentNode: Parent
  parentElement: Parent
}

interface CustomSvg extends SVGElement {
  linkObj?: object
}
