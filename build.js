import { fileURLToPath } from 'url'
import { build } from 'vite'
import strip from '@rollup/plugin-strip'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const buildList = [
  {
    name: 'MindElixir',
    enrty: __dirname + './src/index.ts',
    formats: ['iife', 'es'],
  },
  {
    name: 'MindElixirLite',
    enrty: __dirname + './src/index.ts',
    mode: 'lite',
    formats: ['iife', 'es'],
  },
  {
    name: 'example',
    enrty: __dirname + './src/exampleData/1.ts',
    formats: ['es'],
  },
  {
    name: 'LayoutSsr',
    enrty: __dirname + './src/utils/layout-ssr.ts',
    formats: ['es'],
  },
  {
    name: 'PlaintextConverter',
    enrty: __dirname + './src/utils/plaintextConverter.ts',
    formats: ['es'],
  },
]
for (let i = 0; i < buildList.length; i++) {
  const info = buildList[i]
  console.log(`\n\nBuilding ${info.name}...\n\n`)
  await build({
    build: {
      emptyOutDir: i === 0,
      lib: {
        entry: info.enrty,
        fileName: info.name,
        name: info.name,
        formats: info.formats,
      },
      rollupOptions: {
        plugins: [
          strip({
            include: ['**/*.ts', '**/*.js'],
          }),
        ],
      },
    },
    mode: info.mode,
  })
}
