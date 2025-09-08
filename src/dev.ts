import type { MindElixirCtor } from './index'
import MindElixir from './index'
import example from './exampleData/1'
import example2 from './exampleData/2'
import example3 from './exampleData/3'
import markdownExample from './exampleData/markdown'
import type { Options, MindElixirInstance, NodeObj } from './types/index'
import type { Operation } from './utils/pubsub'
import style from '../index.css?raw'
import katexStyle from 'katex/dist/katex.min.css?raw'
import katex from 'katex'
import { layoutSSR, renderSSRHTML } from './utils/layout-ssr'
import { snapdom } from '@zumer/snapdom'
import type { Tokens } from 'marked'
import { marked } from 'marked'

interface Window {
  m?: MindElixirInstance
  M: MindElixirCtor
  E: typeof MindElixir.E
  downloadPng: ReturnType<typeof download>
  downloadSvg: ReturnType<typeof download>
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
  // Custom markdown parser (user must provide their own implementation)
  // markdown: (text: string) => {
  //   console.log('md process', text)
  //   // Simple custom markdown implementation
  //   // Process in correct order: bold first, then italic to avoid conflicts
  //   return text
  //     .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>') // Bold + Italic
  //     .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
  //     .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
  //     .replace(/`(.*?)`/g, '<code>$1</code>') // Inline code
  //     .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>') // Links
  // },
  markdown: (text: string) => {
    // Configure marked renderer to add target="_blank" to links
    const renderer = {
      link(token: Tokens.Link) {
        const href = token.href || ''
        const title = token.title ? ` title="${token.title}"` : ''
        const text = token.text || ''
        return `<a href="${href}"${title} target="_blank">${text}</a>`
      },
    }

    marked.use({ renderer })
    let html = marked(text) as string

    // Process KaTeX math expressions
    // Handle display math ($$...$$)
    html = html.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: true })
      } catch (error) {
        console.warn('KaTeX display math error:', error)
        return match // Return original if parsing fails
      }
    })

    // Handle inline math ($...$)
    html = html.replace(/\$([^$]+)\$/g, (match, math) => {
      try {
        return katex.renderToString(math.trim(), { displayMode: false })
      } catch (error) {
        console.warn('KaTeX inline math error:', error)
        return match // Return original if parsing fails
      }
    })

    return html
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
// mind.init(example)
mind.init(markdownExample)

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
mind.bus.addListener('expandNode', node => {
  console.log('expandNode: ', node)
})

const download = (type: 'svg' | 'png') => {
  return async () => {
    try {
      let blob = null
      if (type === 'png') blob = await mind.exportPng(false, style + katexStyle)
      else blob = await mind.exportSvg(false, style + katexStyle)
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
  const result = await snapdom(mind.nodes)
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
