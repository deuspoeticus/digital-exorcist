/**
 * Utility functions for client-side image processing
 */

const MAX_DIMENSION = 3840; // 4K cap

export interface RawImageData {
    width: number;
    height: number;
    data: Uint8Array;
}

/**
 * Processes an input file to raw RGBA pixel data
 * Caps resolution at maxDimension
 * Uses createImageBitmap for efficient decoding and resizing
 */
export async function processImageToRaw(file: File, maxDimension = 3840, retroMode = false): Promise<RawImageData> {
    // 1. Get original dimensions efficiently
    let bmp: ImageBitmap;
    try {
        bmp = await createImageBitmap(file);
    } catch (e) {
        throw new Error('Failed to decode image');
    }

    let { width, height } = bmp;

    // 2. Calculate target dimensions
    if (width > maxDimension || height > maxDimension) {
        if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
        } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
        }
    }

    // 3. Create context (Offscreen if available)
    let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
    const canvas = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(width, height)
        : document.createElement('canvas');

    // Handle fallback for element canvas
    if (canvas instanceof HTMLCanvasElement) {
        canvas.width = width;
        canvas.height = height;
    }

    ctx = canvas.getContext('2d') as any;

    if (!ctx) {
        bmp.close();
        throw new Error('Could not get canvas context');
    }

    // 4. Draw/Resize
    ctx.imageSmoothingEnabled = !retroMode;
    ctx.imageSmoothingQuality = retroMode ? 'low' : 'high';
    ctx.drawImage(bmp, 0, 0, width, height);
    bmp.close(); // Release original bitmap memory

    // 5. Extract Raw Bytes
    try {
        const imageData = ctx.getImageData(0, 0, width, height);
        // Convert Uint8ClampedArray to Uint8Array for WASM compatibility
        const data = new Uint8Array(imageData.data.buffer);

        return {
            width,
            height,
            data
        };
    } catch (err) {
        throw new Error('Failed to extract image data: ' + err);
    }
}
