<p align="center">
  <a href="https://docs.mind-elixir.com" target="_blank" rel="noopener noreferrer">
    <img width="150" src="https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/logo2.png" alt="mindelixir logo2">
  </a>
  <h1 align="center">Mind Elixir</h1>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/mind-elixir">
    <img src="https://img.shields.io/npm/v/mind-elixir" alt="versión">
  </a>
  <a href="https://github.com/ssshooter/mind-elixir-core/blob/master/LICENSE">
    <img src="https://img.shields.io/npm/l/mind-elixir" alt="licencia">
  </a>
  <a href="https://app.codacy.com/gh/ssshooter/mind-elixir-core?utm_source=github.com&utm_medium=referral&utm_content=ssshooter/mind-elixir-core&utm_campaign=Badge_Grade_Settings">
    <img src="https://api.codacy.com/project/badge/Grade/09fadec5bf094886b30cea6aabf3a88b" alt="calidad del código">
  </a>
  <a href="https://bundlephobia.com/result?p=mind-elixir">
    <img src="https://badgen.net/bundlephobia/dependency-count/mind-elixir" alt="cantidad de dependencias">
  </a>
  <a href="https://packagephobia.com/result?p=mind-elixir">
    <img src="https://packagephobia.com/badge?p=mind-elixir" alt="tamaño del paquete">
  </a>
</p>

[English](/readme.md)
[中文](/readme/zh.md)
[Español](/readme/es.md)
[Français](/readme/fr.md)
[Português](/readme/pt.md)
[Русский](/readme/ru.md)
[日本語](/readme/ja.md)

Mind elixir es un núcleo de mapas mentales de JavaScript de código abierto. Puedes usarlo con cualquier framework frontend que prefieras.

Características:

- Ligero
- Alto rendimiento
- Agnóstico al framework
- Pluginable
- Plugin de arrastrar y soltar / edición de nodos incorporado
- Exportar como SVG / PNG / Html
- Resumir nodos
- Operaciones en masa soportadas
- Deshacer / Rehacer
- Atajos eficientes
- Estiliza fácilmente tu nodo con variables CSS

<details>
<summary>Tabla de Contenidos</summary>

- [Prueba ahora](#prueba-ahora)
  - [Playground](#playground)
- [Documentación](#documentación)
- [Uso](#uso)
  - [Instalar](#instalar)
    - [NPM](#npm)
    - [Etiqueta de script](#etiqueta-de-script)
  - [Inicializar](#inicializar)
  - [Estructura de Datos](#estructura-de-datos)
  - [Manejo de Eventos](#manejo-de-eventos)
  - [Exportación e Importación de Datos](#exportación-e-importación-de-datos)
  - [Guardias de Operación](#guardias-de-operación)
- [Exportar como Imagen](#exportar-como-imagen)
  - [Solución 1](#solución-1)
  - [Solución 2](#solución-2)
- [APIs](#apis)
- [Tema](#tema)
- [Atajos](#atajos)
- [Ecosistema](#ecosistema)
- [Desarrollo](#desarrollo)
- [Agradecimientos](#agradecimientos)
- [Contribuidores](#contribuidores)

</details>

## Prueba ahora

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/screenshot2.png)

https://mind-elixir.com/

### Playground

- Vanilla JS - https://codepen.io/ssshooter/pen/OJrJowN
- React - https://codesandbox.io/s/mind-elixir-3-x-react-18-x-vy9fcq
- Vue3 - https://codesandbox.io/s/mind-elixir-3-x-vue3-lth484
- Vue2 - https://codesandbox.io/s/mind-elixir-3-x-vue-2-x-5kdfjp

## Documentación

https://docs.mind-elixir.com/

## Uso

### Instalar

#### NPM

```bash
npm i mind-elixir -S
```

```javascript
import MindElixir from 'mind-elixir'
```

#### Etiqueta de script

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/mind-elixir/dist/MindElixir.js"></script>
```

### Inicializar

```html
<div id="map"></div>
<style>
  #map {
    height: 500px;
    width: 100%;
  }
</style>
```

**Cambio Importante** desde la versión 1.0.0, `data` debe ser pasado a `init()`, no `options`.

```javascript
import MindElixir from 'mind-elixir'
import example from 'mind-elixir/dist/example1'

let options = {
  el: '#map', // o HTMLDivElement
  direction: MindElixir.LEFT,
  draggable: true, // por defecto true
  contextMenu: true, // por defecto true
  toolBar: true, // por defecto true
  nodeMenu: true, // por defecto true
  keypress: true, // por defecto true
  locale: 'en', // [zh_CN,zh_TW,en,ja,pt,ru] esperando PRs
  overflowHidden: false, // por defecto false
  mainLinkStyle: 2, // [1,2] por defecto 1
  mouseSelectionButton: 0, // 0 para botón izquierdo, 2 para botón derecho, por defecto 0
  contextMenuOption: {
    focus: true,
    link: true,
    extend: [
      {
        name: 'Editar nodo',
        onclick: () => {
          alert('menú extendido')
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

mind.install(plugin) // instala tu plugin

// crea nuevos datos de mapa
const data = MindElixir.new('nuevo tema')
// o `example`
// o los datos devueltos por `.getData()`
mind.init(data)

// obtener un nodo
MindElixir.E('node-id')
```

### Estructura de Datos

```javascript
// estructura completa de datos de nodo hasta ahora
const nodeData = {
  topic: 'tema del nodo',
  id: 'bd1c24420cd2c2f5',
  style: { fontSize: '32', color: '#3298db', background: '#ecf0f1' },
  expanded: true,
  parent: null,
  tags: ['Etiqueta'],
  icons: ['😀'],
  hyperLink: 'https://github.com/ssshooter/mind-elixir-core',
  image: {
    url: 'https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/logo2.png', // requerido
    // necesitas consultar la altura y el ancho de la imagen y calcular el valor apropiado para mostrar la imagen
    height: 90, // requerido
    width: 90, // requerido
  },
  children: [
    {
      topic: 'hijo',
      id: 'xxxx',
      // ...
    },
  ],
}
```

### Manejo de Eventos

```javascript
mind.bus.addListener('operation', operation => {
  console.log(operation)
  // return {
  //   name: nombre de la acción,
  //   obj: objeto objetivo
  // }

  // name: [insertSibling|addChild|removeNode|beginEdit|finishEdit]
  // obj: objetivo

  // name: moveNode
  // obj: {from:objetivo1,to:objetivo2}
})

mind.bus.addListener('selectNode', node => {
  console.log(node)
})

mind.bus.addListener('expandNode', node => {
  console.log('expandNode: ', node)
})
```

### Exportación e Importación de Datos

```javascript
// exportación de datos
const data = mind.getData() // objeto javascript, ver src/example.js
mind.getDataString() // objeto en cadena
mind.getDataMd() // markdown

// importación de datos
// iniciar
let mind = new MindElixir(options)
mind.init(data)
// actualización de datos
mind.refresh(data)
```

### Guardias de Operación

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

## Exportar como Imagen

### Solución 1

```typescript
const mind = {
  /** instancia de mind elixir */
}
const downloadPng = async () => {
  const blob = await mind.exportPng() // ¡Obtén un Blob!
  if (!blob) return
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'nombrearchivo.png'
  a.click()
  URL.revokeObjectURL(url)
}
```

### Solución 2

Instala `@ssshooter/modern-screenshot`, luego:

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
  link.download = 'captura.png'
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
    name: 'Oscuro',
    // paleta de colores de las líneas principales
    palette: ['#848FA0', '#748BE9', '#D2F9FE', '#4145A5', '#789AFA', '#706CF4', '#EF987F', '#775DD5', '#FCEECF', '#DA7FBC'],
    // sobrescribir variables css
    cssVar: {
      '--main-color': '#ffffff',
      '--main-bgcolor': '#4c4f69',
      '--color': '#cccccc',
      '--bgcolor': '#252526',
      '--panel-color': '255, 255, 255',
      '--panel-bgcolor': '45, 55, 72',
    },
    // todas las variables ver /src/index.less
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

Ten en cuenta que Mind Elixir no observará el cambio de `prefers-color-scheme`. Por favor, cambia el tema **manualmente** cuando el esquema cambie.

## Atajos

| Atajo              | Función                          |
| ------------------ | -------------------------------- |
| Enter              | Insertar Nodo Hermano            |
| Tab                | Insertar Nodo Hijo               |
| F1                 | Centrar el Mapa                  |
| F2                 | Comenzar a Editar el Nodo Actual |
| ↑                  | Seleccionar el Nodo Hermano Anterior |
| ↓                  | Seleccionar el Nodo Hermano Siguiente |
| ← / →              | Seleccionar Padre o Primer Hijo  |
| PageUp / Alt + ↑   | Mover Nodo Arriba                |
| PageDown / Alt + ↓ | Mover Nodo Abajo                 |
| Ctrl + ↑           | Cambiar Patrón de Diseño a Lado  |
| Ctrl + ←           | Cambiar Patrón de Diseño a Izquierda |
| Ctrl + →           | Cambiar Patrón de Diseño a Derecha |
| Ctrl + C           | Copiar el Nodo Actual            |
| Ctrl + V           | Pegar el Nodo Copiado            |
| Ctrl + "+"         | Acercar el Mapa Mental           |
| Ctrl + "-"         | Alejar el Mapa Mental            |
| Ctrl + 0           | Restablecer Nivel de Zoom        |

## Ecosistema

- [@mind-elixir/node-menu](https://github.com/ssshooter/node-menu)
- [@mind-elixir/node-menu-neo](https://github.com/ssshooter/node-menu-neo)
- [@mind-elixir/export-xmind](https://github.com/ssshooter/export-xmind)
- [@mind-elixir/export-html](https://github.com/ssshooter/export-html)
- [mind-elixir-react](https://github.com/ssshooter/mind-elixir-react)

¡Las PRs son bienvenidas!

## Desarrollo

```
pnpm i
pnpm dev
```

Prueba los archivos generados con `dev.dist.ts`:

```
pnpm build
pnpm link ./
```

Actualiza la documentación:

```
# Instalar api-extractor
pnpm install -g @microsoft/api-extractor
# Mantener /src/docs.ts
# Generar documentación
pnpm doc
pnpm doc:md
```

## Agradecimientos

- [@viselect/vanilla](https://github.com/simonwep/selection/tree/master/packages/vanilla)

## Contribuidores

¡Gracias por tus contribuciones a Mind Elixir! Tu apoyo y dedicación hacen que este proyecto sea mejor.

<a href="https://github.com/SSShooter/mind-elixir-core/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=SSShooter/mind-elixir-core&columns=6" />
</a>
