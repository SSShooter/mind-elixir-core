<p align="center">
  <a href="https://docs.mind-elixir.com" target="_blank" rel="noopener noreferrer">
    <img width="150" src="https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/logo2.png" alt="mindelixir logo2">
  </a>
  <h1 align="center">Mind Elixir</h1>
</p>

<p align="center">
<a href="https://trendshift.io/repositories/13049" target="_blank"><img src="https://trendshift.io/api/badge/repositories/13049" alt="SSShooter%2Fmind-elixir-core | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
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

[English](/readme.md) |
[中文](/readme/zh.md) |
[Español](/readme/es.md) |
[Français](/readme/fr.md) |
[Português](/readme/pt.md) |
[Русский](/readme/ru.md) |
[日本語](/readme/ja.md) |
[한국어](/readme/ko.md)

Mind elixir is a open source JavaScript mind map core. You can use it with any frontend framework you like.

## Features

### 🎨 **User Experience**

- **Fluent UX** - Smooth and intuitive interactions
- **Well designed** - Clean and modern interface
- **Mobile friendly** - Touch events for mobile devices
- **Efficient shortcuts** - Keyboard shortcuts for power users

### ⚡ **Performance & Architecture**

- **Lightweight** - Minimal bundle size
- **High performance** - Optimized for large mind maps
- **Framework agnostic** - Works with any frontend framework
- **Pluginable** - Extensible architecture

### 🛠️ **Core Features**

- **Interactive editing** - Built-in drag and drop / node edit capabilities
- **Bulk operations** - Multi-node selection and operations
- **Undo / Redo** - Complete operation history
- **Node connections & summarization** - Custom node linking and content summarization

### 📤 **Export & Customization**

- **Multiple export formats** - SVG / PNG / HTML export
- **Easy styling** - Customize mindmap with CSS variables
- **Theme support** - Built-in themes and custom styling

[v5 Breaking Changes](https://github.com/SSShooter/mind-elixir-core/wiki/Breaking-Change#500)

<details>
<summary>Table of Contents</summary>

- [Features](#features)
  - [🎨 **User Experience**](#-user-experience)
  - [⚡ **Performance \& Architecture**](#-performance--architecture)
  - [🛠️ **Core Features**](#️-core-features)
  - [📤 **Export \& Customization**](#-export--customization)
- [Try now](#try-now)
  - [Playground](#playground)
- [Documentation](#documentation)
- [Usage](#usage)
  - [Install](#install)
    - [NPM](#npm)
    - [Script tag](#script-tag)
  - [Init](#init)
  - [Data Structure](#data-structure)
  - [Event Handling](#event-handling)
  - [Data Export And Import](#data-export-and-import)
  - [Markdown Support](#markdown-support)
  - [Operation Guards](#operation-guards)
- [Export as a Image](#export-as-a-image)
  - [Deprecated API](#deprecated-api)
- [Theme](#theme)
- [Shortcuts](#shortcuts)
- [Who's using](#whos-using)
- [Ecosystem](#ecosystem)
- [Development](#development)
- [Acknowledgments](#acknowledgments)
- [Contributors](#contributors)

</details>

## Try now

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/screenshot5_2.jpg)

### Playground

- Vanilla JS - https://codepen.io/ssshooter/pen/vEOqWjE
- React - https://codesandbox.io/p/devbox/mind-elixir-3-x-react-18-x-forked-f3mtcd
- Vue3 - https://codesandbox.io/p/sandbox/mind-elixir-3-x-vue3-lth484

## Documentation

https://docs.mind-elixir.com/

## Usage

### Install

#### NPM

```bash
npm i mind-elixir -S
```

```javascript
import MindElixir from 'mind-elixir'
import 'mind-elixir/style.css'
```

#### Script tag

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/mind-elixir/dist/MindElixir.js"></script>
```

And in your CSS file:

```css
@import 'https://cdn.jsdelivr.net/npm/mind-elixir/dist/style.css';
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

```javascript
import MindElixir from 'mind-elixir'
import 'mind-elixir/style.css'
import example from 'mind-elixir/dist/example1'

let options = {
  el: '#map', // or HTMLDivElement
  direction: MindElixir.LEFT,
  draggable: true, // default true
  toolBar: true, // default true
  nodeMenu: true, // default true
  keypress: true, // default true
  locale: 'en', // [zh_CN,zh_TW,en,ja,pt,ru,ro] waiting for PRs
  overflowHidden: false, // default false
  mainLinkStyle: 2, // [1,2] default 1
  mouseSelectionButton: 0, // 0 for left button, 2 for right button, default 0
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
  }, // default true
  before: {
    insertSibling(type, obj) {
      return true
    },
  },
  // Custom markdown parser (optional)
  // markdown: (text) => customMarkdownParser(text), // provide your own markdown parser function
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

mind.bus.addListener('selectNodes', nodes => {
  console.log(nodes)
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

// data import
// initiate
let mind = new MindElixir(options)
mind.init(data)
// data update
mind.refresh(data)
```

### Markdown Support

Mind Elixir supports custom markdown parsing:

```javascript
// Disable markdown (default)
let mind = new MindElixir({
  // markdown option omitted - no markdown processing
})

// Use custom markdown parser
let mind = new MindElixir({
  markdown: text => {
    // Your custom markdown implementation
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
  },
})

// Use any markdown library (e.g., marked, markdown-it, etc.)
import { marked } from 'marked'
let mind = new MindElixir({
  markdown: text => marked(text),
})
```

### Operation Guards

```javascript
let mind = new MindElixir({
  // ...
  before: {
    async addChild(el, obj) {
      await saveDataToDb()
      return true
    },
  },
})
```

## Export as a Image

Install `@zumer/snapdom`, then:

```typescript
import { snapdom } from '@zumer/snapdom'

const download = async () => {
  const result = await snapdom(mind.nodes)
  await result.download({ format: 'jpg', filename: 'my-capture' })
}
```

For other export formats and advanced options, see the [Mind Elixir documentation](https://ssshooter.com/en/how-to-use-mind-elixir/#exporting-images).

### Deprecated API

> ⚠️ **Deprecated**: The `mind.exportSvg()` method is deprecated and will be removed in a future version.

```typescript
// DEPRECATED - Do not use in new projects
const svgData = await mind.exportSvg()
```

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

See [Shortcuts Guide](https://docs.mind-elixir.com/docs/guides/shortcuts) for detailed information.

## Who's using

- [Mind Elixir Desktop](https://desktop.mind-elixir.com/)

## Ecosystem

- [@mind-elixir/node-menu](https://github.com/ssshooter/node-menu)
- [@mind-elixir/node-menu-neo](https://github.com/ssshooter/node-menu-neo)
- [@mind-elixir/export-xmind](https://github.com/ssshooter/export-xmind)
- [@mind-elixir/export-html](https://github.com/ssshooter/export-html)
- [mind-elixir-react](https://github.com/ssshooter/mind-elixir-react)

PRs are welcome!

## Development

```
pnpm i
pnpm dev
```

Test generated files with `dev.dist.ts`:

```
pnpm build
pnpm link ./
```

Update docs:

```
# Install api-extractor
pnpm install -g @microsoft/api-extractor
# Maintain /src/docs.ts
# Generate docs
pnpm doc
pnpm doc:md
```

Use [DeepWiki](https://deepwiki.com/SSShooter/mind-elixir-core) to learn more about Mind Elixir

## Acknowledgments

- [@viselect/vanilla](https://github.com/simonwep/selection/tree/master/packages/vanilla)

## Contributors

Thanks for your contributions to Mind Elixir! Your support and dedication make this project better.

<a href="https://github.com/SSShooter/mind-elixir-core/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=SSShooter/mind-elixir-core" />
</a>
