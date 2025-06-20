import type { MindElixirCtor } from './index'
import MindElixir from './index'
import example from './exampleData/1'
import example2 from './exampleData/2'
import example3 from './exampleData/3'
import type { Options, MindElixirData, MindElixirInstance } from './types/index'
import type { Operation } from './utils/pubsub'
import style from '../index.css?raw'
import katex from '../katex.css?raw'
import { layoutSSR, renderSSRHTML } from './utils/layout-ssr'
import { snapdom } from '@zumer/snapdom'

interface Window {
  m?: MindElixirInstance
  M: MindElixirCtor
  E: typeof MindElixir.E
  downloadPng: ReturnType<typeof download>
  downloadSvg: ReturnType<typeof download>
  destroy: () => void
}

declare let window: Window

const E = MindElixir.E
const options: Options = {
  el: '#map',
  newTopicName: '子节点',
  locale: 'en',
  // mouseSelectionButton: 2,
  draggable: true,
  editable: true,
  // if you set contextMenu to false, you should handle contextmenu event by yourself, e.g. preventDefault
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
  keypress: {
    e(e) {
      if (!mind.currentNode) return
      if (e.metaKey || e.ctrlKey) {
        mind.expandNode(mind.currentNode)
      }
    },
    f(e) {
      if (!mind.currentNode) return
      if (e.altKey) {
        if (mind.isFocusMode) {
          mind.cancelFocus()
        } else {
          mind.focusNode(mind.currentNode)
        }
      }
    },
  },
  allowUndo: true,
  before: {
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
  scaleSensitivity: 0.2,
  // alignment: 'nodes',
}

let mind = new MindElixir(options)

const data = MindElixir.new('new topic')
mind.init(example)

const m2 = new MindElixir({
  el: '#map2',
  selectionContainer: 'body', // use body to make selection usable when transform is not 0
  direction: MindElixir.RIGHT,
  theme: MindElixir.DARK_THEME,
  alignment: 'nodes',
})
m2.init(data)

function sleep() {
  return new Promise<void>(res => {
    setTimeout(() => res(), 1000)
  })
}
// console.log('test E function', E('bd4313fbac40284b'))

mind.bus.addListener('operation', (operation: Operation) => {
  console.log(operation)
  // return {
  //   name: action name,
  //   obj: target object
  // }

  // name: [insertSibling|addChild|removeNode|beginEdit|finishEdit]
  // obj: target

  // name: moveNodeIn
  // obj: {from:target1,to:target2}
})
mind.bus.addListener('selectNodes', nodes => {
  console.log('selectNodes', nodes)
})
mind.bus.addListener('unselectNodes', nodes => {
  console.log('unselectNodes', nodes)
})
mind.bus.addListener('expandNode', node => {
  console.log('expandNode: ', node)
})

const download = (type: 'svg' | 'png') => {
  return async () => {
    try {
      let blob = null
      if (type === 'png') blob = await mind.exportPng(false, style + katex)
      else blob = await mind.exportSvg(false, style + katex)
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'filename.' + type
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
    }
  }
}
const dl2 = async () => {
  const result = await snapdom(mind.nodes, { fast: true })
  await result.download({ format: 'jpg', filename: 'my-capture' })
}

window.downloadPng = dl2
window.downloadSvg = download('svg')
window.m = mind
// window.m2 = mind2
window.M = MindElixir
window.E = MindElixir.E

console.log('MindElixir Version', MindElixir.version)

window.destroy = () => {
  mind.destroy()
  // @ts-expect-error remove reference
  mind = null
  // @ts-expect-error remove reference
  window.m = null
}

document.querySelector('#ssr')!.innerHTML = renderSSRHTML(layoutSSR(window.m.nodeData))
