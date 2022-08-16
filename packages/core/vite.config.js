import { defineConfig } from 'vite';
// import path from "path";
import typescript from '@rollup/plugin-typescript';

export default defineConfig(({ command, mode, ssrBuild }) => ({
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'comet',
      formats: ['es', 'cjs', 'umd'],
      fileName: 'index'
    },
    watch: mode === 'dev' ? {} : undefined,
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      // external: ['vue'],
      output: {
        sourcemap: 'hidden',
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          comet: 'comet'
        }
      },
      plugins: [
        typescript({
          target: 'es2020',
          rootDir: './src',
          declaration: true,
          declarationDir: './dist',
          exclude: './node_modules/**',
          allowSyntheticDefaultImports: true
        })
      ]
    },
    chunkSizeWarningLimit: 2000
  }
}));
