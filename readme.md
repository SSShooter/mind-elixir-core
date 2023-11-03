<p align="center">
  <a href="mind-elixir.com" target="_blank" rel="noopener noreferrer">
    <img width="150" src="https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/logo2.png" alt="mindelixir logo2">
  </a>
  <h1 align="center">Mind Elixir</h1>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/mind-elixir">
    <img src="https://img.shields.io/npm/v/mind-elixir" alt="version">
  </a>
  <a href="https://github.com/ssshooter/mind-elixir-core/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/mind-elixir" alt="license">
  </a>
  <a href="https://app.codacy.com/gh/ssshooter/mind-elixir-core?utm_source=github.com&utm_medium=referral&utm_content=ssshooter/mind-elixir-core&utm_campaign=Badge_Grade_Settings">
    <img src="https://api.codacy.com/project/badge/Grade/09fadec5bf094886b30cea6aabf3a88b" alt="code quality">
  </a>
  <a href="https://bundlephobia.com/result?p=mind-elixir">
    <img src="https://badgen.net/bundlephobia/dependency-count/mind-elixir" alt="dependency-count">
  </a>
  <a href="https://packagephobia.com/result?p=mind-elixir">
    <img src="https://packagephobia.com/badge?p=mind-elixir" alt="package size">
  </a>
</p>

[中文 README](https://github.com/ssshooter/mind-elixir-core/blob/master/readme.cn.md)

Mind elixir is a free open source mind map core.

- Lightweight
- High performance
- Framework agnostic
- Pluginable
- Export as SVG or PNG
- Build-in drag and drop / node edit plugin
- Summarize nodes
- Styling your node with CSS
- Undo / Redo
- Efficient shortcuts

<details>
<summary>Table of Contents</summary>

- [Try now](#try-now)
  - [Playground](#playground)
- [Usage](#usage)
  - [Install](#install)
    - [NPM](#npm)
    - [Script tag](#script-tag)
  - [Init](#init)
  - [Data Structure](#data-structure)
  - [Event Handling](#event-handling)
  - [Data Export And Import](#data-export-and-import)
  - [Operation Guards](#operation-guards)
- [Export as a Image](#export-as-a-image)
- [APIs](#apis)
- [Theme](#theme)
- [Shortcuts](#shortcuts)
- [Not only core](#not-only-core)
- [Development](#development)
- [Thanks](#thanks)

</details>

## Try now

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/screenshot2.png)

https://mind-elixir.com/

### Playground

- Vanilla JS - https://codepen.io/ssshooter/pen/OJrJowN
- React - https://codesandbox.io/s/mind-elixir-3-x-react-18-x-vy9fcq
- Vue3 - https://codesandbox.io/s/mind-elixir-3-x-vue3-lth484
- Vue2 - https://codesandbox.io/s/mind-elixir-3-x-vue-2-x-5kdfjp

## Usage

### Install

#### NPM

```bash
npm i mind-elixir -S
```

```javascript
import MindElixir from 'mind-elixir'
```

#### Script tag

```html
<script src="https://cdn.jsdelivr.net/npm/mind-elixir/dist/MindElixir.js"></script>
```

### Init

```html
<div id="map"></div>
<style>
  #map {
    height: 500px;
    width: 100%;
  }
</style>
```

**Breaking Change** since 1.0.0, `data` should be passed to `init()`, not `options`.

```javascript
import MindElixir from 'mind-elixir'
import example from 'mind-elixir/dist/example1'

let options = {
  el: '#map', // or HTMLDivElement
  direction: MindElixir.LEFT,
  draggable: true, // default true
  contextMenu: true, // default true
  toolBar: true, // default true
  nodeMenu: true, // default true
  keypress: true, // default true
  locale: 'en', // [zh_CN,zh_TW,en,ja,pt,ru] waiting for PRs
  overflowHidden: false, // default false
  mainLinkStyle: 2, // [1,2] default 1
  mouseSelectionButton: 0, // 0 for left button, 2 for right button, default 0
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
  before: {
    insertSibling(el, obj) {
      return true
    },
    async addChild(el, obj) {
      await sleep()
      return true
    },
  },
}

let mind = new MindElixir(options)

mind.install(plugin) // install your plugin

// create new map data
const data = MindElixir.new('new topic')
// or `example`
// or the data return from `.getData()`
mind.init(data)

// get a node
MindElixir.E('node-id')
```

### Data Structure

```javascript
// whole node data structure up to now
const nodeData = {
  topic: 'node topic',
  id: 'bd1c24420cd2c2f5',
  style: { fontSize: '32', color: '#3298db', background: '#ecf0f1' },
  expanded: true,
  parent: null,
  tags: ['Tag'],
  icons: ['😀'],
  hyperLink: 'https://github.com/ssshooter/mind-elixir-core',
  image: {
    url: 'https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/logo2.png', // required
    // you need to query the height and width of the image and calculate the appropriate value to display the image
    height: 90, // required
    width: 90, // required
  },
  children: [
    {
      topic: 'child',
      id: 'xxxx',
      // ...
    },
  ],
}
```

### Event Handling

```javascript
mind.bus.addListener('operation', operation => {
  console.log(operation)
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
```

### Data Export And Import

```javascript
// data export
const data = mind.getData() // javascript object, see src/example.js
mind.getDataString() // stringify object
mind.getDataMd() // markdown

// data import
// initiate
let mind = new MindElixir(options)
mind.init(data)
// data update
mind.refresh(data)
```

### Operation Guards

```javascript
let mind = new MindElixir({
  // ...
  before: {
    insertSibling(el, obj) {
      console.log(el, obj)
      if (this.currentNode.nodeObj.parent.root) {
        return false
      }
      return true
    },
    async addChild(el, obj) {
      await sleep()
      if (this.currentNode.nodeObj.parent.root) {
        return false
      }
      return true
    },
  },
})
```

## Export as a Image

```typescript
const mind = {
  /** mind elixir instance */
}
const downloadPng = async () => {
  const blob = await mind.exportPng() // Get a Blob!
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'filename.png'
  a.click()
  URL.revokeObjectURL(url)
}
```

## APIs

https://github.com/ssshooter/mind-elixir-core/blob/master/api/mind-elixir.api.md

## Theme

```javascript
const options = {
  // ...
  theme: {
    name: 'Dark',
    // main lines color palette
    palette: ['#848FA0', '#748BE9', '#D2F9FE', '#4145A5', '#789AFA', '#706CF4', '#EF987F', '#775DD5', '#FCEECF', '#DA7FBC'],
    // overwrite css variables
    cssVar: {
      '--main-color': '#ffffff',
      '--main-bgcolor': '#4c4f69',
      '--color': '#cccccc',
      '--bgcolor': '#252526',
      '--panel-color': '255, 255, 255',
      '--panel-bgcolor': '45, 55, 72',
    },
    // all variables see /src/index.less
  },
  // ...
}

// ...

mind.changeTheme({
  name: 'Latte',
  palette: ['#dd7878', '#ea76cb', '#8839ef', '#e64553', '#fe640b', '#df8e1d', '#40a02b', '#209fb5', '#1e66f5', '#7287fd'],
  cssVar: {
    '--main-color': '#444446',
    '--main-bgcolor': '#ffffff',
    '--color': '#777777',
    '--bgcolor': '#f6f6f6',
  },
})
```

Be aware that Mind Elixir will not observe the change of `prefers-color-scheme`. Please change the theme **manually** when the scheme changes.

## Shortcuts

| Shortcut           | Function                         |
| ------------------ | -------------------------------- |
| Enter              | Insert Sibling Node              |
| Tab                | Insert Child Node                |
| F1                 | Center the Map                   |
| F2                 | Begin Editing the Current Node   |
| ↑                  | Select the Previous Sibling Node |
| ↓                  | Select the Next Sibling Node     |
| ← / →              | Select Parent or First Child     |
| PageUp / Alt + ↑   | Move Up Node                     |
| PageDown / Alt + ↓ | Move Down Node                   |
| Ctrl + ↑           | Change Layout Pattern to Side    |
| Ctrl + ←           | Change Layout Pattern to Left    |
| Ctrl + →           | Change Layout Pattern to Right   |
| Ctrl + C           | Copy the Current Node            |
| Ctrl + V           | Paste the Copied Node            |
| Ctrl + "+"         | Zoom In Mind Map                 |
| Ctrl + "-"         | Zoom Out Mind Map                |
| Ctrl + 0           | Reset Zoom Level                 |

## Not only core

- [@mind-elixir/node-menu](https://github.com/ssshooter/node-menu)
- [@mind-elixir/node-menu-neo](https://github.com/ssshooter/node-menu-neo)
- [@mind-elixir/export-xmind](https://github.com/ssshooter/export-xmind)
- [@mind-elixir/export-html](https://github.com/ssshooter/export-html)
- [mind-elixir-react](https://github.com/ssshooter/mind-elixir-react)

## Development

```
pnpm i
pnpm dev
```

Test generated files with `dev.dist.ts`:

```
npm run build
npm link
npm link mind-elixir
```

## Thanks

- [@viselect/vanilla](https://github.com/simonwep/selection/tree/master/packages/vanilla)
