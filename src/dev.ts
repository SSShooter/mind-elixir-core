import type { MindElixirCtor } from './index'
import MindElixir from './index'
import example from './exampleData/1'
import example2 from './exampleData/2'
import example3 from './exampleData/3'
import type { Options, MindElixirInstance, NodeObj } from './types/index'
import type { Operation } from './utils/pubsub'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import { layoutSSR, renderSSRHTML } from './utils/layout-ssr'
import { snapdom } from '@zumer/snapdom'
import type { Tokens } from 'marked'
import { marked } from 'marked'
import { md2html } from 'simple-markdown-to-html'
import type { Arrow } from './arrow'
import type { Summary } from './summary'

interface Window {
  m?: MindElixirInstance
  m2?: MindElixirInstance
  M: MindElixirCtor
  E: typeof MindElixir.E
  downloadPng: () => void
  downloadSvg: () => void
  destroy: () => void
  testMarkdown: () => void
  addMarkdownNode: () => void
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
  markdown: (text: string, obj: (NodeObj & { useMd?: boolean }) | (Arrow & { useMd?: boolean }) | (Summary & { useMd?: boolean })) => {
    if (!text) return ''
    // if (!obj.useMd) return text
    try {
      // Configure marked renderer to add target="_blank" to links
      const renderer = {
        strong(token: Tokens.Strong) {
          if (token.raw.startsWith('**')) {
            return `<strong class="asterisk-emphasis">${token.text}</strong>`
          } else if (token.raw.startsWith('__')) {
            return `<strong class="underscore-emphasis">${token.text}</strong>`
          }
          return `<strong>${token.text}</strong>`
        },
        link(token: Tokens.Link) {
          const href = token.href || ''
          const title = token.title ? ` title="${token.title}"` : ''
          const text = token.text || ''
          return `<a href="${href}"${title} target="_blank">${text}</a>`
        },
      }

      marked.use({ renderer, gfm: true })
      let html = marked.parse(text) as string
      // let html = md2html(text)

      // Process KaTeX math expressions
      // Handle display math ($$...$$)
      html = html.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
        return katex.renderToString(math.trim(), { displayMode: true })
      })

      // Handle inline math ($...$)
      html = html.replace(/\$([^$]+)\$/g, (_, math) => {
        return katex.renderToString(math.trim(), { displayMode: false })
      })

      return html.trim().replace(/\n/g, '')
    } catch (error) {
      return text
    }
  },
  // To disable markdown, simply omit the markdown option or set it to undefined
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
  // scaleMin:0.1
  // alignment: 'nodes',
}

let mind = new MindElixir(options)

const data = MindElixir.new('new topic')
// example.theme = MindElixir.DARK_THEME
mind.init(example)

const m2 = new MindElixir({
  el: '#map2',
  selectionContainer: 'body', // use body to make selection usable when transform is not 0
  direction: MindElixir.RIGHT,
  theme: MindElixir.DARK_THEME,
  // alignment: 'nodes',
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
mind.bus.addListener('changeDirection', direction => {
  console.log('changeDirection: ', direction)
})

const dl2 = async () => {
  const result = await snapdom(mind.nodes)
  await result.download({ format: 'jpg', filename: 'my-capture' })
}

window.downloadPng = dl2
window.m = mind
window.m2 = m2
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
