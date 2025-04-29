import type { Topic } from '../types/dom'
import type { MindElixirInstance } from '../types/index'
// https://html.spec.whatwg.org/multipage/dnd.html#drag-and-drop-processing-model
type InsertType = 'before' | 'after' | 'in' | null
const $d = document
const insertPreview = function (tpc: Topic, insertTpye: InsertType) {
  if (!insertTpye) {
    clearPreview(tpc)
    return tpc
  }
  let el = tpc.querySelector('.insert-preview')
  const className = `insert-preview ${insertTpye} show`
  if (!el) {
    el = $d.createElement('div')
    tpc.appendChild(el)
  }
  el.className = className
  return tpc
}

const clearPreview = function (el: Element | null) {
  if (!el) return
  const query = el.querySelectorAll('.insert-preview')
  for (const queryElement of query || []) {
    queryElement.remove()
  }
}

const canMove = function (el: Element, dragged: Topic[]) {
  for (const node of dragged) {
    const isContain = node.parentElement.parentElement.contains(el)
    const ok = el && el.tagName === 'ME-TPC' && el !== node && !isContain && (el as Topic).nodeObj.parent
    if (!ok) return false
  }
  return true
}

const createGhost = function (mei: MindElixirInstance) {
  const ghost = document.createElement('div')
  ghost.className = 'mind-elixir-ghost'
  mei.map.appendChild(ghost)
  return ghost
}

class EdgeMoveController {
  private mind: MindElixirInstance
  private isMoving = false
  private interval: NodeJS.Timeout | null = null
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
    clearInterval(this.interval!)
  }
}

export default function (mind: MindElixirInstance) {
  let insertTpye: InsertType = null
  let meet: Topic | null = null
  const ghost = createGhost(mind)
  const threshold = 12
  const edgeMoveController = new EdgeMoveController(mind)

  mind.map.addEventListener('dragstart', e => {
    const target = e.target as Topic
    if (target?.tagName !== 'ME-TPC') {
      // it should be a topic element, return if not
      e.preventDefault()
      return
    }
    let nodes = mind.currentNodes
    if (!nodes?.includes(target)) {
      mind.unselectNodes(mind.currentNodes)
      mind.selectNode(target)
      nodes = mind.currentNodes
    }
    mind.dragged = nodes
    if (nodes.length > 1) ghost.innerHTML = nodes.length + ''
    else ghost.innerHTML = target.innerHTML

    for (const node of nodes) {
      node.parentElement.parentElement.style.opacity = '0.5'
    }
    e.dataTransfer!.setDragImage(ghost, 0, 0)
    e.dataTransfer!.dropEffect = 'move'
    mind.dragMoveHelper.clear()
  })

  mind.map.addEventListener('dragend', async e => {
    console.log('node dragend')
    const { dragged } = mind
    if (!dragged) return
    for (const node of dragged) {
      node.parentElement.parentElement.style.opacity = '1'
    }
    const target = e.target as Topic
    target.style.opacity = ''
    if (!meet) return
    clearPreview(meet)
    if (insertTpye === 'before') {
      mind.moveNodeBefore(dragged, meet)
    } else if (insertTpye === 'after') {
      mind.moveNodeAfter(dragged, meet)
    } else if (insertTpye === 'in') {
      mind.moveNodeIn(dragged, meet)
    }
    mind.dragged = null
  })

  mind.map.addEventListener('dragover', function (e: DragEvent) {
    e.preventDefault()
    const { dragged } = mind

    if (!dragged) return

    // border detection
    const rect = mind.container.getBoundingClientRect()
    if (e.clientX < rect.x + 50) {
      edgeMoveController.move(1, 0)
    } else if (e.clientX > rect.x + rect.width - 50) {
      edgeMoveController.move(-1, 0)
    } else if (e.clientY < rect.y + 50) {
      edgeMoveController.move(0, 1)
    } else if (e.clientY > rect.y + rect.height - 50) {
      edgeMoveController.move(0, -1)
    } else {
      edgeMoveController.stop()
    }

    clearPreview(meet)
    // minus threshold infer that postion of the cursor is above topic
    const topMeet = $d.elementFromPoint(e.clientX, e.clientY - threshold) as Topic
    if (canMove(topMeet, dragged)) {
      meet = topMeet
      const y = topMeet.getBoundingClientRect().y
      if (e.clientY > y + topMeet.clientHeight) {
        insertTpye = 'after'
      } else {
        insertTpye = 'in'
      }
    } else {
      const bottomMeet = $d.elementFromPoint(e.clientX, e.clientY + threshold) as Topic
      if (canMove(bottomMeet, dragged)) {
        meet = bottomMeet
        const y = bottomMeet.getBoundingClientRect().y
        if (e.clientY < y) {
          insertTpye = 'before'
        } else {
          insertTpye = 'in'
        }
      } else {
        insertTpye = meet = null
      }
    }
    if (meet) insertPreview(meet, insertTpye)
  })
}
