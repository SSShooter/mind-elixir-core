import type { NodeObj, LinkItem } from './index'

export interface Wrapper extends HTMLElement {
  firstChild: Parent
  parentNode: Children
  parentElement: Children
  offsetParent: Wrapper
  previousSibling: Wrapper | null
  nextSibling: Wrapper | null
}

export interface Parent extends HTMLElement {
  firstChild: Topic
  parentNode: Wrapper
  parentElement: Wrapper
  nextSibling: Children
  offsetParent: Wrapper
}

export type Root = Parent

export interface Children extends HTMLElement {
  parentNode: Wrapper
  parentElement: Wrapper
  firstChild: Wrapper
  previousSibling: Parent
}

export interface Topic extends HTMLElement {
  nodeObj: NodeObj
  linkContainer: HTMLElement | null
  parentNode: Parent
  parentElement: Parent
  offsetParent: Parent
}

export interface Expander extends HTMLElement {
  expanded?: boolean
  parentNode: Parent
  parentElement: Parent
  previousSibling: Topic
}

export type CustomLine = SVGPathElement
export type CustomArrow = SVGPathElement
export interface CustomSvg extends SVGGElement {
  linkObj?: LinkItem
  // children: [CustomLine, CustomArrow]
}
