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

## Construir com IA

Use `npx skills add` para instalar guias em seu projeto:

**Guia de Integração**:

```bash
npx skills add ssshooter/mind-elixir-core
```

![mind elixir skills](./images/skills.jpg)

<details>
<summary>Índice</summary>

- [Experimente agora](#experimente-agora)
  - [Playground](#playground)
- [Construir com IA](#construir-com-ia)
- [Documentação](#documentação)
- [Uso](#uso)
  - [Instalação](#instalação)
    - [NPM](#npm)
    - [Tag de script](#tag-de-script)
  - [Inicialização](#inicialização)
  - [Estrutura de Dados](#estrutura-de-dados)
  - [Manipulação de Eventos](#manipulação-de-eventos)
- [Exportação e Importação de Dados](#exportação-e-importação-de-dados)
- [Suporte a Markdown](#suporte-a-markdown)
- [Guardas de Operação](#guardas-de-operação)
- [Exportar como Imagem](#exportar-como-imagem)
- [Tema](#tema)
- [Atalhos](#atalhos)
- [Quem usa](#quem-usa)
- [Ecossistema](#ecossistema)
- [Desenvolvimento](#desenvolvimento)
- [Agradecimentos](#agradecimentos)
- [Contribuidores](#contribuidores)

</details>

## Experimente agora

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/screenshot5_2.jpg)

### Playground

- Vanilla JS - https://codepen.io/ssshooter/pen/vEOqWjE
- React - https://codesandbox.io/p/devbox/mind-elixir-3-x-react-18-x-forked-f3mtcd
- Vue3 - https://codesandbox.io/p/sandbox/mind-elixir-3-x-vue3-lth484

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
import 'mind-elixir/style.css'
```

#### Tag de script

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/mind-elixir/dist/MindElixir.js"></script>
```

E no seu arquivo CSS:

```css
@import 'https://cdn.jsdelivr.net/npm/mind-elixir/dist/style.css';
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

```javascript
import MindElixir from 'mind-elixir'
import { pt } from 'mind-elixir/i18n'
import 'mind-elixir/style.css'
import example from 'mind-elixir/dist/example1'

let options = {
  el: '#map', // ou HTMLDivElement
  direction: MindElixir.LEFT,
  toolBar: true, // padrão true
  keypress: true, // padrão true
  overflowHidden: false, // padrão false
  mouseSelectionButton: 0, // 0 para botão esquerdo, 2 para botão direito, padrão 0
  contextMenu: {
    locale: pt,
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
  }, // padrão true
  before: {
    insertSibling(type, obj) {
      return true
    },
  },
  // Analisador markdown personalizado (opcional)
  // markdown: (text) => customMarkdownParser(text), // forneça sua própria função de análise markdown
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

mind.bus.addListener('selectNodes', nodes => {
  console.log(nodes)
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

// importação de dados
// inicialização
let mind = new MindElixir(options)
mind.init(data)
// atualização de dados
mind.refresh(data)
```

### Suporte a Markdown

Mind Elixir suporta análise markdown personalizada:

```javascript
// Desativar markdown (padrão)
let mind = new MindElixir({
  // opção markdown omitida - sem processamento markdown
})

// Usar analisador markdown personalizado
let mind = new MindElixir({
  markdown: text => {
    // Sua implementação markdown personalizada
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
  },
})

// Usar qualquer biblioteca markdown (ex. marked, markdown-it, etc.)
import { marked } from 'marked'
let mind = new MindElixir({
  markdown: text => marked(text),
})
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

Instale `@mind-elixir/export-mindmap`, depois:

```typescript
import { downloadImage, exportImage } from '@mind-elixir/export-mindmap'

const download = async () => {
  // Baixar diretamente como PNG / JPEG / WEBP
  await downloadImage(mind, 'png')

  // Ou obter uma URL para visualização / tratamento personalizado
  const url = await exportImage(mind, 'png', { watermarkEnabled: false }) // passe as opções assim
}
```

> Observação: As exportações incluem uma marca d'água da Mind Elixir por padrão. Passe `{ watermarkEnabled: false }` nas opções para desativá-la.

Para outros formatos de exportação e opções avançadas, consulte a [documentação da Mind Elixir](https://ssshooter.com/en/how-to-use-mind-elixir/#exporting-images).

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

| Atalho             | Função                               |
| ------------------ | ------------------------------------ |
| Enter              | Inserir Nó Irmão                     |
| Tab                | Inserir Nó Filho                     |
| F1                 | Centralizar o Mapa                   |
| F2                 | Começar a Editar o Nó Atual          |
| ↑                  | Selecionar o Nó Irmão Anterior       |
| ↓                  | Selecionar o Próximo Nó Irmão        |
| ← / →              | Selecionar Pai ou Primeiro Filho     |
| PageUp / Alt + ↑   | Mover Nó para Cima                   |
| PageDown / Alt + ↓ | Mover Nó para Baixo                  |
| Ctrl + ↑           | Mudar Padrão de Layout para Lado     |
| Ctrl + ←           | Mudar Padrão de Layout para Esquerda |
| Ctrl + →           | Mudar Padrão de Layout para Direita  |
| Ctrl + C           | Copiar o Nó Atual                    |
| Ctrl + V           | Colar o Nó Copiado                   |
| Ctrl + "+"         | Aumentar Zoom do Mapa Mental         |
| Ctrl + "-"         | Diminuir Zoom do Mapa Mental         |
| Ctrl + 0           | Redefinir Nível de Zoom              |

## Ecossistema

- [@mind-elixir/node-menu](https://github.com/ssshooter/node-menu)
- [@mind-elixir/node-menu-neo](https://github.com/ssshooter/node-menu-neo)
- [@mind-elixir/export-xmind](https://github.com/ssshooter/export-xmind)
- [export-mindmap](https://github.com/mind-elixir/plugins/tree/main/packages/export-mindmap)
- [mindmapcn](https://github.com/ssshooter/mindmapcn)

PRs são bem-vindos!

## Quem usa

Envie um PR para adicionar seu projeto aqui!

- [Mind Elixir App](https://app.mind-elixir.com/)
- [ebook-to-mindmap](https://github.com/SSShooter/ebook-to-mindmap)
- [M10C-Video-Summary](https://github.com/SSShooter/M10C-Video-Summary)

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

Regenerar os membros da classe `MindElixir`:

As declarações de opções e métodos da classe `MindElixir` (o bloco `// #region GENERATED` em `src/index.ts`) são geradas pelo `gen-members.js` a partir das declarações compiladas em `dist/types`, para que o `.d.ts` publicado e a documentação da API mostrem assinaturas totalmente expandidas. Após alterar os métodos mesclados (`src/methods.ts`) ou a interface `Options` (`src/types/index.ts`), execute:

```
pnpm tsc         # emitir dist/types atualizado
pnpm gen:members # reescrever o bloco gerado em src/index.ts
```

As proteções em tempo de compilação no final de `src/index.ts` fazem o `tsc` falhar sempre que o bloco fica dessincronizado, então uma regeneração esquecida é detectada.

## Agradecimentos

- [@viselect/vanilla](https://github.com/simonwep/selection/tree/master/packages/vanilla)

## Contribuidores

Obrigado por suas contribuições ao Mind Elixir! Seu apoio e dedicação tornam este projeto melhor.

<a href="https://github.com/SSShooter/mind-elixir-core/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=SSShooter/mind-elixir-core" />
</a>
