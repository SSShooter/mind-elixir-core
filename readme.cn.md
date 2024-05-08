<p align="center"><a href="mind-elixir.com" target="_blank" rel="noopener noreferrer"><img width="150" src="https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/logo2.png" alt="mindelixir logo2"></a></p>

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

Mind elixir 是一个无框架依赖的思维导图内核

[English](https://github.com/ssshooter/mind-elixir-core/blob/master/readme.md)

## 立即尝试

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/screenshot2.png)

https://mind-elixir.com/#/

### Playground

https://codepen.io/ssshooter/pen/GVQRYK

with React https://codesandbox.io/s/mind-elixir-react-9sisb

with Vue https://codesandbox.io/s/mind-elixir-vue-nqjjl

## 如何使用

### 安装

#### NPM

```bash
npm i mind-elixir -S
```

```javascript
import MindElixir, { E } from 'mind-elixir'
```

#### Script 标签

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/mind-elixir/dist/mind-elixir.js"></script>
```

### HTML 结构

```html
<div id="map"></div>
<style>
  #map {
    height: 500px;
    width: 100%;
  }
</style>
```

### 初始化

```javascript
import MindElixir, { E } from 'mind-elixir'
import { exportSvg, exportPng } from '../dist/painter'
import example from '../dist/example1'

let options = {
  el: '#map',
  direction: MindElixir.LEFT,
  // create new map data
  data: MindElixir.new('new topic') or example,
  // the data return from `.getData()`
  draggable: true, // default true
  contextMenu: true, // default true
  toolBar: true, // default true
  nodeMenu: true, // default true
  keypress: true, // default true
  locale: 'en', // [zh_CN,zh_TW,en,ja,pt] waiting for PRs
  overflowHidden: false, // default false
  mainLinkStyle: 2, // [1,2] default 1
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

### 数据结构

```javascript
// whole node data structure up to now
{
  topic: 'node topic',
  id: 'bd1c24420cd2c2f5',
  style: { fontSize: '32', color: '#3298db', background: '#ecf0f1' },
  parent: null,
  tags: ['Tag'],
  icons: ['😀'],
  hyperLink: 'https://github.com/ssshooter/mind-elixir-core',
}
```

### 事件处理

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

### 数据导出

```javascript
mind.getData() // javascript object, see src/example.js
mind.getDataString() // stringify object
mind.getDataMd() // markdown
```

### 输出图片

**WIP**

```javascript
import painter from 'mind-elixir/dist/painter'
painter.exportSvg()
painter.exportPng()
```

### 操作拦截

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

## 文档

https://docs.mind-elixir.com/zh-Hans/
