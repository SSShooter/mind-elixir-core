import MindElixir from './index'
import example from './exampleData/1'
import example2 from './exampleData/2'
import example3 from './exampleData/3'
import org from './exampleData/org'
import largeMap from './exampleData/largeMap'
import type { Options, NodeObj } from './types/index'
import type { Operation } from './utils/pubsub'
import 'katex/dist/katex.min.css'
import katex from 'katex'
import { layoutSSR, renderSSRHTML } from './utils/layout-ssr'
import { downloadUrl, exportImage } from '@mind-elixir/export-mindmap'
import type { Tokens } from 'marked'
import { marked } from 'marked'
import { md2html } from 'simple-markdown-to-html'
import type { Arrow } from './arrow'
import type { Summary } from './summary'
import { mindElixirToPlaintext, plaintextExample, plaintextToMindElixir } from './utils/plaintextConverter'
import { en } from './i18n'
import { markmapMain, markmapSub, straightMain, straightSub, straightUnderlineMain, straightUnderlineSub } from './branchTests'
import '../dev.css'

interface Window {
  m?: MindElixir
  m2?: MindElixir
  M: typeof MindElixir
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
  // mouseSelectionButton: 2,
  editable: true,
  markdown: (text: string) => {
    if (!text) return ''
    try {
      const renderer = {
        strong(token: Tokens.Strong) {
          let color = ''
          let content = token.text
          if (token.text.startsWith('%:')) {
            const text = token.text.slice(2)
            const colonIndex = text.indexOf(':')
            if (colonIndex > 0) {
              color = text.slice(0, colonIndex)
              content = text.slice(colonIndex + 1)
            }
          }
          if (token.raw.startsWith('__')) {
            return `<strong class="underscore" style="background-color: ${color};">${content}</strong>`
          }
          return `<strong class="asterisk" style="color: ${color};">${content}</strong>`
        },
        link(token: Tokens.Link) {
          const href = token.href || ''
          const title = token.title ? ` title="${token.title}"` : ''
          const text = token.text || ''
          return `<a href="${href}"${title} target="_blank">${text}</a>`
        },
      }

      // Handle display math ($$...$$)
      text = text.replace(/\$\$([^$]+)\$\$/g, (_, math) => {
        return katex.renderToString(math.trim(), {
          displayMode: true,
          output: 'html',
        })
      })

      // Handle inline math ($...$)
      text = text.replace(/\$([^$]+)\$/g, (_, math) => {
        return katex.renderToString(math.trim(), {
          displayMode: false,
          output: 'html',
        })
      })

      marked.use({ renderer, gfm: true })
      const html = marked(text) as string
      return html.trim()
    } catch (error) {
      console.log('md2html error', error)
      return text
    }
  },
  // To disable markdown, simply omit the markdown option or set it to undefined
  // if you set contextMenu to false, you should handle contextmenu event by yourself, e.g. preventDefault
  contextMenu: {
    locale: en,
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

  // ================= 测试不同的分支样式 =================
  // 现在可以通过 mind.changeBranch 动态切换了！
}

let mind = new MindElixir(options)

const data = MindElixir.new('new topic')
// example.theme = MindElixir.DARK_THEME
mind.init(example)
// mind.init(largeMap)

const branchThemes = {
  markmap: {
    generateMainBranch: markmapMain,
    generateSubBranch: markmapSub,
    cssVar: {
      '--root-color': mind.theme.cssVar['--main-color'],
      '--root-bgcolor': 'transparent',
      '--root-border-color': 'transparent',
      '--root-radius': '5px',
      '--main-radius': '5px',
      '--main-bgcolor': 'transparent',
      '--main-border': 'transparent',
    },
  },
  straightUnderline: {
    generateMainBranch: straightUnderlineMain,
    generateSubBranch: straightUnderlineSub,
    cssVar: {
      '--main-radius': '0',
      '--main-bgcolor': 'transparent',
      '--main-border': 'transparent',
    },
  },
  straight: {
    generateMainBranch: straightMain,
    generateSubBranch: straightSub,
  },
}

// 动态切换为特定风格，并记录在 meta 中
// 注意：必须先设置 dataset.branchStyle 让相关 CSS(dev.css)先生效，
// 再 changeTheme 触发 refresh 重算布局和连线，否则连线会按旧节点尺寸绘制而错位
mind.container.dataset.branchStyle = 'markmap'
mind.changeTheme({
  ...mind.theme,
  ...branchThemes.markmap,
  cssVar: {
    ...mind.theme.cssVar,
    ...branchThemes.markmap.cssVar,
  },
})
mind.meta = {
  ...mind.meta,
  branchStyle: 'markmap',
}

const m2 = new MindElixir({
  el: '#map2',
  selectionContainer: 'body', // use body to make selection usable when transform is not 0
  direction: MindElixir.DOWN,
  theme: MindElixir.DARK_THEME,
  // alignment: 'nodes',
})
// NOTE: init() reads data.direction and overrides the constructor option,
// and example data has `direction: 2`, so pass direction explicitly here.
m2.init(org)

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

  // name: moveNodesIn
  // obj: {from:target1,to:target2}
})
mind.bus.addListener('selectNodes', nodes => {
  console.log('selectNodes', nodes)
})
mind.bus.addListener('unselectNodes', nodes => {
  console.log('unselectNodes', nodes)
})
mind.bus.addListener('selectSummary', summary => {
  console.log('selectSummary: ', summary)
})

const dl2 = async () => {
  const url = await exportImage(mind, 'jpeg', {
    backgroundColor: mind.theme.cssVar['--bgcolor'],
    watermarkEnabled: false,
  })
  await downloadUrl(url, 'my-capture.jpg')
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

// const convertedData = plaintextToMindElixir(plaintextExample)
// console.log('convertedData', convertedData)
// mind.refresh(convertedData)
// mind.toCenter()
// const plaintext = mindElixirToPlaintext(mind.getData())
// console.log('plaintext', plaintext)
