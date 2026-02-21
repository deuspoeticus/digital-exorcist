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

// Define the execution environment signature since wasm-imagemagick doesn't provide strict types
type MagickExecuteCommand = {
    inputFiles?: Array<{ name: string; content: Uint8Array }>;
    commands: string[];
};

type MagickExecuteResult = {
    exitCode: number;
    stdout: string[];
    stderr: string[];
    outputFiles: Array<{ name: string; blob: Blob }>;
};

type MagickExecuteFunc = (config: MagickExecuteCommand) => Promise<MagickExecuteResult>;
let execute: MagickExecuteFunc | null = null;

// Dynamic import to ensure polyfill runs first
async function loadMagick(): Promise<MagickExecuteFunc> {
    if (!execute) {
        const module = await import('wasm-imagemagick');
        execute = module.execute as MagickExecuteFunc;
    }
    return execute;
}

// Define a safe interface for Window/Worker scope
interface WorkerScope {
    postMessage(message: WorkerResponse, transfer?: Transferable[]): void;
    onmessage: ((this: WorkerScope, ev: MessageEvent<WorkerMessage>) => any) | null;
}

const workerScope = self as unknown as WorkerScope;

workerScope.onmessage = async (e: MessageEvent<WorkerMessage>) => {
    const { type, id } = e.data;

    try {
        const exec = await loadMagick();

        if (e.data.type === 'PROCESS') {
            const { command, image } = e.data;
            // 1. Sanitize (Display Mode -> out.rgba)
            const safeCommand = sanitizeCommand(command, image.width, image.height, false);

            // 2. Execute WASM
            const result = await exec({
                inputFiles: [{ name: INPUT_FILE, content: image.data }],
                commands: [safeCommand],
            });

            if (result.exitCode !== 0) {
                throw new Error(result.stderr.join('\n') || 'ImageMagick execution failed');
            }

            // 3. Read Output
            const outputFile = result.outputFiles.find((f: { name: string; blob: Blob }) => f.name === OUTPUT_FILE);
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
            workerScope.postMessage(
                { type: 'DONE', id, bitmap, width: image.width, height: image.height } satisfies WorkerResponse,
                [bitmap]
            );

        } else if (e.data.type === 'EXPORT') {
            const { command, image } = e.data;
            // 1. Sanitize (Export Mode -> out.jpg)
            const safeCommand = sanitizeCommand(command, image.width, image.height, true);

            // 2. Execute WASM
            const result = await exec({
                inputFiles: [{ name: INPUT_FILE, content: image.data }],
                commands: [safeCommand],
            });

            if (result.exitCode !== 0) {
                throw new Error(result.stderr.join('\n') || 'Export failed');
            }

            // 3. Read Output (JPEG Blob)
            const outputFile = result.outputFiles.find((f: { name: string; blob: Blob }) => f.name === 'out.jpg');
            if (!outputFile) {
                throw new Error('No export file produced');
            }

            // 4. Return Blob
            workerScope.postMessage({ type: 'EXPORT_DONE', id, blob: outputFile.blob } satisfies WorkerResponse);

        } else if (e.data.type === 'AUDIT') {
            const results: string[] = [];

            let res = await exec({ commands: ["identify", "-version"] });
            results.push("=== VERSION ===\n" + res.stdout.join('\n'));

            res = await exec({ commands: ["convert", "-list", "format"] });
            results.push("\n=== FORMATS ===\n" + res.stdout.join('\n'));

            res = await exec({ commands: ["convert", "-list", "morphology"] });
            results.push("\n=== MORPHOLOGY ===\n" + res.stdout.join('\n'));

            res = await exec({ commands: ["convert", "-list", "colorspace"] });
            results.push("\n=== COLORSPACES ===\n" + res.stdout.join('\n'));

            res = await exec({ commands: ["convert", "-list", "compose"] });
            results.push("\n=== COMPOSE (BLEND MODES) ===\n" + res.stdout.join('\n'));

            res = await exec({ commands: ["convert", "-list", "virtual-pixel"] });
            results.push("\n=== VIRTUAL PIXEL ===\n" + res.stdout.join('\n'));

            res = await exec({ commands: ["convert", "-list", "distort"] });
            results.push("\n=== DISTORTION METHODS ===\n" + res.stdout.join('\n'));

            res = await exec({ commands: ["convert", "-list", "noise"] });
            results.push("\n=== NOISE TYPES ===\n" + res.stdout.join('\n'));

            res = await exec({ commands: ["convert", "-list", "filter"] });
            results.push("\n=== INTERPOLATION FILTERS ===\n" + res.stdout.join('\n'));

            workerScope.postMessage({ type: 'AUDIT_DONE', id, result: results.join('\n') } satisfies WorkerResponse);
        }
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        workerScope.postMessage({ type: 'ERROR', id, error: errorMsg } satisfies WorkerResponse);
    }
};
