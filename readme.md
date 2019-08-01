![mindelixir logo](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/logo.png)

Mind elixir is a free open source mind map core.

[中文](https://github.com/ssshooter/mind-elixir-core/blob/master/readme.cn.md)

## Use now

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/screenshot.png)

https://mindelixir.ink/#/

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
<script src="https://cdn.jsdelivr.net/npm/mind-elixir@0.6.1/dist/mind-elixir.js"></script>
```

### HTML structure

```html
<div class="outer">
  <div id="map"></div>
</div>
<style>
  .outer {
    position: relative;
    margin: 50px;
  }
  #map {
    height: 500px;
    width: 100%;
    overflow: auto;
  }
</style>
```

### Init

```javascript
let mind = new MindElixir({
  el: '#map',
  direction: MindElixir.LEFT,
  data: MindElixir.new('new topic'), // can also set data return from .getAllData()
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

### Data Export

```javascript
mind.getAllData()
// see src/example.js
```

## Doc

https://inspiring-golick-3c01b9.netlify.com/

## Dependency

[hotkeys-js](https://www.npmjs.com/package/hotkeys-js)