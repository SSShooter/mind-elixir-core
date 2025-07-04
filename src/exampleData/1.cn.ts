import type { MindElixirData } from '../index'
import { codeBlock, katexHTML, styledDiv } from './htmlText'

const aboutMindElixir: MindElixirData = {
  nodeData: {
    id: 'me-root',
    topic: 'Mind Elixir',
    tags: ['思维导图内核'],
    children: [
      {
        topic: 'logo2',
        id: '56dae51a90d350a8',
        direction: 0,
        expanded: true,
        children: [
          {
            id: 'use-image',
            topic: 'mind-elixir',
            image: {
              url: 'https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/logo2.png',
              height: 100,
              width: 90,
              fit: 'contain',
            },
          },
        ],
      },
      {
        topic: '什么是 Mind Elixir',
        id: 'bd4313fbac40284b',
        direction: 0,
        expanded: true,
        children: [
          {
            topic: '一个思维导图内核',
            id: 'beeb823afd6d2114',
          },
          {
            topic: '免费',
            id: 'c1f068377de9f3a0',
          },
          {
            topic: '开源',
            id: 'c1f06d38a09f23ca',
          },
          {
            topic: '无框架依赖',
            id: 'c1f06e4cbcf16463',
            expanded: true,
            children: [
              {
                topic: '无需 JavaScript 框架即可使用',
                id: 'c1f06e4cbcf16464',
              },
              {
                topic: '可插件化',
                id: 'c1f06e4cbcf16465',
              },
            ],
          },
          {
            topic: '在你的项目中使用',
            id: 'c1f1f11a7fbf7550',
            children: [
              {
                topic: "import MindElixir from 'mind-elixir'",
                id: 'c1f1e245b0a89f9b',
              },
              {
                topic: 'new MindElixir({...}).init(data)',
                id: 'c1f1ebc7072c8928',
              },
            ],
          },
          {
            topic: '核心特性',
            id: 'c1f0723c07b408d7',
            expanded: true,
            children: [
              {
                topic: '流畅的用户体验',
                id: 'c1f09612fd89920d',
              },
              {
                topic: '精心设计',
                id: 'c1f09612fd89920e',
              },
              {
                topic: '移动端友好',
                id: 'c1f09612fd89920f',
              },
              {
                topic: '轻量级 & 高性能',
                id: 'c1f09612fd899210',
              },
            ],
          },
        ],
      },
      {
        topic: '高效快捷键',
        id: 'bd1b66c4b56754d9',
        direction: 0,
        expanded: true,
        children: [
          {
            topic: 'Tab - 创建子节点',
            id: 'bd1b6892bcab126a',
          },
          {
            topic: 'Enter - 创建同级节点',
            id: 'bd1b6b632a434b27',
          },
          {
            topic: 'F1 - 居中地图',
            id: 'bd1b983085187c0a',
          },
          {
            topic: 'F2 - 开始编辑',
            id: 'bd1b983085187c0b',
          },
          {
            topic: 'Ctrl + C/V - 复制/粘贴',
            id: 'bd1b983085187c0c',
          },
          {
            topic: 'Ctrl + +/- - 放大/缩小',
            id: 'bd1b983085187c0d',
          },
        ],
      },
      {
        topic: '高级功能',
        id: 'bd1b66c4b56754da',
        direction: 0,
        expanded: true,
        children: [
          {
            topic: '支持批量操作',
            id: 'bd1b6892bcab126b',
            tags: ['新功能'],
          },
          {
            topic: '撤销 / 重做',
            id: 'bd1b6b632a434b28',
            tags: ['新功能'],
          },
          {
            topic: '节点总结',
            id: 'bd1b983085187c0e',
          },
          {
            topic: '使用 CSS 变量轻松样式化',
            id: 'bd1b983085187c0f',
            tags: ['新功能'],
          },
        ],
      },
      {
        topic: '专注模式',
        id: 'bd1b9b94a9a7a913',
        direction: 1,
        expanded: true,
        children: [
          {
            topic: '右键点击并选择专注模式',
            id: 'bd1bb2ac4bbab458',
          },
          {
            topic: '右键点击并选择取消专注模式',
            id: 'bd1bb4b14d6697c3',
          },
        ],
      },
      {
        topic: '左侧菜单',
        id: 'bd1b9d1816ede134',
        direction: 0,
        expanded: true,
        children: [
          {
            topic: '节点分布',
            id: 'bd1ba11e620c3c1a',
            expanded: true,
            children: [
              {
                topic: '左侧',
                id: 'bd1c1cb51e6745d3',
              },
              {
                topic: '右侧',
                id: 'bd1c1e12fd603ff6',
              },
              {
                topic: '左右两侧',
                id: 'bd1c1f03def5c97b',
              },
            ],
          },
        ],
      },
      {
        topic: '底部菜单',
        id: 'bd1ba66996df4ba4',
        direction: 1,
        expanded: true,
        children: [
          {
            topic: '全屏',
            id: 'bd1ba81d9bc95a7e',
          },
          {
            topic: '回到中心',
            id: 'bd1babdd5c18a7a2',
          },
          {
            topic: '放大',
            id: 'bd1bae68e0ab186e',
          },
          {
            topic: '缩小',
            id: 'bd1bb06377439977',
          },
        ],
      },
      {
        topic: '连接',
        id: 'bd1beff607711025',
        direction: 0,
        expanded: true,
        children: [
          {
            topic: '右键点击并选择连接',
            id: 'bd1bf320da90046a',
          },
          {
            topic: '点击要连接的目标',
            id: 'bd1bf6f94ff2e642',
          },
          {
            topic: '使用控制点修改连接',
            id: 'bd1c0c4a487bd036',
          },
          {
            topic: '双向连接',
            id: '4da8dbbc7b71be99',
          },
          {
            topic: '也可用。',
            id: '4da8ded27033a710',
          },
        ],
      },
      {
        topic: '节点样式',
        id: 'bd1c217f9d0b20bd',
        direction: 0,
        expanded: true,
        children: [
          {
            topic: '字体大小',
            id: 'bd1c24420cd2c2f5',
            style: {
              fontSize: '32px',
              color: '#3298db',
            },
          },
          {
            topic: '字体颜色',
            id: 'bd1c2a59b9a2739c',
            style: {
              color: '#c0392c',
            },
          },
          {
            topic: '背景颜色',
            id: 'bd1c2de33f057eb4',
            style: {
              color: '#bdc3c7',
              background: '#2c3e50',
            },
          },
          {
            topic: '添加标签',
            id: 'bd1cff58364436d0',
            tags: ['已完成'],
          },
          {
            topic: '添加图标',
            id: 'bd1d0317f7e8a61a',
            icons: ['😂'],
            tags: ['www'],
          },
          {
            topic: '加粗',
            id: 'bd41fd4ca32322a4',
            style: {
              fontWeight: 'bold',
            },
          },
          {
            topic: '超链接',
            id: 'bd41fd4ca32322a5',
            hyperLink: 'https://github.com/ssshooter/mind-elixir-core',
          },
        ],
      },
      {
        topic: '可拖拽',
        id: 'bd1f03fee1f63bc6',
        direction: 1,
        expanded: true,
        children: [
          {
            topic: '将一个节点拖拽到另一个节点\n前者将成为后者的子节点',
            id: 'bd1f07c598e729dc',
          },
        ],
      },
      {
        topic: '导出 & 导入',
        id: 'beeb7586973430db',
        direction: 1,
        expanded: true,
        children: [
          {
            topic: '导出为 SVG',
            id: 'beeb7a6bec2d68e6',
          },
          {
            topic: '导出为 PNG',
            id: 'beeb7a6bec2d68e7',
            tags: ['新功能'],
          },
          {
            topic: '导出 JSON 数据',
            id: 'beeb784cc189375f',
          },
          {
            topic: '导出为 HTML',
            id: 'beeb7a6bec2d68f5',
          },
        ],
      },
      {
        topic: '生态系统',
        id: 'beeb7586973430dc',
        direction: 1,
        expanded: true,
        children: [
          {
            topic: '@mind-elixir/node-menu',
            id: 'beeb7586973430dd',
            hyperLink: 'https://github.com/ssshooter/node-menu',
          },
          {
            topic: '@mind-elixir/export-xmind',
            id: 'beeb7586973430de',
            hyperLink: 'https://github.com/ssshooter/export-xmind',
          },
          {
            topic: 'mind-elixir-react',
            id: 'beeb7586973430df',
            hyperLink: 'https://github.com/ssshooter/mind-elixir-react',
          },
        ],
      },
      {
        topic: 'dangerouslySetInnerHTML',
        id: 'c00a1cf60baa44f0',
        style: {
          background: '#f1c40e',
        },
        children: [
          {
            topic: 'Katex',
            id: 'c00a2264f4532611',
            children: [
              {
                topic: '',
                id: 'c00a2264f4532612',
                dangerouslySetInnerHTML:
                  '<div class="math math-display"><span class="katex-display"><span class="katex"><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:2.4em;vertical-align:-0.95em;"></span><span class="minner"><span class="mopen delimcenter" style="top:0em;"><span class="delimsizing size1">[</span></span><span class="mord"><span class="mtable"><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.85em;"><span style="top:-3.01em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">x</span></span></span></span><span class="vlist-s">&ZeroWidthSpace;</span></span><span class="vlist-r"><span class="vlist" style="height:0.35em;"><span></span></span></span></span></span><span class="arraycolsep" style="width:0.5em;"></span><span class="arraycolsep" style="width:0.5em;"></span><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:0.85em;"><span style="top:-3.01em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal" style="margin-right:0.03588em;">y</span></span></span></span><span class="vlist-s">&ZeroWidthSpace;</span></span><span class="vlist-r"><span class="vlist" style="height:0.35em;"><span></span></span></span></span></span></span></span><span class="mclose delimcenter" style="top:0em;"><span class="delimsizing size1">]</span></span></span><span class="mspace" style="margin-right:0.1667em;"></span><span class="minner"><span class="mopen delimcenter" style="top:0em;"><span class="delimsizing size3">[</span></span><span class="mord"><span class="mtable"><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.45em;"><span style="top:-3.61em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">a</span></span></span><span style="top:-2.41em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">b</span></span></span></span><span class="vlist-s">&ZeroWidthSpace;</span></span><span class="vlist-r"><span class="vlist" style="height:0.95em;"><span></span></span></span></span></span><span class="arraycolsep" style="width:0.5em;"></span><span class="arraycolsep" style="width:0.5em;"></span><span class="col-align-c"><span class="vlist-t vlist-t2"><span class="vlist-r"><span class="vlist" style="height:1.45em;"><span style="top:-3.61em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">c</span></span></span><span style="top:-2.41em;"><span class="pstrut" style="height:3em;"></span><span class="mord"><span class="mord mathnormal">d</span></span></span></span><span class="vlist-s">&ZeroWidthSpace;</span></span><span class="vlist-r"><span class="vlist" style="height:0.95em;"><span></span></span></span></span></span></span></span><span class="mclose delimcenter" style="top:0em;"><span class="delimsizing size3">]</span></span></span></span></span></span></span></div>',
              },
            ],
          },
          {
            topic: '代码块',
            id: 'c00a2264fdaw32612',
            children: [
              {
                topic: '',
                id: 'c00a2264f4532613',
                dangerouslySetInnerHTML:
                  '<pre class="language-javascript"><code class="language-javascript"><span class="token keyword">let</span> message <span class="token operator">=</span> <span class="token string">"Hello world"</span>\n<span class="token function">alert</span><span class="token punctuation">(</span>message<span class="token punctuation">)</span></code></pre>',
              },
            ],
          },
          {
            topic: '自定义 Div',
            id: 'c00a2264f4532615',
            children: [
              {
                topic: '',
                id: 'c00a2264f4532614',
                dangerouslySetInnerHTML:
                  '<div><style>.title{font-size:50px}</style><div class="title">标题</div><div style="color: red; font-size: 20px;">你好世界</div></div>',
              },
            ],
          },
        ],
        direction: 1,
      },
      {
        topic: '主题系统',
        id: 'bd42dad21aaf6baf',
        direction: 1,
        expanded: true,
        children: [
          {
            topic: '内置主题',
            id: 'bd42e1d0163ebf05',
            expanded: true,
            children: [
              {
                topic: 'Latte (浅色)',
                id: 'bd42e619051878b4',
                style: {
                  background: '#ffffff',
                  color: '#444446',
                },
              },
              {
                topic: '深色主题',
                id: 'bd42e97d7ac35e9a',
                style: {
                  background: '#252526',
                  color: '#ffffff',
                },
              },
            ],
          },
          {
            topic: '自定义 CSS 变量',
            id: 'bd42e1d0163ebf06',
            tags: ['灵活'],
          },
          {
            topic: '调色板自定义',
            id: 'bd42e1d0163ebf07',
            tags: ['10 种颜色'],
          },
        ],
      },
    ],
    expanded: true,
  },
  arrows: [
    {
      id: 'ac5fb1df7345e9c4',
      label: '渲染',
      from: 'beeb784cc189375f',
      to: 'beeb7a6bec2d68f5',
      delta1: {
        x: 142.8828125,
        y: -57,
      },
      delta2: {
        x: 146.1171875,
        y: 45,
      },
      bidirectional: false,
    },
    {
      id: '4da8e3367b63b640',
      label: '双向！',
      from: '4da8dbbc7b71be99',
      to: '4da8ded27033a710',
      delta1: {
        x: -186,
        y: 7,
      },
      delta2: {
        x: -155,
        y: 28,
      },
      bidirectional: true,
      style: {
        stroke: '#8839ef',
        labelColor: '#8839ef',
        strokeWidth: '2',
        strokeDasharray: '2,5',
        opacity: '1',
      },
    },
  ],
  summaries: [
    {
      id: 'a5e68e6a2ce1b648',
      parent: 'bd42e1d0163ebf04',
      start: 0,
      end: 1,
      label: '总结',
    },
    {
      id: 'a5e6978f1bc69f4a',
      parent: 'bd4313fbac40284b',
      start: 3,
      end: 5,
      label: '总结',
    },
  ],
  direction: 2,
  theme: {
    name: 'Latte',
    // 更新的调色板，颜色更鲜艳
    palette: ['#dd7878', '#ea76cb', '#8839ef', '#e64553', '#fe640b', '#df8e1d', '#40a02b', '#209fb5', '#1e66f5', '#7287fd'],
    // 增强的 CSS 变量，更好的样式控制
    cssVar: {
      '--node-gap-x': '30px',
      '--node-gap-y': '10px',
      '--main-gap-x': '32px',
      '--main-gap-y': '12px',
      '--root-radius': '30px',
      '--main-radius': '20px',
      '--root-color': '#ffffff',
      '--root-bgcolor': '#4c4f69',
      '--root-border-color': 'rgba(0, 0, 0, 0)',
      '--main-color': '#444446',
      '--main-bgcolor': '#ffffff',
      '--topic-padding': '3px',
      '--color': '#777777',
      '--bgcolor': '#f6f6f6',
      '--selected': '#4dc4ff',
      '--panel-color': '#444446',
      '--panel-bgcolor': '#ffffff',
      '--panel-border-color': '#eaeaea',
    },
  },
}

export default aboutMindElixir
