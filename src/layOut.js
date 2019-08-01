import { LEFT, RIGHT, SIDE } from './const'
import { createTopic, createExpander } from './util'
import { pieChart } from './paintSvg'
let $d = document
/**
 * traversal data and generate dom structure of mind map
 * @ignore
 * @param {object} data node data object
 * @param {object} first 'the box'
 * @param {number} direction primary node direction
 */
function generateDOMStructure(data, first, direction) {
  let chldr = $d.createElement('children')
  if (first) {
    chldr = first
  }
  for (let i = 0; i < data.length; i++) {
    let nodeObj = data[i]
    let grp = $d.createElement('GRP')
    let top = $d.createElement('t')
    let tpc = createTopic(nodeObj)
    if (first) {
      if (direction === LEFT) {
        grp.className = 'left-side'
      } else if (direction === RIGHT) {
        grp.className = 'right-side'
      } else if (direction === SIDE) {
        if (nodeObj.direction === LEFT) {
          grp.className = 'left-side'
        } else if (nodeObj.direction === RIGHT) {
          grp.className = 'right-side'
        }
      }
    }
    // TODO allow to add online image
    if (nodeObj.style) {
      tpc.style.color = nodeObj.style.color
      tpc.style.background = nodeObj.style.background
      tpc.style.fontSize = nodeObj.style.fontSize + 'px'
      tpc.style.fontWeight = nodeObj.style.fontWeight || 'normal'
    }
    if (nodeObj.icons) {
      let iconsContainer = $d.createElement('span')
      iconsContainer.className = 'icons'
      iconsContainer.innerHTML = nodeObj.icons
        .map(icon => `<span>${icon}</span>`)
        .join('')
      tpc.appendChild(iconsContainer)
    }
    if (nodeObj.tags) {
      let tagsContainer = $d.createElement('div')
      tagsContainer.className = 'tags'
      tagsContainer.innerHTML = nodeObj.tags
        .map(tag => `<span>${tag}</span>`)
        .join('')
      tpc.appendChild(tagsContainer)
    }
    if (nodeObj.pie) {
      let pieContainer = $d.createElement('div')
      pieContainer.className = 'pie'
      let pieData = [
        {
          value: 12,
          label: 'a',
        },
        {
          value: 15,
          label: 'b',
        },
        {
          value: 42,
          label: 'c',
        },
        {
          value: 33,
          label: 'd',
        },
      ]
      pieContainer.appendChild(pieChart(pieData))
      tpc.appendChild(pieContainer)
    }
    top.appendChild(tpc)
    if (nodeObj.children && nodeObj.children.length > 0) {
      top.appendChild(createExpander(nodeObj.expanded))
      grp.appendChild(top)
      if (nodeObj.expanded !== false) {
        let children = generateDOMStructure(nodeObj.children)
        grp.appendChild(children)
      }
    } else {
      grp.appendChild(top)
    }
    chldr.appendChild(grp)
  }
  return chldr
}

export default function layout() {
  console.time('layout')
  this.root.innerHTML = ''
  this.box.innerHTML = ''
  let tpc = createTopic(this.nodeData)
  tpc.draggable = false
  this.root.appendChild(tpc)

  let primaryNodes = this.nodeData.children
  if (!primaryNodes || primaryNodes.length === 0) return
  if (this.direction === LEFT || this.direction === RIGHT) {
    generateDOMStructure(this.nodeData.children, this.box, this.direction)
  } else if (this.direction === SIDE) {
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
    generateDOMStructure(this.nodeData.children, this.box, SIDE)
  }
  console.timeEnd('layout')
}
