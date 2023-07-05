interface Element {
  setAttribute(name: string, value: boolean): void
  setAttribute(name: string, value: number): void
}

interface Wrapper extends HTMLElement {
  firstChild: Parent
  parentNode: Children
  parentElement: Children
  offsetParent: Wrapper
  previousSibling: Wrapper | null
  nextSibling: Wrapper | null
}

interface Parent extends HTMLElement {
  firstChild: Topic
  parentNode: Wrapper
  parentElement: Wrapper
  nextSibling: Children
  offsetParent: Wrapper
}

type Root = Parent

interface Children extends HTMLElement {
  parentNode: Wrapper
  parentElement: Wrapper
  firstChild: Wrapper
  previousSibling: Parent
}

interface Topic extends HTMLElement {
  nodeObj: NodeObj
  linkContainer: HTMLElement | null
  parentNode: Parent
  parentElement: Parent
  offsetParent: Parent
}

interface Expander extends HTMLElement {
  expanded?: boolean
  parentNode: Parent
  parentElement: Parent
  previousSibling: Topic
}

interface CustomSvg extends SVGElement {
  linkObj?: object
}
