<p align="center">
  <a href="https://docs.mind-elixir.com" target="_blank" rel="noopener noreferrer">
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

[English](/readme.md)
[中文](/readme/zh.md)
[Español](/readme/es.md)
[Français](/readme/fr.md)
[Português](/readme/pt.md)
[Русский](/readme/ru.md)
[日本語](/readme/ja.md)

Mind elixir 是一个开源的 JavaScript 思维导图核心。你可以在任何前端框架中使用它。

特点：

- 轻量级
- 高性能
- 框架无关
- 插件化
- 内置拖放 / 节点编辑插件
- 导出为 SVG / PNG / Html
- 总结节点
- 支持批量操作
- 撤销 / 重做
- 高效快捷键
- 轻松使用 CSS 变量样式化节点

<details>
<summary>目录</summary>

- [立即试用](#立即试用)
  - [演示](#演示)
- [文档](#文档)
- [使用](#使用)
  - [安装](#安装)
    - [NPM](#npm)
    - [Script 标签](#script-标签)
  - [初始化](#初始化)
  - [数据结构](#数据结构)
  - [事件处理](#事件处理)
  - [数据导出和导入](#数据导出和导入)
  - [操作守卫](#操作守卫)
- [导出为图片](#导出为图片)
  - [方案 1](#方案-1)
  - [方案 2](#方案-2)
- [API](#api)
- [主题](#主题)
- [快捷键](#快捷键)
- [生态](#生态)
- [开发](#开发)
- [感谢](#感谢)
- [贡献者](#贡献者)

</details>

## 立即试用

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/screenshot2.png)

https://mind-elixir.com/

### 演示

- 原生 JS - https://codepen.io/ssshooter/pen/OJrJowN
- React - https://codesandbox.io/s/mind-elixir-3-x-react-18-x-vy9fcq
- Vue3 - https://codesandbox.io/s/mind-elixir-3-x-vue3-lth484
- Vue2 - https://codesandbox.io/s/mind-elixir-3-x-vue-2-x-5kdfjp

## 文档

https://docs.mind-elixir.com/

## 使用

### 安装

#### NPM

```bash
npm i mind-elixir -S
```

```javascript
import MindElixir from 'mind-elixir'
```

#### Script 标签

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/mind-elixir/dist/MindElixir.js"></script>
```

### 初始化

```html
<div id="map"></div>
<style>
  #map {
    height: 500px;
    width: 100%;
  }
</style>
```

**重大变更** 自 1.0.0 起，`data` 应传递给 `init()`，而不是 `options`。

```javascript
import MindElixir from 'mind-elixir'
import example from 'mind-elixir/dist/example1'

let options = {
  el: '#map', // 或 HTMLDivElement
  direction: MindElixir.LEFT,
  draggable: true, // 默认 true
  contextMenu: true, // 默认 true
  toolBar: true, // 默认 true
  nodeMenu: true, // 默认 true
  keypress: true, // 默认 true
  locale: 'en', // [zh_CN,zh_TW,en,ja,pt,ru] 等待 PRs
  overflowHidden: false, // 默认 false
  mainLinkStyle: 2, // [1,2] 默认 1
  mouseSelectionButton: 0, // 0 为左键，2 为右键，默认 0
  contextMenuOption: {
    focus: true,
    link: true,
    extend: [
      {
        name: '节点编辑',
        onclick: () => {
          alert('扩展菜单')
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

mind.install(plugin) // 安装你的插件

// 创建新的地图数据
const data = MindElixir.new('new topic')
// 或 `example`
// 或从 `.getData()` 返回的数据
mind.init(data)

// 获取一个节点
MindElixir.E('node-id')
```

### 数据结构

```javascript
// 到目前为止的整个节点数据结构
const nodeData = {
  topic: '节点主题',
  id: 'bd1c24420cd2c2f5',
  style: { fontSize: '32', color: '#3298db', background: '#ecf0f1' },
  expanded: true,
  parent: null,
  tags: ['标签'],
  icons: ['😀'],
  hyperLink: 'https://github.com/ssshooter/mind-elixir-core',
  image: {
    url: 'https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/logo2.png', // 必填
    // 你需要查询图片的高度和宽度，并计算显示图片的适当值
    height: 90, // 必填
    width: 90, // 必填
  },
  children: [
    {
      topic: '子节点',
      id: 'xxxx',
      // ...
    },
  ],
}
```

### 事件处理

```javascript
mind.bus.addListener('operation', operation => {
  console.log(operation)
  // 返回 {
  //   name: 操作名称,
  //   obj: 目标对象
  // }

  // name: [insertSibling|addChild|removeNode|beginEdit|finishEdit]
  // obj: 目标

  // name: moveNode
  // obj: {from:目标1,to:目标2}
})

mind.bus.addListener('selectNode', node => {
  console.log(node)
})

mind.bus.addListener('expandNode', node => {
  console.log('expandNode: ', node)
})
```

### 数据导出和导入

```javascript
// 数据导出
const data = mind.getData() // JavaScript 对象，见 src/example.js
mind.getDataString() // 字符串化对象
mind.getDataMd() // Markdown

// 数据导入
// 初始化
let mind = new MindElixir(options)
mind.init(data)
// 数据更新
mind.refresh(data)
```

### 操作守卫

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

## 导出为图片

### 方案 1

```typescript
const mind = {
  /** mind elixir 实例 */
}
const downloadPng = async () => {
  const blob = await mind.exportPng() // 获取 Blob！
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'filename.png'
  a.click()
  URL.revokeObjectURL(url)
}
```

### 方案 2

安装 `@ssshooter/modern-screenshot`，然后：

```typescript
import { domToPng } from '@ssshooter/modern-screenshot'

const download = async () => {
  const dataUrl = await domToPng(mind.nodes, {
    onCloneNode: node => {
      const n = node as HTMLDivElement
      n.style.position = ''
      n.style.top = ''
      n.style.left = ''
      n.style.bottom = ''
      n.style.right = ''
    },
    padding: 300,
    quality: 1,
  })
  const link = document.createElement('a')
  link.download = 'screenshot.png'
  link.href = dataUrl
  link.click()
}
```

## API

https://github.com/ssshooter/mind-elixir-core/blob/master/api/mind-elixir.api.md

## 主题

```javascript
const options = {
  // ...
  theme: {
    name: 'Dark',
    // 主线颜色调色板
    palette: ['#848FA0', '#748BE9', '#D2F9FE', '#4145A5', '#789AFA', '#706CF4', '#EF987F', '#775DD5', '#FCEECF', '#DA7FBC'],
    // 覆盖 CSS 变量
    cssVar: {
      '--main-color': '#ffffff',
      '--main-bgcolor': '#4c4f69',
      '--color': '#cccccc',
      '--bgcolor': '#252526',
      '--panel-color': '255, 255, 255',
      '--panel-bgcolor': '45, 55, 72',
    },
    // 所有变量见 /src/index.less
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

请注意，Mind Elixir 不会观察 `prefers-color-scheme` 的变化。当方案变化时，请**手动**更改主题。

## 快捷键

| 快捷键             | 功能                             |
| ------------------ | -------------------------------- |
| Enter              | 插入兄弟节点                     |
| Tab                | 插入子节点                       |
| F1                 | 居中地图                         |
| F2                 | 开始编辑当前节点                 |
| ↑                  | 选择上一个兄弟节点               |
| ↓                  | 选择下一个兄弟节点               |
| ← / →              | 选择父节点或第一个子节点         |
| PageUp / Alt + ↑   | 上移节点                         |
| PageDown / Alt + ↓ | 下移节点                         |
| Ctrl + ↑           | 更改布局模式为侧面               |
| Ctrl + ←           | 更改布局模式为左侧               |
| Ctrl + →           | 更改布局模式为右侧               |
| Ctrl + C           | 复制当前节点                     |
| Ctrl + V           | 粘贴复制的节点                   |
| Ctrl + "+"         | 放大思维导图                     |
| Ctrl + "-"         | 缩小思维导图                     |
| Ctrl + 0           | 重置缩放级别                     |

## 生态

- [@mind-elixir/node-menu](https://github.com/ssshooter/node-menu)
- [@mind-elixir/node-menu-neo](https://github.com/ssshooter/node-menu-neo)
- [@mind-elixir/export-xmind](https://github.com/ssshooter/export-xmind)
- [@mind-elixir/export-html](https://github.com/ssshooter/export-html)
- [mind-elixir-react](https://github.com/ssshooter/mind-elixir-react)

欢迎 PR！

## 开发

```
pnpm i
pnpm dev
```

使用 `dev.dist.ts` 测试生成的文件：

```
pnpm build
pnpm link ./
```

更新文档：

```
# 安装 api-extractor
pnpm install -g @microsoft/api-extractor
# 维护 /src/docs.ts
# 生成文档
pnpm doc
pnpm doc:md
```

## 感谢

- [@viselect/vanilla](https://github.com/simonwep/selection/tree/master/packages/vanilla)

## 贡献者

感谢你们对 Mind Elixir 的贡献！你们的支持和奉献使这个项目变得更好。

<a href="https://github.com/SSShooter/mind-elixir-core/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=SSShooter/mind-elixir-core&columns=6" />
</a>