import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import path from 'path';
import type { Plugin } from 'vite';

// wasm-imagemagick guesses where magick.js lives from a stack trace, so in a
// bundled build it looks next to the hashed worker chunk and 404s. Point it at
// the copy served from static/ instead, honoring the deploy base path.
const MAGICK_BASE = (process.env.BASE_PATH ?? '') + '/';

function magickWorkerUrl(): Plugin {
    const target = "const magickWorkerUrl = GetCurrentUrlDifferentFilename(currentJavascriptURL, 'magick.js');";
    return {
        name: 'magick-worker-url',
        transform(code, id) {
            if (!id.includes('wasm-imagemagick') || !code.includes(target)) return;
            return code.replace(
                target,
                `const magickWorkerUrl = new URL(${JSON.stringify(MAGICK_BASE + 'magick.js')}, self.location.origin).href;`
            );
        },
    };
}

export default defineConfig({
    plugins: [
        sveltekit(),
        magickWorkerUrl(),
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
        plugins: () => [magickWorkerUrl()],
    },
});
