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

Mind Elixir é um núcleo JavaScript de mapa mental de código aberto. Você pode usá-lo com qualquer framework frontend de sua preferência.

Características:

- Leve
- Alto desempenho
- Independente de framework
- Plugável
- Plugin integrado de arrastar e soltar / edição de nós
- Exportação como SVG / PNG / Html
- Resumo de nós
- Suporte a operações em massa
- Desfazer / Refazer
- Atalhos eficientes 
- Estilização fácil dos nós com variáveis CSS

<details>
<summary>Índice</summary>

- [Experimente agora](#experimente-agora)
  - [Playground](#playground)
- [Documentação](#documentação)
- [Uso](#uso)
  - [Instalação](#instalação)
    - [NPM](#npm)
    - [Tag de script](#tag-de-script)
  - [Inicialização](#inicialização)
  - [Estrutura de Dados](#estrutura-de-dados)
  - [Manipulação de Eventos](#manipulação-de-eventos)
  - [Exportação e Importação de Dados](#exportação-e-importação-de-dados)
  - [Guardas de Operação](#guardas-de-operação)
- [Exportar como Imagem](#exportar-como-imagem)
  - [Solução 1](#solução-1)
  - [Solução 2](#solução-2)
- [APIs](#apis)
- [Tema](#tema)
- [Atalhos](#atalhos)
- [Ecossistema](#ecossistema)
- [Desenvolvimento](#desenvolvimento)
- [Agradecimentos](#agradecimentos)
- [Contribuidores](#contribuidores)

</details>

## Experimente agora

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/screenshot2.png)

https://mind-elixir.com/

### Playground

- Vanilla JS - https://codepen.io/ssshooter/pen/OJrJowN
- React - https://codesandbox.io/s/mind-elixir-3-x-react-18-x-vy9fcq
- Vue3 - https://codesandbox.io/s/mind-elixir-3-x-vue3-lth484
- Vue2 - https://codesandbox.io/s/mind-elixir-3-x-vue-2-x-5kdfjp

## Documentação

https://docs.mind-elixir.com/

## Uso

### Instalação

#### NPM

```bash
npm i mind-elixir -S
```

```javascript
import MindElixir from 'mind-elixir'
```

#### Tag de script

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/mind-elixir/dist/MindElixir.js"></script>
```

### Inicialização

```html
<div id="map"></div>
<style>
  #map {
    height: 500px;
    width: 100%;
  }
</style>
```

**Mudança Importante** desde a versão 1.0.0, `data` deve ser passado para `init()`, não para `options`.

```javascript
import MindElixir from 'mind-elixir'
import example from 'mind-elixir/dist/example1'

let options = {
  el: '#map', // ou HTMLDivElement
  direction: MindElixir.LEFT,
  draggable: true, // padrão true
  contextMenu: true, // padrão true
  toolBar: true, // padrão true
  nodeMenu: true, // padrão true
  keypress: true, // padrão true
  locale: 'pt', // [zh_CN,zh_TW,en,ja,pt,ru] aguardando PRs
  overflowHidden: false, // padrão false
  mainLinkStyle: 2, // [1,2] padrão 1
  mouseSelectionButton: 0, // 0 para botão esquerdo, 2 para botão direito, padrão 0
  contextMenuOption: {
    focus: true,
    link: true,
    extend: [
      {
        name: 'Editar Nó',
        onclick: () => {
          alert('menu estendido')
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

mind.install(plugin) // instale seu plugin

// criar novos dados do mapa
const data = MindElixir.new('novo tópico')
// ou `example`
// ou os dados retornados de `.getData()`
mind.init(data)

// obter um nó
MindElixir.E('node-id')
```

### Estrutura de Dados

```javascript
// estrutura completa de dados do nó até agora
const nodeData = {
  topic: 'tópico do nó',
  id: 'bd1c24420cd2c2f5',
  style: { fontSize: '32', color: '#3298db', background: '#ecf0f1' },
  expanded: true,
  parent: null,
  tags: ['Tag'],
  icons: ['😀'],
  hyperLink: 'https://github.com/ssshooter/mind-elixir-core',
  image: {
    url: 'https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/logo2.png', // obrigatório
    // você precisa consultar a altura e largura da imagem e calcular o valor apropriado para exibir a imagem
    height: 90, // obrigatório
    width: 90, // obrigatório
  },
  children: [
    {
      topic: 'filho',
      id: 'xxxx',
      // ...
    },
  ],
}
```

### Manipulação de Eventos

```javascript
mind.bus.addListener('operation', operation => {
  console.log(operation)
  // retorna {
  //   name: nome da ação,
  //   obj: objeto alvo
  // }

  // name: [insertSibling|addChild|removeNode|beginEdit|finishEdit]
  // obj: alvo

  // name: moveNode
  // obj: {from:alvo1,to:alvo2}
})

mind.bus.addListener('selectNode', node => {
  console.log(node)
})

mind.bus.addListener('expandNode', node => {
  console.log('expandNode: ', node)
})
```

### Exportação e Importação de Dados

```javascript
// exportação de dados
const data = mind.getData() // objeto javascript, veja src/example.js
mind.getDataString() // objeto em string
mind.getDataMd() // markdown

// importação de dados
// inicialização
let mind = new MindElixir(options)
mind.init(data)
// atualização de dados
mind.refresh(data)
```

### Guardas de Operação

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

## Exportar como Imagem

### Solução 1

```typescript
const mind = {
  /** instância do mind elixir */
}
const downloadPng = async () => {
  const blob = await mind.exportPng() // Obter um Blob!
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'arquivo.png'
  a.click()
  URL.revokeObjectURL(url)
}
```

### Solução 2

Instale `@ssshooter/modern-screenshot`, depois:

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

## APIs

https://github.com/ssshooter/mind-elixir-core/blob/master/api/mind-elixir.api.md

## Tema

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

## Atalhos

| Atalho             | Função                            |
| ------------------ | --------------------------------- |
| Enter              | Inserir Nó Irmão                  |
| Tab                | Inserir Nó Filho                  |
| F1                 | Centralizar o Mapa                |
| F2                 | Começar a Editar o Nó Atual       |
| ↑                  | Selecionar o Nó Irmão Anterior    |
| ↓                  | Selecionar o Próximo Nó Irmão     |
| ← / →              | Selecionar Pai ou Primeiro Filho  |
| PageUp / Alt + ↑   | Mover Nó para Cima                |
| PageDown / Alt + ↓ | Mover Nó para Baixo               |
| Ctrl + ↑           | Mudar Padrão de Layout para Lado  |
| Ctrl + ←           | Mudar Padrão de Layout para Esquerda |
| Ctrl + →           | Mudar Padrão de Layout para Direita |
| Ctrl + C           | Copiar o Nó Atual                 |
| Ctrl + V           | Colar o Nó Copiado                |
| Ctrl + "+"         | Aumentar Zoom do Mapa Mental      |
| Ctrl + "-"         | Diminuir Zoom do Mapa Mental      |
| Ctrl + 0           | Redefinir Nível de Zoom           |

## Ecossistema

- [@mind-elixir/node-menu](https://github.com/ssshooter/node-menu)
- [@mind-elixir/node-menu-neo](https://github.com/ssshooter/node-menu-neo)
- [@mind-elixir/export-xmind](https://github.com/ssshooter/export-xmind)
- [@mind-elixir/export-html](https://github.com/ssshooter/export-html)
- [mind-elixir-react](https://github.com/ssshooter/mind-elixir-react)

PRs são bem-vindos!

## Desenvolvimento

```
pnpm i
pnpm dev
```

Testar arquivos gerados com `dev.dist.ts`:

```
pnpm build
pnpm link ./
```

Atualizar documentação:

```
# Instalar api-extractor
pnpm install -g @microsoft/api-extractor
# Manter /src/docs.ts
# Gerar documentação
pnpm doc
pnpm doc:md
```

## Agradecimentos

- [@viselect/vanilla](https://github.com/simonwep/selection/tree/master/packages/vanilla)

## Contribuidores

Obrigado por suas contribuições ao Mind Elixir! Seu apoio e dedicação tornam este projeto melhor.

<a href="https://github.com/SSShooter/mind-elixir-core/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=SSShooter/mind-elixir-core&columns=6" />
</a>
