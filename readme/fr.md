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

Mind Elixir est un noyau JavaScript open source pour créer des cartes mentales. Vous pouvez l'utiliser avec n'importe quel framework frontend de votre choix.

Caractéristiques :

- Léger
- Haute performance
- Indépendant du framework
- Extensible via plugins
- Plugin intégré pour le glisser-déposer / édition de nœuds
- Export en SVG / PNG / Html
- Résumé des nœuds
- Opérations en masse supportées
- Annuler / Refaire
- Raccourcis efficaces
- Stylisation facile des nœuds avec les variables CSS

<details>
<summary>Table des matières</summary>

- [Essayer maintenant](#essayer-maintenant)
  - [Playground](#playground)
- [Documentation](#documentation)
- [Utilisation](#utilisation)
  - [Installation](#installation)
    - [NPM](#npm)
    - [Balise script](#balise-script)
  - [Initialisation](#initialisation)
  - [Structure des données](#structure-des-données)
  - [Gestion des événements](#gestion-des-événements)
  - [Export et import des données](#export-et-import-des-données)
  - [Gardes d'opération](#gardes-dopération)
- [Exporter en image](#exporter-en-image)
  - [Solution 1](#solution-1)
  - [Solution 2](#solution-2)
- [Thème](#thème)
- [Raccourcis](#raccourcis)
- [Écosystème](#écosystème)
- [Développement](#développement)
- [Remerciements](#remerciements)
- [Contributeurs](#contributeurs)

</details>

## Essayer maintenant

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/screenshot5_2.jpg)

https://mind-elixir.com/

### Playground

- Vanilla JS - https://codepen.io/ssshooter/pen/vEOqWjE
- React - https://codesandbox.io/p/devbox/mind-elixir-3-x-react-18-x-forked-f3mtcd
- Vue3 - https://codesandbox.io/p/sandbox/mind-elixir-3-x-vue3-lth484

## Documentation

https://docs.mind-elixir.com/

## Utilisation

### Installation

#### NPM

```bash
npm i mind-elixir -S
```

```javascript
import MindElixir from 'mind-elixir'
```

#### Balise script

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/mind-elixir/dist/MindElixir.js"></script>
```

Et dans votre fichier CSS :

```css
@import 'https://cdn.jsdelivr.net/npm/mind-elixir/dist/style.css';
```

### Initialisation

```html
<div id="map"></div>
<style>
  #map {
    height: 500px;
    width: 100%;
  }
</style>
```

**Changement majeur** depuis la version 1.0.0, `data` doit être passé à `init()`, et non `options`.

```javascript
import MindElixir from 'mind-elixir'
import { fr } from 'mind-elixir/i18n'
import example from 'mind-elixir/dist/example1'

let options = {
  el: '#map', // ou HTMLDivElement
  direction: MindElixir.LEFT,
  draggable: true, // par défaut true
  contextMenu: true, // par défaut true
  toolBar: true, // par défaut true
  keypress: true, // par défaut true
  overflowHidden: false, // par défaut false
  mouseSelectionButton: 0, // 0 pour le bouton gauche, 2 pour le bouton droit, par défaut 0
  contextMenu: {
    locale: fr,
    focus: true,
    link: true,
    extend: [
      {
        name: 'Édition de nœud',
        onclick: () => {
          alert('menu étendu')
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

mind.install(plugin) // installer votre plugin

// créer de nouvelles données de carte
const data = MindElixir.new('nouveau sujet')
// ou `example`
// ou les données retournées par `.getData()`
mind.init(data)

// obtenir un nœud
MindElixir.E('node-id')
```

### Structure des données

```javascript
// structure complète des données de nœud jusqu'à présent
const nodeData = {
  topic: 'sujet du nœud',
  id: 'bd1c24420cd2c2f5',
  style: { fontSize: '32', color: '#3298db', background: '#ecf0f1' },
  expanded: true,
  parent: null,
  tags: ['Tag'],
  icons: ['😀'],
  hyperLink: 'https://github.com/ssshooter/mind-elixir-core',
  image: {
    url: 'https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/logo2.png', // requis
    // vous devez interroger la hauteur et la largeur de l'image et calculer la valeur appropriée pour afficher l'image
    height: 90, // requis
    width: 90, // requis
  },
  children: [
    {
      topic: 'enfant',
      id: 'xxxx',
      // ...
    },
  ],
}
```

### Gestion des événements

```javascript
mind.bus.addListener('operation', operation => {
  console.log(operation)
  // return {
  //   name: nom de l'action,
  //   obj: objet cible
  // }

  // name: [insertSibling|addChild|removeNode|beginEdit|finishEdit]
  // obj: cible

  // name: moveNode
  // obj: {from:cible1,to:cible2}
})

mind.bus.addListener('selectNodes', nodes => {
  console.log(nodes)
})

mind.bus.addListener('expandNode', node => {
  console.log('expandNode: ', node)
})
```

### Export et import des données

```javascript
// export des données
const data = mind.getData() // objet javascript, voir src/example.js
mind.getDataString() // objet en chaîne

// import des données
// initialisation
let mind = new MindElixir(options)
mind.init(data)
// mise à jour des données
mind.refresh(data)
```

### Gardes d'opération

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

## Exporter en image

### Solution 1

```typescript
const mind = {
  /** instance mind elixir */
}
const downloadPng = async () => {
  const blob = await mind.exportPng() // Obtenez un Blob !
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'filename.png'
  a.click()
  URL.revokeObjectURL(url)
}
```

### Solution 2

Installer `@ssshooter/modern-screenshot`, puis :

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

## Thème

```javascript
const options = {
  // ...
  theme: {
    name: 'Dark',
    // palette de couleurs des lignes principales
    palette: ['#848FA0', '#748BE9', '#D2F9FE', '#4145A5', '#789AFA', '#706CF4', '#EF987F', '#775DD5', '#FCEECF', '#DA7FBC'],
    // remplacer les variables css
    cssVar: {
      '--main-color': '#ffffff',
      '--main-bgcolor': '#4c4f69',
      '--color': '#cccccc',
      '--bgcolor': '#252526',
      '--panel-color': '255, 255, 255',
      '--panel-bgcolor': '45, 55, 72',
    },
    // toutes les variables voir /src/index.less
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

Soyez conscient que Mind Elixir n'observera pas le changement de `prefers-color-scheme`. Veuillez changer le thème **manuellement** lorsque le schéma change.

## Raccourcis

| Raccourci          | Fonction                                    |
| ------------------ | ------------------------------------------- |
| Entrée             | Insérer un nœud frère                       |
| Tab                | Insérer un nœud enfant                      |
| F1                 | Centrer la carte                            |
| F2                 | Commencer l'édition du nœud actuel          |
| ↑                  | Sélectionner le nœud frère précédent        |
| ↓                  | Sélectionner le nœud frère suivant          |
| ← / →              | Sélectionner le parent ou le premier enfant |
| PageUp / Alt + ↑   | Déplacer le nœud vers le haut               |
| PageDown / Alt + ↓ | Déplacer le nœud vers le bas                |
| Ctrl + ↑           | Changer la disposition en mode latéral      |
| Ctrl + ←           | Changer la disposition vers la gauche       |
| Ctrl + →           | Changer la disposition vers la droite       |
| Ctrl + C           | Copier le nœud actuel                       |
| Ctrl + V           | Coller le nœud copié                        |
| Ctrl + "+"         | Zoomer la carte mentale                     |
| Ctrl + "-"         | Dézoomer la carte mentale                   |
| Ctrl + 0           | Réinitialiser le niveau de zoom             |

## Écosystème

- [@mind-elixir/node-menu](https://github.com/ssshooter/node-menu)
- [@mind-elixir/node-menu-neo](https://github.com/ssshooter/node-menu-neo)
- [@mind-elixir/export-xmind](https://github.com/ssshooter/export-xmind)
- [@mind-elixir/export-html](https://github.com/ssshooter/export-html)
- [mind-elixir-react](https://github.com/ssshooter/mind-elixir-react)

Les PRs sont les bienvenues !

## Développement

```
pnpm i
pnpm dev
```

Tester les fichiers générés avec `dev.dist.ts` :

```
pnpm build
pnpm link ./
```

Mettre à jour la documentation :

```
# Installer api-extractor
pnpm install -g @microsoft/api-extractor
# Maintenir /src/docs.ts
# Générer la documentation
pnpm doc
pnpm doc:md
```

## Remerciements

- [@viselect/vanilla](https://github.com/simonwep/selection/tree/master/packages/vanilla)

## Contributeurs

Merci pour vos contributions à Mind Elixir ! Votre soutien et votre dévouement rendent ce projet meilleur.

<a href="https://github.com/SSShooter/mind-elixir-core/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=SSShooter/mind-elixir-core" />
</a>
