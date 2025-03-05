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

[English](/readme.md) |
[中文](/readme/zh.md) |
[Español](/readme/es.md) |
[Français](/readme/fr.md) |
[Português](/readme/pt.md) |
[Русский](/readme/ru.md) |
[日本語](/readme/ja.md) |
[한국어](/readme/ko.md)

Mind Elixir는 오픈 소스 JavaScript 마인드맵 코어입니다. 원하는 프론트엔드 프레임워크와 함께 사용할 수 있습니다.

특징:

- 경량화
- 고성능
- 프레임워크에 구애받지 않음
- 플러그인 지원
- 드래그 앤 드롭 / 노드 편집 플러그인 내장
- SVG / PNG / HTML 내보내기
- 노드 요약
- 대량 작업 지원
- 실행 취소 / 다시 실행
- 효율적인 단축키
- CSS 변수로 쉽게 노드 스타일링

<details>
<summary>목차</summary>

- [지금 시작하기](#지금-시작하기)
  - [플레이그라운드](#플레이그라운드)
- [문서](#문서)
- [사용법](#사용법)
  - [설치](#설치)
    - [NPM](#npm)
    - [스크립트 태그](#스크립트-태그)
  - [초기화](#초기화)
  - [데이터 구조](#데이터-구조)
  - [이벤트 처리](#이벤트-처리)
  - [데이터 내보내기와 가져오기](#데이터-내보내기와-가져오기)
  - [작업 가드](#작업-가드)
- [이미지로 내보내기](#이미지로-내보내기)
  - [방법 1](#방법-1)
  - [방법 2](#방법-2)
- [API](#api)
- [테마](#테마)
- [단축키](#단축키)
- [생태계](#생태계)
- [개발](#개발)
- [감사의 말](#감사의-말)
- [기여자](#기여자)

</details>

## 지금 시작하기

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/screenshot2.png)

https://mind-elixir.com/

### 플레이그라운드

- Vanilla JS - https://codepen.io/ssshooter/pen/OJrJowN
- React - https://codesandbox.io/s/mind-elixir-3-x-react-18-x-vy9fcq
- Vue3 - https://codesandbox.io/s/mind-elixir-3-x-vue3-lth484
- Vue2 - https://codesandbox.io/s/mind-elixir-3-x-vue-2-x-5kdfjp

## 문서

https://docs.mind-elixir.com/

## 사용법

### 설치

#### NPM

```bash
npm i mind-elixir -S
```

```javascript
import MindElixir from 'mind-elixir'
```

#### 스크립트 태그

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/mind-elixir/dist/MindElixir.js"></script>
```

### 초기화

```html
<div id="map"></div>
<style>
  #map {
    height: 500px;
    width: 100%;
  }
</style>
```

**주요 변경사항** 1.0.0 버전부터 `data`는 `options`가 아닌 `init()`에 전달되어야 합니다.

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

### 데이터 구조

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

### 이벤트 처리

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

### 데이터 내보내기와 가져오기

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

### 작업 가드

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

## 이미지로 내보내기

### 방법 1

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

### 방법 2

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

## 테마

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

## 단축키

| 단축키             | 기능                       |
| ----------------- | -------------------------- |
| Enter             | 형제 노드 삽입              |
| Tab               | 자식 노드 삽입              |
| F1                | 맵 중앙 정렬                |
| F2                | 현재 노드 편집 시작          |
| ↑                 | 이전 형제 노드 선택          |
| ↓                 | 다음 형제 노드 선택          |
| ← / →             | 부모 또는 첫 자식 노드 선택   |
| PageUp / Alt + ↑  | 노드 위로 이동              |
| PageDown / Alt + ↓| 노드 아래로 이동            |
| Ctrl + ↑          | 레이아웃을 측면으로 변경     |
| Ctrl + ←          | 레이아웃을 왼쪽으로 변경     |
| Ctrl + →          | 레이아웃을 오른쪽으로 변경    |
| Ctrl + C          | 현재 노드 복사              |
| Ctrl + V          | 복사된 노드 붙여넣기         |
| Ctrl + "+"        | 마인드맵 확대               |
| Ctrl + "-"        | 마인드맵 축소               |
| Ctrl + 0          | 확대/축소 수준 초기화        |

## 생태계

- [@mind-elixir/node-menu](https://github.com/ssshooter/node-menu)
- [@mind-elixir/node-menu-neo](https://github.com/ssshooter/node-menu-neo)
- [@mind-elixir/export-xmind](https://github.com/ssshooter/export-xmind)
- [@mind-elixir/export-html](https://github.com/ssshooter/export-html)
- [mind-elixir-react](https://github.com/ssshooter/mind-elixir-react)

PR은 언제나 환영입니다!

## 개발

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

## 감사의 말

- [@viselect/vanilla](https://github.com/simonwep/selection/tree/master/packages/vanilla)

## 기여자

Mind Elixir에 기여해 주셔서 감사합니다! 여러분의 지원과 헌신이 이 프로젝트를 더 좋게 만들어 갑니다.

<a href="https://github.com/SSShooter/mind-elixir-core/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=SSShooter/mind-elixir-core&columns=6" />
</a>
