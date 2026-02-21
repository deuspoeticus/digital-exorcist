<script lang="ts">
    import { status, isProcessing, isAiReady } from "$lib/stores/appStore";
    import { gemini } from "$lib/ai/gemini";
</script>

<div class="status-overlay">
    <strong>✦ WASM ENGINE</strong><br />
    Worker: {$status}<br />
    AI: {gemini.status}<br />
    Processing: {$isProcessing}<br />
    <button on:click={() => window.location.reload()}>RELOAD</button>
</div>

<style>
    .status-overlay {
        position: fixed;
        top: 0;
        left: 0;
        background: rgba(0, 40, 0, 0.8);
        color: #0f0;
        padding: 0.625rem;
        z-index: 9999;
        font-size: 0.75rem;
        pointer-events: auto;
        font-family: var(--font-mono);
        border-bottom-right-radius: 0.5rem;
        border: 0.0625rem solid #0f0;
        border-top: none;
        border-left: none;
    }

    button {
        pointer-events: auto;
        background: #0f0;
        color: black;
        border: none;
        padding: 0.25rem 0.5rem;
        margin-top: 0.25rem;
        cursor: pointer;
    }
</style>
