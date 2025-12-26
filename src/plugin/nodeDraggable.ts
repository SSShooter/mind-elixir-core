import type { Topic } from '../types/dom'
import type { MindElixirInstance } from '../types/index'

export type InsertType = 'before' | 'after' | 'in' | null

const $d = document

export const insertPreview = function (tpc: Topic, insertType: InsertType) {
  if (!insertType) {
    clearPreview(tpc)
    return tpc
  }
  let el = tpc.querySelector('.insert-preview')
  const className = `insert-preview ${insertType} show`
  if (!el) {
    el = $d.createElement('div')
    tpc.appendChild(el)
  }
  el.className = className
  return tpc
}

export const clearPreview = function (el: Element | null) {
  if (!el) return
  const query = el.querySelectorAll('.insert-preview')
  for (const queryElement of query || []) {
    queryElement.remove()
  }
}

export const canMove = function (el: Element, dragged: Topic[]) {
  for (const node of dragged) {
    const isContain = node.parentElement.parentElement.contains(el)
    const ok = el && el.tagName === 'ME-TPC' && el !== node && !isContain && (el as Topic).nodeObj.parent
    if (!ok) return false
  }
  return true
}

export const createGhost = function (mei: MindElixirInstance) {
  const ghost = document.createElement('div')
  ghost.className = 'mind-elixir-ghost'
  mei.container.appendChild(ghost)
  return ghost
}

export class EdgeMoveController {
  private mind: MindElixirInstance
  private isMoving = false
  private interval: ReturnType<typeof setInterval> | null = null
  private speed = 20
  constructor(mind: MindElixirInstance) {
    this.mind = mind
  }
  move(dx: number, dy: number) {
    if (this.isMoving) return
    this.isMoving = true
    this.interval = setInterval(() => {
      this.mind.move(dx * this.speed * this.mind.scaleVal, dy * this.speed * this.mind.scaleVal)
    }, 100)
  }
  stop() {
    this.isMoving = false
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}

export interface NodeDragState {
  isDragging: boolean
  insertType: InsertType
  meet: Topic | null
  ghost: HTMLElement
  edgeMoveController: EdgeMoveController
  startX: number
  startY: number
  pointerId: number | null
}

export function createNodeDragState(mind: MindElixirInstance): NodeDragState {
  return {
    isDragging: false,
    insertType: null,
    meet: null,
    ghost: createGhost(mind),
    edgeMoveController: new EdgeMoveController(mind),
    startX: 0,
    startY: 0,
    pointerId: null,
  }
}

// Threshold to distinguish between click and drag (in pixels)
const DRAG_THRESHOLD = 5

export function handleNodeDragStart(mind: MindElixirInstance, state: NodeDragState, e: PointerEvent, immediate = false): boolean {
  // Don't start drag when space is pressed (map panning mode)
  if (mind.spacePressed) return false

  const target = e.target as Topic
  if (target?.tagName !== 'ME-TPC') return false

  // Prevent dragging root node
  if (!target.nodeObj.parent) return false

  // Store initial position
  state.startX = e.clientX
  state.startY = e.clientY
  state.pointerId = e.pointerId

  // Cancel selection
  mind.selection.cancel()

  // Select node if not already selected
  let nodes = mind.currentNodes
  if (!nodes?.includes(target)) {
    mind.selectNode(target)
    nodes = mind.currentNodes
  }

  // Prepare for potential drag
  mind.dragged = nodes

  // If immediate mode (e.g., long press), show ghost immediately
  if (immediate) {
    showDragGhost(mind, state)
  }

  return true
}

/**
 * Update ghost element position
 */
export function updateGhostPosition(ghost: HTMLElement, x: number, y: number): void {
  ghost.style.transform = `translate(${x + 10}px, ${y + 10}px)`
  ghost.style.display = 'block'
}

/**
 * Show ghost element immediately to indicate drag is ready
 */
export function showDragGhost(mind: MindElixirInstance, state: NodeDragState): void {
  const { dragged } = mind
  if (!dragged) return
  const activeElement = document.activeElement as HTMLElement
  if (activeElement && activeElement.isContentEditable) {
    activeElement.blur() // touch won't blur editable element on mobile
  }

  state.isDragging = true

  // Setup ghost element
  if (dragged.length > 1) {
    state.ghost.innerHTML = dragged.length + ''
  } else {
    state.ghost.innerHTML = dragged[0].innerHTML
  }

  // Make dragged nodes semi-transparent
  for (const node of dragged) {
    node.parentElement.parentElement.style.opacity = '0.5'
  }

  // Clear map drag state
  mind.dragMoveHelper.clear()
}

export function handleNodeDragMove(mind: MindElixirInstance, state: NodeDragState, e: PointerEvent): void {
  const { dragged } = mind
  if (!dragged || state.pointerId !== e.pointerId) return

  const dx = e.clientX - state.startX
  const dy = e.clientY - state.startY
  const distance = Math.sqrt(dx * dx + dy * dy)

  // Start actual dragging if threshold exceeded (only for non-immediate mode)
  if (!state.isDragging && distance > DRAG_THRESHOLD) {
    showDragGhost(mind, state)
  }

  if (!state.isDragging) return

  // Update ghost position using transform for smooth movement
  updateGhostPosition(state.ghost, e.clientX, e.clientY)

  // Border detection for auto-scrolling
  const rect = mind.container.getBoundingClientRect()
  if (e.clientX < rect.x + 50) {
    state.edgeMoveController.move(1, 0)
  } else if (e.clientX > rect.x + rect.width - 50) {
    state.edgeMoveController.move(-1, 0)
  } else if (e.clientY < rect.y + 50) {
    state.edgeMoveController.move(0, 1)
  } else if (e.clientY > rect.y + rect.height - 50) {
    state.edgeMoveController.move(0, -1)
  } else {
    state.edgeMoveController.stop()
  }

  // Clear previous preview
  clearPreview(state.meet)

  const threshold = 12 * mind.scaleVal

  // Check for drop target
  // minus threshold infers that position of the cursor is above topic
  const topMeet = $d.elementFromPoint(e.clientX, e.clientY - threshold) as Topic
  if (canMove(topMeet, dragged)) {
    state.meet = topMeet
    const rect = topMeet.getBoundingClientRect()
    const y = rect.y
    if (e.clientY > y + rect.height) {
      state.insertType = 'after'
    } else {
      state.insertType = 'in'
    }
  } else {
    const bottomMeet = $d.elementFromPoint(e.clientX, e.clientY + threshold) as Topic
    if (canMove(bottomMeet, dragged)) {
      state.meet = bottomMeet
      const rect = bottomMeet.getBoundingClientRect()
      const y = rect.y
      if (e.clientY < y) {
        state.insertType = 'before'
      } else {
        state.insertType = 'in'
      }
    } else {
      state.insertType = null
      state.meet = null
    }
  }

  if (state.meet) {
    insertPreview(state.meet, state.insertType)
  }
}

export function handleNodeDragEnd(mind: MindElixirInstance, state: NodeDragState, e: PointerEvent): void {
  const { dragged } = mind
  if (!dragged || state.pointerId !== e.pointerId) return

  state.edgeMoveController.stop()

  // Restore opacity
  for (const node of dragged) {
    node.parentElement.parentElement.style.opacity = '1'
  }

  // Hide ghost
  state.ghost.style.display = 'none'
  state.ghost.innerHTML = ''

  // Perform move operation if dragging occurred
  if (state.isDragging && state.meet) {
    clearPreview(state.meet)
    if (state.insertType === 'before') {
      mind.moveNodeBefore(dragged, state.meet)
    } else if (state.insertType === 'after') {
      mind.moveNodeAfter(dragged, state.meet)
    } else if (state.insertType === 'in') {
      mind.moveNodeIn(dragged, state.meet)
    }
  }

  // Reset state
  mind.dragged = null
  state.isDragging = false
  state.insertType = null
  state.meet = null
  state.pointerId = null
}

export function handleNodeDragCancel(mind: MindElixirInstance, state: NodeDragState): void {
  const { dragged } = mind
  if (!dragged) return

  state.edgeMoveController.stop()

  // Restore opacity
  for (const node of dragged) {
    node.parentElement.parentElement.style.opacity = '1'
  }

  // Clear preview
  if (state.meet) {
    clearPreview(state.meet)
  }

  // Hide ghost
  state.ghost.style.display = 'none'
  state.ghost.innerHTML = ''

  // Reset state
  mind.dragged = null
  state.isDragging = false
  state.insertType = null
  state.meet = null
  state.pointerId = null
}

// Default export for backward compatibility - now returns empty disposable
// The actual functionality is handled in mouse.ts
export default function (_mind: MindElixirInstance) {
  // Node dragging is now handled by pointer events in mouse.ts
  // This function is kept for backward compatibility but does nothing
  return () => {}
}
