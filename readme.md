![mindelixir logo](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/logo.png)

<p>
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

- High performance
- Lightweight
- Framework agnostic
- Pluginable
- Build-in drag and drop / node edit plugin

## Doc

https://doc.mind-elixir.com/

## Try now

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/screenshot.png)

https://mind-elixir.com/#/

### Playground

https://codepen.io/ssshooter/pen/GVQRYK

with React https://codesandbox.io/s/mind-elixir-react-9sisb

with Vue https://codesandbox.io/s/mind-elixir-vue-nqjjl

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
import example from '../dist/example1'

let options = {
  el: '#map', // or HTMLDivElement
  direction: MindElixir.LEFT,
  draggable: true, // default true
  contextMenu: true, // default true
  toolBar: true, // default true
  nodeMenu: true, // default true
  keypress: true, // default true
  locale: 'en', // [zh_CN,zh_TW,en,ja,pt] waiting for PRs
  overflowHidden: false, // default false
  primaryLinkStyle: 2, // [1,2] default 1
  primaryNodeVerticalGap: 15, // default 25
  primaryNodeHorizontalGap: 15, // default 65
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
// or the data return from `.getAllData()`
mind.init(data)

// get a node
E('node-id')
```

### Data Structure

```javascript
// whole node data structure up to now
nodeData = {
  topic: 'node topic',
  id: 'bd1c24420cd2c2f5',
  style: { fontSize: '32', color: '#3298db', background: '#ecf0f1' },
  parent: null,
  tags: ['Tag'],
  icons: ['😀'],
  hyperLink: 'https://github.com/ssshooter/mind-elixir-core',
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

### Data Export

```javascript
mind.getAllData() // javascript object, see src/example.js
mind.getAllDataString() // stringify object
mind.getAllDataMd() // markdown
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

## Not only core

- [@mind-elixir/export-xmind](https://github.com/ssshooter/export-xmind)
- [@mind-elixir/export-html](https://github.com/ssshooter/export-html)
- [@mind-elixir/export-image](https://github.com/ssshooter/export-image) (WIP🚧)
