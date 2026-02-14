import MindElixir from 'mind-elixir'
import example from 'mind-elixir/example'
import type { Options } from 'mind-elixir'

const E = MindElixir.E
const options: Options = {
  el: '#map',
  newTopicName: '子节点',
  // direction: MindElixir.LEFT,
  direction: MindElixir.RIGHT,
  // data: MindElixir.new('new topic'),
  locale: 'en',
  editable: true,
  contextMenu: {
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
      return true
    },
  },
  scaleSensitivity: 0.2,
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
//   // overflowHidden: true,
// })
// mind2.init()

mind.bus.addListener('operation', operation => {
  console.log(operation)
})

mind.bus.addListener('selectNodes', nodes => {
  console.log(nodes)
})
