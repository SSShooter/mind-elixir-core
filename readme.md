![mindelixir logo](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/logo.png)

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

Mind elixir is a free open source mind map core.

[中文](https://github.com/ssshooter/mind-elixir-core/blob/master/readme.cn.md)

## Use now

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/screenshot.png)

https://mindelixir.ink/#/

### Playground

https://codepen.io/ssshooter/pen/GVQRYK

with React https://codesandbox.io/s/mind-elixir-react-9sisb

with Vue https://codesandbox.io/s/mind-elixir-vue-nqjjl

## Use in your project

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
<script src="https://cdn.jsdelivr.net/npm/regenerator-runtime"></script>
<script src="https://cdn.jsdelivr.net/npm/mind-elixir/dist/mind-elixir.js"></script>
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

```javascript
let options = {
  el: '#map',
  direction: MindElixir.LEFT,
  // create new map data
  data: MindElixir.new('new topic'),
  // the data return from `.getAllData()`
  data: {...},
  draggable: true, // default true
  contextMenu: true, // default true
  toolBar: true, // default true
  nodeMenu: true, // default true
  keypress: true, // default true
  locale: 'en', // [zh_CN,zh_TW,en,ja] waiting for PRs
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
mind.init()

// get a node
E('node-id')

```

### Data Structure

```javascript
// whole node data structure up to now
{
  topic: 'node topic',
  id: 'bd1c24420cd2c2f5',
  style: { fontSize: '32', color: '#3298db', background: '#ecf0f1' },
  parent: null,
  tags: ['Tag'],
  icons: ['😀'],
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
```

### Data Export

```javascript
mind.getAllData() // javascript object, see src/example.js
mind.getAllDataString() // stringify object
mind.getAllDataMd() // markdown
```

### Export as image

```javascript
import painter from 'mind-elixir/dist/painter'
painter.exportSvg()
painter.exportPng()
```

### Operation Guards

```javascript
let mind = new MindElixir({
  ...
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

## Doc

https://doc.mindelixir.ink/
