<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { RawImageData } from "$lib/utils/image";
    import {
        status,
        isProcessing,
        aiStatus,
        effectStack,
    } from "$lib/stores/appStore";
    import { gemini } from "$lib/ai/gemini";
    import { auditStore } from "$lib/stores/auditStore";

    export let hasImage = false;
    export let rawImage: RawImageData | null = null;
    export let filename: string | null = null;

    const dispatch = createEventDispatcher<{
        audit: void;
        clear: void;
    }>();

    function formatBytes(bytes: number, decimals = 2) {
        if (!+bytes) return "0 Bytes";
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    // Estimate raw size (RGBA = 4 bytes per pixel)
    $: rawSize = rawImage ? rawImage.width * rawImage.height * 4 : 0;

    // WASM Engine Metrics
    $: ritualDepth = $effectStack.length;

    $: complexityScore = $effectStack.reduce(
        (sum, e) => sum + e.effects.length,
        0,
    );
    $: engineLoad = Math.min(100, (complexityScore / 20) * 100);
</script>

<div class="file-info-content">
    <div class="info-content">
        <div class="section ai-section">
            <div class="ai-header">
                <span class="indicator" class:online={hasImage && rawImage}
                ></span>
                <h3>VOXEL DATA</h3>
            </div>

            <div class="data-grid">
                <div class="label">FILENAME</div>
                <div class="value">
                    {filename || (hasImage ? "UNKNOWN" : "---")}
                </div>

                <div class="label">DIMENSIONS</div>
                <div class="value">
                    {rawImage
                        ? `${rawImage.width} x ${rawImage.height}`
                        : "---"}
                </div>

                <div class="label">CHANNELS</div>
                <div class="value">{hasImage ? "RGBA (8-bit)" : "---"}</div>

                <div class="label">RAW SIZE</div>
                <div class="value">
                    {rawImage ? formatBytes(rawSize) : "---"}
                </div>

                <div class="label">ASPECT</div>
                <div class="value">
                    {rawImage
                        ? (rawImage.width / rawImage.height).toFixed(3)
                        : "---"}
                </div>
            </div>

            {#if hasImage && rawImage}
                <div class="actions">
                    <button
                        class="action-btn clear-btn-styled"
                        on:click={() => dispatch("clear")}
                        title="Clear Image"
                    >
                        EJECT VESSEL
                    </button>
                </div>
            {/if}
        </div>

        <div class="spacer"></div>

        <div class="spacer"></div>

        <div class="section ai-section">
            <div class="ai-header">
                <span
                    class="indicator"
                    class:online={$status === "Ready" || $status === "Done!"}
                    class:processing={$isProcessing}
                ></span>
                <h3>WASM ENGINE</h3>
            </div>

            <div class="ai-grid">
                <div class="ai-label">STATUS</div>
                <div class="ai-value" class:blink={$isProcessing}>
                    {$status}
                </div>

                <div class="ai-label">WORKER</div>
                <div class="ai-value">{$isProcessing ? "BUSY" : "IDLE"}</div>

                <div class="separator-line"></div>

                <div class="ai-label">RITUAL DEPTH</div>
                <div class="ai-value">{ritualDepth}</div>

                <div class="ai-label">ENGINE LOAD</div>
                <div class="usage-container">
                    <div class="bar-bg">
                        <div
                            class="bar-fill heat"
                            style="width: {engineLoad}%"
                        ></div>
                    </div>
                </div>
            </div>

            <div class="actions">
                <button
                    class="action-btn"
                    on:click={() => window.location.reload()}
                >
                    REBOOT
                </button>
            </div>
        </div>

        <div class="section ai-section">
            <div class="ai-header">
                <span
                    class="indicator"
                    class:online={$aiStatus === "ready" ||
                        $aiStatus === "cloud"}
                ></span>
                <h3>NEURAL LINK</h3>
            </div>

            <div class="ai-grid">
                <div class="ai-label">MODEL</div>
                <div class="ai-value">
                    {$aiStatus === "cloud" ? "GEMINI FLASH" : "GEMINI NANO"}
                </div>

                <div class="ai-label">STATUS</div>
                <div
                    class="ai-value"
                    class:blink={$aiStatus === "initializing" ||
                        $aiStatus === "downloading"}
                >
                    {$aiStatus.toUpperCase()}
                </div>

                <div class="ai-label">UPLINK</div>
                <div class="ai-value">
                    {$aiStatus === "cloud" ? "CLOUD" : "LOCAL"}
                </div>

                <div class="separator-line"></div>

                <div class="ai-label">INPUT TOKENS</div>
                <div class="ai-value">
                    {$auditStore.inputTokens.toLocaleString()}
                </div>

                <div class="ai-label">OUTPUT TOKENS</div>
                <div class="ai-value">
                    {$auditStore.outputTokens.toLocaleString()}
                </div>

                <div class="ai-label">CONTEXT</div>
                <div class="usage-container">
                    <div class="bar-bg">
                        <div
                            class="bar-fill"
                            style="width: {Math.min(
                                100,
                                (($auditStore.inputTokens +
                                    $auditStore.outputTokens) /
                                    ($auditStore.maxTokens || 4096)) *
                                    100,
                            )}%"
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .file-info-content {
        width: 100%;
        display: flex;
        flex-direction: column;
    }

    .info-content {
        padding: 1rem;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        height: 100%;
        /* Default width if not constrained by parent, but parent DraggableWindow handles it */
        min-width: 15.625rem;
    }

    .section {
        margin-bottom: 2rem;
    }

    .spacer {
        flex: 1;
    }

    .ai-section {
        background: var(--bg-glass);
        border: var(--glass-border);
        padding: 0.8rem;
        border-radius: 0;
        margin-bottom: 1rem;
        backdrop-filter: blur(0.5rem);
    }

    .ai-section:last-child {
        margin-bottom: 0;
    }

    .ai-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.8rem;
        border-bottom: var(--glass-border);
        padding-bottom: 0.5rem;
        position: relative;
    }

    .indicator {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
        background: color-mix(in srgb, var(--bg-void), white 10%);
        box-shadow: 0 0 0.3125rem rgba(0, 0, 0, 0.5);
    }

    .indicator.online {
        background: var(--color-cyan);
        box-shadow: 0 0 0.5rem var(--color-cyan);
    }

    .indicator.processing {
        background: var(--color-magenta);
        box-shadow: 0 0 0.5rem var(--color-magenta);
        animation: pulse 0.5s infinite;
    }

    h3 {
        margin: 0;
        font-family: var(--font-mono); /* Force Mono for density */
        font-weight: 900;
        font-size: 0.75rem;
        color: var(--text-bright);
        letter-spacing: 0.0625rem;
        white-space: nowrap;
        text-transform: uppercase;
    }

    .data-grid {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 0.5rem 1rem;
        font-family: var(--font-mono);
        font-size: 0.7rem;
        align-items: baseline;
    }

    .ai-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 0.4rem 1rem;
        font-family: var(--font-mono);
        font-size: 0.7rem;
        align-items: center;
    }

    .separator-line {
        grid-column: 1 / -1;
        height: 0.0625rem;
        background: var(--glass-border);
        margin: 0.4rem 0;
        opacity: 0.5;
    }

    .usage-container {
        display: flex;
        align-items: center;
        width: 100%;
    }

    .bar-bg {
        flex: 1;
        height: 0.375rem;
        background: rgba(255, 255, 255, 0.05);
        border: 0.0625rem solid rgba(255, 255, 255, 0.1);
        position: relative;
        overflow: hidden;
    }

    .bar-fill {
        height: 100%;
        background: var(--color-magenta);
        box-shadow: 0 0 0.5rem var(--color-magenta);
        transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .bar-fill.heat {
        background: var(--color-cyan);
        box-shadow: 0 0 0.625rem var(--color-cyan);
    }

    .label {
        color: var(--color-cyan);
        opacity: 0.6;
        letter-spacing: -0.02em;
        white-space: nowrap;
    }

    .ai-label {
        color: var(--color-cyan);
        opacity: 0.6;
        letter-spacing: -0.02em;
    }

    .value {
        color: var(--text-bright);
        text-align: right;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-variant-numeric: tabular-nums;
        max-width: 100%;
    }

    .ai-value {
        color: var(--text-bright);
        text-align: right;
        font-weight: 700;
        letter-spacing: -0.05em;
    }

    @keyframes pulse {
        0%,
        100% {
            opacity: 0.4;
        }
        50% {
            opacity: 0.8;
        }
    }

    .actions {
        margin-top: 1rem;
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
    }

    .action-btn {
        background: var(--bg-glass);
        border: var(--glass-border);
        color: var(--text-dim);
        font-family: var(--font-mono);
        font-weight: 700;
        font-size: 0.65rem;
        padding: 0.25rem 0.75rem;
        cursor: pointer;
        transition: all 0.2s;
        text-transform: uppercase;
    }

    .action-btn:hover {
        border-color: var(--color-cyan);
        color: var(--color-cyan);
        background: var(--bg-panel-hover);
        box-shadow: var(--aberration-glow);
    }

    .clear-btn-styled {
        background: color-mix(in srgb, var(--color-magenta), transparent 90%);
        border: 0.0625rem solid
            color-mix(in srgb, var(--color-magenta), transparent 80%);
        color: var(--color-magenta);
        opacity: 0.8;
    }

    .clear-btn-styled:hover {
        background: var(--color-magenta) !important;
        color: var(--bg-void) !important;
        border-color: var(--color-magenta) !important;
        box-shadow: 0 0 0.625rem var(--color-magenta) !important;
        opacity: 1;
    }

    .blink {
        animation: pulse 1s infinite;
        color: var(--color-magenta);
    }
</style>
