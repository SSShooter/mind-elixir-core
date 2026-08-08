<p align="center">
  <a href="https://docs.mind-elixir.com" target="_blank" rel="noopener noreferrer">
    <img width="150" src="https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/logo2.png" alt="mindelixir logo2">
  </a>
  <h1 align="center">Mind Elixir Core</h1>
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

## Construire avec IA

Utilisez `npx skills add` pour installer des guides dans votre projet :

**Guide d'intégration** :

```bash
npx skills add ssshooter/mind-elixir-core
```

![mind elixir skills](./images/skills.jpg)

<details>
<summary>Table des matières</summary>

- [Essayer maintenant](#essayer-maintenant)
  - [Playground](#playground)
- [Construire avec IA](#construire-avec-ia)
- [Documentation](#documentation)
- [Utilisation](#utilisation)
  - [Installation](#installation)
    - [NPM](#npm)
    - [Balise script](#balise-script)
  - [Initialisation](#initialisation)
  - [Structure des données](#structure-des-données)
  - [Gestion des événements](#gestion-des-événements)
- [Export et import des données](#export-et-import-des-données)
- [Support Markdown](#support-markdown)
- [Gardes d'opération](#gardes-dopération)
- [Exporter en image](#exporter-en-image)
- [Thème](#thème)
- [Raccourcis](#raccourcis)
- [Qui utilise](#qui-utilise)
- [Écosystème](#écosystème)
- [Développement](#développement)
- [Remerciements](#remerciements)
- [Contributeurs](#contributeurs)

</details>

## Essayer maintenant

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/screenshot5_2.jpg)

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
import 'mind-elixir/style.css'
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

```javascript
import MindElixir from 'mind-elixir'
import { fr } from 'mind-elixir/i18n'
import 'mind-elixir/style.css'
import example from 'mind-elixir/dist/example1'

let options = {
  el: '#map', // ou HTMLDivElement
  direction: MindElixir.LEFT,
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
        name: 'Node edit',
        onclick: () => {
          alert('extend menu')
        },
      },
    ],
  }, // par défaut true
  before: {
    insertSibling(type, obj) {
      return true
    },
  },
  // Analyseur markdown personnalisé (optionnel)
  // markdown: (text) => customMarkdownParser(text), // fournissez votre propre fonction d'analyse markdown
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

### Support Markdown

Mind Elixir supporte l'analyse markdown personnalisée :

```javascript
// Désactiver markdown (par défaut)
let mind = new MindElixir({
  // option markdown omise - pas de traitement markdown
})

// Utiliser un analyseur markdown personnalisé
let mind = new MindElixir({
  markdown: text => {
    // Votre implémentation markdown personnalisée
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
  },
})

// Utiliser n'importe quelle bibliothèque markdown (ex. marked, markdown-it, etc.)
import { marked } from 'marked'
let mind = new MindElixir({
  markdown: text => marked(text),
})
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

Installez `@mind-elixir/export-mindmap`, puis :

```typescript
import { downloadImage, exportImage } from '@mind-elixir/export-mindmap'

const download = async () => {
  // Télécharger directement en PNG / JPEG / WEBP
  await downloadImage(mind, 'png')

  // Ou obtenir une URL pour l'aperçu / traitement personnalisé
  const url = await exportImage(mind, 'png', { watermarkEnabled: false }) // passez les options comme ceci
}
```

> Note : Les exports incluent par défaut un filigrane Mind Elixir. Passez `{ watermarkEnabled: false }` dans les options pour le désactiver.

Pour d'autres formats d'export et options avancées, consultez la [documentation Mind Elixir](https://ssshooter.com/en/how-to-use-mind-elixir/#exporting-images).

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
- [export-mindmap](https://github.com/mind-elixir/plugins/tree/main/packages/export-mindmap)
- [mindmapcn](https://github.com/ssshooter/mindmapcn)

Les PRs sont les bienvenues !

## Qui utilise

N'hésitez pas à soumettre un PR pour ajouter votre projet ici !

- [Mind Elixir App](https://app.mind-elixir.com/)
- [ebook-to-mindmap](https://github.com/SSShooter/ebook-to-mindmap)
- [M10C-Video-Summary](https://github.com/SSShooter/M10C-Video-Summary)

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

Régénérer les membres de la classe `MindElixir` :

Les déclarations d'options et de méthodes de la classe `MindElixir` (le bloc `// #region GENERATED` dans `src/index.ts`) sont générées par `gen-members.js` à partir des déclarations compilées dans `dist/types`, afin que le `.d.ts` publié et la documentation de l'API affichent des signatures entièrement développées. Après avoir modifié les méthodes mixées (`src/methods.ts`) ou l'interface `Options` (`src/types/index.ts`), exécutez :

```
pnpm tsc         # émettre un dist/types à jour
pnpm gen:members # réécrire le bloc généré dans src/index.ts
```

Les gardes de compilation à la fin de `src/index.ts` font échouer `tsc` dès que le bloc n'est plus synchronisé, donc un oubli de régénération est détecté.

## Remerciements

- [@viselect/vanilla](https://github.com/simonwep/selection/tree/master/packages/vanilla)

## Contributeurs

Merci pour vos contributions à Mind Elixir ! Votre soutien et votre dévouement rendent ce projet meilleur.

<a href="https://github.com/SSShooter/mind-elixir-core/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=SSShooter/mind-elixir-core" />
</a>
