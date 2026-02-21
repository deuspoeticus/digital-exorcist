/**
 * MagickBridge — typed wrapper around the ImageMagick Web Worker.
 *
 * Encapsulates postMessage/onmessage, pending-command queue,
 * and worker lifecycle management.
 */
import type { RawImageData } from '$lib/utils/image';
import type { WorkerMessage, WorkerResponse } from './magick.worker';
import { auditStore } from '$lib/stores/auditStore';

export type DoneResult = { bitmap: ImageBitmap; width: number; height: number };
export type ExportResult = { blob: Blob };
export type AuditResult = { result: string };

export interface BridgeCallbacks {
    onDone: (result: DoneResult, elapsedMs: number) => void;
    onExportDone: (result: ExportResult) => void;
    onAuditDone: (result: AuditResult) => void;
    onError: (error: string) => void;
}

export class MagickBridge {
    private worker: Worker | null = null;
    private callbacks: BridgeCallbacks;
    private _id = 0;
    private _startTime = 0;
    private _processing = false;
    private _pendingCommand: string | null = null;
    private _pendingImage: RawImageData | null = null;
    private _runRitual: ((command: string) => void) | null = null;

    constructor(callbacks: BridgeCallbacks) {
        this.callbacks = callbacks;
    }

    get isProcessing() { return this._processing; }
    set isProcessing(v: boolean) { this._processing = v; }

    /** Set the external runRitual callback for pending command flushing */
    setRunRitual(fn: (command: string) => void) {
        this._runRitual = fn;
    }

    /** Initialize the worker */
    create() {
        this.worker = new Worker(
            new URL('$lib/workers/magick.worker.ts', import.meta.url),
            { type: 'module' }
        );

        this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
            const { type, id } = e.data;

            if (type === 'DONE') {
                const { bitmap, width, height } = e.data;
                const elapsed = Math.round(performance.now() - this._startTime);

                // Update Audit Store with latency and memory
                auditStore.update(s => ({
                    ...s,
                    latency: elapsed,
                    // @ts-ignore - memory is a Chrome/Edge specific API
                    memoryUsage: (performance.memory?.usedJSHeapSize || 0) / (1024 * 1024)
                }));

                this.callbacks.onDone({ bitmap, width, height }, elapsed);
                this._processing = false;
            } else if (type === 'EXPORT_DONE') {
                const { blob } = e.data;
                this.callbacks.onExportDone({ blob });
                this._processing = false;
            } else if (type === 'AUDIT_DONE') {
                const { result } = e.data;
                this.callbacks.onAuditDone({ result });
                this._processing = false;
            } else if (type === 'ERROR') {
                const { error } = e.data;
                this.callbacks.onError(error);
                this._processing = false;
            }

            // Flush pending command
            if (this._pendingCommand && this._runRitual) {
                const next = this._pendingCommand;
                this._pendingCommand = null;
                this._runRitual(next);
            }
        };
    }

    /** Send a PROCESS message to the worker */
    process(command: string, image: RawImageData) {
        if (this._processing) {
            this._pendingCommand = command;
            this._pendingImage = image;
            return;
        }
        this._processing = true;
        this._startTime = performance.now();
        this._id++;

        const msg: WorkerMessage = {
            type: 'PROCESS',
            id: this._id,
            command,
            image,
        };
        this.worker?.postMessage(msg);
    }

    /** Send an EXPORT message to the worker */
    export(command: string, image: RawImageData) {
        if (this._processing) return;
        this._processing = true;
        this._id++;

        const msg: WorkerMessage = {
            type: 'EXPORT',
            id: this._id,
            command,
            image,
        };
        this.worker?.postMessage(msg);
    }

    /** Send an AUDIT message to the worker */
    audit() {
        if (this._processing) return;
        this._processing = true;
        this._id++;

        const msg: WorkerMessage = {
            type: 'AUDIT',
            id: this._id,
        };
        this.worker?.postMessage(msg);
    }

    /** Terminate the worker */
    terminate() {
        this.worker?.terminate();
        this.worker = null;
    }
}
