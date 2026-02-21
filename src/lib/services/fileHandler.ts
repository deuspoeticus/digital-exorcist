import { processImageToRaw, type RawImageData } from '$lib/utils/image';
import { imageUrl, currentRawImage, clearStack, addLog } from '$lib/stores/appStore';

export class FileService {
    /**
     * Handle a file selection event (input change or drop).
     * Updates stores and logs progress.
     */
    async loadFile(file: File): Promise<void> {
        // Revoke previous blob URL
        let oldUrl: string | null = null;
        imageUrl.update((url: string | null) => {
            oldUrl = url;
            return URL.createObjectURL(file); // Update immediately
        });

        if (oldUrl && (oldUrl as string).startsWith('blob:')) {
            URL.revokeObjectURL(oldUrl);
        }

        clearStack();

        addLog(
            `[System] Image loaded: ${file.name} (${(file.size / 1024).toFixed(0)}KB)`,
            '[System] Extracting raw data...'
        );

        try {
            const rawData = await processImageToRaw(file, 1280, true);
            currentRawImage.set(rawData);
            addLog(`[System] Raw Extraction: ${rawData.width}x${rawData.height}`);
        } catch (err) {
            console.error('Extraction failed', err);
            addLog('[Error] Raw extraction failed.');
            throw err;
        }
    }

    /**
     * Draw the current raw image to a canvas (for "Show Original").
     */
    drawToCanvas(canvas: HTMLCanvasElement, rawData: RawImageData) {
        if (!canvas || !rawData) return;

        canvas.width = rawData.width;
        canvas.height = rawData.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const clamped = new Uint8ClampedArray(rawData.data);
            const imageData = new ImageData(
                clamped,
                rawData.width,
                rawData.height
            );
            ctx.putImageData(imageData, 0, 0);
        }
    }

    /**
     * Clear all file state.
     */
    clear() {
        imageUrl.set(null);
        currentRawImage.set(null);
        clearStack();
    }
}

export const fileHandler = new FileService();
