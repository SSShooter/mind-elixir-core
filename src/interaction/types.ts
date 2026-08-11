import type MindElixir from '../index'
import type { PointerTracker } from './pointerTracker'
import type { ButtonPolicy } from './buttonPolicy'
import type { ContextMenuGuard } from './contextMenuGuard'

export const InteractionState = {
  Idle: 'idle',
  Pinch: 'pinch',
  BoxSelect: 'box-select',
  MapPan: 'map-pan',
  NodeDrag: 'node-drag',
  NodeDragWait: 'node-drag-wait',
  ControlPointDrag: 'control-point-drag',
} as const

export type InteractionState = (typeof InteractionState)[keyof typeof InteractionState]

export interface ControlPointDragSource {
  element: HTMLElement
  onStart?: (event: PointerEvent) => void
  onMove: (deltaX: number, deltaY: number, event: PointerEvent) => void
  onEnd?: () => void
  onCancel?: () => void
}

export interface InteractionContext {
  mind: MindElixir
  tracker: PointerTracker
  buttons: ButtonPolicy
  contextMenu: ContextMenuGuard
  switchToMapPan(event: PointerEvent): void
}

export interface Gesture {
  readonly state: Exclude<InteractionState, 'idle'>
  readonly moved: boolean
  start(event: PointerEvent): boolean | void
  move(event: PointerEvent): void
  end(event: PointerEvent): void
  cancel(): void
}
