import type SelectionArea from './index'
import type { Intersection } from './utils/intersects'
import type { Trigger } from './utils/matchesTrigger'

export type DeepPartial<T> = T extends unknown[] ? T : T extends HTMLElement ? T : { [P in keyof T]?: DeepPartial<T[P]> }

export type Quantify<T> = T[] | T

export interface ScrollEvent extends MouseEvent {
  deltaY: number
  deltaX: number
}

export interface ChangedElements {
  added: Element[]
  removed: Element[]
}

export interface SelectionStore {
  touched: Element[]
  stored: Element[]
  selected: Element[]
  changed: ChangedElements
}

export interface SelectionEvent {
  event: MouseEvent | TouchEvent | null
  store: SelectionStore
  selection: SelectionArea
}

export type SelectionEvents = {
  beforestart: (e: SelectionEvent) => boolean | void
  beforedrag: (e: SelectionEvent) => boolean | void
  start: (e: SelectionEvent) => void
  move: (e: SelectionEvent) => void
  stop: (e: SelectionEvent) => void
}

export type AreaLocation = {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface Coordinates {
  x: number
  y: number
}

export type TapMode = 'touch' | 'native'
export type OverlapMode = 'keep' | 'drop' | 'invert'

export interface Scrolling {
  speedDivider: number
  manualSpeed: number
  startScrollMargins: { x: number; y: number }
}

export interface SingleTap {
  allow: boolean
  intersect: TapMode
}

export interface Features {
  deselectOnBlur: boolean
  singleTap: SingleTap
  range: boolean
  touch: boolean
}

export interface Behaviour {
  intersect: Intersection
  startThreshold: number | Coordinates
  overlap: OverlapMode
  scrolling: Scrolling
  triggers: Trigger[]
}

export interface SelectionOptions {
  selectionAreaClass: string
  selectionContainerClass: string | undefined
  container: Quantify<string | HTMLElement>

  document: Document
  selectables: Quantify<string>

  startAreas: Quantify<string | HTMLElement>
  boundaries: Quantify<string | HTMLElement>

  behaviour: Behaviour
  features: Features
  mindElixirInstance?: any // MindElixir instance for custom scrolling
}

export type PartialSelectionOptions = DeepPartial<Omit<SelectionOptions, 'document'>> & {
  document?: Document
}
