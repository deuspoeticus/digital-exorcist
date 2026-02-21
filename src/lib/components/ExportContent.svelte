<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { isProcessing, currentRawImage } from "$lib/stores/appStore";

    const dispatch = createEventDispatcher<{
        export: void;
    }>();

    function triggerExport() {
        dispatch("export");
    }
</script>

<div class="export-container">
    <div class="export-status">
        <span class="label">FORMAT</span>
        <span class="value">JPG / HIGH-RES</span>
    </div>

    <button
        class="export-trigger"
        on:click={triggerExport}
        disabled={$isProcessing || !$currentRawImage}
    >
        {#if $isProcessing}
            EXTRACTING...
        {:else}
            EXTRACT RITUAL
        {/if}
    </button>
</div>

<style>
    .export-container {
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .export-status {
        display: flex;
        justify-content: space-between;
        font-family: var(--font-mono);
        font-size: 0.7rem;
        padding: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .label {
        color: var(--text-dim);
    }

    .value {
        color: var(--color-cyan);
        font-weight: bold;
    }

    .export-trigger {
        width: 100%;
        padding: 1rem;
        background: var(--bg-glass);
        border: 1px solid var(--color-magenta);
        color: var(--color-magenta);
        font-family: var(--font-pixel);
        font-size: 0.9rem;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.1rem;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 0 10px rgba(255, 0, 255, 0.1);
        position: relative;
        overflow: hidden;
    }

    .export-trigger:hover:not(:disabled) {
        background: var(--color-magenta);
        color: var(--bg-void);
        box-shadow: 0 0 20px rgba(255, 0, 255, 0.4);
    }

    .export-trigger:active:not(:disabled) {
        transform: scale(0.98);
    }

    .export-trigger:disabled {
        opacity: 0.3;
        cursor: not-allowed;
        border-color: var(--text-dim);
        color: var(--text-dim);
        box-shadow: none;
    }

    /* Glitch line on hover */
    .export-trigger:hover::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background: #fff;
        animation: scanline 1s linear infinite;
    }

    @keyframes scanline {
        0% {
            transform: translateY(-10px);
        }
        100% {
            transform: translateY(60px);
        }
    }
</style>
