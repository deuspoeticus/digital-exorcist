// 1. Polyfill window (MUST run before wasm-imagemagick loads)
// @ts-ignore
if (typeof window === "undefined") {
    // @ts-ignore
    self.window = self;
}

import { sanitizeCommand, INPUT_FILE, OUTPUT_FILE } from './sanitizer';

// Define message types
export type WorkerMessage =
    | { type: 'PROCESS'; id: number; command: string; image: { width: number; height: number; data: Uint8Array } }
    | { type: 'EXPORT'; id: number; command: string; image: { width: number; height: number; data: Uint8Array } }
    | { type: 'AUDIT'; id: number };

export type WorkerResponse =
    | { type: 'DONE'; id: number; bitmap: ImageBitmap; width: number; height: number }
    | { type: 'EXPORT_DONE'; id: number; blob: Blob }
    | { type: 'AUDIT_DONE'; id: number; result: string }
    | { type: 'ERROR'; id: number; error: string };

let execute: any = null;

// Dynamic import to ensure polyfill runs first
async function loadMagick() {
    if (!execute) {
        const module = await import('wasm-imagemagick');
        execute = module.execute; // @ts-ignore
    }
    return execute;
}

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    // @ts-ignore
    const { type, id, command, image } = e.data;

    try {
        const exec = await loadMagick();

        if (type === 'PROCESS') {
            // 1. Sanitize (Display Mode -> out.rgba)
            const safeCommand = sanitizeCommand(command, image.width, image.height, false);

            // 2. Execute WASM
            // We pass the raw RGBA data directly
            const result = await exec({
                inputFiles: [{ name: INPUT_FILE, content: image.data }],
                commands: safeCommand,
            });

            if (result.exitCode !== 0) {
                throw new Error(result.stderr.join('\n') || 'ImageMagick execution failed');
            }

            // 3. Read Output
            const outputFile = result.outputFiles.find((f: any) => f.name === OUTPUT_FILE);
            if (!outputFile) {
                throw new Error('No output file produced');
            }

            // 4. Create ImageBitmap (Off-main-thread)
            const blob = outputFile.blob;
            const buffer = await blob.arrayBuffer();
            const rawData = new Uint8ClampedArray(buffer);
            const imageData = new ImageData(rawData, image.width, image.height);

            const bitmap = await createImageBitmap(imageData);

            // 5. Transfer back
            // @ts-ignore - Worker postMessage supports transferable array
            (self as any).postMessage(
                { type: 'DONE', id, bitmap, width: image.width, height: image.height },
                [bitmap] // Transfer the bitmap
            );

        } else if (type === 'EXPORT') {
            // 1. Sanitize (Export Mode -> out.jpg)
            const safeCommand = sanitizeCommand(command, image.width, image.height, true);

            // 2. Execute WASM
            const result = await exec({
                inputFiles: [{ name: INPUT_FILE, content: image.data }],
                commands: safeCommand,
            });

            if (result.exitCode !== 0) {
                throw new Error(result.stderr.join('\n') || 'Export failed');
            }

            // 3. Read Output (JPEG Blob)
            const outputFile = result.outputFiles.find((f: any) => f.name === 'out.jpg');
            if (!outputFile) {
                throw new Error('No export file produced');
            }

            // 4. Return Blob
            (self as any).postMessage({ type: 'EXPORT_DONE', id, blob: outputFile.blob });
        } else if (type === 'AUDIT') {
            const results = [];

            // 1. Version (Use identify instead of magick)
            // Note: In some WASM builds, 'magick' isn't aliased. 'identify' or 'convert' usually is.
            let res = await exec({ commands: ["identify -version"] });
            results.push("=== VERSION ===\n" + res.stdout.join('\n'));

            // 2. Delegate Check
            res = await exec({ commands: ["convert -list format"] });
            results.push("\n=== FORMATS ===\n" + res.stdout.join('\n'));

            // 3. Morphology
            res = await exec({ commands: ["convert -list morphology"] });
            results.push("\n=== MORPHOLOGY ===\n" + res.stdout.join('\n'));

            // 4. Color Space
            res = await exec({ commands: ["convert -list colorspace"] });
            results.push("\n=== COLORSPACES ===\n" + res.stdout.join('\n'));

            // 5. Compose (Blending Modes)
            res = await exec({ commands: ["convert -list compose"] });
            results.push("\n=== COMPOSE (BLEND MODES) ===\n" + res.stdout.join('\n'));

            // 6. Virtual Pixel (Edge Handling)
            res = await exec({ commands: ["convert -list virtual-pixel"] });
            results.push("\n=== VIRTUAL PIXEL ===\n" + res.stdout.join('\n'));

            // 7. Distort (Geometric Warping)
            res = await exec({ commands: ["convert -list distort"] });
            results.push("\n=== DISTORTION METHODS ===\n" + res.stdout.join('\n'));

            // 8. Noise (Static Generation)
            res = await exec({ commands: ["convert -list noise"] });
            results.push("\n=== NOISE TYPES ===\n" + res.stdout.join('\n'));

            // 9. Filter (Pixel Interpolation)
            res = await exec({ commands: ["convert -list filter"] });
            results.push("\n=== INTERPOLATION FILTERS ===\n" + res.stdout.join('\n'));

            (self as any).postMessage({ type: 'AUDIT_DONE', id, result: results.join('\n') });
        }
    } catch (err: any) {
        (self as any).postMessage({ type: 'ERROR', id, error: err.message || String(err) });
    }
};
