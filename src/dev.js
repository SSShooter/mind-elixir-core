import MindElixir, { E } from './index'
import { exportSvg, exportPng } from '../painter/index'

let mind = new MindElixir({
  el: '#map',
  newTopicName: '子节点',
  direction: MindElixir.LEFT,
  // direction: MindElixir.RIGHT,
  data: MindElixir.new('new topic'),
  // data: MindElixir.example,
  locale: 'en',
  draggable: true,
  editable: true,
  contextMenu: true,
  contextMenuOption: {
    focus: true,
    link: true,
    extend: [
      {
        name: 'Node edit',
        onclick: () => {
          alert('extend menu')
        },
      },
    ],
  },
  toolBar: true,
  nodeMenu: true,
  keypress: true,
  allowUndo: false,
  before: {
    moveDownNode(){
      return false
    },
    insertSibling(el, obj) {
      return true
    },
    async addChild(el, obj) {
      await sleep()
      return true
    },
  },
  primaryLinkStyle: 2,
  primaryNodeVerticalGap: 15, // 25
  primaryNodeHorizontalGap: 15, // 65
})
mind.init()
function sleep() {
  return new Promise((res, rej) => {
    setTimeout(() => res(), 100)
  })
}
console.log('test E function', E('bd4313fbac40284b'))
let mind2 = new MindElixir({
  el: '#map2',
  direction: 2,
  data: MindElixir.example2,
  draggable: false,
  // overflowHidden: true,
  nodeMenu: true,
})
mind2.init()
window.currentOperation = null
mind.bus.addListener('operation', operation => {
  console.log(operation)
  if (operation.name !== 'finishEdit') window.currentOperation = operation
  // return {
  //   name: action name,
  //   obj: target object
  // }

  // name: [insertSibling|addChild|removeNode|beginEdit|finishEdit]
  // obj: target

  // name: moveNode
  // obj: {from:target1,to:target2}
})
mind.bus.addListener('selectNode', node => {
  console.log(node)
})
window.m = mind
window.m2 = mind2
window.M = MindElixir
window.exportSvg = exportSvg
window.exportPng = exportPng
