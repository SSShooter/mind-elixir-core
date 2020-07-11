import { LEFT, RIGHT, SIDE } from './const'
import { createTopic, createChildren } from './util'
let $d = document

export default function layout() {
  console.time('layout')
  this.root.innerHTML = ''
  this.box.innerHTML = ''
  let tpc = createTopic(this.nodeData)
  tpc.draggable = false
  this.root.appendChild(tpc)

  let primaryNodes = this.nodeData.children
  if (!primaryNodes || primaryNodes.length === 0) return
  if (this.direction === SIDE) {
    // init direction of primary node
    let lcount = 0
    let rcount = 0
    primaryNodes.map(node => {
      if (node.direction === undefined) {
        if (lcount <= rcount) {
          node.direction = LEFT
          lcount += 1
        } else {
          node.direction = RIGHT
          rcount += 1
        }
      } else {
        if (node.direction === LEFT) {
          lcount += 1
        } else {
          rcount += 1
        }
      }
    })
  }
  createChildren(this.nodeData.children, this.box, this.direction)
  console.timeEnd('layout')
}
