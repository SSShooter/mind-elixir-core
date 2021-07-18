![mindelixir logo](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/logo.png)

<p>
  <a href="https://www.npmjs.com/package/mind-elixir"><img src="https://img.shields.io/npm/v/mind-elixir" alt="version"></a>
  <img src="https://img.shields.io/npm/l/mind-elixir" alt="license">
</p>

Mind elixir 是一个免费开源的思维导图内核

## 立即试用

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/screenshot.cn.png)

https://mindelixir.ink/#/

## 在项目中使用

### 安装

#### NPM

```bash
npm i mind-elixir -S
```

```javascript
import MindElixir, { E } from 'mind-elixir'
```

#### script 标签引入

```html
<script src="https://cdn.jsdelivr.net/npm/mind-elixir/dist/mind-elixir.js"></script>
```

### HTML 结构

```html
<div class="outer">
  <div id="map"></div>
</div>
<style>
  #map {
    height: 500px;
    width: 100%;
  }
</style>
```

### 初始化

```javascript
let mind = new MindElixir({
  el: '#map',
  direction: MindElixir.LEFT,
  // 创建新数据
  data: MindElixir.new('new topic'), 
  // 也使用 getDataAll 得到的数据
  data: {...},
  draggable: true, // 启用拖动 default true
  contextMenu: true, // 启用右键菜单 default true
  toolBar: true, // 启用工具栏 default true
  nodeMenu: true, // 启用节点菜单 default true
  keypress: true, // 启用快捷键 default true
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

## 使用提示

### direction 选项

direction 选项可选 `MindElixir.LEFT`、`MindElixir.RIGHT` 和 `MindElixir.SIDE`。

### HTML 结构

挂载的目标需要定宽高，可以是百分百；外层元素建议设置 `position: relative;`，否则菜单位置以视窗为标准分布。

### E 函数

在使用节点操作方法时需要传入的参数可以借助 `E` 函数获得。

```javascript
mind.insertSibling(E('bd4313fbac40284b'))
```

## 文档

https://inspiring-golick-3c01b9.netlify.com/
