import { NodeObj } from "./mind-elixir.interface"

export interface Element {
  setAttribute(name: string, value: boolean): void
  setAttribute(name: string, value: number): void
}

export interface Wrapper extends HTMLElement { 
  offsetParent: Wrapper | null
}

export interface Parent extends HTMLElement {
  parentNode: Wrapper
  parentElement: Wrapper
  nextSibling: Children
}

export interface Children extends HTMLElement {
  parentNode: Wrapper
  parentElement: Wrapper
  previousSibling: Parent
}

export interface Topic extends HTMLElement {
  nodeObj?: NodeObj
  linkContainer?: HTMLElement
  parentNode: Parent
  parentElement: Parent
}

export interface Expander extends HTMLElement {
  expanded?: boolean
  parentNode: Parent
  parentElement: Parent
}

export interface CustomSvg extends SVGElement {
  linkObj?: object
}
