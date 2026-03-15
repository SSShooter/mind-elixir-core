---
name: Integrate Mind Elixir
description: Guide for integrating Mind Elixir into a frontend project, covering installation, initialization, data structure, and basic usage.
---

# Integrate Mind Elixir

This skill guides you through the process of integrating `mind-elixir` into a frontend project. Mind Elixir is a framework-agnostic JavaScript mind map core.

## 1. Installation

You can install Mind Elixir via your package manager or use a script tag.

### NPM / Yarn / PNPM

```bash
npm i mind-elixir -S
# or
pnpm i mind-elixir
# or
yarn add mind-elixir
```

### Script Tag

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/mind-elixir/dist/MindElixir.js"></script>
```

**CSS**:
If you use the script tag, you also need to import the CSS:

```css
@import 'https://cdn.jsdelivr.net/npm/mind-elixir/dist/style.css';
```

## 2. Basic Usage

### HTML Structure

Create a container for the mind map.

```html
<div id="map"></div>
<style>
  #map {
    height: 500px;
    width: 100%;
  }
</style>
```

### Initialization

Import and initialize Mind Elixir in your JavaScript/TypeScript file.

```javascript
import MindElixir from 'mind-elixir'
import { en } from 'mind-elixir/i18n'
import 'mind-elixir/style.css'

// 1. Define options
let options = {
  el: '#map', // or HTMLDivElement
  direction: MindElixir.LEFT,
  toolBar: true, // default true
  keypress: true, // default true
  overflowHidden: false, // default false
  mouseSelectionButton: 0, // 0 for left button, 2 for right button, default 0
  contextMenu: {
    locale: en, // [cn,zh_CN,zh_TW,en,ru,ja,pt,it,es,fr,ko,ro,da,fi,de,nl,nb,sv]
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
  }, // default true
  before: {
    insertSibling(type, obj) {
      return true
    },
  },
  // Custom markdown parser (optional)
  // markdown: (text) => customMarkdownParser(text), // provide your own markdown parser function
}

// 2. Create instance
let mind = new MindElixir(options)

// 3. Initialize with data
// Create new data
const data = MindElixir.new('new topic')
// Or use existing data passed from backend
// const data = { ... }

mind.init(data)
```

## 3. Data Structure

The standard node data structure is as follows:

```javascript
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
    url: 'https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/logo2.png',
    height: 90,
    width: 90,
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

## 4. Basic Operations

### Get Data

```javascript
const data = mind.getData() // Returns the current data object
const dataString = mind.getDataString() // Returns serialized data string
```

### Refresh Data

If you have updated data from an external source or need to re-render:

```javascript
mind.refresh(data)
```

## 5. Event Handling

You can listen to various events using `mind.bus`.

```javascript
// Listen to all operations
mind.bus.addListener('operation', operation => {
  console.log(operation)
  // operation: { name: 'action_name', obj: target_object }
})

// Listen to node selection
mind.bus.addListener('selectNodes', nodes => {
  console.log(nodes)
})

// Listen to node expansion
mind.bus.addListener('expandNode', node => {
  console.log('expandNode: ', node)
})
```

## 6. Operation Guards

You can use `before` hooks to intercept and control user operations. This is useful for asynchronous validation or saving data before applying changes.

```javascript
let mind = new MindElixir({
  // ... other options
  before: {
    // Return true to allow, false to prevent
    // Supports async functions
    async addChild(el, obj) {
      try {
        await saveDataToDb()
        return true
      } catch (err) {
        return false // Operation blocked
      }
    },
    // Other hooks: insertSibling, removeNode, moveNode, etc.
  },
})
```

## 7. Theme Customization

You can customize the theme during initialization or dynamically.

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
```

Change theme dynamically:

```javascript
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
