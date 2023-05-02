<p align="center"><a href="mind-elixir.com" target="_blank" rel="noopener noreferrer"><img width="150" src="https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/logo2.png" alt="mindelixir logo2"></a><h1 align="center">Mind Elixir</h1></p>

<p align="center">
  <a href="https://www.npmjs.com/package/mind-elixir">
    <img src="https://img.shields.io/npm/v/mind-elixir" alt="version">
  </a>
  <img src="https://img.shields.io/npm/l/mind-elixir" alt="license">
  <a href="https://app.codacy.com/gh/ssshooter/mind-elixir-core?utm_source=github.com&utm_medium=referral&utm_content=ssshooter/mind-elixir-core&utm_campaign=Badge_Grade_Settings">
    <img src="https://api.codacy.com/project/badge/Grade/09fadec5bf094886b30cea6aabf3a88b" alt="code quality">
  </a>
  <a href="https://bundlephobia.com/result?p=mind-elixir">
    <img src="https://badgen.net/bundlephobia/dependency-count/mind-elixir" alt="dependency-count">
  </a>
  <a href="https://packagephobia.com/result?p=mind-elixir">
    <img src="https://packagephobia.com/badge?p=mind-elixir" alt="dependency-count">
  </a>
</p>

[中文 README](https://github.com/ssshooter/mind-elixir-core/blob/master/readme.cn.md)

Mind elixir is a free open source mind map core.

- Zero dependency
- High performance
- Lightweight
- Framework agnostic
- Pluginable
- Build-in drag and drop / node edit plugin
- Styling your node with CSS

<details>
<summary>Table of Contents</summary>

- [Doc](#doc)
- [Try now](#try-now)
  - [Playground](#playground)
    - [Vanilla JS](#vanilla-js)
    - [Use with React](#use-with-react)
    - [Use with Vue](#use-with-vue)
    - [Use with Vue3](#use-with-vue3)
- [Usage](#usage)
  - [Install](#install)
    - [NPM](#npm)
    - [Script tag](#script-tag)
  - [HTML structure](#html-structure)
  - [Init](#init)
  - [Data Structure](#data-structure)
  - [Event Handling](#event-handling)
  - [Data Export And Import](#data-export-and-import)
  - [Operation Guards](#operation-guards)
- [Theme](#theme)
- [Not only core](#not-only-core)

</details>

## Doc

https://doc.mind-elixir.com/

## Try now

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/screenshot.png)

https://mind-elixir.com/

### Playground

#### Vanilla JS

https://codepen.io/ssshooter/pen/GVQRYK

#### Use with React

https://codesandbox.io/s/mind-elixir-react-9sisb

#### Use with Vue

https://codesandbox.io/s/mind-elixir-vue-nqjjl

#### Use with Vue3

https://codesandbox.io/s/mind-elixir-vue3-dtcq6u

## Usage

### Install

#### NPM

```bash
npm i mind-elixir -S
```

```javascript
import MindElixir, { E } from 'mind-elixir'
```

#### Script tag

```html
<script src="https://cdn.jsdelivr.net/npm/mind-elixir/dist/MindElixir.js"></script>
```

### HTML structure

```html
<div id="map"></div>
<style>
  #map {
    height: 500px;
    width: 100%;
  }
</style>
```

### Init

**Breaking Change** since 1.0.0, `data` should be passed to `init()`, not `options`.

```javascript
import MindElixir, { E } from 'mind-elixir'
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
  mainNodeVerticalGap: 15, // default 25
  mainNodeHorizontalGap: 15, // default 65
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
  allowUndo: false,
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
E('node-id')
```

### Data Structure

```javascript
// whole node data structure up to now
const nodeData = {
  topic: 'node topic',
  id: 'bd1c24420cd2c2f5',
  style: { fontSize: '32', color: '#3298db', background: '#ecf0f1' },
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
    },
    // all variables see /src/index.less
  },
  // ...
}
```

## Not only core

- [@mind-elixir/export-xmind](https://github.com/ssshooter/export-xmind)
- [@mind-elixir/export-html](https://github.com/ssshooter/export-html)
- [@mind-elixir/export-image](https://github.com/ssshooter/export-image) (WIP🚧)
- [mind-elixir-react](https://github.com/ssshooter/mind-elixir-react)
