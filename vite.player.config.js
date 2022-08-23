import { defineConfig } from 'vite';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import del from 'rollup-plugin-delete';
import updatePlayerVersion from './scripts/rollup-plugin-player-version';

export default defineConfig(({ command, mode, ssrBuild }) => {
    return {
        build: {
            minify: 'terser',
            terserOptions: {
                keep_classnames: true,
            },
            sourcemap: true,
            declaration: true,
            declarationDir: './dist/player/dist',
            outDir: './dist/player/dist',
            lib: {
                entry: './src/player/index.ts',
                name: 'comet',
                formats: ['es'],
                fileName: 'index',
            },
            watch: mode === 'dev' ? {} : undefined,
            rollupOptions: {
                // make sure to externalize deps that shouldn't be bundled
                // into your library
                external: ['pixi.js'],
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
                        rootDir: './src/',
                        declaration: true,
                        declarationDir: './dist/player/dist',
                        exclude: './node_modules/**',
                        inlineSources: true,
                        sourceMap: true,
                        allowSyntheticDefaultImports: true,
                    }),
                    copy({

                        targets: [
                            {
                                src: 'src/player/package.json',
                                dest: 'dist/player',
                            },
                            {
                                src: 'dist/player/dist/index*',
                                dest: 'dist/player/dist/player',
                            },
                        ],
                        hook: 'writeBundle',
                        verbose: true,
                    }),
                    del({
                        targets: [
                            'dist/player/dist/editor',
                            'dist/player/dist/assets',
                            'dist/player/dist/index*',
                        ],
                        hook: 'closeBundle',
                        verbose: true,
                    }),
                    updatePlayerVersion(),
                ],
            },
            chunkSizeWarningLimit: 2000,
        },
    };
});
