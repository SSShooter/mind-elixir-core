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

Mind Elixir - это библиотека с открытым исходным кодом для создания интеллект-карт на JavaScript. Вы можете использовать её с любым frontend-фреймворком.

Особенности:

- Легковесность
- Высокая производительность 
- Независимость от фреймворков
- Расширяемость с помощью плагинов
- Встроенные плагины для перетаскивания и редактирования узлов
- Экспорт в SVG / PNG / HTML
- Возможность сворачивать узлы
- Поддержка массовых операций
- Отмена / Повтор действий
- Эффективные горячие клавиши
- Простая стилизация узлов с помощью CSS переменных

<details>
<summary>Содержание</summary>

- [Попробовать сейчас](#попробовать-сейчас)
  - [Playground](#playground)
- [Документация](#документация)
- [Использование](#использование)
  - [Установка](#установка)
    - [NPM](#npm)
    - [Script tag](#script-tag)
  - [Инициализация](#инициализация)
  - [Структура данных](#структура-данных)
  - [Обработка событий](#обработка-событий)
  - [Экспорт и импорт данных](#экспорт-и-импорт-данных)
  - [Контроль операций](#контроль-операций)
- [Экспорт в изображение](#экспорт-в-изображение)
  - [Способ 1](#способ-1)
  - [Способ 2](#способ-2)
- [API](#api)
- [Тема](#тема)
- [Горячие клавиши](#горячие-клавиши)
- [Экосистема](#экосистема)
- [Разработка](#разработка)
- [Благодарности](#благодарности)
- [Контрибьюторы](#контрибьюторы)

</details>

## Попробовать сейчас

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/screenshot2.png)

https://mind-elixir.com/

### Playground

- Vanilla JS - https://codepen.io/ssshooter/pen/OJrJowN
- React - https://codesandbox.io/s/mind-elixir-3-x-react-18-x-vy9fcq
- Vue3 - https://codesandbox.io/s/mind-elixir-3-x-vue3-lth484
- Vue2 - https://codesandbox.io/s/mind-elixir-3-x-vue-2-x-5kdfjp

## Документация

https://docs.mind-elixir.com/

## Использование

### Установка

#### NPM

```bash
npm i mind-elixir -S
```

```javascript
import MindElixir from 'mind-elixir'
```

#### Script tag

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/mind-elixir/dist/MindElixir.js"></script>
```

### Инициализация

```html
<div id="map"></div>
<style>
  #map {
    height: 500px;
    width: 100%;
  }
</style>
```

**Breaking Change** since 1.0.0, `data` should be passed to `init()`, not `options`.

```javascript
import MindElixir from 'mind-elixir'
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
  mouseSelectionButton: 0, // 0 for left button, 2 for right button, default 0
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
MindElixir.E('node-id')
```

### Структура данных

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

### Обработка событий

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

### Экспорт и импорт данных

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

### Контроль операций

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

## Экспорт в изображение

### Способ 1

```typescript
const mind = {
  /** mind elixir instance */
}
const downloadPng = async () => {
  const blob = await mind.exportPng() // Get a Blob!
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'filename.png'
  a.click()
  URL.revokeObjectURL(url)
}
```

### Способ 2

Install `@ssshooter/modern-screenshot`, then:

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

## Тема

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

## Горячие клавиши

| Комбинация клавиш   | Функция                                |
| ------------------- | -------------------------------------- |
| Enter               | Вставить соседний узел                 |
| Tab                 | Вставить дочерний узел                 |
| F1                  | Центрировать карту                     |
| F2                  | Начать редактирование текущего узла    |
| ↑                   | Выбрать предыдущий узел               |
| ↓                   | Выбрать следующий узел                |
| ← / →               | Выбрать родительский или первый дочерний узел |
| PageUp / Alt + ↑    | Переместить узел вверх                 |
| PageDown / Alt + ↓  | Переместить узел вниз                  |
| Ctrl + ↑            | Изменить шаблон расположения на боковой|
| Ctrl + ←            | Изменить шаблон расположения на левый  |
| Ctrl + →            | Изменить шаблон расположения на правый |
| Ctrl + C            | Копировать текущий узел                |
| Ctrl + V            | Вставить скопированный узел            |
| Ctrl + "+"          | Увеличить масштаб карты                |
| Ctrl + "-"          | Уменьшить масштаб карты                |
| Ctrl + 0            | Сбросить масштаб                       |

## Экосистема

- [@mind-elixir/node-menu](https://github.com/ssshooter/node-menu)
- [@mind-elixir/node-menu-neo](https://github.com/ssshooter/node-menu-neo)
- [@mind-elixir/export-xmind](https://github.com/ssshooter/export-xmind)
- [@mind-elixir/export-html](https://github.com/ssshooter/export-html)
- [mind-elixir-react](https://github.com/ssshooter/mind-elixir-react)

PRs are welcome!

## Разработка

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

## Благодарности

- [@viselect/vanilla](https://github.com/simonwep/selection/tree/master/packages/vanilla)

## Контрибьюторы

Спасибо за ваш вклад в Mind Elixir! Ваша поддержка и преданность делают этот проект лучше.

<a href="https://github.com/SSShooter/mind-elixir-core/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=SSShooter/mind-elixir-core&columns=6" />
</a>
