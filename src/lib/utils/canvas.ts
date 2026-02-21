import type { RawImageData } from './image';

/**
 * Draws a RawImageData object onto an HTML Canvas element.
 * 
 * @param canvas The target HTMLCanvasElement to draw the image onto.
 * @param rawData The parsed RGB/RGBA data and dimensions.
 */
export function drawToCanvas(canvas: HTMLCanvasElement | null, rawData: RawImageData | null) {
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
