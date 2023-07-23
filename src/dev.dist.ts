import MindElixir, { E } from 'mind-elixir'
import example from 'mind-elixir/dist/example1'
import type { Options } from 'mind-elixir'
import type { Topic } from '../dist/types/types/dom'
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
}
const mind = new MindElixir(options)
mind.init(example)
function sleep() {
  return new Promise<void>(res => {
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

mind.bus.addListener('operation', (operation: any) => {
  console.log(operation)
})
mind.bus.addListener('selectNode', (node: any) => {
  console.log(node)
})
