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

<div class="pane">
    <dl class="ledger">
        <dt>format</dt>
        <dd>JPEG · q90</dd>
    </dl>

    <button
        class="export-trigger btn-emboss"
        on:click={triggerExport}
        disabled={$isProcessing || !$currentRawImage}
    >
        {$isProcessing ? "Extracting…" : "Extract ritual"}
    </button>
</div>

<style>
    .export-trigger {
        width: 100%;
        margin-top: 0.875rem;
        padding: 0.75rem;
        font-size: var(--text-sm);
    }
</style>
