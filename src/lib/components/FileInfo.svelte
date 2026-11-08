<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { RawImageData } from "$lib/utils/image";
    import { status, isProcessing, effectStack } from "$lib/stores/appStore";

    export let hasImage = false;
    export let rawImage: RawImageData | null = null;
    export let filename: string | null = null;

    const dispatch = createEventDispatcher<{
        audit: void;
        clear: void;
    }>();

    function formatBytes(bytes: number) {
        if (!+bytes) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    }

    // RGBA = 4 bytes per pixel
    $: rawSize = rawImage ? rawImage.width * rawImage.height * 4 : 0;
    $: loaded = hasImage && !!rawImage;

    // Engine metrics
    $: ritualDepth = $effectStack.length;
    $: complexity = $effectStack.reduce((sum, e) => sum + e.effects.length, 0);
    $: engineLoad = Math.min(100, (complexity / 20) * 100);
</script>

<div class="pane">
    <div class="section-head">
        <span class="seal" class:bone={loaded}></span>
        <span class="rubric-label">image</span>
        {#if !loaded}<span class="state">empty</span>{/if}
    </div>

    <dl class="ledger">
        <dt>name</dt>
        <dd class:muted={!loaded} title={filename ?? ""}>
            {filename || (loaded ? "unknown" : "—")}
        </dd>

        <dt>dimensions</dt>
        <dd class:muted={!loaded}>
            {rawImage ? `${rawImage.width} × ${rawImage.height}` : "—"}
        </dd>

        <dt>raw size</dt>
        <dd class:muted={!loaded}>{rawImage ? formatBytes(rawSize) : "—"}</dd>

        <dt>aspect</dt>
        <dd class:muted={!loaded}>
            {rawImage ? (rawImage.width / rawImage.height).toFixed(3) : "—"}
        </dd>
    </dl>

    {#if loaded}
        <div class="pane-actions">
            <button
                class="btn-sm btn-rubric"
                on:click={() => dispatch("clear")}
                title="Unload the image"
            >
                Eject vessel
            </button>
        </div>
    {/if}
</div>

<div class="pane">
    <div class="section-head">
        <span class="seal" class:live={$isProcessing} class:bone={!$isProcessing}></span>
        <span class="rubric-label">engine</span>
        <span class="state" class:working={$isProcessing}>
            {$isProcessing ? "working" : $status}
        </span>
        <button
            class="link-btn"
            on:click={() => window.location.reload()}
            title="Reload the page and restart the engine"
        >reboot</button>
    </div>

    <dl class="ledger">
        <dt>ritual depth</dt>
        <dd>{ritualDepth}</dd>

        <dt>load</dt>
        <dd class="meter-cell">
            <div class="meter"><i style="width: {engineLoad}%"></i></div>
        </dd>
    </dl>
</div>

<style>
    .meter-cell {
        display: flex;
        align-items: center;
        padding-left: 2rem;
    }

    .meter-cell .meter {
        flex: 1;
    }

    .working {
        color: var(--rubric-hi);
        animation: breathe 1.2s var(--ease) infinite;
    }

    @keyframes breathe {
        50% {
            opacity: 0.45;
        }
    }
</style>
