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

Mind Elixirは、オープンソースのJavaScriptマインドマップコアです。お好みのフロントエンドフレームワークと組み合わせて使用できます。

## 特徴

### 🎨 **ユーザーエクスペリエンス**

- **滑らかな操作感** - スムーズで直感的な操作性
- **洗練されたデザイン** - 清潔でモダンなインターフェース
- **モバイル対応** - モバイルデバイスのタッチイベントをサポート
- **効率的なショートカット** - パワーユーザー向けのキーボードショートカット

### ⚡ **パフォーマンスとアーキテクチャ**

- **軽量** - 最小バンドルサイズ
- **高性能** - 大規模なマインドマップ用に最適化
- **フレームワーク非依存** - 任意のフロントエンドフレームワークで動作
- **プラグイン可能** - 拡張可能なアーキテクチャ

### 🛠️ **コア機能**

- **インタラクティブ編集** - 組み込みのドラッグ＆ドロップ / ノード編集機能
- **一括操作** - 複数ノードの選択と操作
- **元に戻す/やり直し** - 完全な操作履歴
- **ノード接続と要約** - カスタムノードリンクとコンテンツ要約

### 📤 **エクスポートとカスタマイゼーション**

- **複数のエクスポート形式** - SVG / PNG / HTML エクスポート
- **簡単なスタイリング** - CSS変数でマインドマップをカスタマイズ
- **テーマサポート** - 組み込みテーマとカスタムスタイリング

[v5 破壊的変更](https://github.com/SSShooter/mind-elixir-core/wiki/Breaking-Change#500)

<details>
<summary>目次</summary>

- [特徴](#特徴)
  - [🎨 **ユーザーエクスペリエンス**](#-ユーザーエクスペリエンス)
  - [⚡ **パフォーマンスとアーキテクチャ**](#-パフォーマンスとアーキテクチャ)
  - [🛠️ **コア機能**](#️-コア機能)
  - [📤 **エクスポートとカスタマイゼーション**](#-エクスポートとカスタマイゼーション)
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
  - [Markdown サポート](#markdown-サポート)
  - [操作ガード](#操作ガード)
- [画像としてエクスポート](#画像としてエクスポート)
  - [非推奨API](#非推奨api)
- [テーマ](#テーマ)
- [ショートカット](#ショートカット)
- [誰が使っているか](#誰が使っているか)
- [エコシステム](#エコシステム)
- [開発](#開発)
- [謝辞](#謝辞)
- [貢献者](#貢献者)

</details>

## デモを試す

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/screenshot5_2.jpg)

https://mind-elixir.com/

### プレイグラウンド

- Vanilla JS - https://codepen.io/ssshooter/pen/vEOqWjE
- React - https://codesandbox.io/p/devbox/mind-elixir-3-x-react-18-x-forked-f3mtcd
- Vue3 - https://codesandbox.io/p/sandbox/mind-elixir-3-x-vue3-lth484

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

CSSファイルに追加：

```css
@import 'https://cdn.jsdelivr.net/npm/mind-elixir/dist/style.css';
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
  keypress: true, // デフォルトはtrue
  locale: 'ja', // [zh_CN,zh_TW,en,ja,pt,ru,ro] PRs募集中
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

mind.bus.addListener('selectNodes', nodes => {
  console.log(nodes)
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

// データのインポート
// 初期化
let mind = new MindElixir(options)
mind.init(data)
// データの更新
mind.refresh(data)
```

### Markdown サポート

Mind Elixirはカスタムmarkdown解析をサポートしています：

```javascript
// Markdownを無効化（デフォルト）
let mind = new MindElixir({
  // markdownオプションを省略 - markdown処理なし
})

// カスタムmarkdownパーサーを使用
let mind = new MindElixir({
  markdown: text => {
    // カスタムmarkdown実装
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
  },
})

// 任意のmarkdownライブラリを使用（marked、markdown-itなど）
import { marked } from 'marked'
let mind = new MindElixir({
  markdown: text => marked(text),
})
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

`@zumer/snapdom`をインストールし、次に実行します：

```typescript
import { snapdom } from '@zumer/snapdom'

const download = async () => {
  const result = await snapdom(mind.nodes)
  await result.download({ format: 'jpg', filename: 'my-capture' })
}
```

他のエクスポート形式と詳細なオプションについては、[Mind Elixirドキュメント](https://ssshooter.com/en/how-to-use-mind-elixir/#exporting-images)を参照してください。

### 非推奨API

> ⚠️ **非推奨**：`mind.exportSvg()`メソッドは非推奨であり、将来のバージョンで削除される予定です。

```typescript
// 非推奨 - 新規プロジェクトでは使用しないでください
const svgData = await mind.exportSvg()
```

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

詳細については、[ショートカットガイド](https://docs.mind-elixir.com/docs/guides/shortcuts)を参照してください。

## 誰が使っているか

- [Mind Elixir Desktop](https://desktop.mind-elixir.com/)

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

[DeepWiki](https://deepwiki.com/SSShooter/mind-elixir-core) を使用してMind Elixirについて詳しく学ぶ

## 謝辞

- [@viselect/vanilla](https://github.com/simonwep/selection/tree/master/packages/vanilla)

## 貢献者

Mind Elixirへの貢献に感謝します！あなたのサポートと献身がこのプロジェクトをより良くします。

<a href="https://github.com/SSShooter/mind-elixir-core/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=SSShooter/mind-elixir-core" />
</a>
