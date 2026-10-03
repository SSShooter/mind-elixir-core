import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { build } from 'vite'
import strip from '@rollup/plugin-strip'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const buildList = [
  {
    name: 'MindElixir',
    entry: resolve(rootDir, './src/index.ts'),
  },
  {
    name: 'MindElixirLite',
    entry: resolve(rootDir, './src/index.ts'),
    mode: 'lite',
  },
  {
    // Standalone bundle for the outliner, so a host that only needs the outline
    // view can pull it in without loading the map: `import { Outliner } from
    // 'mind-elixir/outliner'`. `index.ts` still re-exports it (it is part of the
    // main API surface), so both entry points stay available.
    name: 'Outliner',
    entry: resolve(rootDir, './src/outliner/index.ts'),
  },
  {
    name: 'example',
    entry: resolve(rootDir, './src/exampleData/1.ts'),
  },
  {
    name: 'PlaintextConverter',
    entry: resolve(rootDir, './src/utils/plaintextConverter.ts'),
  },
  {
    name: 'i18n',
    entry: resolve(rootDir, './src/i18n.ts'),
  },
]
for (let i = 0; i < buildList.length; i++) {
  const info = buildList[i]
  console.log(`\n\nBuilding ${info.name}...\n\n`)
  await build({
    root: rootDir,
    build: {
      emptyOutDir: i === 0,
      lib: {
        entry: info.entry,
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
