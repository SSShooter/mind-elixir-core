import { createNodeDragState, handleNodeDragStart, handleNodeDragMove, handleNodeDragEnd, handleNodeDragCancel } from './plugin/nodeDraggable'
import { handleWheelZoom } from './plugin/keypress'
import type { Expander, ArrowSvg, Topic, SummarySvg } from './types/dom'
import type { MindElixirInstance } from './types/index'
import { getDistance, isTopic, on } from './utils'

export default function (mind: MindElixirInstance) {
  const { panHelper, container } = mind
  let lastTap = 0
  let lastTapTarget: EventTarget | null = null
  mind.spacePressed = false

  const State = {
    Idle: 0,
    Pinch: 1,
    DragWait: 2,
    Drag: 3,
    Pan: 4,
    BoxSelect: 5,
  }

  mind.ptState = State.Idle

  // Pinch zoom state for touch devices
  const pinchHelper = {
    lastDistance: null as number | null,
    activePointers: new Map<number, { x: number; y: number }>(),
    handlePointerDown(e: PointerEvent) {
      if (e.pointerType !== 'touch') return false
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (this.activePointers.size >= 2) {
        const [p1, p2] = Array.from(this.activePointers.values())
        this.lastDistance = getDistance(p1, p2)
        return true
      }
      return false
    },
    handlePointerMove(e: PointerEvent) {
      if (e.pointerType !== 'touch' || !this.activePointers.has(e.pointerId)) return false
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (this.activePointers.size >= 2) {
        const [p1, p2] = Array.from(this.activePointers.values())
        const newDistance = getDistance(p1, p2)
        if (this.lastDistance !== null && this.lastDistance > 0) {
          const scaleRatio = newDistance / this.lastDistance
          mind.scale(mind.scaleVal * scaleRatio, {
            x: (p1.x + p2.x) / 2,
            y: (p1.y + p2.y) / 2,
          })
        }
        this.lastDistance = newDistance
        return true
      }
      return false
    },
    handlePointerUp(e: PointerEvent) {
      if (e.pointerType !== 'touch') return
      this.activePointers.delete(e.pointerId)
      if (this.activePointers.size < 2) {
        this.lastDistance = null
      }
    },
    clear() {
      this.activePointers.clear()
      this.lastDistance = null
    },
  }

  // Node drag state - always initialize
  const nodeDragState = createNodeDragState(mind)

  // Long press state for touch devices
  const longPressHelper = {
    timer: null as number | null,
    startPos: null as { x: number; y: number } | null,
    pointerId: null as number | null,
    DURATION: 500,
    MOVE_THRESHOLD: 10,
    clear() {
      if (this.timer !== null) {
        clearTimeout(this.timer)
        this.timer = null
        this.startPos = null
        this.pointerId = null
      }
    },
    start(e: PointerEvent, cb: (e: PointerEvent) => void) {
      this.timer = window.setTimeout(() => {
        cb(e)
        this.timer = null
        this.startPos = null
        this.pointerId = null
      }, this.DURATION)
      this.startPos = { x: e.clientX, y: e.clientY }
      this.pointerId = e.pointerId
    },
    handleMove(e: PointerEvent) {
      if (this.timer !== null && this.startPos !== null && e.pointerId === this.pointerId) {
        const dx = e.clientX - this.startPos.x
        const dy = e.clientY - this.startPos.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance > this.MOVE_THRESHOLD) {
          this.clear()
        }
      }
    },
  }

  // Helper: Handle SVG label interactions (click or double-click)
  const handleSvgLabelInteraction = (target: HTMLElement, isDoubleClick: boolean): boolean => {
    if (target.closest('#input-box')) return false

    const label = target.closest<HTMLElement>('.svg-label')
    const container = target.closest<HTMLElement>('.topiclinks, .summary')

    const interaction = label
      ? { type: label.dataset.type, element: document.getElementById(label.dataset.svgId!) }
      : container
        ? { type: container.classList.contains('topiclinks') ? 'arrow' : 'summary', element: target.closest('g') }
        : null

    if (!interaction?.type || !interaction?.element) return false
    mind.clearSelection()
    const { type, element } = interaction
    if (type === 'arrow') {
      isDoubleClick ? mind.editArrowLabel(element as ArrowSvg) : mind.selectArrow(element as ArrowSvg)
    } else {
      isDoubleClick ? mind.editSummary(element as SummarySvg) : mind.selectSummary(element as SummarySvg)
    }
    return true
  }

  const handleSingleClick = (e: PointerEvent) => {
    // Only handle primary button clicks
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (mind.helper1?.moved) {
      mind.helper1.clear()
      return
    }
    if (mind.helper2?.moved) {
      mind.helper2.clear()
      return
    }
    if (panHelper.moved) {
      panHelper.clear()
      return
    }

    // Skip click handling if we just finished a node drag
    if (nodeDragState?.isDragging) {
      return
    }

    const target = e.target as HTMLElement
    if (target.tagName === 'ME-EPD') {
      if (e.ctrlKey || e.metaKey) {
        mind.expandNodeAll((target as Expander).previousSibling)
      } else {
        mind.expandNode((target as Expander).previousSibling)
      }
    }
  }

  const handleDoubleClick = (e: MouseEvent | PointerEvent) => {
    if (!mind.editable) return
    const target = e.target as HTMLElement
    if (isTopic(target)) {
      mind.beginEdit(target)
    }
    handleSvgLabelInteraction(target, true)
  }

  const handlePointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') {
      if (pinchHelper.handlePointerDown(e)) {
        mind.ptState = State.Pinch
        longPressHelper.clear()
        panHelper.clear()
        if (nodeDragState.isDragging || nodeDragState.pointerId !== null) {
          handleNodeDragCancel(mind, nodeDragState)
        }
        return
      }
    }

    if (mind.ptState === State.Pinch) return

    const target = e.target as HTMLElement

    if (target.className === 'map-container' && e.button === 0 && e.pointerType === 'mouse') {
      mind.ptState = State.BoxSelect
      return
    }
    panHelper.handlePointerDown(e)
    if (panHelper.mousedown) {
      mind.ptState = State.Pan
    }

    if (e.button === 0 || e.pointerType === 'touch') {
      const isTopicEl = isTopic(target)
      if (isTopicEl) {
        mind.selection?.cancel()
        const nodes = mind.currentNodes || []
        const isMulti = e.ctrlKey || e.metaKey

        if (isMulti) {
          if (nodes.includes(target as Topic)) {
            mind.selection?.deselect(target as Topic)
            return
          } else {
            mind.selection?.select(target as Topic)
          }
        } else if (!nodes.includes(target as Topic)) {
          mind.selectNode(target as Topic)
        }

        if (e.pointerType === 'touch') {
          mind.ptState = State.DragWait
          longPressHelper.start(e, ev => {
            if (handleNodeDragStart(mind, nodeDragState, ev, true)) {
              mind.ptState = State.Drag
              target.setPointerCapture(ev.pointerId)
            }
          })
        } else {
          if (handleNodeDragStart(mind, nodeDragState, e, false)) {
            mind.ptState = State.Drag
            target.setPointerCapture(e.pointerId)
          }
        }
      } else {
        handleSvgLabelInteraction(target, false)
      }
    }
  }

  const handlePointerMove = (e: PointerEvent) => {
    switch (mind.ptState) {
      case State.Pinch:
        pinchHelper.handlePointerMove(e)
        break
      case State.DragWait:
        longPressHelper.handleMove(e)
        if (longPressHelper.timer === null) {
          mind.ptState = State.Idle
        }
        break
      case State.Drag:
        handleNodeDragMove(mind, nodeDragState, e)
        break
      case State.Pan:
        panHelper.handlePointerMove(e)
        break
    }
  }

  const handlePointerUp = (e: PointerEvent) => {
    console.log('handlePointerUp')
    if (e.pointerType === 'touch') {
      pinchHelper.handlePointerUp(e)
    }

    const prevState = mind.ptState

    switch (mind.ptState) {
      case State.DragWait:
        longPressHelper.clear()
        break
      case State.Drag:
        handleNodeDragEnd(mind, nodeDragState, e)
        break
      case State.Pan:
        panHelper.handlePointerUp(e)
        break
      default: {
        const isTouchTap = e.pointerType === 'touch'
        if (isTouchTap) {
          const currentTime = new Date().getTime()
          const tapLength = currentTime - lastTap
          if (tapLength < 300 && tapLength > 0 && lastTapTarget === e.target) {
            handleDoubleClick(e)
          }
          lastTap = currentTime
          lastTapTarget = e.target
        }
        break
      }
    }

    // 统一将状态重置为 Idle，除了仍在进行中的 Pinch 状态（即屏幕上还有两根及以上的手指）
    if (mind.ptState !== State.Pinch || pinchHelper.activePointers.size < 2) {
      mind.ptState = State.Idle
    }
  }

  const handleInterrupt = () => {
    pinchHelper.clear()
    longPressHelper.clear()
    panHelper.clear()
    if (nodeDragState.isDragging || nodeDragState.pointerId !== null) {
      handleNodeDragCancel(mind, nodeDragState)
    }
    mind.ptState = State.Idle
  }

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault()
    // Only handle right-click for context menu
    if (e.button !== 2) return
    if (!mind.editable) return
    setTimeout(() => {
      // delay to avoid conflict with click event on Mac
      if (mind.panHelper.moved) return
      const target = e.target as HTMLElement
      if (isTopic(target) && !target.classList.contains('selected')) {
        mind.selectNode(target)
      }
      mind.bus.fire('showContextMenu', e)
    }, 200)
  }

  const handleWheel = (e: WheelEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (e.ctrlKey || e.metaKey) return handleWheelZoom(mind, e)
    if (e.shiftKey) return mind.move(-e.deltaY, 0)
    mind.move(-e.deltaX, -e.deltaY)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      mind.spacePressed = true
      mind.container.classList.add('space-pressed')
    }
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      mind.spacePressed = false
      mind.container.classList.remove('space-pressed')
    }
  }

  const off = on([
    { dom: container, evt: 'pointerdown', func: handlePointerDown },
    { dom: container, evt: 'pointermove', func: handlePointerMove },
    { dom: container, evt: 'pointerup', func: handlePointerUp },
    { dom: container, evt: 'pointercancel', func: handleInterrupt },
    { dom: container, evt: 'click', func: handleSingleClick },
    { dom: container, evt: 'dblclick', func: handleDoubleClick },
    { dom: container, evt: 'contextmenu', func: handleContextMenu },
    { dom: container, evt: 'wheel', func: typeof mind.handleWheel === 'function' ? mind.handleWheel : handleWheel },
    { dom: container, evt: 'blur', func: handleInterrupt },
    { dom: container, evt: 'keydown', func: handleKeyDown },
    { dom: container, evt: 'keyup', func: handleKeyUp },
  ])
  return off
}
