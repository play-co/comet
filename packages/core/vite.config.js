import { defineConfig } from 'vite';
import typescript from '@rollup/plugin-typescript';

export default defineConfig(({ command, mode, ssrBuild }) => ({
    build: {
        sourcemap: true,
        declaration: true,
        declarationDir: './dist',
        lib: {
            entry: './src/index.ts',
            name: 'comet',
            formats: ['es'],
            fileName: 'index',
        },
        watch: mode === 'dev' ? {} : undefined,
        rollupOptions: {
            // make sure to externalize deps that shouldn't be bundled
            // into your library
            // external: ['vue'],
            output: {
                sourcemap: true,
                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                    comet: 'comet',
                },
            },
            plugins: [
                typescript({
                    target: 'es2020',
                    rootDir: './src',
                    declaration: true,
                    declarationDir: './dist',
                    exclude: './node_modules/**',
                    inlineSources: true,
                    sourceMap: true,
                    allowSyntheticDefaultImports: true,
                }),
            ],
        },
        chunkSizeWarningLimit: 2000,
    },
}));
