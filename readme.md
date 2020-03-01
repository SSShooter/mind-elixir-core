![mindelixir logo](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/logo.png)

<p>
  <a href="https://www.npmjs.com/package/mind-elixir"><img src="https://img.shields.io/npm/v/mind-elixir" alt="version"></a>
  <img src="https://img.shields.io/npm/l/mind-elixir" alt="license">
</p>

Mind elixir is a free open source mind map core.

[中文](https://github.com/ssshooter/mind-elixir-core/blob/master/readme.cn.md)

## Use now

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/screenshot.png)

https://mindelixir.ink/#/

### Playground

https://codepen.io/ssshooter/pen/GVQRYK

React https://codesandbox.io/s/mind-elixir-playground-9sisb

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
let mind = new MindElixir({
  el: '#map',
  direction: MindElixir.LEFT,
  // create new map data
  data: MindElixir.new('new topic'),
  // or set as data that is return from `.getAllData()`
  data: {...},
  draggable: true, // default true
  contextMenu: true, // default true
  toolBar: true, // default true
  nodeMenu: true, // default true
  keypress: true, // default true
})
mind.init()

// get a node
E('node-id')

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

## Doc

https://doc.mindelixir.ink/

## Dependency

[hotkeys-js](https://www.npmjs.com/package/hotkeys-js)
