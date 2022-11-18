import { svelte } from '@sveltejs/vite-plugin-svelte';
// import { defineConfig, loadEnv } from 'vite'
import { defineConfig } from 'vite'
import {version} from './package.json';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
    // uncomment next line to load .env file, or .env.development etc if using mode
    // loadEnv(mode, process.cwd(), '')
    return {
        plugins: [svelte()], 
        server: {
            hmr: false,
        },
        build: { 
            sourcemap: true,
            chunkSizeWarningLimit: 2000,
            outDir: './dist/editor',
            rollupOptions: {
                sourcemap: true,
            },
        },
        define: {
            APP_VERSION: JSON.stringify(version),
            SYNC_SERVER: JSON.stringify(mode === 'development' ? 'ws://localhost:3333' : 'ws://localhost:3333')
        }
    };
});