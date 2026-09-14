import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import strip from '@rollup/plugin-strip'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const buildList = [
  {
    name: 'MindElixir',
    enrty: __dirname + './src/index.ts',
  },
  {
    name: 'MindElixirLite',
    enrty: __dirname + './src/index.ts',
    mode: 'lite',
  },
  {
    // Standalone bundle for the outliner, so a host that only needs the outline
    // view can pull it in without loading the map: `import { Outliner } from
    // 'mind-elixir/outliner'`. `index.ts` still re-exports it (it is part of the
    // main API surface), so both entry points stay available.
    name: 'Outliner',
    enrty: __dirname + './src/outliner/index.ts',
  },
  {
    name: 'example',
    enrty: __dirname + './src/exampleData/1.ts',
  },
{
    name: 'PlaintextConverter',
    enrty: __dirname + './src/utils/plaintextConverter.ts',
  },
  {
    name: 'i18n',
    enrty: __dirname + './src/i18n.ts',
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
        formats: ['es'],
      },
      rollupOptions: {
        plugins: [
          strip({
            include: ['**/*.ts', '**/*.js'],
            // Strip debug/perf-only logs from published bundles.
            // Runtime warnings (console.warn/error) are kept intentionally.
            functions: [
              'console.log',
              'console.debug',
              'console.info',
              'console.trace',
              'console.time',
              'console.timeEnd',
            ],
          }),
        ],
      },
    },
    mode: info.mode,
  })
}
