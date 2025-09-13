import type { MindElixirData, NodeObj } from '../index'
import { codeBlock, katexHTML, styledDiv } from './htmlText'

type NodeObjWithUseMd = NodeObj & { useMd?: boolean }
type MindElixirDataWithUseMd = Omit<MindElixirData, 'nodeData'> & {
  nodeData: NodeObjWithUseMd & {
    children?: NodeObjWithUseMd[]
  }
}

const aboutMindElixir: MindElixirDataWithUseMd = {
  nodeData: {
    id: 'me-root',
    topic: 'Mind Elixir',
    tags: ['Mind Map Core'],
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
        topic: 'What is Mind Elixir',
        id: 'bd4313fbac40284b',
        direction: 0,
        expanded: true,
        children: [
          {
            topic: 'A mind map core',
            id: 'beeb823afd6d2114',
          },
          {
            topic: 'Free',
            id: 'c1f068377de9f3a0',
          },
          {
            topic: 'Open-Source',
            id: 'c1f06d38a09f23ca',
          },
          {
            topic: 'Framework agnostic',
            id: 'c1f06e4cbcf16463',
            expanded: true,
            children: [
              {
                topic: 'Use without JavaScript framework',
                id: 'c1f06e4cbcf16464',
              },
              {
                topic: 'Pluginable',
                id: 'c1f06e4cbcf16465',
              },
            ],
          },
          {
            topic: 'Use in your own project',
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
            topic: 'Key Features',
            id: 'c1f0723c07b408d7',
            expanded: true,
            children: [
              {
                topic: 'Fluent UX',
                id: 'c1f09612fd89920d',
              },
              {
                topic: 'Well designed',
                id: 'c1f09612fd89920e',
              },
              {
                topic: 'Mobile friendly',
                id: 'c1f09612fd89920f',
              },
              {
                topic: 'Lightweight & High performance',
                id: 'c1f09612fd899210',
              },
            ],
          },
        ],
      },
      {
        topic: 'Efficient Shortcuts',
        id: 'bd1b66c4b56754d9',
        direction: 0,
        expanded: true,
        children: [
          {
            topic: 'Tab - Create a child node',
            id: 'bd1b6892bcab126a',
          },
          {
            topic: 'Enter - Create a sibling node',
            id: 'bd1b6b632a434b27',
          },
          {
            topic: 'F1 - Center the Map',
            id: 'bd1b983085187c0a',
          },
          {
            topic: 'F2 - Begin Editing',
            id: 'bd1b983085187c0b',
          },
          {
            topic: 'Ctrl + C/V - Copy/Paste',
            id: 'bd1b983085187c0c',
          },
          {
            topic: 'Ctrl + +/- - Zoom In/Out',
            id: 'bd1b983085187c0d',
          },
        ],
      },
      {
        topic: 'Advanced Features',
        id: 'bd1b66c4b56754da',
        direction: 0,
        expanded: true,
        children: [
          {
            topic: 'Bulk operations supported',
            id: 'bd1b6892bcab126b',
            tags: ['New'],
          },
          {
            topic: 'Undo / Redo',
            id: 'bd1b6b632a434b28',
            tags: ['New'],
          },
          {
            topic: 'Summarize nodes',
            id: 'bd1b983085187c0e',
          },
          {
            topic: 'Easily Styling with CSS variables',
            id: 'bd1b983085187c0f',
            tags: ['New'],
          },
        ],
      },
      {
        topic: 'Focus mode',
        id: 'bd1b9b94a9a7a913',
        direction: 1,
        expanded: true,
        children: [
          {
            topic: 'Right click and select Focus Mode',
            id: 'bd1bb2ac4bbab458',
          },
          {
            topic: 'Right click and select Cancel Focus Mode',
            id: 'bd1bb4b14d6697c3',
          },
        ],
      },
      {
        topic: 'Left menu',
        id: 'bd1b9d1816ede134',
        direction: 0,
        expanded: true,
        children: [
          {
            topic: 'Node distribution',
            id: 'bd1ba11e620c3c1a',
            expanded: true,
            children: [
              {
                topic: 'Left',
                id: 'bd1c1cb51e6745d3',
              },
              {
                topic: 'Right',
                id: 'bd1c1e12fd603ff6',
              },
              {
                topic: 'Both l & r',
                id: 'bd1c1f03def5c97b',
              },
            ],
          },
        ],
      },
      {
        topic: 'Bottom menu',
        id: 'bd1ba66996df4ba4',
        direction: 1,
        expanded: true,
        children: [
          {
            topic: 'Full screen',
            id: 'bd1ba81d9bc95a7e',
          },
          {
            topic: 'Return to Center',
            id: 'bd1babdd5c18a7a2',
          },
          {
            topic: 'Zoom in',
            id: 'bd1bae68e0ab186e',
          },
          {
            topic: 'Zoom out',
            id: 'bd1bb06377439977',
          },
        ],
      },
      {
        topic: 'Link',
        id: 'bd1beff607711025',
        direction: 0,
        expanded: true,
        children: [
          {
            topic: 'Right click and select Link',
            id: 'bd1bf320da90046a',
          },
          {
            topic: 'Click the target you want to link',
            id: 'bd1bf6f94ff2e642',
          },
          {
            topic: 'Modify link with control points',
            id: 'bd1c0c4a487bd036',
          },
          {
            topic: 'Bidirectional link is',
            id: '4da8dbbc7b71be99',
          },
          {
            topic: 'Also available.',
            id: '4da8ded27033a710',
          },
        ],
      },
      {
        topic: 'Node style',
        id: 'bd1c217f9d0b20bd',
        direction: 0,
        expanded: true,
        children: [
          {
            topic: 'Font Size',
            id: 'bd1c24420cd2c2f5',
            style: {
              fontSize: '32px',
              color: '#3298db',
            },
          },
          {
            topic: 'Font Color',
            id: 'bd1c2a59b9a2739c',
            style: {
              color: '#c0392c',
            },
          },
          {
            topic: 'Background Color',
            id: 'bd1c2de33f057eb4',
            style: {
              color: '#bdc3c7',
              background: '#2c3e50',
            },
          },
          {
            topic: 'Add tags',
            id: 'bd1cff58364436d0',
            tags: ['Completed'],
          },
          {
            topic: 'Add icons',
            id: 'bd1d0317f7e8a61a',
            icons: ['😂'],
            tags: ['www'],
          },
          {
            topic: 'Bolder',
            id: 'bd41fd4ca32322a4',
            style: {
              fontWeight: 'bold',
            },
          },
          {
            topic: 'Hyper link',
            id: 'bd41fd4ca32322a5',
            hyperLink: 'https://github.com/ssshooter/mind-elixir-core',
          },
        ],
      },
      {
        topic: 'Draggable',
        id: 'bd1f03fee1f63bc6',
        direction: 1,
        expanded: true,
        children: [
          {
            topic: 'Drag a node to another node\nand the former one will become a child node of latter one',
            id: 'bd1f07c598e729dc',
          },
        ],
      },
      {
        topic: 'Export & Import',
        id: 'beeb7586973430db',
        direction: 1,
        expanded: true,
        children: [
          {
            topic: 'Export as SVG',
            id: 'beeb7a6bec2d68e6',
          },
          {
            topic: 'Export as PNG',
            id: 'beeb7a6bec2d68e7',
            tags: ['New'],
          },
          {
            topic: 'Export JSON data',
            id: 'beeb784cc189375f',
          },
          {
            topic: 'Export as HTML',
            id: 'beeb7a6bec2d68f5',
          },
        ],
      },
      {
        topic: 'Ecosystem',
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
            topic: 'Code Block',
            id: 'c00a2264fdaw32612',
            children: [
              {
                topic: '',
                id: 'c00a2264f4532613',
                dangerouslySetInnerHTML:
                  '<pre class="language-javascript"><code class="language-javascript"><span class="token keyword">let</span> message <span class="token operator">=</span> <span class="token string">\'Hello world\'</span>\n<span class="token function">alert</span><span class="token punctuation">(</span>message<span class="token punctuation">)</span></code></pre>',
              },
            ],
          },
          {
            topic: 'Customized Div',
            id: 'c00a2264f4532615',
            children: [
              {
                topic: '',
                id: 'c00a2264f4532614',
                dangerouslySetInnerHTML:
                  '<div><style>.title{font-size:50px}</style><div class="title">Title</div><div style="color: red; font-size: 20px;">Hello world</div></div>',
              },
            ],
          },
          // {
          //   topic: 'Video',
          //   id: 'c00a2264ffadw19',
          //   children: [
          //     {
          //       topic: '',
          //       id: 'c00a2264f453fv14',
          //       dangerouslySetInnerHTML:
          //         '<iframe src="//player.bilibili.com/player.html?bvid=BV1aTxMehEjK&poster=1&autoplay=0&danmaku=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>',
          //     },
          //   ],
          // },
        ],
        direction: 1,
      },
      {
        topic: 'KaTeX',
        id: 'markdown-complex-math',
        direction: 1,
        expanded: true,
        children: [
          {
            topic: 'Normal distribution: $$f(x) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}$$',
            id: 'markdown-normal-dist',
            useMd: true,
          },
          {
            topic: 'Fourier transform: $$F(\\omega) = \\int_{-\\infty}^{\\infty} f(t) e^{-i\\omega t} dt$$',
            id: 'markdown-fourier',
            useMd: true,
          },
          {
            topic: 'Taylor series: $$f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n$$',
            id: 'markdown-taylor',
            useMd: true,
          },
          {
            topic: 'Schrödinger equation: $$i\\hbar\\frac{\\partial}{\\partial t}\\Psi = \\hat{H}\\Psi$$',
            id: 'markdown-schrodinger',
            useMd: true,
          },
        ],
      },
      {
        topic: 'Basic Markdown Examples',
        id: 'markdown-basic-examples',
        direction: 1,
        expanded: true,
        children: [
          {
            topic: '# Heading 1',
            id: 'markdown-headings',
            useMd: true,
          },
          {
            topic: '**Bold text** and *italic text* and ***bold italic***',
            id: 'markdown-emphasis',
            useMd: true,
          },
          {
            topic: '- Unordered list item 1\n- Unordered list item 2',
            id: 'markdown-lists',
            useMd: true,
          },
          {
            topic: '[Link to GitHub](https://github.com) and `inline code`',
            id: 'markdown-links-code',
            useMd: true,
          },
          {
            topic: '> This is a blockquote\n> with multiple lines',
            id: 'markdown-blockquote',
            useMd: true,
          },
          {
            topic: '```javascript\nconst greeting = "Hello World!";\nconsole.log(greeting);\n```',
            id: 'markdown-code-block',
            useMd: true,
          },
          {
            topic:
              '| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Row 1    | Data 1   | Info 1   |\n| Row 2    | Data 2   | Info 2   |',
            id: 'markdown-table',
            useMd: true,
          },
        ],
      },
      {
        topic: 'Theme System',
        id: 'bd42dad21aaf6baf',
        direction: 1,
        expanded: true,
        children: [
          {
            topic: 'Built-in Themes',
            id: 'bd42e1d0163ebf05',
            expanded: true,
            children: [
              {
                topic: 'Latte (Light)',
                id: 'bd42e619051878b4',
                style: {
                  background: '#ffffff',
                  color: '#444446',
                },
              },
              {
                topic: 'Dark Theme',
                id: 'bd42e97d7ac35e9a',
                style: {
                  background: '#252526',
                  color: '#ffffff',
                },
              },
            ],
          },
          {
            topic: 'Custom CSS Variables',
            id: 'bd42e1d0163ebf06',
            tags: ['Flexible'],
          },
          {
            topic: 'Color Palette Customization',
            id: 'bd42e1d0163ebf07',
            tags: ['10 Colors'],
          },
        ],
      },
    ],
    expanded: true,
  },
  arrows: [
    {
      id: 'ac5fb1df7345e9c4',
      label: 'Render',
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
      label: 'Bidirectional!',
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
      id: 'a5e6978f1bc69f4a',
      parent: 'bd4313fbac40284b',
      start: 3,
      end: 5,
      label:
        'This is a summary section that groups together related nodes to show their logical connection and relationship. You can customize this text to provide more context about the grouped items.',
      style: {
        labelColor: '#8839ef',
      },
    },
  ],
  direction: 2,
  theme: {
    name: 'Latte',
    // Updated color palette with more vibrant colors
    palette: ['#dd7878', '#ea76cb', '#8839ef', '#e64553', '#fe640b', '#df8e1d', '#40a02b', '#209fb5', '#1e66f5', '#7287fd'],
    // Enhanced CSS variables for better styling control
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
      '--accent-color': '#e64553',
      '--panel-color': '#444446',
      '--panel-bgcolor': '#ffffff',
      '--panel-border-color': '#eaeaea',
      '--map-padding': '50px 80px',
    },
  },
}

export default aboutMindElixir as MindElixirData
