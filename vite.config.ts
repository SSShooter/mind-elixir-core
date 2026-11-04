// vite.config.js
import { defineConfig } from 'vite'
import istanbul from 'vite-plugin-istanbul'
import browserslist from 'browserslist'
import { browserslistToTargets } from 'lightningcss'

export default defineConfig({
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: browserslistToTargets(browserslist('>= 0.1%')),
    },
  },
  server: {
    host: true,
    port: 23333,
    strictPort: true,
  },
  plugins: [
    istanbul({
      include: 'src/*',
      exclude: ['node_modules', 'test/'],
      extension: ['.ts'],
      requireEnv: true,
    }),
  ],
  // build: {
  //   cssCodeSplit: false,
  //   lib: {
  //     // Could also be a dictionary or array of multiple entry points
  //     entry: {
  //       MindElixir: resolve(__dirname, './src/index.ts'),
  //       MindElixirLite: resolve(__dirname, './src/index.lite.ts'),
  //       example1: resolve(__dirname, './src/exampleData/1.ts'),
  //       example2: resolve(__dirname, './src/exampleData/2.ts'),
  //     },
  //     name: 'MindElixir',
  //     // formats: ['es'],
  //   },
  //   rollupOptions: {
  //     // make sure to externalize deps that shouldn't be bundled
  //     // into your library
  //     //   external: ['vue'],
  //     //   output: {
  //     //     // Provide global variables to use in the UMD build
  //     //     // for externalized deps
  //     //     globals: {
  //     //       vue: 'Vue',
  //     //     },
  //     //   },
  //     output: [
  //       {
  //         dir: 'dist',
  //         // file: 'bundle.js',
  //         format: 'iife',
  //         name: 'MyBundle',
  //         inlineDynamicImports: true,
  //       },
  //       {
  //         dir: 'dist',
  //         // file: 'bundle.js',
  //         format: 'es',
  //         name: 'MyBundle',
  //         inlineDynamicImports: true,
  //       },
  //     ],
  //   },
  // },
})
