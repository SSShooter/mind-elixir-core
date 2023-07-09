import MindElixir, { E } from 'mind-elixir'
import example from 'mind-elixir/dist/example1'
import type { Options } from 'mind-elixir/dist/types/types'
// import example2 from '../dist/example2'

const options: Options = {
  el: '#map',
  newTopicName: '子节点',
  // direction: MindElixir.LEFT,
  direction: MindElixir.RIGHT,
  // data: MindElixir.new('new topic'),
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
    moveDownNode() {
      return false
    },
    insertSibling(el, obj) {
      console.log('insertSibling', el, obj)
      return true
    },
    async addChild(el, obj) {
      await sleep()
      return true
    },
  },
  // mainLinkStyle: 2,
  mainNodeVerticalGap: 15, // 25
  mainNodeHorizontalGap: 15, // 65
}
const mind = new MindElixir(options)
mind.init(example)
function sleep() {
  return new Promise(res => {
    setTimeout(() => res(), 1000)
  })
}
console.log('test E function', E('bd4313fbac40284b'))
// let mind2 = new MindElixir({
//   el: '#map2',
//   direction: 2,
//   data: MindElixir.example2,
//   draggable: false,
//   // overflowHidden: true,
//   nodeMenu: true,
// })
// mind2.init()
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
// window.m2 = mind2
window.M = MindElixir
