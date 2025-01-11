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

Mind Elixirは、オープンソースのJavaScriptマインドマップコアです。お好みのフロントエンドフレームワークと組み合わせて使用できます。

特徴：

- 軽量
- 高パフォーマンス
- フレームワーク非依存
- プラグイン対応
- ドラッグ＆ドロップ/ノード編集プラグイン内蔵
- SVG/PNG/HTMLとしてエクスポート可能
- ノードの要約
- 一括操作対応
- 元に戻す/やり直し
- 効率的なショートカット
- CSSカスタマイズが容易

<details>
<summary>目次</summary>

- [デモを試す](#デモを試す)
  - [プレイグラウンド](#プレイグラウンド)
- [ドキュメント](#ドキュメント)
- [使い方](#使い方)
  - [インストール](#インストール)
    - [NPM](#npm)
    - [スクリプトタグ](#スクリプトタグ)
  - [初期化](#初期化)
  - [データ構造](#データ構造)
  - [イベントハンドリング](#イベントハンドリング)
  - [データのエクスポートとインポート](#データのエクスポートとインポート)
  - [操作ガード](#操作ガード)
- [画像としてエクスポート](#画像としてエクスポート)
  - [方法1](#方法1)
  - [方法2](#方法2)
- [API](#api)
- [テーマ](#テーマ)
- [ショートカット](#ショートカット)
- [エコシステム](#エコシステム)
- [開発](#開発)
- [謝辞](#謝辞)
- [貢献者](#貢献者)

</details>

## デモを試す

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/screenshot2.png)

https://mind-elixir.com/

### プレイグラウンド

- Vanilla JS - https://codepen.io/ssshooter/pen/OJrJowN
- React - https://codesandbox.io/s/mind-elixir-3-x-react-18-x-vy9fcq
- Vue3 - https://codesandbox.io/s/mind-elixir-3-x-vue3-lth484
- Vue2 - https://codesandbox.io/s/mind-elixir-3-x-vue-2-x-5kdfjp

## ドキュメント

https://docs.mind-elixir.com/

## 使い方

### インストール

#### NPM

```bash
npm i mind-elixir -S
```

```javascript
import MindElixir from 'mind-elixir'
```

#### スクリプトタグ

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/mind-elixir/dist/MindElixir.js"></script>
```

### 初期化

```html
<div id="map"></div>
<style>
  #map {
    height: 500px;
    width: 100%;
  }
</style>
```

**重要な変更** バージョン1.0.0以降、`data`は`options`ではなく`init()`に渡す必要があります。

```javascript
import MindElixir from 'mind-elixir'
import example from 'mind-elixir/dist/example1'

let options = {
  el: '#map', // またはHTMLDivElement
  direction: MindElixir.LEFT,
  draggable: true, // デフォルトはtrue
  contextMenu: true, // デフォルトはtrue
  toolBar: true, // デフォルトはtrue
  nodeMenu: true, // デフォルトはtrue
  keypress: true, // デフォルトはtrue
  locale: 'ja', // [zh_CN,zh_TW,en,ja,pt,ru] PRs募集中
  overflowHidden: false, // デフォルトはfalse
  mainLinkStyle: 2, // [1,2] デフォルトは1
  mouseSelectionButton: 0, // 0は左クリック、2は右クリック、デフォルトは0
  contextMenuOption: {
    focus: true,
    link: true,
    extend: [
      {
        name: 'ノード編集',
        onclick: () => {
          alert('拡張メニュー')
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

mind.install(plugin) // プラグインのインストール

// 新しいマップデータの作成
const data = MindElixir.new('新しいトピック')
// または `example`
// または `.getData()`の戻り値
mind.init(data)

// ノードの取得
MindElixir.E('node-id')
```

### データ構造

```javascript
// 現在のノードデータ構造
const nodeData = {
  topic: 'ノードのトピック',
  id: 'bd1c24420cd2c2f5',
  style: { fontSize: '32', color: '#3298db', background: '#ecf0f1' },
  expanded: true,
  parent: null,
  tags: ['タグ'],
  icons: ['😀'],
  hyperLink: 'https://github.com/ssshooter/mind-elixir-core',
  image: {
    url: 'https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/logo2.png', // 必須
    height: 90, // 必須
    width: 90, // 必須
  },
  children: [
    {
      topic: '子ノード',
      id: 'xxxx',
      // ...
    },
  ],
}
```

### イベントハンドリング

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

### データのエクスポートとインポート

```javascript
// データのエクスポート
const data = mind.getData() // JavaScriptオブジェクト、src/example.jsを参照
mind.getDataString() // オブジェクトを文字列化
mind.getDataMd() // Markdown

// データのインポート
// 初期化
let mind = new MindElixir(options)
mind.init(data)
// データの更新
mind.refresh(data)
```

### 操作ガード

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

## 画像としてエクスポート

### 方法1

```typescript
const mind = {
  /** mind elixir instance */
}
const downloadPng = async () => {
  const blob = await mind.exportPng() // Blobを取得
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'filename.png'
  a.click()
  URL.revokeObjectURL(url)
}
```

### 方法2

`@ssshooter/modern-screenshot`をインストールし、次に実行します：

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

## テーマ

```javascript
const options = {
  // ...
  theme: {
    name: 'Dark',
    // メインラインのカラーパレット
    palette: ['#848FA0', '#748BE9', '#D2F9FE', '#4145A5', '#789AFA', '#706CF4', '#EF987F', '#775DD5', '#FCEECF', '#DA7FBC'],
    // CSS変数の上書き
    cssVar: {
      '--main-color': '#ffffff',
      '--main-bgcolor': '#4c4f69',
      '--color': '#cccccc',
      '--bgcolor': '#252526',
      '--panel-color': '255, 255, 255',
      '--panel-bgcolor': '45, 55, 72',
    },
    // すべての変数は/src/index.lessを参照
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

Mind Elixirは`prefers-color-scheme`の変更を監視しません。スキームが変更された場合は、テーマを**手動で**変更してください。

## ショートカット

| ショートカット       | 機能                           |
| ------------------ | -------------------------------- |
| Enter              | 兄弟ノードを挿入                |
| Tab                | 子ノードを挿入                  |
| F1                 | マップを中央に配置              |
| F2                 | 現在のノードの編集を開始        |
| ↑                  | 前の兄弟ノードを選択            |
| ↓                  | 次の兄弟ノードを選択            |
| ← / →              | 親または最初の子ノードを選択    |
| PageUp / Alt + ↑   | ノードを上に移動                |
| PageDown / Alt + ↓ | ノードを下に移動                |
| Ctrl + ↑           | レイアウトパターンをサイドに変更 |
| Ctrl + ←           | レイアウトパターンを左に変更    |
| Ctrl + →           | レイアウトパターンを右に変更    |
| Ctrl + C           | 現在のノードをコピー            |
| Ctrl + V           | コピーしたノードを貼り付け      |
| Ctrl + "+"         | マインドマップをズームイン      |
| Ctrl + "-"         | マインドマップをズームアウト    |
| Ctrl + 0           | ズームレベルをリセット          |

## エコシステム

- [@mind-elixir/node-menu](https://github.com/ssshooter/node-menu)
- [@mind-elixir/node-menu-neo](https://github.com/ssshooter/node-menu-neo)
- [@mind-elixir/export-xmind](https://github.com/ssshooter/export-xmind)
- [@mind-elixir/export-html](https://github.com/ssshooter/export-html)
- [mind-elixir-react](https://github.com/ssshooter/mind-elixir-react)

PRsは大歓迎です！

## 開発

```
pnpm i
pnpm dev
```

`dev.dist.ts`で生成されたファイルをテストします：

```
pnpm build
pnpm link ./
```

ドキュメントを更新します：

```
# api-extractorをインストール
pnpm install -g @microsoft/api-extractor
# /src/docs.tsを維持
# ドキュメントを生成
pnpm doc
pnpm doc:md
```

## 謝辞

- [@viselect/vanilla](https://github.com/simonwep/selection/tree/master/packages/vanilla)

## 貢献者

Mind Elixirへの貢献に感謝します！あなたのサポートと献身がこのプロジェクトをより良くします。

<a href="https://github.com/SSShooter/mind-elixir-core/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=SSShooter/mind-elixir-core&columns=6" />
</a>
