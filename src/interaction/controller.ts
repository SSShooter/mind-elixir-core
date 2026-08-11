import type MindElixir from '../index'
import type { ArrowSvg, Expander, SummarySvg, Topic } from '../types/dom'
import { getDistance, on } from '../utils'
import { handleWheelZoom } from '../plugin/keypress'
import {
  createNodeDragState,
  handleNodeDragCancel,
  handleNodeDragEnd,
  handleNodeDragMove,
  handleNodeDragStart,
  showDragGhost,
  type NodeDragState,
} from '../plugin/nodeDraggable'
import { ButtonPolicy } from './buttonPolicy'
import { ContextMenuGuard } from './contextMenuGuard'
import { PointerTracker } from './pointerTracker'
import { InteractionState, type ControlPointDragSource, type Gesture } from './types'

const MOVE_THRESHOLD = 5
const LONG_PRESS_DURATION = 500
const LONG_PRESS_MOVE_THRESHOLD = 10

type ControlPointSource = ControlPointDragSource & { pointerId?: number }

class MapPanGesture implements Gesture {
  readonly state = InteractionState.MapPan
  moved = false
  private lastX = 0
  private lastY = 0

  constructor(
    private readonly mind: MindElixir,
    private readonly tracker: PointerTracker,
    private readonly contextMenu: ContextMenuGuard,
    private readonly pointerId: number,
    private readonly target: HTMLElement
  ) {}

  start(event: PointerEvent) {
    this.lastX = event.clientX
    this.lastY = event.clientY
    this.tracker.capture(this.target, this.pointerId)
  }

  move(event: PointerEvent) {
    if (event.pointerId !== this.pointerId) return
    this.tracker.update(event)
    const dx = event.clientX - this.lastX
    const dy = event.clientY - this.lastY
    this.lastX = event.clientX
    this.lastY = event.clientY
    if (dx === 0 && dy === 0) return
    this.moved = true
    this.mind.move(dx, dy)
  }

  end(event: PointerEvent) {
    if (event.pointerId !== this.pointerId) return
    this.tracker.update(event)
    if (this.moved && event.button === 2 && event.pointerType === 'mouse' && this.mind.mouseSelectionButton === 0) {
      this.contextMenu.suppress()
    }
    this.tracker.release(this.pointerId)
  }

  cancel() {
    this.tracker.release(this.pointerId)
  }
}

class ControlPointGesture implements Gesture {
  readonly state = InteractionState.ControlPointDrag
  moved = false
  private lastX = 0
  private lastY = 0

  constructor(
    private readonly source: ControlPointSource,
    private readonly tracker: PointerTracker,
    private readonly pointerId: number
  ) {}

  start(event: PointerEvent) {
    this.lastX = event.clientX
    this.lastY = event.clientY
    this.source.pointerId = this.pointerId
    this.tracker.capture(this.source.element, this.pointerId)
    this.source.onStart?.(event)
  }

  move(event: PointerEvent) {
    if (event.pointerId !== this.pointerId) return
    this.tracker.update(event)
    const dx = event.clientX - this.lastX
    const dy = event.clientY - this.lastY
    this.lastX = event.clientX
    this.lastY = event.clientY
    if (dx === 0 && dy === 0) return
    this.moved = true
    this.source.onMove(dx, dy, event)
  }

  end(event: PointerEvent) {
    if (event.pointerId !== this.pointerId) return
    this.tracker.update(event)
    this.tracker.release(this.pointerId)
    if (this.moved) this.source.onEnd?.()
  }

  cancel() {
    this.tracker.release(this.pointerId)
    this.source.onCancel?.()
  }
}

class BoxSelectionGesture implements Gesture {
  readonly state = InteractionState.BoxSelect
  moved = false
  private startX = 0
  private startY = 0

  constructor(
    private readonly mind: MindElixir,
    private readonly tracker: PointerTracker,
    private readonly contextMenu: ContextMenuGuard,
    private readonly pointerId: number
  ) {}

  start(event: PointerEvent) {
    this.startX = event.clientX
    this.startY = event.clientY
    this.tracker.capture(this.mind.container, this.pointerId)
    this.mind.selection?.trigger(event, false)
  }

  move(event: PointerEvent) {
    if (event.pointerId !== this.pointerId) return
    this.tracker.update(event)
    this.mind.selection?.move(event)
    if (!this.moved && Math.hypot(event.clientX - this.startX, event.clientY - this.startY) > MOVE_THRESHOLD) {
      this.moved = true
      if (this.mind.mouseSelectionButton === 2) this.contextMenu.suppress()
    }
  }

  end(event: PointerEvent) {
    if (event.pointerId !== this.pointerId) return
    this.tracker.update(event)
    if (!this.moved && Math.hypot(event.clientX - this.startX, event.clientY - this.startY) > MOVE_THRESHOLD) {
      this.moved = true
    }
    if (this.moved && this.mind.mouseSelectionButton === 2) this.contextMenu.suppress()
    this.mind.selection?.stop(event)
    this.tracker.release(this.pointerId)
  }

  cancel() {
    this.mind.selection?.cancel()
    this.tracker.release(this.pointerId)
  }
}

class PinchGesture implements Gesture {
  readonly state = InteractionState.Pinch
  moved = false
  private lastDistance: number | null = null

  constructor(
    private readonly mind: MindElixir,
    private readonly tracker: PointerTracker
  ) {}

  start() {
    for (const pointer of this.tracker.active()) {
      this.tracker.capture(this.mind.container, pointer.id)
    }
    this.lastDistance = this.getDistance()
  }

  move(event: PointerEvent) {
    if (event.pointerType !== 'touch') return
    this.tracker.update(event)
    const pointers = this.tracker.active()
    if (pointers.length < 2) return
    const distance = this.getDistance()
    if (this.lastDistance && distance > 0) {
      const [first, second] = pointers
      this.mind.scale(this.mind.scaleVal * (distance / this.lastDistance), {
        x: (first.x + second.x) / 2,
        y: (first.y + second.y) / 2,
      })
      this.moved = true
    }
    this.lastDistance = distance
  }

  end(event: PointerEvent) {
    this.tracker.update(event)
    this.tracker.end(event.pointerId)
    if (this.tracker.active().length < 2) this.lastDistance = null
  }

  cancel() {
    this.tracker.cancel()
    this.lastDistance = null
  }

  private getDistance() {
    const pointers = this.tracker.active()
    if (pointers.length < 2) return 0
    return getDistance(pointers[0], pointers[1])
  }
}

class NodeDragGesture implements Gesture {
  readonly state = InteractionState.NodeDrag
  moved = false
  private readonly nodeState: NodeDragState
  private longPressTimer: number | null = null
  private lastX = 0
  private lastY = 0
  private pendingTouch = false

  constructor(
    private readonly mind: MindElixir,
    private readonly tracker: PointerTracker,
    private readonly pointerId: number,
    private readonly target: Topic,
    private readonly switchToMapPan: (event: PointerEvent) => void
  ) {
    this.nodeState = createNodeDragState(mind)
  }

  start(event: PointerEvent) {
    if (!handleNodeDragStart(this.mind, this.nodeState, event, false)) return false
    this.lastX = event.clientX
    this.lastY = event.clientY
    this.pendingTouch = event.pointerType === 'touch'
    this.tracker.capture(this.target, this.pointerId)

    if (this.pendingTouch) {
      this.longPressTimer = window.setTimeout(() => {
        this.longPressTimer = null
        this.pendingTouch = false
        showDragGhost(this.mind, this.nodeState)
      }, LONG_PRESS_DURATION)
    }
    return true
  }

  move(event: PointerEvent) {
    if (event.pointerId !== this.pointerId) return
    this.tracker.update(event)

    if (this.pendingTouch) {
      const distance = Math.hypot(event.clientX - this.lastX, event.clientY - this.lastY)
      if (distance > LONG_PRESS_MOVE_THRESHOLD) {
        this.clearLongPress()
        handleNodeDragCancel(this.mind, this.nodeState)
        this.switchToMapPan(event)
      }
      return
    }

    handleNodeDragMove(this.mind, this.nodeState, event)
    this.moved = this.nodeState.isDragging
  }

  end(event: PointerEvent) {
    if (event.pointerId !== this.pointerId) return
    this.tracker.update(event)
    this.clearLongPress()
    if (this.nodeState.pointerId !== null) {
      handleNodeDragEnd(this.mind, this.nodeState, event)
    }
    this.tracker.release(this.pointerId)
  }

  cancel() {
    this.clearLongPress()
    if (this.nodeState.pointerId !== null) {
      handleNodeDragCancel(this.mind, this.nodeState)
    }
    this.tracker.release(this.pointerId)
  }

  private clearLongPress() {
    if (this.longPressTimer !== null) {
      window.clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
  }
}

export class InteractionController {
  readonly tracker = new PointerTracker()
  readonly buttons: ButtonPolicy
  readonly contextMenu = new ContextMenuGuard()
  private activeGesture: Gesture | null = null
  private readonly controlPoints = new Map<HTMLElement, ControlPointSource>()
  private ignoreNextClick = false
  private lastEditAt = 0
  private lastTap = 0
  private lastTapTarget: EventTarget | null = null
  private nodeToDeselect: Topic | null = null
  private readonly off: (() => void) | null

  constructor(
    private readonly mind: MindElixir,
    enabled = true
  ) {
    this.buttons = new ButtonPolicy(mind)
    this.off = enabled ? this.bind() : null
  }

  get state(): InteractionState {
    return this.activeGesture?.state ?? InteractionState.Idle
  }

  get moved(): boolean {
    return this.activeGesture?.moved ?? false
  }

  registerControlPoint(source: ControlPointDragSource): () => void {
    this.controlPoints.set(source.element, source)
    return () => this.unregisterControlPoint(source.element)
  }

  unregisterControlPoint(element: HTMLElement): void {
    this.controlPoints.delete(element)
  }

  pointerDown(event: PointerEvent): void {
    if (event.pointerType === 'touch' && this.activeGesture && this.activeGesture.state !== InteractionState.Pinch) {
      this.tracker.begin(event)
      this.cancelActive()
      this.startGesture(new PinchGesture(this.mind, this.tracker), event)
      return
    }

    if (this.activeGesture) return

    this.tracker.begin(event)

    if (event.pointerType === 'touch' && this.tracker.active().length >= 2) {
      this.startGesture(new PinchGesture(this.mind, this.tracker), event)
      return
    }

    const controlPoint = this.findControlPoint(event.target)
    if (controlPoint && event.button === 0 && event.pointerType === 'mouse') {
      this.startGesture(new ControlPointGesture(controlPoint, this.tracker, event.pointerId), event)
      return
    }

    const target = this.topicTarget(event.target)
    if (this.mind.editable && event.pointerType === 'mouse' && this.buttons.canSelect(event) && event.target === this.mind.container) {
      this.startGesture(new BoxSelectionGesture(this.mind, this.tracker, this.contextMenu, event.pointerId), event)
      return
    }

    if (this.buttons.isPrimary(event) && target) {
      this.prepareTopicSelection(target, event)
      if (this.mind.editable && !this.mind.spacePressed && target.nodeObj.parent) {
        const gesture = new NodeDragGesture(this.mind, this.tracker, event.pointerId, target, e => this.switchToMapPan(e))
        if (gesture.start(event)) {
          this.activeGesture = gesture
          return
        }
      }
    }

    if (this.buttons.isPrimary(event) && this.handleSvgLabelInteraction(event.target as HTMLElement, false)) {
      return
    }

    if (this.buttons.canPan(event)) {
      this.startGesture(new MapPanGesture(this.mind, this.tracker, this.contextMenu, event.pointerId, event.target as HTMLElement), event)
    }
  }

  pointerMove(event: PointerEvent): void {
    this.tracker.update(event)
    this.activeGesture?.move(event)
  }

  pointerUp(event: PointerEvent): void {
    const gesture = this.activeGesture
    const pointerTarget = this.tracker.get(event.pointerId)?.target ?? event.target
    const moved = gesture?.moved ?? false

    if (gesture) {
      gesture.end(event)
      this.ignoreNextClick = moved
      if (this.activeGesture === gesture && (gesture.state !== InteractionState.Pinch || this.tracker.active().length < 2)) {
        this.activeGesture = null
      }
    }

    this.tracker.end(event.pointerId)

    if (event.pointerType === 'mouse' && event.button === 0) {
      const tapTarget = this.topicTarget(pointerTarget) || pointerTarget
      const now = Date.now()
      if (now - this.lastTap < 300 && now - this.lastTap > 0 && this.lastTapTarget === tapTarget) {
        this.doubleClick(event, pointerTarget)
        this.lastTap = 0
        this.lastTapTarget = null
      } else {
        this.lastTap = now
        this.lastTapTarget = tapTarget
      }
    } else {
      this.lastTap = 0
      this.lastTapTarget = null
    }

    if (this.nodeToDeselect && !moved) {
      this.mind.selection?.deselect(this.nodeToDeselect)
    }
    this.nodeToDeselect = null
  }

  cancel(): void {
    this.cancelActive()
    this.tracker.cancel()
    this.contextMenu.clear()
    this.nodeToDeselect = null
  }

  click(event: MouseEvent): void {
    if (this.ignoreNextClick) {
      this.ignoreNextClick = false
      return
    }

    const target = event.target as HTMLElement
    if (this.nodeToDeselect && this.topicTarget(target) === this.nodeToDeselect) {
      this.mind.selection?.deselect(this.nodeToDeselect)
      this.nodeToDeselect = null
    }
    if (target.classList.contains('me-epd')) {
      const expander = target as Expander
      if (event.ctrlKey || event.metaKey) {
        this.mind.expandNodeAll(expander.previousSibling)
      } else {
        this.mind.expandNode(expander.previousSibling)
      }
    }
  }

  doubleClick(event: MouseEvent, targetOverride?: EventTarget | null): void {
    if (!this.mind.editable || Date.now() - this.lastEditAt < 100 || document.getElementById('input-box')) return
    this.lastEditAt = Date.now()
    const target = (targetOverride as HTMLElement | null) || (event.target as HTMLElement)
    const topic = this.topicTarget(target)
    if (topic) {
      this.mind.selectNode(topic)
      this.mind.beginEdit(topic)
      return
    }
    this.handleSvgLabelInteraction(target, true)
  }

  contextMenuEvent(event: MouseEvent): void {
    event.preventDefault()
    if (event.button !== 2 || !this.mind.editable) return
    window.setTimeout(() => {
      if (this.contextMenu.isSuppressed()) return
      if (this.activeGesture && this.activeGesture.state !== InteractionState.MapPan) return
      const target = event.target as HTMLElement
      const topic = this.topicTarget(target)
      if (topic && !topic.classList.contains('selected')) this.mind.selectNode(topic)
      this.mind.bus.fire('showContextMenu', event)
    }, 200)
  }

  wheel(event: WheelEvent): void {
    if (event.ctrlKey || event.metaKey) {
      event.stopPropagation()
      event.preventDefault()
      handleWheelZoom(this.mind, event)
      return
    }
    const moved = event.shiftKey ? this.mind.move(-event.deltaY, 0) : this.mind.move(-event.deltaX, -event.deltaY)
    if (moved) {
      event.stopPropagation()
      event.preventDefault()
    }
  }

  keyDown(event: KeyboardEvent): void {
    if (event.code === 'Space') {
      this.mind.spacePressed = true
      this.mind.container.classList.add('space-pressed')
    }
  }

  keyUp(event: KeyboardEvent): void {
    if (event.code === 'Space') {
      this.mind.spacePressed = false
      this.mind.container.classList.remove('space-pressed')
    }
  }

  destroy(): void {
    this.cancel()
    this.controlPoints.clear()
    this.contextMenu.destroy()
    this.off?.()
  }

  private bind(): () => void {
    return on([
      { dom: this.mind.container, evt: 'pointerdown', func: e => this.pointerDown(e) },
      { dom: this.mind.container, evt: 'pointermove', func: e => this.pointerMove(e) },
      { dom: this.mind.container, evt: 'pointerup', func: e => this.pointerUp(e) },
      { dom: this.mind.container, evt: 'pointercancel', func: () => this.cancel() },
      { dom: this.mind.container, evt: 'click', func: e => this.click(e) },
      { dom: this.mind.container, evt: 'dblclick', func: e => this.doubleClick(e) },
      { dom: this.mind.container, evt: 'contextmenu', func: e => this.contextMenuEvent(e) },
      { dom: this.mind.container, evt: 'wheel', func: e => (typeof this.mind.handleWheel === 'function' ? this.mind.handleWheel(e) : this.wheel(e)) },
      { dom: this.mind.container, evt: 'blur', func: () => this.cancel() },
      { dom: this.mind.container, evt: 'keydown', func: e => this.keyDown(e) },
      { dom: this.mind.container, evt: 'keyup', func: e => this.keyUp(e) },
    ])
  }

  private startGesture(gesture: Gesture, event: PointerEvent): void {
    if (this.activeGesture) this.cancelActive()
    this.activeGesture = gesture
    const started = gesture.start(event)
    if (started === false) this.activeGesture = null
  }

  private cancelActive(): void {
    if (!this.activeGesture) return
    this.activeGesture.cancel()
    this.activeGesture = null
  }

  private switchToMapPan(event: PointerEvent): void {
    this.cancelActive()
    if (!this.buttons.canPan(event)) return
    this.startGesture(new MapPanGesture(this.mind, this.tracker, this.contextMenu, event.pointerId, event.target as HTMLElement), event)
  }

  private topicTarget(target: EventTarget | null): Topic | null {
    const element = target as HTMLElement | null
    return (element?.closest('.me-tpc') as Topic | null) || null
  }

  private findControlPoint(target: EventTarget | null): ControlPointSource | undefined {
    const element = target as HTMLElement | null
    if (!element) return
    for (const [controlElement, source] of this.controlPoints) {
      if (element === controlElement || controlElement.contains(element)) return source
    }
  }

  private prepareTopicSelection(target: Topic, event: PointerEvent): void {
    this.mind.selection?.cancel()
    const nodes = this.mind.currentNodes || []
    const isMulti = event.ctrlKey || event.metaKey || this.mind.mobileMultiSelect

    if (isMulti) {
      if (nodes.includes(target)) {
        this.nodeToDeselect = target
        return
      }
      if (this.mind.currentArrow || this.mind.currentSummary) this.mind.clearSelection()
      this.mind.selection?.select(target)
    } else if (!nodes.includes(target)) {
      this.mind.selectNode(target)
    }
  }

  private handleSvgLabelInteraction(target: HTMLElement, isDoubleClick: boolean): boolean {
    if (target.closest('#input-box')) return false
    const label = target.closest<HTMLElement>('.svg-label')
    const container = target.closest<HTMLElement>('.topiclinks, .summary')
    const interaction = label
      ? { type: label.dataset.type, element: document.getElementById(label.dataset.svgId!) }
      : container
        ? { type: container.classList.contains('topiclinks') ? 'arrow' : 'summary', element: target.closest('g') }
        : null
    if (!interaction?.type || !interaction?.element) return false

    this.mind.clearSelection()
    if (interaction.type === 'arrow') {
      isDoubleClick ? this.mind.editArrowLabel(interaction.element as ArrowSvg) : this.mind.selectArrow(interaction.element as ArrowSvg)
    } else {
      isDoubleClick ? this.mind.editSummary(interaction.element as SummarySvg) : this.mind.selectSummary(interaction.element as SummarySvg)
    }
    return true
  }
}

export function createInteractionController(mind: MindElixir): InteractionController {
  return new InteractionController(mind, !mind.overflowHidden)
}
