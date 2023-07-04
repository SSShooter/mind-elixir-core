import MindElixir, { E } from './index'
import MindElixirLite from './index.lite'
import example from './exampleData/1'
import example2 from './exampleData/2'
import { MindElixirData, MindElixirInstance, Options } from './interface'

interface Window {
  currentOperation: any
  m: any
  M: any
  E: any
  exportSvg: any
  exportPng: any
}

declare let window: Window

const options: Options = {
  el: '#map',
  newTopicName: '子节点',
  direction: MindElixir.SIDE,
  // direction: MindElixir.RIGHT,
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
  mobileMenu: true,
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
      console.log('addChild', el, obj)
      // await sleep()
      return true
    },
  },
  mainLinkStyle: 1,
  mainNodeVerticalGap: 25, // 25
  mainNodeHorizontalGap: 65, // 65
}

const mind: MindElixirInstance = new MindElixir(options)

const data = MindElixir.new('new topic')
mind.init(example as MindElixirData)
function sleep() {
  return new Promise<void>(res => {
    setTimeout(() => res(), 1000)
  })
}
console.log('test E function', E('bd4313fbac40284b'))
const mind2 = new (MindElixirLite as any)({
  el: document.querySelector('#map2'),
  direction: 2,
  draggable: false,
  // overflowHidden: true,
  nodeMenu: true,
})
mind2.init(example2)
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
mind.bus.addListener('expandNode', node => {
  console.log('expandNode: ', node)
})
window.m = mind
// window.m2 = mind2
window.M = MindElixir
window.E = MindElixir.E
