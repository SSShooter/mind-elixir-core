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

[English](/readme.md) |
[中文](/readme/zh.md) |
[Español](/readme/es.md) |
[Français](/readme/fr.md) |
[Português](/readme/pt.md) |
[Русский](/readme/ru.md) |
[日本語](/readme/ja.md) |
[한국어](/readme/ko.md)

Mind elixir es un núcleo de mapas mentales de JavaScript de código abierto. Puedes usarlo con cualquier framework frontend que prefieras.

## Características

### 🎨 **Experiencia de Usuario**

- **UX fluida** - Interacciones suaves e intuitivas
- **Bien diseñado** - Interfaz limpia y moderna
- **Compatible con móviles** - Eventos táctiles para dispositivos móviles
- **Atajos eficientes** - Atajos de teclado para usuarios avanzados

### ⚡ **Rendimiento y Arquitectura**

- **Ligero** - Tamaño de paquete mínimo
- **Alto rendimiento** - Optimizado para mapas mentales grandes
- **Agnóstico al framework** - Funciona con cualquier framework frontend
- **Extensible** - Arquitectura de plugins

### 🛠️ **Características Principales**

- **Edición interactiva** - Capacidades de arrastrar y soltar / edición de nodos incorporadas
- **Operaciones masivas** - Selección y operación de múltiples nodos
- **Deshacer / Rehacer** - Historial completo de operaciones
- **Conexiones de nodos y resumen** - Enlace personalizado de nodos y resumen de contenido

### 📤 **Exportación y Personalización**

- **Múltiples formatos de exportación** - Exportación SVG / PNG / HTML
- **Estilizado fácil** - Personaliza mapas mentales con variables CSS
- **Soporte de temas** - Temas incorporados y estilizado personalizado

[v5 Cambios Rupturistas](https://github.com/SSShooter/mind-elixir-core/wiki/Breaking-Change#500)

<details>
<summary>Tabla de Contenidos</summary>

- [Características](#características)
  - [🎨 **Experiencia de Usuario**](#-experiencia-de-usuario)
  - [⚡ **Rendimiento y Arquitectura**](#-rendimiento-y-arquitectura)
  - [🛠️ **Características Principales**](#️-características-principales)
  - [📤 **Exportación y Personalización**](#-exportación-y-personalización)
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
  - [Soporte de Markdown](#soporte-de-markdown)
  - [Guardias de Operación](#guardias-de-operación)
- [Exportar como Imagen](#exportar-como-imagen)
  - [API Obsoleta](#api-obsoleta)
- [Tema](#tema)
- [Atajos](#atajos)
- [¿Quién lo está usando?](#quién-lo-está-usando)
- [Ecosistema](#ecosistema)
- [Desarrollo](#desarrollo)
- [Agradecimientos](#agradecimientos)
- [Contribuidores](#contribuidores)

</details>

## Prueba ahora

![mindelixir](https://raw.githubusercontent.com/ssshooter/mind-elixir-core/master/images/screenshot5_2.jpg)

https://mind-elixir.com/

### Playground

- Vanilla JS - https://codepen.io/ssshooter/pen/vEOqWjE
- React - https://codesandbox.io/p/devbox/mind-elixir-3-x-react-18-x-forked-f3mtcd
- Vue3 - https://codesandbox.io/p/sandbox/mind-elixir-3-x-vue3-lth484

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

Y en tu archivo CSS:

```css
@import 'https://cdn.jsdelivr.net/npm/mind-elixir/dist/style.css';
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
import { es } from 'mind-elixir/i18n'
import example from 'mind-elixir/dist/example1'

let options = {
  el: '#map', // o HTMLDivElement
  direction: MindElixir.LEFT,
  draggable: true, // por defecto true
  contextMenu: true, // por defecto true
  toolBar: true, // por defecto true
  keypress: true, // por defecto true
  overflowHidden: false, // por defecto false
  mouseSelectionButton: 0, // 0 para botón izquierdo, 2 para botón derecho, por defecto 0
  contextMenu: {
    locale: es,
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

mind.bus.addListener('selectNodes', nodes => {
  console.log(nodes)
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

// importación de datos
// iniciar
let mind = new MindElixir(options)
mind.init(data)
// actualización de datos
mind.refresh(data)
```

### Soporte de Markdown

Mind Elixir soporta análisis de markdown personalizado:

```javascript
// Deshabilitar markdown (predeterminado)
let mind = new MindElixir({
  // opción markdown omitida - sin procesamiento markdown
})

// Usar analizador markdown personalizado
let mind = new MindElixir({
  markdown: text => {
    // Tu implementación markdown personalizada
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
  },
})

// Usar cualquier biblioteca markdown (ej. marked, markdown-it, etc.)
import { marked } from 'marked'
let mind = new MindElixir({
  markdown: text => marked(text),
})
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

Instala `@zumer/snapdom`, luego:

```typescript
import { snapdom } from '@zumer/snapdom'

const download = async () => {
  const result = await snapdom(mind.nodes)
  await result.download({ format: 'jpg', filename: 'my-capture' })
}
```

Para otros formatos de exportación y opciones avanzadas, consulta la [documentación de Mind Elixir](https://ssshooter.com/en/how-to-use-mind-elixir/#exporting-images).

### API Obsoleta

> ⚠️ **Obsoleto**: El método `mind.exportSvg()` está obsoleto y se eliminará en una versión futura.

```typescript
// OBSOLETO - No usar en nuevos proyectos
const svgData = await mind.exportSvg()
```

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

Consulta la [Guía de Atajos](https://docs.mind-elixir.com/docs/guides/shortcuts) para información detallada.

## ¿Quién lo está usando?

- [Mind Elixir Desktop](https://desktop.mind-elixir.com/)

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

Usa [DeepWiki](https://deepwiki.com/SSShooter/mind-elixir-core) para aprender más sobre Mind Elixir

## Agradecimientos

- [@viselect/vanilla](https://github.com/simonwep/selection/tree/master/packages/vanilla)

## Contribuidores

¡Gracias por tus contribuciones a Mind Elixir! Tu apoyo y dedicación hacen que este proyecto sea mejor.

<a href="https://github.com/SSShooter/mind-elixir-core/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=SSShooter/mind-elixir-core" />
</a>
