import type { Arrow } from '../arrow'
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
  children: HTMLCollection & [Topic, Expander | undefined]
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
  parentNode: Parent
  parentElement: Parent
  offsetParent: Parent

  text: HTMLSpanElement
  expander?: Expander

  linkContainer?: HTMLElement
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
  arrowObj: Arrow
  children: HTMLCollection & [CustomLine, CustomArrow, SVGTextElement]
}
