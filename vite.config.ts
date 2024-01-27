// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
export default defineConfig({
  plugins: [cssInjectedByJsPlugin()],
  server: {
    host: true,
    port: 23333,
    strictPort: true,
  },
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
