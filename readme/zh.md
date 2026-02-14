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

Mind elixir 是一个开源的 JavaScript 思维导图核心。你可以在任何前端框架中使用它。

## 特性

### 🎨 **用户体验**

- **流畅的交互** - 流畅直观的交互体验
- **精心设计** - 现代简洁的界面
- **移动端友好** - 支持移动设备的触摸事件
- **高效快捷键** - 为高级用户提供的键盘快捷键

### ⚡ **性能与架构**

- **轻量级** - 最小的打包体积
- **高性能** - 针对大型思维导图优化
- **框架无关** - 可与任何前端框架配合使用
- **插件化** - 可扩展的架构

### 🛠️ **核心功能**

- **交互式编辑** - 内置拖放和节点编辑功能
- **批量操作** - 多节点选择和操作
- **撤销/重做** - 完整的操作历史
- **节点连接与总结** - 自定义节点连接和内容总结

### 📤 **导出与定制**

- **多种导出格式** - SVG / PNG / HTML 导出
- **轻松样式化** - 使用 CSS 变量自定义思维导图
- **主题支持** - 内置主题和自定义样式

[v5 破坏性变更](https://github.com/SSShooter/mind-elixir-core/wiki/Breaking-Change#500)

<details>
<summary>目录</summary>

- [特性](#特性)
  - [🎨 **用户体验**](#-用户体验)
  - [⚡ **性能与架构**](#-性能与架构)
  - [🛠️ **核心功能**](#️-核心功能)
  - [📤 **导出与定制**](#-导出与定制)
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
  - [Markdown 支持](#markdown-支持)
  - [操作守卫](#操作守卫)
- [导出为图片](#导出为图片)
  - [已弃用的 API](#已弃用的-api)
- [主题](#主题)
- [快捷键](#快捷键)
- [谁在使用](#谁在使用)
- [生态系统](#生态系统)
- [开发](#开发)
- [感谢](#感谢)
- [贡献者](#贡献者)

</details>

## 立即试用

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/screenshot5_2.jpg)

https://mind-elixir.com/

### 演示

- Vanilla JS - https://codepen.io/ssshooter/pen/vEOqWjE
- React - https://codesandbox.io/p/devbox/mind-elixir-3-x-react-18-x-forked-f3mtcd
- Vue3 - https://codesandbox.io/p/sandbox/mind-elixir-3-x-vue3-lth484

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

并在你的 CSS 文件中添加：

```css
@import 'https://cdn.jsdelivr.net/npm/mind-elixir/dist/style.css';
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
  keypress: true, // 默认 true
  locale: 'en', // [zh_CN,zh_TW,en,ja,pt,ru,ro] 等待 PRs
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

mind.bus.addListener('selectNodes', nodes => {
  console.log(nodes)
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

// 数据导入
// 初始化
let mind = new MindElixir(options)
mind.init(data)
// 数据更新
mind.refresh(data)
```

### Markdown 支持

Mind Elixir 支持自定义 markdown 解析：

```javascript
// 禁用 markdown（默认）
let mind = new MindElixir({
  // 省略 markdown 选项 - 不进行 markdown 处理
})

// 使用自定义 markdown 解析器
let mind = new MindElixir({
  markdown: text => {
    // 你的自定义 markdown 实现
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
  },
})

// 使用任何 markdown 库（例如 marked、markdown-it 等）
import { marked } from 'marked'
let mind = new MindElixir({
  markdown: text => marked(text),
})
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

安装 `@zumer/snapdom`，然后：

```typescript
import { snapdom } from '@zumer/snapdom'

const download = async () => {
  const result = await snapdom(mind.nodes)
  await result.download({ format: 'jpg', filename: 'my-capture' })
}
```

有关其他导出格式和高级选项，请参阅 [Mind Elixir 文档](https://ssshooter.com/en/how-to-use-mind-elixir/#exporting-images)。

### 已弃用的 API

> ⚠️ **已弃用**：`mind.exportSvg()` 方法已弃用，将在未来版本中移除。

```typescript
// 已弃用 - 请不要在新项目中使用
const svgData = await mind.exportSvg()
```

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

请参阅 [快捷键指南](https://docs.mind-elixir.com/docs/guides/shortcuts) 获取详细信息。

## 谁在使用

- [Mind Elixir Desktop](https://desktop.mind-elixir.com/)

## 生态系统

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

使用 [DeepWiki](https://deepwiki.com/SSShooter/mind-elixir-core) 了解更多关于 Mind Elixir 的信息

## 感谢

- [@viselect/vanilla](https://github.com/simonwep/selection/tree/master/packages/vanilla)

## 贡献者

感谢你们对 Mind Elixir 的贡献！你们的支持和奉献使这个项目变得更好。

<a href="https://github.com/SSShooter/mind-elixir-core/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=SSShooter/mind-elixir-core" />
</a>
