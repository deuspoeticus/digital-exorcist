import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';

export default defineConfig({
    plugins: [
        sveltekit(),
        nodePolyfills({
            include: ['buffer', 'process'],
            globals: {
                Buffer: true,
                process: true,
                global: true,
            },
        })
    ],
    define: {
        global: 'globalThis',
    },
    resolve: {
        alias: {
            'wasm-imagemagick': path.resolve('node_modules/wasm-imagemagick/dist/magickApi.js'),
        },
    },
    optimizeDeps: {
        exclude: ['wasm-imagemagick'],
    },
    worker: {
        format: 'es',
    },
});
