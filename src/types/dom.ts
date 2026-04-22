import type { Arrow } from '../arrow'
import type { Summary } from '../summary'
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

  link?: HTMLElement
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

export interface ArrowSvg extends SVGGElement {
  arrowObj: Arrow
  labelEl?: HTMLDivElement
  line: SVGPathElement
  arrow1: SVGPathElement
  arrow2: SVGPathElement
}

export interface SummarySvg extends SVGGElement {
  summaryObj: Summary
  labelEl?: HTMLDivElement
}
