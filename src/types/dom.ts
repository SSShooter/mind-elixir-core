import type { LinkItem } from '../customLink'
import type { NodeObj } from './index'

export interface Wrapper extends HTMLElement {
  firstChild: Parent
  children: HTMLCollection & [Parent, Children]
  parentNode: Children
  parentElement: Children
  offsetParent: Wrapper
  previousSibling: Wrapper | null
  nextSibling: Wrapper | null
}

export interface Parent extends HTMLElement {
  firstChild: Topic
  children: HTMLCollection & [Topic, Expander]
  parentNode: Wrapper
  parentElement: Wrapper
  nextSibling: Children
  offsetParent: Wrapper
}

export interface Children extends HTMLElement {
  parentNode: Wrapper
  children: HTMLCollection & Wrapper[]
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

  expander?: Expander
  image?: HTMLImageElement
  icons?: HTMLSpanElement
  tags?: HTMLDivElement
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
  linkObj: LinkItem
  children: HTMLCollection & [CustomLine, CustomArrow, SVGTextElement]
}
