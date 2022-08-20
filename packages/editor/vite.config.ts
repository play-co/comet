import { svelte } from '@sveltejs/vite-plugin-svelte';
import * as path from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [svelte()],
    build: {
        sourcemap: true,
        chunkSizeWarningLimit: 2000,
    },
    resolve: {
        alias: {
            src: path.resolve(__dirname, './src'),
        },
    },
});
