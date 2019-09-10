import MindElixir, { E } from './index'
import data from './example.cn'

let mind = new MindElixir({
  el: '#map',
  direction: MindElixir.SIDE,
  // data: MindElixir.new('new topic'),
  data: MindElixir.example,
  locale: 'en',
  draggable: true,
  editable: true,
  contextMenu: true,
  toolBar: true,
  nodeMenu: true,
  keypress: true,
})
mind.init()

console.log('test E function', E('bd4313fbac40284b'))
// let mind2 = new MindElixir({
//   el: '#map2',
//   direction: 2,
//   data: data.data,
//   draggable: true
// })
// mind2.init()

mind.bus.addListener('operation', operation => {
  // console.log(operation)
})
window.m = mind
